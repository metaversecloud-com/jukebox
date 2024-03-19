import { skeleton } from "./constants";
import {
  ActionType,
  GENERATE_SKELETON,
  InitialState,
  RESET_SEARCH_RESULTS,
  SET_BACKEND_API,
  SET_CATALOG,
  SET_CATALOG_LOADING,
  SET_CURRENT_MEDIA,
  SET_INTERACTIVE_PARAMS,
  SET_NEXT_PAGE_LOADING,
  SET_SEARCH_LOADING,
  SET_SEARCH_RESULTS,
  SET_SEARCH_STATUS,
  UPDATE_PLAY_INDEX
} from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        interactiveParams: { ...payload },
        hasInteractiveParams: true,
      };
    case SET_SEARCH_LOADING:
      return {
        ...state,
        searchLoading: payload.searchLoading,
      };
    case SET_CATALOG_LOADING:
      return {
        ...state,
        catalogLoading: payload.catalogLoading,
      };
    case SET_SEARCH_STATUS:
      return {
        ...state,
        searchStatus: payload.searchStatus,
      };
    case SET_CATALOG:
      return {
        ...state,
        catalog: payload.catalog,
        currentPlayIndex: payload.currentPlayIndex,
        fromTrack: payload.fromTrack,
        nowPlaying: payload.nowPlaying,
        catalogLoading: false,
        catalogStatus: "SUCCESS",
      };
    case SET_BACKEND_API:
      return {
        ...state,
        backendAPI: payload.backendAPI,
      };
    case SET_NEXT_PAGE_LOADING:
      return {
        ...state,
        nextPageLoading: payload.nextPageLoading,
      };
    case SET_SEARCH_RESULTS:
      let searchResults = state.searchResults;
      if (state.searchResults[0].id.videoId === "") {
        searchResults = [];
      }
      return {
        ...state,
        searchResults: [...searchResults, ...payload.searchResults],
        searchLoading: false,
        nextPageLoading: false,
        searchStatus: "SUCCESS",
        nextPageToken: payload.newNextPageToken,
      };
    case SET_CURRENT_MEDIA:
      return {
        ...state,
        nowPlaying: payload.nowPlaying,
      };
    case GENERATE_SKELETON:
      return {
        ...state,
        searchResults: skeleton,
      };
    case RESET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: [],
        nextPageToken: "",
      };
    case UPDATE_PLAY_INDEX: 
      return {
        ...state,
        currentPlayIndex: payload.currentPlayIndex,
        nowPlaying: state.catalog[payload.currentPlayIndex],
        fromTrack: payload.fromTrack,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
