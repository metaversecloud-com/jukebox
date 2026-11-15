// Per-app settings for the shared platform tests in tests/platform. Every app edits this file;
// the platform specs themselves stay identical across SDK apps.

/**
 * Bugs a route still has, each set to its tracking reason (e.g. "EXP-429: ..."). The matching
 * platform test is marked test.fail: it passes while the bug exists and fails once it's fixed, so
 * the entry is removed together with the fix. Leave out what the route doesn't have.
 */
export type KnownBugs = {
  /** The response contains the interactive secret or a signed InteractiveJWT. */
  leaksSecret?: string;
  /** A request without session credentials succeeds. */
  acceptsMissingCredentials?: string;
  /** Credentials signed for another app's public key are accepted. */
  acceptsForeignCredentials?: string;
  /** Bad credentials fail later on a Topia call instead of with a credential error. */
  unnamedCredentialError?: string;
};

export type RouteSpec = {
  method: "get" | "post" | "put" | "delete";
  /** Path under basePath, without the query string. */
  path: string;
  /** Where the router is mounted. Default "/api"; e.g. "/webhook" for a separate webhook router. */
  basePath?: string;
  /**
   * Where the route reads the session credentials. "query" (default) is the iframe's backendAPI call.
   * "body": webhooks (asset clicks, zone events) get them as top-level fields of the JSON body, and
   * read them with getCredentials(req.body). The platform tests then merge them into `data`.
   */
  credentialsIn?: "query" | "body";
  data?: Record<string, unknown>;
  knownBugs?: KnownBugs;
};

const JUKEBOX_BUG = "EXP-453";
// server/utils/getCredentials.ts only checks that the fields are present: it never compares
// interactivePublicKey with INTERACTIVE_KEY, so another app's credentials go through.
export const NO_KEY_CHECK = `${JUKEBOX_BUG} #5: getCredentials never checks interactivePublicKey`;
const FOREIGN = { acceptsForeignCredentials: NO_KEY_CHECK, unnamedCredentialError: NO_KEY_CHECK };

/**
 * API routes that read the session credentials (getCredentials). Each one must reject missing or
 * foreign credentials and must never send the interactive secret to the browser. List them all.
 *
 * Except server-sent-event streams (GET /sse): with valid credentials the response never ends, so
 * the platform tests can't read its body and time out. tests/app/security.spec.ts covers it.
 *
 * Also except UNGUARDED_ROUTES below.
 */
export const CREDENTIALED_ROUTES: RouteSpec[] = [
  // The only route that compares the public key.
  { method: "get", path: "/system/interactive-credentials" },
  { method: "get", path: "/jukebox", knownBugs: FOREIGN },
  { method: "get", path: "/is-admin", knownBugs: FOREIGN },
];

/**
 * Routes whose handler (or the isAdmin middleware) calls getCredentials outside any try/catch: a
 * request without credentials becomes an unhandled rejection, and @rtsdk/topia's unhandledRejection
 * hook calls process.exit(1). The platform "rejects a request without session credentials" test would
 * take the shared server down mid-suite, so tests/app/security.spec.ts runs the platform checks for
 * these (foreign credentials, secret scan) and the missing-credentials one against a private server.
 */
export const UNGUARDED_ROUTES: RouteSpec[] = [
  { method: "post", path: "/search", data: { q: "lofi" } },
  { method: "post", path: "/add-media", data: { videos: ["nope"], type: "queue" } },
  { method: "post", path: "/remove-media", data: { videoIds: ["nope"], type: "queue" } },
  { method: "post", path: "/next" },
  { method: "post", path: "/settings", data: { mode: "karaoke" } },
  // Topia calls this when a song ends, with the session credentials in the body.
  { method: "post", path: "/next", basePath: "/webhook", credentialsIn: "body" },
];

/**
 * Page the app opens in its iframe; the platform tests load it with valid credentials. null if the app
 * has no page (no client/, driven only by webhooks): the platform tests that load a page are skipped.
 */
export const ENTRY_PAGE: string | null = "/";

/** Bugs seen when loading ENTRY_PAGE (only leaksSecret applies). */
export const ENTRY_PAGE_KNOWN_BUGS: Pick<KnownBugs, "leaksSecret"> = {};

/** Text the app shell's HTML must contain. Change it if the app isn't a React root (e.g. Unity). */
export const APP_SHELL_MARKER = 'id="root"';
