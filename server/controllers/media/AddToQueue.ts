import emitterObj from "../../emitter";
import { Credentials } from "../../types";
import { getDroppedAsset } from "../../utils";

export default async function AddToQueue(req: Express.Request, res: Express.Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;

  const { videos } = req.body;
  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
  const jukeboxAsset = await getDroppedAsset(credentials);
  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${jukeboxAsset.id}_${timeFactor}`;
  
  try {
    await jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        media: [...jukeboxAsset.dataObject.media, ...videos],
      },
      {
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    );

    emitterObj.emitFunc("addedToQueue", { assetId: jukeboxAsset.id, videos, interactiveNonce, urlSlug, visitorId });

    res.json({ message: "OK" });
  } catch (e) {
    // console.log("ERR", e);
    console.log("Update is properly locked due to mutex", visitorId);
    return;
  }
}
