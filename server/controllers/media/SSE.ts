import emitterObj from "../../emitter/index.js";
import { Request, Response } from "express";

export default async function SSE(req: Request, res: Response) {
  if (!res.req.query.interactiveNonce) return res.status(400).json({ message: "Invalid" });
  emitterObj.addConn({ res, lastHeartbeatTime: Date.now() });

  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  emitterObj.listenNowPlaying;
  emitterObj.listenQueue;
  // res.write(`retry: 5000\ndata: ${JSON.stringify({ q: "hello" })}\n\n`);
}
