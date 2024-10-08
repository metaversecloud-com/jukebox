import { createClient } from "redis";

const shouldSendEvent = (
  data: { assetId: string; visitorId: string | undefined; interactiveNonce: string | undefined },
  assetId: string,
  visitorId: string,
  interactiveNonce: string,
) => {
  return (
    data.assetId === assetId &&
    (data.visitorId === undefined || data.visitorId !== visitorId) &&
    (data.interactiveNonce === undefined || data.interactiveNonce !== interactiveNonce)
  );
};

const connectionOpt = {
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.REDIS_URL!.startsWith("rediss"),
  },
};

const redisObj = {
  publisher: createClient(connectionOpt),
  subscriber: createClient(connectionOpt),
  publish: function (channel: string, message: any) {
    console.log(`Publishing ${message.event} to ${channel}`);
    this.publisher.publish(channel, JSON.stringify(message));
  },
  subscribe: function (channel: string) {
    this.subscriber.subscribe(channel, (message) => {
      const data = JSON.parse(message);
      console.log(`Event '${data.event}' received on ${channel}`);
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
  connections: [],
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
    console.log(`Connection ${interactiveNonce} added. Length is ${this.connections.length}`);
  },
  deleteConn: function () {
    // Remove inactive connections older than 30 minutes
    this.connections = this.connections.filter(({ res, lastHeartbeatTime }) => {
      const isActive = lastHeartbeatTime > Date.now() - 15 * 60 * 1000;
      if (!isActive) {
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
