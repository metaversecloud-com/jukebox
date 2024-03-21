import { Credentials } from "../../types";
import { getDroppedAsset } from "../../utils";
import { Request, Response } from "express";

export default async function GetCatalog(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const droppedAsset = await getDroppedAsset(credentials);

    if (droppedAsset) {
      res.status(200).json(droppedAsset.dataObject);
    }
  } catch (err: any) {
    console.error("Get Catalog Error", JSON.stringify(err));
    res.status(500).json({ error: err.message });
  }
}
