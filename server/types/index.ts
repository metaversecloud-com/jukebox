export type Credentials = {
  assetId?: string;
  interactivePublicKey: string;
  interactiveNonce: string;
  urlSlug: string;
  profileId?: string;
  username?: string;
  visitorId: number;
};

export type Video = {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
  duration: number;
};

export type JukeboxMode = "jukebox" | "karaoke";

export type JukeboxSettings = {
  mode: JukeboxMode;
  name: string;
  imageUrl: string;
};

export const DEFAULT_SETTINGS: JukeboxSettings = {
  mode: process.env.AUDIO_ONLY ? "jukebox" : "karaoke",
  name: "",
  imageUrl: "",
};

export type AnalyticType = {
  analyticName: string;
  incrementBy?: number;
  profileId?: string;
  uniqueKey?: string;
  urlSlug?: string;
};
