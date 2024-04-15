import React, { useContext, useEffect, useState } from "react";
import VideoInfoTile from "./VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ADD_TO_CATALOG, InitialState, Video } from "@/context/types";
import InfiniteScroll from "react-infinite-scroller";
import { addToCatalog } from "@/context/actions";
import { convertMillisToMinutes } from "@/utils/duration";
import { AxiosInstance } from "axios";
import CircularLoader from "./CircularLoader";
import uniqBy from "lodash.uniqby";

interface SearchResultsProps {
  loadNextSet: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ loadNextSet }) => {
  const { searchResults, searchLoading, nextPageToken, backendAPI, isAdmin, catalog } = useContext(
    GlobalStateContext,
  ) as InitialState;
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

  const handleAddToCatalog = async () => {
    setAddLoading(true);
    const toAdd = searchResults.filter((video) => selectedVideos.includes(video.id.videoId));
    const uniq = uniqBy(toAdd, (v: Video) => v.id.videoId) as Video[];
    const res = await addToCatalog(backendAPI as AxiosInstance, uniq);
    if (res && res.success) {
      setSelectedVideos([]);
      dispatch!({ type: ADD_TO_CATALOG, payload: { videos: toAdd } });
    }
    setAddLoading(false);
  };

  useEffect(() => {
    if (searchLoading) {
      setSelectedVideos([]);
    }
  }, [searchLoading]);

  return (
    <div className="w-full h-full">
      {selectedVideos.length > 0 && (
        <button
          disabled={addLoading}
          onClick={handleAddToCatalog}
          className="fixed right-5 bottom-5 btn btn-enhanced !w-fit z-10"
        >
          {!addLoading ? `Add (${selectedVideos.length})` : "Adding..."}
        </button>
      )}
      <InfiniteScroll
        loadMore={loadNextSet}
        initialLoad={false}
        hasMore={searchResults.length > 0 && searchResults[0].id.videoId !== "" && nextPageToken !== null}
        loader={<CircularLoader />}
      >
        {searchResults.map((video: Video, i: number) => (
          <div key={`${video.id.videoId}-${i}-result`} className="my-4">
            <VideoInfoTile
              isLoading={searchLoading}
              videoId={video.id.videoId}
              videoName={video.snippet.title}
              videoDuration={convertMillisToMinutes(video.duration)}
              thumbnail={video.snippet.thumbnails.high.url}
              videoInMedia={catalog.find((v) => v.id.videoId === video.id.videoId) !== undefined}
              showControls={
                !searchLoading && isAdmin
                  ? {
                      plusminus:
                        selectedVideos.length > 0 && selectedVideos.find((v) => v === video.id.videoId)
                          ? "minus"
                          : "plus",
                    }
                  : false
              }
              addVideo={(videoId) => {
                setSelectedVideos([...selectedVideos, videoId]);
              }}
              removeVideo={(videoId) => {
                setSelectedVideos(selectedVideos.filter((v) => v !== videoId));
              }}
            />
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default SearchResults;
