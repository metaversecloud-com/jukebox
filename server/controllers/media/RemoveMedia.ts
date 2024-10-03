import redisObj from "../../redis-sse/index.js";
import { Credentials, Video } from "../../types/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function RemoveMedia(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;

  const { videoIds, type }: { videoIds: string[]; type: "catalog" | "queue" } = req.body;
  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
  const jukeboxAsset = await getDroppedAsset(credentials);

  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${jukeboxAsset.id}_${timeFactor}`;
  try {
    const jukeboxUpdate: {
      catalog?: Video[];
      queue: string[];
    } = {};

    if (type === "catalog") {
      jukeboxUpdate.catalog = jukeboxAsset.dataObject.catalog.filter(
        (video: Video) => !videoIds.includes(video.id.videoId),
      );
      jukeboxUpdate.queue = jukeboxAsset.dataObject.queue.filter((videoId: string) => !videoIds.includes(videoId));
    } else if (type === "queue") {
      jukeboxUpdate.queue = jukeboxAsset.dataObject.queue.filter((videoId: string) => !videoIds.includes(videoId));
    }
    await jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        ...jukeboxUpdate,
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

    return res.json({ success: true });
  } catch (e) {
    console.log("Update is properly locked due to mutex (RemoveMedia)");
    return res.status(409).json({ message: "Update is properly locked due to mutex (RemoveMedia)" });
  }
}
