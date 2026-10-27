/**
 * Server API client. Runs on the Next.js SERVER only (the API address is never sent to the browser).
 *
 *   apiGet("/news/home", { revalidate: 60 })          -> parsed JSON, throws ApiError on failure
 *   apiGetOrNull("/news/get/abc")                      -> null when the server says 404
 *   safe(apiGet(...), fallback)                        -> never throws (logs it), for non-critical page parts
 *
 * Pages are cached with Next's data cache (`revalidate` seconds) so a burst of readers never reaches the database.
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) { super(message); this.name = "ApiError"; this.status = status; this.data = data; }
}

export const apiBase = () => String(process.env.SERVER_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
/** origin of the server without /api/v1 (sitemap.xml and robots.txt live there) */
export const apiOrigin = () => apiBase().replace(/\/api\/v1$/, "");

const query = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") sp.set(k, String(v)); });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const apiUrl = (path, params) => `${apiBase()}${path.startsWith("/") ? path : `/${path}`}${query(params)}`;

export async function apiGet(path, { params, revalidate = 60, tags, timeout = 8000, method = "GET", body, headers } = {}) {
  const init = {
    method,
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    signal: AbortSignal.timeout(timeout),
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(revalidate === 0 ? { cache: "no-store" } : { next: { revalidate, ...(tags ? { tags } : {}) } }),
  };
  let res;
  try { res = await fetch(apiUrl(path, params), init); }
  catch (e) { throw new ApiError(e?.name === "TimeoutError" ? "The server took too long to answer" : "Could not reach the server", 503); }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || data?.error || `Request failed (${res.status})`, res.status, data);
  return data;
}

export async function apiGetOrNull(path, opts) {
  try { return await apiGet(path, opts); }
  catch (e) { if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null; throw e; }
}

/** Await a promise and return `fallback` if it fails: one broken widget must not take the whole page down. */
export async function safe(promise, fallback) {
  try { return await promise; }
  catch (e) { console.error(`[api] ${e?.message || e}`); return fallback; }
}
