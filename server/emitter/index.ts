import EventEmitter from "events";

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
    console.log("CONNECTION ADDED", this.connections.length);
  },
  deleteConn: function () {
    // Remove inactive connections older than 1 hour
    this.connections = this.connections.filter(
      ({ lastHeartbeatTime }) => lastHeartbeatTime > Date.now() - 30 * 60 * 1000,
    );
  },
};

emitterObj.listenFunc = emitterObj.emitter.on("nowPlaying", (data) => {
  emitterObj.connections.forEach(({ res: existingConnection }) => {
    const { assetId, visitorId, interactiveNonce } = existingConnection.req.body;
    if (
      data.assetId === assetId &&
      (data.vistorId === undefined || data.visitorId !== visitorId) &&
      (data.interactiveNonce === undefined || data.interactiveNonce !== interactiveNonce)
    ) {
      const dataToSend = data.interactiveNonce === undefined ? { currentPlayIndex: data.currentPlayIndex } : data.video;
      console.log("SEND", interactiveNonce);
      existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataToSend)}\n\n`);
    }
  });
});

setInterval(() => {
  if (emitterObj.connections.length > 0) {
    emitterObj.deleteConn();
  }
}, 1000 * 60);

export default emitterObj;
