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

export type AnalyticType = {
  analyticName: string;
  incrementBy?: number;
  profileId?: string;
  uniqueKey?: string;
  urlSlug?: string;
};
