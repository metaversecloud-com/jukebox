import { getDroppedAsset } from "../../utils";

export default async function GetCatalog(req: Express.Request, res: Express.Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const droppedAsset = await getDroppedAsset(credentials);

    if (droppedAsset) {
      res.status(200).json(droppedAsset.dataObject);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}
