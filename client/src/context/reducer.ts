import {
  ActionType,
  InitialState,
  RESET_SEARCH_RESULTS,
  SET_CATALOG,
  SET_CATALOG_LOADING,
  SET_INTERACTIVE_PARAMS,
  SET_SEARCH_LOADING,
  SET_SEARCH_RESULTS,
  SET_SEARCH_STATUS,
} from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        ...payload,
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
        catalogLoading: false,
        catalogStatus: "SUCCESS",
      };
    case SET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: [...state.searchResults, ...payload.searchResults],
        searchLoading: false,
        searchStatus: "SUCCESS",
        nextPageToken: payload.newNextPageToken,
      };
    case RESET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: [],
        nextPageToken: "",
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
