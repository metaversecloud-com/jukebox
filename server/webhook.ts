import express from "express";
import { getDroppedAsset } from "./utils";
const webhookRouter = express.Router();

webhookRouter.post("/next", async (req, res) => {
  console.log("NEXT", req.query, req.body);
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body;
  const jukeboxAsset = await getDroppedAsset({ assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  console.log("JUKEBOX", jukeboxAsset.dataObject);
  const { currentPlayIndex, media } = jukeboxAsset.dataObject;
  try {
    await jukeboxAsset.updateDataObject(
      {
        ...jukeboxAsset.dataObject,
        currentPlayIndex: currentPlayIndex + 1,
      },
      // Mutex to prevent multiple updates.  Works on update object.  Only the first ping will work.
      // If it fails, don't do anything else.  If it succeeds, it means this was the first webhook received and you should do the rest of the work.
      {
        lock: {
          // lockId: `${jukeboxAsset.id}_${Math.random()}`,
          releaseLock: false, // If false, will only ever work once.  Make sure lockId is something unique that you'll never ping again.
        },
      },
    );

    const videoId = media[currentPlayIndex + 1].id.videoId;

    const mediaLink = `https://www.youtube.com/watch?v=${videoId}`;

    await jukeboxAsset.updateMediaType({
      mediaLink,
      isVideo: true,
      mediaName: "Next Video", // Will only change media name if one is sent from the frontend.
      mediaType: "link",
      audioSliderVolume: jukeboxAsset.audioSliderVolume || 10, // Between 0 and 100
      audioRadius: jukeboxAsset.audioRadius || 2, // Far
      syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
    });
    res.json({ message: "OK" });
  } catch (e) {
    console.log("ERR", e);
    console.log("Update is properly locked due to mutex");
    return;
  }
});

export default webhookRouter;
