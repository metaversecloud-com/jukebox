import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { playVideo } from "@/context/actions";
import { InitialState, UPDATE_PLAY_INDEX, Video } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext, useState } from "react";
import { AxiosInstance } from "axios";

const Home: React.FC = () => {
  const { catalog, catalogLoading, nowPlaying, backendAPI, currentPlayIndex, isAdmin } =
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

  return (
    <>
      <Header showAdminControls={isAdmin} />
      <div className="flex flex-col w-full justify-start">
        {nowPlaying && nowPlaying.id.videoId !== "" && (
          <>
            <p className="p1 !font-semibold">Now Playing: </p>
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
        {catalog.length > 0 && (
          <>
            <p className="p1 !font-semibold mb-2">Next Up: </p>
            {(() => {
              const queue =
                nowPlaying && currentPlayIndex !== -1
                  ? catalog.slice(currentPlayIndex + 1).concat(catalog.slice(0, currentPlayIndex))
                  : catalog;
              return queue.map((video, i) => (
                <div key={`${video.id.videoId}-${i}-div`} className="my-2">
                  <VideoInfoTile
                    isLoading={catalogLoading}
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
          </>
        )}
      </div>
    </>
  );
};

export default Home;
