import express from "express";
import { getDroppedAsset } from "./utils";
import { nextSong } from "./controllers/media";
const webhookRouter = express.Router();

webhookRouter.post("/next", nextSong);

export default webhookRouter;
