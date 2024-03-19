import express from "express";
import { getDroppedAsset } from "./utils";
import NextSong from "./controllers/media/NextSong";
import { isAdmin } from "./middleware/isAdmin";
const webhookRouter = express.Router();

webhookRouter.post("/next", NextSong);

export default webhookRouter;
