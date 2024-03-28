import redisObj from "../../redis/index.js";
import { Credentials, Video } from "../../types/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function AddToQueue(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;

  const { videos }: { videos: Video[] } = req.body;
  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
  const jukeboxAsset = await getDroppedAsset(credentials);
  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${jukeboxAsset.id}_${timeFactor}`;
  const mediaWithAddedVideos = jukeboxAsset.dataObject.media.slice();
  try {
    mediaWithAddedVideos.splice(jukeboxAsset.dataObject.currentPlayIndex, 0, ...videos);
    await jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        media: mediaWithAddedVideos,
        currentPlayIndex: jukeboxAsset.dataObject.currentPlayIndex + videos.length,
      },
      {
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    );
    redisObj.publish(`${process.env.INTERACTIVE_KEY}_JUKEBOX`, {
      assetId: jukeboxAsset.id,
      videos,
      interactiveNonce,
      urlSlug,
      visitorId,
      kind: "addedToQueue",
      event: "queueAction",
    });

    return res.json({ message: "OK" });
  } catch (e) {
    console.log("Update is properly locked due to mutex", visitorId);
    return res.status(409).json({ message: "Update is properly locked due to mutex" });
  }
}
