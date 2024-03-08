export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_CATALOG = "SET_CATALOG";

export type InteractiveParams = {
  assetId: string | null;
  displayName: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export interface InitialState {
  catalog: Video[];
  nextPageToken: string;
  hasInteractiveParams: boolean;
  selectedWorld: { [key: string]: any };
  urlSlug: string;
}

export type ActionType = {
  type: string;
  payload?: any;
};

export type Video = {
  id: {
    videoId: string;
  },
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      high: {
        url: string;
      }
    }
  }
}