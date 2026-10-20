import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

// pages pull in heavy third-party editors that need a real browser; they are stubbed, the point is OUR code: every route must import cleanly
vi.mock("@editorjs/editorjs", () => ({ default: class { } }));
vi.mock("../api/httpClient", () => ({ default: { get: vi.fn(async () => ({ data: {} })), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn(), interceptors: { request: { use() { } }, response: { use() { } } } } }));

const app = readFileSync("src/App.jsx", "utf8");
const modules = import.meta.glob(["../pages/**/*.jsx", "../components/**/*.jsx", "!../**/*.test.jsx"]);
const lazyPages = [...app.matchAll(/lazy\(\(\) => import\("\.\/([^"]+)"\)\)/g)].map((m) => m[1]);

describe("every page of the app can be loaded", () => {
  it("App.jsx lazy-loads a real list of pages", () => { expect(lazyPages.length).toBeGreaterThan(25); });

  it.each(lazyPages)("%s imports and exports a component", async (path) => {
    const loader = modules[`../${path}.jsx`];
    expect(loader, `${path}.jsx does not exist`).toBeTruthy();
    const mod = await loader();
    expect(mod.default, `${path} has no default export`).toBeTruthy();
    expect(["function", "object"]).toContain(typeof mod.default);
  }, 30000);
});
