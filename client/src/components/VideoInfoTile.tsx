import React, { useState } from "react";
import Marquee from "react-fast-marquee";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface VideoInfoTileProps {
  videoId: string;
  videoName: string;
  videoDuration: string;
  thumbnail: string;
  isLoading: boolean;
  showControls?: boolean;
  playVideo?: (videoId: string) => void;
}

const VideoInfoTile: React.FC<VideoInfoTileProps> = ({
  videoId,
  videoName,
  videoDuration,
  thumbnail,
  showControls,
  isLoading,
  playVideo,
}) => {
  const [playMarquee, setPlayMarquee] = useState(true);
  return (
    <div className="flex flex-row w-full">
      {!isLoading ? (
        <div className="rounded-xl h-fit p-0">
          <img src={thumbnail} alt={videoName} className="aspect-square min-w-16 max-w-16 object-cover rounded-xl" />
        </div>
      ) : (
        <Skeleton height={64} width={64} borderRadius={"0.75rem"} />
      )}

      <div className="flex w-full justify-between px-3 items-center">
        <div className="flex flex-col items-start self-start mr-2 w-40">
          {!isLoading ? (
            <Marquee
              gradient={false}
              speed={50}
              delay={3}
              play={playMarquee}
              pauseOnHover
              onCycleComplete={() => {
                setPlayMarquee(false);
                setTimeout(() => {
                  setPlayMarquee(true);
                }, 3000);
              }}
            >
              <p className="p1 font-semibold w-full">{videoName}</p>
            </Marquee>
          ) : (
            <Skeleton width={200} className="self-start" />
          )}
          {!isLoading ? <p className="p1">{videoDuration}</p> : <Skeleton count={1} width={100} />}
        </div>
        {showControls && playVideo && (
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
