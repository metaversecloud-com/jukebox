// The drawer a player opens from the jukebox: what's playing, what's next, and who gets admin controls.
import { expect, jukeboxData, test, video } from "../../fixtures";
import { BUG, nextUp, nowPlaying, openDrawer, tile } from "./helpers";

const A = video("drawer-a", "Alpha Song");
const B = video("drawer-b", "Bravo Song", 3_725_000);
const C = video("drawer-c", "Charlie Song");

test("a freshly dropped jukebox sets up its data object and shows nothing playing", async ({ page, world }) => {
  await world.seed();
  await openDrawer(page, world);

  await expect(page.getByRole("heading", { name: "Karaoke" })).toBeVisible();
  await expect(page.getByText("Now Playing:")).toHaveCount(0);
  await expect(page.getByText("Next Up:")).toHaveCount(0);
  expect(await world.assetData()).toEqual(jukeboxData());
  // Sent without waiting for it.
  await expect.poll(() => world.analytics()).toContain("views");
});

test("a jukebox from before settings existed keeps its catalog and defaults to karaoke", async ({ page, world }) => {
  await world.seed({ assetData: { catalog: [A, B], queue: [B.id.videoId], nowPlaying: A.id.videoId } });
  await openDrawer(page, world);

  await expect(page.getByRole("heading", { name: "Karaoke" })).toBeVisible();
  await expect(tile(nowPlaying(page), "Alpha Song")).toBeVisible();
  await expect(nextUp(page)).toHaveCount(1);
  expect(await world.assetData()).toEqual({ catalog: [A, B], queue: [B.id.videoId], nowPlaying: A.id.videoId });
});

test("shows the song playing and the queue in order, with durations", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: [B.id.videoId, C.id.videoId] }) });
  await openDrawer(page, world);

  await expect(tile(nowPlaying(page), "Alpha Song")).toContainText("3:25");
  await expect(nextUp(page)).toHaveCount(2);
  await expect(nextUp(page).nth(0)).toContainText("Bravo Song");
  await expect(nextUp(page).nth(0)).toContainText("1:02:05");
  await expect(nextUp(page).nth(1)).toContainText("Charlie Song");
});

test("players get no admin tab, skip button or queue controls", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ catalog: [A, B], nowPlaying: A.id.videoId, queue: [B.id.videoId] }) });
  await openDrawer(page, world);

  await expect(tile(page, "Bravo Song")).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Skip to Next Song" })).toHaveCount(0);
  await expect(tile(page, "Bravo Song").locator("button")).toHaveCount(0);
});

test("admins get the admin tab, skip button and queue controls", async ({ page, world }) => {
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B], nowPlaying: A.id.videoId, queue: [B.id.videoId] }) });
  await openDrawer(page, world);

  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip to Next Song" })).toBeVisible();
  await expect(tile(page, "Bravo Song").locator("button")).toBeVisible();
});

test("the skip button only shows while songs are queued", async ({ page, world }) => {
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A], nowPlaying: A.id.videoId }) });
  await openDrawer(page, world);

  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip to Next Song" })).toHaveCount(0);
});

test("the header shows the jukebox's custom name and image", async ({ page, world }) => {
  await world.seed({
    assetData: jukeboxData({ settings: { mode: "jukebox", name: "Friday Tunes", imageUrl: "https://example.invalid/tunes.png" } }),
  });
  await openDrawer(page, world);

  await expect(page.getByRole("heading", { name: "Friday Tunes" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Friday Tunes" })).toHaveAttribute("src", "https://example.invalid/tunes.png");
});

test("without a custom name the header names the mode", async ({ page, world }) => {
  await world.seed({ assetData: jukeboxData({ settings: { mode: "jukebox", name: " ", imageUrl: "" } }) });
  await openDrawer(page, world);

  await expect(page.getByRole("heading", { name: "Jukebox" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Jukebox" })).toHaveAttribute("src", "jukebox_bg.png");
});

test("shows the error page when the jukebox asset is gone", async ({ page, world }) => {
  await world.seed({ withAsset: false });
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Under Construction" })).toBeVisible();
});

test("a queued song that isn't in the catalog doesn't blank the drawer", async ({ page, world }) => {
  test.fail(true, `${BUG} #2: a queue entry missing from the catalog crashes the drawer for everyone`);
  await world.seed({ assetData: jukeboxData({ catalog: [A], nowPlaying: A.id.videoId, queue: ["not-in-catalog"] }) });
  await page.goto(world.url("/"));

  await expect(page.getByRole("link", { name: "Add a Song" })).toBeVisible({ timeout: 5_000 });
});
