import React, { useContext, useState } from "react";
import VideoInfoTile from "./VideoInfoTile";
import { GlobalStateContext } from "@/context/GlobalContext";
import { Video } from "@/context/types";
import InfiniteScroll from "react-infinite-scroller";

const Catalog = ({ loadNextSet }) => {
  const { catalog } = useContext(GlobalStateContext);

  const [page, setPage] = useState(catalog.length / 5);

  function convertMillisToMinutes(milliseconds) {
    const remainingMilliseconds = milliseconds % (1000 * 60 * 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor(remainingMilliseconds / (1000 * 60));
    const seconds = Math.floor((remainingMilliseconds % (1000 * 60)) / 1000);

    return `${hours ? hours + ":" : ""}${minutes < 10 && hours ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  return (
    <InfiniteScroll
      loadMore={loadNextSet}
      initialLoad={false}
      hasMore={catalog.length > 0}
      loader={
        <div className="loader" key={0}>
          Loading ...
        </div>
      }
    >
      {catalog.map((video: Video, i: number) => (
        <VideoInfoTile
          key={`${video.id.videoId}${i}`}
          videoName={video.snippet.title}
          videoMetaData={convertMillisToMinutes(video.duration)}
          thumbnail={video.snippet.thumbnails.high.url}
          showControls
        />
      ))}
    </InfiniteScroll>
  );
};

export default Catalog;
