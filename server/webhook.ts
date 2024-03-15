import express from "express";
import { getDroppedAsset } from "./utils";
import NextSong from "./controllers/media/NextSong";
const webhookRouter = express.Router();

webhookRouter.post("/next", NextSong);

export default webhookRouter;
