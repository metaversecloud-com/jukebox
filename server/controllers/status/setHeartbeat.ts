import emitterObj from "../../emitter/index.js";
import { Request, Response } from "express";

export default async function setHeartbeat(req: Request, res: Response) {
  const { interactiveNonce, visitorId } = req.query;
  emitterObj.connections.forEach((existingConnection) => {
    if (
      existingConnection.res.req.query.visitorId === visitorId &&
      existingConnection.res.req.query.interactiveNonce === interactiveNonce
    ) {
      console.log("Heartbeat Acknowledged", interactiveNonce);
      existingConnection.lastHeartbeatTime = Date.now();
    }
  });

  return res.status(200).json({ message: "Heartbeat acknowledged" });
}
