import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Check, GripVertical, LayoutList, Pencil, Plus, RotateCcw, Save, Search, Trash2 } from "lucide-react";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import useTaxonomyNames from "../../hooks/useTaxonomyNames";
import { useApiMutation, useCategories, useDistricts, useHomeSections, useStates } from "../../hooks/admin";
import {
    Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, IconButton, Modal, PageHeader, StatusBadge,
} from "../../components/ui";

const MAX_FALLBACK = 9;
const KIND_LABEL = {
    // latest: "Latest news", 
    category: "Category",
    // state: "State", 
    // district: "District"
};
const KINDS = Object.keys(KIND_LABEL);

const byOrderThenName = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name));

/* ───────────────────────── searchable list (replaces the native dropdown) ───────────────────────── */
/** items: { key, value, label, depth?, hint?, disabled?, header? } — header rows are group titles, not selectable. */
function Picker({ items, value, onChange, placeholder }) {
    const [q, setQ] = useState("");
    const term = q.trim().toLowerCase();
    const rows = term ? items.filter((i) => !i.header && i.label.toLowerCase().includes(term)) : items;

    return (
        <div className="overflow-hidden rounded-xl border border-line">
            <div className="relative border-b border-line">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    className="h-10 w-full bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:outline-none"
                />
            </div>
            <ul role="listbox" className="max-h-64 overflow-auto py-1">
                {rows.map((i) => i.header ? (
                    <li key={i.key} role="presentation" className="px-3 pb-1 pt-2.5 text-xs font-semibold text-fg-subtle">{i.label}</li>
                ) : (
                    <li key={i.key} role="presentation">
                        <button
                            type="button"
                            role="option"
                            aria-selected={value === i.value}
                            disabled={i.disabled}
                            onClick={() => onChange(i.value)}
                            className={`flex w-full items-center justify-between gap-2 py-2 pr-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 ${!term && i.depth ? "pl-8" : "pl-3"} ${value === i.value ? "bg-primary-soft font-medium text-primary" : "text-fg hover:bg-surface-2"}`}
                        >
                            <span className="min-w-0 truncate">
                                {i.label}
                                {term && i.hint && <span className="ml-1.5 text-xs text-fg-subtle">in {i.hint}</span>}
                            </span>
                            {value === i.value ? <Check className="size-4 shrink-0" aria-hidden /> : i.disabled ? <Badge size="sm">Added</Badge> : null}
                        </button>
                    </li>
                ))}
                {!rows.length && <li className="px-3 py-6 text-center text-sm text-fg-subtle">Nothing found</li>}
            </ul>
        </div>
    );
}

/* ───────────────────────── add / edit dialog ───────────────────────── */
function SectionFormModal({ section, taken, onClose }) {
    const isEdit = Boolean(section?._id);
    const categories = useCategories().data || [];
    const states = useStates().data || [];
    const districts = useDistricts().data || [];

    const [kind, setKind] = useState(section?.kind || "category");
    const [ref, setRef] = useState(section?.ref || "");
    const [isActive, setIsActive] = useState(section?.isActive ?? true);

    const isTaken = (k, id) => id !== section?.ref && taken.has(`${k}:${id}`);

    // each parent category is followed by its own sub-categories
    const items = useMemo(() => {
        if (kind === "category") {
            const kids = new Map();
            categories.filter((c) => c.parent).forEach((c) => kids.set(String(c.parent), [...(kids.get(String(c.parent)) || []), c]));
            return categories.filter((c) => !c.parent).sort(byOrderThenName).flatMap((r) => [
                { key: r._id, value: r._id, label: r.name, depth: 0, disabled: isTaken("category", r._id) },
                ...(kids.get(String(r._id)) || []).sort(byOrderThenName).map((c) => (
                    { key: c._id, value: c._id, label: c.name, depth: 1, hint: r.name, disabled: isTaken("category", c._id) }
                )),
            ]);
        }
        if (kind === "state") {
            return states.map((s) => ({ key: s._id, value: s._id, label: s.displayName || s.state, disabled: isTaken("state", s._id) }));
        }
        if (kind === "district") {
            return states.flatMap((s) => {
                const list = districts.filter((d) => String(d.state?._id || d.state) === String(s._id));
                if (!list.length) return [];
                const name = s.displayName || s.state;
                return [
                    { key: `h-${s._id}`, header: true, label: name },
                    ...list.map((d) => ({ key: d._id, value: d._id, label: d.displayName || d.district, depth: 1, hint: name, disabled: isTaken("district", d._id) })),
                ];
            });
        }
        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kind, categories, states, districts, taken, section]);

    const needsRef = kind !== "latest";
    const latestTaken = kind === "latest" && taken.has("latest:null") && section?.kind !== "latest";
    const canSave = (!needsRef || ref) && !latestTaken;

    const save = useApiMutation(
        (body) => (isEdit
            ? httpClient.put(`/home-sections/${section._id}`, body)
            : httpClient.post("/home-sections", body)).then((r) => r.data),
        { invalidate: ["home-sections"], onSuccess: onClose },
    );

    const submit = () => save.mutate({ kind, ref: needsRef ? ref : null, isActive });

    return (
        <Modal open onClose={onClose} size="md" title={isEdit ? "Edit section" : "Add a section"}
            description="Pick what this section shows. A main category also shows the stories of its sub-categories."
            footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!canSave} loading={save.isPending}>{isEdit ? "Save changes" : "Add section"}</Button></>}>
            <div className="space-y-4">
                <div role="radiogroup" aria-label="Section type" className="grid grid-cols-2 gap-1.5 rounded-xl bg-surface-2 p-1 sm:grid-cols-4">
                    {KINDS.map((k) => (
                        <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={kind === k}
                            onClick={() => { setKind(k); setRef(""); }}
                            className={`rounded-lg px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${kind === k ? "bg-surface text-fg shadow-card" : "text-fg-muted hover:text-fg"}`}
                        >
                            {KIND_LABEL[k]}
                        </button>
                    ))}
                </div>

                {needsRef ? (
                    <Picker items={items} value={ref} onChange={setRef} placeholder={`Search ${kind}…`} />
                ) : (
                    <p className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg-muted">
                        Shows the newest stories from every category. Only one “Latest news” section can be on the home page.
                    </p>
                )}
                {latestTaken && <p className="text-xs text-danger">“Latest news” is already on the home page.</p>}

                <label className="flex items-center gap-2 text-sm text-fg">
                    <input type="checkbox" className="size-4 accent-[var(--color-primary,#2563eb)]" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    Show this section on the home page
                </label>
            </div>
        </Modal>
    );
}

/* ───────────────────────── one draggable row ───────────────────────── */
function SectionRow({ id, section: s, index, total, label, canEdit, onMove, onEdit, onDelete }) {
    const controls = useDragControls();

    const onHandleKey = (e) => {
        if (e.key === "ArrowUp") { e.preventDefault(); onMove(index, -1); }
        if (e.key === "ArrowDown") { e.preventDefault(); onMove(index, 1); }
    };

    return (
        <Reorder.Item
            as="li"
            value={id}
            dragListener={false}
            dragControls={controls}
            whileDrag={{ scale: 1.015, boxShadow: "0 10px 28px rgba(0,0,0,.16)", zIndex: 20 }}
            className="relative flex items-center gap-2 rounded-xl border border-line bg-surface p-2.5 sm:gap-3 sm:p-3"
        >
            {canEdit && (
                <button
                    type="button"
                    aria-label={`Move ${label}. Drag, or use arrow up and down`}
                    onPointerDown={(e) => controls.start(e)}
                    onKeyDown={onHandleKey}
                    className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-2 hover:text-fg active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <GripVertical className="size-5" aria-hidden />
                </button>
            )}

            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold tabular-nums text-fg-muted" aria-label={`Position ${index + 1} of ${total}`}>
                {index + 1}
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fg">{label}</p>
                <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
                    <Badge size="sm">{KIND_LABEL[s.kind]}</Badge>
                </p>
            </div>

            <StatusBadge status={s.isActive ? "active" : "inactive"} />

            {canEdit && (
                <div className="flex shrink-0 gap-0.5">
                    <IconButton size="icon-sm" label="Edit section" onClick={() => onEdit(s)}><Pencil className="size-4" /></IconButton>
                    <IconButton size="icon-sm" label="Remove section" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => onDelete(s)}><Trash2 className="size-4" /></IconButton>
                </div>
            )}
        </Reorder.Item>
    );
}

/* ───────────────────────── page ───────────────────────── */
export default function HomeSections() {
    const { can } = usePermission();
    const canEdit = can("homeSection.manage");   // adjust to your permission key
    const nameOf = useTaxonomyNames();
    const { data, isLoading, error, refetch } = useHomeSections();

    const [local, setLocal] = useState(null);     // unsaved order (array of ids) or null
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const sections = data?.sections || [];
    const max = data?.max || MAX_FALLBACK;
    const byId = useMemo(() => new Map(sections.map((s) => [s._id, s])), [sections]);
    const serverIds = useMemo(() => sections.map((s) => s._id), [sections]);

    // unsaved order, tolerant of sections added / removed meanwhile
    const ids = useMemo(() => {
        if (!local) return serverIds;
        const kept = local.filter((id) => byId.has(id));
        return [...kept, ...serverIds.filter((id) => !kept.includes(id))];
    }, [local, serverIds, byId]);

    const dirty = ids.join() !== serverIds.join();
    useEffect(() => { if (local && !dirty) setLocal(null); }, [local, dirty]);

    const taken = useMemo(() => new Set(sections.map((s) => `${s.kind}:${s.ref ?? null}`)), [sections]);
    const labelOf = (s) => s.title || (s.kind === "latest" ? "Latest news" : nameOf(s.ref) || "…");

    const move = (index, dir) => {
        const to = index + dir;
        if (to < 0 || to >= ids.length) return;
        const next = [...ids];
        [next[index], next[to]] = [next[to], next[index]];
        setLocal(next);
    };

    const saveOrder = useApiMutation(() => httpClient.put("/home-sections/reorder", { ids }).then((r) => r.data), { invalidate: ["home-sections"] });
    const del = useApiMutation(() => httpClient.delete(`/home-sections/${deleting._id}`).then((r) => r.data), { invalidate: ["home-sections"], onSuccess: () => setDeleting(null) });

    const full = sections.length >= max;

    return (
        <>
            <PageHeader
                title="Home page sections"
                description={`Choose which sections appear on the home page and drag them into the order readers see. Up to ${max} sections.`}
                actions={canEdit && (
                    <Button leftIcon={Plus} onClick={() => setEditing({})} disabled={full} title={full ? `Remove a section first (max ${max})` : undefined}>
                        Add section
                    </Button>
                )}
            />

            <Card padded={false}>
                <div className="flex items-center justify-between gap-3 border-b border-line p-3 sm:px-4">
                    <p className="text-sm text-fg-muted">
                        <span className="font-semibold tabular-nums text-fg">{sections.length}</span> of {max} sections used
                    </p>
                    {canEdit && sections.length > 1 && <p className="hidden text-xs text-fg-subtle sm:block">Drag the handle to reorder</p>}
                </div>

                {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? (
                    <div className="space-y-2 p-3 sm:p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />)}</div>
                ) : !sections.length ? (
                    <EmptyState icon={LayoutList} title="No sections yet" description="Add a category, state or district to start building the home page."
                        action={canEdit ? <Button leftIcon={Plus} onClick={() => setEditing({})}>Add section</Button> : undefined} />
                ) : (
                    <Reorder.Group as="ul" axis="y" values={ids} onReorder={setLocal} className="space-y-2 p-3 sm:p-4">
                        {ids.map((id, i) => {
                            const s = byId.get(id);
                            return (
                                <SectionRow key={id} id={id} section={s} index={i} total={ids.length} label={labelOf(s)} canEdit={canEdit}
                                    onMove={move} onEdit={setEditing} onDelete={setDeleting} />
                            );
                        })}
                    </Reorder.Group>
                )}

                {dirty && (
                    <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-[inherit] border-t border-line bg-surface p-3 sm:px-4">
                        <p className="text-sm text-fg-muted">Order changed. Save to update the home page.</p>
                        <div className="flex gap-2">
                            <Button variant="outline" leftIcon={RotateCcw} onClick={() => setLocal(null)} disabled={saveOrder.isPending}>Reset</Button>
                            <Button leftIcon={Save} onClick={() => saveOrder.mutate()} loading={saveOrder.isPending}>Save order</Button>
                        </div>
                    </div>
                )}
            </Card>

            {editing && <SectionFormModal section={editing._id ? editing : null} taken={taken} onClose={() => setEditing(null)} />}
            {deleting && (
                <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" loading={del.isPending}
                    title={`Remove “${labelOf(deleting)}”?`} confirmLabel="Remove"
                    message="This only removes the section from the home page. The stories and the category, state or district are not deleted."
                    onConfirm={() => del.mutate()} />
            )}
        </>
    );
}