import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { cn } from "../../lib/cn";
import { useApiMutation, useCategories, useDistricts, useStates } from "../../hooks/admin";
import { Alert, Button, Card, ErrorState, Field, Input, PageHeader, Select, Skeleton, Switch, Textarea } from "../../components/ui";

const LIST = "/dashboard/categories";                       // route of your Categories page
const TAB = { category: "categories", state: "states", district: "districts" };
const PATH = { category: "categories", state: "states", district: "districts" };
const cnt = (v, max, ideal) => `${(v || "").length}/${max} · best under ${ideal}`;

/** Image chooser: shows the stored image or the newly picked file */
function ImagePicker({ label, hint, current, file, onFile, onClear, ratio = "aspect-video" }) {
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : current || ""), [file, current]);
    const pick = (e) => {
        const x = e.target.files?.[0];
        e.target.value = "";
        if (!x) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(x.type)) return toast.error("Use a JPG, PNG or WEBP image");
        if (x.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
        onFile(x);
    };
    return (
        <Field label={label} hint={hint}>
            <div className="space-y-2">
                {preview && (
                    <div className="relative overflow-hidden rounded-xl border border-line">
                        <img src={preview} alt="" className={cn("w-full object-cover", ratio)} />
                        <button type="button" onClick={onClear} aria-label="Remove image" className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white"><X className="size-4" /></button>
                    </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-2">
                    <ImagePlus className="size-4" />{preview ? "Replace image" : "Choose image"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} />
                </label>
            </div>
        </Field>
    );
}

function SerpPreview({ title, path, description }) {
    return (
        <div className="rounded-xl border border-line bg-surface-2/50 p-3">
            <p className="text-[11px] text-fg-subtle">Search result preview</p>
            <p className="mt-1 truncate text-xs text-fg-subtle">{path}</p>
            <p className="truncate text-base font-medium text-primary">{title || "Page title"}</p>
            <p className="line-clamp-2 text-sm text-fg-muted">{description || "The meta description appears here."}</p>
        </div>
    );
}

function EditorForm({ kind, item, categories, states }) {
    const navigate = useNavigate();
    const [qs] = useSearchParams();
    const editing = Boolean(item?._id);
    const nameKey = kind === "state" ? "state" : kind === "district" ? "district" : "name";
    const label = kind[0].toUpperCase() + kind.slice(1);
    const s0 = item?.seo || {};

    const [f, setF] = useState(() => ({
        [nameKey]: item?.[nameKey] || "", displayName: item?.displayName || "", slug: item?.slug || "", description: item?.description || "",
        parent: item?.parent?._id || item?.parent || qs.get("parent") || "", state: item?.state?._id || item?.state || "", order: item?.order ?? 0,
        showInMenu: item?.showInMenu ?? true, showOnHome: item?.showOnHome ?? false, isActive: item?.isActive ?? true,
    }));
    const [seo, setSeo] = useState(() => ({
        metaTitle: s0.metaTitle || "", metaDescription: s0.metaDescription || "", metaKeywords: (s0.metaKeywords || []).join(", "),
        focusKeyword: s0.focusKeyword || "", canonicalUrl: s0.canonicalUrl || "", breadcrumbTitle: s0.breadcrumbTitle || "",
        ogTitle: s0.ogTitle || "", ogDescription: s0.ogDescription || "", ogImageAlt: s0.ogImageAlt || "", ogType: s0.ogType || "", ogImage: s0.ogImage || "",
        twitterCard: s0.twitterCard || "summary_large_image", twitterTitle: s0.twitterTitle || "", twitterDescription: s0.twitterDescription || "",
        twitterImageAlt: s0.twitterImageAlt || "", twitterCreator: s0.twitterCreator || "", twitterImage: s0.twitterImage || "",
    }));
    const [image, setImage] = useState(item?.image || "");
    const [files, setFiles] = useState({});
    const set = (p) => setF((s) => ({ ...s, ...p }));
    const setS = (p) => setSeo((s) => ({ ...s, ...p }));
    const setFile = (k, file) => setFiles((s) => ({ ...s, [k]: file }));

    const pid = (c) => String(c.parent?._id || c.parent || "");
    const hasKids = editing && kind === "category" && categories.some((c) => pid(c) === String(item._id));
    const topLevel = categories.filter((c) => !c.parent && c._id !== item?._id);

    const save = useApiMutation(() => {
        const fd = new FormData();
        const add = (k, v) => fd.append(k, v ?? "");
        add(nameKey, f[nameKey].trim()); add("slug", f.slug.trim()); add("description", f.description);
        add("order", Number(f.order) || 0); add("isActive", f.isActive);
        if (kind === "category") { add("parent", f.parent || "null"); add("showInMenu", f.showInMenu); add("showOnHome", f.showOnHome); }
        else add("displayName", f.displayName);
        if (kind === "district") add("state", f.state);

        // image: new file, or explicit clear
        if (files.image) fd.append("image", files.image);
        else if (editing && !image && item.image) add("image", "");

        // seo: images travel as files; "" inside seo clears a stored one
        const { ogImage, twitterImage, ...rest } = seo;
        const payload = { ...rest, metaKeywords: seo.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean) };
        for (const k of ["ogImage", "twitterImage"]) {
            if (files[k]) fd.append(k, files[k]);
            else if (!seo[k] && item?.seo?.[k]) payload[k] = "";
        }
        fd.append("seo", JSON.stringify(payload));

        return (editing ? httpClient.put(`/${PATH[kind]}/${item._id}`, fd) : httpClient.post(`/${PATH[kind]}`, fd)).then((r) => r.data);
    }, { invalidate: ["categories", "states", "districts"], onSuccess: () => navigate(LIST, { state: { tab: TAB[kind] } }) });

    const shownName = kind === "category" ? f.name : f.displayName || f[nameKey];

    return (
        <>
            <PageHeader
                title={`${editing ? "Edit" : "New"} ${kind}`}
                description={editing ? `Update the details and SEO of “${shownName}”.` : `Fill in the details and SEO for the new ${kind}.`}
                actions={<Button as={Link} to={LIST} state={{ tab: TAB[kind] }} variant="outline" leftIcon={ArrowLeft}>Back</Button>}
            />
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                <div className="space-y-4">
                    {/* ── basic ── */}
                    <Card className="space-y-4">
                        <h2 className="text-sm font-semibold text-fg">Basic details</h2>
                        <Field label={kind === "category" ? "Name" : `${label} name`} required hint={kind !== "category" ? "Lower-case English name, e.g. uttar pradesh" : "Shown in menus. Hindi or English."}>
                            <Input value={f[nameKey]} onChange={(e) => set({ [nameKey]: e.target.value })} required autoFocus />
                        </Field>
                        {kind !== "category" && <Field label="Display name" hint="Optional – e.g. उत्तर प्रदेश"><Input value={f.displayName} onChange={(e) => set({ displayName: e.target.value })} /></Field>}
                        <Field label="URL slug" hint={editing ? "Changing it changes the page URL" : "Leave empty to create it from the name"}>
                            <Input value={f.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} />
                        </Field>
                        {kind === "district" && (
                            <Field label="State" required><Select value={f.state} onChange={(e) => set({ state: e.target.value })} placeholder="Select state" required options={states.map((s) => ({ value: s._id, label: s.displayName || s.state }))} /></Field>
                        )}
                        {kind === "category" && (
                            <Field label="Parent category" hint={hasKids ? "This category has sub-categories, so it must stay top level" : "Leave empty for a top-level category"}>
                                <Select value={f.parent || ""} disabled={hasKids} onChange={(e) => set({ parent: e.target.value })} options={[{ value: "", label: "— None (top level) —" }, ...topLevel.map((c) => ({ value: c._id, label: c.name }))]} />
                            </Field>
                        )}
                        <Field label="Description" hint="Used on the page and as the fallback meta description"><Textarea rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
                    </Card>

                    {/* ── search ── */}
                    <Card className="space-y-4">
                        <h2 className="text-sm font-semibold text-fg">Search engine (SEO)</h2>
                        <SerpPreview title={seo.metaTitle || shownName} path={`/${kind}/${f.slug || "…"}`} description={seo.metaDescription || f.description} />
                        <Field label="Meta title" hint={cnt(seo.metaTitle, 120, 60)}><Input value={seo.metaTitle} maxLength={120} onChange={(e) => setS({ metaTitle: e.target.value })} /></Field>
                        <Field label="Meta description" hint={cnt(seo.metaDescription, 320, 160)}><Textarea rows={3} value={seo.metaDescription} maxLength={320} onChange={(e) => setS({ metaDescription: e.target.value })} /></Field>
                        <Field label="Meta keywords" hint="Comma separated, at most 20"><Input value={seo.metaKeywords} onChange={(e) => setS({ metaKeywords: e.target.value })} placeholder="politics, election, लोकसभा" /></Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Focus keyword"><Input value={seo.focusKeyword} maxLength={80} onChange={(e) => setS({ focusKeyword: e.target.value })} /></Field>
                            {/* <Field label="Breadcrumb title" hint="Empty = use the name"><Input value={seo.breadcrumbTitle} maxLength={80} onChange={(e) => setS({ breadcrumbTitle: e.target.value })} /></Field> */}
                        </div>
                        {/* <Field label="Canonical URL" hint="Only if this page's main version lives elsewhere"><Input type="url" value={seo.canonicalUrl} onChange={(e) => setS({ canonicalUrl: e.target.value })} placeholder="https://" /></Field> */}
                    </Card>

                    {/* ── open graph ── */}
                    <Card className="space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-fg">Open Graph</h2>
                            <p className="text-xs text-fg-subtle">How the link looks when shared on Facebook, WhatsApp or LinkedIn. Empty fields use the search values.</p>
                        </div>
                        <Field label="OG title" hint={cnt(seo.ogTitle, 120, 70)}><Input value={seo.ogTitle} maxLength={120} onChange={(e) => setS({ ogTitle: e.target.value })} /></Field>
                        <Field label="OG description" hint={cnt(seo.ogDescription, 320, 200)}><Textarea rows={2} value={seo.ogDescription} maxLength={320} onChange={(e) => setS({ ogDescription: e.target.value })} /></Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="OG type"><Select value={seo.ogType} onChange={(e) => setS({ ogType: e.target.value })} options={[{ value: "", label: "Auto" }, { value: "website", label: "Website" }, { value: "article", label: "Article" }]} /></Field>
                            <Field label="Image alt text"><Input value={seo.ogImageAlt} maxLength={200} onChange={(e) => setS({ ogImageAlt: e.target.value })} /></Field>
                        </div>
                        <ImagePicker label="OG image" hint="1200 × 630 px, JPG / PNG / WEBP, max 5 MB" current={seo.ogImage} file={files.ogImage}
                            onFile={(x) => setFile("ogImage", x)} onClear={() => { setFile("ogImage", undefined); setS({ ogImage: "" }); }} />
                    </Card>

                    {/* ── twitter ── */}
                    <Card className="space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-fg">Twitter / X</h2>
                            <p className="text-xs text-fg-subtle">Empty fields use the Open Graph values.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Card type"><Select value={seo.twitterCard} onChange={(e) => setS({ twitterCard: e.target.value })} options={[{ value: "summary_large_image", label: "Large image" }, { value: "summary", label: "Summary" }]} /></Field>
                            {/* <Field label="Creator handle" hint="e.g. @yourpage"><Input value={seo.twitterCreator} maxLength={16} onChange={(e) => setS({ twitterCreator: e.target.value })} /></Field> */}
                        </div>
                        <Field label="Twitter title" hint={cnt(seo.twitterTitle, 120, 70)}><Input value={seo.twitterTitle} maxLength={120} onChange={(e) => setS({ twitterTitle: e.target.value })} /></Field>
                        <Field label="Twitter description" hint={cnt(seo.twitterDescription, 320, 200)}><Textarea rows={2} value={seo.twitterDescription} maxLength={320} onChange={(e) => setS({ twitterDescription: e.target.value })} /></Field>
                        <Field label="Image alt text"><Input value={seo.twitterImageAlt} maxLength={200} onChange={(e) => setS({ twitterImageAlt: e.target.value })} /></Field>
                        <ImagePicker label="Twitter image" hint="JPG / PNG / WEBP, max 5 MB" current={seo.twitterImage} file={files.twitterImage}
                            onFile={(x) => setFile("twitterImage", x)} onClear={() => { setFile("twitterImage", undefined); setS({ twitterImage: "" }); }} />
                    </Card>
                </div>

                {/* ── sidebar ── */}
                <aside className="space-y-4 lg:sticky lg:top-4">
                    <Card className="space-y-4">
                        <h2 className="text-sm font-semibold text-fg">Settings</h2>
                        <Switch checked={f.isActive} onChange={(v) => set({ isActive: v })} label="Active" description="Inactive items can't be chosen for new news" />
                        <Field label="Order" hint="Lower numbers come first. Same number: A–Z"><Input type="number" value={f.order} onChange={(e) => set({ order: e.target.value })} /></Field>
                        {kind === "category" && (
                            <>
                                <Switch checked={f.showInMenu} onChange={(v) => set({ showInMenu: v })} label="Show in menu" />
                                <Switch checked={f.showOnHome} onChange={(v) => set({ showOnHome: v })} label="Home page section" description="Top-level categories only" />
                            </>
                        )}
                    </Card>
                    <Card>
                        <ImagePicker label={`${label} image`} hint="Also the fallback share image" current={image} file={files.image}
                            onFile={(x) => setFile("image", x)} onClear={() => { setFile("image", undefined); setImage(""); }} />
                    </Card>
                </aside>

                <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-line bg-canvas/90 p-3 backdrop-blur lg:col-span-2">
                    <Button as={Link} to={LIST} state={{ tab: TAB[kind] }} variant="outline">Cancel</Button>
                    <Button type="submit" loading={save.isPending}>{editing ? "Save changes" : `Create ${kind}`}</Button>
                </div>
            </form>
        </>
    );
}

export default function TaxonomyEditor() {
    const { kind, id } = useParams();
    const { can } = usePermission();
    const cats = useCategories(); const states = useStates(); const districts = useDistricts();
    const q = { category: cats, state: states, district: districts }[kind];

    if (!q) return <ErrorState error={new Error("Unknown page")} />;
    const editing = Boolean(id);
    if (!can(`${kind}.${editing ? "update" : "create"}`)) return <Alert tone="danger">You don't have permission to {editing ? "edit" : "create"} this.</Alert>;
    if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
    if (q.isLoading || cats.isLoading || states.isLoading) return <Skeleton className="h-96 w-full" />;
    const item = editing ? (q.data || []).find((x) => x._id === id) : null;
    if (editing && !item) return <ErrorState error={new Error(`This ${kind} was not found`)} />;

    return <EditorForm key={id || "new"} kind={kind} item={item} categories={cats.data || []} states={states.data || []} />;
}