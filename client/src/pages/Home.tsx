import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalStateContext } from "@/context/GlobalContext";
import { InitialState, Video } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { useContext } from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  const { catalog, jukeboxLoading, nowPlaying, isAdmin, queue } = useContext(GlobalStateContext) as InitialState;

  return (
    <>
      <Header showAdminControls={isAdmin} />
      <div className="flex flex-col w-full justify-start">
        {nowPlaying && nowPlaying.id.videoId !== "" && (
          <>
            <p className="p1 !font-semibold">Now Playing: </p>
            <div className="my-4">
              <VideoInfoTile
                isLoading={jukeboxLoading}
                videoId={nowPlaying.id.videoId}
                videoName={nowPlaying.snippet.title}
                videoDuration={convertMillisToMinutes(nowPlaying.duration)}
                thumbnail={nowPlaying.snippet.thumbnails.high.url}
              ></VideoInfoTile>
            </div>
          </>
        )}
        {queue.length > 0 && (
          <>
            <p className="p1 !font-semibold mb-2">Next Up: </p>
            {queue.map((video, i) => (
              <div key={`${video.id.videoId}-${i}-div`} className="my-2">
                <VideoInfoTile
                  isLoading={jukeboxLoading}
                  videoId={video.id.videoId}
                  videoName={video.snippet.title}
                  videoDuration={convertMillisToMinutes(video.duration)}
                  thumbnail={video.snippet.thumbnails.high.url}
                  showControls={false}
                ></VideoInfoTile>
              </div>
            ))}
          </>
        )}
        <Link className="btn btn-enhanced my-2 w-full" to={"/add-to-queue"}>
          Add a Song
        </Link>
      </div>
    </>
  );
};

export default Home;
