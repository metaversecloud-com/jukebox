import { skeleton, videoSample } from "./constants";
import {
  ActionType,
  GENERATE_SKELETON,
  InitialState,
  RESET_SEARCH_RESULTS,
  SET_BACKEND_API,
  SET_JUKEBOX,
  SET_CATALOG_LOADING,
  SET_INTERACTIVE_PARAMS,
  SET_NEXT_PAGE_LOADING,
  SET_SEARCH_LOADING,
  SET_SEARCH_RESULTS,
  SET_SEARCH_STATUS,
  SET_IS_ADMIN,
  ADD_TO_CATALOG,
  REMOVE_FROM_CATALOG,
  UPDATE_PLAYING_SONG,
} from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  if (type === SET_INTERACTIVE_PARAMS) {
    return {
      ...state,
      interactiveParams: { ...payload },
      hasInteractiveParams: true,
    };
  } else if (type === SET_SEARCH_LOADING) {
    return {
      ...state,
      searchLoading: payload.searchLoading,
    };
  } else if (type === SET_CATALOG_LOADING) {
    return {
      ...state,
      jukeboxLoading: payload.jukeboxLoading,
    };
  } else if (type === SET_SEARCH_STATUS) {
    return {
      ...state,
      searchStatus: payload.searchStatus,
    };
  } else if (type === SET_JUKEBOX) {
    return {
      ...state,
      catalog: payload.catalog,
      queue: payload.queue,
      nowPlaying: payload.queue[0] ? payload.queue[0] : videoSample,
      jukeboxLoading: false,
      jukeboxStatus: "SUCCESS",
    };
  } else if (type === SET_IS_ADMIN) {
    return {
      ...state,
      isAdmin: payload.isAdmin,
    };
  } else if (type === SET_BACKEND_API) {
    return {
      ...state,
      backendAPI: payload.backendAPI,
    };
  } else if (type === SET_NEXT_PAGE_LOADING) {
    return {
      ...state,
      nextPageLoading: payload.nextPageLoading,
    };
  } else if (type === SET_SEARCH_RESULTS) {
    let searchResults = state.searchResults;
    if (state.searchResults[0].id.videoId === "") {
      searchResults = [];
    }
    return {
      ...state,
      searchResults: [...searchResults, ...payload.searchResults],
      searchLoading: false,
      searchTermGlobal: payload.searchTermGlobal ? payload.searchTermGlobal : state.searchTermGlobal,
      nextPageLoading: false,
      searchStatus: "SUCCESS",
      nextPageToken: payload.newNextPageToken,
    };
  } else if (type === GENERATE_SKELETON) {
    return {
      ...state,
      searchResults: skeleton,
    };
  } else if (type === UPDATE_PLAYING_SONG) {
    if (!payload.nowPlayingId) return { ...state, nowPlaying: videoSample, queue: [] };
    const idx = state.queue.findIndex((v) => v.id.videoId === payload.nowPlayingId);
    return {
      ...state,
      nowPlaying: state.catalog.find((v) => v.id.videoId === payload.nowPlayingId),
      queue: state.queue.slice(idx + 1),
    };
  } else if (type === RESET_SEARCH_RESULTS) {
    return {
      ...state,
      searchResults: [],
      nextPageToken: "",
    };
  } else if (type === ADD_TO_CATALOG) {
    return {
      ...state,
      catalog: [...state.catalog, ...payload.videos],
    };
  } else if (type === REMOVE_FROM_CATALOG) {
    const filteredCatalog = state.catalog.filter((video) => !payload.videoIds.includes(video.id.videoId));
    return {
      ...state,
      catalog: filteredCatalog,
    };
  } else {
    throw new Error(`Unhandled action type: ${type}`);
  }
};

export { globalReducer };
