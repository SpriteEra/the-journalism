import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Circle, CircleAlert, CircleCheck, Link2, MonitorPlay, Pin, Play, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import httpClient from "../../api/httpClient";
import { errMsg } from "../../lib/api";
import { ChipInput } from "../../components/ui/TagInput";
import { Badge, Button, Card, Field, Input, PageHeader, Textarea } from "../../components/ui";
import Confirmation from "../../utils/Confirmation";

const LIST_PATH = "/dashboard/videos";
const YT_ID = /^[\w-]{11}$/;
const MAX_PINNED = 2; // keep in sync with MAX_PINNED on the server

/** 11-character id from any YouTube link (watch / youtu.be / embed / live) or the bare id. Shorts links are rejected on purpose. */
export const parseYouTubeId = (input = "") => {
  const v = input.trim();
  if (YT_ID.test(v)) return v;
  const m = v.match(/(?:v=|youtu\.be\/|embed\/|live\/)([0-9A-Za-z_-]{11})/);
  return m ? m[1] : null;
};
const isShortsLink = (v = "") => /youtube\.com\/shorts\//i.test(v);

/** A titled block inside the form card. */
function Section({ title, hint, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** One line of the "Ready to add" checklist. */
function Check({ done, children }) {
  const Icon = done ? CircleCheck : Circle;
  return (
    <li className={`flex items-center gap-2 text-sm ${done ? "text-fg" : "text-fg-muted"}`}>
      <Icon className={`size-4 shrink-0 ${done ? "text-success" : "text-fg-faint"}`} />
      {children}
    </li>
  );
}

/**
 * YouTube news: a long, LANDSCAPE video added by its link. Title / description are optional here -when left empty the server
 * fills them from YouTube. Portrait shorts belong to "Shorts & videos".
 */
export default function CreateVideo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [link, setLink] = useState("");
  const [f, setF] = useState({ title: "", description: "", state: "", district: "", location: "" });
  const [tags, setTags] = useState([]);
  const [pin, setPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false); // "2 already pinned, replace the oldest?" dialog
  const [willRemove, setWillRemove] = useState([]);      // pinned videos the server says will be unpinned

  const id = useMemo(() => parseYouTubeId(link), [link]);
  const shorts = isShortsLink(link);
  const canPreview = !!id && !shorts;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value, ...(k === "state" ? { district: "" } : {}) }));

  useEffect(() => setPlaying(false), [id]);

  // replace = true -> the server unpins the oldest pinned video(s) to make room
  const send = async (replace = false) => {
    setBusy(true);
    const tid = toast.loading("Adding video…");
    try {
      const res = await httpClient.post("/create-yt-news", {
        ...f,
        videoLinkId: id,
        tags: tags.map((x) => x.title),
        pin,
        replace,
      });
      const data = res?.data ?? res; // works whether httpClient returns the axios response or the body
      if (pin && data?.isPinned === false) {
        toast.success("Video added, but it was not pinned", { id: tid });
      } else if (data?.isPinned) {
        toast.success(data?.replaced?.length ? "Video added and pinned. The oldest pin was removed" : "Video added and pinned", { id: tid });
      } else {
        toast.success("YouTube video added", { id: tid });
      }
      queryClient.invalidateQueries({ queryKey: ["yt-news"] });
      navigate(LIST_PATH);
    } catch (err) {
      const body = err?.response?.data;
      // the confirmation is only for a pin request that hit the limit; every other error is a normal toast
      if (pin && err?.response?.status === 409 && body?.code === "PIN_LIMIT") {
        toast.dismiss(tid);
        setWillRemove(body.willRemove || []);
        setReplaceOpen(true);
      } else {
        toast.error(errMsg(err, "Could not add the video"), { id: tid });
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!id) return toast.error("Paste a valid YouTube link");
    if (shorts) return toast.error("That is a Short. Add it from Shorts & videos.");
    if (!tags.length) return toast.error("Add at least one tag");
    send(false);
  };

  return (
    <>
      <PageHeader
        title={t("YouTube news")}
        description="Add a long, landscape video from YouTube. Title and description are filled from YouTube if you leave them empty."
        actions={<Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate(LIST_PATH)} disabled={busy}>Back</Button>}
      />

      <form onSubmit={submit} className="grid h-fit gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ───────────── form ───────────── */}
        <Card className="h-fit divide-y divide-line !p-0">
          <div className="p-5 sm:p-6">
            <Section title="Video" hint="Paste a watch, youtu.be, embed or live link, or the 11-character id.">
              <Field
                label="YouTube link or video id"
                required
                error={link && !id ? "Not a YouTube link" : shorts ? "This is a Short (portrait). Use Shorts & videos for it." : undefined}
              >
                <Input icon={Link2} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" autoFocus />
              </Field>
              <p className="flex items-start gap-2 rounded-xl bg-info-soft px-3 py-2.5 text-xs text-fg-muted">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-info" />
                Only long landscape videos are accepted here. Short portrait videos go to <b>Shorts &amp; videos</b>.
              </p>
            </Section>
          </div>

          <div className="p-5 sm:p-6">
            <Section title="Details">
              <Field label="Title" hint="Optional -taken from YouTube when empty">
                <Input value={f.title} onChange={set("title")} className="hindi-font" maxLength={300} placeholder="Enter the title of the video" />
              </Field>
              <Field label="Description" required>
                <Textarea rows={4} value={f.description} onChange={set("description")} className="hindi-font" />
              </Field>
              <Field label="Tags" required hint="Hindi or English · Enter to add">
                <ChipInput value={tags} onChange={setTags} max={10} suggestions={[]} placeholder="e.g. modi, मोदी" />
              </Field>
            </Section>
          </div>

          {/* <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State"><Select value={f.state} onChange={set("state")} options={[{ value: "", label: "Select state" }, ...Object.keys(stateDistricts).map((s) => ({ value: s, label: findHindi(s) }))]} /></Field>
            <Field label="District"><Select value={f.district} onChange={set("district")} disabled={!f.state} options={[{ value: "", label: "Select district" }, ...(stateDistricts[f.state] || []).map((d) => ({ value: d.english, label: d.hindi }))]} /></Field>
          </div>
          <Field label="Location" hint="Village / town"><Input value={f.location} onChange={set("location")} className="hindi-font" /></Field> */}

          <div className="p-5 sm:p-6">
            <Section title="Placement">
              {/* Pin switch. The server pins only when the video is published right away (needs publish permission);
                  otherwise the flag is ignored and the video can be pinned later from the list. */}
              <button
                type="button"
                role="switch"
                aria-checked={pin}
                onClick={() => setPin((v) => !v)}
                disabled={busy}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info disabled:opacity-60 ${pin ? "border-info bg-info-soft" : "border-line hover:bg-surface-2"
                  }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${pin ? "bg-info text-white" : "bg-surface-2 text-fg-muted"}`}>
                  <Pin className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">Pin to top</span>
                  <span className="block text-xs text-fg-muted">
                    {pin
                      ? `Shown first in the list. Only ${MAX_PINNED} videos can be pinned; you'll be asked before an older pin is replaced.`
                      : "Show this video first in the video list."}
                  </span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${pin ? "bg-info" : "bg-line"}`} aria-hidden="true">
                  <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${pin ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>
            </Section>
          </div>

          <div className="flex justify-end gap-2 p-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => navigate(LIST_PATH)} disabled={busy}>Cancel</Button>
            <Button type="submit" loading={busy} disabled={!canPreview}>{pin ? "Add and pin" : "Add video"}</Button>
          </div>
        </Card>

        {/* ───────────── preview + checklist ───────────── */}
        <div className="h-fit space-y-4 lg:sticky lg:top-4">
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-fg">Preview</p>

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
              {canPreview && pin && (
                <Badge tone="info" size="sm" className="absolute right-2 top-2">
                  <Pin className="mr-1 size-3" />Pinned
                </Badge>
              )}
            </div>

            <p className="hindi-font line-clamp-2 text-sm font-medium text-fg">
              {f.title || (canPreview ? "Title will come from YouTube" : "Untitled video")}
            </p>

            {shorts && (
              <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />This is a Short. Add it from Shorts &amp; videos.
              </p>
            )}
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-fg">Ready to add</p>
            <ul className="space-y-2">
              <Check done={canPreview}>Valid landscape YouTube link</Check>
              <Check done={tags.length > 0}>At least one tag{tags.length > 0 ? ` (${tags.length})` : ""}</Check>
              <Check done={!!f.description.trim()}>Description{!f.description.trim() ? " (needed to publish)" : ""}</Check>
              {pin && <Check done>Pinned to top</Check>}
            </ul>
          </Card>
        </div>
      </form>

      {/* only opened when a pin request hits the limit (server answers 409 PIN_LIMIT); never for a normal add */}
      <Confirmation
        isOpen={replaceOpen}
        id="replace-pin"
        onClose={() => setReplaceOpen(false)}
        onConfirm={() => {
          setReplaceOpen(false);
          send(true);
        }}
        btnTitle="Replace and add"
        title="Replace pinned video?"
        btnDanger={false}
        description={`${MAX_PINNED} videos are already pinned. Pinning this one will unpin the oldest: ${willRemove.map((v) => v.title).join(", ") || "the oldest pinned video"
          }.`}
      />
    </>
  );
}