import React, { useContext } from "react";
import VideoInfoTile from "./VideoInfoTile";
import { GlobalStateContext } from "@/context/GlobalContext";
import { Video } from "@/context/types";

const Catalog = () => {
  const { catalog } = useContext(GlobalStateContext);

  function convertMillisToMinutes(milliseconds) {
    const remainingMilliseconds = milliseconds % (1000 * 60 * 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor(remainingMilliseconds / (1000 * 60));
    const seconds = Math.floor((remainingMilliseconds % (1000 * 60)) / 1000);

    return `${hours ? hours + ":" : ""}${minutes < 10 && hours ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  return catalog.map((video: Video) => (
    <VideoInfoTile
      key={video.id.videoId}
      videoName={video.snippet.title}
      videoMetaData={convertMillisToMinutes(video.duration)}
      thumbnail={video.snippet.thumbnails.high.url}
      showControls
    />
  ));
};

export default Catalog;
