// const { google } = require("@googleapis/youtube");
import { youtube } from "@googleapis/youtube";

export async function searchVideos() {
  try {
    // Create a YouTube service object

    const yt = youtube({
      version: "v3",
      auth: process.env.GOOGLE_API_KEY,
    });

    // Define search parameters
    const params = {
      part: "snippet",
      fields: "items(snippet(title))",
      q: "stealthgamerbr", // Replace with your desired search query
      maxResults: 50, // Adjust the number of results you want
    };

    // Send the search request
    const response = await yt.search.list(params);

    // Process the search results
    const videos = response.data.items;
    console.log("Found videos:");
    videos.forEach((video) => {
      console.log(`* Title: ${video.snippet.title}`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}