import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import Search from "@/components/search";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { fetchCatalog, playVideo } from "@/context/actions";
import { SET_CATALOG, SET_CATALOG_LOADING, SET_CURRENT_MEDIA } from "@/context/types";
import { backendAPI } from "@/utils/backendAPI";
import { convertMillisToMinutes } from "@/utils/duration";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const Home = () => {
  const [droppedAsset, setDroppedAsset] = useState();

  const all = useContext(GlobalStateContext);
  // console.log("GLOBAL", all);
  const {
    hasInteractiveParams,
    catalog,
    currentPlayIndex,
    catalogLoading,
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
    nowPlaying,
  } = all;
  const dispatch = useContext(GlobalDispatchContext);

  const [currentVideo, setCurrentVideo] = useState({
    id: { videoId: "" },
    snippet: { title: "", thumbnails: { high: { url: "" } } },
    duration: "",
  });

  const handleGetDroppedAsset = async () => {
    try {
      const result = await backendAPI.get("/dropped-asset");
      if (result.data.success) {
        setDroppedAsset(result.data.droppedAsset);
      } else return console.log("Error getting data object");
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlayVideo = async (videoId: string) => {
    await playVideo(videoId);
  };

  useEffect(() => {
    async function loadCatalog() {
      dispatch!({ type: SET_CATALOG_LOADING, payload: { catalogLoading: true } });
      const { currentPlayIndex, media } = await fetchCatalog();
      dispatch!({ type: SET_CATALOG, payload: { catalog: media, currentPlayIndex } });
    }

    if (hasInteractiveParams && !catalogLoading && catalog[0].id.videoId === "") {
      loadCatalog();
    }
  }, [hasInteractiveParams, dispatch]);

  useEffect(() => {
    if (catalog && catalog.length > 0) {
      setCurrentVideo(catalog[currentPlayIndex]);
    }
  }, [catalog, currentPlayIndex]);

  // useEffect(() => {
  //   async function establishSSE() {
  //     const response = await backendAPI.get("/sse");
  //     if (response.status === 200) {
  //       const es = new EventSource("/api/sse");
  //       es.onopen = () => console.log(">>> Connection opened!");
  //       es.onerror = (e) => console.log("ERROR!", e);
  //       es.onmessage = (e) => {
  //         console.log(">>>", e.data);
  //       };
  //       return () => es.close();
  //     }
  //   }
  //   establishSSE();
  // }, []);

  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchEventSource(`${import.meta.env.VITE_API_URL}/api/sse`, {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
          dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying } });
          // console.log("NOW PLAYING", nowPlaying);
          setCurrentVideo(nowPlaying);

          // const parsedData = JSON.parse(event.data);
          // setData((data) => [...data, parsedData]);
        },
        onclose() {
          console.log("Connection closed by the server");
        },
        onerror(err) {
          console.log("There was an error from server", err);
        },
      });
    };
    if (hasInteractiveParams) {
      fetchData();
    }
  }, [hasInteractiveParams]);

  // useEffect(() => {
  //   if (nowPlaying) {
  //   }
  // }, [nowPlaying]);

  return (
    <>
      <Header />
      <div className="flex flex-col w-full justify-start">
        <p className="p1 font-semibold">Now Playing: </p>
        <div className="my-4">
          <VideoInfoTile
            isLoading={catalogLoading}
            videoId={currentVideo.id.videoId}
            videoName={currentVideo.snippet.title}
            videoMetaData={convertMillisToMinutes(currentVideo.duration)}
            thumbnail={currentVideo.snippet.thumbnails.high.url}
            // showControls
            // playVideo={handlePlayVideo}
          ></VideoInfoTile>
        </div>
        <p className="p1 font-semibold">Next Up: </p>
        {catalog.map((video, i) => (
          <div key={i} className="my-4">
            <VideoInfoTile
              isLoading={catalogLoading}
              key={`${video.id.videoId}${i}`}
              videoId={video.id.videoId}
              videoName={video.snippet.title}
              videoMetaData={convertMillisToMinutes(video.duration)}
              thumbnail={video.snippet.thumbnails.high.url}
              showControls={!catalogLoading}
              playVideo={handlePlayVideo}
            ></VideoInfoTile>
          </div>
        ))}
      </div>
      <Link className="btn btn-enhanced w-full my-2" to={"/search"}>
        Add a Song
      </Link>
      {/* <h1 className="h2 font-semibold">Server side example using interactive parameters</h1>
        <div className="max-w-screen-lg">
          {!hasInteractiveParams ? (
            <p className="p1 my-4">
              Edit an asset in your world and open the Links page in the Modify Asset drawer and add a link to your
              website or use &quot;http://localhost:3000&quot; for testing locally. You can also add assetId,
              interactiveNonce, interactivePublicKey, urlSlug, and visitorId directly to the URL as search parameters to
              use this feature.
            </p>
          ) : (
            <p className="p1 my-4">Interactive parameters found, nice work!</p>
          )}
        </div>
        <button className="btn w-fit" onClick={handleGetDroppedAsset}>
          Get Dropped Asset Details
        </button>
        {droppedAsset && (
          <div className="flex flex-col w-full items-start">
            <p className="p1 mt-4 mb-2">
              You have successfully retrieved the dropped asset details for {droppedAsset.assetName}!
            </p>
            <img
              className="w-96 h-96 object-cover rounded-2xl my-4"
              alt="preview"
              src={droppedAsset.topLayerURL || droppedAsset.bottomLayerURL}
            />
          </div>
        )} */}

      {/* <Search /> */}
    </>
  );
};

export default Home;
