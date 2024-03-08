import { ActionType, InitialState, SET_CATALOG, SET_INTERACTIVE_PARAMS } from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        ...payload,
        hasInteractiveParams: true,
      };
    case SET_CATALOG:
      return {
        ...state,
        catalog: [...state.catalog, ...payload.catalog],
        nextPageToken: payload.nextPageToken,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
