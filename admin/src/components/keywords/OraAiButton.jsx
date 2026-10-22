import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Top-bar entry to Ora AI — one compact pill: dark body, fine gold edge, a sparkle and a PRO tag, with a light that sweeps across it
 * every few seconds (shimmer). It keeps its height / padding in every theme and shows only the icon + PRO on phones.
 */
export default function OraAiButton() {
  return (
    <Link
      to="/dashboard/ora-ai"
      aria-label="Open Ora AI"
      title="Ora AI"
      className="group relative inline-flex h-8.5 sm:h-10 shrink-0 items-center rounded-full bg-linear-to-r from-gold-300 via-gold-500 to-gold-300 p-px shadow-sm transition-shadow hover:shadow-[0_0_0_4px_color-mix(in_oklab,var(--gold-500)_20%,transparent)] focus-ring"
    >
      <span className="relative flex h-full items-center gap-2 overflow-hidden rounded-full bg-ink px-2.5 text-sm font-semibold text-paper sm:px-3.5">
        <Sparkles className="ora-twinkle size-4 shrink-0 text-gold-300" />
        <span className="hidden whitespace-nowrap sm:inline">Ora AI</span>
        <span className="rounded-full bg-linear-to-r from-gold-300 to-gold-500 px-1.5 py-px text-[10px] font-bold leading-4 tracking-wide text-gold-ink">PRO</span>
        <span aria-hidden className="ora-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/30 to-transparent" />
      </span>
    </Link>
  );
}
