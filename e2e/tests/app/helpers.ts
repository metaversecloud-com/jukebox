import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";
import { GOOGLE_API_KEY, INTERACTIVE_KEY, INTERACTIVE_SECRET, MOCK_REDIS_PORT, MOCK_TOPIA_PORT } from "../../constants";
import type { TopiaWorld } from "../../fixtures";

// Tracking id of the Jukebox findings (one Linear issue, numbered items).
export const BUG = "EXP-453";

/** A song tile (thumbnail, title, duration and its +/- control), by title. */
export const tile = (page: Page | Locator, title: string) =>
  page.locator("div.relative.flex-row").filter({ hasText: title });

/** The tile under "Now Playing:". */
export const nowPlaying = (page: Page) => page.locator("p:has-text('Now Playing:') + div");

/** The tiles under "Next Up:", in order. */
export const nextUp = (page: Page) => page.locator("p:has-text('Next Up:') ~ div.my-2");

/** Clicks the +/- button on a song tile. */
export const toggle = (page: Page, title: string) => tile(page, title).locator("button").click();

/** Opens the drawer and waits until the jukebox has loaded (the bottom "Add a Song" bar appears). */
export const openDrawer = async (page: Page, world: TopiaWorld, overrides: Record<string, string> = {}) => {
  await page.goto(world.url("/", overrides));
  await page.getByRole("link", { name: "Add a Song" }).waitFor();
};

/** Status of GET /api/sse with `query`: resolves once the headers arrive, then drops the stream. */
export const sseStatus = (baseURL: string, query: string) =>
  new Promise<number>((resolve, reject) => {
    const request = http.get(`${baseURL}/api/sse?${query}`, (response) => {
      resolve(response.statusCode ?? 0);
      request.destroy();
    });
    request.on("error", reject);
  });

const freePort = () =>
  new Promise<number>((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });

const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../server");

/**
 * Runs `use` against a private app instance (the host build in server/dist, same mocks), so a test
 * can crash the server without taking the shared one down for every other test. Resolves `alive`:
 * whether the instance still answers its health check afterwards.
 */
export const withPrivateServer = async (use: (baseURL: string) => Promise<unknown>) => {
  const port = await freePort();
  const baseURL = `http://localhost:${port}`;
  const child = spawn("node", ["dist/index.js"], {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "test",
      INSTANCE_DOMAIN: `localhost:${MOCK_TOPIA_PORT}`,
      INSTANCE_PROTOCOL: "http",
      INTERACTIVE_KEY,
      INTERACTIVE_SECRET,
      REDIS_URL: `redis://localhost:${MOCK_REDIS_PORT}`,
      REDIS_CLUSTER_MODE: "false",
      GOOGLE_API_KEY,
      GOOGLE_API_ROOT_URL: `http://localhost:${MOCK_TOPIA_PORT}/`,
    },
    stdio: "ignore",
  });
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  const health = () =>
    fetch(`${baseURL}/api/system/health`)
      .then((r) => r.ok)
      .catch(() => false);
  try {
    for (let i = 0; !(await health()); i++) {
      if (i > 100 || child.exitCode !== null) throw new Error("private app instance didn't start");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    // A crashing request may not get an answer at all.
    await Promise.race([use(baseURL).catch(() => undefined), exited]);
    // process.exit runs right after the rejection is logged; give it a moment.
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { alive: await health() };
  } finally {
    child.kill();
  }
};
