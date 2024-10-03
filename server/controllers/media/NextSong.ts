import redisObj from "../../redis-sse/index.js";
import { World, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";
import { Video } from "../../types/index.js";
import { getAvailableVideos } from "../../utils/youtube/index.js";

const findNextAvailableSong = async (queue: string[], catalog: Video[]): Promise<[Video | null, -1]> => {
  const videoIds = await getAvailableVideos(catalog);

  for (let i = 0; i < queue.length; i++) {
    const video = catalog.find((v) => v.id.videoId === queue[i]);
    if (video && videoIds.includes(video.id.videoId)) {
      return [video, i];
    }
  }
  return [null, -1];
};

export default async function NextSong(req: Request, res: Response) {
  const credentials = getCredentials(req.body);
  const jukeboxAsset = await getDroppedAsset(credentials);
  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }
  const { queue } = jukeboxAsset.dataObject;
  const timeFactor = new Date(Math.round(new Date().getTime() / 25000) * 25000);
  const lockId = `${jukeboxAsset.id}_${jukeboxAsset.mediaPlayTime}_${timeFactor}`;
  let remainingQueue = [];
  let nowPlaying = "-1" as "-1" | Video;
  const promises = [];
  const analytics = [];
  try {
    if (queue.length > 0) {
      // nowPlaying = jukeboxAsset.dataObject.catalog.find((video: Video) => video.id.videoId === queue[0]) as Video;
      const [nextSong, index] = await findNextAvailableSong(queue, jukeboxAsset.dataObject.catalog);
      nowPlaying = nextSong;
      if (nowPlaying) {
        remainingQueue = queue.slice(index + 1);
        const videoId = nowPlaying.id.videoId;
        // const videoTitle = nowPlaying.snippet.title;

        const mediaLink = `https://www.youtube.com/watch?v=${videoId}`;

        const world = World.create(credentials.urlSlug, { credentials });
        world
          .triggerParticle({
            name: "musicNote_float",
            duration: 10,
            position: {
              x: jukeboxAsset.position.x,
              y: jukeboxAsset.position.y - 130,
            },
          })
          .then()
          .catch(() => console.error("Cannot trigger particle"));
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
        analytics.push({ analyticName: "plays", urlSlug: credentials.urlSlug, uniqueKey: credentials.urlSlug });
      } else {
        promises.push(jukeboxAsset.updateMediaType({ mediaType: "none" }));
      }
    } else {
      promises.push(jukeboxAsset.updateMediaType({ mediaType: "none" }));
    }

    promises.push(
      jukeboxAsset.updateDataObject(
        {
          ...jukeboxAsset.dataObject,
          queue: remainingQueue,
          nowPlaying: nowPlaying && nowPlaying !== "-1" ? nowPlaying.id.videoId : "-1",
        },
        {
          analytics,
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
