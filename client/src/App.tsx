import { Route, Routes, useSearchParams } from "react-router-dom";

import Home from "@pages/Home";
import Error from "@pages/Error";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "./context/GlobalContext";
import { setupBackendAPI } from "./utils/backendAPI";
import {
  InitialState,
  InteractiveParams,
  SET_BACKEND_API,
  SET_CURRENT_MEDIA,
  SET_INTERACTIVE_PARAMS,
  UPDATE_PLAY_INDEX,
} from "./context/types";
import Search from "./pages/Search";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const App = () => {
  const [searchParams] = useSearchParams();

  const { backendAPI, hasInteractiveParams, catalog } = useContext(GlobalStateContext) as InitialState;
  const [connectionEstablished, setConnectionEstablished] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);
  // const abortController = useRef(new AbortController());
  // const [lastHeartbeatTime, setLastHeartbeatTime] = useState(Date.now());

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
      // onopen(response) {
      //   console.log("Connection opened");
      //   if (response.ok && response.status === 200) {
      //     console.log("Connection made ", response);
      //   } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      //     console.log("Client side error ", response);
      //   }
      // },
      onmessage(event) {
        // console.log("EVENT", event.data);
        const nowPlaying = JSON.parse(event.data);
        console.log("RECEIVED EVENT", nowPlaying);
        if (nowPlaying.currentPlayIndex !== undefined) {
          console.log("NEXT SONG WEBHOOK");
          // const newMedia = catalog[nowPlaying.currentPlayIndex];
          dispatch!({ type: UPDATE_PLAY_INDEX, payload: { currentPlayIndex: nowPlaying.currentPlayIndex, fromTrack: true } });
          // dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying: newMedia } });
        } else {
          console.log("MANUAL NEW SONG");
          dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying, fromTrack: false } });
        }
      },
      // onclose() {
      //   console.log("Connection closed by the server");
      // },
      // onerror(err) {
      //   console.log("There was an error from server", err);
      // },
    });
  }, [interactiveParams, dispatch]);

  useEffect(() => {
    // const controller = new AbortController();

    if (hasInteractiveParams && !connectionEstablished) {
      console.log("Establishing connection...");
      fetchData();
      setConnectionEstablished(true);
    }
  }, [hasInteractiveParams, interactiveParams, connectionEstablished, fetchData, dispatch]);

  // useEffect(() => {
  //   let controller = abortController.current;
  //   return () => {
  //       console.log("Aborting...");
  //       controller.abort();
  //   };
  // }, []);

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        if (backendAPI) {
          await backendAPI.post("/heartbeat", {});
          // setLastHeartbeatTime(Date.now());
        }
      } catch (error) {
        console.error("Error sending heartbeat:", error);
      }
    };

    const intervalId = setInterval(sendHeartbeat, 1000 * 60 * 5);
    return () => clearInterval(intervalId);
  }, [backendAPI]);

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
