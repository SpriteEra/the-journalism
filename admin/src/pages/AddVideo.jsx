import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Link2, Play, Plus, X } from "lucide-react";
import { findHindi, stateDistricts } from "../assets/data";
import { youtubeId } from "../lib/videoMeta";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "../components/ui";

const LIST_PATH = "/dashboard/videos";

const ytVideoStructure = {
  id: "",
  title: "",
  videoLinkId: "",
  description: "",
  tags: [],
  state: "",
  district: "",
  location: "",
};

const AddVideo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeParams = useParams();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tagData, setTagData] = useState("");
  const [ytData, setYtData] = useState(ytVideoStructure);

  // edit id can come from ?video_id=... or from the route (/videos/edit/:id)
  const searchParams = new URLSearchParams(location.search);
  const video_id =
    searchParams.get("video_id") || routeParams.id || routeParams.news_id || routeParams.video_id || null;

  const ytId = youtubeId(ytData.videoLinkId);

  useEffect(() => {
    if (video_id) fetchNews();
    window.scrollTo(0, 0);
  }, [video_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setPlaying(false), [ytId]);

  const fetchNews = () => {
    setLoading(true);
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-youtube-news", {
        video_id,
        draft: false,
        mode: "edit",
      })
      .then(({ data: { news } }) => setYtData({ ...ytVideoStructure, ...news, tags: news?.tags || [] }))
      .catch((err) => {
        console.log(err);
        toast.error("Could not load the video");
      })
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => setYtData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const addTag = () => {
    const tag = tagData.trim();
    if (!tag) return;
    if (ytData.tags.includes(tag)) return toast.error("Tag already added");
    if (ytData.tags.length >= 10) return toast.error("You can add max 10 tags");
    setYtData((s) => ({ ...s, tags: [...s.tags, tag] }));
    setTagData("");
  };

  const removeTag = (i) => setYtData((s) => ({ ...s, tags: s.tags.filter((_, x) => x !== i) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ytId) return toast.error("Enter a valid YouTube link or video id");
    const formData = { ...ytData, videoLinkId: ytId, id: video_id };
    const loadingToast = toast.loading(video_id ? "Updating..." : "Creating...");
    setSaving(true);
    axios.defaults.withCredentials = true;
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-yt-news", formData)
      .then(() => {
        toast.success(`YouTube Video ${video_id ? "Updated" : "Added"} Successfully`);
        navigate(LIST_PATH);
      })
      .catch(({ response }) => toast.error(response?.data?.message || "Something went wrong"))
      .finally(() => {
        setSaving(false);
        toast.dismiss(loadingToast);
      });
  };

  return (
    <>
      <PageHeader
        title={video_id ? "Edit YouTube video" : "Add YouTube video"}
        description="Long landscape videos from YouTube."
        actions={
          <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate(LIST_PATH)} disabled={saving}>
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid h-fit gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="h-fit space-y-5">
          <Field label="YouTube link or video id" required>
            <Input
              icon={Link2}
              name="videoLinkId"
              value={ytData.videoLinkId}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=…"
              required
              disabled={loading}
            />
          </Field>

          <Field label="Title" required>
            <Input
              name="title"
              value={ytData.title}
              onChange={handleChange}
              placeholder="Enter the title of the video"
              maxLength={300}
              required
              disabled={loading}
            />
          </Field>

          <Field label="Description" required>
            <Textarea
              name="description"
              rows={4}
              value={ytData.description}
              onChange={handleChange}
              placeholder="Video description"
              disabled={loading}
            />
          </Field>

          <Field label="Tags" hint={`${ytData.tags.length}/10 · press Enter to add`}>
            <div className="flex gap-2">
              <Input
                value={tagData}
                onChange={(e) => setTagData(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Tags related to the video"
              />
              <Button type="button" variant="outline" leftIcon={Plus} onClick={addTag}>
                Add
              </Button>
            </div>
            {ytData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ytData.tags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      aria-label={`Remove ${tag}`}
                      className="rounded-full hover:bg-primary/10"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Location" hint="Incident location">
            <Input name="location" value={ytData.location} onChange={handleChange} placeholder="Location" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State">
              <Select
                value={ytData.state}
                onChange={(e) => setYtData((s) => ({ ...s, state: e.target.value, district: "" }))}
                options={[
                  { value: "", label: "Select state" },
                  ...Object.keys(stateDistricts).map((s) => ({ value: s, label: findHindi(s) })),
                ]}
              />
            </Field>
            <Field label="District">
              <Select
                value={ytData.district}
                disabled={!ytData.state}
                onChange={(e) => setYtData((s) => ({ ...s, district: e.target.value }))}
                options={[
                  { value: "", label: "Select district" },
                  ...(stateDistricts[ytData.state] || []).map((d) => ({ value: d.english, label: d.hindi })),
                ]}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(LIST_PATH)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {video_id ? "Update now" : "Add now"}
            </Button>
          </div>
        </Card>

        <Card className="h-fit lg:sticky lg:top-4">
          <p className="mb-4 text-sm font-semibold text-fg">Preview</p>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-surface-2">
            {ytId ? (
              playing ? (
                <iframe
                  title="YouTube preview"
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                  className="absolute inset-0 size-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="group absolute inset-0 size-full"
                  aria-label="Play preview"
                >
                  <img src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt="" className="size-full object-cover" />
                  <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
                  <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg">
                    <Play className="size-5 translate-x-0.5 fill-current" />
                  </span>
                </button>
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-fg-faint">
                Paste a YouTube link to see a preview
              </div>
            )}
          </div>
          <p className="mt-3 line-clamp-2 text-center text-sm font-medium text-fg">
            {ytData.title || "Untitled video"}
          </p>
        </Card>
      </form>
    </>
  );
};

export default AddVideo;