// Picking songs from the catalog, what the jukebox asset then plays, skipping, the end-of-song
// webhook, and other open drawers following along live.
import { expect, jukeboxData, test, video } from "../../fixtures";
import { nextUp, nowPlaying, openDrawer, tile, toggle } from "./helpers";

const A = video("queue-a", "Alpha Song");
const B = video("queue-b", "Bravo Song");
const C = video("queue-c", "Charlie Song");
const GONE = video("queue-gone", "Deleted Song");
const ids = (...videos: { id: { videoId: string } }[]) => videos.map((v) => v.id.videoId);
const youtubeLink = (v: { id: { videoId: string } }) => `https://www.youtube.com/watch?v=${v.id.videoId}`;
const TEN_MINUTES_AGO = Date.now() - 10 * 60_000;

test("a player's first picks start the jukebox: the first plays, the rest queue up", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A, B, C] }) });
  await openDrawer(page, world);

  await page.getByRole("link", { name: "Add a Song" }).click();
  await toggle(page, "Alpha Song");
  await toggle(page, "Bravo Song");
  await page.getByRole("button", { name: "Add (2)" }).click();
  await expect(page.getByRole("button", { name: /^(Add \(|Adding)/ })).toHaveCount(0);
  await page.locator("a[href='/']").click();

  await expect(tile(nowPlaying(page), "Alpha Song")).toBeVisible();
  await expect(nextUp(page)).toHaveCount(1);
  await expect(nextUp(page).first()).toContainText("Bravo Song");
  expect(await world.assetData()).toMatchObject({ nowPlaying: A.id.videoId, queue: ids(B) });
  expect(await world.mediaChanges()).toEqual([
    expect.objectContaining({ mediaType: "link", mediaLink: youtubeLink(A), isVideo: true, syncUserMedia: true }),
  ]);
  // Fire-and-forget in the app: it may land just after the response.
  await expect.poll(() => world.events("particles")).toEqual([expect.objectContaining({ particleName: "musicNote_float" })]);
  expect(await world.analytics()).toEqual(expect.arrayContaining(["addsToQueue", "plays"]));
});

test("in jukebox mode songs play as audio only", async ({ request, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A], settings: { mode: "jukebox", name: "", imageUrl: "" } }) });

  expect((await request.post(world.api("/add-media"), { data: { videos: ids(A), type: "queue" } })).ok()).toBe(true);

  expect(await world.mediaChanges()).toEqual([expect.objectContaining({ mediaLink: youtubeLink(A), isVideo: false })]);
});

test("songs picked while one plays go to the end of the queue without touching playback", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: ids(B) }) });
  await openDrawer(page, world);

  await page.getByRole("link", { name: "Add a Song" }).click();
  await toggle(page, "Charlie Song");
  await page.getByRole("button", { name: "Add (1)" }).click();
  await expect(page.getByRole("button", { name: /^(Add \(|Adding)/ })).toHaveCount(0);

  expect(await world.assetData()).toMatchObject({ nowPlaying: A.id.videoId, queue: ids(B, C) });
  expect(await world.mediaChanges()).toEqual([]);
  expect(await world.events("particles")).toEqual([]);
});

test("the catalog search filters songs by title", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A, B, C] }) });
  await openDrawer(page, world);
  await page.getByRole("link", { name: "Add a Song" }).click();
  await expect(tile(page, "Charlie Song")).toBeVisible();

  await page.getByPlaceholder("Type here to search...").fill("bRaVo");

  await expect(tile(page, "Bravo Song")).toBeVisible();
  await expect(tile(page, "Alpha Song")).toHaveCount(0);
  await expect(tile(page, "Charlie Song")).toHaveCount(0);
});

test("songs already playing or queued can't be picked again", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: ids(B) }) });
  await openDrawer(page, world);
  await page.getByRole("link", { name: "Add a Song" }).click();

  await expect(tile(page, "Charlie Song").locator("button")).toBeVisible();
  await expect(tile(page, "Alpha Song").locator("button")).toHaveCount(0);
  await expect(tile(page, "Bravo Song").locator("button")).toHaveCount(0);
});

test("an admin skips to the next song still on YouTube", async ({ page, world }) => {
  await world.seed({
    isAdmin: true,
    assetData: jukeboxData({ catalog: [A, GONE, B, C], nowPlaying: A.id.videoId, queue: ids(GONE, B, C) }),
  });
  await openDrawer(page, world);

  await page.getByRole("button", { name: "Skip to Next Song" }).click();

  // The drawer learns about the new song over the live stream, like every other open drawer.
  await expect(tile(nowPlaying(page), "Bravo Song")).toBeVisible();
  await expect(nextUp(page)).toHaveCount(1);
  await expect(nextUp(page).first()).toContainText("Charlie Song");
  expect(await world.assetData()).toMatchObject({ nowPlaying: B.id.videoId, queue: ids(C) });
  expect(await world.mediaChanges()).toEqual([expect.objectContaining({ mediaType: "link", mediaLink: youtubeLink(B) })]);
  // Fire-and-forget in the app: it may land just after the response.
  await expect.poll(() => world.events("particles")).toEqual([expect.objectContaining({ particleName: "musicNote_float" })]);
  expect(await world.analytics()).toContain("plays");
});

test("when a song ends, Topia's webhook plays the next one", async ({ request, world }) => {
  await world.seed({
    asset: { mediaPlayTime: TEN_MINUTES_AGO },
    assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: ids(B, C) }),
  });

  const response = await request.post("/webhook/next", { data: Object.fromEntries(world.credentials()) });

  expect(response.ok()).toBe(true);
  expect(await world.assetData()).toMatchObject({ nowPlaying: B.id.videoId, queue: ids(C) });
  expect(await world.mediaChanges()).toEqual([expect.objectContaining({ mediaLink: youtubeLink(B) })]);
});

test("when the last song ends the jukebox stops and the drawer shows nothing playing", async ({ page, request, world }) => {
  await world.seed({ asset: { mediaPlayTime: TEN_MINUTES_AGO }, assetData: jukeboxData({ catalog: [A, B], nowPlaying: A.id.videoId }) });
  await openDrawer(page, world);
  await expect(tile(nowPlaying(page), "Alpha Song")).toBeVisible();

  expect((await request.post("/webhook/next", { data: Object.fromEntries(world.credentials()) })).ok()).toBe(true);

  await expect(page.getByText("Now Playing:")).toHaveCount(0);
  expect(await world.assetData()).toMatchObject({ nowPlaying: "-1", queue: [] });
  expect(await world.mediaChanges()).toEqual([expect.objectContaining({ mediaType: "none" })]);
});

test("an admin removes songs from the queue", async ({ page, world }) => {
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: ids(B, C) }) });
  await openDrawer(page, world);

  await toggle(page, "Bravo Song");
  await page.getByRole("button", { name: "Remove (1)" }).click();

  await expect(nextUp(page)).toHaveCount(1);
  await expect(nextUp(page).first()).toContainText("Charlie Song");
  expect(await world.assetData()).toMatchObject({ nowPlaying: A.id.videoId, queue: ids(C), catalog: [A, B, C] });
  expect(await world.mediaChanges()).toEqual([]);
});

test("other open drawers follow queue changes and skips live", async ({ browser, page, world }) => {
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId }) });
  const playerPage = await (await browser.newContext()).newPage();
  await openDrawer(page, world);
  await openDrawer(playerPage, world, world.other());
  await expect(tile(nowPlaying(playerPage), "Alpha Song")).toBeVisible();

  // The player queues two songs; the admin's drawer shows them without a reload.
  await playerPage.getByRole("link", { name: "Add a Song" }).click();
  await toggle(playerPage, "Bravo Song");
  await toggle(playerPage, "Charlie Song");
  await playerPage.getByRole("button", { name: "Add (2)" }).click();
  await expect(nextUp(page)).toHaveCount(2);
  await expect(nextUp(page).first()).toContainText("Bravo Song");

  // The admin skips; the player's drawer moves on too.
  await page.getByRole("button", { name: "Skip to Next Song" }).click();
  await playerPage.locator("a[href='/']").click();
  await expect(tile(nowPlaying(playerPage), "Bravo Song")).toBeVisible();
  await expect(nextUp(playerPage)).toHaveCount(1);
  await expect(nextUp(playerPage).first()).toContainText("Charlie Song");
  await playerPage.context().close();
});
