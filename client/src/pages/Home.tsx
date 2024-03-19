import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { fetchCatalog, playVideo } from "@/context/actions";
import { InitialState, SET_CATALOG, SET_CATALOG_LOADING, SET_CURRENT_MEDIA, Video } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosInstance } from "axios";
import CircularLoader from "@/components/CircularLoader";

const Home = () => {
  const {
    hasInteractiveParams,
    catalog,
    catalogLoading,
    nowPlaying,
    backendAPI,
    currentPlayIndex,
    fromTrack,
    isAdmin,
  } = useContext(GlobalStateContext) as InitialState;

  const [playLoading, setPlayLoading] = useState(false);
  const dispatch = useContext(GlobalDispatchContext);

  const handlePlayVideo = async (videoId: string) => {
    setPlayLoading(true);
    const video = catalog.find((video) => video.id.videoId === videoId) as Video;
    const res = await playVideo(backendAPI as AxiosInstance, video, true);
    if (res) {
      dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying: video } });
    }
    setPlayLoading(false);
  };

  useEffect(() => {
    async function loadCatalog() {
      dispatch!({ type: SET_CATALOG_LOADING, payload: { catalogLoading: true } });
      const { currentPlayIndex, media, currentPlayingMedia, fromTrack } = await fetchCatalog(
        backendAPI as AxiosInstance,
      );
      dispatch!({
        type: SET_CATALOG,
        payload: { catalog: media, currentPlayIndex, nowPlaying: currentPlayingMedia, fromTrack },
      });
    }

    if (
      hasInteractiveParams &&
      !catalogLoading &&
      catalog.length > 0 &&
      catalog[0].id.videoId === "" &&
      backendAPI !== null
    ) {
      loadCatalog();
    }
  }, [hasInteractiveParams, dispatch, catalogLoading, catalog, backendAPI]);

  return (
    <>
      {playLoading && (
        <>
          <div className="backdrop-brightness-90 blur-sm fixed top-0 z-10 w-full h-full"></div>
          <div className="fixed top-0 z-10 flex w-full h-full justify-center items-center select-none">
            <CircularLoader />
          </div>
        </>
      )}
      <Header />
      <div className="flex flex-col w-full justify-start">
        {nowPlaying && (
          <>
            <p className="p1 font-semibold">Now Playing: </p>
            <div className="my-4">
              <VideoInfoTile
                isLoading={catalogLoading}
                videoId={nowPlaying.id.videoId}
                videoName={nowPlaying.snippet.title}
                videoDuration={convertMillisToMinutes(nowPlaying.duration)}
                thumbnail={nowPlaying.snippet.thumbnails.high.url}
              ></VideoInfoTile>
            </div>
          </>
        )}
        <p className="p1 font-semibold">Next Up: </p>
        {(() => {
          const queue = nowPlaying
            ? (() => {
                let offset = 1;
                if (fromTrack === false) {
                  offset = 0;
                }
                return catalog.slice(currentPlayIndex + offset).concat(catalog.slice(0, currentPlayIndex));
              })()
            : catalog;
          return queue.map((video, i) => (
            <div key={i} className="my-4">
              <VideoInfoTile
                isLoading={catalogLoading}
                key={`${video.id.videoId}${i}`}
                videoId={video.id.videoId}
                videoName={video.snippet.title}
                videoDuration={convertMillisToMinutes(video.duration)}
                thumbnail={video.snippet.thumbnails.high.url}
                showControls={
                  !catalogLoading && isAdmin
                    ? {
                        play: true,
                        plusminus: false,
                      }
                    : false
                }
                playVideo={handlePlayVideo}
              ></VideoInfoTile>
            </div>
          ));
        })()}
      </div>
      {isAdmin && (
        <Link className="btn btn-enhanced w-full my-2" to={"/search"}>
          Add a Song
        </Link>
      )}
    </>
  );
};

export default Home;
