import { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Check, CircleAlert, Eye, FileClock, ImageIcon, Info, Link2, MapPin, Send, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import httpClient from "../api/httpClient.js";
import { EditorContext } from "../pages/news/CreateNews.jsx";
import { TagPicker, TaxonomyFields } from "./taxonomy/TaxonomyFields.jsx";
import KeywordsField, { addKeywords, normalizeKeywords } from "./news/KeywordsField.jsx";
import NewsPreview from "./news/NewsPreview.jsx";
import AdvancedPanel from "./news/AdvancedPanel.jsx";
import { useFeaturedCurrent } from "../hooks/news";
import SchedulePopUp from "./common/SchedulePopUp.jsx";
import AITagsPopup from "./keywords/Aitagspopup.jsx";
import { useCategories, useDistricts, useStates } from "../hooks/admin";
import usePermission from "../hooks/usePermission";
import { editorPlainText } from "../lib/sanitizeHtml";
import { errMsg } from "../lib/api";
import { readOra, writeOra } from "../lib/oraCache";
import { fromIstInput } from "../lib/time";
import { handleImageError } from "../utils/imageError.js";
import { Badge, Button, Card, CardHeader, Field, InfoTip, Input, Switch, Textarea, useConfirm } from "./ui";
import { cn } from "../lib/cn";

const CHAR_LIMIT = 400;
const TOPIC_LIMIT = 15;

function base64ToFile(base64String, fileName) {
  const arr = base64String.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}

const timeOptions = [];
for (let i = 0; i < 24; i++) {
  for (let j = 0; j < 60; j += 15) {
    const hour = i % 12 === 0 ? 12 : i % 12;
    timeOptions.push(`${String(hour).padStart(2, "0")}:${String(j).padStart(2, "0")} ${i < 12 ? "AM" : "PM"}`);
  }
}

/** Builds the multipart body for create / update / schedule. Same field names the API has always used (+ keywords). */
const buildForm = (b, { newsId, draft = false, ...opts } = {}) => {
  const fd = new FormData();
  fd.append("title", b.title);
  if (b.banner?.startsWith?.("data:image")) fd.append("banner", base64ToFile(b.banner, "banner.jpg")); else fd.append("banner", b.banner || "");
  fd.append("video", b.video || "");
  fd.append("imageRef", b.imageRef || "");
  fd.append("isVideo", Boolean(b.isVideo));
  fd.append("description", b.description || "");
  fd.append("is_literature", Boolean(b.is_literature));
  fd.append("ref_reporter", b.ref_reporter || "");
  fd.append("content", JSON.stringify(b.content));
  fd.append("tags", JSON.stringify(b.tags || []));                      // Topic(s) - references to the Tag collection
  fd.append("keywords", JSON.stringify(normalizeKeywords(b.keywords))); // SEO keywords, Hindi + English strings
  fd.append("aiGeneratedTags", JSON.stringify(b.aiGeneratedTags || []));
  ["category", "subCategory", "state", "district"].forEach((k) => fd.append(k, JSON.stringify(b[k] || [])));
  fd.append("location", b.location || "");
  // advanced: SEO (merged over what is stored so other SEO fields survive), page layout, featured story
  const seo = { ...(b.seo || {}) }; delete seo._id;
  fd.append("seo", JSON.stringify(seo));
  if (b.primaryRoute?.id) fd.append("primaryRoute", JSON.stringify(b.primaryRoute));
  fd.append("relatedNews", JSON.stringify((b.related || []).map((r) => r.news_id)));          // internal links, max 5
  if (b.feature?.enabled) fd.append("featured", JSON.stringify({ enabled: true, until: fromIstInput(b.feature.until).toISOString(), replace: Boolean(opts.replaceFeatured) }));
  else if (b.featured?.isFeatured) fd.append("featured", JSON.stringify({ enabled: false }));
  fd.append("breaking_news", Boolean(b.breaking_news));
  fd.append("sendNotification", Boolean(b.sendNotification));
  fd.append("draft", String(draft));
  fd.append("id", newsId);
  return fd;
};

function Check_({ ok, children }) {
  return (
    <li className={cn("flex items-start gap-2 text-sm", ok ? "text-fg-muted" : "text-fg")}>
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
        {ok ? <Check className="size-3" strokeWidth={3} /> : <CircleAlert className="size-3" strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </li>
  );
}

const PublishForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { news_id } = useParams();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { can, user } = usePermission();
  const query = new URLSearchParams(window.location.search);
  const mode = query.get("mode");
  const type = query.get("type");

  const { blog, setBlog, setEditorState, setHasChanges, setTextEditor } = useContext(EditorContext);
  const { banner, title, tags, keywords, description, content, is_literature, category, subCategory, state, district, location, post_time, sendNotification, imageRef, video, isVideo, ref_reporter, aiGeneratedTags } = blog;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [aiPopup, setAiPopup] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [timeIndex, setTimeIndex] = useState(0);
  const kw = normalizeKeywords(keywords);

  const { data: featuredNow } = useFeaturedCurrent(can("news.feature"));
  const cats = useCategories(); const states = useStates(); const districts = useDistricts();
  const update = (patch) => { setBlog((prev) => ({ ...prev, ...patch })); setHasChanges(true); };

  // autosave a local copy (survives a refresh / crash)
  useEffect(() => {
    const id = setInterval(() => { try { localStorage.setItem("blog", JSON.stringify(blog)); } catch { /* storage full */ } }, 5000);
    return () => clearInterval(id);
  }, [blog]);

  // ── checklist ──
  const checks = useMemo(() => [
    { ok: Boolean(title?.trim()), text: "Title" },
    { ok: Boolean(banner), text: "Banner image" },
    { ok: Boolean(description?.trim()) && description.length <= CHAR_LIMIT, text: `Description (max ${CHAR_LIMIT} characters)` },
    { ok: (category || []).length + (state || []).length > 0, text: "A category or a state (forms the story URL)" },
    { ok: (tags || []).length > 0 && tags.length <= TOPIC_LIMIT, text: "A topic" },
    { ok: kw.hi.length + kw.en.length > 0, text: "At least one SEO keyword" },
    { ok: !isVideo || Boolean(video), text: "Video file (video story)" },
  ], [title, banner, description, category, state, tags, kw.hi.length, kw.en.length, isVideo, video]);
  const ready = checks.every((c) => c.ok);
  const firstProblem = checks.find((c) => !c.ok);

  // ── names for the preview ──
  const names = (list, source, pick) => (list || []).map((id) => pick(source.find((x) => x._id === id) || {})).filter(Boolean);
  const previewNews = {
    title, banner, description, content, imageRef, isVideo, video, location, keywords: kw,
    author: user?.fullName || user?.username, createdAt: new Date(),
    categories: [...names(category, cats.data || [], (c) => c.name), ...names(subCategory, cats.data || [], (c) => c.name)],
    topics: tags || [],
    places: [...names(state, states.data || [], (s) => s.displayName || s.state), ...names(district, districts.data || [], (d) => d.displayName || d.district)],
  };

  // ── AI keywords: results are routed into Hindi / English by script ──
  const generateAI = async (regenerate = true) => {
    if (!title && !content) { toast.error("Add a title or content first"); return false; }
    setAiLoading(true);
    const id = toast.loading("Generating keywords…");
    try {
      const text = editorPlainText(content);
      const cacheKey = `kw:${title}|${text.length}|${text.slice(0, 80)}`;
      const hit = readOra(cacheKey, 24 * 3600_000);
      const { data } = hit && !regenerate ? { data: hit.data } : await httpClient.post("/spriteera-service/generate-tags", { title, content: text });
      if (!hit || regenerate) writeOra(cacheKey, data);
      const generated = (data.tags || []).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
      if (!generated.length) { toast.error("No keywords returned, try again", { id }); return false; }
      update({ aiGeneratedTags: generated });
      toast.dismiss(id);
      return true;
    } catch (e) { toast.error(errMsg(e, "Failed to generate keywords"), { id }); return false; } finally { setAiLoading(false); }
  };
  const onSuggest = async () => { if (aiGeneratedTags?.length || (await generateAI(false))) setAiPopup(true); };
  const onAddAI = (picked) => {
    const { value, skipped } = addKeywords(kw, picked);
    update({ keywords: value });
    toast.success(skipped ? `Added ${picked.length - skipped}, ${skipped} skipped` : `Added ${picked.length} keyword${picked.length > 1 ? "s" : ""}`);
  };
  const onRemoveAI = (list) => {
    const rm = new Set(list.map((x) => x.toLowerCase()));
    update({ keywords: { hi: kw.hi.filter((k) => !rm.has(k.toLowerCase())), en: kw.en.filter((k) => !rm.has(k.toLowerCase())) } });
  };

  // ── primary section of the URL: one of the chosen categories / states ──
  const routeOptions = useMemo(() => [
    ...(category || []).map((id) => { const c = (cats.data || []).find((x) => x._id === id); return c && { kind: "category", id, name: c.name, slug: c.slug }; }),
    ...(state || []).map((id) => { const x = (states.data || []).find((y) => y._id === id); return x && { kind: "state", id, name: x.displayName || x.state, slug: x.slug }; }),
  ].filter(Boolean), [category, state, cats.data, states.data]);
  const primary = routeOptions.find((o) => o.kind === blog.primaryRoute?.kind && o.id === blog.primaryRoute?.id) || routeOptions[0];
  useEffect(() => {      // keep the stored choice valid when the editor unselects the section that was primary
    if (primary && (blog.primaryRoute?.id !== primary.id || blog.primaryRoute?.kind !== primary.kind)) setBlog((p) => ({ ...p, primaryRoute: { kind: primary.kind, id: primary.id } }));
  }, [primary?.id, primary?.kind]); // eslint-disable-line react-hooks/exhaustive-deps
  const origin = (import.meta.env.VITE_CLIENT_URL || "yoursite.com").replace(/^https?:\/\//, "");

  const saveDraft = async () => {
    if (!title?.trim()) return toast.error("Add a title first");
    setBusy(true);
    const id = toast.loading("Saving draft…");
    try {
      const endpoint = mode === "edit" ? "/update-news" : "/create-news";
      await httpClient.post(endpoint, buildForm({ ...blog, feature: { enabled: false } }, { newsId: news_id, draft: true }), { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Saved as draft", { id });
      localStorage.removeItem("blog");
      queryClient.invalidateQueries({ queryKey: ["news"] });
      navigate("/dashboard/drafts");
    } catch (e) { toast.error(errMsg(e, "Could not save the draft"), { id }); } finally { setBusy(false); }
  };
  const canDraft = mode !== "edit" || blog.draft === true;

  const goBackToEditor = () => { setEditorState("editor"); setHasChanges(true); setTextEditor((p) => ({ ...p, isReady: false })); };

  const verb = mode !== "edit" || type === "guest-news" || type === "review" ? "Publish" : "Update";
  const post = async (replaceFeatured) => {
    const endpoint = mode === "edit" && type === "guest-news" ? "/publish-guest-news" : mode === "edit" ? "/update-news" : "/create-news";
    return httpClient.post(endpoint, buildForm(blog, { newsId: news_id, replaceFeatured }), { headers: { "Content-Type": "multipart/form-data" } });
  };

  const submit = async () => {
    if (!ready) return toast.error(`Missing: ${firstProblem?.text}`);
    if (blog.feature?.enabled && !blog.feature.until) return toast.error("Choose until when the story stays featured");
    const ok = await confirm({
      title: verb === "Publish" ? "Publish this story?" : "Update this story?",
      message: blog.feature?.enabled ? "It goes live now and is pinned at the top of the site as the featured story." : sendNotification ? "It goes live now and a push notification is sent to readers." : "It goes live right away.",
      tone: "primary", confirmLabel: t(verb),
    });
    if (!ok) return;
    setBusy(true);
    const id = toast.loading(mode === "edit" ? "Updating…" : "Publishing…");
    try {
      try { await post(false); }
      catch (e) {
        // another story is featured right now: ask before replacing it
        const conflict = e?.response?.status === 409 && e.response.data?.data?.code === "FEATURED_CONFLICT" ? e.response.data.data.current : null;
        if (!conflict) throw e;
        toast.dismiss(id);
        const replace = await confirm({
          title: "Replace the featured story?", tone: "warning", confirmLabel: "Replace it", cancelLabel: "Keep it",
          message: `“${conflict.title}” is the featured story right now. If you continue it is removed from the top and this story takes its place.`,
        });
        if (!replace) { setBusy(false); return; }
        toast.loading("Publishing…", { id });
        await post(true);
      }
      toast.success("Published successfully", { id });
      localStorage.removeItem("blog");
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["featured-current"] });
      navigate("/dashboard/news");
    } catch (e) { toast.error(errMsg(e, "Failed to publish"), { id }); } finally { setBusy(false); }
  };

  const schedule = async () => {
    if (!ready) return toast.error(`Missing: ${firstProblem?.text}`);
    if (!post_time?.date) return toast.error("Please select the schedule date");
    if (!post_time?.time) return toast.error("Please select the schedule time");
    const id = toast.loading(mode === "edit" ? "Updating scheduled news…" : "Scheduling…");
    try {
      const fd = buildForm(blog, { newsId: news_id }); fd.append("post_time", JSON.stringify(post_time));
      await httpClient.post(mode === "edit" ? "/update-scheduled-news" : "/create-scheduled-news", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`News ${mode === "edit" ? "updated" : "scheduled"} successfully`, { id });
      localStorage.removeItem("blog");
      navigate("/dashboard/schedule-news");
    } catch (e) { toast.error(errMsg(e, "Failed to schedule"), { id }); }
  };

  return (
    <div className="mx-auto w-full max-w-7xl pb-20  lg:pb-8">
      <div className="mb-3 sm:mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
        <ArrowLeft className="text-black size-4.5 md:size-5 lg:size-6" onClick={goBackToEditor} />
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold tracking-tight text-fg sm:text-xl">{t("Story details")}</h1>
          <p className="text-xs text-fg-subtle">Topic, keywords, URL section and publishing options.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] ">
        <div className="space-y-3 sm:space-y-5 w-full flex flex-col">
          <Card padded={false}>
            <CardHeader icon={Info} title="Summary" description="What readers see in lists and on social cards" info="The short text under the headline in lists, on the home page and when the story is shared." />
            <div className="space-y-4 p-2.5 sm:p-5">
              <Field label="Short description" required
                // hint={`${(description || "").length}/${CHAR_LIMIT}`}
                info="Two or three lines that sum the story up. Shown under the headline and used as the search description when you leave the SEO description empty."
              >
                <Textarea
                  rows={4}
                  maxLength={CHAR_LIMIT}
                  value={description || ""}
                  className="hindi-font" placeholder="Two or three lines that sum the story up"
                  onChange={(e) => update({
                    description: e.target.value.replace(/\n/g, " ")
                  })}
                />
              </Field>
              {/* <Field label={t("Reporter credit")} hint="Optional" info="The reporter / agency name printed as the byline, for example “Ravi Kumar” or “PTI”. Leave empty to show the author's own name.">
                <Input value={ref_reporter || ""} onChange={(e) => update({ ref_reporter: e.target.value })} placeholder="Name shown as the byline" className="hindi-font" />
              </Field> */}
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader
              title={`${t("Topic")} & ${t("Tags")}`}
              description="Topic = the subject page of the story. Keywords = what people type into search." info="Topic groups the story on a topic page (like “Elections”). Keywords are the words people search for - they help the story show up in search, in Hindi or English."
            />
            <div className="space-y-5 p-2.5 sm:p-5">
              <TagPicker
                required
                label={t("Topic")}
                max={TOPIC_LIMIT}
                value={(tags || []).map((x) => ({ title: x }))}
                onChange={(list) => update({ tags: list.map((x) => x.title) })}
              />
              <KeywordsField value={kw} onChange={(v) => update({ keywords: v })} onSuggest={can("tools.ai") ? onSuggest : undefined} suggesting={aiLoading} />
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader icon={MapPin} title="Category, place & URL" description="Where the story appears and how its link looks" info="Choose where the story belongs. The link of the story starts with ONE of these (the primary section), for example yoursite.com/politics/news/story-name." />
            <div className="space-y-5 p-2.5 sm:p-5">
              <TaxonomyFields value={{ category, subCategory, state, district }} onChange={(x) => update(x)} categoryRequired={false} />

              <div className="rounded-lg sm:rounded-2xl border border-line bg-surface-2/50 p-2 sm:p-4">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-fg"><Link2 className="size-4 text-fg-subtle" />Story link
                  <InfoTip>The first part of the link is the primary section. It is required: pick a category or a state above. If you choose several, mark the one the link should use - readers and Google will see this link.</InfoTip>
                </p>
                {routeOptions.length === 0 ? (
                  <p className="rounded-xl bg-warning-soft p-3 text-sm text-fg-muted">Choose a category or a state - the story link needs one of them.</p>
                ) : (
                  <>
                    {routeOptions.length > 1 && (
                      <div role="radiogroup" aria-label="Primary section of the link" className="mb-3 flex flex-wrap gap-2">
                        {routeOptions.map((o) => {
                          const on = primary?.id === o.id && primary?.kind === o.kind;
                          return (
                            <button key={o.kind + o.id} type="button" role="radio" aria-checked={on} onClick={() => update({ primaryRoute: { kind: o.kind, id: o.id } })}
                              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", on ? "border-fg bg-fg text-canvas" : "border-line bg-surface text-fg-muted hover:border-line-strong")}>
                              {on && <Check className="size-3" strokeWidth={3} />}{o.name}<span className={cn("text-[10px]", on ? "opacity-70" : "text-fg-faint")}>{o.kind === "state" ? "state" : "category"}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="break-all rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-xs text-fg-muted sm:text-sm">
                      {origin}/<b className="text-fg">{primary?.slug || "…"}</b>/news/<span className="text-fg-subtle">{blog.slug || "story-name"}</span>
                    </p>
                    {routeOptions.length > 1 && <p className="mt-2 text-xs text-fg-subtle">Primary section: <b className="text-fg">{primary?.name}</b>. Tap another one to change it.</p>}
                  </>
                )}
              </div>

              {/* <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3">
                <Switch checked={Boolean(is_literature)} onChange={(v) => update({ is_literature: v })} />
                <span className="text-sm"><b className="text-fg">Literature</b><span className="block text-fg-subtle">Shown in the literature section instead of the news feed.</span></span>
              </label> */}
              {/* {!is_literature && <Field label="Location" hint="Village / town as written on the story" info="The exact place the news happened, for example “chandauli”. Used for local search and the place line of the story."><Input value={location || ""} onChange={(e) => update({ location: e.target.value })} placeholder="e.g. chandauli" /></Field>} */}
            </div>
          </Card>

          <AdvancedPanel blog={blog} update={update} title={title} description={description} canFeature={can("news.feature")} currentFeatured={featuredNow} editingId={news_id} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Card padded={false} className="overflow-hidden">
            <div className="relative aspect-video w-full bg-surface-3">
              {banner ? <img src={banner} alt="" onError={handleImageError} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-fg-faint"><ImageIcon className="size-10" /></div>}
              {isVideo && <Badge tone="neutral" className="absolute left-3 top-3 bg-ink/80 text-paper"><Video className="size-3" />Video</Badge>}
            </div>
            <div className="space-y-1 p-4">
              <h2 className="hindi-font line-clamp-2 text-lg font-semibold  text-fg pt-1">{title || "—"}</h2>
              <p className="hindi-font line-clamp-3 text-sm text-fg-subtle">{description}</p>
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-fg">Before you publish</p>
            <ul className="space-y-2.5">{checks.map((c) => <Check_ key={c.text} ok={c.ok}>{c.text}</Check_>)}</ul>
          </Card>

          <Card>
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="text-sm"><span className="flex items-center gap-1 font-semibold text-fg">{t("Send push notification")}<InfoTip>Sends a notification to readers who allowed alerts, the moment the story goes live.</InfoTip></span><span className="block text-fg-subtle">Alert readers when it goes live</span></span>
              <Switch checked={Boolean(sendNotification)} onChange={(v) => update({ sendNotification: v })} />
            </label>
          </Card>

          <div className="fixed inset-x-0 -bottom-5 z-30 flex justify-between flex-wrap lg:grid lg:grid-cols-2 gap-2 border-t border-line bg-surface/95 p-3 backdrop-blur lg:static lg:z-auto lg:grid-cols-1 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {type !== "schedule_news" &&
              <Button
                size="lg"
                leftIcon={Send}
                loading={busy}
                onClick={submit}
                className="order-3 lg:order-1 lg:w-full max-sm:max-w-fit max-sm:px-5">{t(verb)}
              </Button>
            }
            {canDraft && <Button size="lg" variant="outline" leftIcon={FileClock} disabled={busy} onClick={saveDraft} className="order-2 lg:w-full">Save as draft</Button>}
            {((mode !== "edit" && type !== "guest-news") || (mode === "edit" && type === "schedule_news")) && (
              <Button size="lg" variant="outline" leftIcon={CalendarClock} onClick={() => setScheduleOpen(true)} className="hidden lg:inline-flex lg:order-3 lg:w-full">{mode === "edit" ? "Update schedule" : t("Schedule")}</Button>
            )}
            <Button size="lg" variant="ghost" leftIcon={Eye} onClick={() => setPreviewOpen(true)} className="order-1 px-3 lg:order-4 lg:w-full lg:border lg:border-line"><span className="sr-only lg:not-sr-only">{t("Full preview")}</span></Button>
          </div>
          {((mode !== "edit" && type !== "guest-news") || (mode === "edit" && type === "schedule_news")) && (
            <Button variant="outline" leftIcon={CalendarClock} onClick={() => setScheduleOpen(true)} className="w-full lg:hidden">{mode === "edit" ? "Update schedule" : t("Schedule")}</Button>
          )}
        </aside>
      </div>

      <NewsPreview open={previewOpen} onClose={() => setPreviewOpen(false)} news={previewNews} />
      <SchedulePopUp
        popupOpen={scheduleOpen} setPopUpOpen={setScheduleOpen} post_time={post_time} handleSchedule={schedule}
        handleDateChange={(val) => update({ post_time: { ...post_time, date: val } })}
        handleTimeChange={(i) => { setTimeIndex(i); update({ post_time: { ...post_time, time: timeOptions[i] } }); }}
        timeOptions={timeOptions} selectedTimeIndex={timeIndex}
      />
      <AITagsPopup isOpen={aiPopup} onClose={() => setAiPopup(false)} aiGeneratedTags={aiGeneratedTags || []} existingTags={[...kw.hi, ...kw.en]}
        onAddTags={onAddAI} onRegenerate={() => generateAI(true)} isRegenerating={aiLoading} onRemoveTags={onRemoveAI} />
    </div>
  );
};

export default PublishForm;
