import { skeleton, videoSample } from "./constants";
import {
  ActionType,
  GENERATE_SKELETON,
  InitialState,
  RESET_SEARCH_RESULTS,
  SET_BACKEND_API,
  SET_CATALOG,
  SET_CATALOG_LOADING,
  SET_INTERACTIVE_PARAMS,
  SET_NEXT_PAGE_LOADING,
  SET_SEARCH_LOADING,
  SET_SEARCH_RESULTS,
  SET_SEARCH_STATUS,
  UPDATE_PLAY_INDEX,
  SET_IS_ADMIN,
  ADD_TO_QUEUE,
  REMOVE_FROM_QUEUE,
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
        nowPlaying: payload.currentPlayIndex !== -1 ? payload.catalog[payload.currentPlayIndex] : videoSample,
        catalogLoading: false,
        catalogStatus: "SUCCESS",
      };
    case SET_IS_ADMIN:
      return {
        ...state,
        isAdmin: payload.isAdmin,
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
      // eslint-disable-next-line no-case-declarations
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
      };
    case ADD_TO_QUEUE:
      // eslint-disable-next-line no-case-declarations
      const catalogWithAddedVideos = state.catalog.slice();
      if (state.currentPlayIndex === -1) {
        catalogWithAddedVideos.push(...payload.videos);
      } else {
        catalogWithAddedVideos.splice(state.currentPlayIndex, 0, ...payload.videos);
      }

      return {
        ...state,
        catalog: catalogWithAddedVideos,
        currentPlayIndex:
          state.currentPlayIndex !== -1 ? state.currentPlayIndex + payload.videos.length : state.currentPlayIndex,
      };
    case REMOVE_FROM_QUEUE:
      // eslint-disable-next-line no-case-declarations
      const filteredCatalog = state.catalog.filter((video) => !payload.videoIds.includes(video.id.videoId));
      return {
        ...state,
        catalog: filteredCatalog,
        currentPlayIndex:
          filteredCatalog.length > 0 && state.currentPlayIndex !== -1
            ? filteredCatalog.findIndex((video) => video.id.videoId === state.nowPlaying.id.videoId)
            : -1,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
