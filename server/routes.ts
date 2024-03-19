import express from "express";
import {
  handleDropAsset,
  handleGetDroppedAssetsWithUniqueName,
  handleGetWorldDetails,
  handleGetDroppedAsset,
  handleGetVisitor,
  handleUpdateWorldDataObject,
  moveVisitor,
  handleRemoveDroppedAssets,
} from "./controllers/index.ts";
import { getVersion } from "./utils/getVersion.ts";
import getCatalog from "./controllers/getCatalog.ts";
import sendNextSongInfo from "./controllers/media/sendNextSongInfo.ts";
import SearchVideos from "./controllers/media/SearchVideos.ts";
import PlayVideo from "./controllers/media/PlayVideo.ts";
import setHeartbeat from "./controllers/setHeartbeat.ts";
import isAdminCheck from "./controllers/isAdminCheck.ts";
import { isAdmin } from "./middleware/isAdmin.ts";
import AddToQueue from "./controllers/media/AddToQueue.ts";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
  });
});

// Dropped Assets
router.get("/dropped-asset-with-unique-name", handleGetDroppedAssetsWithUniqueName);
router.post("/dropped-asset", handleDropAsset);
router.get("/dropped-asset", handleGetDroppedAsset);
router.delete("/dropped-asset", handleRemoveDroppedAssets);

// Visitor
router.get("/visitor", handleGetVisitor);
router.put("/visitor/move", moveVisitor);

// World
router.get("/world", handleGetWorldDetails);
router.put("/world/data-object", handleUpdateWorldDataObject);

// YouTube
router.post("/search", isAdmin, SearchVideos);
router.post("/play", isAdmin, PlayVideo);

router.get("/catalog", getCatalog);
router.post("/sse", sendNextSongInfo);
router.post("/heartbeat", setHeartbeat);
router.get("/is-admin", isAdminCheck);
router.post("/add-to-queue", isAdmin, AddToQueue);

export default router;
