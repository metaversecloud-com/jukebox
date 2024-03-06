import express from "express";
import { getDroppedAsset } from "./utils";
const webhookRouter = express.Router();

webhookRouter.post("/next", async (req, res) => {
  console.log("NEXT", req.query, req.body);
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body;
  const jukeboxAsset = await getDroppedAsset({ assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  console.log("JUKEBOX", jukeboxAsset.dataObject);
  
  res.json({ message: "OK" });
});

export default webhookRouter;
