import express from "express";
// import { runSample } from "./external/playlist.js";
import { searchVideos } from "./external/google.js";
import { runSample } from "./external/playlist.js";

const youtubeRouter = express.Router();
// https://www.googleapis.com/youtube/v3/search?key=AIzaSyAbOjljiI1e-IzJa5RUrOYH1wfcAOp-KP4&part=snippet&q=reactjs&type=video

// Example using part and snippet
// https://www.googleapis.com/youtube/v3/search?key=AIzaSyAbOjljiI1e-IzJa5RUrOYH1wfcAOp-KP4&part=snippet&q=reactjs&type=video&fields=items(snippet(title))

youtubeRouter.get("/", (req, res) => {
  searchVideos();
  // runSample();
  res.json({ message: "Hello YouTube!" });
});

export default youtubeRouter;
