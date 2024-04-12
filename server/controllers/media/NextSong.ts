import redisObj from "../../redis/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import he from "he";
import { Request, Response } from "express";
import { Credentials } from "../../types/index.js";

export default async function NextSong(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body as Credentials;

  const jukeboxAsset = await getDroppedAsset({ assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const { queue } = jukeboxAsset.dataObject;
  const timeFactor = new Date(Math.round(new Date().getTime() / 25000) * 25000);
  const lockId = `${jukeboxAsset.id}_${jukeboxAsset.mediaPlayTime}_${timeFactor}`;
  const nowPlaying = queue[0];
  const remainingQueue = queue.slice(1);

  const promises = [];
  try {
    promises.push(
      jukeboxAsset.updateDataObject(
        {
          ...jukeboxAsset.dataObject,
          queue: remainingQueue,
        },
        {
          lock: {
            lockId,
            releaseLock: false,
          },
        },
      ),
    );
    if (nowPlaying) {
      const videoId = nowPlaying.id.videoId;
      const videoTitle = nowPlaying.snippet.title;

      const mediaLink = `https://www.youtube.com/watch?v=${videoId}`;

      promises.push(
        jukeboxAsset.updateMediaType({
          mediaLink,
          isVideo: true,
          mediaName: he.decode(videoTitle),
          mediaType: "link",
          audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
          audioRadius: jukeboxAsset.audioRadius || 2, // Far
          syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
        }),
      );
    } else {
      promises.push(
        jukeboxAsset.updateMediaType({
          mediaLink: "",
          isVideo: false,
          mediaName: "",
          mediaType: "link",
          audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
          audioRadius: jukeboxAsset.audioRadius || 2, // Far
          syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
        }),
      );
    }

    await Promise.all(promises);
    
    redisObj.publish(`${process.env.INTERACTIVE_KEY}_JUKEBOX`, {
      assetId: jukeboxAsset.id,
      videoId: nowPlaying ? nowPlaying.id.videoId : null,
      event: "nowPlaying",
    });

    return res.json({ message: "OK" });
  } catch (e) {
    // console.log("ERR", e);
    console.log("Update is properly locked due to mutex (Next Song)");
    return res.status(409).json({ message: "Update is properly locked due to mutex (Next Song)" });
  }
}
