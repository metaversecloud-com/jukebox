import { Credentials } from "../../types/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function GetCatalog(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const jukeboxAsset = await getDroppedAsset(credentials);
    if (jukeboxAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }
    if (jukeboxAsset) {
      res.status(200).json(jukeboxAsset.dataObject);
    }
  } catch (err: any) {
    console.error("Get Catalog Error", JSON.stringify(err));
    res.status(500).json({ error: err.message });
  }
}
