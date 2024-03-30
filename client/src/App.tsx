import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

import Home from "@pages/Home";
import Error from "@pages/Error";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "./context/GlobalContext";
import { setupBackendAPI } from "./utils/backendAPI";
import {
  ADD_TO_QUEUE,
  InitialState,
  InteractiveParams,
  SET_BACKEND_API,
  SET_INTERACTIVE_PARAMS,
  SET_IS_ADMIN,
  UPDATE_PLAY_INDEX,
  REMOVE_FROM_QUEUE,
} from "./context/types";
import Search from "./pages/Search";
// import { fetchEventSource } from "@microsoft/fetch-event-source";
import Admin from "./pages/Admin";

const App = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [sseEvent, setSSEevent] = useState<EventSource | null>(null);
  const { backendAPI, hasInteractiveParams } = useContext(GlobalStateContext) as InitialState;
  const [connectionEstablished, setConnectionEstablished] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);
  // const abortController = useRef(new AbortController());

  const interactiveParams = useMemo(() => {
    const assetId = searchParams.get("assetId");
    const displayName = searchParams.get("displayName") as string;
    const interactiveNonce = searchParams.get("interactiveNonce");
    const interactivePublicKey = searchParams.get("interactivePublicKey");
    const profileId = searchParams.get("profileId") as string;
    const sceneDropId = searchParams.get("sceneDropId") as string;
    const uniqueName = searchParams.get("uniqueName") as string;
    const urlSlug = searchParams.get("urlSlug") as string;
    const username = searchParams.get("username") as string;
    const visitorId = searchParams.get("visitorId");

    const isInteractiveIframe =
      visitorId !== null && interactiveNonce !== null && interactivePublicKey !== null && assetId !== null;

    return {
      assetId,
      displayName,
      isInteractiveIframe,
      interactiveNonce,
      interactivePublicKey,
      profileId,
      sceneDropId,
      uniqueName,
      urlSlug,
      username,
      visitorId,
    };
  }, [searchParams]);

  const setInteractiveParams = useCallback(
    ({
      assetId,
      displayName,
      interactiveNonce,
      interactivePublicKey,
      profileId,
      sceneDropId,
      uniqueName,
      urlSlug,
      username,
      visitorId,
    }: InteractiveParams) => {
      const isInteractiveIframe = visitorId && interactiveNonce && interactivePublicKey && assetId;
      dispatch!({
        type: SET_INTERACTIVE_PARAMS,
        payload: {
          assetId,
          displayName,
          interactiveNonce,
          interactivePublicKey,
          isInteractiveIframe,
          profileId,
          sceneDropId,
          uniqueName,
          urlSlug,
          username,
          visitorId,
        },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    if (interactiveParams.assetId && interactiveParams.isInteractiveIframe) {
      setInteractiveParams({
        ...interactiveParams,
      });
    }
  }, [interactiveParams, setInteractiveParams]);

  
  const setupBackend = useCallback(async () => {
    const setupResult = await setupBackendAPI(interactiveParams);
    if (!setupResult.success) {
      navigate("*");
      return;
    } else {
      dispatch!({ type: SET_BACKEND_API, payload: { backendAPI: setupResult.backendAPI } });
    }
  }, [dispatch, interactiveParams, navigate]);
  
  useEffect(() => {
    if (!backendAPI) {
      setupBackend();
    }
  }, [backendAPI, setupBackend]);

  useEffect(() => {
    if (hasInteractiveParams && !connectionEstablished) {
      console.log("Establishing SSE connection...");
      const events = new EventSource(
        `/api/sse?assetId=${interactiveParams.assetId}&visitorId=${interactiveParams.visitorId}&interactiveNonce=${interactiveParams.interactiveNonce}&interactivePublicKey=${interactiveParams.interactivePublicKey}&profileId=${interactiveParams.profileId}&urlSlug=${interactiveParams.urlSlug}`,
      );
      setSSEevent(events);
      setConnectionEstablished(true);
    }
  }, [hasInteractiveParams, connectionEstablished, interactiveParams, dispatch]);

  useEffect(() => {
    if (sseEvent) {
      sseEvent.onmessage = (event) => {
        const sse = JSON.parse(event.data);
        if (sse.kind === "nowPlaying") {
          const nowPlaying = sse.data;
          dispatch!({
            type: UPDATE_PLAY_INDEX,
            payload: { currentPlayIndex: nowPlaying.currentPlayIndex },
          });
        } else if (sse.kind === "addedToQueue") {
          const videos = sse.videos;
          dispatch!({
            type: ADD_TO_QUEUE,
            payload: { videos },
          });
        } else if (sse.kind === "removedFromQueue") {
          const videoIds = sse.videoIds;
          dispatch!({
            type: REMOVE_FROM_QUEUE,
            payload: { videoIds },
          });
        }
      };
    }
  }, [sseEvent]);
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        if (backendAPI) {
          await backendAPI.post("/heartbeat", {});
        }
      } catch (error) {
        console.error("Error sending heartbeat:", error);
      }
    };

    const getIsAdmin = async () => {
      if (backendAPI) {
        const { data } = await backendAPI.get("/is-admin");
        dispatch!({ type: SET_IS_ADMIN, payload: { isAdmin: data.isAdmin } });
      }
    };

    getIsAdmin();

    const intervalId = setInterval(sendHeartbeat, 1000 * 60 * 5);
    return () => clearInterval(intervalId);
  }, [backendAPI, dispatch]);

  return (
    <div className="flex flex-col p-4 items-center justify-center w-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/admin" element={<Admin />} />

        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
};

export default App;
