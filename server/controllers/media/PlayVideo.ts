import emitterObj from "../../emitter/index.js";
import { getDroppedAsset } from "../../utils/index.js";
import he from "he";
import { Request, Response } from "express";
import { Credentials } from "../../types/index.js";

export default async function PlayVideo(req: Request, res: Response) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;
    const { videoId } = req.body;

    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const jukeboxAsset = await getDroppedAsset(credentials);
    if (jukeboxAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }
    const newIdx = jukeboxAsset.dataObject.media.findIndex((v) => v.id.videoId === videoId);
    const video = jukeboxAsset.dataObject.media[newIdx];

    const mediaLink = `https://www.youtube.com/watch?v=${video.id.videoId}`;

    const timeFactor = new Date(Math.round(new Date().getTime() / 25000) * 25000);
    const lockId = `${jukeboxAsset.id}_${jukeboxAsset.mediaPlayTime}_${timeFactor}`;
    // const newIdx = jukeboxAsset.dataObject.media.map((v) => v.id.videoId).indexOf(video.id.videoId);
    try {
      await jukeboxAsset.updateDataObject(
        {
          ...jukeboxAsset.dataObject,
          currentPlayIndex: newIdx,
        },
        {
          lock: {
            lockId,
            releaseLock: false,
          },
        },
      );

      await jukeboxAsset.updateMediaType({
        mediaLink,
        isVideo: true,
        mediaName: he.decode(video.snippet.title), // Will only change media name if one is sent from the frontend.
        mediaType: "link",
        audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
        audioRadius: jukeboxAsset.audioRadius || 2, // Far
        syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
      });

      emitterObj.emitFunc("nowPlaying", {
        videoId,
        assetId: jukeboxAsset.id,
        interactiveNonce,
        visitorId,
        urlSlug,
        currentPlayIndex: newIdx,
      });

      return res.status(200).json({ videoId: video.id.videoId });
    } catch (e) {
      // console.log("ERR", e);
      console.log("Update is properly locked due to mutex", visitorId);
      return res.status(409).json({ message: "Update is properly locked due to mutex" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
