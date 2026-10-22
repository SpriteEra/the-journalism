import { useState } from "react";
import { Languages, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { cn } from "../../lib/cn";
import { controlBase } from "../ui/Input";

export const KEYWORD_MAX = 10;
const DEVANAGARI = /[\u0900-\u097F]/;
export const scriptOf = (s) => (DEVANAGARI.test(s) ? "hi" : "en");
export const emptyKeywords = () => ({ hi: [], en: [] });

/** { hi, en } from anything the API / an old autosave may hold */
export const normalizeKeywords = (k) => ({ hi: Array.isArray(k?.hi) ? k.hi.filter(Boolean) : [], en: Array.isArray(k?.en) ? k.en.filter(Boolean) : [] });
export const allKeywords = (k) => { const v = normalizeKeywords(k); return [...v.hi, ...v.en]; };

/** Adds keywords; each one is filed under its own script (Devanagari → hi, otherwise en). Duplicates / over-long / over-limit are skipped. */
export const addKeywords = (current, incoming) => {
  const out = { hi: [...current.hi], en: [...current.en] };
  const seen = new Set([...out.hi, ...out.en].map((k) => k.toLowerCase()));
  let skipped = 0;
  incoming.map((k) => String(k || "").trim().replace(/^#+/, "").replace(/\s+/g, " ")).filter(Boolean).forEach((k) => {
    if (seen.has(k.toLowerCase()) || k.length > 60 || out[scriptOf(k)].length >= KEYWORD_MAX) { skipped += 1; return; }
    seen.add(k.toLowerCase()); out[scriptOf(k)].push(k);
  });
  return { value: out, skipped };
};

/**
 * SEO keywords: ONE box for Hindi and English. Each keyword is added with Enter (a comma is part of the keyword, not a separator).
 * The language of a keyword is read from its script, so people type once, in whichever language they need — search finds it either way.
 */
export default function KeywordsField({ value, onChange, onSuggest, suggesting, error }) {
  const { t } = useTranslation();
  const v = normalizeKeywords(value);
  const [q, setQ] = useState("");
  const list = [...v.hi.map((k) => ({ k, lang: "hi" })), ...v.en.map((k) => ({ k, lang: "en" }))];

  const commit = () => {
    const text = q.trim();
    if (!text) return;
    const { value: next, skipped } = addKeywords(v, [text]);
    if (skipped) toast.error("Already added, too long, or the limit is reached");
    else onChange(next);
    setQ("");
  };
  const remove = ({ k, lang }) => onChange({ ...v, [lang]: v[lang].filter((x) => x !== k) });

  return (
    <div className={cn("space-y-3 rounded-xl sm:rounded-2xl border bg-surface-2/50 p-2 sm:p-4", error ? "border-danger/50" : "border-line")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
          <Languages className="size-4 text-fg-subtle" />
          {t("Tags")}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fg-subtle">{list.length}/{KEYWORD_MAX * 2}</span>
          {onSuggest && (
            <button
              type="button"
              onClick={onSuggest}
              disabled={suggesting}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper transition hover:opacity-90 disabled:opacity-60"
            >
              <Sparkles className="size-3.5 text-gold-300" />{suggesting ? "…" : "AI suggest"}
            </button>
          )}
        </div>
      </div>
      <div className={cn(controlBase, "flex min-h-12 flex-wrap items-center gap-1.5 px-2.5 py-2")}>
        {list.map((item) => (
          <div key={item.lang + item.k} lang={item.lang} className="hindi-font inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 sm:px-3 py-1 sm:py-1.5 pb-0.5 sm:pb-1 text-xs sm:text-sm font-medium text-fg">
            <span
              className={cn("size-1.5 rounded-full pt-1.5!", item.lang === "hi" ? "bg-accent" : "bg-info")}
              aria-hidden
            />
            {item.k}
            <button
              type="button"
              aria-label={`Remove ${item.k}`}
              onClick={() => remove(item)}
              className="rounded-full text-fg-subtle hover:text-danger">
              <X className="size-3" />
            </button>
          </div>
        ))}
        <input
          value={q} placeholder={list.length ? "Add another…" : "Type a keyword in Hindi or English and press Enter"}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Backspace" && !q && list.length) remove(list[list.length - 1]);
          }}
          onBlur={commit}
          className="hindi-font min-w-40 flex-1 border-0 bg-transparent px-1 py-0.5 sm:py-1.5! text-sm outline-none placeholder:text-fg-faint"
          style={{ background: "transparent" }}
        />
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg-faint">
        <span>Press <kbd className="rounded py-0.5 border border-line bg-surface px-1">Enter</kbd> after each tags</span>
        {/* <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-accent" />Hindi</span>
        <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-info" />English</span> */}
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
