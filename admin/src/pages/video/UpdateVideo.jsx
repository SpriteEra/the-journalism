import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Circle, CircleAlert, CircleCheck, Link2, MonitorPlay, Pin, Play, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import httpClient from "../../api/httpClient";
import { errMsg } from "../../lib/api";
import { ChipInput } from "../../components/ui/TagInput";
import { Badge, Button, Card, Field, Input, PageHeader, Textarea } from "../../components/ui";
import { parseYouTubeId } from "./CreateVideo"; // adjust the path/name to where CreateVideo lives
import Confirmation from "../../utils/Confirmation";

const LIST_PATH = "/dashboard/videos";
const MAX_PINNED = 2; // keep in sync with MAX_PINNED on the server
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

/** One line of the "Ready to save" checklist. */
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
 * Edit a YouTube news item. Same layout as CreateVideo.
 * Saving and pinning are two requests: PUT /update-yt-news/:id, then PATCH /yt-news/:id/pin when the switch changed.
 * The "replace the oldest pin?" dialog opens only when that pin request hits the limit.
 */
export default function UpdateVideo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { news_id: video_id } = useParams();

  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState("");
  const [f, setF] = useState({ title: "", description: "" });
  const [tags, setTags] = useState([]);
  const [pin, setPin] = useState(false);
  const [initialPin, setInitialPin] = useState(false);
  const [status, setStatus] = useState({ draft: false, isPublished: true, need_approval: false });
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [willRemove, setWillRemove] = useState([]);

  const id = useMemo(() => parseYouTubeId(link), [link]);
  const shorts = isShortsLink(link);
  const canPreview = !!id && !shorts;
  const pinChanged = pin !== initialPin;
  // only published items can be pinned (fields come from the admin GET; missing fields count as allowed)
  const pinnable = !status.draft && status.isPublished !== false && !status.need_approval;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => setPlaying(false), [id]);

  useEffect(() => {
    if (!video_id) return;
    window.scrollTo(0, 0);
    setLoading(true);
    httpClient
      .get(`/yt-news/${video_id}`)
      .then((res) => {
        const d = res?.data ?? res;
        setLink(d.videoLinkId || "");
        setF({ title: d.title || "", description: d.description || "" });
        setTags((d.tags || []).map((title) => ({ title })));
        setPin(!!d.isPinned);
        setInitialPin(!!d.isPinned);
        setStatus({ draft: !!d.draft, isPublished: d.isPublished, need_approval: !!d.need_approval });
      })
      .catch((err) => {
        toast.error(errMsg(err, "Could not load the video"));
        navigate(LIST_PATH);
      })
      .finally(() => setLoading(false));
  }, [video_id]);

  const done = (message) => {
    if (message) toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["yt-news"] });
    navigate(LIST_PATH);
  };

  const requestPin = async (replace = false) => {
    const res = await httpClient.patch(`/yt-news/${video_id}/pin`, { pin, replace });
    return res?.data ?? res;
  };

  // 1) save the fields  2) pin / unpin when the switch changed
  const save = async () => {
    setBusy(true);
    const tid = toast.loading("Saving…");
    try {
      await httpClient.put(`/update-yt-news/${video_id}`, {
        id: video_id,
        title: f.title,
        description: f.description,
        tags: tags.map((x) => x.title),
        videoLinkId: id || "",
      });
    } catch (err) {
      toast.error(errMsg(err, "Could not update the video"), { id: tid });
      setBusy(false);
      return;
    }

    if (!pinChanged) {
      toast.dismiss(tid);
      setBusy(false);
      return done("YouTube video updated");
    }

    try {
      await requestPin(false);
      toast.dismiss(tid);
      done(pin ? "Video updated and pinned" : "Video updated and unpinned");
    } catch (err) {
      const body = err?.response?.data;
      // the confirmation is only for a pin request that hit the limit
      if (pin && err?.response?.status === 409 && body?.code === "PIN_LIMIT") {
        toast.dismiss(tid);
        setWillRemove(body.willRemove || []);
        setReplaceOpen(true);
      } else {
        toast.dismiss(tid);
        toast.error(`Changes saved, but ${pin ? "pinning" : "unpinning"} failed: ${errMsg(err, "try again from the list")}`);
        done();
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmReplace = async () => {
    setReplaceOpen(false);
    setBusy(true);
    const tid = toast.loading("Pinning…");
    try {
      await requestPin(true);
      toast.dismiss(tid);
      done("Video updated and pinned. The oldest pin was removed");
    } catch (err) {
      toast.error(errMsg(err, "Changes saved, but pinning failed"), { id: tid });
      done();
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (shorts) return toast.error("That is a Short. Use Shorts & videos for it.");
    if (!f.title.trim()) return toast.error("Title cannot be empty");
    if (!status.draft) {
      if (!id) return toast.error("Paste a valid YouTube link");
      if (!f.description.trim()) return toast.error("Add a description");
      if (!tags.length) return toast.error("Add at least one tag");
    } else if (link && !id) {
      return toast.error("Paste a valid YouTube link");
    }
    save();
  };

  if (loading) {
    return (
      <>
        <PageHeader title={t("Update YouTube news")} description="Loading…" />
        <Card className="h-64 animate-pulse bg-surface-2" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("Update YouTube news")}
        description="Change the video link, title, description or tags, and choose whether it is pinned to the top of the list."
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
                <Input icon={Link2} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" />
              </Field>
              <p className="flex items-start gap-2 rounded-xl bg-info-soft px-3 py-2.5 text-xs text-fg-muted">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-info" />
                Only long landscape videos are accepted here. Changing the link refreshes the thumbnail and length from YouTube.
              </p>
            </Section>
          </div>

          <div className="p-5 sm:p-6">
            <Section title="Details">
              <Field label="Title" required>
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

          <div className="p-5 sm:p-6">
            <Section title="Placement">
              <button
                type="button"
                role="switch"
                aria-checked={pin}
                onClick={() => setPin((v) => !v)}
                disabled={busy || (!pinnable && !pin)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info disabled:cursor-not-allowed disabled:opacity-60 ${pin ? "border-info bg-info-soft" : "border-line hover:bg-surface-2"
                  }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${pin ? "bg-info text-white" : "bg-surface-2 text-fg-muted"}`}>
                  <Pin className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">Pin to top</span>
                  <span className="block text-xs text-fg-muted">
                    {!pinnable && !pin
                      ? "Only published videos can be pinned."
                      : pin
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
            <Button type="submit" loading={busy} disabled={!!link && !canPreview}>
              {pinChanged ? (pin ? "Save and pin" : "Save and unpin") : "Update now"}
            </Button>
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

            <p className="hindi-font line-clamp-2 text-sm font-medium text-fg">{f.title || "Untitled video"}</p>

            {shorts && (
              <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />This is a Short. Use Shorts &amp; videos for it.
              </p>
            )}
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-fg">Ready to save</p>
            <ul className="space-y-2">
              <Check done={canPreview}>Valid landscape YouTube link</Check>
              <Check done={!!f.title.trim()}>Title</Check>
              <Check done={!!f.description.trim()}>Description</Check>
              <Check done={tags.length > 0}>At least one tag{tags.length > 0 ? ` (${tags.length})` : ""}</Check>
              {pinChanged && <Check done>{pin ? "Will be pinned to top" : "Will be unpinned"}</Check>}
            </ul>
          </Card>
        </div>
      </form>

      {/* only opened when a pin request hits the limit (server answers 409 PIN_LIMIT); changes are already saved at that point */}
      <Confirmation
        isOpen={replaceOpen}
        id="replace-pin"
        onClose={() => {
          setReplaceOpen(false);
          done("Changes saved. The video was not pinned");
        }}
        onConfirm={confirmReplace}
        btnTitle="Replace and pin"
        title="Replace pinned video?"
        btnDanger={false}
        description={`${MAX_PINNED} videos are already pinned. Pinning this one will unpin the oldest: ${willRemove.map((v) => v.title).join(", ") || "the oldest pinned video"
          }.`}
      />
    </>
  );
}