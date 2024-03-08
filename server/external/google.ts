// const { google } = require("@googleapis/youtube");
import { youtube } from "@googleapis/youtube";
import { getDroppedAsset } from "../utils";

// No idea why this is causing problems with concurrently running dev servers
const yt = youtube({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});

export async function searchVideos(req, res) {
  try {
    // Create a YouTube service object
    const { q, nextPageToken } = req.body;

    // Define search parameters
    const params = {
      part: "snippet",
      type: "video",
      videoEmbeddable: true,
      safeSearch: "strict",
      fields: "nextPageToken,items(snippet(title,publishedAt,publishTime,thumbnails(high)),id(videoId))",
      q: q, // Replace with your desired search query
      maxResults: 5, // Adjust the number of results you want
      nextPageToken,
    };

    // Send the search request
    const response = await yt.search.list(params);

    // Process the search results
    const videos = response.data.items;
    const newNextPageToken = response.data.nextPageToken;
    const videosWithDuration = await getVideoDuration(videos);
    console.log("Found videos:");
    videos.forEach((video) => {
      console.log(`* Title: ${video.snippet.title}`);
    });

    return res.json({ catalog: videosWithDuration, newNextPageToken });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getVideoDuration(videos) {
  const videoIds = videos.map((video) => video.id.videoId);
  const videoInfo = await yt.videos.list({
    part: "contentDetails",
    fields: "items(contentDetails(duration))",
    id: videoIds.join(","),
  });
  return videos.map((video, i) => {
    return { ...video, duration: YTDurationToMilliseconds(videoInfo.data.items[i].contentDetails.duration) };
  });
}

function YTDurationToMilliseconds(isoDurationString) {
  const regex =
    /^P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?$/;

  const match = isoDurationString.match(regex);

  try {
    const years = parseFloat(match[1] || 0);
    const months = parseFloat(match[2] || 0);
    const weeks = parseFloat(match[3] || 0);
    const days = parseFloat(match[4] || 0);
    const hours = parseFloat(match[5] || 0);
    const minutes = parseFloat(match[6] || 0);
    const seconds = parseFloat(match[7] || 0);

    const milliseconds =
      years * 31536000000 + 
      months * 2629800000 + 
      weeks * 604800000 + 
      days * 86400000 + 
      hours * 3600000 +
      minutes * 60000 + 
      seconds * 1000;

    return milliseconds;
  } catch (error) {
    console.error("Error:", error);
    return 0;
  }
}

export async function playVideo(req, res) {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId, videoId } = req.body;

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
