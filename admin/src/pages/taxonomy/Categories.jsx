import { useMemo, useState } from "react";
import { ChevronRight, FolderTree, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, useCategories, useDistricts, useStates } from "../../hooks/admin";
import { Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, IconButton, Input, Modal, PageHeader, Select, StatusBadge, Switch, Tabs, Textarea } from "../../components/ui";

/** One modal for category / state / district. `kind` decides the fields and the endpoint. */
function TaxonomyForm({ kind, item, categories, states, onClose }) {
  const editing = Boolean(item?._id);
  const nameKey = kind === "state" ? "state" : kind === "district" ? "district" : "name";
  const [f, setF] = useState(() => ({
    [nameKey]: item?.[nameKey] || "", displayName: item?.displayName || "", slug: item?.slug || "", description: item?.description || "",
    parent: item?.parent || "", state: item?.state?._id || item?.state || "", order: item?.order ?? 0,
    showInMenu: item?.showInMenu ?? true, showOnHome: item?.showOnHome ?? false, isActive: item?.isActive ?? true,
  }));
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const path = kind === "category" ? "categories" : kind === "state" ? "states" : "districts";

  const save = useApiMutation(() => {
    const body = { [nameKey]: f[nameKey], isActive: f.isActive, ...(editing ? { slug: f.slug } : {}) };
    if (kind === "category") Object.assign(body, { description: f.description, parent: f.parent || null, order: Number(f.order) || 0, showInMenu: f.showInMenu, showOnHome: f.showOnHome });
    else Object.assign(body, { displayName: f.displayName, ...(kind === "district" ? { state: f.state } : {}) });
    return (editing ? httpClient.put(`/${path}/${item._id}`, body) : httpClient.post(`/${path}`, body)).then((r) => r.data);
  }, { invalidate: ["categories", "states", "districts"], onSuccess: onClose });

  const label = { category: "category", state: "state", district: "district" }[kind];
  const topLevel = categories.filter((c) => !c.parent && c._id !== item?._id);
  return (
    <Modal open onClose={onClose} title={`${editing ? "Edit" : "New"} ${label}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="tax-form" loading={save.isPending}>{editing ? "Save changes" : "Create"}</Button></>}>
      <form id="tax-form" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <Field label={kind === "category" ? "Name" : `${label[0].toUpperCase()}${label.slice(1)} name`} required hint={kind !== "category" ? "Lower-case English name, e.g. uttar pradesh" : "Shown in menus. Hindi or English."}>
          <Input value={f[nameKey]} onChange={(e) => set({ [nameKey]: e.target.value })} autoFocus data-autofocus />
        </Field>
        {kind !== "category" && <Field label="Display name" hint="Optional – e.g. उत्तर प्रदेश"><Input value={f.displayName} onChange={(e) => set({ displayName: e.target.value })} /></Field>}
        {editing && <Field label="URL slug"><Input value={f.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} /></Field>}
        {kind === "district" && <Field label="State" required><Select value={f.state} onChange={(e) => set({ state: e.target.value })} placeholder="Select state" required options={states.map((s) => ({ value: s._id, label: s.displayName || s.state }))} /></Field>}
        {kind === "category" && (
          <>
            <Field label="Parent category" hint="Leave empty for a top-level category (sub-categories go one level down)">
              <Select value={f.parent || ""} onChange={(e) => set({ parent: e.target.value })} options={[{ value: "", label: "— None (top level) —" }, ...topLevel.map((c) => ({ value: c._id, label: c.name }))]} />
            </Field>
            <Field label="Description"><Textarea rows={2} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Order"><Input type="number" value={f.order} onChange={(e) => set({ order: e.target.value })} /></Field>
              <div className="space-y-3 pt-1">
                <Switch checked={f.showInMenu} onChange={(v) => set({ showInMenu: v })} label="Show in menu" />
                <Switch checked={f.showOnHome} onChange={(v) => set({ showOnHome: v })} label="Home page section" description="Top-level categories only" />
              </div>
            </div>
          </>
        )}
        <Switch checked={f.isActive} onChange={(v) => set({ isActive: v })} label="Active" description="Inactive items can't be chosen for new news" />
      </form>
    </Modal>
  );
}

export default function Categories() {
  const { can } = usePermission();
  const [tab, setTab] = useState("categories");
  const [stateFilter, setStateFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const cats = useCategories(); const states = useStates(); const districts = useDistricts(stateFilter);
  const kind = tab === "categories" ? "category" : tab === "states" ? "state" : "district";
  const path = tab;
  const del = useApiMutation(() => httpClient.delete(`/${path}/${deleting._id}`).then((r) => r.data), { invalidate: ["categories", "states", "districts"], onSuccess: () => setDeleting(null) });

  const tree = useMemo(() => {
    const all = cats.data || [];
    const roots = all.filter((c) => !c.parent);
    return roots.flatMap((r) => [{ ...r, depth: 0 }, ...all.filter((c) => String(c.parent) === String(r._id)).map((c) => ({ ...c, depth: 1 }))]);
  }, [cats.data]);

  const actions = (kindKey) => (row) => (
    <div className="flex justify-end gap-1">
      {can(`${kindKey}.update`) && <IconButton size="icon-sm" label="Edit" onClick={() => setEditing(row)}><Pencil className="size-4" /></IconButton>}
      {can(`${kindKey}.delete`) && <IconButton size="icon-sm" label="Delete" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setDeleting(row)}><Trash2 className="size-4" /></IconButton>}
    </div>
  );

  const catCols = [
    { key: "name", header: "Name", primary: true, cell: (c) => (
      <div className="flex items-center gap-2" style={{ paddingLeft: c.depth * 20 }}>{c.depth > 0 && <ChevronRight className="size-3.5 text-fg-faint" />}<span className={c.depth ? "text-fg-muted" : "font-medium text-fg"}>{c.name}</span></div>) },
    { key: "slug", header: "Slug", cell: (c) => <span className="font-mono text-xs">{c.slug}</span> },
    { key: "flags", header: "Shown", hideOnMobile: true, cell: (c) => <div className="flex gap-1">{c.showInMenu && <Badge size="sm">Menu</Badge>}{c.showOnHome && <Badge size="sm" tone="primary">Home</Badge>}</div> },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.isActive ? "active" : "inactive"} /> },
    { key: "actions", header: "", align: "right", cell: actions("category") },
  ];
  const stateCols = [
    { key: "state", header: "State", primary: true, cell: (s) => <span className="font-medium capitalize text-fg">{s.displayName || s.state}</span> },
    { key: "slug", header: "Slug", cell: (s) => <span className="font-mono text-xs">{s.slug}</span> },
    { key: "districts", header: "Districts", cell: (s) => s.districts?.length ?? 0 },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.isActive ? "active" : "inactive"} /> },
    { key: "actions", header: "", align: "right", cell: actions("state") },
  ];
  const districtCols = [
    { key: "district", header: "District", primary: true, cell: (d) => <span className="font-medium capitalize text-fg">{d.displayName || d.district}</span> },
    { key: "state", header: "State", cell: (d) => <span className="capitalize">{d.state?.state || "—"}</span> },
    { key: "slug", header: "Slug", cell: (d) => <span className="font-mono text-xs">{d.slug}</span> },
    { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.isActive ? "active" : "inactive"} /> },
    { key: "actions", header: "", align: "right", cell: actions("district") },
  ];
  const current = { categories: [catCols, tree, cats], states: [stateCols, states.data, states], districts: [districtCols, districts.data, districts] }[tab];
  const [cols, rows, q] = current;

  return (
    <>
      <PageHeader title="Categories & locations" description="Categories, sub-categories, states and districts used to organise and filter news."
        actions={can(`${kind}.create`) && <Button leftIcon={Plus} onClick={() => setEditing({})}>New {kind}</Button>} />
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line px-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onChange={setTab} items={[
            { value: "categories", label: "Categories", icon: FolderTree, count: cats.data?.length },
            { value: "states", label: "States", icon: MapPin, count: states.data?.length },
            { value: "districts", label: "Districts", icon: MapPin, count: districts.data?.length },
          ]} className="border-b-0" />
          {tab === "districts" && <div className="w-full pb-3 sm:w-56 sm:pb-0"><Select size="sm" aria-label="Filter by state" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} options={[{ value: "", label: "All states" }, ...(states.data || []).map((s) => ({ value: s._id, label: s.displayName || s.state }))]} /></div>}
        </div>
        {q.error ? <ErrorState error={q.error} onRetry={q.refetch} /> : (
          <DataTable columns={cols} rows={rows} loading={q.isLoading} empty={<EmptyState icon={FolderTree} title={`No ${tab} yet`} />} />
        )}
      </Card>
      {editing && <TaxonomyForm kind={kind} item={editing._id ? editing : null} categories={cats.data || []} states={states.data || []} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" loading={del.isPending} onConfirm={() => del.mutate()} confirmLabel="Delete" title={`Delete “${deleting.name || deleting.displayName || deleting.state || deleting.district}”?`} message="Items used by news can't be deleted – mark them inactive instead." />}
    </>
  );
}
