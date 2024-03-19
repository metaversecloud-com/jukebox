import { Route, Routes, useSearchParams } from "react-router-dom";

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
  SET_CURRENT_MEDIA,
  SET_INTERACTIVE_PARAMS,
  SET_IS_ADMIN,
  UPDATE_PLAY_INDEX,
} from "./context/types";
import Search from "./pages/Search";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const App = () => {
  const [searchParams] = useSearchParams();

  const { backendAPI, hasInteractiveParams, } = useContext(GlobalStateContext) as InitialState;
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

  useEffect(() => {
    if (!backendAPI) {
      const API = setupBackendAPI(interactiveParams);
      dispatch!({ type: SET_BACKEND_API, payload: { backendAPI: API } });
    }
  }, [backendAPI, interactiveParams, dispatch]);

  const fetchData = useCallback(async () => {
    await fetchEventSource(`${import.meta.env.VITE_API_URL}/api/sse`, {
      method: "POST",
      headers: {
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
      },
      // signal: abortController.current.signal,
      body: JSON.stringify({
        assetId: interactiveParams?.assetId,
        displayName: interactiveParams?.displayName,
        interactiveNonce: interactiveParams?.interactiveNonce,
        interactivePublicKey: interactiveParams?.interactivePublicKey,
        isInteractiveIframe: interactiveParams?.isInteractiveIframe,
        profileId: interactiveParams?.profileId,
        sceneDropId: interactiveParams?.sceneDropId,
        uniqueName: interactiveParams?.uniqueName,
        urlSlug: interactiveParams?.urlSlug,
        username: interactiveParams?.username,
        visitorId: interactiveParams?.visitorId,
      }),
      onmessage(event) {
        const sse = JSON.parse(event.data);
        if (sse.kind === "nowPlaying") {
          const nowPlaying = sse.data.video;
          if (nowPlaying.currentPlayIndex !== undefined) {
            dispatch!({
              type: UPDATE_PLAY_INDEX,
              payload: { currentPlayIndex: nowPlaying.currentPlayIndex, fromTrack: true },
            });
          } else {
            dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying, fromTrack: false } });
          }
        } else if (sse.kind === "addedToQueue") {
          const videos = sse.videos;
          dispatch!({
            type: ADD_TO_QUEUE,
            payload: { videos },
          });
        }
      }
    });
  }, [interactiveParams, dispatch]);

  useEffect(() => {
    if (hasInteractiveParams && !connectionEstablished) {
      console.log("Establishing connection...");
      fetchData();
      setConnectionEstablished(true);
    }
  }, [hasInteractiveParams, interactiveParams, connectionEstablished, fetchData, dispatch]);

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
        console.log("IS AMDIN", data.isAdmin);
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
        
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
};

export default App;
