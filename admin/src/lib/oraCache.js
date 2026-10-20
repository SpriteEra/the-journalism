/**
 * OraAI response cache in the browser (localStorage, per key, with a time limit).
 * Together with the server cache this means an editor opening the trends panel again — or after a refresh — never waits for
 * (or pays for) a second upstream call. Values are served instantly; react-query refreshes them in the background once stale.
 */
const PREFIX = "ora:v1:";

export const readOra = (key, maxAgeMs) => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (!at || Date.now() - at > maxAgeMs) return null;
    return { at, data };
  } catch { return null; }
};

export const writeOra = (key, data) => {
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), data })); } catch { /* storage full: skip */ }
};

export const clearOra = () => {
  try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
};
