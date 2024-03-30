import React, { useState } from "react";
import Marquee from "react-fast-marquee";
import he from "he";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import CircularLoader from "./CircularLoader";

interface VideoInfoTileProps {
  videoId: string;
  videoName: string;
  videoDuration: string;
  thumbnail: string;
  isLoading: boolean;
  showControls?:
    | {
        play: boolean;
        plusminus: string | false;
      }
    | false;
  playVideo?: (videoId: string) => void;
  playLoading?: boolean;
  addVideo?: (videoId: string) => void;
  removeVideo?: (videoId: string) => void;
  videoInCatalog?: boolean;
  disabledControls?: boolean;
}

const VideoInfoTile: React.FC<VideoInfoTileProps> = ({
  videoId,
  videoName,
  videoDuration,
  thumbnail,
  showControls,
  isLoading,
  playVideo,
  playLoading,
  addVideo,
  removeVideo,
  videoInCatalog,
  disabledControls
}) => {
  const [playMarquee, setPlayMarquee] = useState(true);

  return (
    <div
      className={`relative flex flex-row w-full rounded-xl pr-1 ${showControls && showControls.plusminus !== false ? showControls.plusminus === "minus" && "bg-gray-300" : ""}`}
    >
      {playLoading && (
        <>
          <div className="backdrop-brightness-90 rounded-xl absolute top-0 z-10 h-full w-full"></div>
          <div className="absolute top-0 z-10 flex rounded-xl h-full justify-center items-center select-none w-full">
            <CircularLoader />
          </div>
        </>
      )}
      {!isLoading ? (
        <div className="rounded-xl h-fit p-0">
          <img
            title={he.decode(videoName)}
            src={thumbnail}
            alt={he.decode(videoName)}
            className="aspect-square min-w-16 max-w-16 object-cover rounded-xl"
          />
        </div>
      ) : (
        <Skeleton height={64} width={64} borderRadius={"0.75rem"} />
      )}

      <div className="flex justify-between pl-3 items-center w-full">
        <div className={`flex flex-col items-start self-start mr-1 ${showControls ? "w-44" : "w-52"}`}>
          {!isLoading ? (
            he.decode(videoName).length > 25 ? (
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
                <p className="p1 !font-semibold">{he.decode(`${videoName}&#160;`)}</p>
              </Marquee>
            ) : (
              <p className="p1 !font-semibold">{he.decode(`${videoName}&#160;`)}</p>
            )
          ) : (
            <Skeleton width={200} className="self-start" />
          )}
          {!isLoading ? <p className="p1">{videoDuration}</p> : <Skeleton count={1} width={100} />}
        </div>
        {showControls && (
          <div className="flex items-center justify-end">
            {videoInCatalog ? (
              <span className="w-[40px] h-[40px] flex items-center justify-center mx-[1px]">
                <i className="bg-center bg-no-repeat bg-contain check-icon h-5 w-5" />
              </span>
            ) : (
              showControls.plusminus &&
              (showControls.plusminus === "plus" ? (
                <button
                  disabled={disabledControls}
                  onClick={() => addVideo && addVideo(videoId)}
                  className="btn-icon !p-0 transition-colors flex items-center justify-center mx-[1px]"
                >
                  <i className="icon add-icon h-5 w-5" />
                </button>
              ) : (
                <button
                  disabled={disabledControls}
                  onClick={() => removeVideo && removeVideo(videoId)}
                  className="btn-icon !p-0 transition-colors flex items-center justify-center mx-[1px]"
                >
                  <i className="icon minus-icon h-4 w-4" />
                </button>
              ))
            )}

            {showControls.play && (
              <button
                disabled={disabledControls}
                onClick={() => playVideo!(videoId)}
                className={`btn-icon !p-0 transition-colors flex items-center justify-center mx-[1px]`}
              >
                <i className="icon play-icon h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInfoTile;
