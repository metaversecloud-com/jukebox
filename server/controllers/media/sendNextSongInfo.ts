import emitterObj from "../../emitter";

export default async function SendNextSongInfo(req: Express.Request, res: Express.Response) {
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
