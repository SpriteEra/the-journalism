import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, ImagePlus, Radio, Search, ChevronDown,
  RotateCcw, CheckCircle2, Circle, Lightbulb,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation } from "../../hooks/admin";
import { useLiveNewsItem } from "../../hooks/live";
import { Alert, Badge, Button, Card, ChipInput, ErrorState, Field, Input, PageLoader, StatusBadge, Tabs, Textarea } from "../../components/ui";
import LiveEditor from "../../components/live/LiveEditor";
import { cn } from "../../lib/cn";
import { fromIstInput, fmtISTDateTime, toIstInput } from "../../lib/time";
import { siteUrl } from "../../lib/share";
import { truncate } from "../../utils/utils.js";

const LIST_PATH = "/dashboard/live";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

function base64ToFile(base64String, fileName) {
  const arr = base64String.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}

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

  // local copy of the work in progress (survives refresh / crash). One key per story, one for "new".
  const draftKey = `live-draft:${live?.slug || "new"}`;
  const [draft] = useState(() => {
    try { return JSON.parse(localStorage.getItem(draftKey)) || null; } catch { return null; }
  });

  const editor = useRef(null);
  const fileRef = useRef(null);
  const latest = useRef({});
  const [dirty, setDirty] = useState(false);
  const [needsSave, setNeedsSave] = useState(false);
  const [seoOpen, setSeoOpen] = useState(Boolean(live?.seo?.metaTitle || live?.seo?.metaDescription || live?.seo?.focusKeyword));

  const [f, setF] = useState(() => {
    const base = {
      title: live?.title || "",
      description: live?.description || "",
      imageAlt: live?.imageAlt || "",
      slug: live?.slug || "",
      tags: (live?.tags || []).map((t) => ({ title: t })),
      startTime: live?.startTime ? toIstInput(live.startTime) : "",
      mode: status === "scheduled" ? "scheduled" : "draft",
      seo: { metaTitle: live?.seo?.metaTitle || "", metaDescription: live?.seo?.metaDescription || "", focusKeyword: live?.seo?.focusKeyword || "" },
    };
    const merged = { ...base, ...(draft?.f || {}), seo: { ...base.seo, ...(draft?.f?.seo || {}) } };
    if (!canPublish) merged.mode = "draft";
    return merged;
  });
  const [cover, setCover] = useState(() => {
    if (draft?.cover) {
      try { return { file: base64ToFile(draft.cover, "cover.jpg"), preview: draft.cover, base64: draft.cover }; } catch { /* broken copy */ }
    }
    return { file: null, preview: live?.image || "", base64: "" };
  });

  const set = (p) => { setF((s) => ({ ...s, ...p })); setDirty(true); setNeedsSave(true); };
  const setSeo = (p) => set({ seo: { ...f.seo, ...p } });
  latest.current = { f, cover };

  // tell the editor that a local copy was brought back
  useEffect(() => { if (draft) toast.success("Restored your unsaved draft", { id: "live-draft-restored" }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── autosave a local copy every 5 seconds while there is something new ──
  useEffect(() => {
    if (!needsSave) return undefined;
    const id = setInterval(async () => {
      try {
        const content = (await editor.current?.save()) || null;
        const { f: ff, cover: cc } = latest.current;
        localStorage.setItem(draftKey, JSON.stringify({ f: ff, content, cover: cc.base64 || "", savedAt: Date.now() }));
        setNeedsSave(false);
      } catch { /* storage full */ }
    }, 5000);
    return () => clearInterval(id);
  }, [needsSave, draftKey]);

  // warn before closing the tab with unsaved work
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => () => { if (cover.file && cover.preview.startsWith("blob:")) URL.revokeObjectURL(cover.preview); }, [cover]);

  const pickCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file");
    try {
      const small = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true });
      const base64 = await fileToBase64(small);
      setCover({ file: small, preview: base64, base64 });
      setDirty(true);
      setNeedsSave(true);
    } catch { toast.error("Could not read this image"); }
  };

  const back = () => navigate(LIST_PATH);

  const save = useApiMutation(async (body) => {
    const fd = new FormData();
    Object.entries(body).forEach(([k, v]) => { if (v !== undefined) fd.append(k, typeof v === "string" ? v : JSON.stringify(v)); });
    if (cover.file) fd.append("image", cover.file, cover.file.name || "cover.jpg");
    const { data } = editing ? await httpClient.put(`/live/${live.slug}`, fd) : await httpClient.post("/live", fd);
    return data;
  }, {
    invalidate: ["live-news"],
    onSuccess: () => { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } setDirty(false); setNeedsSave(false); back(); },
  });

  const submit = async (e) => {
    e?.preventDefault?.();
    const title = f.title.trim();
    if (!title) return toast.error("Write a title");

    const body = (await editor.current?.save()) || { blocks: [] };
    const hasBody = body.blocks.length > 0;
    const publishing = !editing ? f.mode !== "draft" : ["draft", "scheduled"].includes(status) && f.mode !== "draft";

    if (publishing) {
      if (!cover.preview) return toast.error("Add a cover image before publishing");
      if (!hasBody && !f.description.trim()) return toast.error("Add a short strap line or some story text before publishing");
    }
    if (f.mode === "scheduled" && ["draft", "scheduled"].includes(status)) {
      if (!f.startTime) return toast.error("Choose when the coverage starts");
      if (fromIstInput(f.startTime) <= new Date()) return toast.error("The start time must be in the future (IST)");
    }

    const seo = { ...(live?.seo || {}), ...f.seo }; delete seo._id;
    const payload = {
      title,
      description: f.description,
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

  const resetForm = () => {
    if (!window.confirm("Clear the local draft and start again?")) return;
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setDirty(false);
    window.location.reload();
  };

  const modeItems = Object.entries(MODES).filter(([k]) => canPublish || k === "draft").map(([value, m]) => ({ value, label: m.label }));
  const submitLabel = editing && (isLive || isEnded) ? "Save changes" : MODES[f.mode].submit;
  const submitIcon = f.mode === "live" && !isLive && !isEnded ? Radio : undefined;
  const showModes = !editing || ["draft", "scheduled"].includes(status);

  // ── "ready" checklist (display only, the real checks stay in submit) ──
  const checklist = [
    { label: "Title", done: Boolean(f.title.trim()) },
    { label: "Cover image", done: Boolean(cover.preview) },
    { label: "Strap line or story text", done: Boolean(f.description.trim()) || Boolean(draft?.content?.blocks?.length) || Boolean(live?.content?.blocks?.length) || dirty },
    ...(f.mode === "scheduled" && showModes ? [{ label: "Publish time", done: Boolean(f.startTime) }] : []),
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const ActionButtons = ({ stacked }) => (
    <div className={cn("flex gap-2", stacked ? "flex-col" : "items-center")}>
      <Button type="button" onClick={submit} size={stacked ? "lg" : undefined} block={stacked} loading={save.isPending} leftIcon={submitIcon}>{submitLabel}</Button>
      {stacked && editing && (isLive || isEnded) && (
        <Button type="button" variant="ghost" block leftIcon={ExternalLink} onClick={() => window.open(siteUrl(`/live/${live.slug}`), "_blank", "noopener")}>View on website</Button>
      )}
      <Button type="button" variant="outline" block={stacked} leftIcon={RotateCcw} onClick={resetForm} disabled={save.isPending} className={stacked ? undefined : "max-sm:px-2"}>
        <span className={stacked ? undefined : "max-sm:hidden"}>Reset</span>
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full p-0 sm:p-3 sm:bg-surface rounded-md">
      {/* TOP BAR: title always; buttons only on mobile/tablet (desktop buttons live in the right panel) */}
      <nav className="sticky top-15 z-20 mb-1 sm:mb-4 flex w-full items-center gap-2 bg-surface/90 p-2 shadow-card backdrop-blur-xs sm:px-3">
        <button type="button" onClick={back} disabled={save.isPending} aria-label="Back" className="grid size-9 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-surface-2 focus-ring">
          <ArrowLeft className="size-5" />
        </button>
        <p className="min-w-0 flex-1 line-clamp-1 text-base font-medium text-fg sm:text-xl lg:text-2xl">
          {f.title.trim() ? truncate(f.title, 120) : editing ? "Edit live news" : "New live news"}
        </p>
        <div className="lg:hidden"><ActionButtons /></div>
      </nav>

      <section>
        {/*
          Mobile: single column  -> cover, title, editor, then the settings panel
          Desktop (lg+): left = cover / title / editor, right = sticky panel (actions, checklist, tags, SEO, tips)
        */}
        <div className="w-full sm:p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-6">
          {/* ---------- LEFT: cover image ---------- */}
          <div className="lg:col-start-1 lg:row-start-1">
            <div className="mb-3 sm:mb-8 rounded-lg sm:rounded-2xl border border-line/50 bg-surface p-1 sm:p-3 shadow-card">
              <button type="button" onClick={() => fileRef.current?.click()} className="group relative block aspect-video w-full overflow-hidden rounded-lg sm:rounded-xl border-2 border-dashed border-line-strong bg-surface-2/50 transition-colors hover:border-primary focus-ring">
                {cover.preview
                  ? <img src={cover.preview} alt={f.imageAlt || "Cover"} className="size-full object-cover" />
                  : <span className="flex size-full flex-col items-center justify-center gap-2 text-fg-subtle"><ImagePlus className="size-8" /><span className="text-sm">Click to choose a cover image</span></span>}
                {cover.preview && <span className="absolute inset-0 grid place-items-center bg-ink/0 text-sm font-medium text-paper opacity-0 transition group-hover:bg-ink/40 group-hover:opacity-100">Change image</span>}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickCover} />
              <p className="mt-2 text-xs text-fg-subtle max-sm:hidden">Use a clear 16:9 landscape photo. PNG, JPG or WEBP – it is compressed automatically.</p>
              <div className="mt-2 sm:mt-4">
                <Input value={f.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} maxLength={200} placeholder="Image description (alt text, helps search & accessibility)" className="hindi-font" />
              </div>
            </div>
          </div>

          {/* ---------- LEFT: title + strap line ---------- */}
          <div className="lg:col-start-1 lg:row-start-2">
            <div className="mb-2 sm:mb-8 space-y-3 rounded-lg sm:rounded-2xl border border-line/50 bg-surface p-1.5 sm:p-3 shadow-card">
              <textarea
                value={f.title}
                onChange={(e) => set({ title: e.target.value.replace(/\n/g, " ") })}
                maxLength={300}
                rows={2}
                placeholder="Live news title"
                autoFocus={!editing}
                className="hindi-font w-full resize-none border-none bg-transparent text-xl font-semibold leading-tight text-fg outline-none placeholder-fg-faint sm:text-2xl"
              />
              <div className="flex items-center justify-between px-1 text-xs max-sm:hidden">
                <span className="text-fg-subtle">Short, specific headlines work best.</span>
                <span className={f.title.length > 100 ? "text-danger" : "text-fg-subtle"}>{f.title.length}/100</span>
              </div>
            </div>
            <div className="mb-2 sm:mb-8 space-y-3 rounded-lg sm:rounded-2xl border border-line/50 bg-surface p-1.5 sm:p-3 shadow-card">

              <Field label="Description" hint="One or two lines shown under the headline and used in listings.">
                <Textarea rows={2} value={f.description} maxLength={300} onChange={(e) => set({ description: e.target.value.replace(/\n/g, " ") })} className="hindi-font" />
              </Field>
            </div>
          </div>

          {/* ---------- LEFT: story editor ---------- */}
          <div className="lg:col-start-1 lg:row-start-3 mb-4 lg:mb-0 rounded-xl sm:rounded-2xl border border-line/50 bg-surface p-1 sm:p-3 shadow-card max-sm:mt-4 lg:mt-0">
            <div className="mb-2 sm:mb-4 px-1">
              <h3 className="text-lg font-bold text-fg sm:text-xl">Story</h3>
              <p className="text-[10px] text-fg-subtle sm:text-sm">Write the live story with the rich text editor</p>
            </div>
            <LiveEditor
              ref={editor}
              initialData={draft?.content || live?.content}
              onChange={() => { setDirty(true); setNeedsSave(true); }}
            />
          </div>

          {/* ---------- RIGHT (desktop) / below the editor (mobile) ---------- */}
          <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start lg:sticky lg:top-32">
            {/* publish panel */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-fg">Publish</p>
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-fg-subtle lg:inline">{needsSave ? "Saving locally…" : "Draft saved locally"}</span>
                  {editing && <StatusBadge status={status === "live" ? "published" : status} />}
                </div>
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

              {showModes && (
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

              <div className="hidden border-t border-line pt-4 lg:block"><ActionButtons stacked /></div>
              {/* phones & tablets: the same buttons live in the top bar, keep a "view" link here */}
              {editing && (isLive || isEnded) && (
                <Button type="button" variant="ghost" block leftIcon={ExternalLink} className="lg:hidden" onClick={() => window.open(siteUrl(`/live/${live.slug}`), "_blank", "noopener")}>View on website</Button>
              )}
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
                  <Field label="SEO title" hint={`${f.seo.metaTitle.length}/120 · empty = the title`}>
                    <Input value={f.seo.metaTitle} maxLength={120} className="hindi-font" placeholder={f.title || "Title"} onChange={(e) => setSeo({ metaTitle: e.target.value })} />
                  </Field>
                  <Field label="SEO description" hint={`${f.seo.metaDescription.length}/320 · empty = the strap line`}>
                    <Textarea rows={3} value={f.seo.metaDescription} maxLength={320} className="hindi-font" placeholder={f.description || "Short description"} onChange={(e) => setSeo({ metaDescription: e.target.value.replace(/\n/g, " ") })} />
                  </Field>
                  <Field label="Focus keyword">
                    <Input value={f.seo.focusKeyword} maxLength={100} className="hindi-font" onChange={(e) => setSeo({ focusKeyword: e.target.value })} />
                  </Field>
                </div>
              )}
            </Card>
            {/* desktop readiness checklist */}
            <div className="hidden rounded-2xl border border-line/50 bg-surface p-4 shadow-card lg:block">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold text-fg">Ready to continue?</h3>
                <span className="text-xs text-fg-subtle">{doneCount}/{checklist.length}</span>
              </div>
              <ul className="space-y-1.5">
                {checklist.map((item) => (
                  <li key={item.label} className={cn("flex items-center gap-2 text-sm", item.done ? "text-success" : "text-fg-muted")}>
                    {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            {/* desktop tips */}
            <div className="hidden rounded-2xl border border-line/50 bg-surface-2/50 p-4 lg:block">
              <div className="mb-2 flex items-center gap-2">
                <Lightbulb size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-fg">Tips</h3>
              </div>
              <ul className="list-disc space-y-1.5 pl-4 text-xs text-fg-muted">
                <li>Your work is saved in this browser every few seconds and comes back after a refresh.</li>
                <li>Times are India time (IST). A scheduled story goes live by itself.</li>
                <li>The page address cannot be changed after the first publish.</li>
                <li><b>Reset</b> clears the local draft. It does not delete anything already saved on the server.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}