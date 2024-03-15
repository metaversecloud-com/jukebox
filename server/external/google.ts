import { google } from "googleapis";

// No idea why this is causing problems with concurrently running dev servers
const yt = google.youtube({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});

export default yt;