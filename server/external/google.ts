import { youtube } from "@googleapis/youtube";

// No idea why this is causing problems with concurrently running dev servers
async function initializeYouTube() {
  const yt = youtube({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
  });

  return yt;
}

export default initializeYouTube;
