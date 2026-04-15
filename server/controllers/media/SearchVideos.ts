import { youtube_v3 } from "@googleapis/youtube";
import yt from "../../external/google.js";
import { Video } from "../../types";
import { YTDurationToMilliseconds } from "../../utils/youtube/index.js";
import { Request, Response } from "express";
import { errorHandler } from "../../utils/errorHandler.js";

async function getVideoDuration(videos: Video[], yt: youtube_v3.Youtube) {
  const videoIds = videos.map((video) => video.id.videoId);

  const videoInfo = await yt.videos.list({
    part: ["contentDetails"],
    fields: "items(contentDetails(duration))",
    id: [videoIds.join(",")],
  });

  return videos.map((video, i) => {
    const items = videoInfo.data.items;
    const duration = items?.[i]?.contentDetails?.duration ?? "";
    return { ...video, duration: YTDurationToMilliseconds(duration) };
  });
}

export default async function SearchVideos(req: Request, res: Response) {

  try {
    const { q, nextPageToken }: { q: string; nextPageToken: string } = req.body;
    const params: youtube_v3.Params$Resource$Search$List = {
      part: ["snippet"],
      type: ["video"],
      videoEmbeddable: "true",
      safeSearch: process.env.SAFE_SEARCH, // Can be "moderate", "strict" or "none"
      fields: "nextPageToken,items(snippet(title,publishedAt,publishTime,thumbnails(high)),id(videoId))",
      q: q,
      maxResults: 25,
      pageToken: nextPageToken,
    };

    const response = await yt.search.list(params);

    const videos = (response.data.items || []) as unknown as Video[];
    const newNextPageToken = response.data.nextPageToken ? response.data.nextPageToken : null;
    const videosWithDuration = await getVideoDuration(videos, yt);

    return res.status(200).json({ searchResults: videosWithDuration, newNextPageToken });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "SearchVideos",
      message: "Error searching",
      req, res
    });
  }
}
