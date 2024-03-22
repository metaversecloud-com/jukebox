import emitterObj from "../../emitter/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import he from "he";
import { Request, Response } from "express";
import { Credentials } from "../../types/index.js";

export default async function NextSong(req: Request, res: Response) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body as Credentials;

  const jukeboxAsset = await getDroppedAsset({ assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  const { currentPlayIndex, media } = jukeboxAsset.dataObject;
  const timeFactor = new Date(Math.round(new Date().getTime() / 25000) * 25000);
  const lockId = `${jukeboxAsset.id}_${jukeboxAsset.mediaPlayTime}_${timeFactor}`;
  const newPlayIndex = media.length === currentPlayIndex + 1 ? 0 : currentPlayIndex + 1;

  try {
    await jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        currentPlayIndex: newPlayIndex,
      },
      {
        lock: {
          lockId,
          releaseLock: false,
        },
      },
    );
    const videoId = media[newPlayIndex].id.videoId;
    const videoTitle = media[newPlayIndex].snippet.title;

    const mediaLink = `https://www.youtube.com/watch?v=${videoId}`;

    await jukeboxAsset.updateMediaType({
      mediaLink,
      isVideo: true,
      mediaName: he.decode(videoTitle),
      mediaType: "link",
      audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
      audioRadius: jukeboxAsset.audioRadius || 2, // Far
      syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
    });
    emitterObj.emitFunc("nowPlaying", { assetId: jukeboxAsset.id, currentPlayIndex: newPlayIndex });

    return res.json({ message: "OK" });
  } catch (e) {
    // console.log("ERR", e);
    console.log("Update is properly locked due to mutex", visitorId);
    return res.status(409).json({ message: "Update is properly locked due to mutex" });
  }
}
