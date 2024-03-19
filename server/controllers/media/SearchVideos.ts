import yt from "../../external/google";
import { getVisitor } from "../../utils";
import { YTDurationToMilliseconds } from "../../utils/youtube";

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

export default async function SearchVideos(req, res) {
  const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query;

  // const visitor = await getVisitor({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  // if (!visitor || !visitor.isAdmin) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  try {
    // Create a YouTube service object
    const { q, nextPageToken } = req.body;

    // await sleep(5000);

    // Define search parameters
    const params = {
      part: "snippet",
      type: "video",
      videoEmbeddable: true,
      safeSearch: "strict",
      fields: "nextPageToken,items(snippet(title,publishedAt,publishTime,thumbnails(high)),id(videoId))",
      q: q, // Replace with your desired search query
      maxResults: 25, // Adjust the number of results you want
      pageToken: nextPageToken,
    };

    // Send the search request
    const response = await yt.search.list(params);

    // Process the search results
    const videos = response.data.items;
    const newNextPageToken = response.data.nextPageToken ? response.data.nextPageToken : null;
    const videosWithDuration = await getVideoDuration(videos);

    return res.status(200).json({ searchResults: videosWithDuration, newNextPageToken });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
