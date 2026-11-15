import { defineConfig, devices } from "@playwright/test";
import { APP_PORT, GOOGLE_API_KEY, INTERACTIVE_KEY, INTERACTIVE_SECRET, MOCK_REDIS_PORT, MOCK_TOPIA_PORT } from "./constants";

// E2E_APP_IMAGE=<image> runs the app from a Docker image (what ships, e.g. to test a Node upgrade)
// instead of local Node. The container reaches the mock on the host through host.docker.internal.
const APP_IMAGE = process.env.E2E_APP_IMAGE;
const hostName = APP_IMAGE ? "host.docker.internal" : "localhost";
const mockHost = `${hostName}:${MOCK_TOPIA_PORT}`;

// The real app (production build) talks to an in-memory fake of the Topia public API.
// Explicit env wins over any developer ../.env because dotenv never overrides existing variables.
const appEnv = {
  PORT: APP_IMAGE ? "3000" : String(APP_PORT),
  NODE_ENV: "test",
  INSTANCE_DOMAIN: mockHost,
  INSTANCE_PROTOCOL: "http",
  INTERACTIVE_KEY,
  INTERACTIVE_SECRET,
  API_KEY: "",
  // Live updates (queue and now-playing changes) go through Redis pub/sub: an in-memory fake.
  REDIS_URL: `redis://${hostName}:${MOCK_REDIS_PORT}`,
  REDIS_CLUSTER_MODE: "false",
  // Never let a test reach a real service: YouTube search and availability checks go to mock-topia.
  GOOGLE_API_KEY,
  GOOGLE_API_ROOT_URL: `http://${mockHost}/`,
  SAFE_SEARCH: "strict",
  // Default mode is karaoke (video); AUDIO_ONLY switches the default to audio-only jukebox.
  AUDIO_ONLY: "",
};

const imageEnvFlags = Object.entries(appEnv)
  // Single-quoted so JSON values survive the shell.
  .map(([key, value]) => `-e ${key}='${value}'`)
  .join(" ");

const appServer = APP_IMAGE
  ? {
      command: `docker run --rm --init --name sdk-app-e2e --add-host=host.docker.internal:host-gateway -p ${APP_PORT}:3000 ${imageEnvFlags} ${APP_IMAGE}`,
      // Never reuse a server already on the port: it wouldn't be the image under test.
      reuseExistingServer: false,
    }
  : {
      command: "npm run build --prefix .. && npm start --prefix ..",
      // The image bakes COMMIT_HASH in and runs in UTC; a local run has to provide both.
      env: { ...appEnv, COMMIT_HASH: "local", TZ: "UTC" },
      reuseExistingServer: !process.env.CI,
    };

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // The app runs in UTC (TZ below, and the image), so the browser does too: dates render the same on
    // every machine. A test can still pick another zone on purpose with test.use({ timezoneId }).
    timezoneId: "UTC",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node mock-redis/server.mjs",
      port: MOCK_REDIS_PORT,
      env: { MOCK_REDIS_PORT: String(MOCK_REDIS_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node mock-topia/server.mjs",
      url: `http://localhost:${MOCK_TOPIA_PORT}/__mock/health`,
      env: { MOCK_TOPIA_PORT: String(MOCK_TOPIA_PORT), INTERACTIVE_KEY },
      reuseExistingServer: !process.env.CI,
    },
    {
      ...appServer,
      url: `http://localhost:${APP_PORT}/api/system/health`,
      timeout: 180_000,
    },
  ],
});
