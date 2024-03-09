import React, { useContext, useState } from "react";
import VideoInfoTile from "./VideoInfoTile";
import { GlobalStateContext } from "@/context/GlobalContext";
import { Video } from "@/context/types";
import InfiniteScroll from "react-infinite-scroller";
import { playVideo } from "@/context/actions";
import { convertMillisToMinutes } from "@/utils/duration";

const SearchResults = ({ loadNextSet }) => {
  const {
    searchResults,
    // assetId,
    // displayName,
    // interactiveNonce,
    // interactivePublicKey,
    // profileId,
    // sceneDropId,
    // uniqueName,
    // urlSlug,
    // username,
    // visitorId,
  } = useContext(GlobalStateContext);

  const [page, setPage] = useState(searchResults.length / 5);

  const handlePlayVideo = async (videoId: string) => {
    await playVideo(videoId);
  };

  return (
    <InfiniteScroll
      loadMore={loadNextSet}
      initialLoad={false}
      hasMore={searchResults.length > 0}
      loader={
        <div className="loader" key={0}>
          Loading ...
        </div>
      }
    >
      {searchResults.map((video: Video, i: number) => (
        <VideoInfoTile
          key={`${video.id.videoId}${i}`}
          videoId={video.id.videoId}
          videoName={video.snippet.title}
          videoMetaData={convertMillisToMinutes(video.duration)}
          thumbnail={video.snippet.thumbnails.high.url}
          showControls
          playVideo={handlePlayVideo}
        />
      ))}
    </InfiniteScroll>
  );
};

export default SearchResults;
