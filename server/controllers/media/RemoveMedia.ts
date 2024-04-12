import { checkIsAdmin } from "../../middleware/isAdmin.js";
import redisObj from "../../redis/index.js";
import { Credentials, Video } from "../../types/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function RemoveMedia(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;

  const { videoIds, type }: { videoIds: string[]; type: "catalog" | "queue" } = req.body;
  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
  const [isAdmin, jukeboxAsset] = await Promise.all([checkIsAdmin(credentials), getDroppedAsset(credentials)]);

  if (type === "catalog" && !isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${jukeboxAsset.id}_${timeFactor}`;
  const remainingVideos = jukeboxAsset.dataObject[type].filter((video: Video) => !videoIds.includes(video.id.videoId));
  try {
    await jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        [type]: remainingVideos,
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
      videos: videoIds,
      interactiveNonce,
      urlSlug,
      visitorId,
      kind: type === "catalog" ? "removedFromCatalog" : "removedFromQueue",
      event: "mediaAction",
    });

    return res.json({ message: "OK" });
  } catch (e) {
    console.log("Update is properly locked due to mutex", visitorId);
    return res.status(409).json({ message: "Update is properly locked due to mutex" });
  }
}
