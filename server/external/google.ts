import { youtube } from "@googleapis/youtube";

// No idea why this is causing problems with concurrently running dev servers
async function initializeYouTube() {
  const yt = youtube({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
    // Unset in production (Google's default). The e2e suite points it at its fake YouTube API.
    rootUrl: process.env.GOOGLE_API_ROOT_URL || undefined,
  });

  return yt;
}

const yt = await initializeYouTube();

export default yt;
