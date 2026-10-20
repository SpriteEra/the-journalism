import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bell, Briefcase, CalendarDays, Camera, Check, Eye, FileText, Globe, KeyRound, Languages, Lock, Mail, MapPin, Monitor, Moon, Pencil, Palette, Phone, ShieldCheck, Sun, TrendingUp, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import httpClient from "../api/httpClient";
import { getUserSuccess } from "../redux/slices/user.slice";
import { LANGUAGES } from "../i18n";
import { useFetchProfile } from "../hooks/user";
import { useReporterPerformance } from "../hooks/admin";
import usePermission from "../hooks/usePermission";
import { useTheme } from "../utils/Theme";
import { errMsg, fmtDate } from "../lib/api";
import { cn } from "../lib/cn";
import { rangeFromDays } from "../components/analytics/RangePicker";
import { TrendChart } from "../components/charts/Charts";
import ProfileHeader from "../components/profile/ProfileHeader";
import UpdatePasswordUser from "../components/UpdatePasswordUser";
import NotificationSettings from "../components/NotificationSettings";
import { Avatar, Badge, Button, Card, CardHeader, ErrorState, Field, ImageCropper, Input, Modal, PageHeader, PremiumBadge, Skeleton, StatCard, Textarea } from "../components/ui";

const ABOUT_MIN = 20; const ABOUT_MAX = 800;
const SOCIALS = [["website", "Website"], ["x", "X (Twitter)"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["linkedin", "LinkedIn"]];
const THEMES = [["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "System", Monitor]];

function Row({ icon: Icon, label, value, children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-surface-2/70 p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-fg-muted ring-1 ring-line"><Icon className="size-5" /></span>
      <div className="min-w-0"><p className="text-xs font-medium text-fg-subtle">{label}</p>{children || <p className="hindi-font truncate text-sm font-semibold text-fg">{value || "—"}</p>}</div>
    </div>
  );
}

/** Edit my own public profile: photo (cropped), name, about, designation, location, phone, links. Role / email / username are not editable here. */
function ProfileEditor({ profile, onDone }) {
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const { user: me } = usePermission();
  const [f, setF] = useState({ fullName: profile.fullName || "", about: profile.about || "", designation: profile.designation || "", location: profile.location || "", phone: profile.phone || "", social: { ...profile.social } });
  const [photo, setPhoto] = useState({ blob: null, url: profile.profile || "" });
  const [cropSrc, setCropSrc] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const pick = (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return toast.error("Choose a JPG, PNG or WebP image");
    if (file.size > 10 * 1024 * 1024) return toast.error("Image is larger than 10 MB");
    setCropSrc(URL.createObjectURL(file));
  };

  const save = async (e) => {
    e.preventDefault();
    const err = {};
    if (f.fullName.trim().length < 2) err.fullName = "Enter your full name";
    if (f.about.trim().length < ABOUT_MIN) err.about = `Write at least ${ABOUT_MIN} characters about yourself`;
    if (!photo.url) err.photo = "A profile photo is required";
    setErrors(err);
    if (Object.keys(err).length) return toast.error(Object.values(err)[0]);
    const fd = new FormData();
    ["fullName", "about", "designation", "location", "phone"].forEach((k) => fd.append(k, f[k] ?? ""));
    fd.append("social", JSON.stringify(f.social || {}));
    if (photo.blob) fd.append("profile", photo.blob, "profile.jpg");
    setBusy(true);
    const t = toast.loading("Saving…");
    try {
      const { data } = await httpClient.put("/profile", fd);
      toast.success("Profile updated", { id: t });
      dispatch(getUserSuccess({ user: { ...me, fullName: data.profile.fullName, profile: data.profile.profile } }));     // top bar shows the new photo / name at once
      qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["user"] });
      onDone();
    } catch (er) { toast.error(errMsg(er, "Could not save your profile"), { id: t }); } finally { setBusy(false); }
  };

  return (
    <Card padded={false}>
      <CardHeader icon={Pencil} title="Edit profile" description="Shown on your public author page" actions={<Button variant="ghost" size="sm" leftIcon={X} onClick={onDone}>Cancel</Button>} />
      <form onSubmit={save} noValidate className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Choose profile photo" className={cn("group relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed bg-surface-2", errors.photo ? "border-danger" : "border-line-strong hover:border-fg")}>
            {photo.url ? <img src={photo.url} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-fg-faint"><Camera className="size-7" /></span>}
            <span className="absolute inset-0 grid place-items-center bg-ink/55 text-xs font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100">Change</span>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
          <div className="text-sm"><p className="font-medium text-fg">Profile photo <span className="text-danger">*</span></p><p className="text-fg-subtle">Crop and zoom after choosing.</p>{errors.photo && <p className="text-danger">{errors.photo}</p>}</div>
        </div>
        <Field label="Full name" required error={errors.fullName}><Input value={f.fullName} onChange={set("fullName")} maxLength={60} className="hindi-font" /></Field>
        <Field label="About" required error={errors.about} hint={`${f.about.trim().length}/${ABOUT_MAX}`} info="Shown on your author page and used as its search description."><Textarea rows={5} value={f.about} maxLength={ABOUT_MAX} onChange={set("about")} className="hindi-font" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Designation" hint="Optional"><Input icon={Briefcase} value={f.designation} onChange={set("designation")} maxLength={80} className="hindi-font" /></Field>
          <Field label="Location" hint="Optional"><Input icon={MapPin} value={f.location} onChange={set("location")} maxLength={80} className="hindi-font" /></Field>
          <Field label="Phone" hint="Optional"><Input icon={Phone} value={f.phone} onChange={set("phone")} inputMode="tel" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIALS.map(([k, label]) => <Field key={k} label={label} hint="Optional"><Input value={f.social?.[k] || ""} onChange={(e) => setF((s) => ({ ...s, social: { ...s.social, [k]: e.target.value } }))} placeholder="https://" inputMode="url" /></Field>)}
        </div>
        <div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="outline" onClick={onDone}>Cancel</Button><Button type="submit" loading={busy}>Save changes</Button></div>
      </form>
      <ImageCropper open={Boolean(cropSrc)} src={cropSrc} onClose={() => setCropSrc("")} onDone={(blob, url) => { setPhoto({ blob, url }); setErrors((x) => ({ ...x, photo: undefined })); setCropSrc(""); }} />
    </Card>
  );
}

/** The signed-in person's own page: identity, own numbers, language / theme, notifications and password. */
export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, can } = usePermission();
  const { data, isPending, isError, error, refetch } = useFetchProfile();
  const [pwd, setPwd] = useState(false);
  const [notif, setNotif] = useState(false);
  const [editing, setEditing] = useState(false);
  const range = useMemo(() => rangeFromDays(30), []);
  const myId = data?._id || user?.id || user?._id;
  const showStats = can("reporter.performance.own") || can("reporter.performance.all");
  const perf = useReporterPerformance(myId, range, Boolean(myId) && showStats);
  const r = perf.data;
  useEffect(() => { if (data && !data.about) setEditing(true); }, [data]);       // a profile without an "about" text is incomplete: open the editor

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  const social = Object.entries(data?.social || {}).filter(([, v]) => v);
  const missing = data && (!data.about || !data.profile || !data.fullName);

  return (
    <>
      <PageHeader title={t("My profile")} description="Your details, numbers and preferences" />

      <ProfileHeader className="mb-5" name={data?.fullName || data?.username} src={data?.profile}
        badges={user?.role && <Badge tone={user.role === "admin" ? "accent" : "primary"} className="capitalize">{user.role}</Badge>}
        subtitle={data?.designation ? `${data.designation}${data.location ? ` · ${data.location}` : ""}` : data?.location}
        about={data?.about}
        actions={<><PremiumBadge>Spriteera Newsroom</PremiumBadge>{!editing && <Button size="sm" variant="outline" leftIcon={Pencil} onClick={() => setEditing(true)}>Edit profile</Button>}</>}
        meta={isPending ? <Skeleton className="h-4 w-56" /> : <><span>@{data?.username}</span><span className="inline-flex items-center gap-1.5"><Mail className="size-4" />{data?.email}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{t("Joined")} {fmtDate(data?.createdAt)}</span></>} />

      {missing && !editing && <Card className="mb-5 border-warning/40 bg-warning-soft/50"><p className="text-sm text-fg-muted"><b className="text-fg">Complete your profile.</b> Add a photo, your full name and a short about text — they appear on your public author page.</p></Card>}

      {showStats && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={`${t("Stories published")} · 30d`} value={r?.summary.published ?? 0} icon={FileText} tone="success" loading={perf.isLoading} change={r?.comparison.publishedChangePercent} />
          <StatCard label={t("Total reads")} value={r?.summary.totalViews ?? 0} icon={Eye} tone="info" loading={perf.isLoading} change={r?.comparison.viewsChangePercent} />
          <StatCard label="Avg reads / story" value={r?.summary.avgViewsPerArticle ?? 0} icon={TrendingUp} tone="violet" loading={perf.isLoading} />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {editing && data ? <ProfileEditor profile={data} onDone={() => setEditing(false)} /> : (
            <Card padded={false}>
              <CardHeader icon={User} title="Account information" />
              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                <Row icon={User} label="Username" value={data?.username} />
                <Row icon={FileText} label="Full name" value={data?.fullName} />
                <Row icon={Mail} label={t("Email")} value={data?.email} />
                <Row icon={Briefcase} label="Designation" value={data?.designation} />
                <Row icon={MapPin} label="Location" value={data?.location} />
                <Row icon={Phone} label="Phone" value={data?.phone} />
                {social.length > 0 && <div className="sm:col-span-2"><Row icon={Globe} label="Links"><div className="mt-1 flex flex-wrap gap-1.5">{social.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noreferrer" className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-info hover:underline">{SOCIALS.find((s) => s[0] === k)?.[1] || k}</a>)}</div></Row></div>}
              </div>
            </Card>
          )}
          {showStats && (
            <Card padded={false}>
              <CardHeader title="Your last 30 days" description="Stories and reads per day" />
              <div className="p-4">{perf.isLoading ? <Skeleton className="h-56 w-full" /> : <TrendChart data={(r?.trends.daily || []).map((x) => ({ bucket: x.date, published: x.published, views: x.views }))} series={[{ key: "published", name: "Stories" }, { key: "views", name: "Reads" }]} height={240} />}</div>
            </Card>
          )}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card padded={false}>
            <CardHeader icon={ShieldCheck} title="Security & notifications" />
            <div className="space-y-2.5 p-4 sm:p-5">
              <Button variant="outline" leftIcon={KeyRound} className="w-full justify-start" onClick={() => setPwd(true)}>Change password</Button>
              <Button variant="outline" leftIcon={Bell} className="w-full justify-start" onClick={() => setNotif(true)}>Manage notifications</Button>
              <p className="inline-flex items-center gap-1.5 pt-1 text-xs text-fg-faint"><Lock className="size-3.5" />Sessions are protected with signed tokens.</p>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader icon={Palette} title="Appearance & language" description="Only the panel's own text changes — what you write stays as you write it." />
            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{t("Theme")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map(([id, label, Icon]) => (
                    <button key={id} type="button" aria-pressed={theme === id} onClick={() => setTheme(id)} className={cn("flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors", theme === id ? "border-fg bg-surface-2 text-fg" : "border-line text-fg-muted hover:bg-surface-2")}><Icon className="size-5" />{t(label)}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle"><Languages className="size-3.5" />{t("Language")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} type="button" aria-pressed={i18n.language === l.code} onClick={() => i18n.changeLanguage(l.code)} className={cn("flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-colors", i18n.language === l.code ? "border-fg bg-surface-2 text-fg" : "border-line text-fg-muted hover:bg-surface-2")}>{l.label}{i18n.language === l.code && <Check className="size-4" />}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={pwd} onClose={() => setPwd(false)} title="Change password" icon={KeyRound} size="sm"><UpdatePasswordUser onclose={() => setPwd(false)} /></Modal>
      <Modal open={notif} onClose={() => setNotif(false)} title="Notification settings" icon={Bell} size="lg"><NotificationSettings onclose={() => setNotif(false)} /></Modal>
    </>
  );
}
