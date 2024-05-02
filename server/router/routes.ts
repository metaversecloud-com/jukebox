import express from "express";

import { getVersion } from "../utils/getVersion.js";
import GetJukeboxDataObject from "../controllers/media/GetJukeboxDataObject.js";
import SearchVideos from "../controllers/media/SearchVideos.js";
import setHeartbeat from "../controllers/status/setHeartbeat.js";
import isAdminCheck from "../controllers/status/isAdminCheck.js";
import { isAdmin } from "../middleware/isAdmin.js";
import AddMedia from "../controllers/media/AddMedia.js";
import sse from "../controllers/media/Events.js";
import RemoveMedia from "../controllers/media/RemoveMedia.js";
import { handleCheckInteractiveCredentials } from "../controllers/status/handleCheckInteractiveCredentials.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.status(200).json({
    appVersion: getVersion(),
    status: "OK",
    envs: {
      API_KEY: process.env.API_KEY ? "SET" : "NOT SET",
      PORT: process.env.PORT ? process.env.PORT : "NOT SET",
      NODE_ENV: process.env.NODE_ENV ? process.env.NODE_ENV : "NOT SET",
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN ? process.env.INSTANCE_DOMAIN : "NOT SET",
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY ? process.env.INTERACTIVE_KEY : "NOT SET",
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      SAFE_SEARCH: process.env.SAFE_SEARCH ? process.env.SAFE_SEARCH : "NOT SET",
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "SET" : "NOT SET",
      REDIS_URL: process.env.REDIS_URL ? "SET" : "NOT SET",
      SDK_REDIS_URL: process.env.SDK_REDIS_URL ? "SET" : "NOT SET",
      REDIS_PASSWORD: process.env.REDIS_PASSWORD ? "SET" : "NOT SET",
      AUDIO_ONLY: process.env.AUDIO_ONLY ? process.env.AUDIO_ONLY : "NOT SET",
    },
  });
});

router.get("/system/interactive-credentials", handleCheckInteractiveCredentials);

// YouTube
router.post("/search", isAdmin, SearchVideos);

// Media Player
router.get("/jukebox", GetJukeboxDataObject);
router.get("/sse", sse);
router.post("/heartbeat", setHeartbeat);
router.get("/is-admin", isAdminCheck);

router.post("/add-media", AddMedia);
router.post("/remove-media", isAdmin, RemoveMedia);

export default router;
