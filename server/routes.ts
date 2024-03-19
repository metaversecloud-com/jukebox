import express from "express";

import { getVersion } from "./utils/getVersion.ts";
import GetCatalog from "./controllers/media/GetCatalog.ts";
import SearchVideos from "./controllers/media/SearchVideos.ts";
import PlayVideo from "./controllers/media/PlayVideo.ts";
import setHeartbeat from "./controllers/status/setHeartbeat.ts";
import isAdminCheck from "./controllers/status/isAdminCheck.ts";
import { isAdmin } from "./middleware/isAdmin.ts";
import AddToQueue from "./controllers/media/AddToQueue.ts";
import SendNextSongInfo from "./controllers/media/sendNextSongInfo.ts";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.status(200).json({
    appVersion: getVersion(),
    status: "OK",
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.API_DOMAIN,
      INTERACTIVE_KEY: process.env.PUBLIC_KEY,
    },
  });
});

// YouTube
router.post("/search", isAdmin, SearchVideos);
router.post("/play", isAdmin, PlayVideo);

router.get("/catalog", GetCatalog);
router.post("/sse", SendNextSongInfo);
router.post("/heartbeat", setHeartbeat);
router.get("/is-admin", isAdminCheck);
router.post("/add-to-queue", isAdmin, AddToQueue);

export default router;
