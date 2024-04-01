import { Video } from "./types";

export const videoSample: Video = {
  id: {
    videoId: "",
  },
  snippet: {
    title: "",
    publishedAt: "",
    thumbnails: {
      high: {
        url: "",
      },
    },
  },
  duration: 0,
};

export const skeleton: Video[] = Array.from({ length: 3 }, () => {
  return videoSample;
});
