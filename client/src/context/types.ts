export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_SEARCH_RESULTS = "SET_SEARCH_RESULTS";
export const SET_SEARCH_LOADING = "SET_SEARCH_LOADING";
export const SET_SEARCH_STATUS = "SET_SEARCH_STATUS";
export const RESET_SEARCH_RESULTS = "RESET_SEARCH_RESULTS";
export const SET_CATALOG = "SET_CATALOG";
export const SET_CATALOG_LOADING = "SET_CATALOG_LOADING";
export const SET_CATALOG_STATUS = "SET_CATALOG_STATUS";

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
  currentPlayIndex: number;
  searchResults: Video[];
  searchLoading: boolean;
  searchStatus: string;
  catalogLoading: boolean;
  catalogStatus: string;
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
  },
  duration: string;
}