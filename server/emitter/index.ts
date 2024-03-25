import EventEmitter from "events";

const shouldSend = (
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
    console.log("Connection added", this.connections.length);
  },
  deleteConn: function () {
    // Remove inactive connections older than 1 hour
    this.connections = this.connections.filter(
      ({ lastHeartbeatTime }) => lastHeartbeatTime > Date.now() - 30 * 60 * 1000,
    );
  },
  listenNowPlaying: null,
  listenQueue: null,
  // listenNowPlaying: function () {
  //   this.emitter.on("nowPlaying", (data) => {
  //     this.connections.forEach(({ res: existingConnection }) => {
  //       const { assetId, visitorId } = existingConnection.req.body;
  //       if (shouldSend(data, assetId, visitorId)) {
  //         const dataToSend =
  //           data.currentPlayIndex !== null
  //             ? { data: { currentPlayIndex: data.currentPlayIndex } }
  //             : { data: { video: data.video } };
  //         dataToSend["kind"] = "nowPlaying";
  //         existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataToSend)}\n\n`);
  //       }
  //     });
  //   });
  // },
  // listenQueue: function () {
  //   this.emitter.on("addedToQueue", (data) => {
  //     this.connections.forEach(({ res: existingConnection }) => {
  //       const { assetId, visitorId } = existingConnection.req.body;
  //       if (shouldSend(data, assetId, visitorId)) {
  //         const dataWithKind = { videos: data.videos, kind: "addedToQueue" };
  //         console.log("DATA WITH KIND", dataWithKind)
  //         existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataWithKind)}\n\n`);
  //       }
  //     });
  //   });
  // },
};

emitterObj.listenNowPlaying = emitterObj.emitter.on("nowPlaying", (data) => {
  emitterObj.connections.forEach(({ res: existingConnection }) => {
    const { assetId, visitorId, interactiveNonce } = existingConnection.req.body;
    if (shouldSend(data, assetId, visitorId, interactiveNonce)) {
      const dataToSend =
        data.currentPlayIndex !== null
          ? { data: { currentPlayIndex: data.currentPlayIndex } }
          : { data: { video: data.video } };
      dataToSend["kind"] = "nowPlaying";
      existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataToSend)}\n\n`);
    }
  });
});

emitterObj.listenQueue = emitterObj.emitter.on("queueAction", (data) => {
  emitterObj.connections.forEach(({ res: existingConnection }) => {
    const { assetId, visitorId, interactiveNonce } = existingConnection.req.body;
    if (shouldSend(data, assetId, visitorId, interactiveNonce)) {
      const dataWithKind = { videos: data.videos, kind: data.kind, videoIds: data.videoIds };
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
