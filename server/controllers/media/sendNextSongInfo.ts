import emitterObj from "../../emitter";

// let connectedClients = [];

// const sendDisconnectMessage = (res) => {
//   console.log("SENDING DISCONNECT MESSAGE", res.body);
//   res.write(`data: Disconnected from server\n\n`);
//   res.writeHead(200, { "Content-Type": "text/plain" });
//   res.end();
// };

export default async function sendNextSongInfo(req, res) {
  console.log("New Connection", res.req.body.interactiveNonce);
  if (!res.req.body.interactiveNonce) return res.status(400).json({ message: "Invalid" });

  emitterObj.addConn({ res, lastHeartbeatTime: Date.now() });

  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  emitterObj.listenNowPlaying;
  emitterObj.listenQueue;

}
