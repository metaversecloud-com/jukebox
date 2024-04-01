import express from "express";
import NextSong from "../controllers/media/NextSong.js";
// import { isAdmin } from "../middleware/isAdmin";
const webhookRouter = express.Router();

webhookRouter.post("/next", NextSong);

export default webhookRouter;
