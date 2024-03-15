import { eventEmitter } from "../..";

export default async function sendNextSongInfo(req, res) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body;

  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  // req.on("close", () => {
  //   console.log("CLOSED");
  //   // res.end();
  // });

  eventEmitter.on("nowPlaying", (data) => {
    if (
      data.assetId === assetId &&
      (data.vistorId === undefined || data.visitorId !== visitorId) &&
      (data.interactiveNonce === undefined || data.interactiveNonce !== interactiveNonce)
    ) {
      const dataToSend = data.interactiveNonce === undefined ? { currentPlayIndex: data.currentPlayIndex } : data.video;
      console.log("SEND", interactiveNonce)
      res.write(`retry: 5000\ndata: ${JSON.stringify(dataToSend)}\n\n`);
    }
  });
}
