import EventEmitter from "events";

const shouldSend = (data, assetId, visitorId) => {
  return data.assetId === assetId && (data.visitorId === undefined || data.visitorId !== visitorId);
};

const emitterObj = {
  emitter: new EventEmitter(),
  connections: [],
  emitFunc: function (event: string, data: any) {
    this.emitter.emit(event, data);
  },
  addConn: function (connection) {
    const { visitorId, interactiveNonce } = connection.res.req.body;

    if (
      this.connections.some(
        ({ res: existingConnection }) =>
          existingConnection.req.body.interactiveNonce === interactiveNonce &&
          existingConnection.req.body.visitorId === visitorId,
      )
    ) {
      // Replace old connection with new one
      this.connections.splice(
        this.connections.findIndex(
          ({ res: existingConnection }) =>
            existingConnection.req.body.interactiveNonce === interactiveNonce &&
            existingConnection.req.body.visitorId === visitorId,
        ),
        1,
        connection,
      );
    } else {
      this.connections.push(connection);
    }
  },
  deleteConn: function () {
    // Remove inactive connections older than 1 hour
    this.connections = this.connections.filter(
      ({ lastHeartbeatTime }) => lastHeartbeatTime > Date.now() - 30 * 60 * 1000,
    );
  },
};

emitterObj.listenNowPlaying = emitterObj.emitter.on("nowPlaying", (data) => {
  emitterObj.connections.forEach(({ res: existingConnection }) => {
    const { assetId, visitorId } = existingConnection.req.body;
    if (shouldSend(data, assetId, visitorId)) {
      const dataToSend = !data.visitorId
        ? { data: { currentPlayIndex: data.currentPlayIndex } }
        : { data: { video: data.video } };
      dataToSend.kind = "nowPlaying";
      existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataToSend)}\n\n`);
    }
  });
});

emitterObj.listenQueue = emitterObj.emitter.on("addedToQueue", (data) => {
  emitterObj.connections.forEach(({ res: existingConnection }) => {
    const { assetId, visitorId } = existingConnection.req.body;
    if (shouldSend(data, assetId, visitorId)) {
      const dataWithKind = { videos: data.videos, kind: "addedToQueue" };
      existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataWithKind)}\n\n`);
    }
  });
});

setInterval(() => {
  if (emitterObj.connections.length > 0) {
    emitterObj.deleteConn();
  }
}, 1000 * 60);

export default emitterObj;
