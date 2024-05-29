import { checkIsAdmin } from "../../middleware/isAdmin.js";
import redisObj from "../../redis-sse/index.js";
import { Video } from "../../types/index.js";
import { getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";
// import he from "he";

export default async function AddMedia(req: Request, res: Response) {
  const credentials = getCredentials(req.query);
  const { videos, type }: { videos: Video[] | string[]; type: "catalog" | "queue" } = req.body;
  const [isAdmin, jukeboxAsset] = await Promise.all([checkIsAdmin(credentials), getDroppedAsset(credentials)]);

  if (type === "catalog" && !isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${jukeboxAsset.id}_${timeFactor}`;
  const promises = [];

  const analytics = [];
  if (type === "catalog") {
    analytics.push("addsToCatalog");
  } else if (type === "queue") {
    analytics.push("addsToQueue");
  }
  let firstVideo = null;
  if (jukeboxAsset.dataObject.queue.length === 0 && type === "queue" && jukeboxAsset.dataObject.nowPlaying === "-1") {
    firstVideo = jukeboxAsset.dataObject.catalog.find((video: Video) => video.id.videoId === videos[0]);
    if (firstVideo) {
      const mediaLink = `https://www.youtube.com/watch?v=${firstVideo.id.videoId}`;
      promises.push(
        jukeboxAsset.updateMediaType({
          mediaLink,
          isVideo: process.env.AUDIO_ONLY ? false : true,
          // mediaName: he.decode(firstVideo.snippet.title),
          mediaName: "Jukebox",
          mediaType: "link",
          audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
          audioRadius: jukeboxAsset.audioRadius || 2, // Far
          syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
        }),
        jukeboxAsset.updateDataObject(
          {},
          {
            analytics: ["plays"],
          },
        ),
      );
      // analytics.push("plays");
      videos.shift();
    }
  }
  promises.push(
    jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        nowPlaying: firstVideo ? firstVideo.id.videoId : jukeboxAsset.dataObject.nowPlaying,
        [type]: [...jukeboxAsset.dataObject[type], ...videos],
      },
      {
        analytics,
        profileId: type === "catalog" ? undefined : credentials.profileId,
        uniqueKey: type === "catalog" ? credentials.urlSlug : credentials.profileId,
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    ),
  );
  try {
    await Promise.all(promises);
    redisObj.publish(`${process.env.INTERACTIVE_KEY}_JUKEBOX`, {
      assetId: jukeboxAsset.id,
      videos: firstVideo ? [firstVideo.id.videoId, ...videos] : videos,
      interactiveNonce: credentials.interactiveNonce,
      urlSlug: credentials.urlSlug,
      visitorId: credentials.visitorId,
      kind: type === "catalog" ? "addedToCatalog" : "addedToQueue",
      event: "mediaAction",
    });

    return res.json({ success: true });
  } catch (e) {
    console.log("Update is properly locked due to mutex (Add Media)");
    return res.status(409).json({ message: "Update is properly locked due to mutex (Add Media)" });
  }
}
