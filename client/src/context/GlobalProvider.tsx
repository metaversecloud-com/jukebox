import { useReducer } from "react";
import { globalReducer } from "./reducer";
import { InitialState } from "./types";
import GlobalState from "./GlobalState";
import { skeleton, videoSample } from "./constants";

const initialState: InitialState = {
  catalog: skeleton,
  queue: skeleton,
  isAdmin: false,
  nowPlaying: videoSample,
  searchResults: [],
  nextPageToken: "",
  searchLoading: false,
  nextPageLoading: false,
  searchStatus: "",
  jukeboxLoading: true,
  jukeboxStatus: "waiting",
  hasInteractiveParams: false,
  interactiveParams: null,
  backendAPI: null,
  searchTermGlobal: '',
};

const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return (
    <GlobalState initialState={state} dispatch={dispatch}>
      {children}
    </GlobalState>
  );
};

export default GlobalProvider;
