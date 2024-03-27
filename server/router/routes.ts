import express from "express";

import { getVersion } from "../utils/getVersion.js";
import GetCatalog from "../controllers/media/GetCatalog.js";
import SearchVideos from "../controllers/media/SearchVideos.js";
import PlayVideo from "../controllers/media/PlayVideo.js";
import setHeartbeat from "../controllers/status/setHeartbeat.js";
import isAdminCheck from "../controllers/status/isAdminCheck.js";
import { isAdmin } from "../middleware/isAdmin.js";
import AddToQueue from "../controllers/media/AddToQueue.js";
import SSE from "../controllers/media/SSE.js";
import RemoveFromQueue from "../controllers/media/RemoveFromQueue.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.status(200).json({
    appVersion: getVersion(),
    status: "OK",
    envs: {
      NODE_ENV: process.env.NODE_ENV ? process.env.NODE_ENV : "NOT SET",
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN ? process.env.INSTANCE_DOMAIN : "NOT SET",
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY ? process.env.INTERACTIVE_KEY : "NOT SET",
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      SAFE_SEARCH: process.env.SAFE_SEARCH ? process.env.SAFE_SEARCH : "NOT SET",
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "SET" : "NOT SET",
    },
  });
});

// YouTube
router.post("/search", isAdmin, SearchVideos);
router.post("/play", isAdmin, PlayVideo);

router.get("/catalog", GetCatalog);
router.get("/sse", SSE);
router.post("/heartbeat", setHeartbeat);
router.get("/is-admin", isAdminCheck);
router.post("/add-to-queue", isAdmin, AddToQueue);
router.post("/remove-from-queue", isAdmin, RemoveFromQueue);

export default router;
