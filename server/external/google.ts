// const { google } = require("@googleapis/youtube");
import { youtube } from "@googleapis/youtube";
import { getDroppedAsset } from "../utils";

// No idea why this is causing problems with concurrently running dev servers

export async function searchVideos(req, res) {
  try {
    // Create a YouTube service object
    const { q } = req.body;

    const yt = youtube({
      version: "v3",
      auth: process.env.GOOGLE_API_KEY,
    });

    // Define search parameters
    const params = {
      part: "snippet",
      type: "video",
      videoEmbeddable: true,
      fields: "items(snippet(title,publishedAt,thumbnails(high)),id(videoId))",
      q: q, // Replace with your desired search query
      maxResults: 25, // Adjust the number of results you want
    };

    // Send the search request
    const response = await yt.search.list(params);

    // Process the search results
    const videos = response.data.items;

    console.log("Found videos:");
    videos.forEach((video) => {
      console.log(`* Title: ${video.snippet.title}`);
    });

    return res.json(videos);
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function playVideo(req, res) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, videoId } = req.body;
    console.log("Got these: ", req.body);
    const isSame =
      assetId === "-NrMIMrX-59YD9ecAyJP" &&
      interactiveNonce === "57cbc661-7aa9-4f64-bcc2-379f47601899" &&
      interactivePublicKey === "V4PvbCJSh7FsfbNdwSfB" &&
      urlSlug === "jukebox-dev" &&
      visitorId === "31";
    console.log("Is Same", isSame);
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const droppedAsset = await getDroppedAsset(credentials);

    const mediaLink = `https://www.youtube.com/watch?v=${videoId}`;

    await droppedAsset.updateMediaType({
      mediaLink,
      isVideo: true,
      mediaName: "Next Video", // Will only change media name if one is sent from the frontend.
      mediaType: "link",
      audioSliderVolume: droppedAsset.audioSliderVolume || 10, // Between 0 and 100
      audioRadius: droppedAsset.audioRadius || 2, // Far
      syncUserMedia: true, // Make it so everyone has the video synced instead of it playing from the beginning when they approach.
    });

    return res.json({ videoId });
  } catch (error) {
    console.error("Error:", error);
  }
}
