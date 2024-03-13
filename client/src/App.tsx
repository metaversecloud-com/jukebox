import { Route, Routes, useSearchParams } from "react-router-dom";

import Home from "@pages/Home";
import Error from "@pages/Error";
import { useCallback, useContext, useEffect, useMemo } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "./context/GlobalContext";
import { setupBackendAPI } from "./utils/backendAPI";
import { InitialState, InteractiveParams, SET_BACKEND_API, SET_INTERACTIVE_PARAMS } from "./context/types";
import Search from "./pages/Search";

const App = () => {
  const [searchParams] = useSearchParams();

  const { backendAPI } = useContext(GlobalStateContext) as InitialState;
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
