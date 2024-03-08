import React, { useState } from "react";
import Marquee from "react-fast-marquee";

interface VideoInfoTileProps {
  videoId: string;
  videoName: string;
  videoMetaData: string;
  thumbnail: string;
  showControls?: boolean;
  playVideo: (videoId: string) => void;
}

const VideoInfoTile: React.FC<VideoInfoTileProps> = ({ videoId, videoName, videoMetaData, thumbnail, showControls, playVideo }) => {
  const [playMarquee, setPlayMarquee] = useState(true);
  return (
    <div className="flex flex-row w-full my-1">
      <div className="rounded-xl border h-fit p-1">
        <img src={thumbnail} alt={videoName} className="aspect-square min-w-16 max-w-16 object-cover rounded-xl" />
      </div>
      <div className="flex w-full justify-between px-3 items-center">
        <div className="flex flex-col items-start self-start mr-2 w-40">
          <Marquee gradient={false} speed={50} delay={3} play={playMarquee} pauseOnHover onCycleComplete={() => {
            setPlayMarquee(false);
            setTimeout(() => {
              setPlayMarquee(true);
            }, 3000);
          }}>
            <p className="p1 font-semibold w-full">{videoName}</p>
          </Marquee>
          <p className="p1">{videoMetaData}</p>
        </div>
        {showControls && (
          <div className="w-1/2 flex items-center justify-end">
            {/* <button className="btn-icon flex items-center justify-center">
              <i className="icon pause-icon h-4 w-4" />
            </button> */}
            <button onClick={() => playVideo(videoId)} className="btn-icon flex items-center justify-center">
              <i className="icon play-icon h-4 w-4" />
            </button>
            {/* <button className="btn-icon flex items-center justify-center">
              <i className="icon stop-icon h-4 w-4" />
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInfoTile;
