import { useState } from "react";
import { ChevronDown, Clock, Crown, Link2, Plus, Search, Star, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { fmtDate } from "../../lib/api";
import { toIstInput } from "../../lib/time";
import { Badge, Field, InfoTip, Input, Switch, Textarea } from "../ui";
import RelatedNewsPicker from "./RelatedNewsPicker";

const PRESETS = [["6 hours", 6], ["12 hours", 12], ["24 hours", 24], ["3 days", 72], ["7 days", 168]];

const inHours = (h) => toIstInput(new Date(Date.now() + h * 3600000));

function Section({ icon: Icon, title, description, open, onToggle, badge, children }) {
  return (
    <div className="rounded-lg sm:rounded-2xl border border-line bg-surface w-full flex flex-col">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-2 sm:px-4 py-2 sm:py-3.5 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-md sm:rounded-xl bg-surface-2 text-fg-muted"><Icon className="size-4.5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-fg">{title}</span><span className="block truncate whitespace-normal text-[11px] max-sm:leading-snug sm:text-xs text-fg-subtle">{description}</span></span>
        {badge}
        <ChevronDown className={cn("size-4 shrink-0 text-fg-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t border-line p-2.5 sm:p-4">{children}</div>}
    </div>
  );
}

/** Google-style result, so the editor sees what the SEO title / description will look like in search. */
function SerpPreview({ title, description, url }) {
  return (
    <div className="rounded-sm sm:rounded-xl border border-line bg-surface-2/50 p-2 sm:p-3.5">
      <p className="truncate text-xs text-fg-subtle">{url}</p>
      <p className="hindi-font mt-0.5 line-clamp-1 text-lg leading-snug text-info py-0.5">{title || "Page title appears here"}</p>
      <p className="hindi-font line-clamp-2 text-sm text-fg-muted">{description || "The description shown under the title in search results."}</p>
    </div>
  );
}


function KeywordInput({ value, onChange, id, max = 10 }) {
  const [draft, setDraft] = useState("");
  const list = (value || "").split(",").map((s) => s.trim()).filter(Boolean);
  const save = (arr) => onChange(arr.join(", "));

  const add = () => {
    const k = draft.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    setDraft("");
    if (!k || list.length >= max) return;
    if (list.some((x) => x.toLowerCase() === k.toLowerCase())) return; // no duplicates
    save([...list, k]);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          className="hindi-font"
          placeholder={list.length >= max ? `Maximum ${max} keywords` : "Type a keyword, press Enter"}
          disabled={list.length >= max}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // isComposing: don't add half-typed Hindi text while the keyboard is still composing
            if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); add(); }
            if (e.key === "Backspace" && !draft && list.length) save(list.slice(0, -1));
          }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || list.length >= max}
          aria-label="Add keyword"
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-fg-muted hover:text-fg disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {list.map((k) => (
            <span key={k} className="hindi-font inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pl-3 pr-1.5 text-xs font-medium text-fg-muted">
              {k}
              <button type="button" aria-label={`Remove ${k}`} onClick={() => save(list.filter((x) => x !== k))} className="grid size-4 place-items-center rounded-full hover:bg-surface-3 hover:text-fg">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * "Advanced" accordion of the story form: SEO title / description, page design, and the featured-story switch.
 *   value = { seo:{metaTitle,metaDescription,focusKeyword}, layout, feature:{enabled, until} }
 */
export default function AdvancedPanel({ blog, update, title, description, canFeature, currentFeatured, editingId }) {
  const [open, setOpen] = useState({ seo: false, related: Boolean(blog.related?.length), feature: Boolean(blog.feature?.enabled) });
  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }));
  const seo = blog.seo || {};
  const setSeo = (p) => update({ seo: { ...seo, ...p } });
  const feature = blog.feature || { enabled: false, until: "" };
  const setFeature = (p) => update({ feature: { ...feature, ...p } });
  const otherLive = currentFeatured && currentFeatured.news_id !== editingId;
  const mTitle = seo.metaTitle ?? ""; const mDesc = seo.metaDescription ?? "";

  return (
    <div className="space-y-3 w-full flex-col max-w-full ">
      <Section icon={Search} title="SEO" description="Search title, description and focus keyword" open={open.seo} onToggle={() => toggle("seo")}
        badge={mTitle || mDesc ? <Badge tone="success" size="sm">Custom</Badge> : <Badge size="sm" tone="neutral">Auto</Badge>}>
        <Field label="SEO title" hint={`${mTitle.length}/120 · leave empty to use the story title`} info="The blue headline Google shows for this story. Make it clear and under about 60 characters.">
          <Input value={mTitle} maxLength={120} className="hindi-font" placeholder={title || "Story title"} onChange={(e) => setSeo({ metaTitle: e.target.value })} />
        </Field>
        <Field label="SEO description" hint={`${mDesc.length}/320 · leave empty to use the short description`} info="The grey text under the headline in search results. Aim for 120–160 characters.">
          <Textarea rows={3} value={mDesc} maxLength={320} className="hindi-font" placeholder={description || "Short description"} onChange={(e) => setSeo({ metaDescription: e.target.value.replace(/\n/g, " ") })} />
        </Field>
        <Field
          label="Focus keywords"
          hint="Press Enter or + to add each keyword · the first one is the main keyword"
          info="The phrases people would search to find this story. Add the main one first, and try to use it in the title and the first lines."
        >
          <KeywordInput value={seo.focusKeyword} onChange={(v) => setSeo({ focusKeyword: v })} />
        </Field>
        <SerpPreview title={mTitle || title} description={mDesc || description} url="thejournalism.news › news › …" />
      </Section>

      <Section icon={Link2} title="Related stories" description="Optional · link up to 5 other stories under this one" open={open.related} onToggle={() => toggle("related")}
        badge={<Badge size="sm" tone={blog.related?.length ? "success" : "neutral"}>{blog.related?.length || 0}/5</Badge>}>
        <RelatedNewsPicker value={blog.related || []} onChange={(related) => update({ related })} selfId={editingId} />
      </Section>

      {canFeature && (
        <Section icon={Crown} title="Featured story" description="Pin this story at the top of the site for a limited time" open={open.feature} onToggle={() => toggle("feature")}
          badge={feature.enabled ? <Badge tone="warning" size="sm"><Star className="size-3" />On</Badge> : <Badge size="sm" tone="neutral">Off</Badge>}>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-surface-2/60 p-3.5">
            <span className="text-sm"><b className="text-fg">Show as the featured story</b><span className="block text-fg-subtle">Only one story is featured at a time. When the time is over, the latest story takes its place automatically.</span></span>
            <Switch checked={Boolean(feature.enabled)} onChange={(v) => setFeature({ enabled: v, until: v && !feature.until ? inHours(24) : feature.until })} />
          </label>
          {feature.enabled && (
            <>
              <Field label="Keep it featured until" required hint="India time (IST)" info="After this time the story leaves the top of the site and the latest story takes its place by itself.">
                <Input type="datetime-local" value={feature.until || ""} min={toIstInput()} onChange={(e) => setFeature({ until: e.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(([label, h]) => <button key={label} type="button" onClick={() => setFeature({ until: inHours(h) })} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-fg-muted hover:border-fg/30 hover:text-fg"><Clock className="mr-1 inline size-3" />{label}</button>)}
              </div>
              {otherLive && (
                <p className="rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm text-fg-muted"><b className="text-fg">“{currentFeatured.title}”</b> is featured until {fmtDate(currentFeatured.until, true)}. You will be asked to confirm before it is replaced.</p>
              )}
              <p className="text-xs text-fg-faint">The story must be published (not a draft, and not waiting for approval) to appear at the top.</p>
            </>
          )}
        </Section>
      )}
    </div>
  );
}
