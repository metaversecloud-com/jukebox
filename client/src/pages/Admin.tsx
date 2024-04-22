import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { removeFromCatalog } from "@/context/actions";
import { InitialState, REMOVE_FROM_CATALOG } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { AxiosInstance } from "axios";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";

const Admin = () => {
  
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [removeLoading, setRemoveLoading] = useState(false);

  const { backendAPI, catalog, isAdmin } = useContext(GlobalStateContext) as InitialState;

  const dispatch = useContext(GlobalDispatchContext);

  const handleRemoveFromCatalog = async () => {
    setRemoveLoading(true);
    const res = await removeFromCatalog(backendAPI as AxiosInstance, selectedVideoIds);
    if (res && res.success) {
      setSelectedVideoIds([]);
      dispatch!({
        type: REMOVE_FROM_CATALOG,
        payload: { videoIds: selectedVideoIds },
      });
    }
    setRemoveLoading(false);
  };
  return (
    <>
      <Header showAdminControls={isAdmin} />
      <div className="flex flex-col w-full justify-start items-center pb-12">
        <h3 className="h3 self-start !mt-6 !mb-4">Catalog</h3>
        {selectedVideoIds.length > 0 && (
          <button
            disabled={removeLoading}
            onClick={handleRemoveFromCatalog}
            className="fixed right-5 bottom-5 btn btn-enhanced !w-fit z-10"
          >
            {!removeLoading ? `Remove (${selectedVideoIds.length})` : "Removing..."}
          </button>
        )}
        {catalog.length === 0 ? (
          <p className="text-start mb-2 w-full">No songs added</p>
        ) : (
          <div className="flex flex-col w-full justify-start items-center">
            {catalog.map((video, i) => (
              <div key={`${video.id.videoId}-${i}-tile`} className="my-2 w-full">
                <VideoInfoTile
                  isLoading={false}
                  videoId={video.id.videoId}
                  videoName={video.snippet.title}
                  videoDuration={convertMillisToMinutes(video.duration)}
                  thumbnail={video.snippet.thumbnails.high.url}
                  videoInSelected={selectedVideoIds.find((v) => v === video.id.videoId) ? true : false}
                  showControls={{
                    plusminus:
                      selectedVideoIds.length > 0 && selectedVideoIds.find((v) => v === video.id.videoId)
                        ? "plus"
                        : "minus",
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
        <Link className="btn btn-enhanced my-2 w-full" to={"/search"}>
          Add a Song
        </Link>
      </div>
    </>
  );
};

export default Admin;
