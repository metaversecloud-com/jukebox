import { GlobalStateContext } from "@/context/GlobalContext";
import { backendAPI } from "@/utils/backendAPI";
import React, { useContext, useEffect, useState } from "react";

const Search = () => {
  const [result, setResults] = useState([]);
  const [search, setSearch] = useState("");

  const {
    assetId,
    displayName,
    interactiveNonce,
    interactivePublicKey,
    profileId,
    sceneDropId,
    uniqueName,
    urlSlug,
    username,
    visitorId,
  } = useContext(GlobalStateContext);

  const searchVideos = async (e) => {
    try {
      e.preventDefault();
      const body = { q: search };
      const result = await backendAPI.post("/search", body);
      console.log("RES", result);
      setResults(result.data);
    } catch (error) {
      console.error(error);
    }
  };

  const playVideo = async (videoId) => {
    try {
      const body = {
        assetId,
        displayName,
        interactiveNonce,
        interactivePublicKey,
        profileId,
        sceneDropId,
        uniqueName,
        urlSlug,
        username,
        visitorId,
        videoId,
      };
      await backendAPI.post("/play", body);
      // window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
    } catch (err) {
      console.error(err);
    }
  };

  // useEffect(() => {
  //   setInterval(async () => {
  //     console.log("SENDING");
  //     const body = { q: search };
  //     const result = await backendAPI.post("/search", body);
  //     setResults(result.data);
  //   }, 1000);
  // }, []);

  return (
    // Form to search for videos
    <>
      <form onSubmit={searchVideos} className="flex items-end justify-between my-2 w-full">
        <div className="flex flex-col">
          <label htmlFor="search" className="mb-2">
            Search for videos:
          </label>
          <input
            className="p-2"
            type="text"
            id="search"
            name="search"
            value={search}
            autoComplete="off"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn w-fit transition-colors text-black hover:text-white">
          Search
        </button>
      </form>
      {result.length > 0 &&
        result.map((video, i) => (
          <div className="border rounded-md py-4 px-2 my-2 flex flex-col items-center justify-between">
            <img
              key={i}
              className="w-96 h-52 object-cover rounded-md my-2"
              src={video.snippet.thumbnails.high.url}
              alt={video.snippet.title}
            />
            <div className="flex items-center justify-between">
              <p key={i} className="p2 mr-2">
                {video.snippet.title}
              </p>
              <button onClick={(e) => playVideo(video.id.videoId)} className="btn w-fit">
                Play
              </button>
            </div>
          </div>
        ))}
    </>
  );
};

export default Search;
