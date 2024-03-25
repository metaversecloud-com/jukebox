import emitterObj from "../../emitter/index.js";
import { Credentials, Video } from "../../types/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function RemoveFromQueue(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;

  const { videoIds }: { videoIds: string[] } = req.body;
  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
  const jukeboxAsset = await getDroppedAsset(credentials);
  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${jukeboxAsset.id}_${timeFactor}`;
  const mediaWithRemovedVideos = jukeboxAsset.dataObject.media.filter(
    (video: Video) => !videoIds.includes(video.id.videoId),
  );
  const currentPlayIndex = mediaWithRemovedVideos.findIndex(
    (video: Video) =>
      video.id.videoId === jukeboxAsset.dataObject.media[jukeboxAsset.dataObject.currentPlayIndex]?.id?.videoId,
  );
  try {
    await jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        media: mediaWithRemovedVideos,
        currentPlayIndex,
      },
      {
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    );
    emitterObj.emitFunc("queueAction", {
      assetId: jukeboxAsset.id,
      videoIds,
      interactiveNonce,
      urlSlug,
      visitorId,
      kind: "removedFromQueue",
    });

    return res.json({ message: "OK" });
  } catch (e) {
    console.log("Update is properly locked due to mutex", visitorId);
    return res.status(409).json({ message: "Update is properly locked due to mutex" });
  }
}
