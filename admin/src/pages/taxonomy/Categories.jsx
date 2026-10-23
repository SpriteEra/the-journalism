import { useId, useMemo, useState } from "react";
import { ChevronRight, ChevronsDown, ChevronsDownUp, ChevronsUpDown, Folder, FolderOpen, FolderTree, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import RowMenu from "../../components/common/RowMenu";
import { useApiMutation, useCategories, useDistricts, useStates } from "../../hooks/admin";
import { Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, IconButton, Input, Modal, PageHeader, Select, StatusBadge, Switch, Tabs, Textarea } from "../../components/ui";

/** One modal for category / state / district. `kind` decides the fields and the endpoint. */
function TaxonomyForm({ kind, item, categories, states, onClose }) {
  const editing = Boolean(item?._id);
  const nameKey = kind === "state" ? "state" : kind === "district" ? "district" : "name";
  const [f, setF] = useState(() => ({
    [nameKey]: item?.[nameKey] || "", displayName: item?.displayName || "", slug: item?.slug || "", description: item?.description || "",
    parent: item?.parent?._id || item?.parent || "", state: item?.state?._id || item?.state || "", order: item?.order ?? 0,
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

const CSS = `
.cat-tree { --cat-accent: #4f46e5; }
.cat-grid { display: grid; align-items: center; column-gap: 10px; grid-template-columns: minmax(0, 1fr) auto auto; }
.cat-slug, .cat-shown { display: none; }
@media (min-width: 768px) {
  .cat-grid { column-gap: 16px; grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.3fr) minmax(0, 1.3fr) 110px 112px; }
  .cat-slug, .cat-shown { display: block; }
}
.cat-head { position: sticky; top: 0; z-index: 10; display: none; }
@media (min-width: 768px) { .cat-head { display: grid; } }
.cat-parent { transition: background-color 250ms ease; }
.cat-parent:hover { background: rgba(128, 128, 128, 0.06); }
.cat-parent[data-open="true"] { background: color-mix(in srgb, var(--cat-accent) 5%, transparent); }
.cat-parent .cat-name { transition: color 250ms ease; }
.cat-parent[data-open="true"] .cat-name, .cat-parent[data-open="true"] .cat-ico { color: var(--cat-accent); }
.cat-chev { transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1), color 250ms ease; }
.cat-parent[data-open="true"] .cat-chev { transform: rotate(90deg); }
.cat-count { font-size: 11px; line-height: 1; padding: 3px 8px; border-radius: 999px; background: rgba(128, 128, 128, 0.15); transition: background-color 250ms ease, color 250ms ease; }
.cat-parent[data-open="true"] .cat-count { background: color-mix(in srgb, var(--cat-accent) 15%, transparent); color: var(--cat-accent); }

/* Height animation without measuring: 0fr -> 1fr */
.cat-collapse { display: grid; grid-template-rows: 0fr; visibility: hidden; opacity: 0;
  transition: grid-template-rows 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease, visibility 0s linear 380ms; }
.cat-collapse[data-open="true"] { grid-template-rows: 1fr; visibility: visible; opacity: 1; transition-delay: 0s; }
.cat-inner { min-height: 0; overflow: hidden; background: color-mix(in srgb, var(--cat-accent) 6%, transparent); box-shadow: inset 3px 0 0 var(--cat-accent); }
.cat-child { padding-left: 28px; }
.cat-collapse[data-open="true"] .cat-child { animation: cat-in 360ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.cat-elbow { width: 14px; height: 14px; margin-top: -10px; flex-shrink: 0; border-left: 2px solid var(--cat-accent); border-bottom: 2px solid var(--cat-accent); border-bottom-left-radius: 8px; opacity: 0.45; }
@keyframes cat-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .cat-collapse, .cat-chev, .cat-parent, .cat-count { transition: none; }
  .cat-collapse[data-open="true"] .cat-child { animation: none; }
}
`;

/** Phones hide the Slug / Shown columns, so show them as a small line under the name. */
function MobileMeta({ c }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-fg-subtle md:hidden">
      <span className="font-mono">{c.slug}</span>
      {c.showInMenu && <Badge size="sm">Menu</Badge>}
      {c.showOnHome && <Badge size="sm" tone="primary">Home</Badge>}
    </div>
  );
}

/** Collapsible category tree. Custom layout (not DataTable) so the open/close can animate smoothly. */
function CategoryTree({ groups, expanded, toggle, loading, actions }) {
  if (loading) {
    return <div
      className="space-y-px">
      {[0, 1, 2].map((i) =>
        <div key={i} className="h-14 animate-pulse border-b border-line" style={{ background: "rgba(128,128,128,0.06)" }} />)}
    </div>;
  }
  if (!groups.length) return <EmptyState icon={FolderTree} title="No categories yet" />;

  return (
    <div className="cat-tree">
      <style>{CSS}</style>
      <div className="cat-grid cat-head bg-surface-2 border-b border-line px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
        <div>Name</div><div className="cat-slug">Slug</div><div className="cat-shown">Shown</div><div>Status</div><div />
      </div>
      {groups.map(({ root, kids }) => {
        const open = expanded.has(root._id);
        const has = kids.length > 0;
        return (
          <div key={root._id}>
            <div className={`cat-grid cat-parent border-b border-line px-2 py-2.5 sm:py-3 md:px-4 ${has ? "cursor-pointer" : ""}`} data-open={open} onClick={() => has && toggle(root._id)}>
              <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                {has ? (
                  <button type="button" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${root.name}`}
                    onClick={(e) => { e.stopPropagation(); toggle(root._id); }}
                    className="cat-ico grid size-7 shrink-0 md:size-6 place-items-center rounded-md text-fg-muted hover:bg-line/60 focus-visible:outline focus-visible:outline-2">
                    <ChevronRight className="cat-chev size-3.5 sm:size-4" />
                  </button>
                ) : <span className="size-7 shrink-0 md:size-6" />}
                {open ? <FolderOpen className="cat-ico size-4 shrink-0" /> : <Folder className="cat-ico size-3.5 sm:size-4 shrink-0 text-fg-muted" />}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="cat-name truncate font-semibold max-sm:text-sm text-fg">{root.name}</span>
                    {has && <span className="cat-count shrink-0 font-medium max-sm:text-[9px]! text-fg-muted">{kids.length} sub</span>}
                  </div>
                  {/* <MobileMeta c={root} /> */}
                </div>
              </div>
              <div className="cat-slug"><span className="font-mono text-xs">{root.slug}</span></div>
              <div className="cat-shown flex gap-1">{root.showInMenu && <Badge size="sm">Menu</Badge>}{root.showOnHome && <Badge size="sm" tone="primary">Home</Badge>}</div>
              <div><StatusBadge status={root.isActive ? "active" : "inactive"} /></div>
              <div onClick={(e) => e.stopPropagation()}>{actions({ ...root, depth: 0 })}</div>
            </div>

            {has && (
              <div className="cat-collapse" data-open={open} aria-hidden={!open}>
                <div className="cat-inner">
                  {kids.map((c, i) => (
                    <div key={c._id} className="cat-grid cat-child border-b border-line max-sm:pl-5 px-3 py-2.5 md:px-4" style={{ animationDelay: `${i * 55}ms` }}>
                      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                        <span aria-hidden className="cat-elbow" />
                        <div className="min-w-0">
                          <span className="block truncate text-fg max-sm:text-xs">{c.name}</span>
                          <MobileMeta c={c} />
                        </div>
                      </div>
                      <div className="cat-slug"><span className="font-mono text-xs">{c.slug}</span></div>
                      <div className="cat-shown flex gap-1">{c.showInMenu && <Badge size="sm">Menu</Badge>}{c.showOnHome && <Badge size="sm" tone="primary">Home</Badge>}</div>
                      <div><StatusBadge status={c.isActive ? "active" : "inactive"} /></div>
                      <div>{actions({ ...c, depth: 1 })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────── mobile cards for States / Districts (below sm) ───────── */

const cardBtn = "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg-muted transition-colors active:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

/**
 * Collapsed : initial tile + name + subtitle + status
 * Open      : stat tiles + full-width action buttons
 * Footer strip toggles it ("View details" + double chevron).
 */
function TaxonomyCard({ title, subtitle, active, stats, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const toggle = () => setOpen((o) => !o);
  const initial = (title || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
      {/* <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${active ? "bg-primary" : "bg-line"}`} /> */}

      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id}
        className="flex w-full items-center gap-3 py-3 pl-4 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        {/* <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-lg font-semibold ${active ? "bg-primary/10 text-primary" : "bg-surface-3 text-fg-faint"}`}>{initial}</span> */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold capitalize text-fg">{title}</p>
          {subtitle && <p className="mt-0.5 flex items-center gap-1 truncate text-xs capitalize text-fg-subtle"><MapPin className="size-3 shrink-0" aria-hidden />{subtitle}</p>}
        </div>
        <StatusBadge status={active ? "active" : "inactive"} />
      </button>

      <div id={id} className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={open ? undefined : ""}>
          <div className="space-y-3 border-t border-line p-3 pl-4">
            <dl className="grid grid-cols-2 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="min-w-0 rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-[11px] text-fg-subtle">{s.label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium text-fg">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-2">{children}</div>
          </div>
        </div>
      </div>

      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id}
        className="flex w-full items-center justify-center gap-1 border-t border-line bg-surface-2 py-1.5 pl-1 text-xs italic text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        {open ? "Hide details" : "View details"}
        <ChevronsDown className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
    </div>
  );
}

export default function Categories() {
  const { can } = usePermission();
  const [tab, setTab] = useState("categories");
  const [stateFilter, setStateFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set()); // ids of expanded parent categories
  const cats = useCategories(); const states = useStates(); const districts = useDistricts(stateFilter);
  const kind =
    tab === "categories"
      ? "category" : tab === "states"
        ? "state" : "district";
  const path = tab;
  const del = useApiMutation(() => httpClient.delete(`/${path}/${deleting._id}`).then((r) => r.data), { invalidate: ["categories", "states", "districts"], onSuccess: () => setDeleting(null) });

  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  /** Every top-level category with its sub-categories (always built; the tree decides what is visible). */
  const groups = useMemo(() => {
    const all = cats.data || [];
    const pid = (c) => String(c.parent?._id || c.parent || "");
    return all.filter((c) => !c.parent).map((r) => ({ root: r, kids: all.filter((c) => pid(c) === String(r._id)) }));
  }, [cats.data]);
  const parentIds = useMemo(() => groups.filter((g) => g.kids.length).map((g) => g.root._id), [groups]);

  const allOpen = parentIds.length > 0 && parentIds.every((id) => expanded.has(id));
  const toggleAll = () => setExpanded(allOpen ? new Set() : new Set(parentIds));

  const actions = (kindKey) => (row) => {
    const canAdd = kindKey === "category" && row.depth === 0 && can("category.create");
    const canEdit = can(`${kindKey}.update`);
    const canDelete = can(`${kindKey}.delete`);
    const items = [
      canAdd && { label: "Add sub-category", icon: Plus, onClick: () => setEditing({ parent: row._id }) },
      canEdit && { label: "Edit", icon: Pencil, onClick: () => setEditing(row) },
      canDelete && { label: "Delete", icon: Trash2, danger: true, onClick: () => setDeleting(row) },
    ].filter(Boolean);
    if (!items.length) return null;
    return (
      <>
        {/* md and up: icon buttons */}
        <div className="hidden justify-end gap-1 md:flex">
          {canAdd && <IconButton size="icon-sm" label="Add sub-category" onClick={() => setEditing({ parent: row._id })}><Plus className="size-4" /></IconButton>}
          {canEdit && <IconButton size="icon-sm" label="Edit" onClick={() => setEditing(row)}><Pencil className="size-4" /></IconButton>}
          {canDelete && <IconButton size="icon-sm" label="Delete" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setDeleting(row)}><Trash2 className="size-4" /></IconButton>}
        </div>
        {/* below md: one three-dot menu */}
        <div className="flex justify-end md:hidden"><RowMenu items={items} /></div>
      </>
    );
  };

  /** Full-width Edit / Delete buttons for the mobile cards (independent of the md breakpoint above). */
  const cardActions = (kindKey, row, extra) => (
    <>
      {extra}
      {can(`${kindKey}.update`) && <button type="button" className={cardBtn} onClick={() => setEditing(row)}><Pencil className="size-4" />Edit</button>}
      {can(`${kindKey}.delete`) && <button type="button" className={`${cardBtn} text-danger`} onClick={() => setDeleting(row)}><Trash2 className="size-4" />Delete</button>}
    </>
  );

  const stateCols = [
    { key: "state", header: "State", primary: true, cell: (s) => <span className="font-medium capitalize text-fg">{s.displayName || s.state}</span> },
    { key: "slug", header: "Slug", cell: (s) => <span className="font-mono text-xs">{s.slug}</span> },
    // { key: "districts", header: "Districts", cell: (s) => s.districts?.length ?? 0 },
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

  const stateCard = (s) => (
    <TaxonomyCard
      title={s.displayName || s.state}
      subtitle={`${s.districts?.length ?? 0} districts`}
      active={s.isActive}
      stats={[{ label: "Slug", value: <span className="font-mono text-xs">{s.slug}</span> }]}
    >
      {cardActions("state", s)}
    </TaxonomyCard>
  );

  const districtCard = (d) => (
    <TaxonomyCard
      title={d.displayName || d.district}
      subtitle={d.state?.state}
      active={d.isActive}
      stats={[{ label: "Slug", value: <span className="font-mono text-xs">{d.slug}</span> }, { label: "State", value: <span className="capitalize">{d.state?.state || "—"}</span> }]}
    >
      {cardActions("district", d)}
    </TaxonomyCard>
  );

  const current = {
    categories: [null, null, cats],
    states: [stateCols, states.data, states, stateCard],
    districts: [districtCols, districts.data, districts, districtCard],
  }[tab];
  const [cols, rows, q, card] = current;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <PageHeader
        title="Categories & locations"
        description="Categories, sub-categories, states and districts used to organise and filter news."
        actions={can(`${kind}.create`)
          && <Button
            leftIcon={Plus}
            onClick={() => setEditing({})}
          >New {kind}
          </Button>}
      />
      <Card
        padded={false}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-line px-3 sm:px-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 overflow-x-auto">
            <Tabs value={tab} onChange={setTab} items={[
              { value: "categories", label: "Categories", icon: FolderTree, count: cats.data?.length },
              { value: "states", label: "States", icon: MapPin, count: states.data?.length },
              // { value: "districts", label: "Districts", icon: MapPin, count: districts.data?.length },
            ]} className="border-b-0" />
          </div>
          {tab === "categories" && parentIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 pb-2 sm:pb-3 sm:pb-0">
              <span className="text-xs text-fg-subtle sm:hidden">{cats.data?.length ?? 0} categories</span>
              <Button size="sm" variant="outline" leftIcon={allOpen ? ChevronsDownUp : ChevronsUpDown} onClick={toggleAll}>{allOpen ? "Collapse all" : "Expand all"}</Button>
            </div>
          )}
          {tab === "districts" && <div className="w-full pb-3 sm:w-56 sm:pb-0">
            <Select size="sm" aria-label="Filter by state" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} options={[{ value: "", label: "All states" }, ...(states.data || []).map((s) => ({ value: s._id, label: s.displayName || s.state }))]}
            />
          </div>
          }
        </div>
        {q.error ?
          <ErrorState error={q.error} onRetry={q.refetch} /> : tab === "categories" ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <CategoryTree groups={groups} expanded={expanded} toggle={toggle} loading={cats.isLoading} actions={actions("category")} />
            </div>
          ) : (
            <DataTable contained breakpoint="sm" columns={cols} rows={rows} loading={q.isLoading} mobileCard={card} empty={<EmptyState icon={FolderTree} title={`No ${tab} yet`} />} />
          )}
      </Card>
      {editing && <TaxonomyForm kind={kind} item={editing} categories={cats.data || []} states={states.data || []} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDialog open onClose={() => setDeleting(null)} tone="danger" loading={del.isPending} onConfirm={() => del.mutate()} confirmLabel="Delete" title={`Delete “${deleting.name || deleting.displayName || deleting.state || deleting.district}”?`} message="Items used by news can't be deleted – mark them inactive instead." />}
    </div>
  );
}