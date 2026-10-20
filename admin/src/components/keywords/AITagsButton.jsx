// AITagsButton.tsx
import { Zap as FiZap } from "lucide-react";

export function AITagsButton({
    hasAITags,
    aiTagsLoading,
    aiGeneratedTags,
    onClick,
}) {
    return (
        <>
            <style>{`
        @keyframes premiumShimmer {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(350%)  skewX(-15deg); }
        }
      `}</style>

            <button
                onClick={onClick}
                disabled={aiTagsLoading}
                className={`
          relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
          text-xs font-semibold overflow-hidden select-none
          transition-transform duration-150 active:scale-[0.97]
          disabled:cursor-not-allowed
          ${hasAITags
                        ? "text-[var(--gold-ink)] hover:opacity-90 hover:scale-[1.04]"
                        : aiTagsLoading
                            ? [
                                "border border-warning/30 bg-warning-soft/50 text-warning opacity-75",
                                "bg-gold-300/10",
                            ].join(" ")
                            : [
                                "border border-[var(--gold-500)] bg-transparent text-[var(--gold-700)]",
                                "hover:bg-gold-500/10 hover:scale-[1.03]",
                                "",
                            ].join(" ")
                    }
        `}
                style={
                    hasAITags
                        ? {
                            background:
                                "linear-gradient(105deg,var(--gold-700) 0%,var(--gold-300) 18%,var(--gold-100) 36%,var(--gold-200) 50%,var(--gold-100) 64%,var(--gold-500) 82%,var(--gold-300) 100%)",
                            backgroundSize: "300% auto",
                            animation: "goldGlow 2.4s ease-in-out infinite",
                        }
                        : undefined
                }
            >
                {/* ── Shimmer sweep — active only ── */}
                {hasAITags && !aiTagsLoading && (
                    <span
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "40%",
                            height: "100%",
                            pointerEvents: "none",
                            background:
                                "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)",
                            animation: "premiumShimmer 2.4s ease-in-out infinite",
                        }}
                    />
                )}

                {/* ── Icon ── */}
                {aiTagsLoading ? (
                    <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                    <FiZap
                        size={13}
                        className="flex-shrink-0"
                        style={{ stroke: hasAITags ? "var(--gold-ink)" : "currentColor" }}
                    />
                )}

                {/* ── Label ── */}
                <span>
                    {aiTagsLoading
                        ? "Generating…"
                        : hasAITags
                            ? `AI Tags (${aiGeneratedTags.length})`
                            : "Generate with AI"}
                </span>
            </button>
        </>
    );
}