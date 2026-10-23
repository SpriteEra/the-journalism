import { useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Link2, Upload, Youtube } from "lucide-react";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation } from "../../hooks/admin";
import { fmtBytes } from "../../lib/api";
import { MAX_MB, readVideoMeta, youtubeId } from "../../lib/videoMeta";
import { appendTaxonomy, emptyTaxonomy, taxonomyFrom, tagsFrom } from "../../components/taxonomy/TaxonomyFields";
import { Badge, Button, Card, ErrorState, Field, Input, PageHeader, Switch, Tabs, Textarea } from "../../components/ui";
import VideoPreview from "../../components/shorts/VideoPreview";

const LIST_PATH = "/dashboard/short-videos";
const SOURCE = { youtube_auto: "YouTube · auto", youtube_manual: "YouTube · link", upload: "Uploaded" };

export default function ShortVideoFormPage() {
    const { slug } = useParams();
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["short-videos", slug],
        queryFn: () => httpClient.get(`/short-videos/${slug}`).then((r) => r.data),
        enabled: !!slug,
        refetchOnMount: "always",
    });
    const video = data?.video;

    if (slug && error) return <ErrorState error={error} onRetry={refetch} />;
    if (slug && (isLoading || !video)) return null; // or your skeleton

    return <VideoFormBody key={video?._id || video?.id || video?.slug || "new"} video={video} />;
}

function VideoFormBody({ video }) {
    const { can } = usePermission();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const editing = !!video;
    const savedYt = editing && video.sourceType !== "upload"
        ? [video.youtubeId, video.youtubeVideoId, video.videoId, video.externalId, video.sourceUrl, video.youtubeUrl, video.embedUrl, video.link, video.url]
            .map((v) => youtubeId(typeof v === "string" ? v : ""))
            .find(Boolean) || ""
        : "";

    const mode = editing ? "edit" : params.get("mode") === "upload" ? "upload" : "youtube";
    const fileRef = useRef(null);

    const [f, setF] = useState(() => ({ title: video?.title || "", description: video?.description || "", kind: video?.kind || "short", url: "", draft: video?.draft || false }));

    const [tax] = useState(() => (video ? taxonomyFrom(video) : emptyTaxonomy));
    const [tags] = useState(() => (video ? tagsFrom(video) : []));
    const [file, setFile] = useState(null);
    const [thumb, setThumb] = useState(null);
    const [progress, setProgress] = useState(0);
    const set = (p) => setF((s) => ({ ...s, ...p }));

    const back = () => navigate(LIST_PATH);

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
        const { data } = await httpClient.post("/short-videos/upload", fd, { timeout: 0, onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)) });
        return data;
    }, { invalidate: ["short-videos"], onSuccess: back });

    const submit = async (e) => {
        e.preventDefault();
        if (mode === "youtube" && !youtubeId(f.url)) return toast.error("Enter a valid YouTube link");
        if (mode === "upload") {
            if (!file) return toast.error("Choose a video file");
            if (file.size > MAX_MB * 1048576) return toast.error(`Video is larger than ${MAX_MB} MB`);
            const probe = await readVideoMeta(file).catch(() => null);
            if (probe && probe.width >= probe.height) return toast.error("Only portrait (vertical) videos can be uploaded here.");
            if (probe && probe.duration > 180) return toast.error("Shorts can be at most 3 minutes long.");
        }
        save.mutate();
    };

    const title = editing ? "Edit video" : mode === "youtube" ? "Add YouTube short" : "Upload short";
    const submitLabel = editing ? "Save changes" : f.draft ? "Save draft" : can("video.publish") ? "Publish" : "Submit for approval";

    return (
        <>
            <PageHeader
                title={title}
                description={mode === "upload" ? "Your file is uploaded to our Cloudflare storage." : mode === "youtube" ? "Paste a YouTube short link – title and thumbnail are fetched automatically." : undefined}
                actions={<Button variant="outline" leftIcon={ArrowLeft} onClick={back} disabled={save.isPending}>Back</Button>}
            />

            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] h-fit">
                <Card className="space-y-5 h-fit">
                    {!editing && (
                        <Tabs variant="pill" value={mode} onChange={(m) => { setFile(null); setParams({ mode: m }, { replace: true }); }}
                            items={[{ value: "youtube", label: "YouTube link" }, { value: "upload", label: "Upload file" }]} />
                    )}
                    {editing && (
                        <div className="flex items-center gap-2 text-sm text-fg-subtle"><Badge>{SOURCE[video.sourceType]}</Badge>Source can't be changed.</div>
                    )}

                    {mode === "youtube" && (
                        <Field label="YouTube link or video id" required>
                            <Input icon={Link2} value={f.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://www.youtube.com/shorts/…" required autoFocus />
                        </Field>
                    )}

                    {mode === "upload" && (
                        <Field label="Video file" required hint={`Portrait (vertical) only · up to 3 min · MP4 / MOV / WebM, up to ${MAX_MB} MB`}>
                            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-surface-2/50 px-4 py-8 text-center transition-colors hover:border-primary hover:bg-primary-soft/40 focus-ring">
                                <Upload className="size-7 text-fg-faint" />
                                {file ? <span className="text-sm font-medium text-fg">{file.name} <span className="text-fg-subtle">· {fmtBytes(file.size)}</span></span> : <span className="text-sm text-fg-subtle">Click to choose a video</span>}
                            </button>
                            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </Field>
                    )}

                    <Field label="Title" required={mode !== "youtube"} hint={mode === "youtube" ? "Leave empty to use the YouTube title" : undefined}>
                        <Input placeholder="Enter the title of the short video" value={f.title} onChange={(e) => set({ title: e.target.value })} maxLength={300} required={mode !== "youtube"} />
                    </Field>

                    {mode !== "youtube" && (
                        <>
                            <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
                            <Field label={editing ? "Replace thumbnail" : "Thumbnail"} hint="Optional – a frame is captured from uploaded videos">
                                <Input type="file" accept="image/*" onChange={(e) => setThumb(e.target.files?.[0] || null)} className="py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-sm" />
                            </Field>
                        </>
                    )}

                    {/* <TaxonomyFields value={tax} onChange={setTax} categoryRequired={false} /> */}
                    {/* <TagPicker value={tags} onChange={setTags} /> */}

                    <Switch checked={f.draft} onChange={(v) => set({ draft: v })} label="Save as draft" description={can("video.publish") ? "Drafts are not shown on the website" : "Without “draft” it goes to the review queue"} />

                    {save.isPending && mode === "upload" && !editing && (
                        <div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                            <p className="mt-1 text-xs text-fg-subtle">Uploading… {progress}%</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-line pt-4">
                        <Button type="button" variant="outline" onClick={back} disabled={save.isPending}>Cancel</Button>
                        <Button type="submit" loading={save.isPending}>{submitLabel}</Button>
                    </div>
                </Card>

                <Card className="h-fit lg:sticky lg:top-4">
                    <p className="mb-4 text-sm font-semibold text-fg">Preview</p>
                    <VideoPreview
                        youtubeUrl={mode === "youtube" ? f.url : ""}
                        file={mode === "upload" ? file : null}
                        thumbFile={mode !== "youtube" ? thumb : null}
                        existing={video}
                        title={f.title || video?.title}
                    />
                </Card>
            </form>
        </>
    );
}