import { useState } from "react";
import { ChevronDown, Clock, Crown, Link2, Search, Star } from "lucide-react";
import { cn } from "../../lib/cn";
import { fmtDate } from "../../lib/api";
import { toIstInput } from "../../lib/time";
import { Badge, Field, InfoTip, Input, Switch, Textarea } from "../ui";
import RelatedNewsPicker from "./RelatedNewsPicker";

const PRESETS = [["6 hours", 6], ["12 hours", 12], ["24 hours", 24], ["3 days", 72], ["7 days", 168]];

const inHours = (h) => toIstInput(new Date(Date.now() + h * 3600000));

function Section({ icon: Icon, title, description, open, onToggle, badge, children }) {
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg-muted"><Icon className="size-4.5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-fg">{title}</span><span className="block truncate text-xs text-fg-subtle">{description}</span></span>
        {badge}
        <ChevronDown className={cn("size-4 shrink-0 text-fg-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t border-line p-4">{children}</div>}
    </div>
  );
}

/** Google-style result, so the editor sees what the SEO title / description will look like in search. */
function SerpPreview({ title, description, url }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
      <p className="truncate text-xs text-fg-subtle">{url}</p>
      <p className="hindi-font mt-0.5 line-clamp-1 text-lg leading-snug text-info">{title || "Page title appears here"}</p>
      <p className="hindi-font mt-0.5 line-clamp-2 text-sm text-fg-muted">{description || "The description shown under the title in search results."}</p>
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
    <div className="space-y-3">
      <Section icon={Search} title="SEO" description="Search title, description and focus keyword" open={open.seo} onToggle={() => toggle("seo")}
        badge={mTitle || mDesc ? <Badge tone="success" size="sm">Custom</Badge> : <Badge size="sm" tone="neutral">Auto</Badge>}>
        <Field label="SEO title" hint={`${mTitle.length}/120 · leave empty to use the story title`} info="The blue headline Google shows for this story. Make it clear and under about 60 characters.">
          <Input value={mTitle} maxLength={120} className="hindi-font" placeholder={title || "Story title"} onChange={(e) => setSeo({ metaTitle: e.target.value })} />
        </Field>
        <Field label="SEO description" hint={`${mDesc.length}/320 · leave empty to use the short description`} info="The grey text under the headline in search results. Aim for 120–160 characters.">
          <Textarea rows={3} value={mDesc} maxLength={320} className="hindi-font" placeholder={description || "Short description"} onChange={(e) => setSeo({ metaDescription: e.target.value.replace(/\n/g, " ") })} />
        </Field>
        <Field label="Focus keyword" hint="The one phrase this story should rank for" info="The main phrase people would search to find this story. Try to have it in the title and the first lines.">
          <Input value={seo.focusKeyword || ""} className="hindi-font" onChange={(e) => setSeo({ focusKeyword: e.target.value })} />
        </Field>
        <SerpPreview title={mTitle || title} description={mDesc || description} url="yoursite.com › news › …" />
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
