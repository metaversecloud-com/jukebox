import { youtube_v3 } from "@googleapis/youtube";
import initializeYouTube from "../../external/google";
import { Video } from "../../types";
import { YTDurationToMilliseconds } from "../../utils/youtube";
import { Request, Response } from "express";

async function getVideoDuration(videos: Video[], yt: youtube_v3.Youtube) {
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

export default async function SearchVideos(req: Request, res: Response) {
  const yt = await initializeYouTube();

  try {
    const { q, nextPageToken }: { q: string; nextPageToken: string } = req.body;
    const params = {
      part: "snippet",
      type: "video",
      videoEmbeddable: true,
      safeSearch: process.env.SAFE_SEARCH, // Can be "moderate", "strict" or "none"
      fields: "nextPageToken,items(snippet(title,publishedAt,publishTime,thumbnails(high)),id(videoId))",
      q: q,
      maxResults: 25,
      pageToken: nextPageToken,
    };

    const response = await yt.search.list(params);

    const videos = response.data.items;
    const newNextPageToken = response.data.nextPageToken ? response.data.nextPageToken : null;
    const videosWithDuration = await getVideoDuration(videos, yt);

    return res.status(200).json({ searchResults: videosWithDuration, newNextPageToken });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
