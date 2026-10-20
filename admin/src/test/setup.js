import "../i18n";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => { if (typeof document !== "undefined") cleanup(); });

// jsdom has no matchMedia (the theme provider uses it)
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } });
}

// jsdom has no ResizeObserver (recharts' ResponsiveContainer needs one)
if (typeof window !== "undefined") globalThis.ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
