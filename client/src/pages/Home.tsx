import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { removeFromQueue } from "@/context/actions";
import { InitialState, REMOVE_FROM_QUEUE } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const { catalog, jukeboxLoading, nowPlaying, isAdmin, queue, backendAPI } = useContext(
    GlobalStateContext,
  ) as InitialState;

  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleRemoveFromQueue = async () => {
    setRemoveLoading(true);
    const toRemoveIds = catalog
      .filter((video) => selectedVideos.includes(video.id.videoId))
      .map((video) => video.id.videoId);
    const result = await removeFromQueue(backendAPI!, toRemoveIds);
    if (result && result.success) {
      dispatch!({ type: REMOVE_FROM_QUEUE, payload: { videoIds: toRemoveIds } });
      setSelectedVideos([]);
    }
    setRemoveLoading(false);
  };

  return (
    <div className="flex flex-col w-full h-full pb-6">
      <Header showAdminControls={isAdmin} />
      <div className="flex flex-col w-full justify-start">
        {nowPlaying.id.videoId !== "" && (
          <>
            <p className="p1 !font-semibold">Now Playing: </p>
            <div className="my-4">
              <VideoInfoTile
                isLoading={jukeboxLoading}
                videoId={nowPlaying.id.videoId}
                videoName={nowPlaying.snippet.title}
                videoDuration={convertMillisToMinutes(nowPlaying.duration)}
                thumbnail={nowPlaying.snippet.thumbnails.high.url}
              ></VideoInfoTile>
            </div>
          </>
        )}
        {queue.length > 0 && (
          <>
            <p className="p1 !font-semibold mb-2">Next Up: </p>

            {queue.map((video, i) => (
              <div key={`${video.id.videoId}-${i}-div`} className="my-2">
                <VideoInfoTile
                  isLoading={jukeboxLoading}
                  videoId={video.id.videoId}
                  videoName={video.snippet.title}
                  videoDuration={convertMillisToMinutes(video.duration)}
                  thumbnail={video.snippet.thumbnails.high.url}
                  videoInSelected={selectedVideos.find((v) => v === video.id.videoId) ? true : false}
                  showControls={
                    jukeboxLoading || !isAdmin
                      ? false
                      : {
                          plusminus:
                            selectedVideos.find((v) => v === video.id.videoId)
                              ? "plus"
                              : "minus",
                        }
                  }
                  addVideo={(videoId) => {
                    setSelectedVideos([...selectedVideos, videoId]);
                  }}
                  removeVideo={(videoId) => {
                    setSelectedVideos(selectedVideos.filter((v) => v !== videoId));
                  }}
                ></VideoInfoTile>
              </div>
            ))}
          </>
        )}
        {selectedVideos.length > 0 && (
          <button
            disabled={removeLoading}
            onClick={handleRemoveFromQueue}
            className="fixed right-5 bottom-5 btn btn-enhanced !w-fit z-10"
          >
            {!removeLoading ? `Remove (${selectedVideos.length})` : "Removing..."}
          </button>
        )}
        <Link className="btn btn-enhanced my-2 w-full" to={"/add-to-queue"}>
          Add a Song
        </Link>
      </div>
    </div>
  );
};

export default Home;
