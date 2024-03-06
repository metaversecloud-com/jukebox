import React from "react";

interface NowPlayingProps {
  videoName: string;
  videoMetaData: string;
  thumbnail: string;
  showControls?: boolean;
}

const NowPlaying: React.FC<NowPlayingProps> = ({ videoName, videoMetaData, thumbnail, showControls }) => {
  return (
    <div className="flex flex-row w-full">
      <div className="w-1/3 h-full  rounded-xl p-4 border">
        <img src={thumbnail} alt={videoName} className="w-full h-full object-cover rounded-xl" />
      </div>
      <div className="flex w-full justify-between px-3 items-center">
        <div className="flex flex-col items-start self-start mr-2">
          <p className="p1 font-semibold">{videoName}</p>
          <p className="p1">{videoMetaData}</p>
        </div>
        {showControls && (
          <div className="rounded-full h-fit w-fit border flex items-center">
            <div className="w-4 h-4 bg-blue-950 m-2"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NowPlaying;
