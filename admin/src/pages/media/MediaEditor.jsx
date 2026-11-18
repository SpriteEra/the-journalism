import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Crop, ExternalLink, ImageIcon, Info, Link2, Archive, ArchiveRestore, Replace, Save, Star, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  Alert, Badge, Button, Card, CardBody, CardHeader, ErrorState, Field, IconButton, Input, PageHeader, Skeleton, Tabs, Textarea, useConfirm,
} from "../../components/ui";
import { MediaDropzone } from "../../components/media/MediaUploader";
import TagInput from "../../components/media/TagInput";
import usePermission from "../../hooks/usePermission";
import ImageResizer, { cropToFile, useResizerState } from "../../components/media/ImageResizer";
import { IMAGE_ACCEPT, OUTPUT_HEIGHT, OUTPUT_WIDTH, isWide, pickImage, readSize, titleOf, useArchiveMedia, useClearDefaultMedia, useDeleteMedia, useMediaItem, useRestoreMedia, useSaveMedia, useSetDefaultMedia, MAX_TAGS } from "../../hooks/media";
import { fmtBytes, fmtDate } from "../../lib/api";

const NO_CROP = /^image\/(gif|svg\+xml)$/;           // animated / vector: keep the original file
const EMPTY = { title: "", altText: "", caption: "", description: "", tags: [] };
const fromItem = (m) => ({ title: m?.title || "", altText: m?.altText || "", caption: m?.caption || "", description: m?.description || "", tags: m?.tags || [] });
const same = (a, b) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a || []) === JSON.stringify(b || []) : (a || "") === (b || ""));


const Row = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2 text-sm">
    <dt className="shrink-0 text-fg-subtle">{label}</dt>
    <dd className="min-w-0 break-words text-right text-fg">{children}</dd>
  </div>
);

/** The recommended size, shown wherever an image is chosen. `done` = this image already uses it. */
const RecommendedNote = ({ done }) => (
  <p className="flex flex-wrap items-center gap-2 rounded-lg bg-primary-soft/60 px-3 py-2 text-sm text-fg-muted">
    <Badge tone="primary" size="sm">Recommended</Badge>
    {done ? "This image is already 16:9 (1280 × 720)." : "16:9 · 1280 × 720 px – looks best on Live and News."}
  </p>
);

/** One screen for "Add media" (/dashboard/media/new) and "Edit media" (/dashboard/media/:id/edit). */
export default function MediaEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const replaceInput = useRef(null);

  const { data: item, isLoading, error, refetch } = useMediaItem(id);
  const [form, setForm] = useState(EMPTY);
  const [titleTouched, setTitleTouched] = useState(false);
  const [source, setSource] = useState(null);   // { file, url, dims, existing } image loaded into the 16:9 editor
  const [fit, setFit] = useState(true);         // true = resize to 1280 × 720, false = keep original
  const [busy, setBusy] = useState(false);
  const rs = useResizerState();
  const { can } = usePermission();
  const setDefault = useSetDefaultMedia();
  const clearDefault = useClearDefaultMedia();
  const archive = useArchiveMedia();
  const restore = useRestoreMedia();

  const save = useSaveMedia({ onSuccess: (data) => { if (!isEdit) navigate("/dashboard/media"); else { setSource(null); rs.clear(); } } });
  const del = useDeleteMedia({ onSuccess: () => navigate("/dashboard/media") });

  // fill the form when the image arrives
  useEffect(() => { if (item) { setForm(fromItem(item)); setTitleTouched(true); } }, [item?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** A file chosen / dropped / handed over from the library page. */
  const stage = async (file, existing = false) => {
    if (!file) return;
    const dims = await readSize(file);
    setSource((old) => { if (old && !old.existing) URL.revokeObjectURL(old.url); return { file, url: URL.createObjectURL(file), dims, existing }; });
    setFit(true);
    rs.clear();
    if (!existing && !titleTouched && !form.title) setForm((f) => ({ ...f, title: titleOf(file.name) }));
  };
  const onFiles = (list) => stage(pickImage(list));

  // file dropped on the library page
  useEffect(() => {
    const f = location.state?.file;
    if (f && !isEdit) { stage(f); navigate(location.pathname, { replace: true, state: null }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (source && !source.existing) URL.revokeObjectURL(source.url); }, [source]);

  // re-open the saved image in the 16:9 editor (needs the image server to allow CORS reads)
  const editExisting = async () => {
    try {
      setBusy(true);
      const blob = await fetch(item.url, { mode: "cors" }).then((r) => { if (!r.ok) throw new Error(); return r.blob(); });
      const file = new File([blob], item.fileName || "image", { type: blob.type || item.mimeType || "image/jpeg" });
      const dims = await readSize(file);
      setSource({ file, url: URL.createObjectURL(blob), dims, existing: true });
      setFit(true); rs.clear();
    } catch {
      toast.error("This image cannot be opened for editing here. Use “Replace image” to upload a new file.");
    } finally { setBusy(false); }
  };

  const canCrop = Boolean(source) && !NO_CROP.test(source.file.type) && Boolean(source.dims?.width);
  const resizing = Boolean(source) && canCrop && fit;
  const dirty = Boolean(source) || (isEdit ? Object.keys(form).some((k) => !same(form[k], item?.[k])) : Object.values(form).some((v) => (Array.isArray(v) ? v.length : Boolean(v))));
  const set = (k) => (e) => { if (k === "title") setTitleTouched(true); setForm((f) => ({ ...f, [k]: e.target.value })); };

  // warn on tab close with unsaved work
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const back = async () => {
    if (dirty && !(await confirm({ title: "Leave without saving?", message: "Your changes to this image will be lost.", tone: "warning", confirmLabel: "Leave", cancelLabel: "Keep editing" }))) return;
    navigate("/dashboard/media");
  };

  const usage = item?.usage;
  const inUse = Boolean(usage?.total);

  const removeImage = async () => {
    const ok = await confirm({ title: "Delete this image permanently?", message: `“${item.fileName || item.title}” will be removed from the library and from the image server.`, tone: "danger", confirmLabel: "Delete permanently" });
    if (ok) del.mutate(id);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(item.url); toast.success("URL copied"); }
    catch { toast.error("Could not copy – select the URL and copy it by hand"); }
  };

  const submit = async () => {
    if (!isEdit && !source) { toast.error("Choose an image first"); return; }
    setBusy(true);
    try {
      let file = null; let width; let height;
      if (source) {
        if (resizing) {
          if (!rs.area) throw new Error("The editor is still loading – try again in a moment");
          file = await cropToFile(source.url, rs.area, rs.rotation, source.file);
          width = OUTPUT_WIDTH; height = OUTPUT_HEIGHT;
        } else { file = source.file; width = source.dims?.width; height = source.dims?.height; }
      }
      save.mutate({ id, file, width, height, ...form, title: form.title.trim() || (file ? titleOf(file.name) : "") });
    } catch (e) { toast.error(e.message || "Could not prepare the image"); }
    finally { setBusy(false); }
  };

  /* what the metadata panel shows */
  const meta = useMemo(() => {
    if (source) {
      const outType = resizing ? (source.file.type === "image/png" ? "image/png" : source.file.type === "image/webp" ? "image/webp" : "image/jpeg") : source.file.type;
      return {
        pending: true,
        fileName: source.file.name,
        mimeType: outType || "image",
        size: resizing ? "Calculated after resizing" : fmtBytes(source.file.size),
        width: resizing ? OUTPUT_WIDTH : source.dims?.width, height: resizing ? OUTPUT_HEIGHT : source.dims?.height,
      };
    }
    return item ? { fileName: item.fileName, mimeType: item.mimeType, size: item.size ? fmtBytes(item.size) : "—", width: item.width, height: item.height } : null;
  }, [source, resizing, item]);

  if (isEdit && error) return <ErrorState error={error} onRetry={refetch} />;

  const title = isEdit ? "Edit media" : "Add media";
  const busyAll = busy || save.isPending;

  return (
    <div className="flex flex-col">
      <PageHeader
        title={title}
        description="Shared by Live and News · Recommended: 16:9 at 1280 × 720"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={ArrowLeft} onClick={back}>Back</Button>
            <Button leftIcon={Save} onClick={submit} loading={busyAll} disabled={!dirty || (isEdit && isLoading)}>{isEdit ? "Save changes" : "Add to library"}</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* ── left: the image ── */}
        <Card padded={false} className="self-start">
          <CardHeader icon={ImageIcon} title="Image"
            description={source ? (resizing ? "Position the picture inside the frame." : "The original file will be uploaded as it is.") : isEdit ? "The image currently in the library." : "Choose the image to add."}
            actions={source && (
              <Button size="sm" variant="ghost" leftIcon={X} onClick={() => { setSource(null); rs.clear(); }}>{isEdit ? "Cancel changes" : "Remove"}</Button>
            )} />
          <CardBody className="space-y-4">
            {source ? (
              <>
                {!source.existing && (
                  <Tabs variant="pill" value={fit && canCrop ? "fit" : "original"} onChange={(v) => canCrop && setFit(v === "fit")}
                    items={[
                      { value: "fit", label: <span className="inline-flex items-center gap-1.5">Resize to {OUTPUT_WIDTH} × {OUTPUT_HEIGHT}<Badge tone="primary" size="sm">Recommended</Badge></span> },
                      { value: "original", label: "Keep original" },
                    ]} />
                )}
                {!canCrop && <Alert tone="info">This format (animated GIF, SVG or a type your browser cannot edit) is uploaded as the original file.</Alert>}
                {resizing ? <ImageResizer src={source.url} state={rs} /> : (
                  <div className="grid aspect-video w-full place-items-center overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line">
                    <img src={source.url} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </>
            ) : isEdit ? (
              isLoading ? <Skeleton className="aspect-video w-full rounded-xl" /> : (
                <>
                  <div className="grid aspect-video w-full place-items-center overflow-hidden rounded-xl bg-surface-2 ring-1 ring-line">
                    <img src={item.url} alt={form.altText} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" leftIcon={Crop} onClick={editExisting} loading={busy}>Edit image</Button>
                    <Button variant="outline" leftIcon={Replace} onClick={() => replaceInput.current?.click()}>Replace image</Button>
                    <input ref={replaceInput} type="file" accept={IMAGE_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
                  </div>
                  {isWide(item.width, item.height)
                    ? <RecommendedNote done />
                    : <Alert tone="warning" title="Not the recommended 16:9">Use “Edit image” to fit it to 1280 × 720 so it looks right on Live and News.</Alert>}
                </>
              )
            ) : (
              <>
                <RecommendedNote />
                <MediaDropzone onFiles={onFiles} />
              </>
            )}
          </CardBody>
        </Card>

        {/* ── right: details + metadata ── */}
        <div className="space-y-4">
          <Card padded={false}>
            <CardHeader title="Image information" actions={meta?.pending && <Badge tone="warning" size="sm">Not saved yet</Badge>} />
            <CardBody className="py-2 sm:py-2">
              {isEdit && isLoading ? <Skeleton className="my-3 h-32 w-full" /> : (
                <dl className="divide-y divide-line">
                  {isEdit && item && <Row label="Uploaded on">{fmtDate(item.createdAt, true)}</Row>}
                  {isEdit && item && <Row label="Uploaded by">{item.uploadedBy?.username || item.uploadedBy?.name || "—"}</Row>}
                  <Row label="File name">{meta?.fileName || "—"}</Row>
                  <Row label="File type">{meta?.mimeType || "—"}</Row>
                  <Row label="File size">{meta?.size || "—"}</Row>
                  <Row label="Dimensions">
                    {meta?.width && meta?.height ? (
                      <span className="inline-flex flex-wrap items-center justify-end gap-1.5">{meta.width} × {meta.height} px
                        {isWide(meta.width, meta.height) ? <Badge tone="success" size="sm">16:9 · Recommended</Badge> : <Badge size="sm">Not 16:9</Badge>}
                      </span>
                    ) : "—"}
                  </Row>
                  <Row label="Used for">Live · News</Row>
                  {isEdit && item && (
                    <Row label="Used in">
                      {inUse
                        ? [usage.news && `${usage.news} news`, usage.scheduled && `${usage.scheduled} scheduled`, usage.live && `${usage.live} live`].filter(Boolean).join(" · ")
                        : "Not used yet"}
                    </Row>
                  )}
                </dl>
              )}
            </CardBody>
          </Card>

          <Card padded={false}>
            <CardHeader icon={Info} title="Details" />
            <CardBody className="space-y-4">
              <Field label="Name" hint="Shown in the library.">
                <Input value={form.title} onChange={set("title")} placeholder="e.g. Parliament session, 17 Nov" />
              </Field>
              <Field label="Image alt text" hint="Describe the image for people who cannot see it. Leave empty if it is purely decorative.">
                <Textarea rows={2} value={form.altText} onChange={set("altText")} />
              </Field>
              <Field label="Image caption" hint="Shown under the image on stories.">
                <Textarea rows={2} value={form.caption} onChange={set("caption")} />
              </Field>
              <Field label="Description">
                <Textarea rows={3} value={form.description} onChange={set("description")} />
              </Field>
              <Field label="Tags" hint={`Used to find this image quickly in the library. Press Enter or comma after each tag (up to ${MAX_TAGS}).`}>
                <TagInput value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
              </Field>

              <Field label="File URL" hint={isEdit ? undefined : "The link is created when you add the image."}>
                <div className="flex gap-2">
                  <Input icon={Link2} readOnly value={isEdit ? item?.url || "" : ""} placeholder="Available after upload" onFocus={(e) => e.target.select()} />
                  <IconButton label="Copy URL to clipboard" variant="outline" onClick={copy} disabled={!isEdit || !item}><Copy className="size-4" /></IconButton>
                  <IconButton label="Open in new tab" variant="outline" as="a" href={item?.url} target="_blank" rel="noreferrer" aria-disabled={!isEdit || !item} className={!isEdit || !item ? "pointer-events-none opacity-55" : ""}><ExternalLink className="size-4" /></IconButton>
                </div>
              </Field>
            </CardBody>
          </Card>


          {isEdit && item && (
            <Card padded={false}>
              <CardHeader icon={Archive} title="Retire this image" actions={item.isArchived && <Badge tone="danger" size="sm">Retired</Badge>} />
              <CardBody className="space-y-3">
                <p className="text-sm text-fg-subtle">
                  {item.isArchived
                    ? "Nobody can choose this image for a new News or Live story. Stories that already use it keep showing it. Once no story uses it any more, you can delete it."
                    : "Retire an image you do not want used any more. It disappears from the image picker and cannot be chosen for new stories, while stories that already use it keep showing it. You can delete it once no story uses it."}
                </p>
                {item.isArchived
                  ? <Button variant="outline" leftIcon={ArchiveRestore} onClick={() => restore.mutate(id)} loading={restore.isPending} block>Allow use again</Button>
                  : <Button variant="outline" leftIcon={Archive} onClick={() => archive.mutate(id)} loading={archive.isPending} block>Retire image</Button>}
              </CardBody>
            </Card>
          )}

          {isEdit && item && can("media.default") && (
            <Card padded={false}>
              <CardHeader icon={Star} title="Default image" actions={item.isDefault && <Badge tone="success" size="sm">Default</Badge>} />
              <CardBody className="space-y-3">
                <p className="text-sm text-fg-subtle">The default image is what “Use default image” puts into a News or Live story. Only one image can be the default.</p>
                {item.isDefault
                  ? <Button variant="outline" leftIcon={X} onClick={() => clearDefault.mutate()} loading={clearDefault.isPending} block>Remove as default image</Button>
                  : <Button variant="outline" leftIcon={Star} onClick={() => setDefault.mutate(id)} loading={setDefault.isPending} block>Use as default image</Button>}
              </CardBody>
            </Card>
          )}

          {isEdit && item && (
            inUse
              ? <Alert tone="info" title="This image is in use">Stories use this image by reference, so it cannot be deleted yet. To stop anyone using it for new stories, press “Retire image”. To remove it completely, change the image in those stories first (or use “Replace image” so they all show a new one).</Alert>
              : <Button variant="danger-soft" leftIcon={Trash2} onClick={removeImage} loading={del.isPending} block>Delete permanently</Button>
          )}
        </div>
      </div>
    </div>
  );
}