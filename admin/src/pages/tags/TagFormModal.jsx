import { useState } from "react";
import httpClient from "../../api/httpClient";
import { useApiMutation } from "../../hooks/admin";
import {
    Button, ChipInput, Field, Input, Modal, Select, Switch, Textarea,
} from "../../components/ui";

const blank = { title: "", aliases: [], description: "", language: "hi", isActive: true, isFeatured: false, seo: { metaTitle: "", metaDescription: "" } };

/** Tooltip text for every field, kept in one place so wording is easy to review and change. */
const INFO = {
    title: "The name readers see on the topic page and next to stories, for example “Elections”. Keep it short and specific.",
    slug: "The web address of this topic's page. Changing it changes the link, so links shared earlier may stop working. Only edit it if you need to.",
    aliases: "Other names or spellings people may use, such as “bjp” and “भाजपा”. Searching for an alias finds this topic.",
    description: "A short introduction to the topic, shown on its page. Say what kind of stories belong here.",
    language: "The main language of the topic title. Used to group and show topics in the right language.",
    metaTitle: "The title shown in Google results and the browser tab. Leave empty to use the topic title. Up to 70 characters.",
    metaDescription: "The short summary shown under the title in Google results. Up to 160 characters.",
};

export default function TagFormModal({ tag, onClose, onSaved, initialTitle = "" }) {
    const editing = Boolean(tag?._id);
    const [form, setForm] = useState(() =>
        editing
            ? { ...blank, ...tag, aliases: tag.aliases || [], seo: { ...blank.seo, ...(tag.seo || {}) } }
            : { ...blank, title: initialTitle }   // prefill with what the user was typing
    );
    const [slug, setSlug] = useState(tag?.slug || "");
    const set = (p) => setForm((f) => ({ ...f, ...p }));
    const save = useApiMutation(() => {
        const body = { title: form.title, aliases: form.aliases, description: form.description, language: form.language, isActive: form.isActive, isFeatured: form.isFeatured, seo: { metaTitle: form.seo.metaTitle, metaDescription: form.seo.metaDescription } };
        return (editing ? httpClient.put(`/tags/${tag._id}`, { ...body, slug }) : httpClient.post("/tags", body))
            .then((r) => { onSaved?.(r.data); return r.data; });
    }, { invalidate: ["tags", "tag-suggest"], onSuccess: onClose });

    return (
        <Modal open onClose={onClose} size="lg" title={editing ? "Edit topic" : "New topic"}
            footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="tag-form" loading={save.isPending}>{editing ? "Save changes" : "Create Topic"}</Button></>}>
            <form id="tag-form" onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); save.mutate(); }} className="space-y-4">
                <Field label="Title" required info={INFO.title} hint="2–80 characters. Hindi or English."><Input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} autoFocus data-autofocus /></Field>
                {editing && <Field label="URL slug" info={INFO.slug} hint={`/tag/${slug}`}><Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} /></Field>}
                <Field label="Aliases" info={INFO.aliases} hint="Other spellings that should find this topic (max 15)."><ChipInput value={form.aliases} onChange={(a) => set({ aliases: a.map((x) => (typeof x === "string" ? x : x.title)) })} placeholder="bjp, भाजपा …" max={15} /></Field>
                <Field label="Description" info={INFO.description}><Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={500} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Language" info={INFO.language}><Select value={form.language} onChange={(e) => set({ language: e.target.value })} options={[{ value: "hi", label: "Hindi" }, { value: "en", label: "English" }, { value: "other", label: "Other" }]} /></Field>
                    <div className="space-y-3 pt-6">
                        <Switch checked={form.isActive} onChange={(v) => set({ isActive: v })} label="Active" description="Inactive topics can't be added to new news" />
                        <Switch checked={form.isFeatured} onChange={(v) => set({ isFeatured: v })} label="Featured" description="Shown first in popular topics" />
                    </div>
                </div>
                <details className="rounded-xl border border-line p-4">
                    <summary className="cursor-pointer text-sm font-medium text-fg">SEO (optional)</summary>
                    <div className="mt-4 space-y-4">
                        <Field label="Meta title" info={INFO.metaTitle}><Input value={form.seo.metaTitle || ""} onChange={(e) => set({ seo: { ...form.seo, metaTitle: e.target.value } })} maxLength={70} /></Field>
                        <Field label="Meta description" info={INFO.metaDescription}><Textarea rows={2} value={form.seo.metaDescription || ""} onChange={(e) => set({ seo: { ...form.seo, metaDescription: e.target.value } })} maxLength={160} /></Field>
                    </div>
                </details>
            </form>
        </Modal>
    );
}