import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Link2, MonitorPlay, Send, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import httpClient from "../../api/httpClient";
import { errMsg } from "../../lib/api";
import { findHindi, stateDistricts } from "../../assets/data";
import { ChipInput } from "../../components/ui/TagInput";
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "../../components/ui";

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

  const id = useMemo(() => parseYouTubeId(link), [link]);
  const shorts = isShortsLink(link);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value, ...(k === "state" ? { district: "" } : {}) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!id) return toast.error("Paste a valid YouTube link");
    if (shorts) return toast.error("That is a Short. Add it from Shorts & videos.");
    if (!tags.length) return toast.error("Add at least one tag");
    if (!f.location.trim()) return toast.error("Add the location");
    setBusy(true);
    const tid = toast.loading("Adding video…");
    try {
      await httpClient.post("/create-yt-news", { ...f, videoLinkId: id, tags: tags.map((x) => x.title) });
      toast.success("YouTube video added", { id: tid });
      queryClient.invalidateQueries({ queryKey: ["yt-news"] });
      navigate("/dashboard/videos");
    } catch (err) { toast.error(errMsg(err, "Could not add the video"), { id: tid }); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title={t("YouTube news")} description="Add a long, landscape video from YouTube. Title and description are filled from YouTube if you leave them empty." />
      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card padded={false}>
            <CardHeader icon={Link2} title="Video link" />
            <div className="space-y-3 p-4 sm:p-5">
              <Field label="YouTube link or video id" required error={link && !id ? "Not a YouTube link" : shorts ? "This is a Short (portrait). Use Shorts & videos for it." : undefined}>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" />
              </Field>
              <p className="flex items-start gap-2 rounded-xl bg-info-soft p-3 text-sm text-fg-muted"><CircleAlert className="mt-0.5 size-4 shrink-0 text-info" />Only long landscape videos are accepted here. Short portrait videos go to <b>Shorts &amp; videos</b>.</p>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Details" />
            <div className="space-y-4 p-4 sm:p-5">
              <Field label="Title" hint="Optional — taken from YouTube when empty"><Input value={f.title} onChange={set("title")} className="hindi-font" /></Field>
              <Field label="Description" hint="Optional — taken from YouTube when empty"><Textarea rows={4} value={f.description} onChange={set("description")} className="hindi-font" /></Field>
              <Field label="Tags" required hint="Hindi or English · Enter to add"><ChipInput value={tags} onChange={setTags} max={10} suggestions={[]} placeholder="e.g. modi, मोदी" /></Field>
              {/* <div className="grid gap-4 sm:grid-cols-2">
                <Field label="State"><Select value={f.state} onChange={set("state")} options={[{ value: "", label: "Select state" }, ...Object.keys(stateDistricts).map((s) => ({ value: s, label: findHindi(s) }))]} /></Field>
                <Field label="District"><Select value={f.district} onChange={set("district")} disabled={!f.state} options={[{ value: "", label: "Select district" }, ...(stateDistricts[f.state] || []).map((d) => ({ value: d.english, label: d.hindi }))]} /></Field>
              </div> */}
              {/* <Field label="Location" required hint="Village / town"><Input value={f.location} onChange={set("location")} className="hindi-font" /></Field> */}
            </div>
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Card padded={false} className="overflow-hidden">
            <div className="relative aspect-video bg-surface-3">
              {id && !shorts ? <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-fg-faint"><MonitorPlay className="size-12" /></div>}
              <Badge tone="danger" className="absolute left-3 top-3"><Youtube className="size-3" />Landscape</Badge>
            </div>
            <div className="p-4"><p className="hindi-font line-clamp-2 font-semibold text-fg">{f.title || (id ? "Title will come from YouTube" : "Paste a link to see the preview")}</p></div>
          </Card>
          <Button type="submit" size="lg" leftIcon={Send} loading={busy} disabled={!id || shorts} className="w-full">Add video</Button>
        </aside>
      </form>
    </>
  );
}
