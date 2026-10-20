import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ImagePlus, Link2, Mail, Monitor, RefreshCw, Smartphone, UploadCloud } from "lucide-react";
import httpClient from "../../api/httpClient";
import { errMsg } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Badge, Button, Field, Input } from "../../components/ui";

/** Where each ad type lives on the website, and the picture size it is designed for. */
const SPEC = {
  1: { type: "rectangle", name: "Main banner", w: 1093, h: 297, where: "Wide banner across the top of the home page" },
  2: { type: "square", name: "Side ad", w: 350, h: 350, where: "Square ad in the sidebar next to stories" },
  3: { type: "detail", name: "In-news ad", w: 1093, h: 297, where: "Wide ad between the paragraphs of a story" },
};

const Line = ({ w = "w-full", h = "h-2", tone = "bg-surface-3" }) => <div className={cn("rounded-full", h, w, tone)} />;

/** A tiny, faithful mock of the news site with the ad shown where it will really appear. */
function SitePreview({ addType, src, device }) {
  const mobile = device === "mobile";
  const slot = (cls) => (
    <div className={cn("relative overflow-hidden rounded-md border border-dashed border-line-strong bg-surface-2", cls)}>
      {src ? <img src={src} alt="Ad preview" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-[10px] font-medium uppercase tracking-wider text-fg-faint">Your ad</div>}
      <span className="absolute right-1 top-1 rounded bg-ink/70 px-1 text-[8px] font-semibold uppercase text-paper">Ad</span>
    </div>
  );
  const story = (k) => (
    <div key={k} className="flex gap-2"><div className="h-9 w-14 shrink-0 rounded bg-surface-3" /><div className="flex-1 space-y-1.5 pt-1"><Line /><Line w="w-2/3" /></div></div>
  );
  return (
    <div className={cn("mx-auto overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-all", mobile ? "w-56" : "w-full")}>
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2"><span className="size-2 rounded-full bg-danger/60" /><span className="size-2 rounded-full bg-warning/70" /><span className="size-2 rounded-full bg-success/70" /><div className="ml-2 h-3 flex-1 rounded-full bg-surface-3" /></div>
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between"><div className="h-4 w-16 rounded bg-fg/80" />{!mobile && <div className="flex gap-2"><Line w="w-8" /><Line w="w-8" /><Line w="w-8" /></div>}</div>
        {addType === 1 && slot("aspect-[1093/297] w-full")}
        {addType === 3 ? (
          <div className="space-y-2.5"><div className="aspect-video rounded-lg bg-surface-3" /><Line h="h-3" w="w-5/6" tone="bg-fg/25" /><Line /><Line w="w-11/12" />{slot("aspect-[1093/297] w-full")}<Line /><Line w="w-3/4" /></div>
        ) : (
          <div className={cn("grid gap-3", addType === 2 && !mobile ? "grid-cols-[1fr_38%]" : "grid-cols-1")}>
            <div className="space-y-2.5"><div className="aspect-video rounded-lg bg-surface-3" /><Line h="h-3" w="w-5/6" tone="bg-fg/25" />{[0, 1, 2].map(story)}</div>
            {addType === 2 && <div className="space-y-2.5">{slot("aspect-square w-full")}{[0, 1].map(story)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Ad creator: upload the picture, add the link, and see the ad on a mock of the real page — desktop or phone — before saving.
 * Warns (does not block) when the picture's shape is far from the size the slot is designed for.
 */
const AdsUploader = ({ onClose, refetch, addType = 1, ad }) => {
  const spec = SPEC[addType] || SPEC[1];
  const qc = useQueryClient();
  const [src, setSrc] = useState("");
  const [image, setImage] = useState(null);
  const [dims, setDims] = useState(null);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [device, setDevice] = useState("desktop");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { if (ad) { setSrc(ad.banner?.url || ""); setLink(ad.link || ""); setEmail(ad.email || ""); } }, [ad]);

  const take = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return toast.error("Choose a PNG, JPG or WebP image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image is larger than 5 MB");
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => setDims({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.src = url;
    setImage(file); setSrc(url);
  };

  const fit = useMemo(() => {
    if (!dims) return null;
    const diff = Math.abs(dims.w / dims.h - spec.w / spec.h) / (spec.w / spec.h);
    return { ok: diff <= 0.12, diff };
  }, [dims, spec]);

  const linkOk = !link || /^https?:\/\/\S+\.\S+/i.test(link);
  const save = async () => {
    if (!src) return toast.error("Please choose an image");
    if (!ad && !image) return toast.error("Please choose an image");
    if (!linkOk) return toast.error("The link must start with https://");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email");
    const fd = new FormData();
    if (ad) fd.append("add_id", ad._id);
    if (image) fd.append("banner", image);
    fd.append("link", link); fd.append("email", email); fd.append("type", spec.type);
    setBusy(true);
    const t = toast.loading(ad ? "Updating…" : "Uploading…");
    try {
      await (ad ? httpClient.put(`/ads/update/${ad._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } }) : httpClient.post("/ads/add", fd, { headers: { "Content-Type": "multipart/form-data" } }));
      toast.success(ad ? "Advertisement updated" : "Advertisement created", { id: t });
      qc.invalidateQueries({ queryKey: ["ads"] });
      refetch?.();
      onClose?.(false);
    } catch (e) { toast.error(errMsg(e, "Could not save the advertisement"), { id: t }); } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-fg">{spec.name}</p><Badge tone="neutral" size="sm">{spec.w} × {spec.h}</Badge></div>
          <p className="text-sm text-fg-subtle">{spec.where}.</p>
        </div>

        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
          className={cn("relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors", drag ? "border-fg bg-surface-2" : "border-line-strong")}>
          {src ? (
            <div className="group relative">
              <img src={src} alt="" className={cn("w-full bg-surface-2 object-contain", addType === 2 ? "aspect-square" : "aspect-[1093/297]")} />
              <button type="button" onClick={() => fileRef.current?.click()} className="absolute inset-0 grid place-items-center bg-ink/55 text-sm font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100"><span className="inline-flex items-center gap-2"><RefreshCw className="size-4" />Replace image</span></button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-fg-muted"><UploadCloud className="size-6" /></span>
              <span className="text-sm font-medium text-fg">Drop the picture here or <span className="underline">browse</span></span>
              <span className="text-xs text-fg-subtle">PNG, JPG or WebP · up to 5 MB</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
        </div>

        {fit && (
          <p className={cn("flex items-start gap-2 rounded-xl p-3 text-sm", fit.ok ? "bg-success-soft text-success" : "bg-warning-soft text-fg-muted")}>
            {fit.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />}
            {fit.ok ? `Great — ${dims.w} × ${dims.h} fits this slot.` : `This picture is ${dims.w} × ${dims.h}. The slot is ${spec.w} × ${spec.h}, so the ad will be cropped or stretched.`}
          </p>
        )}

        <Field label="Link" hint="Where a click goes (optional)" error={!linkOk ? "Must start with https://" : undefined}><Input icon={Link2} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://advertiser.com/offer" inputMode="url" /></Field>
        <Field label="Advertiser email" hint="Optional"><Input icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></Field>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" onClick={() => onClose?.(false)}>Cancel</Button>
          <Button onClick={save} loading={busy} leftIcon={ImagePlus}>{ad ? "Save changes" : "Create ad"}</Button>
        </div>
      </div>

      <div className="space-y-3 lg:sticky lg:top-0 lg:self-start">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-fg">Live preview</p>
          <div className="inline-flex rounded-full bg-surface-3 p-0.5" role="group" aria-label="Device">
            {[["desktop", Monitor, "Desktop"], ["mobile", Smartphone, "Phone"]].map(([id, Icon, l]) => (
              <button key={id} type="button" aria-pressed={device === id} onClick={() => setDevice(id)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", device === id ? "bg-surface text-fg shadow-sm" : "text-fg-subtle")}><Icon className="size-3.5" />{l}</button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3 sm:p-4"><SitePreview addType={addType} src={src} device={device} /></div>
        <p className="text-center text-xs text-fg-faint">Illustration of the page — the real layout may differ slightly.</p>
      </div>
    </div>
  );
};

export default AdsUploader;
