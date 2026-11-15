import { APIRequestContext, test as base, expect } from "@playwright/test";
import { INTERACTIVE_KEY, MOCK_TOPIA_URL } from "./constants";

export const SCENE_DROP_ID = "scene-1";
export const VISITOR_ID = 42;

// ---- Jukebox ----

/** A second visitor in every world (another player at the jukebox). Not an admin unless seeded so. */
export const OTHER_VISITOR_ID = 43;

/** A catalog entry the way the app stores it: a YouTube search result plus its duration in ms. */
export const video = (videoId: string, title = `Song ${videoId}`, duration = 205_000) => ({
  id: { videoId },
  snippet: {
    title,
    publishedAt: "2024-01-01T00:00:00Z",
    thumbnails: { high: { url: `https://example.invalid/yt/${videoId}.jpg` } },
  },
  duration,
});

/** The jukebox asset's data object (catalog of videos, queue of video ids, nowPlaying id or "-1"). */
export const jukeboxData = ({
  catalog = [] as ReturnType<typeof video>[],
  queue = [] as string[],
  nowPlaying = "-1",
  settings = { mode: "karaoke", name: "", imageUrl: "" } as Record<string, string>,
} = {}) => ({ catalog, queue, nowPlaying, settings });

/**
 * The app's write locks are time buckets (Math.round(now / bucketMs)): add/remove 10 s, skip 25 s,
 * settings 5 s. Waits until a fresh bucket has just started, so the next requests all share one bucket.
 */
export const startOfLockBucket = async (bucketMs: number) => {
  const sinceBoundary = (Date.now() - bucketMs / 2 + bucketMs) % bucketMs;
  await new Promise((resolve) => setTimeout(resolve, (bucketMs - sinceBoundary + 50) % bucketMs));
};

export type SeedOptions = {
  isAdmin?: boolean;
  /** Visitor is standing inside the asset's zone. */
  inZone?: boolean;
  /** false = the dropped asset the app was opened from doesn't exist in the world. */
  withAsset?: boolean;
  /** Extra dropped-asset fields (assetName, topLayerURL, uniqueName, ...). */
  asset?: Record<string, unknown>;
  /** The dropped asset's data object. */
  assetData?: Record<string, unknown>;
  /** The world's data object. */
  worldData?: Record<string, unknown>;
  /** The visitor's data object. */
  visitorData?: Record<string, unknown>;
  /** Badges the visitor already owns. */
  badges?: string[];
  /** Further dropped assets in the world, keyed by id. */
  extraAssets?: Record<string, Record<string, unknown>>;
  /** OTHER_VISITOR_ID is an admin. */
  otherIsAdmin?: boolean;
  /** Delay for every public-API call into the world, so concurrent requests overlap. */
  latencyMs?: number;
  /**
   * Delay for matching public-API calls only: { "<substring of 'METHOD /api/v1/world/...'>": ms }, e.g.
   * { "PUT /api/v1/world": 300 } or { "/visitors/42/set-data-object": 400 }. Adds to latencyMs.
   */
  delays?: Record<string, number>;
};

/** A visitor inventory entry shaped like GET get-visitor-inventory-items returns it. */
const ownedBadge = (name: string) => ({
  id: `owned-${name}`,
  item_id: `owned-${name}`,
  itemId: `owned-${name}`,
  name,
  type: "BADGE",
  image_url: "",
  quantity: 1,
  status: "ACTIVE",
  item: { id: `owned-${name}`, name, type: "BADGE", image_url: "" },
});

/** One isolated Topia world in mock-topia, plus helpers to open the app inside it. */
export class TopiaWorld {
  readonly displayName = "E2E Player";
  /**
   * The jukebox asset's id, unique per world: the app's SSE fan-out matches open drawers by assetId
   * alone (real asset ids are globally unique), so a shared id would leak events between parallel tests.
   */
  readonly assetId: string;

  constructor(
    readonly urlSlug: string,
    readonly profileId: string,
    private request: APIRequestContext,
  ) {
    this.assetId = `jukebox-${urlSlug}`;
  }

  async seed({
    isAdmin = false,
    inZone = true,
    withAsset = true,
    asset = {},
    assetData = {},
    worldData = {},
    visitorData = {},
    badges = [],
    extraAssets = {},
    otherIsAdmin = false,
    latencyMs = 0,
    delays = {},
  }: SeedOptions = {}) {
    const assets: Record<string, any> = { ...extraAssets };
    if (withAsset) {
      assets[this.assetId] = {
        id: this.assetId,
        assetName: "E2E Asset",
        position: { x: 500, y: 500 },
        uniqueName: "e2e-asset",
        sceneDropId: SCENE_DROP_ID,
        topLayerURL: "https://example.invalid/e2e-asset.png",
        ...asset,
        dataObject: assetData,
      };
    }

    const response = await this.request.post(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`, {
      data: {
        dataObject: worldData,
        latencyMs,
        delays,
        assets,
        visitors: {
          [VISITOR_ID]: {
            isAdmin,
            profileId: this.profileId,
            displayName: this.displayName,
            landmarkZonesString: inZone ? Object.keys(assets).join(",") : "",
            privateZoneId: "",
            dataObject: visitorData,
            inventory: badges.map(ownedBadge),
            // getVisitor treats a visitor without a username as "Not in world".
            username: "e2e-player",
          },
          [OTHER_VISITOR_ID]: {
            isAdmin: otherIsAdmin,
            profileId: `${this.profileId}-other`,
            displayName: "Other Player",
            username: "other-player",
            landmarkZonesString: "",
            privateZoneId: "",
            dataObject: {},
            inventory: [],
          },
        },
      },
    });
    if (!response.ok()) throw new Error(`Seeding mock world failed: ${response.status()}`);
  }

  /** Changes visitor fields mid-test (moveTo, isAdmin, landmarkZonesString, ...). */
  async updateVisitor(fields: Record<string, unknown>, visitorId = VISITOR_ID) {
    const response = await this.request.patch(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}/visitors/${visitorId}`, {
      data: fields,
    });
    if (!response.ok()) throw new Error(`Updating mock visitor failed: ${response.status()}`);
  }

  async state() {
    const response = await this.request.get(`${MOCK_TOPIA_URL}/__mock/worlds/${this.urlSlug}`);
    return (await response.json()) as {
      dataObject: Record<string, any>;
      assets: Record<string, any>;
      visitors: Record<string, any>;
      events: Array<Record<string, any>>;
      unhandled: string[];
    };
  }

  async assetData(assetId = this.assetId) {
    return (await this.state()).assets[assetId]?.dataObject;
  }

  async visitorData() {
    return (await this.state()).visitors[VISITOR_ID].dataObject;
  }

  async events(type?: string) {
    const { events } = await this.state();
    return type ? events.filter((e) => e.type === type) : events;
  }

  /** Session credentials Topia appends to the app's iframe URL. */
  credentials(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      assetId: this.assetId,
      displayName: this.displayName,
      identityId: "identity-1",
      // Unique per world: apps that key state by nonce across worlds (SSE connections, caches) would
      // otherwise mix up parallel tests.
      interactiveNonce: `e2e-nonce-${this.urlSlug}`,
      interactivePublicKey: INTERACTIVE_KEY,
      profileId: this.profileId,
      sceneDropId: SCENE_DROP_ID,
      uniqueName: "e2e-asset",
      urlSlug: this.urlSlug,
      username: "e2e-player",
      visitorId: String(VISITOR_ID),
      ...overrides,
    });
  }

  /** Credential overrides for OTHER_VISITOR_ID: their own drawer, with its own nonce. */
  other() {
    return {
      visitorId: String(OTHER_VISITOR_ID),
      profileId: `${this.profileId}-other`,
      displayName: "Other Player",
      username: "other-player",
      interactiveNonce: `e2e-nonce-other-${this.urlSlug}`,
    };
  }

  /** The asset's media changes (DroppedAsset.updateMediaType), oldest first. */
  async mediaChanges() {
    return this.events("change-media-type");
  }

  /** Names of the analytics the app recorded with its data-object writes. */
  async analytics() {
    return (await this.events("analytics")).map((e) => e.analyticName as string);
  }

  /** YouTube Data API calls (path + query) that mention any of `needles` (video ids or a search query). */
  async youtubeCalls(...needles: string[]) {
    const calls = (await (await this.request.get(`${MOCK_TOPIA_URL}/__mock/youtube`)).json()) as {
      path: string;
      query: Record<string, string>;
    }[];
    return calls.filter((call) => needles.some((needle) => JSON.stringify(call.query).includes(needle)));
  }

  /** App page URL as Topia opens it in the iframe. */
  url(path = "/", overrides: Record<string, string> = {}) {
    return `${path}?${this.credentials(overrides)}`;
  }

  /** App API path carrying the session credentials, as the client's backendAPI sends them. */
  api(path: string, overrides: Record<string, string> = {}) {
    return `/api${path}?${this.credentials(overrides)}`;
  }
}

export const test = base.extend<{ world: TopiaWorld }>({
  // The browser may only talk to the app: anything else (CDNs, analytics, real Topia) is aborted, so a
  // test can't pass or flake on the network.
  context: async ({ context }, use) => {
    await context.route(
      (url) => !["localhost", "127.0.0.1"].includes(url.hostname),
      (route) => route.abort(),
    );
    await use(context);
  },
  world: async ({ request }, use, testInfo) => {
    const id = `${testInfo.testId}-${testInfo.repeatEachIndex}-${testInfo.retry}`.replace(/[^a-zA-Z0-9-]/g, "");
    const world = new TopiaWorld(`world-${id}`, `profile-${id}`, request);
    await use(world);

    // Fail the test if the app called a public-API endpoint the mock doesn't implement (e.g. after an
    // @rtsdk/topia upgrade): it would otherwise pass against a 501 the real API never returns.
    expect((await world.state()).unhandled, "public-API calls mock-topia doesn't implement").toEqual([]);
    const outside = await (await request.get(`${MOCK_TOPIA_URL}/__mock/unhandled`)).json();
    expect(outside, "public-API calls mock-topia doesn't implement").toEqual([]);
  },
});

export { expect } from "@playwright/test";
