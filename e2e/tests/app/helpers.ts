import http from "node:http";
import type { Locator, Page } from "@playwright/test";
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
