import React, { useContext, useState } from "react";
import VideoInfoTile from "./VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ADD_TO_QUEUE, InitialState, SET_CURRENT_MEDIA, Video } from "@/context/types";
import InfiniteScroll from "react-infinite-scroller";
import { addToQueue, playVideo } from "@/context/actions";
import { convertMillisToMinutes } from "@/utils/duration";
import { AxiosInstance } from "axios";
import CircularLoader from "./CircularLoader";

interface SearchResultsProps {
  loadNextSet: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ loadNextSet }) => {
  const { searchResults, searchLoading, nextPageToken, backendAPI, isAdmin } = useContext(
    GlobalStateContext,
  ) as InitialState;
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

  const handlePlayVideo = async (videoId: string) => {
    const video = searchResults.find((video) => video.id.videoId === videoId) as Video;
    const res = await playVideo(backendAPI as AxiosInstance, video, false);
    if (res) {
      dispatch!({ type: SET_CURRENT_MEDIA, payload: { nowPlaying: video } });
    }
  };

  const handleAddToQueue = async () => {
    setAddLoading(true);
    const toAdd = searchResults.filter((video) => selectedVideos.includes(video.id.videoId));
    const res = await addToQueue(backendAPI as AxiosInstance, toAdd);
    if (res) {
      setSelectedVideos([]);
      dispatch!({ type: ADD_TO_QUEUE, payload: { videos: toAdd } });
    }
    setAddLoading(false);
  };

  return (
    <div className="w-full h-full">
      {selectedVideos.length > 0 && (
        <button
          disabled={addLoading}
          onClick={handleAddToQueue}
          className="fixed right-5 bottom-5 btn btn-enhanced w-fit z-10"
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
          <div key={`result-${video.id.videoId}-${i}`} className="my-4">
            <VideoInfoTile
              key={`${video.id.videoId}-${i}`}
              isLoading={searchLoading}
              videoId={video.id.videoId}
              videoName={video.snippet.title}
              videoDuration={convertMillisToMinutes(video.duration)}
              thumbnail={video.snippet.thumbnails.high.url}
              showControls={
                !searchLoading && isAdmin
                  ? {
                      play: false,
                      plusminus:
                        selectedVideos.length > 0 && selectedVideos.find((v) => v === video.id.videoId)
                          ? "minus"
                          : "plus",
                    }
                  : false
              }
              playVideo={handlePlayVideo}
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
