import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Names from styles/theme.css – tailwind-merge must know them so `bg-surface` and `bg-primary` conflict correctly. */
const COLORS = [
  "canvas", "surface", "surface-2", "surface-3", "overlay", "fg", "fg-muted", "fg-subtle", "fg-faint", "line", "line-strong", "ring",
  "primary", "primary-hover", "primary-soft", "primary-fg", "accent", "accent-hover", "accent-soft", "accent-fg",
  "success", "success-soft", "warning", "warning-soft", "danger", "danger-hover", "danger-soft", "info", "info-soft",
  "ink", "paper", "sidebar", "sidebar-2", "sidebar-fg", "sidebar-muted", "sidebar-line", "sidebar-hover", "sidebar-active",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: { color: COLORS, radius: ["control", "card"], shadow: ["card", "pop"] },
  },
});

/** cn("px-2", cond && "px-4", { "font-bold": x }) → merged class string (later classes win). */
export const cn = (...inputs) => twMerge(clsx(inputs));
export default cn;
