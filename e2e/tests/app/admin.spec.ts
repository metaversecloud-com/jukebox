// Admin page: building the catalog from YouTube search, removing songs, and the jukebox settings.
import { expect, jukeboxData, test, video } from "../../fixtures";
import { BUG, nowPlaying, openDrawer, tile, toggle } from "./helpers";

const A = video("admin-a", "Alpha Song");
const B = video("admin-b", "Bravo Song");
const C = video("admin-c", "Charlie Song");
const ids = (...videos: { id: { videoId: string } }[]) => videos.map((v) => v.id.videoId);

const openAdmin = async (page: Parameters<typeof openDrawer>[0], world: Parameters<typeof openDrawer>[1]) => {
  await openDrawer(page, world);
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
};

test("an admin searches YouTube and adds results to the catalog", async ({ page, world }) => {
  await world.seed({ isAdmin: true });
  await openAdmin(page, world);
  await expect(page.getByText("No songs added")).toBeVisible();

  await page.getByRole("link", { name: "Add a Song" }).click();
  await page.getByPlaceholder("Type here to search...").fill("Admin Lofi");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(tile(page, "Admin Lofi 3")).toContainText("3:25");
  await toggle(page, "Admin Lofi 1");
  await toggle(page, "Admin Lofi 3");
  await page.getByRole("button", { name: "Add (2)" }).click();
  await expect(page.getByRole("button", { name: /^(Add \(|Adding)/ })).toHaveCount(0);

  const { catalog } = await world.assetData();
  expect(catalog).toEqual([
    expect.objectContaining({ id: { videoId: "admin-lofi-1" }, duration: 205_000, snippet: expect.objectContaining({ title: "Admin Lofi 1" }) }),
    expect.objectContaining({ id: { videoId: "admin-lofi-3" }, duration: 205_000 }),
  ]);
  expect(await world.analytics()).toContain("addsToCatalog");
  // Added songs show a check in the results instead of the + button.
  await expect(tile(page, "Admin Lofi 1").locator("button")).toHaveCount(0);
  await expect(tile(page, "Admin Lofi 2").locator("button")).toBeVisible();

  await page.locator("a[href='/admin']").first().click();
  await expect(tile(page, "Admin Lofi 1")).toBeVisible();
  await expect(tile(page, "Admin Lofi 3")).toBeVisible();
  // The search went out with the configured safe-search level.
  expect(await world.youtubeCalls("Admin Lofi")).toContainEqual(
    expect.objectContaining({ path: "/youtube/v3/search", query: expect.objectContaining({ safeSearch: "strict", type: "video" }) }),
  );
});

test("players can't search YouTube from the search page", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A] }) });
  await openDrawer(page, world);
  await page.goto(world.url("/search"));
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();

  await page.getByPlaceholder("Type here to search...").fill("Player Search");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText("Search Results")).toHaveCount(0);
  expect(await world.youtubeCalls("Player Search")).toEqual([]);
});

test("an admin removes songs from the catalog, and from the queue with them", async ({ page, world }) => {
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: ids(B, C) }) });
  await openAdmin(page, world);

  await toggle(page, "Bravo Song");
  await page.getByRole("button", { name: "Remove (1)" }).click();

  await expect(tile(page, "Bravo Song")).toHaveCount(0);
  expect(await world.assetData()).toMatchObject({ catalog: [A, C], queue: ids(C), nowPlaying: A.id.videoId });
  expect(await world.mediaChanges()).toEqual([]);
});

test("removing the song that's playing moves on to the next one", async ({ page, world }) => {
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: ids(B, C) }) });
  await openAdmin(page, world);

  await toggle(page, "Alpha Song");
  await page.getByRole("button", { name: "Remove (1)" }).click();
  await expect(tile(page, "Alpha Song")).toHaveCount(0);

  expect(await world.assetData()).toMatchObject({ catalog: [B, C], queue: ids(C), nowPlaying: B.id.videoId });
  expect(await world.mediaChanges()).toEqual([
    expect.objectContaining({ mediaType: "link", mediaLink: `https://www.youtube.com/watch?v=${B.id.videoId}` }),
  ]);
  await page.getByRole("link", { name: "Home" }).click();
  await expect(tile(nowPlaying(page), "Bravo Song")).toBeVisible();
});

test("removing the last song that's playing stops the jukebox", async ({ request, world }) => {
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B], nowPlaying: A.id.videoId }) });

  const response = await request.post(world.api("/remove-media"), { data: { videoIds: ids(A), type: "catalog" } });

  expect(response.ok()).toBe(true);
  expect(await world.assetData()).toMatchObject({ catalog: [B], queue: [], nowPlaying: "-1" });
  expect(await world.mediaChanges()).toEqual([expect.objectContaining({ mediaType: "none" })]);
});

test("catalog songs no longer on YouTube are flagged for the admin", async ({ page, world }) => {
  const gone = video("admin-gone", "Deleted Song");
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, gone] }) });
  await openAdmin(page, world);

  await expect(tile(page, "Deleted Song")).toContainText("Video not available");
  await expect(tile(page, "Alpha Song")).not.toContainText("Video not available");
});

test("an admin saves the jukebox's name, image and mode", async ({ page, world }) => {
  await world.seed({ isAdmin: true });
  await openAdmin(page, world);

  await page.getByLabel("Mode").selectOption("jukebox");
  await page.getByLabel("Name").fill("Friday Tunes");
  await page.getByLabel("Image URL").fill("https://example.invalid/tunes.png");
  await page.getByRole("button", { name: "Save Settings" }).click();

  await expect(page.getByText("Settings saved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Friday Tunes" })).toBeVisible();
  expect((await world.assetData()).settings).toEqual({ mode: "jukebox", name: "Friday Tunes", imageUrl: "https://example.invalid/tunes.png" });
  expect(await world.analytics()).toContain("settingsUpdates");

  // Reopened later, the form shows the saved values.
  await page.goto(world.url("/admin"));
  await expect(page.getByLabel("Mode")).toHaveValue("jukebox");
  await expect(page.getByLabel("Name")).toHaveValue("Friday Tunes");
});

test("switching to jukebox mode mid-song turns the video off and keeps the song", async ({ request, world }) => {
  const link = `https://www.youtube.com/watch?v=${A.id.videoId}`;
  await world.seed({ isAdmin: true, asset: { mediaLink: link }, assetData: jukeboxData({ catalog: [A], nowPlaying: A.id.videoId }) });

  const response = await request.post(world.api("/settings"), { data: { mode: "jukebox" } });

  expect(response.ok()).toBe(true);
  // Not awaited by the app.
  await expect.poll(() => world.mediaChanges()).toEqual([expect.objectContaining({ mediaType: "link", mediaLink: link, isVideo: false })]);
});

test("settings only accept the two modes", async ({ request, world }) => {
  await world.seed({ isAdmin: true });

  const response = await request.post(world.api("/settings"), { data: { mode: "disco" } });

  expect(response.status()).toBe(400);
  expect(await world.assetData()).toEqual({});
});

test("a failed YouTube search doesn't leave the search stuck loading", async ({ page, world }) => {
  test.fail(true, `${BUG} #13: searchCatalog returns null on error and the page destructures it, so loading never ends`);
  await world.seed({ isAdmin: true });
  await openAdmin(page, world);
  await page.getByRole("link", { name: "Add a Song" }).click();

  // The mock answers like a key whose daily quota is used up.
  await page.getByPlaceholder("Type here to search...").fill("quota exceeded");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByRole("button", { name: "Search" })).toBeEnabled({ timeout: 5_000 });
});
