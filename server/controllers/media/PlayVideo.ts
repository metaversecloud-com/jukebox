import emitterObj from "../../emitter";
import { getDroppedAsset } from "../../utils";

export default async function PlayVideo(req, res) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query;
    const { video } = req.body;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const jukeboxAsset = await getDroppedAsset(credentials);

    const mediaLink = `https://www.youtube.com/watch?v=${video.id.videoId}`;

    const lockId = `${jukeboxAsset.id}_${jukeboxAsset.mediaPlayTime}`;

    try {
      await jukeboxAsset.updateDataObject(
        {
          ...jukeboxAsset.dataObject,
          currentPlayingMedia: video,
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
        mediaName: video.snippet.title, // Will only change media name if one is sent from the frontend.
        mediaType: "link",
        audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
        audioRadius: jukeboxAsset.audioRadius || 2, // Far
        syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
      });

      emitterObj.emitFunc("nowPlaying", { video, assetId: jukeboxAsset.id, interactiveNonce, visitorId });

      return res.status(200).json({ videoId: video.id.videoId });
    } catch (e) {
      // console.log("ERR", e);
      console.log("Update is properly locked due to mutex", visitorId);
      return;
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
