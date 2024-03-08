import { Route, Routes, useSearchParams } from "react-router-dom";

import Home from "@pages/Home";
import Error from "@pages/Error";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GlobalDispatchContext } from "./context/GlobalContext";
import { setupBackendAPI } from "./utils/backendAPI";
import { InteractiveParams, SET_INTERACTIVE_PARAMS } from "./context/types";
import Search from "./pages/Search";

const App = () => {
  const [searchParams] = useSearchParams();
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

  const interactiveParams = useMemo(() => {
    return {
      assetId: searchParams.get("assetId"),
      displayName: searchParams.get("displayName"),
      interactiveNonce: searchParams.get("interactiveNonce"),
      interactivePublicKey: searchParams.get("interactivePublicKey"),
      profileId: searchParams.get("profileId"),
      sceneDropId: searchParams.get("sceneDropId"),
      uniqueName: searchParams.get("uniqueName"),
      urlSlug: searchParams.get("urlSlug"),
      username: searchParams.get("username"),
      visitorId: searchParams.get("visitorId"),
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
    if (interactiveParams.assetId) {
      // TODO: Remove ts-ignore
      // @ts-ignore
      setInteractiveParams({
        ...interactiveParams,
      });
    }
  }, [interactiveParams, setInteractiveParams]);

  useEffect(() => {
    if (!hasInitBackendAPI) {
      setupBackendAPI(interactiveParams);
      setHasInitBackendAPI(true);
    }
  }, [hasInitBackendAPI, interactiveParams]);

  return (
    <div className="w-full p-6 flex items-center justify-start">
      <div className="flex flex-col items-center justify-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />

          <Route path="*" element={<Error />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
