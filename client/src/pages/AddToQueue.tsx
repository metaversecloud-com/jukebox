import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ADD_TO_QUEUE, InitialState, Video } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AddToQueue = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const { catalog, queue } = useContext(GlobalStateContext) as InitialState;

  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>(catalog);

  const handleAddToQueue = async () => {
    setAddLoading(true);
    const toAdd = catalog.filter((video) => selectedVideos.includes(video.id.videoId));
    if (toAdd.length > 0) {
      setSelectedVideos([]);
      dispatch!({ type: ADD_TO_QUEUE, payload: { videos: toAdd } });
    }
    setAddLoading(false);
  };

  const searchCatalog = () => {
    const searchResults = catalog.filter((video) =>
      video.snippet.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setSearchResults(searchResults);
  };

  useEffect(() => {
    if (searchTerm.length > 0) {
      const timer = setTimeout(() => {
        searchCatalog();
      }, 300);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setSearchResults(catalog);
    }
  }, [searchTerm]);

  return (
    <div className="flex flex-col w-full">
      <Link to="/" className="p-1 border rounded-full hover:bg-[#f3f5f6] transition-colors self-start">
        <img src="left-arrow.svg" width={20} height={20} />
      </Link>
      <Header showAdminControls={false} />
      <p className="p2 !font-semibold my-2">Search the Catalog</p>
      <div className="flex w-full justify-between items-center mt-1 mb-6">
        <input
          type="text"
          className="outline-[#0a2540] p-2 mr-2 w-full"
          id="search"
          name="search"
          value={searchTerm}
          autoComplete="off"
          autoFocus
          placeholder="Type here to search..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {searchResults.map((video: Video, i: number) => (
        <div key={`${video.id.videoId}-${i}-result`} className="my-4">
          <VideoInfoTile
            isLoading={false}
            videoId={video.id.videoId}
            videoName={video.snippet.title}
            videoDuration={convertMillisToMinutes(video.duration)}
            thumbnail={video.snippet.thumbnails.high.url}
            videoInMedia={queue.find((v) => v.id.videoId === video.id.videoId) !== undefined}
            showControls={{
              plusminus:
                selectedVideos.length > 0 && selectedVideos.find((v) => v === video.id.videoId) ? "minus" : "plus",
            }}
            addVideo={(videoId) => {
              setSelectedVideos([...selectedVideos, videoId]);
            }}
            removeVideo={(videoId) => {
              setSelectedVideos(selectedVideos.filter((v) => v !== videoId));
            }}
          />
        </div>
      ))}
      {selectedVideos.length > 0 && (
        <button
          disabled={addLoading}
          onClick={handleAddToQueue}
          className="fixed right-5 bottom-5 btn btn-enhanced !w-fit z-10"
        >
          {!addLoading ? `Add (${selectedVideos.length})` : "Adding..."}
        </button>
      )}
    </div>
  );
};

export default AddToQueue;
