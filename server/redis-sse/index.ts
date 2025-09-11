
import * as redis from "redis";
import { Response } from "express";
import { getCredentials } from "../utils/index.js";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// Health/retry config
const RAPID_RETRY_MAX = 10;
const RAPID_ERROR_THRESHOLD = 5000; // ms

// Publisher health state
let pubRapidErrorCount = 0;
let pubReconnectionAttempt = 0;
let pubLastReconnectAttemptTime: number | null = null;
let pubLastConnectionTime: number | null = null;

// Subscriber health state
let subRapidErrorCount = 0;
let subReconnectionAttempt = 0;
let subLastReconnectAttemptTime: number | null = null;
let subLastConnectionTime: number | null = null;

const getRedisHealth = (name: string) => {
  const currentTime = Date.now();
  const lastConnectionTime = name === "pub" ? pubLastConnectionTime : subLastConnectionTime;
  const lastReconnectAttemptTime = name === "pub" ? pubLastReconnectAttemptTime : subLastReconnectAttemptTime;
  const rapidReconnectCount = name === "pub" ? pubRapidErrorCount : subRapidErrorCount;
  const reconnectCount = name === "pub" ? pubReconnectionAttempt : subReconnectionAttempt;
  const status = rapidReconnectCount < RAPID_RETRY_MAX ? "OK" : "UNHEALTHY";
  const timeSinceLastReconnectAttempt = lastReconnectAttemptTime ? currentTime - lastReconnectAttemptTime : null;

  return {
    status,
    currentTime,
    lastConnectionTime,
    rapidReconnectCount,
    reconnectCount,
    timeSinceLastReconnectAttempt,
  };
};

const handleRedisConnection = (client: any, name: string) => {
  const { reconnectCount, currentTime, status } = getRedisHealth(name);
  const info = reconnectCount ? `status: ${status}, reconnectCount: ${reconnectCount}` : `status: ${status}`;
  console.log(`Redis connected - ${name} server, on process: ${process.pid}`, info);

  if (name === "pub") pubLastConnectionTime = currentTime;
  if (name === "sub") subLastConnectionTime = currentTime;

  client.health = getRedisHealth(name);
};

const handleRedisReconnection = (name: string) => {
  const { currentTime, timeSinceLastReconnectAttempt } = getRedisHealth(name);

  if (name === "pub") {
    pubLastReconnectAttemptTime = currentTime;
    pubReconnectionAttempt++;
    if (timeSinceLastReconnectAttempt && timeSinceLastReconnectAttempt < RAPID_ERROR_THRESHOLD) {
      pubRapidErrorCount++;
    }
  }

  if (name === "sub") {
    subLastReconnectAttemptTime = currentTime;
    subReconnectionAttempt++;
    if (timeSinceLastReconnectAttempt && timeSinceLastReconnectAttempt < RAPID_ERROR_THRESHOLD) {
      subRapidErrorCount++;
    }
  }
};

const handleRedisError = (name: string, error: any) => {
  const { reconnectCount, rapidReconnectCount, status, timeSinceLastReconnectAttempt } = getRedisHealth(name);
  const info = reconnectCount
    ? `status: ${status}, reconnectCount: ${reconnectCount}, rapidReconnectCount: ${rapidReconnectCount} timeSinceLastReconnectAttempt: ${timeSinceLastReconnectAttempt}`
    : `status: ${status}`;
  console.error(`Redis error - ${name} server, on process: ${process.pid}, ${info}`);
  console.error(`Redis error details - ${error}`);
};

function getRedisClient(url = process.env.REDIS_URL): redis.RedisClientType & any {
  let isClusterMode = false;
  if (typeof process.env.REDIS_CLUSTER_MODE === "undefined") {
    console.log("[Redis] Environment variable REDIS_CLUSTER_MODE is not set. Defaulting to false.");
  } else {
    isClusterMode = process.env.REDIS_CLUSTER_MODE === "true";
  }

  console.log(`[Redis] Creating Redis client - Cluster mode: ${isClusterMode}`);

  const safeUrl = url || "";
  console.log(`[Redis] Raw URL protocol: ${safeUrl.split('://')[0]}://`); // Log protocol specifically
  console.log(`[Redis] URL starts with rediss://: ${safeUrl.startsWith("rediss://")}`);
  const parsedUrl = new URL(safeUrl);
  const host = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port) : 6379;
  const username = parsedUrl.username || "default";
  const password = parsedUrl.password || "";
  const tls = safeUrl.startsWith("rediss://");

  console.log(`[Redis] Connection details - Host: ${host}, Port: ${port}, TLS: ${tls}, Username: ${username}`);

  if (!isClusterMode) {
    console.log("[Redis] Creating standalone Redis client");
    const clientConfig: any = {
      socket: { 
        host, 
        port, 
        tls: tls ? {
          // AWS ElastiCache specific TLS options
          servername: host,
          checkServerIdentity: () => undefined, // Disable hostname verification for ElastiCache
        } : false,
        connectTimeout: 10000,
        lazyConnect: false
      },
      username,
      password,
      url: safeUrl,
    };
    console.log(`[Redis] Client config TLS enabled: ${!!clientConfig.socket.tls}`);
    console.log(`[Redis] TLS servername: ${clientConfig.socket.tls ? (clientConfig.socket.tls as any).servername : 'N/A'}`);
    return redis.createClient(clientConfig);
  }

  console.log("[Redis] Creating Redis cluster client");
  return redis.createCluster({
    useReplicas: true,
    rootNodes: [
      {
        url: safeUrl,
        socket: { 
          tls: tls ? {
            servername: host,
            checkServerIdentity: () => undefined,
          } : false,
          connectTimeout: 10000
        } as any,
      },
    ],
    defaults: { username, password },
  });
}

export const redisClient = getRedisClient();

redisClient.on("connect", () => {
  handleRedisConnection(redisClient, "pub");
});

redisClient.on("reconnecting", () => {
  handleRedisReconnection("pub");
});

redisClient.on("error", (error: any) => {
  handleRedisError("pub", error);
});

export const redisSubClient = getRedisClient();

redisSubClient.on("connect", () => {
  handleRedisConnection(redisSubClient, "sub");
});

redisSubClient.on("reconnecting", () => {
  handleRedisReconnection("sub");
});

redisSubClient.on("error", (error: any) => {
  handleRedisError("sub", error);
});

const shouldSendEvent = (
  data: { assetId: string; visitorId: string | undefined; interactiveNonce: string | undefined },
  assetId: string,
  visitorId: string,
  interactiveNonce: string,
) => {
  return data.assetId === assetId && data.visitorId !== visitorId && data.interactiveNonce !== interactiveNonce;
};

const redisObj = {
  publisher: getRedisClient(),
  subscriber: getRedisClient(),
  connections: [] as { res: Response; lastHeartbeatTime: number }[],
  publish: function (channel: string, message: any) {
    if (process.env.NODE_ENV === "development") console.log(`Publishing ${message.event} to ${channel}`);
    this.publisher.publish(channel, JSON.stringify(message));
  },
  subscribe: async function (channel: string) {
    try {
      console.log(`[Redis] Attempting to subscribe to channel: ${channel}`);
      await this.subscriber.subscribe(channel, (message: any) => {
        const data = JSON.parse(message);
        if (process.env.NODE_ENV === "development") console.log(`Event '${data.event}' received on ${channel}`);
        let dataToSend: { data?: any; kind?: string } = {};
        if (data.event === "nowPlaying") {
          dataToSend = { data: { videoId: data.videoId, nextUpId: data.nextUpId }, kind: "nowPlaying" };
        } else if (data.event === "mediaAction") {
          dataToSend = { data: { media: data.videos }, kind: data.kind };
        }
        this.connections.forEach(({ res: existingConnection }) => {
          const { assetId, visitorId, interactiveNonce } = existingConnection.req.query;
          if (shouldSendEvent(data, assetId, visitorId, interactiveNonce)) {
            existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataToSend)}\n\n`);
          }
        });
      });
      console.log(`[Redis] Successfully subscribed to channel: ${channel}`);
    } catch (error) {
      console.error(`[Redis] Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  },
  addConn: function (connection: { res: Response; lastHeartbeatTime: number }) {
    const { visitorId, interactiveNonce } = connection.res.req.query;

    if (
      this.connections.some(
        ({ res: existingConnection }) =>
          existingConnection.req.query.interactiveNonce === interactiveNonce &&
          existingConnection.req.query.visitorId === visitorId,
      )
    ) {
      // Replace old connection with new one
      this.connections.splice(
        this.connections.findIndex(
          ({ res: existingConnection }) =>
            existingConnection.req.query.interactiveNonce === interactiveNonce &&
            existingConnection.req.query.visitorId === visitorId,
        ),
        1,
        connection,
      );
    } else {
      this.connections.push(connection);
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`Connection ${interactiveNonce} added. Length is ${this.connections.length}`);
    }
  },
  deleteConn: function () {
    // Remove inactive connections older than 15 minutes
    this.connections = this.connections.filter(({ res, lastHeartbeatTime }) => {
      const isActive = lastHeartbeatTime > Date.now() - 15 * 60 * 1000;
      if (!isActive && process.env.NODE_ENV === "development") {
        console.log(`Connection to ${res.req.query.interactiveNonce} deleted`);
      }
      return isActive;
    });
  },
  get: async function (key: string) {
    return await this.publisher.get(key);
  },
  set: async function (key: string, value: string) {
    await this.publisher.set(key, value);
  },
};

// Wire health handlers
redisObj.publisher.on("connect", () => handleRedisConnection(redisObj.publisher, "pub"));
redisObj.publisher.on("reconnecting", () => handleRedisReconnection("pub"));
redisObj.publisher.on("error", (err: any) => handleRedisError("pub", err));
redisObj.publisher.on("end", () => console.log("[Redis] Publisher connection ended"));
redisObj.publisher.on("ready", () => console.log("[Redis] Publisher is ready"));

redisObj.subscriber.on("connect", () => handleRedisConnection(redisObj.subscriber, "sub"));
redisObj.subscriber.on("reconnecting", () => handleRedisReconnection("sub"));
redisObj.subscriber.on("error", (err: any) => handleRedisError("sub", err));
redisObj.subscriber.on("end", () => console.log("[Redis] Subscriber connection ended"));
redisObj.subscriber.on("ready", () => console.log("[Redis] Subscriber is ready"));

// Initialize connections and subscription with proper sequencing
async function initRedis() {
  try {
    console.log(`[Redis] INTERACTIVE_KEY: ${process.env.INTERACTIVE_KEY}`);
    console.log(`[Redis] REDIS_URL: ${process.env.REDIS_URL ? 'SET' : 'NOT SET'}`);
    console.log(`[Redis] REDIS_CLUSTER_MODE: ${process.env.REDIS_CLUSTER_MODE}`);
    
    console.log("[Redis] Connecting publisher...");
    try {
      await redisObj.publisher.connect();
      console.log("[Redis] Publisher connected successfully");
    } catch (pubError: any) {
      console.error("[Redis] Publisher connection failed:", pubError.message);
      throw pubError;
    }
    
    console.log("[Redis] Connecting subscriber...");
    try {
      await redisObj.subscriber.connect();
      console.log("[Redis] Subscriber connected successfully");
    } catch (subError: any) {
      console.error("[Redis] Subscriber connection failed:", subError.message);
      throw subError;
    }
    
    // Subscribe only after connections are established
    const channelName = `${process.env.INTERACTIVE_KEY}_JUKEBOX`;
    console.log(`[Redis] Subscribing to channel: ${channelName}`);
    try {
      await redisObj.subscribe(channelName);
      console.log("[Redis] Subscription established successfully");
    } catch (subError: any) {
      console.error("[Redis] Subscription failed:", subError.message);
      throw subError;
    }
    
    console.log("[Redis] Redis initialization completed successfully");
  } catch (err: any) {
    console.error("[Redis] Initialization error:", err);
    console.error("[Redis] Error details:", err.message);
    if (err.stack) {
      console.error("[Redis] Stack trace:", err.stack);
    }
    // Don't re-throw to prevent app crash, but log the failure
    console.error("[Redis] Redis will not be available for this session");
  }
}

// Kick off initialization (top-level)
initRedis();

// Periodically prune stale SSE connections
setInterval(() => {
  if (redisObj.connections.length > 0) {
    redisObj.deleteConn();
  }
}, 1000 * 60);

export default redisObj;
