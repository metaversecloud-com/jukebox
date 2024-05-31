import redisObj from "../../redis-sse/index.js";
import { World, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";
import { Video } from "../../types/index.js";

export default async function NextSong(req: Request, res: Response) {
  const credentials = getCredentials(req.body);
  const jukeboxAsset = await getDroppedAsset(credentials);
  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const { queue } = jukeboxAsset.dataObject;
  const timeFactor = new Date(Math.round(new Date().getTime() / 25000) * 25000);
  const lockId = `${jukeboxAsset.id}_${jukeboxAsset.mediaPlayTime}_${timeFactor}`;
  const remainingQueue = queue.slice(1);
  let nowPlaying = "-1" as "-1" | Video;
  const promises = [];
  try {
    if (queue.length > 0) {
      nowPlaying = jukeboxAsset.dataObject.catalog.find((video: Video) => video.id.videoId === queue[0]) as Video;
      const videoId = nowPlaying.id.videoId;
      // const videoTitle = nowPlaying.snippet.title;

      const mediaLink = `https://www.youtube.com/watch?v=${videoId}`;

      if (process.env.NEW_SONG_START_PARTICLE_EFFECT_NAME) {
        const world = World.create(credentials.urlSlug, { credentials });
        promises.push(
          world.triggerParticle({
            name: process.env.NEW_SONG_START_PARTICLE_EFFECT_NAME,
            duration: 10,
            position: jukeboxAsset.position,
          }),
        );
      }

      promises.push(
        jukeboxAsset.updateMediaType({
          mediaLink,
          isVideo: process.env.AUDIO_ONLY ? false : true,
          // mediaName: he.decode(videoTitle),
          mediaName: "Jukebox",
          mediaType: "link",
          audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
          audioRadius: jukeboxAsset.audioRadius || 2, // Far
          syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
        }),
      );
    } else {
      promises.push(jukeboxAsset.updateMediaType({ mediaType: "none" }));
    }

    promises.push(
      jukeboxAsset.updateDataObject(
        {
          ...jukeboxAsset.dataObject,
          queue: remainingQueue,
          nowPlaying: nowPlaying !== "-1" ? nowPlaying.id.videoId : "-1",
        },
        {
          analytics: [{ analyticName: "plays", urlSlug: credentials.urlSlug, uniqueKey: credentials.urlSlug }],
          lock: {
            lockId,
            releaseLock: false,
          },
        },
      ),
    );

    await Promise.all(promises);

    redisObj.publish(`${process.env.INTERACTIVE_KEY}_JUKEBOX`, {
      assetId: jukeboxAsset.id,
      videoId: nowPlaying !== "-1" ? nowPlaying.id.videoId : "-1",
      nextUpId: remainingQueue.length > 0 ? remainingQueue[0] : null,
      event: "nowPlaying",
    });

    return res.json({ success: true });
  } catch (e) {
    console.log("Update is properly locked due to mutex (Next Song)");
    return res.status(409).json({ message: "Update is properly locked due to mutex (Next Song)" });
  }
}
