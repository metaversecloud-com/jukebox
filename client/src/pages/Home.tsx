import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { fetchCatalog, playVideo } from "@/context/actions";
import {
  InitialState,
  InteractiveParams,
  SET_CATALOG,
  SET_CATALOG_LOADING,
  SET_CURRENT_MEDIA,
  Video,
} from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { AxiosInstance } from "axios";

const Home = () => {
  const { hasInteractiveParams, catalog, currentPlayIndex, catalogLoading, interactiveParams, nowPlaying, backendAPI } =
    useContext(GlobalStateContext) as InitialState;

  const dispatch = useContext(GlobalDispatchContext);

  const [currentVideo, setCurrentVideo] = useState<Video>({
    id: { videoId: "" },
    snippet: { title: "", publishedAt: "", thumbnails: { high: { url: "" } } },
    duration: 0,
  });

  const handlePlayVideo = async (videoId: string) => {
    await playVideo(backendAPI as AxiosInstance, videoId);
  };

  useEffect(() => {
    async function loadCatalog() {
      dispatch!({ type: SET_CATALOG_LOADING, payload: { catalogLoading: true } });
      const { currentPlayIndex, media } = await fetchCatalog(backendAPI as AxiosInstance);
      dispatch!({ type: SET_CATALOG, payload: { catalog: media, currentPlayIndex } });
    }

    if (hasInteractiveParams && !catalogLoading && catalog[0].id.videoId === "" && backendAPI !== null) {
      loadCatalog();
    }
  }, [hasInteractiveParams, dispatch, catalogLoading, catalog, backendAPI]);

  useEffect(() => {
    if (catalog && catalog.length > 0) {
      setCurrentVideo(catalog[currentPlayIndex]);
    }
  }, [catalog, currentPlayIndex]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchEventSource(`${import.meta.env.VITE_API_URL}/api/sse`, {
        method: "POST",
        headers: {
          "Accept": "text/event-stream",
          "Content-Type": "application/json",
        },
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
    if (hasInteractiveParams && interactiveParams !== null) {
      fetchData();
    }
  }, [hasInteractiveParams, interactiveParams, dispatch]);

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
    </>
  );
};

export default Home;
