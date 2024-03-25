import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { removeFromQueue } from "@/context/actions";
import { InitialState, REMOVE_FROM_QUEUE } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { AxiosInstance } from "axios";
import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Admin = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [removeLoading, setRemoveLoading] = useState(false);

  const { backendAPI, catalog, nowPlaying } = useContext(GlobalStateContext) as InitialState;

  const dispatch = useContext(GlobalDispatchContext);

  const handleRemoveFromQueue = async () => {
    setRemoveLoading(true);
    const res = await removeFromQueue(backendAPI as AxiosInstance, selectedVideoIds.filter((videoId) => videoId !== nowPlaying.id.videoId));
    if (res) {
      setSelectedVideoIds([]);
      dispatch!({
        type: REMOVE_FROM_QUEUE,
        // TODO allow removing nowPlaying media
        payload: { videoIds: selectedVideoIds.filter((videoId) => videoId !== nowPlaying.id.videoId) },
      });
    }
    setRemoveLoading(false);
  };
  return (
    <>
      {currentPath !== "/" && (
        <Link to="/" className="p-1 border rounded-full hover:bg-slate-50 self-start">
          <img src="left-arrow.svg" width={20} height={20} />
        </Link>
      )}
      <div className="flex flex-col w-full justify-start items-center">
        {/* <h1 className="h1 self-center">Settings</h1> */}
        <h3 className="h3 self-start mt-6 mb-4">Catalog</h3>
        {selectedVideoIds.length > 0 && (
          <button
            disabled={removeLoading}
            onClick={handleRemoveFromQueue}
            className="fixed right-5 bottom-5 btn btn-enhanced w-fit z-10"
          >
            {!removeLoading ? `Remove (${selectedVideoIds.length})` : "Removing..."}
          </button>
        )}
        {catalog.length === 0 ? (
          <p>No videos added</p>
        ) : (
          <div className="flex flex-col w-full justify-start items-center">
            {catalog.map((video, i) => (
              <div key={`${video.id.videoId}-${i}-tile`} className="my-4">
                <VideoInfoTile
                  isLoading={false}
                  videoId={video.id.videoId}
                  videoName={video.snippet.title}
                  videoDuration={convertMillisToMinutes(video.duration)}
                  thumbnail={video.snippet.thumbnails.high.url}
                  showControls={{
                    plusminus:
                      selectedVideoIds.length > 0 && selectedVideoIds.find((v) => v === video.id.videoId)
                        ? "minus"
                        : "plus",
                    play: false,
                  }}
                  addVideo={(videoId) => {
                    setSelectedVideoIds([...selectedVideoIds, videoId]);
                  }}
                  removeVideo={(videoId) => {
                    setSelectedVideoIds(selectedVideoIds.filter((v) => v !== videoId));
                  }}
                ></VideoInfoTile>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Admin;
