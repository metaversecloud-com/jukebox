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

export default async function SearchVideos(req: Express.Request, res: Express.Response) {
  try {
    const { q, nextPageToken } = req.body;

    const params = {
      part: "snippet",
      type: "video",
      videoEmbeddable: true,
      safeSearch: "strict",
      fields: "nextPageToken,items(snippet(title,publishedAt,publishTime,thumbnails(high)),id(videoId))",
      q: q,
      maxResults: 25,
      pageToken: nextPageToken,
    };

    const response = await yt.search.list(params);

    const videos = response.data.items;
    const newNextPageToken = response.data.nextPageToken ? response.data.nextPageToken : null;
    const videosWithDuration = await getVideoDuration(videos);

    return res.status(200).json({ searchResults: videosWithDuration, newNextPageToken });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
