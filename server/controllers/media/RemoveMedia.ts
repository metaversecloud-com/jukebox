import redisObj from "../../redis-sse/index.js";
import { Video } from "../../types/index.js";
import { getCredentials, getDroppedAsset, World } from "../../utils/index.js";
import { Request, Response } from "express";
import { DroppedAssetMediaType } from "@rtsdk/topia";
import { getAvailableVideos } from "../../utils/youtube/index.js";

export default async function RemoveMedia(req: Request, res: Response) {
  const credentials = getCredentials(req.query);
  const { interactiveNonce, urlSlug, visitorId } = credentials;

  const { videoIds, type }: { videoIds: string[]; type: "catalog" | "queue" } = req.body;
  const jukeboxAsset = await getDroppedAsset(credentials);

  if (jukeboxAsset.error) {
    return res.status(404).json({ message: "Asset not found" });
  }

  const timeFactor = new Date(Math.round(new Date().getTime() / 10000) * 10000);
  const lockId = `${jukeboxAsset.id}_${timeFactor}`;

  try {
    const jukeboxUpdate: {
      catalog?: Video[];
      queue?: string[];
      nowPlaying?: string;
    } = {};

    if (type === "catalog") {
      jukeboxUpdate.catalog = jukeboxAsset.dataObject.catalog.filter(
        (video: Video) => !videoIds.includes(video.id.videoId),
      );
      jukeboxUpdate.queue = jukeboxAsset.dataObject.queue.filter((videoId: string) => !videoIds.includes(videoId));
    } else if (type === "queue") {
      jukeboxUpdate.queue = jukeboxAsset.dataObject.queue.filter((videoId: string) => !videoIds.includes(videoId));
    }

    // If the currently playing song was removed, stop it and skip to next
    const nowPlayingRemoved = videoIds.includes(jukeboxAsset.dataObject.nowPlaying);
    if (nowPlayingRemoved) {
      const remainingQueue = jukeboxUpdate.queue ?? jukeboxAsset.dataObject.queue;
      const remainingCatalog = jukeboxUpdate.catalog ?? jukeboxAsset.dataObject.catalog;

      // Find next available song from the remaining queue and catalog
      let nextVideo: Video | null = null;
      let nextIndex = -1;

      if (remainingQueue.length > 0 && remainingCatalog.length > 0) {
        const availableVideoIds = await getAvailableVideos(remainingCatalog);
        for (let i = 0; i < remainingQueue.length; i++) {
          const video = remainingCatalog.find((v: Video) => v.id.videoId === remainingQueue[i]);
          if (video && availableVideoIds.includes(video.id.videoId)) {
            nextVideo = video;
            nextIndex = i;
            break;
          }
        }
      }

      if (nextVideo) {
        // Play the next song
        const mediaLink = `https://www.youtube.com/watch?v=${nextVideo.id.videoId}`;
        await jukeboxAsset.updateMediaType({
          mediaLink,
          isVideo:
            (jukeboxAsset.dataObject.settings?.mode ?? (process.env.AUDIO_ONLY ? "jukebox" : "karaoke")) === "karaoke",
          mediaName: "Jukebox",
          mediaType: DroppedAssetMediaType.LINK,
          audioSliderVolume: (jukeboxAsset as any).audioSliderVolume || 10,
          audioRadius: (jukeboxAsset as any).audioRadius || 2,
          portalName: "",
          syncUserMedia: true,
        });

        jukeboxUpdate.nowPlaying = nextVideo.id.videoId;
        jukeboxUpdate.queue = remainingQueue.slice(nextIndex + 1);

        const world = World.create(urlSlug, { credentials });
        world
          .triggerParticle({
            name: "musicNote_float",
            duration: 10,
            position: {
              x: jukeboxAsset.position.x,
              y: jukeboxAsset.position.y - 130,
            },
          })
          .catch(() => console.error("Cannot trigger particle"));
      } else {
        // No next song — stop media
        await jukeboxAsset.updateMediaType({ mediaType: DroppedAssetMediaType.NONE } as any);
        jukeboxUpdate.nowPlaying = "-1";
        jukeboxUpdate.queue = [];
      }
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

    // Publish appropriate SSE event
    if (nowPlayingRemoved) {
      redisObj.publish(`${process.env.INTERACTIVE_KEY}_JUKEBOX`, {
        assetId: jukeboxAsset.id,
        videoId: jukeboxUpdate.nowPlaying !== "-1" ? jukeboxUpdate.nowPlaying : "-1",
        nextUpId: jukeboxUpdate.queue && jukeboxUpdate.queue.length > 0 ? jukeboxUpdate.queue[0] : null,
        event: "nowPlaying",
      });
    }

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
