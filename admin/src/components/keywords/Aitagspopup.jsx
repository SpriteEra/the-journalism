import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useTheme } from "../../utils/Theme";
import { useFetchTopTrends } from "../../hooks/useTrends";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const ZapIcon = ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const CheckIcon = ({ size = 11, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CloseIcon = ({ size = 13, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const RefreshIcon = ({ size = 12, color = "currentColor", spinning = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={spinning ? { animation: "aiTagSpin 1s linear infinite" } : {}}>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

const TrendingIcon = ({ size = 11, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const RobotIcon = ({ size = 12, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="7" y="8" width="10" height="8" rx="2.5" />
        <circle cx="10" cy="12" r="1.1" fill="white" />
        <circle cx="14" cy="12" r="1.1" fill="white" />
        <rect x="10.5" y="5" width="3" height="2.5" rx="1" />
        <rect x="5" y="10" width="2" height="4" rx="1" />
        <rect x="17" y="10" width="2" height="4" rx="1" />
    </svg>
);

const CrownIcon = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M2 19h20v2H2zM2 6l5 7 5-7 5 7 5-7v11H2z" />
    </svg>
);

// ── Component ──────────────────────────────────────────────────────────────────
const AITagsPopup = ({
    isOpen,
    onClose,
    aiGeneratedTags = [],
    existingTags = [],
    onAddTags,
    onRegenerate,
    isRegenerating = false,
    onRemoveTags,
    // theme = "dark", // "dark" | "light"
}) => {
    const [selected, setSelected] = useState(new Set());
    const backdropRef = useRef(null);
    const { theme, toggleTheme } = useTheme();

    const { data: trendsData } = useFetchTopTrends();

    const trendingTagsFromAPI = trendsData?.data
        ?.slice(0, 10)
        ?.map(item => item.keyword.toLowerCase()) || [];
    const trendingTags = trendingTagsFromAPI
    useEffect(() => {
        if (isOpen) setSelected(new Set());
    }, [isOpen, aiGeneratedTags]);

    useEffect(() => {
        if (!isOpen) return;
        const handle = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const existingSet = new Set(existingTags.map((t) => t.toLowerCase()));
    const isDark = theme === "dark";

    const toggle = (tag) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(tag) ? next.delete(tag) : next.add(tag);
            return next;
        });
    };

    const selectAllNew = () => {
        const addable = aiGeneratedTags.filter((t) => !existingSet.has(t.toLowerCase()));
        setSelected(new Set(addable));
    };

    const clearAll = () => {
        setSelected(new Set());
        if (onRemoveTags) {
            const poolToRemove = [...aiGeneratedTags, ...trendingTags];
            onRemoveTags(poolToRemove);
        }
    };

    const handleConfirm = () => {
        if (selected.size === 0) return toast.error("Select at least one tag");
        onAddTags([...selected]);
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === backdropRef.current) onClose();
    };

    const addableCount = aiGeneratedTags.filter((t) => !existingSet.has(t.toLowerCase())).length;

    // ── Tag renderers ──────────────────────────────────────────────────────────
    const renderAITag = (tag) => {
        const isExisting = existingSet.has(tag.toLowerCase());
        const isSel = selected.has(tag);

        if (isExisting) return (
            <button key={tag} disabled
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium cursor-not-allowed"
                style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
                }}>
                <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                #{tag}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.15)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.25)" }}>
                    added
                </span>
            </button>
        );

        if (isSel) return (
            <button key={tag} onClick={() => toggle(tag)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border-none cursor-pointer transition-transform active:scale-95"
                style={{
                    background: "var(--gold-300)",
                    backgroundSize: "200% auto",
                    animation: "aiTagGold 3s linear infinite",
                    color: "var(--gold-ink)",
                    boxShadow: "0 1px 8px rgba(197,140,10,0.4)",
                }}>
                <CheckIcon size={10} color="var(--gold-ink)" />
                #{tag}
            </button>
        );

        return (
            <button key={tag} onClick={() => toggle(tag)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-150"
                style={{
                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                    color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)",
                    border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.12)",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "rgba(245,200,66,0.6)" : "rgba(197,140,10,0.5)";
                    e.currentTarget.style.color = isDark ? "var(--gold-200)" : "var(--gold-700)";
                    e.currentTarget.style.background = isDark ? "rgba(245,200,66,0.08)" : "rgba(245,200,66,0.1)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
                    e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
                }}>
                #{tag}
            </button>
        );
    };

    const renderTrendingTag = (tag) => {
        const isExisting = existingSet.has(tag.toLowerCase());
        const isSel = selected.has(tag);

        if (isExisting) return (
            <button key={tag} disabled
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium cursor-not-allowed"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(0,0,0,0.06)",
                }}>
                #{tag}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.15)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.25)" }}>
                    added
                </span>
            </button>
        );

        if (isSel) return (
            <button key={tag} onClick={() => toggle(tag)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border-none cursor-pointer transition-transform active:scale-95"
                style={{
                    background: "linear-gradient(105deg,var(--gold-300),var(--gold-200),var(--gold-500))",
                    backgroundSize: "200% auto",
                    animation: "aiTagGold 3s linear infinite",
                    color: "var(--gold-ink)",
                    boxShadow: "0 1px 8px rgba(197,140,10,0.4)",
                }}>
                <CheckIcon size={10} color="var(--gold-ink)" />
                #{tag}
            </button>
        );

        return (
            <button key={tag} onClick={() => toggle(tag)}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-all duration-150"
                style={{
                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(245,158,11,0.06)",
                    color: isDark ? "rgba(255,255,255,0.75)" : "var(--gold-700)",
                    border: "1.5px solid rgba(245,158,11,0.4)",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gold-500)";
                    e.currentTarget.style.color = isDark ? "var(--gold-200)" : "var(--gold-900)";
                    e.currentTarget.style.background = isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.12)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
                    e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.75)" : "var(--gold-700)";
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(245,158,11,0.06)";
                }}>
                #{tag}
            </button>
        );
    };

    // ── Theme tokens ───────────────────────────────────────────────────────────
    const modal = {
        bg: isDark ? "var(--gold-ink)" : "var(--gold-100)",
        border: isDark ? "rgba(197,140,10,0.4)" : "rgba(197,140,10,0.35)",
        shadow: isDark
            ? "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,200,66,0.08)"
            : "0 8px 40px rgba(120,80,0,0.18), 0 0 0 1px rgba(245,200,66,0.12)",
        headerBg: isDark
            ? "linear-gradient(135deg,var(--gold-ink) 0%,var(--gold-ink) 55%,var(--gold-ink) 100%)"
            : "linear-gradient(135deg,var(--gold-ink) 0%,var(--gold-900) 55%,var(--gold-ink) 100%)",
        closeBg: isDark ? "rgba(253,233,138,0.08)" : "rgba(253,233,138,0.15)",
        closeBorder: isDark ? "rgba(253,233,138,0.2)" : "rgba(253,233,138,0.35)",
        closeColor: isDark ? "rgba(253,233,138,0.7)" : "rgba(253,233,138,0.9)",
        subtitleColor: isDark ? "rgba(253,233,138,0.5)" : "rgba(253,233,138,0.65)",
        rowBg: "transparent",
        countColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
        sectionLabelColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
        divider: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
        footerBg: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.03)",
        footerDivider: isDark
            ? "linear-gradient(90deg,transparent,rgba(245,200,66,0.3),rgba(253,233,138,0.5),rgba(245,200,66,0.3),transparent)"
            : "linear-gradient(90deg,transparent,rgba(197,140,10,0.4),rgba(245,200,66,0.7),rgba(197,140,10,0.4),transparent)",
        regenColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)",
        cancelBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        cancelColor: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)",
        cancelBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    };

    return (
        <>

            {/* Backdrop */}
            <div
                ref={backdropRef}
                onClick={handleBackdropClick}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            >
                {/* Modal */}
                <div className="relative w-full max-w-[480px] rounded-[20px] overflow-hidden"
                    style={{ background: modal.bg, border: `1.5px solid ${modal.border}`, boxShadow: modal.shadow }}>

                    {/* Top gold line */}
                    <div className="h-[2px]"
                        style={{ background: "linear-gradient(90deg,transparent,var(--gold-300),var(--gold-200),var(--gold-300),transparent)" }} />

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-[14px]"
                        style={{ background: modal.headerBg }}>
                        <div className="flex items-center gap-3">
                            {/* Gold zap circle */}
                            <div className="flex items-center justify-center w-[38px] h-[38px] rounded-full flex-shrink-0"
                                style={{
                                    background: "linear-gradient(135deg,var(--gold-300),var(--gold-500))",
                                    boxShadow: "0 2px 12px rgba(197,140,10,0.5)",
                                }}>
                                <ZapIcon size={17} color="var(--gold-ink)" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[15px] font-bold" style={{ color: "var(--gold-200)", letterSpacing: "-0.01em" }}>
                                        AI-Generated Tags
                                    </span>
                                    <CrownIcon size={14} color="var(--gold-200)" />
                                    <span className="text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded-full"
                                        style={{ background: "linear-gradient(105deg,var(--gold-300),var(--gold-200))", color: "var(--gold-ink)" }}>
                                        PREMIUM
                                    </span>
                                </div>
                                <p className="text-[11px] mt-[3px] font-normal"
                                    style={{ color: modal.subtitleColor }}>
                                    {aiGeneratedTags.length} suggestions · {addableCount} new
                                    {trendingTags.length > 0 && ` · ${trendingTags.length} trending`}
                                </p>
                            </div>
                        </div>

                        {/* Close */}
                        <button onClick={onClose}
                            className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer flex-shrink-0 transition-all duration-150"
                            style={{ background: modal.closeBg, border: `1px solid ${modal.closeBorder}`, color: modal.closeColor }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(253,233,138,0.18)" : "rgba(253,233,138,0.3)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = modal.closeBg; }}>
                            <CloseIcon size={13} color={modal.closeColor} />
                        </button>
                    </div>

                    {/* ── Select All / Clear ── */}
                    <div className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-[12px] font-normal" style={{ color: modal.countColor }}>
                            {selected.size > 0 ? `${selected.size} selected` : "Tap tags to select"}
                        </span>
                        <div className="flex gap-3.5">
                            <button onClick={selectAllNew}
                                className="text-[12px] font-medium border-none bg-transparent cursor-pointer"
                                style={{ color: "var(--gold-500)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                                Select all new
                            </button>
                            <button onClick={clearAll}
                                className="text-[12px] font-medium border-none bg-transparent cursor-pointer"
                                style={{ color: modal.countColor }}>
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>

                        {/* AI Suggested */}
                        <div className="px-5 pb-3.5">
                            <div className="flex items-center gap-1.5 mb-2.5">
                                <RobotIcon size={20} color="var(--gold-500)" />
                                <span className="text-[10px] font-bold tracking-[0.1em] uppercase"
                                    style={{ color: modal.sectionLabelColor }}>
                                    AI Suggested
                                </span>
                            </div>
                            {aiGeneratedTags.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-[13px]" style={{ color: modal.countColor }}>No tags generated yet</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {aiGeneratedTags.map(renderAITag)}
                                </div>
                            )}
                        </div>

                        {/* Trending Now */}
                        {trendingTags.length > 0 && (
                            <>
                                <div className="h-px mx-5" style={{ background: modal.divider }} />
                                <div className="px-5 pt-3 pb-4">
                                    <div className="flex items-center gap-1.5 mb-2.5">
                                        <TrendingIcon size={11} color="var(--gold-500)" />
                                        <span className="text-[10px] font-bold tracking-[0.1em] uppercase"
                                            style={{ color: modal.sectionLabelColor }}>
                                            Trending Now
                                        </span>
                                        <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full"
                                            style={{ background: "rgba(34,197,94,0.15)", color: "var(--success)", border: "1px solid rgba(34,197,94,0.3)" }}>
                                            LIVE
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {trendingTags.map(renderTrendingTag)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Gold footer divider */}
                    <div className="h-px" style={{ background: modal.footerDivider }} />

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-end px-5 py-3.5 flex-wrap gap-2"
                        style={{ background: modal.footerBg }}>

                        <div className="flex items-center gap-2">
                            {/* Cancel */}
                            <button onClick={onClose}
                                className="px-[18px] py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-150"
                                style={{ background: modal.cancelBg, color: modal.cancelColor, border: `1px solid ${modal.cancelBorder}` }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = modal.cancelBg; }}>
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirm}
                                disabled={selected.size === 0}
                                className="flex items-center gap-1.5 px-[24px] py-[9px] rounded-[11px] text-[13px] font-semibold border-none transition-all duration-150 active:scale-[0.97]"
                                style={{
                                    position: "relative",
                                    overflow: "hidden",

                                    ...(selected.size === 0 && {
                                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                                        color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)",
                                        cursor: "not-allowed",
                                    }),

                                    ...(selected.size > 0 && {
                                        background: `linear-gradient(
                135deg,
                var(--gold-700)  0%,
                var(--gold-300) 18%,
                var(--gold-100) 35%,
                var(--gold-200) 50%,
                var(--gold-100) 65%,
                var(--gold-500) 82%,
                var(--gold-300) 100%
            )`,
                                        backgroundSize: "300% auto",
                                        animation: "goldShimmer 4s linear infinite",
                                        color: "var(--gold-ink)",
                                        cursor: "pointer",
                                    }),
                                }}
                                onMouseEnter={(e) => {
                                    if (selected.size > 0) {
                                        e.currentTarget.style.transform = "scale(1.04)";
                                        e.currentTarget.style.opacity = "0.92";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.opacity = "1";
                                }}
                            >
                                {selected.size > 0 && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "40%",
                                            height: "100%",
                                            pointerEvents: "none",
                                            background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)",
                                            animation: "premiumShimmer 2.4s ease-in-out infinite",
                                        }}
                                    />
                                )}

                                {selected.size > 0 && <CheckIcon size={11} color="var(--gold-ink)" />}
                                {selected.size > 0
                                    ? `Add ${selected.size} Tag${selected.size > 1 ? "s" : ""}`
                                    : "Add Tags"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default AITagsPopup;