import emitterObj from "../emitter";

export default async function setHeartbeat(req, res) {
  const { interactiveNonce, visitorId } = req.query;
  emitterObj.connections.forEach((existingConnection) => {
    if (
      existingConnection.res.req.body.visitorId === visitorId &&
      existingConnection.res.req.body.interactiveNonce === interactiveNonce
    ) {
      console.log("Heartbeat Acknowledged", interactiveNonce);
      existingConnection.lastHeartbeatTime = Date.now();
    }
  });

  return res.status(200).json({ message: "Heartbeat acknowledged" });
}
