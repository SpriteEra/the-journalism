/**
 * Reference data that rarely changes (categories, states, districts) is kept in localStorage, so the news form and the filters open
 * instantly after a reload instead of waiting for the network. It is shown at once and refreshed in the background once it is
 * older than STALE. Nothing user-specific (permissions, people) is ever stored here.
 */
const KEY = "rq:ref:v1";
const MAX_AGE = 12 * 3600_000;
export const REFERENCE_KEYS = new Set(["categories", "states", "districts"]);
export const REFERENCE_STALE = 6 * 3600_000;

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };

export const hydrateReferenceData = (client) => {
  const saved = read();
  Object.entries(saved).forEach(([k, v]) => {
    if (!v || Date.now() - v.at > MAX_AGE) return;
    client.setQueryData(JSON.parse(k), v.data, { updatedAt: v.at });
  });
};

export const persistReferenceData = (client) => {
  let timer;
  return client.getQueryCache().subscribe((event) => {
    const q = event?.query;
    if (!q || event.type !== "updated" || q.state.status !== "success" || !REFERENCE_KEYS.has(q.queryKey[0])) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const out = read();
      out[JSON.stringify(q.queryKey)] = { at: q.state.dataUpdatedAt, data: q.state.data };
      try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* storage full */ }
    }, 300);
  });
};

export const clearReferenceData = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
