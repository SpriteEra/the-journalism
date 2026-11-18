import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, ImageIcon, Star, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { Alert, Badge, Button, EmptyState, ErrorState, Field, Input, Pagination, SearchInput, Skeleton, Tabs, Textarea } from "../ui";
import { MediaDropzone } from "./MediaUploader";
import ImageResizer, { cropToFile, useResizerState } from "./ImageResizer";
import TagInput from "./TagInput";
import httpClient from "../../api/httpClient";
import { OUTPUT_HEIGHT, OUTPUT_WIDTH, isWide, pickImage, readSize, titleOf, useMedia, useMediaTags, useSaveMedia } from "../../hooks/media";
import { fmtBytes } from "../../lib/api";
import { cn } from "../../lib/cn";

const NO_CROP = /^image\/(gif|svg\+xml)$/;   // animated / vector: keep the original file
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4";

/** What the picker hands back: the library item with the alt text / caption the user typed. */
const toPick = (m, altText, caption) => ({ _id: m._id, url: m.url, title: m.title || "", altText: altText ?? m.altText ?? "", caption: caption ?? m.caption ?? "", width: m.width, height: m.height, tags: m.tags || [] });

/* ───────────────────────── LIBRARY TAB ───────────────────────── */
function LibraryPane({ selected, onSelect, onConfirm }) {
    const [params, setParams] = useState({ page: 1, limit: 24, search: "", tag: "", archived: "exclude" });   // retired images are never offered
    const [search, setSearch] = useState("");
    const { data, isLoading, error, refetch, isFetching } = useMedia(params);
    const { data: tags = [] } = useMediaTags();
    const items = data?.media || [];
    const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
                <form className="w-full sm:max-w-xs" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
                    <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }} placeholder="Search name, file name or tag (Enter)" />
                </form>
                {tags.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Filter by tag">
                        {tags.slice(0, 8).map(({ tag }) => (
                            <li key={tag}>
                                <button type="button" aria-pressed={params.tag === tag} onClick={() => patch({ tag: params.tag === tag ? "" : tag })}
                                    className={cn("rounded-full border px-2.5 py-1 text-xs focus-ring", params.tag === tag ? "border-primary bg-primary text-primary-fg" : "border-line bg-surface text-fg-muted hover:bg-surface-2")}>#{tag}</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className={cn("min-h-0 flex-1 overflow-y-auto p-3", isFetching && !isLoading && "opacity-70 transition-opacity")}>
                {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? (
                    <ul className={GRID}>{Array.from({ length: 8 }).map((_, i) => <li key={i}><Skeleton className="aspect-video w-full rounded-xl" /></li>)}</ul>
                ) : !items.length ? (
                    <EmptyState icon={ImageIcon} title={params.search || params.tag ? "No images match" : "No images yet"} description={params.search || params.tag ? "Try another search or tag." : "Use the Upload tab to add your first image."} />
                ) : (
                    <ul className={GRID}>
                        {items.map((m) => {
                            const on = selected?._id === m._id;
                            return (
                                <li key={m._id}>
                                    <button type="button" aria-pressed={on} onClick={() => onSelect(m)} onDoubleClick={() => { onSelect(m); onConfirm?.(m); }} className="group block w-full text-left focus-ring rounded-xl">
                                        <span className={cn("relative block aspect-video overflow-hidden rounded-xl border bg-surface-2", on ? "border-primary ring-2 ring-primary" : "border-line group-hover:shadow-md")}>
                                            <img src={m.url} alt={m.altText || ""} loading="lazy" className="size-full object-cover" />
                                            {m.isDefault && <Badge tone="warning" size="sm" className="absolute left-2 top-2 gap-1 shadow-sm"><Star className="size-3" />Default</Badge>}
                                            {on && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-fg shadow"><Check className="size-4" /></span>}
                                        </span>
                                        <span className="mt-1.5 block truncate text-xs font-medium text-fg">{m.title || m.fileName || "(no title)"}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} limits={[24, 48]} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="border-t border-line" />
        </div>
    );
}

/* ───────────────────────── DETAILS (selected image) ───────────────────────── */
function Details({ item, alt, caption, setAlt, setCaption, saveBack, setSaveBack }) {
    if (!item) return <p className="p-4 text-sm text-fg-subtle">Select an image to see its details. You can change its alt text and caption before using it.</p>;
    return (
        <div className="space-y-4 p-4">
            <div className="grid aspect-video w-full place-items-center overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line">
                <img src={item.url} alt={alt} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="space-y-0.5 text-sm">
                <p className="break-words font-medium text-fg">{item.title || item.fileName}</p>
                <p className="text-xs text-fg-subtle">{[item.mimeType, item.width && item.height ? `${item.width} × ${item.height} px` : null, item.size ? fmtBytes(item.size) : null].filter(Boolean).join(" · ")}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.width && (isWide(item.width, item.height) ? <Badge tone="success" size="sm">16:9</Badge> : <Badge size="sm">Not 16:9</Badge>)}
                    {item.isDefault && <Badge tone="warning" size="sm">Default image</Badge>}
                    {(item.tags || []).map((t) => <Badge key={t} tone="outline" size="sm">#{t}</Badge>)}
                </div>
                <a href={`/dashboard/media/${item._id}/edit`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 pt-1 text-xs text-primary hover:underline">Open in media library <ExternalLink className="size-3" /></a>
            </div>
            <Field label="Image caption" hint="Shown under the image on the story. You can change it here.">
                <Textarea rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
            </Field>
            <Field label="Image alt text" hint="Describes the image for people who cannot see it.">
                <Textarea rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} />
            </Field>
            <label className="flex items-start gap-2 text-xs text-fg-muted">
                <input type="checkbox" className="mt-0.5" checked={saveBack} onChange={(e) => setSaveBack(e.target.checked)} />
                Also save this caption and alt text to the media library
            </label>
        </div>
    );
}

/* ───────────────────────── UPLOAD TAB (same flow as "Add media") ───────────────────────── */
function UploadPane({ onUploaded }) {
    const rs = useResizerState();
    const [source, setSource] = useState(null);   // { file, url, dims }
    const [fit, setFit] = useState(true);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({ title: "", altText: "", caption: "", tags: [] });
    const save = useSaveMedia({ onSuccess: (data) => { if (data?.media) onUploaded(data.media); } });

    useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);

    const stage = async (file) => {
        if (!file) return;
        const dims = await readSize(file);
        setSource({ file, url: URL.createObjectURL(file), dims });
        setFit(true); rs.clear();
        setForm((f) => ({ ...f, title: f.title || titleOf(file.name) }));
    };
    const canCrop = Boolean(source) && !NO_CROP.test(source.file.type) && Boolean(source.dims?.width);
    const resizing = Boolean(source) && canCrop && fit;
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async () => {
        if (!source) { toast.error("Choose an image first"); return; }
        setBusy(true);
        try {
            let file; let width; let height;
            if (resizing) {
                if (!rs.area) throw new Error("The editor is still loading – try again in a moment");
                file = await cropToFile(source.url, rs.area, rs.rotation, source.file);
                width = OUTPUT_WIDTH; height = OUTPUT_HEIGHT;
            } else { file = source.file; width = source.dims?.width; height = source.dims?.height; }
            save.mutate({ file, width, height, ...form, title: form.title.trim() || titleOf(file.name) });
        } catch (e) { toast.error(e.message || "Could not prepare the image"); }
        finally { setBusy(false); }
    };

    return (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                    {source ? (
                        <>
                            <div className="flex items-center justify-between gap-2">
                                <Tabs variant="pill" value={fit && canCrop ? "fit" : "original"} onChange={(v) => canCrop && setFit(v === "fit")}
                                    items={[
                                        { value: "fit", label: <span className="inline-flex items-center gap-1.5">Resize to {OUTPUT_WIDTH} × {OUTPUT_HEIGHT}<Badge tone="primary" size="sm">Recommended</Badge></span> },
                                        { value: "original", label: "Keep original" },
                                    ]} />
                                <Button size="sm" variant="ghost" leftIcon={X} onClick={() => { setSource(null); rs.clear(); }}>Remove</Button>
                            </div>
                            {!canCrop && <Alert tone="info">This format (animated GIF, SVG or a type your browser cannot edit) is uploaded as the original file.</Alert>}
                            {resizing ? <ImageResizer src={source.url} state={rs} /> : (
                                <div className="grid aspect-video w-full place-items-center overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line"><img src={source.url} alt="" className="max-h-full max-w-full object-contain" /></div>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="flex flex-wrap items-center gap-2 rounded-lg bg-primary-soft/60 px-3 py-2 text-sm text-fg-muted"><Badge tone="primary" size="sm">Recommended</Badge>16:9 · 1280 × 720 px – looks best on Live and News.</p>
                            <MediaDropzone onFiles={(list) => stage(pickImage(list))} />
                        </>
                    )}
                </div>
                <div className="space-y-4">
                    <Field label="Name" hint="Shown in the library."><Input value={form.title} onChange={set("title")} placeholder="e.g. Parliament session, 17 Nov" /></Field>
                    <Field label="Image caption" hint="Shown under the image on stories."><Textarea rows={2} value={form.caption} onChange={set("caption")} /></Field>
                    <Field label="Image alt text"><Textarea rows={2} value={form.altText} onChange={set("altText")} /></Field>
                    <Field label="Tags" hint="Used to find this image quickly in the library."><TagInput value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} /></Field>
                    <Button leftIcon={UploadCloud} onClick={submit} loading={busy || save.isPending} disabled={!source} block>Upload and select</Button>
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── THE PICKER ───────────────────────── */
/**
 * Choose an image from the media library or upload a new one (same 16:9 flow as "Add media").
 *   <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(pick) => ...} />
 * pick = { _id, url, title, altText, caption, width, height, tags }   (alt text / caption are whatever the user typed in the side panel)
 */
export default function MediaPicker({ open, onClose, onSelect, title = "Select image", initialCaption = "" }) {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState("library");
    const [selected, setSelected] = useState(null);
    const [alt, setAlt] = useState("");
    const [caption, setCaption] = useState("");
    const [saveBack, setSaveBack] = useState(false);
    const [working, setWorking] = useState(false);

    // every time it opens: back to the library, nothing chosen
    useEffect(() => { if (open) { setTab("library"); setSelected(null); setSaveBack(false); } }, [open]);
    // choosing an image fills its caption / alt text, editable from here on
    const choose = (m) => { setSelected(m); setAlt(m.altText || ""); setCaption(m.caption || ""); };

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
    }, [open, onClose]);

    if (!open) return null;

    const confirm = async (item = selected) => {
        if (!item) return;
        const altText = item._id === selected?._id ? alt : item.altText || "";
        const cap = item._id === selected?._id ? caption : item.caption || "";
        if (saveBack && item._id === selected?._id && (altText !== (item.altText || "") || cap !== (item.caption || ""))) {
            setWorking(true);
            try {
                await httpClient.patch(`/media/${item._id}`, { altText, caption: cap });
                queryClient.invalidateQueries({ queryKey: ["media"] }); queryClient.invalidateQueries({ queryKey: ["media-item"] });
            } catch { toast.error("Could not update the library copy – the image is still used with your changes."); }
            finally { setWorking(false); }
        }
        onSelect(toPick(item, altText, cap || initialCaption));
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-ink/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-label={title} className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-surface shadow-xl sm:h-[90vh] sm:rounded-2xl">
                <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <div className="flex min-w-0 items-center gap-4">
                        <h2 className="truncate text-lg font-semibold text-fg">{title}</h2>
                        <Tabs variant="pill" value={tab} onChange={setTab} items={[{ value: "library", label: "Media library" }, { value: "upload", label: "Upload files" }]} />
                    </div>
                    <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 focus-ring"><X className="size-5" /></button>
                </header>

                <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                    {tab === "library" ? (
                        <>
                            <LibraryPane selected={selected} onSelect={choose} onConfirm={(m) => { choose(m); confirm(m); }} />
                            <aside className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-line bg-surface-2/40 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
                                <Details item={selected} alt={alt} caption={caption} setAlt={setAlt} setCaption={setCaption} saveBack={saveBack} setSaveBack={setSaveBack} />
                            </aside>
                        </>
                    ) : (
                        <UploadPane onUploaded={(m) => { choose(m); setTab("library"); toast.success("Uploaded – press “Use this image”"); }} />
                    )}
                </div>

                <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
                    <p className="hidden text-xs text-fg-subtle sm:block">Tip: double-click an image to use it right away.</p>
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={() => confirm()} disabled={!selected || tab !== "library"} loading={working}>Use this image</Button>
                    </div>
                </footer>
            </div>
        </div>,
        document.body,
    );
}