
import * as redis from "redis";
import { Response } from "express";
import { getCredentials } from "../utils/index.js";

const RAPID_RETRY_MAX = 10;
const RAPID_ERROR_THRESHOLD = 5000;

let pubRapidErrorCount = 0;
let pubReconnectionAttempt = 0;
let pubLastReconnectAttemptTime = null;
let pubLastConnectionTime = null;

let subRapidErrorCount = 0;
let subReconnectionAttempt = 0;
let subLastReconnectAttemptTime = null;
let subLastConnectionTime = null;

const getRedisHealth = (name) => {
  const currentTime = new Date().getTime();
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

const handleRedisConnection = (client, name) => {
  const { reconnectCount, currentTime, status } = getRedisHealth(name);
  const info = reconnectCount ? `status: ${status}, reconnectCount: ${reconnectCount}` : `status: ${status}`;
  console.log(`Redis connected - ${name} server, on process: ${process.pid}`, info);
  if (name === "pub") pubLastConnectionTime = currentTime;
  if (name === "sub") subLastConnectionTime = currentTime;
  client.health = getRedisHealth(name);
};

const handleRedisReconnection = (name) => {
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

const handleRedisError = (name, error) => {
  const { reconnectCount, rapidReconnectCount, status, timeSinceLastReconnectAttempt } = getRedisHealth(name);
  const info = reconnectCount
    ? `status: ${status}, reconnectCount: ${reconnectCount}, rapidReconnectCount: ${rapidReconnectCount} timeSinceLastReconnectAttempt: ${timeSinceLastReconnectAttempt}`
    : `status: ${status}`;
  console.error(`Redis error - ${name} server, on process: ${process.pid}, ${info}`);
  console.error(`Redis error details - ${error}`);
};

function getRedisClient(url = process.env.REDIS_URL) {
  let isClusterMode = false;
  if (typeof process.env.REDIS_CLUSTER_MODE === "undefined") {
    console.log("[Redis] Environment variable REDIS_CLUSTER_MODE is not set. Defaulting to false.");
  } else {
    isClusterMode = process.env.REDIS_CLUSTER_MODE === "true";
  }
  const safeUrl = url || "";
  const parsedUrl = new URL(safeUrl);
  const host = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port) : 6379;
  const username = parsedUrl.username || "default";
  const password = parsedUrl.password || "";
  const tls = safeUrl.startsWith("rediss");

  if (!isClusterMode) {
    return redis.createClient({
      socket: {
        host,
        port,
        tls,
      },
      username,
      password,
      url: safeUrl,
    });
  }
  return redis.createCluster({
    useReplicas: true,
    rootNodes: [
      {
        url: safeUrl,
        socket: {
          tls,
        },
      },
    ],
    defaults: {
      username,
      password,
    },
  });
}

export const redisClient = getRedisClient();
redisClient.on("connect", () => {
  handleRedisConnection(redisClient, "pub");
});
redisClient.on("reconnecting", () => {
  handleRedisReconnection("pub");
});
redisClient.on("error", (error) => {
  handleRedisError("pub", error);
});

export const redisSubClient = getRedisClient();
redisSubClient.on("connect", () => {
  handleRedisConnection(redisSubClient, "sub");
});
redisSubClient.on("reconnecting", () => {
  handleRedisReconnection("sub");
});
redisSubClient.on("error", (error) => {
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
  publisher: redisClient,
  subscriber: redisSubClient,
  connections: [],
  publish: function (channel, message) {
    if (process.env.NODE_ENV === "development") console.log(`Publishing ${message.event} to ${channel}`);
    this.publisher.publish(channel, JSON.stringify(message));
  },
  subscribe: function (channel: string) {
    this.subscriber.subscribe(channel, (message) => {
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
  },
  addConn: function (connection) {
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
};

redisObj.publisher.connect();
redisObj.subscriber.connect();

redisObj.subscribe(`${process.env.INTERACTIVE_KEY}_JUKEBOX`);

redisObj.publisher.on("error", (err) => console.error("Publisher Error", err));
redisObj.subscriber.on("error", (err) => console.error("Subscriber Error", err));

setInterval(() => {
  if (redisObj.connections.length > 0) {
    redisObj.deleteConn();
  }
}, 1000 * 60);

export default redisObj;
