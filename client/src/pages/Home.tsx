import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { fetchCatalog, playVideo } from "@/context/actions";
import { InitialState, SET_CATALOG, SET_CATALOG_LOADING, UPDATE_PLAY_INDEX, Video } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosInstance } from "axios";

const Home: React.FC = () => {
  const { hasInteractiveParams, catalog, catalogLoading, nowPlaying, backendAPI, currentPlayIndex, isAdmin } =
    useContext(GlobalStateContext) as InitialState;

  const [playLoadingIndex, setPlayLoadingIndex] = useState<number>(-1);

  const dispatch = useContext(GlobalDispatchContext);

  const handlePlayVideo = async (videoId: string) => {
    const video = catalog.find((video) => video.id.videoId === videoId) as Video;
    const idx = catalog.findIndex((video) => video.id.videoId === videoId);
    setPlayLoadingIndex(idx);
    const res = await playVideo(backendAPI as AxiosInstance, video.id.videoId);
    if (res) {
      dispatch!({
        type: UPDATE_PLAY_INDEX,
        payload: { currentPlayIndex: idx },
      });
    }
    setPlayLoadingIndex(-1);
  };

  useEffect(() => {
    async function loadCatalog() {
      dispatch!({ type: SET_CATALOG_LOADING, payload: { catalogLoading: true } });
      const { currentPlayIndex, media } = await fetchCatalog(backendAPI as AxiosInstance);
      dispatch!({
        type: SET_CATALOG,
        payload: { catalog: media, currentPlayIndex, nowPlaying: media[currentPlayIndex] },
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
      {/* {playLoading && (
        <>
          <div className="backdrop-brightness-90 blur-sm fixed top-0 z-10 w-full h-full"></div>
          <div className="fixed top-0 z-10 flex w-full h-full justify-center items-center select-none">
            <CircularLoader />
          </div>
        </>
      )} */}
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
            ? catalog.slice(currentPlayIndex + 1).concat(catalog.slice(0, currentPlayIndex))
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
                playLoading={playLoadingIndex === catalog.findIndex((v) => v.id.videoId === video.id.videoId)}
                showControls={
                  !catalogLoading && isAdmin
                    ? {
                        play: true,
                        plusminus: false,
                      }
                    : false
                }
                disabledControls={playLoadingIndex !== -1}
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
