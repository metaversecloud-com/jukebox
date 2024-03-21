import express from "express";

import { getVersion } from "../utils/getVersion";
import GetCatalog from "../controllers/media/GetCatalog";
import SearchVideos from "../controllers/media/SearchVideos";
import PlayVideo from "../controllers/media/PlayVideo";
import setHeartbeat from "../controllers/status/setHeartbeat";
import isAdminCheck from "../controllers/status/isAdminCheck";
import { isAdmin } from "../middleware/isAdmin";
import AddToQueue from "../controllers/media/AddToQueue";
import SendNextSongInfo from "../controllers/media/SendNextSongInfo";

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
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "SET" : "NOT SET",
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