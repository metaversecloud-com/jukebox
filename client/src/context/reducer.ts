import {
  ActionType,
  InitialState,
  RESET_CATALOG,
  SET_CATALOG,
  SET_INTERACTIVE_PARAMS,
  SET_SEARCH_LOADING,
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
    case SET_SEARCH_STATUS:
      return {
        ...state,
        searchStatus: payload.searchStatus,
      };
    case SET_CATALOG:
      return {
        ...state,
        catalog: [...state.catalog, ...payload.catalog],
        searchLoading: false,
        searchStatus: "SUCCESS",
        nextPageToken: payload.newNextPageToken,
      };
    case RESET_CATALOG:
      return {
        ...state,
        catalog: [],
        nextPageToken: "",
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
