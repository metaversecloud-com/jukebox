import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { fetchCatalog, playVideo } from "@/context/actions";
import { InitialState, SET_CATALOG, SET_CATALOG_LOADING, SET_CURRENT_MEDIA, Video } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AxiosInstance } from "axios";

const Home = () => {
  const { hasInteractiveParams, catalog, catalogLoading, nowPlaying, backendAPI, currentPlayIndex } = useContext(
    GlobalStateContext,
  ) as InitialState;

  const dispatch = useContext(GlobalDispatchContext);

  const handlePlayVideo = async (videoId: string) => {
    const video = catalog.find((video) => video.id.videoId === videoId) as Video;
    const res = await playVideo(backendAPI as AxiosInstance, video);
    if (res) {
      dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying: video } });
    }
  };

  useEffect(() => {
    async function loadCatalog() {
      dispatch!({ type: SET_CATALOG_LOADING, payload: { catalogLoading: true } });
      const { currentPlayIndex, media, currentPlayingMedia } = await fetchCatalog(backendAPI as AxiosInstance);
      dispatch!({ type: SET_CATALOG, payload: { catalog: media, currentPlayIndex, nowPlaying: currentPlayingMedia } });
    }

    if (hasInteractiveParams && !catalogLoading && catalog[0].id.videoId === "" && backendAPI !== null) {
      loadCatalog();
    }
  }, [hasInteractiveParams, dispatch, catalogLoading, catalog, backendAPI]);

  return (
    <>
      <Header />
      <div className="flex flex-col w-full justify-start">
        <p className="p1 font-semibold">Now Playing: </p>
        <div className="my-4">
          <VideoInfoTile
            isLoading={catalogLoading}
            videoId={nowPlaying.id.videoId}
            videoName={nowPlaying.snippet.title}
            videoDuration={convertMillisToMinutes(nowPlaying.duration)}
            thumbnail={nowPlaying.snippet.thumbnails.high.url}
            // showControls
            // playVideo={handlePlayVideo}
          ></VideoInfoTile>
        </div>
        <p className="p1 font-semibold">Next Up: </p>
        {(() => {
          const queue = catalog.slice(currentPlayIndex + 1).concat(catalog.slice(0, currentPlayIndex));
          return queue.map((video, i) => (
            <div key={i} className="my-4">
              <VideoInfoTile
                isLoading={catalogLoading}
                key={`${video.id.videoId}${i}`}
                videoId={video.id.videoId}
                videoName={video.snippet.title}
                videoDuration={convertMillisToMinutes(video.duration)}
                thumbnail={video.snippet.thumbnails.high.url}
                showControls={!catalogLoading}
                playVideo={handlePlayVideo}
              ></VideoInfoTile>
            </div>
          ));
        })()}
      </div>
      <Link className="btn btn-enhanced w-full my-2" to={"/search"}>
        Add a Song
      </Link>
    </>
  );
};

export default Home;
