import { AxiosInstance } from "axios";

export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_SEARCH_RESULTS = "SET_SEARCH_RESULTS";
export const SET_SEARCH_LOADING = "SET_SEARCH_LOADING";
export const SET_SEARCH_STATUS = "SET_SEARCH_STATUS";
export const RESET_SEARCH_RESULTS = "RESET_SEARCH_RESULTS";
export const SET_JUKEBOX = "SET_JUKEBOX";
export const SET_CATALOG_LOADING = "SET_CATALOG_LOADING";
export const SET_CATALOG_STATUS = "SET_CATALOG_STATUS";
export const GENERATE_SKELETON = "GENERATE_SKELETON";
export const SET_NEXT_PAGE_LOADING = "SET_NEXT_PAGE_LOADING";
export const SET_BACKEND_API = "SET_BACKEND_API";
export const UPDATE_PLAYING_SONG = "UPDATE_PLAYING_SONG";
export const SET_IS_ADMIN = "SET_IS_ADMIN";
export const ADD_TO_CATALOG = "ADD_TO_CATALOG";
export const REMOVE_FROM_CATALOG = "REMOVE_FROM_CATALOG";
export const ADD_TO_QUEUE = "ADD_TO_QUEUE";
export const REMOVE_FROM_QUEUE = "REMOVE_FROM_QUEUE";

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
  queue: Video[];
  isAdmin: boolean;
  nowPlaying: Video;
  searchResults: Video[];
  searchLoading: boolean;
  searchStatus: string;
  jukeboxLoading: boolean;
  jukeboxStatus: "waiting" | "success";
  nextPageToken: string;
  nextPageLoading: boolean;
  hasInteractiveParams: boolean;
  interactiveParams: InteractiveParams | null;
  searchTermGlobal: string;
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
  exists?: boolean;
}