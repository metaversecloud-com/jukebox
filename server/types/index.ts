export type Credentials = {
  assetId?: string;
  interactivePublicKey: string;
  interactiveNonce: string;
  urlSlug: string;
  visitorId: string;
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
