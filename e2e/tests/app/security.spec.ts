// Who may do what, what a crafted request can do, races, and what must never reach the browser.
import { GOOGLE_API_KEY } from "../../app.config";
import { APP_PORT } from "../../constants";
import { expect, jukeboxData, startOfLockBucket, test, video } from "../../fixtures";
import { withPrivateServer } from "../../helpers/privateServer";
import { BUG, nowPlaying, openDrawer, sseStatus, tile } from "./helpers";

const A = video("sec-a", "Alpha Song");
const B = video("sec-b", "Bravo Song");
const C = video("sec-c", "Charlie Song");
const ids = (...videos: { id: { videoId: string } }[]) => videos.map((v) => v.id.videoId);
const playing = jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId, queue: ids(B, C) });

test.describe("players can't use admin routes", () => {
  const adminOnly = [
    { name: "search YouTube", path: "/search", data: { q: "player search" } },
    { name: "add to the catalog", path: "/add-media", data: { videos: [video("sec-new")], type: "catalog" } },
    { name: "remove from the catalog", path: "/remove-media", data: { videoIds: ids(B), type: "catalog" } },
    { name: "remove from the queue", path: "/remove-media", data: { videoIds: ids(B), type: "queue" } },
    { name: "skip the song", path: "/next", data: undefined },
    { name: "change the settings", path: "/settings", data: { mode: "jukebox", name: "Hijacked" } },
  ];
  for (const { name, path, data } of adminOnly) {
    test(name, async ({ request, world }) => {
      await world.seed({ assetData: playing });

      const response = await request.post(world.api(path), { data });

      expect(response.status()).toBe(401);
      expect(await world.assetData()).toEqual(playing);
      expect(await world.mediaChanges()).toEqual([]);
    });
  }
});

test("a player can only queue songs from the catalog", async ({ request, world }) => {
  test.fail(true, `${BUG} #2: add-media queues any id a player sends`);
  await world.seed({ assetData: playing });

  const response = await request.post(world.api("/add-media"), { data: { videos: ["not-in-catalog"], type: "queue" } });

  expect(response.ok()).toBe(false);
  expect((await world.assetData()).queue).toEqual(ids(B, C));
});

test("a player can't overwrite other jukebox fields through add-media", async ({ request, world }) => {
  test.fail(true, `${BUG} #3: add-media writes to any data-object key named by "type"`);
  await world.seed({ assetData: jukeboxData({ catalog: [A, B] }) });

  // Only "catalog" is admin-checked: any other "type" names the data-object key that gets appended to.
  await request.post(world.api("/add-media"), { data: { videos: ["x"], type: "nowPlaying" } });

  expect((await world.assetData()).nowPlaying).toBe("-1");
  // With nowPlaying corrupted, the next pick no longer starts the jukebox.
  await startOfLockBucket(10_000);
  await request.post(world.api("/add-media", world.other()), { data: { videos: ids(A), type: "queue" } });
  expect((await world.assetData()).nowPlaying).toBe(A.id.videoId);
});

test("players can't skip the song by calling the end-of-song webhook themselves", async ({ request, world }) => {
  test.fail(true, `${BUG} #6: /webhook/next skips for any visitor, mid-song`);
  // The song started a moment ago: it hasn't ended.
  await world.seed({ asset: { mediaPlayTime: Date.now() }, assetData: playing });

  await request.post("/webhook/next", { data: Object.fromEntries(world.credentials()) });

  expect((await world.assetData()).nowPlaying).toBe(A.id.videoId);
  expect(await world.mediaChanges()).toEqual([]);
});

test("two players queuing songs moments apart both get their song in", async ({ request, world }) => {
  test.fail(true, `${BUG} #7: a second add within the same 10-second lock window answers 409 and is dropped`);
  await world.seed({ assetData: jukeboxData({ catalog: [A, B, C], nowPlaying: A.id.videoId }) });
  await startOfLockBucket(10_000);

  const first = await request.post(world.api("/add-media"), { data: { videos: ids(B), type: "queue" } });
  const second = await request.post(world.api("/add-media", world.other()), { data: { videos: ids(C), type: "queue" } });

  expect(first.ok()).toBe(true);
  expect(second.ok()).toBe(true);
  expect((await world.assetData()).queue).toEqual(ids(B, C));
});

test("an admin can add to the catalog and then remove a song right away", async ({ request, world }) => {
  test.fail(true, `${BUG} #7: add and remove share the 10-second lock window`);
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B] }) });
  await startOfLockBucket(10_000);

  const add = await request.post(world.api("/add-media"), { data: { videos: [C], type: "catalog" } });
  const remove = await request.post(world.api("/remove-media"), { data: { videoIds: ids(A), type: "catalog" } });

  expect(add.ok()).toBe(true);
  expect(remove.ok()).toBe(true);
  expect((await world.assetData()).catalog).toEqual([B, C]);
});

test("skipping past songs gone from YouTube stops the jukebox and tells open drawers", async ({ page, request, world }) => {
  test.fail(true, `${BUG} #8: next answers 409 and broadcasts nothing when no queued song is available`);
  const gone = video("sec-gone", "Deleted Song");
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, gone], nowPlaying: A.id.videoId, queue: ids(gone) }) });
  await openDrawer(page, world);
  await expect(tile(nowPlaying(page), "Alpha Song")).toBeVisible();

  const response = await request.post(world.api("/next"));

  expect(await world.assetData()).toMatchObject({ nowPlaying: "-1", queue: [] });
  expect(response.ok()).toBe(true);
  await expect(page.getByText("Now Playing:")).toHaveCount(0, { timeout: 3_000 });
});

test("opening the drawer as a player doesn't spend YouTube quota", async ({ page, world }) => {
  test.fail(true, `${BUG} #9: checkIsAdmin isn't awaited, so every drawer open checks the catalog on YouTube`);
  const own = video(`quota-${world.urlSlug}`, "Quota Song");
  await world.seed({ assetData: jukeboxData({ catalog: [own] }) });

  await openDrawer(page, world);

  expect(await world.youtubeCalls(own.id.videoId)).toEqual([]);
});

test("removing a queued repeat of the playing song doesn't stop it", async ({ request, world }) => {
  test.fail(true, `${BUG} #10: removing an id from the queue also skips it when it's the song playing`);
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A, B], nowPlaying: A.id.videoId, queue: ids(B, A) }) });

  const response = await request.post(world.api("/remove-media"), { data: { videoIds: ids(A), type: "queue" } });

  expect(response.ok()).toBe(true);
  expect(await world.assetData()).toMatchObject({ nowPlaying: A.id.videoId, queue: ids(B) });
  expect(await world.mediaChanges()).toEqual([]);
});

test("changing the mode while nothing plays leaves the media off", async ({ request, world }) => {
  test.fail(true, `${BUG} #11: a mode change always sets a link media, even with no song`);
  await world.seed({ isAdmin: true, assetData: jukeboxData({ catalog: [A] }) });

  expect((await request.post(world.api("/settings"), { data: { mode: "jukebox" } })).ok()).toBe(true);

  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(await world.mediaChanges()).toEqual([]);
});

test.describe("the live stream", () => {
  test("opens with the drawer's session credentials", async ({ world }) => {
    await world.seed();
    expect(await sseStatus(`http://localhost:${APP_PORT}`, world.credentials().toString())).toBe(200);
  });

  test("needs session credentials, not just a nonce", async ({ world }) => {
    test.fail(true, `${BUG} #12: /api/sse only checks that interactiveNonce is present`);
    await world.seed();
    expect(await sseStatus(`http://localhost:${APP_PORT}`, `interactiveNonce=anything&assetId=${world.assetId}`)).toBe(400);
  });

  test("rejects a stream without a nonce", async ({ world }) => {
    await world.seed();
    const credentials = world.credentials();
    credentials.delete("interactiveNonce");
    expect(await sseStatus(`http://localhost:${APP_PORT}`, credentials.toString())).toBe(400);
  });
});

test("a failed YouTube search doesn't send the Google API key to the browser", async ({ request, world }) => {
  test.fail(true, `${BUG} #4: the search error response carries the request config, API key included`);
  await world.seed({ isAdmin: true });

  // The mock answers like a key whose daily quota is used up.
  const response = await request.post(world.api("/search"), { data: { q: "quota exceeded" } });

  expect(response.ok()).toBe(false);
  expect(await response.text()).not.toContain(GOOGLE_API_KEY);
});

test("a player's malformed add-media request doesn't take the server down", async ({ world }) => {
  test.slow();
  await world.seed();

  const { alive, error } = await withPrivateServer((baseURL) =>
    fetch(`${baseURL}/api/add-media?${world.credentials()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videos: ["x"] }),
      // The handler throws outside try/catch: the server survives, but nothing answers the request.
      signal: AbortSignal.timeout(10_000),
    }),
  );

  expect(alive, "the app process exited").toBe(true);
  // Marked only now: the process surviving is fixed, the missing answer isn't.
  test.fail(true, `${BUG} #1: add-media throws outside try/catch on a body without a valid "type"; the request is never answered`);
  expect(error, "the request was never answered").toBeUndefined();
});
