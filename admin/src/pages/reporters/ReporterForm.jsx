import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Briefcase, Camera, Globe, KeyRound, MapPin, Phone, ShieldCheck, Sparkles, UserRound, Wand2 } from "lucide-react";
import httpClient from "../../api/httpClient";
import { useRoles, useUserDetail } from "../../hooks/admin";
import usePermission from "../../hooks/usePermission";
import { errMsg } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Alert, Avatar, Badge, Button, Card, CardHeader, ErrorState, Field, ImageCropper, Input, PageHeader, Select, Skeleton, Textarea } from "../../components/ui";

const ABOUT_MIN = 20; const ABOUT_MAX = 800;
const SOCIALS = [["website", "Website"], ["x", "X (Twitter)"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["linkedin", "LinkedIn"]];
const EMPTY = { fullName: "", about: "", designation: "", location: "", phone: "", username: "", email: "", password: "", role: "reporter", social: {} };

const makePassword = () => {
  const c = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%";
  const a = new Uint32Array(12); crypto.getRandomValues(a);
  return [...a].map((n) => c[n % c.length]).join("");
};

/**
 * Add / edit a team member — a full page, not a popup.
 * Required: photo (cropped square), full name, about (they become the public author page and its SEO).
 * Everything else is optional. Route: /dashboard/reporters/new  and  /dashboard/reporters/:id/edit
 */
export default function ReporterForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = usePermission();
  const { data: roles = [] } = useRoles();
  const detail = useUserDetail(id);
  const [f, setF] = useState(EMPTY);
  const [photo, setPhoto] = useState({ blob: null, url: "" });
  const [cropSrc, setCropSrc] = useState("");
  const [generated, setGenerated] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    const u = detail.data?.user;
    if (editing && u) { setF({ ...EMPTY, ...u, social: { ...u.social }, password: "" }); setPhoto({ blob: null, url: u.profile || "" }); }
  }, [detail.data, editing]);

  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };
  const pick = (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return toast.error("Choose a JPG, PNG or WebP image");
    if (file.size > 10 * 1024 * 1024) return toast.error("Image is larger than 10 MB");
    setCropSrc(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!photo.url) e.photo = "A profile photo is required";
    if (f.fullName.trim().length < 2) e.fullName = "Enter the full name";
    if (f.about.trim().length < ABOUT_MIN) e.about = `Write at least ${ABOUT_MIN} characters about the person`;
    if (!editing) {
      if (f.username.trim().length < 3) e.username = "At least 3 characters";
      if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email";
      if (f.password.length < 5) e.password = "At least 5 characters";
    }
    setErrors(e);
    if (Object.keys(e).length) { toast.error(Object.values(e)[0]); document.querySelector("[data-invalid]")?.scrollIntoView({ behavior: "smooth", block: "center" }); }
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    ["fullName", "about", "designation", "location", "phone"].forEach((k) => fd.append(k, f[k] ?? ""));
    fd.append("social", JSON.stringify(f.social || {}));
    if (photo.blob) fd.append("profile", photo.blob, "profile.jpg");
    if (editing) { fd.append("userId", id); fd.append("email", f.email); if (can("user.assign.role") && f.role) fd.append("role", f.role); }
    else { ["username", "email", "password"].forEach((k) => fd.append(k, f[k].trim())); if (can("user.assign.role")) fd.append("role", f.role); }
    setBusy(true);
    const t = toast.loading(editing ? "Saving…" : "Creating…");
    try {
      await (editing ? httpClient.put("/update-reporter", fd) : httpClient.post("/add-reporter", fd));
      toast.success(editing ? "Saved" : "Team member created", { id: t });
      qc.invalidateQueries({ queryKey: ["users"] }); qc.invalidateQueries({ queryKey: ["user"] });
      navigate(editing ? `/dashboard/reporters/${id}` : "/dashboard/reporters");
    } catch (err) { toast.error(errMsg(err, "Could not save"), { id: t }); } finally { setBusy(false); }
  };

  const aboutLen = f.about.trim().length;
  const preview = useMemo(() => ({ title: `${f.fullName || "Full name"}${f.designation ? ` — ${f.designation}` : ""}`, desc: f.about.slice(0, 160) || "The about text becomes the description in search results." }), [f.fullName, f.designation, f.about]);
  const bad = (k) => (errors[k] ? { "data-invalid": true } : {});

  if (editing && detail.error) return <ErrorState error={detail.error} onRetry={detail.refetch} />;
  if (editing && detail.isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <PageHeader title={editing ? "Edit team member" : "Add team member"} description="The photo, name and about text become the public author page — and its SEO."
        breadcrumbs={[{ label: "Reporters", to: "/dashboard/reporters" }, { label: editing ? "Edit" : "New" }]} />
      <form onSubmit={submit} noValidate className="grid gap-5 pb-24 lg:grid-cols-[minmax(0,1fr)_21rem] lg:pb-6">
        <div className="space-y-5">
          <Card padded={false}>
            <CardHeader icon={UserRound} title="Profile" description="Required · shown on the author page" />
            <div className="space-y-5 p-4 sm:p-5">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center" {...bad("photo")}>
                <button type="button" onClick={() => fileRef.current?.click()} aria-label="Choose profile photo"
                  className={cn("group relative size-28 shrink-0 overflow-hidden rounded-full border-2 border-dashed bg-surface-2 transition-colors", errors.photo ? "border-danger" : "border-line-strong hover:border-fg")}>
                  {photo.url ? <img src={photo.url} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-fg-faint"><Camera className="size-8" /></span>}
                  <span className="absolute inset-0 grid place-items-center bg-ink/55 text-xs font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100">{photo.url ? "Change" : "Upload"}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} />
                <div className="text-sm"><p className="font-medium text-fg">Profile photo <span className="text-danger">*</span></p><p className="text-fg-subtle">JPG, PNG or WebP. You can crop and zoom it after choosing.</p>{errors.photo && <p className="mt-1 text-danger">{errors.photo}</p>}
                  <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" leftIcon={Camera} onClick={() => fileRef.current?.click()}>{photo.url ? "Change photo" : "Choose photo"}</Button></div></div>
              </div>
              <Field label="Full name" required error={errors.fullName} {...bad("fullName")}><Input value={f.fullName} onChange={set("fullName")} maxLength={60} className="hindi-font" placeholder="e.g. Ravi Kumar / रवि कुमार" /></Field>
              <Field label="About" required error={errors.about} hint={`${aboutLen}/${ABOUT_MAX}`} {...bad("about")}>
                <Textarea rows={5} value={f.about} maxLength={ABOUT_MAX} onChange={set("about")} className="hindi-font" placeholder="Beat, experience and areas covered — written for readers and search engines." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Designation" hint="Optional"><Input value={f.designation} onChange={set("designation")} maxLength={80} icon={Briefcase} placeholder="e.g. Bureau Chief" className="hindi-font" /></Field>
                <Field label="Location" hint="Optional"><Input value={f.location} onChange={set("location")} maxLength={80} icon={MapPin} placeholder="e.g. Sonbhadra, UP" className="hindi-font" /></Field>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader icon={KeyRound} title="Account" description={editing ? "Sign-in details" : "How this person signs in"} />
            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Username" required={!editing} error={errors.username} {...bad("username")}><Input value={f.username} onChange={set("username")} disabled={editing} maxLength={30} autoComplete="off" /></Field>
                <Field label="Email" required error={errors.email} {...bad("email")}><Input type="email" value={f.email} onChange={set("email")} autoComplete="off" /></Field>
              </div>
              {!editing && (
                <Field label="Password" required error={errors.password} hint="They can change it after signing in" {...bad("password")}>
                  <div className="flex gap-2">
                    <div className="flex-1"><Input type="password" value={f.password} onChange={(e) => { setGenerated(""); set("password")(e); }} autoComplete="new-password" /></div>
                    <Button type="button" variant="outline" leftIcon={Wand2} onClick={() => { const pw = makePassword(); setF((x) => ({ ...x, password: pw })); setGenerated(pw); }}>Generate</Button>
                  </div>
                  {generated && <p className="mt-2 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">Generated: <code className="font-mono font-semibold text-fg">{generated}</code>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(generated).then(() => toast.success("Copied"))} className="ml-auto text-xs font-medium text-primary hover:underline">Copy</button></p>}
                </Field>
              )}
              {can("user.assign.role") && (
                <Field label="Role" hint="Decides what they can do. Extra permissions can be given later from their profile."><Select value={f.role} onChange={set("role")} options={roles.filter((r) => r.active !== false).map((r) => ({ value: r.name, label: r.name }))} /></Field>
              )}
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader icon={Globe} title="More details" description="All optional" />
            <div className="space-y-4 p-4 sm:p-5">
              <Field label="Phone"><Input value={f.phone} onChange={set("phone")} icon={Phone} inputMode="tel" placeholder="+91 …" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                {SOCIALS.map(([k, label]) => <Field key={k} label={label}><Input value={f.social?.[k] || ""} onChange={(e) => setF((s) => ({ ...s, social: { ...s.social, [k]: e.target.value } }))} placeholder="https://" inputMode="url" /></Field>)}
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Card padded={false}>
            <CardHeader icon={Sparkles} title="Author page preview" />
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3"><Avatar name={f.fullName || "?"} src={photo.url} size="xl" /><div className="min-w-0"><p className="hindi-font truncate text-base font-semibold text-fg">{f.fullName || "Full name"}</p><p className="hindi-font truncate text-sm text-fg-subtle">{f.designation || "Designation"}</p>{f.location && <p className="truncate text-xs text-fg-faint">{f.location}</p>}</div></div>
              <p className="hindi-font line-clamp-5 text-sm text-fg-muted">{f.about || "About text appears here."}</p>
              <div className="rounded-xl border border-line bg-surface-2/50 p-3"><p className="text-[11px] text-fg-subtle">Search result</p><p className="hindi-font line-clamp-1 text-base text-info">{preview.title}</p><p className="hindi-font line-clamp-2 text-xs text-fg-muted">{preview.desc}</p></div>
              <div className="flex flex-wrap gap-1.5"><Badge tone={photo.url ? "success" : "warning"} size="sm">Photo</Badge><Badge tone={f.fullName.trim().length >= 2 ? "success" : "warning"} size="sm">Name</Badge><Badge tone={aboutLen >= ABOUT_MIN ? "success" : "warning"} size="sm">About</Badge></div>
            </div>
          </Card>
          {!editing && <Alert tone="info"><ShieldCheck className="mr-1 inline size-4" />New members start with the permissions of the chosen role.</Alert>}
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-surface/95 p-3 backdrop-blur lg:static lg:z-auto lg:flex-col lg:border-0 lg:bg-transparent lg:p-0">
            <Button as={Link} to={editing ? `/dashboard/reporters/${id}` : "/dashboard/reporters"} variant="outline" size="lg" className="flex-1 lg:w-full">Cancel</Button>
            <Button type="submit" size="lg" loading={busy} className="flex-[2] lg:w-full">{editing ? "Save changes" : "Create team member"}</Button>
          </div>
        </aside>
      </form>
      <ImageCropper open={Boolean(cropSrc)} src={cropSrc} onClose={() => setCropSrc("")} onDone={(blob, url) => { setPhoto({ blob, url }); setErrors((x) => ({ ...x, photo: undefined })); setCropSrc(""); }} />
    </>
  );
}
