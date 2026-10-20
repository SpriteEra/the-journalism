import { useRef, useState } from "react";
import { CheckCircle2, Link2, Pencil, Play, PlaySquare, RefreshCw, Trash2, Upload, Youtube } from "lucide-react";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, useShortVideos, useSyncStatus } from "../../hooks/admin";
import { fmtBytes, fmtDate, fmtDuration } from "../../lib/api";
import { appendTaxonomy, emptyTaxonomy, TagPicker, TaxonomyFields, taxonomyFrom, tagsFrom } from "../../components/taxonomy/TaxonomyFields";
import { Alert, Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, IconButton, Input, Modal, PageHeader, Pagination, SearchInput, Select, StatusBadge, Switch, Tabs, Textarea } from "../../components/ui";

/** width / height / duration of a local video file, read from its metadata (nothing is uploaded) */
const readVideoMeta = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.preload = "metadata";
  v.onloadedmetadata = () => { resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration }); URL.revokeObjectURL(url); };
  v.onerror = () => { reject(new Error("unreadable")); URL.revokeObjectURL(url); };
  v.src = url;
});
const SOURCE = { youtube_auto: ["info", "YouTube · auto"], youtube_manual: ["info", "YouTube · link"], upload: ["accent", "Uploaded"] };
const MAX_MB = 300;

function VideoForm({ mode, video, onClose }) {
  const { can } = usePermission();
  const editing = mode === "edit";
  const fileRef = useRef(null);
  const [f, setF] = useState(() => ({ title: video?.title || "", description: video?.description || "", kind: video?.kind || "", url: "", draft: video?.draft || false }));
  const [tax, setTax] = useState(() => (video ? taxonomyFrom(video) : emptyTaxonomy));
  const [tags, setTags] = useState(() => (video ? tagsFrom(video) : []));
  const [file, setFile] = useState(null);
  const [thumb, setThumb] = useState(null);
  const set = (p) => setF((s) => ({ ...s, ...p }));

  const save = useApiMutation(async () => {
    if (mode === "youtube") {
      const { data } = await httpClient.post("/short-videos/youtube", { url: f.url, title: f.title || undefined, kind: f.kind || undefined, draft: f.draft, category: tax.category, subCategory: tax.subCategory, state: tax.state, district: tax.district, tags: tags.map((t) => t.id || t.title) });
      return data;
    }
    const fd = new FormData();
    fd.append("title", f.title); fd.append("description", f.description); if (f.kind) fd.append("kind", f.kind); fd.append("draft", String(f.draft));
    appendTaxonomy(fd, tax, tags);
    if (thumb) fd.append("thumbnail", thumb);
    if (editing) { const { data } = await httpClient.put(`/short-videos/${video.slug}`, fd); return data; }
    fd.append("video", file);
    const { data } = await httpClient.post("/short-videos/upload", fd, { timeout: 0 });
    return data;
  }, { invalidate: ["short-videos"], onSuccess: onClose });

  const submit = async (e) => {
    e.preventDefault();
    if (mode === "upload") {
      if (!file) return toast.error("Choose a video file");
      if (file.size > MAX_MB * 1048576) return toast.error(`Video is larger than ${MAX_MB} MB`);
      // shorts are PORTRAIT and at most 3 minutes: check the real size / length in the browser before uploading
      const probe = await readVideoMeta(file).catch(() => null);
      if (probe && probe.width >= probe.height) return toast.error("Only portrait (vertical) videos can be uploaded here. Add landscape videos from YouTube news.");
      if (probe && probe.duration > 180) return toast.error("Shorts can be at most 3 minutes long. Add long videos from YouTube news.");
    }
    save.mutate();
  };
  const title = editing ? "Edit video" : mode === "youtube" ? "Add YouTube video / short" : "Upload video / short";

  return (
    <Modal open onClose={save.isPending ? undefined : onClose} size="xl" title={title}
      description={mode === "upload" ? "Your file is uploaded to our Cloudflare storage." : mode === "youtube" ? "Paste a YouTube link – title and thumbnail are fetched automatically." : undefined}
      footer={<><Button variant="outline" onClick={onClose} disabled={save.isPending}>Cancel</Button><Button type="submit" form="video-form" loading={save.isPending}>{editing ? "Save changes" : f.draft ? "Save draft" : can("video.publish") ? "Publish" : "Submit for approval"}</Button></>}>
      <form id="video-form" onSubmit={submit} className="space-y-5">
        {mode === "youtube" && <Field label="YouTube link or video id" required><Input icon={Link2} value={f.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://www.youtube.com/shorts/…" required autoFocus data-autofocus /></Field>}
        {mode === "upload" && (
          <Field label="Video file" required hint={`Portrait (vertical) only · up to 3 min · MP4 / MOV / WebM, up to ${MAX_MB} MB`}>
            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-surface-2/50 px-4 py-8 text-center transition-colors hover:border-primary hover:bg-primary-soft/40 focus-ring">
              <Upload className="size-7 text-fg-faint" />
              {file ? <span className="text-sm font-medium text-fg">{file.name} <span className="text-fg-subtle">· {fmtBytes(file.size)}</span></span> : <span className="text-sm text-fg-subtle">Click to choose a video</span>}
            </button>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Field>
        )}
        {editing && (
          <div className="flex items-center gap-2 text-sm text-fg-subtle"><Badge tone={SOURCE[video.sourceType]?.[0]}>{SOURCE[video.sourceType]?.[1]}</Badge>Source can't be changed.</div>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field label="Title" required={mode !== "youtube"} hint={mode === "youtube" ? "Leave empty to use the YouTube title" : undefined}><Input value={f.title} onChange={(e) => set({ title: e.target.value })} maxLength={300} required={mode !== "youtube"} /></Field>
          <Field label="Type" hint="Auto-detected when empty"><Select value={f.kind} onChange={(e) => set({ kind: e.target.value })} options={[{ value: "", label: "Auto" }, { value: "short", label: "Short" }, { value: "video", label: "Video" }]} /></Field>
        </div>
        {mode !== "youtube" && <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>}
        {mode !== "youtube" && (
          <Field label={editing ? "Replace thumbnail" : "Thumbnail"} hint="Optional – a frame is captured from uploaded videos">
            <Input type="file" accept="image/*" onChange={(e) => setThumb(e.target.files?.[0] || null)} className="py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-sm" />
          </Field>
        )}
        <TaxonomyFields value={tax} onChange={setTax} categoryRequired={false} />
        <TagPicker value={tags} onChange={setTags} />
        <Switch checked={f.draft} onChange={(v) => set({ draft: v })} label="Save as draft" description={can("video.publish") ? "Drafts are not shown on the website" : "Without “draft” it goes to the review queue"} />
      </form>
    </Modal>
  );
}

function SyncButton() {
  const { data: status } = useSyncStatus(true);
  const sync = useApiMutation(() => httpClient.post("/short-videos/sync", {}).then((r) => r.data), { invalidate: ["short-videos", "short-videos-sync"], success: (d) => `Sync finished${d.report?.added !== undefined ? ` – ${d.report.added} new` : ""}` });
  if (!status?.channels?.length) return null;
  return <Button variant="outline" leftIcon={RefreshCw} loading={sync.isPending} onClick={() => sync.mutate()} title={`${status.channels.length} channel(s)`}>Sync YouTube</Button>;
}

export default function ShortVideos() {
  const { can } = usePermission();
  const [params, setParams] = useState({ page: 1, limit: 20, kind: "all", sourceType: "all", pending: "", search: "" });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);       // { mode, video }
  const [deleting, setDeleting] = useState(null);
  const { data, isLoading, error, refetch } = useShortVideos(params);
  const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));
  const approve = useApiMutation((v) => httpClient.put(`/short-videos/${v.slug}`, { approve: true }).then((r) => r.data), { invalidate: ["short-videos"], success: "Approved and published" });
  const del = useApiMutation(() => httpClient.delete(`/short-videos/${deleting.slug}`).then((r) => r.data), { invalidate: ["short-videos"], onSuccess: () => setDeleting(null) });

  const status = (v) => (v.draft ? "draft" : v.isPublished ? "published" : "pending");
  const columns = [
    { key: "title", header: "Video", primary: true, cell: (v) => (
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-3">
          {v.thumbnail ? <img src={v.thumbnail} alt="" loading="lazy" className="size-full object-cover" /> : <Play className="absolute inset-0 m-auto size-5 text-fg-faint" />}
          {v.duration > 0 && <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1 text-[10px] font-medium text-paper">{fmtDuration(v.duration)}</span>}
        </div>
        <div className="min-w-0"><p className="line-clamp-2 font-medium text-fg">{v.title}</p><p className="truncate text-xs text-fg-subtle">{v.category?.[0]?.name || "Uncategorised"}{v.tags?.length ? ` · ${v.tags.length} tags` : ""}</p></div>
      </div>) },
    { key: "kind", header: "Type", cell: (v) => <Badge tone={v.kind === "short" ? "accent" : "primary"}>{v.kind === "short" ? "Short" : "Video"}</Badge> },
    { key: "source", header: "Source", cell: (v) => <Badge tone={SOURCE[v.sourceType]?.[0]} size="sm">{SOURCE[v.sourceType]?.[1]}</Badge> },
    { key: "status", header: "Status", cell: (v) => <StatusBadge status={status(v)} /> },
    { key: "by", header: "By", hideOnMobile: true, cell: (v) => v.author?.username || <span className="text-fg-faint">auto</span> },
    { key: "date", header: "Published", cell: (v) => <span className="text-xs">{fmtDate(v.publishedAt || v.createdAt)}</span> },
    { key: "actions", header: "", align: "right", cell: (v) => (
      <div className="flex justify-end gap-1">
        {can("video.manage.any") && !v.isPublished && !v.draft && <IconButton size="icon-sm" label="Approve & publish" className="text-success hover:bg-success-soft" onClick={() => approve.mutate(v)}><CheckCircle2 className="size-4" /></IconButton>}
        <IconButton size="icon-sm" label="Edit" onClick={() => setForm({ mode: "edit", video: v })}><Pencil className="size-4" /></IconButton>
        <IconButton size="icon-sm" label="Delete" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setDeleting(v)}><Trash2 className="size-4" /></IconButton>
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Shorts & videos" description="YouTube links and your own uploads (stored on Cloudflare) in one place."
        actions={<>
          {can("video.sync") && <SyncButton />}
          {can("video.create") && <><Button variant="outline" leftIcon={Youtube} onClick={() => setForm({ mode: "youtube" })}>YouTube link</Button><Button leftIcon={Upload} onClick={() => setForm({ mode: "upload" })}>Upload</Button></>}
        </>} />
      {data?.items && params.pending !== "true" && data.items.some((v) => !v.isPublished && !v.draft) && can("video.manage.any") && (
        <Alert tone="warning" className="mb-4" title="Some videos are waiting for approval" action={<Button size="sm" variant="outline" onClick={() => patch({ pending: "true" })}>Show pending</Button>} />
      )}
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <form className="w-full xl:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}><SearchInput value={search} onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }} placeholder="Search title or tag (Enter)" /></form>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs variant="pill" value={params.kind} onChange={(kind) => patch({ kind })} items={[{ value: "all", label: "All" }, { value: "short", label: "Shorts" }, { value: "video", label: "Videos" }]} />
            <div className="w-44"><Select size="sm" aria-label="Source" value={params.sourceType} onChange={(e) => patch({ sourceType: e.target.value })} options={[{ value: "all", label: "Any source" }, { value: "upload", label: "Uploaded" }, { value: "youtube_manual", label: "YouTube link" }, { value: "youtube_auto", label: "YouTube auto" }]} /></div>
            <Switch checked={params.pending === "true"} onChange={(v) => patch({ pending: v ? "true" : "" })} label="Pending only" className="gap-2" />
          </div>
        </div>
        {error ? <ErrorState error={error} onRetry={refetch} /> : (
          <>
            <DataTable columns={columns} rows={data?.items} loading={isLoading} empty={<EmptyState icon={PlaySquare} title="No videos found" description="Upload a file or add a YouTube link to get started." />} />
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="border-t border-line" />
          </>
        )}
      </Card>
      {form && <VideoForm mode={form.mode} video={form.video} onClose={() => setForm(null)} />}
      {deleting && <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" loading={del.isPending} onConfirm={() => del.mutate()} confirmLabel="Delete" title="Delete this video?" message={`“${deleting.title}” will be removed from the website.`} />}
    </>
  );
}
