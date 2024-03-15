import { AxiosInstance } from "axios";

export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_SEARCH_RESULTS = "SET_SEARCH_RESULTS";
export const SET_SEARCH_LOADING = "SET_SEARCH_LOADING";
export const SET_SEARCH_STATUS = "SET_SEARCH_STATUS";
export const RESET_SEARCH_RESULTS = "RESET_SEARCH_RESULTS";
export const SET_CATALOG = "SET_CATALOG";
export const SET_CATALOG_LOADING = "SET_CATALOG_LOADING";
export const SET_CATALOG_STATUS = "SET_CATALOG_STATUS";
export const GENERATE_SKELETON = "GENERATE_SKELETON";
export const SET_CURRENT_MEDIA = "SET_CURRENT_MEDIA";
export const SET_NEXT_PAGE_LOADING = "SET_NEXT_PAGE_LOADING";
export const SET_BACKEND_API = "SET_BACKEND_API";
export const UPDATE_PLAY_INDEX = "UPDATE_PLAY_INDEX";

export type InteractiveParams = {
  assetId: string | null;
  displayName: string | null;
  interactiveNonce: string | null;
  interactivePublicKey: string | null;
  isInteractiveIframe: boolean;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string | null;
};

export interface InitialState {
  backendAPI: AxiosInstance | null;
  catalog: Video[];
  nowPlaying: Video;
  currentPlayIndex: number;
  searchResults: Video[];
  searchLoading: boolean;
  searchStatus: string;
  catalogLoading: boolean;
  catalogStatus: string;
  nextPageToken: string;
  nextPageLoading: boolean;
  hasInteractiveParams: boolean;
  interactiveParams: InteractiveParams | null;
  selectedWorld: { [key: string]: any };
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
  duration: number;
}