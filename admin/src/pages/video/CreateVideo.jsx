import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CircleAlert, Link2, MonitorPlay, Play, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import httpClient from "../../api/httpClient";
import { errMsg } from "../../lib/api";
import { ChipInput } from "../../components/ui/TagInput";
import { Badge, Button, Card, Field, Input, PageHeader, Textarea } from "../../components/ui";

const LIST_PATH = "/dashboard/videos";
const YT_ID = /^[\w-]{11}$/;

/** 11-character id from any YouTube link (watch / youtu.be / embed / live) or the bare id. Shorts links are rejected on purpose. */
export const parseYouTubeId = (input = "") => {
  const v = input.trim();
  if (YT_ID.test(v)) return v;
  const m = v.match(/(?:v=|youtu\.be\/|embed\/|live\/)([0-9A-Za-z_-]{11})/);
  return m ? m[1] : null;
};
const isShortsLink = (v = "") => /youtube\.com\/shorts\//i.test(v);

/**
 * YouTube news: a long, LANDSCAPE video added by its link. Title / description are optional here — when left empty the server
 * fills them from YouTube. Portrait shorts belong to "Shorts & videos".
 */
export default function CreateVideo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [link, setLink] = useState("");
  const [f, setF] = useState({ title: "", description: "", state: "", district: "", location: "" });
  const [tags, setTags] = useState([]);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);

  const id = useMemo(() => parseYouTubeId(link), [link]);
  const shorts = isShortsLink(link);
  const canPreview = !!id && !shorts;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value, ...(k === "state" ? { district: "" } : {}) }));

  useEffect(() => setPlaying(false), [id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!id) return toast.error("Paste a valid YouTube link");
    if (shorts) return toast.error("That is a Short. Add it from Shorts & videos.");
    if (!tags.length) return toast.error("Add at least one tag");
    setBusy(true);
    const tid = toast.loading("Adding video…");
    try {
      await httpClient.post("/create-yt-news", { ...f, videoLinkId: id, tags: tags.map((x) => x.title) });
      toast.success("YouTube video added", { id: tid });
      queryClient.invalidateQueries({ queryKey: ["yt-news"] });
      navigate(LIST_PATH);
    } catch (err) {
      toast.error(errMsg(err, "Could not add the video"), { id: tid });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("YouTube news")}
        description="Add a long, landscape video from YouTube. Title and description are filled from YouTube if you leave them empty."
        actions={<Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate(LIST_PATH)} disabled={busy}>Back</Button>}
      />

      <form onSubmit={submit} className="grid h-fit gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="h-fit space-y-5">
          <Field
            label="YouTube link or video id"
            required
            error={link && !id ? "Not a YouTube link" : shorts ? "This is a Short (portrait). Use Shorts & videos for it." : undefined}
          >
            <Input icon={Link2} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" autoFocus />
          </Field>

          <p className="flex items-start gap-2 rounded-xl bg-info-soft p-3 text-sm text-fg-muted">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-info" />
            Only long landscape videos are accepted here. Short portrait videos go to <b>Shorts &amp; videos</b>.
          </p>

          <Field label="Title" hint="Optional — taken from YouTube when empty">
            <Input value={f.title} onChange={set("title")} className="hindi-font" maxLength={300} placeholder="Enter the title of the video" />
          </Field>

          <Field label="Description" required>
            <Textarea rows={4} value={f.description} onChange={set("description")} className="hindi-font" />
          </Field>

          <Field label="Tags" required hint="Hindi or English · Enter to add">
            <ChipInput value={tags} onChange={setTags} max={10} suggestions={[]} placeholder="e.g. modi, मोदी" />
          </Field>

          {/* <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State"><Select value={f.state} onChange={set("state")} options={[{ value: "", label: "Select state" }, ...Object.keys(stateDistricts).map((s) => ({ value: s, label: findHindi(s) }))]} /></Field>
            <Field label="District"><Select value={f.district} onChange={set("district")} disabled={!f.state} options={[{ value: "", label: "Select district" }, ...(stateDistricts[f.state] || []).map((d) => ({ value: d.english, label: d.hindi }))]} /></Field>
          </div>
          <Field label="Location" hint="Village / town"><Input value={f.location} onChange={set("location")} className="hindi-font" /></Field> */}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(LIST_PATH)} disabled={busy}>Cancel</Button>
            <Button type="submit" loading={busy} disabled={!canPreview}>Add video</Button>
          </div>
        </Card>

        <Card className="h-fit lg:sticky lg:top-4">
          <p className="mb-4 text-sm font-semibold text-fg">Preview</p>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-surface-2">
            {canPreview ? (
              playing ? (
                <iframe
                  title="YouTube preview"
                  src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
                  className="absolute inset-0 size-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full" aria-label="Play preview">
                  <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="size-full object-cover" />
                  <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
                  <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg">
                    <Play className="size-5 translate-x-0.5 fill-current" />
                  </span>
                </button>
              )
            ) : (
              <div className="absolute inset-0 grid place-items-center px-6 text-center text-fg-faint">
                <div className="flex flex-col items-center gap-2">
                  <MonitorPlay className="size-10" />
                  <span className="text-xs">Paste a YouTube link to see a preview</span>
                </div>
              </div>
            )}
            {canPreview && <Badge tone="danger" size="sm" className="absolute left-2 top-2">Landscape</Badge>}
          </div>

          <p className="hindi-font mt-3 line-clamp-2 text-center text-sm font-medium text-fg">
            {f.title || (canPreview ? "Title will come from YouTube" : "Untitled video")}
          </p>

          {shorts && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />This is a Short. Add it from Shorts &amp; videos.
            </p>
          )}
        </Card>
      </form>
    </>
  );
}