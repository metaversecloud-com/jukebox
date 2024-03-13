import { getDroppedAsset } from "../../utils";

export async function nextSong(req, res) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body;
  const jukeboxAsset = await getDroppedAsset({ assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  const { currentPlayIndex, media } = jukeboxAsset.dataObject;
  const lockId = `${jukeboxAsset.id}_${jukeboxAsset.mediaPlayTime}`;
  const newPlayIndex = media.length === currentPlayIndex + 1 ? 0 : currentPlayIndex + 1;
  // const newPlayIndex = 0;
  // console.log("CURRENT", currentPlayIndex, newPlayIndex, media.length)
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
    console.log("UPDATE IN PROGRESS");
    const videoId = media[newPlayIndex].id.videoId;
    const videoTitle = media[newPlayIndex].snippet.title;

    const mediaLink = `https://www.youtube.com/watch?v=${videoId}`;

    await jukeboxAsset.updateMediaType({
      mediaLink,
      isVideo: true,
      mediaName: videoTitle,
      mediaType: "link",
      audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
      audioRadius: jukeboxAsset.audioRadius || 2, // Far
      syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
    });
    res.json({ message: "OK" });
  } catch (e) {
    // console.log("ERR", e);
    console.log("Update is properly locked due to mutex", visitorId);
    return;
  }
}