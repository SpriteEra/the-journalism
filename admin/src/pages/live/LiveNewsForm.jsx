import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, ImagePlus, Radio, Search, ChevronDown } from "lucide-react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation } from "../../hooks/admin";
import { useLiveNewsItem } from "../../hooks/live";
import { Alert, Badge, Button, Card, ChipInput, ErrorState, Field, Input, PageHeader, PageLoader, StatusBadge, Tabs, Textarea } from "../../components/ui";
import LiveEditor from "../../components/live/LiveEditor";
import { cn } from "../../lib/cn";
import { fromIstInput, fmtISTDateTime, toIstInput } from "../../lib/time";
import { siteUrl } from "../../lib/share";

const LIST_PATH = "/dashboard/live";

/** Loads the live news (edit) and mounts the form once the data is there, so the editor starts with the right content. */
export default function LiveNewsFormPage() {
  const { slug } = useParams();
  const { data: live, isLoading, error, refetch } = useLiveNewsItem(slug);
  if (slug && error) return <ErrorState error={error} onRetry={refetch} />;
  if (slug && (isLoading || !live)) return <PageLoader />;
  return <LiveForm key={live?._id || "new"} live={live} />;
}

const MODES = {
  draft: { label: "Save as draft", submit: "Save draft" },
  live: { label: "Publish now", submit: "Publish" },
  scheduled: { label: "Schedule", submit: "Schedule" },
};

function LiveForm({ live }) {
  const navigate = useNavigate();
  const { can } = usePermission();
  const editing = Boolean(live);
  const canPublish = can("live.publish");
  const status = live?.status || "draft";
  const isLive = status === "live";
  const isEnded = status === "ended";
  const slugLocked = Boolean(live?.post_time);            // the server refuses slug changes after the first publish

  const editor = useRef(null);
  const fileRef = useRef(null);
  const [dirty, setDirty] = useState(false);
  const [seoOpen, setSeoOpen] = useState(Boolean(live?.seo?.metaTitle || live?.seo?.metaDescription || live?.seo?.focusKeyword));

  const [f, setF] = useState(() => ({
    title: live?.title || "",
    caption: live?.caption || "",
    imageAlt: live?.imageAlt || "",
    slug: live?.slug || "",
    tags: (live?.tags || []).map((t) => ({ title: t })),
    startTime: live?.startTime ? toIstInput(live.startTime) : "",
    mode: status === "scheduled" ? "scheduled" : "draft",
    seo: { metaTitle: live?.seo?.metaTitle || "", metaDescription: live?.seo?.metaDescription || "", focusKeyword: live?.seo?.focusKeyword || "" },
  }));
  const [cover, setCover] = useState({ file: null, preview: live?.image || "" });
  const set = (p) => { setF((s) => ({ ...s, ...p })); setDirty(true); };
  const setSeo = (p) => set({ seo: { ...f.seo, ...p } });

  // warn before closing the tab with unsaved work
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => () => { if (cover.file) URL.revokeObjectURL(cover.preview); }, [cover]);

  const pickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    try {
      const small = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true });
      setCover({ file: small, preview: URL.createObjectURL(small) });
      setDirty(true);
    } catch { toast.error("Could not read this image"); }
  };

  const back = () => navigate(LIST_PATH);

  const save = useApiMutation(async (body) => {
    const fd = new FormData();
    Object.entries(body).forEach(([k, v]) => { if (v !== undefined) fd.append(k, typeof v === "string" ? v : JSON.stringify(v)); });
    if (cover.file) fd.append("image", cover.file, cover.file.name || "cover.jpg");
    const { data } = editing ? await httpClient.put(`/live/${live.slug}`, fd) : await httpClient.post("/live", fd);
    return data;
  }, { invalidate: ["live-news"], onSuccess: () => { setDirty(false); back(); } });

  const submit = async (e) => {
    e?.preventDefault?.();
    const title = f.title.trim();
    if (!title) return toast.error("Write a title");

    const body = (await editor.current?.save()) || { blocks: [] };
    const hasBody = body.blocks.length > 0;
    const publishing = !editing ? f.mode !== "draft" : ["draft", "scheduled"].includes(status) && f.mode !== "draft";

    if (publishing) {
      if (!cover.preview) return toast.error("Add a cover image before publishing");
      if (!hasBody && !f.caption.trim()) return toast.error("Add a short strap line or some story text before publishing");
    }
    if (f.mode === "scheduled" && ["draft", "scheduled"].includes(status)) {
      if (!f.startTime) return toast.error("Choose when the coverage starts");
      if (fromIstInput(f.startTime) <= new Date()) return toast.error("The start time must be in the future (IST)");
    }

    const seo = { ...(live?.seo || {}), ...f.seo }; delete seo._id;
    const payload = {
      title,
      caption: f.caption,
      imageAlt: f.imageAlt,
      content: body,
      tags: f.tags.map((t) => t.title),
      seo,
    };
    if (!slugLocked && f.slug.trim() && f.slug.trim() !== live?.slug) payload.slug = f.slug.trim();

    if (["draft", "scheduled"].includes(status)) {            // live / ended coverage keeps its own times
      if (f.mode === "scheduled") payload.startTime = fromIstInput(f.startTime).toISOString();
      else if (f.mode === "draft") payload.startTime = f.startTime ? fromIstInput(f.startTime).toISOString() : "";
      if (f.mode !== status) payload.status = f.mode;           // create: always sent, edit: only on change
    }
    save.mutate(payload);
  };

  const modeItems = Object.entries(MODES).filter(([k]) => canPublish || k === "draft").map(([value, m]) => ({ value, label: m.label }));
  const submitLabel = editing && (isLive || isEnded) ? "Save changes" : MODES[f.mode].submit;

  return (
    <>
      <PageHeader
        title={editing ? "Edit live news" : "New live news"}
        description={editing ? undefined : "Write the story, add a cover image and start the coverage."}
        actions={<Button variant="outline" leftIcon={ArrowLeft} onClick={back} disabled={save.isPending}>Back</Button>}
      />

      <div className="grid h-fit gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ───────── story ───────── */}
        <Card className="h-fit space-y-5">
          <Field label="Title" required>
            <Input value={f.title} onChange={(e) => set({ title: e.target.value })} maxLength={300} placeholder="e.g. Election results – live" className="hindi-font" autoFocus={!editing} />
          </Field>

          <Field label="Strap line" hint="One or two lines shown under the headline and used in listings.">
            <Textarea rows={2} value={f.caption} maxLength={300} onChange={(e) => set({ caption: e.target.value.replace(/\n/g, " ") })} className="hindi-font" />
          </Field>

          <Field label="Cover image" hint="Shown at the top of the live page and when the link is shared. Wide images (16:9) look best.">
            <div className="space-y-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="group relative block aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-line-strong bg-surface-2/50 transition-colors hover:border-primary focus-ring">
                {cover.preview
                  ? <img src={cover.preview} alt={f.imageAlt || "Cover"} className="size-full object-cover" />
                  : <span className="flex size-full flex-col items-center justify-center gap-2 text-fg-subtle"><ImagePlus className="size-8" /><span className="text-sm">Click to choose a cover image</span></span>}
                {cover.preview && <span className="absolute inset-0 grid place-items-center bg-ink/0 text-sm font-medium text-paper opacity-0 transition group-hover:bg-ink/40 group-hover:opacity-100">Change image</span>}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickCover} />
              <Input value={f.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} maxLength={200} placeholder="Image description (alt text, helps search & accessibility)" className="hindi-font" />
            </div>
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium text-fg-muted">Story</p>
            <LiveEditor ref={editor} initialData={live?.content} onChange={() => setDirty(true)} />
          </div>
        </Card>

        {/* ───────── side panel ───────── */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-fg">Publish</p>
              {editing && <StatusBadge status={status === "live" ? "published" : status} />}
            </div>

            {isLive && (
              <Alert tone="success" title="This story is published">
                On the website since {fmtISTDateTime(live.post_time || live.startTime)}.
              </Alert>
            )}
            {isEnded && (
              <Alert tone="info" title="This story has ended">
                Ended {fmtISTDateTime(live.endTime)}. You can still correct the story.
              </Alert>
            )}

            {(!editing || ["draft", "scheduled"].includes(status)) && (
              <>
                {modeItems.length > 1 && <Tabs variant="pill" value={f.mode} onChange={(mode) => set({ mode })} items={modeItems} className="w-full [&>button]:flex-1" />}
                {!canPublish && <p className="text-xs text-fg-subtle">You can save drafts. A person with publish rights has to take it live.</p>}
                {f.mode === "scheduled" && (
                  <Field label="Publish time" required hint="India time (IST). It is published by itself at this time.">
                    <Input type="datetime-local" value={f.startTime} min={toIstInput()} onChange={(e) => set({ startTime: e.target.value })} />
                  </Field>
                )}
                {f.mode === "live" && <p className="text-xs text-fg-subtle">The story appears on the website the moment you press “Publish”.</p>}
              </>
            )}

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <Button type="button" onClick={submit} size="lg" block loading={save.isPending} leftIcon={f.mode === "live" && !isLive && !isEnded ? Radio : undefined}>{submitLabel}</Button>
              {editing && (isLive || isEnded) && (
                <Button type="button" variant="ghost" block leftIcon={ExternalLink} onClick={() => window.open(siteUrl(`/live/${live.slug}`), "_blank", "noopener")}>View on website</Button>
              )}
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-sm font-semibold text-fg">Tags</p>
            <ChipInput value={f.tags} onChange={(tags) => set({ tags })} max={15} placeholder="Type a tag, press Enter" />
          </Card>

          {!slugLocked && (
            <Card className="space-y-3">
              <Field label="Page address" hint={`${siteUrl("/live/")}${f.slug || "…"} · leave empty to create it from the title`}>
                <Input value={f.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} maxLength={120} placeholder="auto" />
              </Field>
            </Card>
          )}

          <Card padded={false}>
            <button type="button" onClick={() => setSeoOpen((v) => !v)} aria-expanded={seoOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg-muted"><Search className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-fg">SEO</span><span className="block text-xs text-fg-subtle">Search title and description</span></span>
              {(f.seo.metaTitle || f.seo.metaDescription) ? <Badge tone="success" size="sm">Custom</Badge> : <Badge size="sm">Auto</Badge>}
              <ChevronDown className={cn("size-4 shrink-0 text-fg-subtle transition-transform", seoOpen && "rotate-180")} />
            </button>
            {seoOpen && (
              <div className="space-y-4 border-t border-line p-4">
                <Field
                  label="SEO title"
                  hint={`${f.seo.metaTitle.length}/120 · empty = the title`}
                >
                  <Input
                    value={f.seo.metaTitle}
                    maxLength={120}
                    className="hindi-font"
                    placeholder={f.title || "Title"}
                    onChange={(e) => setSeo({ metaTitle: e.target.value })}
                  />
                </Field>

                <Field
                  label="SEO description"
                  hint={`${f.seo.metaDescription.length}/320 · empty = the strap line`}
                >
                  <Textarea
                    rows={3}
                    value={f.seo.metaDescription}
                    maxLength={320}
                    className="hindi-font"
                    placeholder={f.caption || "Short description"}
                    onChange={(e) => setSeo({ metaDescription: e.target.value.replace(/\n/g, " ") })}
                  />
                </Field>

                <Field
                  label="Focus keyword">
                  <Input
                    value={f.seo.focusKeyword}
                    maxLength={100}
                    className="hindi-font"
                    onChange={(e) => setSeo({ focusKeyword: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </Card>
        </div>
      </div>

    </>
  );
}