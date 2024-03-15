import { Route, Routes, useSearchParams } from "react-router-dom";

import Home from "@pages/Home";
import Error from "@pages/Error";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      await fetchEventSource(`${import.meta.env.VITE_API_URL}/api/sse`, {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
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
        onopen(res) {
          if (res.ok && res.status === 200) {
            console.log("Connection made ", res);
          } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            console.log("Client side error ", res);
          }
        },
        onmessage(event) {
          // console.log("EVENT", event.data);
          const nowPlaying = JSON.parse(event.data);
          console.log("RECEIVED EVENT", nowPlaying);
          if (nowPlaying.currentPlayIndex !== undefined) {
            console.log("NEXT SONG WEBHOOK");
            // const newMedia = catalog[nowPlaying.currentPlayIndex];
            dispatch!({ type: UPDATE_PLAY_INDEX, payload: { currentPlayIndex: nowPlaying.currentPlayIndex } });
            // dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying: newMedia } });
          } else {
            console.log("MANUAL NEW SONG");
            dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying } });
          }
        },
        onclose() {
          console.log("Connection closed by the server");
        },
        onerror(err) {
          console.log("There was an error from server", err);
        },
      });
    };

    if (hasInteractiveParams && interactiveParams !== null && !connectionEstablished) {
      console.log("Establishing connection...");
      setConnectionEstablished(true);
      fetchData();
    }

    return () => {
      console.log("Bye Bye");
      if (connectionEstablished) {
        console.log("Aborting...");
        controller.abort();
      }
    };
  }, [hasInteractiveParams, interactiveParams, connectionEstablished, dispatch]);

  return (
    <div className="flex flex-col p-6 items-center justify-center w-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />

        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
};

export default App;
