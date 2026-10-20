// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * API contract test: every request the admin panel can make must exist on the server, with that method.
 * It catches the class of bug that shows up in the browser as a 404 / "CORS error" / "delete does not work".
 * The server list comes from the backend:  npm run export-routes  → copy routes.json to src/test/backend-routes.json
 */
const BASE = "/api/v1/admin/";                       // VITE_BACKEND_URL ends with /api/v1/admin
const routes = JSON.parse(readFileSync(new URL("./backend-routes.json", import.meta.url), "utf8")).routes;
const table = routes.map((r) => {
  const [method, url] = r.split(" ");
  return { method, url, rx: new RegExp(`^${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:[A-Za-z_]+/g, "[^/]+")}/?$`) };
});

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? (f === "test" ? [] : walk(p)) : /\.(jsx?|mjs)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
});

const src = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const calls = [];
for (const file of walk(src)) {
  const code = readFileSync(file, "utf8").replace(/\r/g, "");
  const lines = code.split("\n");
  const joined = code;
  // httpClient.get("/x") / .post(`/x/${id}`) …  and the tiny get()/post() helpers inside hooks
  const rx = /(?:httpClient\s*\.\s*(get|post|put|patch|delete)|(?<![.\w])(get|post|put|patch|del))\(\s*(`[^`]*`|"[^"]*"|'[^']*')/g;
  let m;
  while ((m = rx.exec(joined))) {
    const lineNo = joined.slice(0, m.index).split("\n").length;
    if (/^\s*(\/\/|\*)/.test(lines[lineNo - 1])) continue;                       // commented out
    const helperOnly = !m[1];
    if (helperOnly && !/hooks\//.test(file.replace(/\\/g, "/"))) continue;       // bare get() only counts inside the hook helpers
    const method = (m[1] || (m[2] === "del" ? "delete" : m[2])).toUpperCase();
    let path = m[3].slice(1, -1).replace(/\$\{[^}]*\}/g, ":p").split("?")[0];
    if (/^https?:/.test(path)) continue;                                         // other servers (uploads …)
    if (/^(:p)(\/|$)/.test(path.replace(/^\/+/, ""))) continue;                  // the whole first segment is a variable: cannot be checked statically
    path = path.replace(/^\/+/, "");
    calls.push({ method, path: BASE + path, where: `${file.replace(src, "src/")}:${lineNo}` });
  }
}

describe("admin panel ↔ server API contract", () => {
  it("finds the panel's API calls", () => { expect(calls.length).toBeGreaterThan(100); });

  it("every call hits a route that exists, with the right method", () => {
    const missing = calls.filter((c) => !table.some((r) => r.method === c.method && r.rx.test(c.path)));
    const note = missing.map((c) => `${c.method} ${c.path}   (${c.where})${table.some((r) => r.rx.test(c.path)) ? "   ← route exists but with another method" : ""}`);
    expect(note, `These calls have no matching server route:\n${note.join("\n")}`).toEqual([]);
  });
});
