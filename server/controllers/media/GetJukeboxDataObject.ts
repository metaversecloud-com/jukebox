import { Credentials } from "../../types/index.js";
import { errorHandler, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function GetJukeboxDataObject(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const jukeboxAsset = await getDroppedAsset(credentials);
    if (jukeboxAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }
    if (jukeboxAsset) {
      return res.status(200).json(jukeboxAsset.dataObject);
    }
  } catch (err: any) {
    return errorHandler({
      err,
      functionName: "GetJukeboxDataObject",
      message: "Error getting Jukebox",
      req,
      res
    });
  }
}
