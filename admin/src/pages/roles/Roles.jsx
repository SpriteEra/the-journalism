import { useMemo, useState } from "react";
import { KeyRound, Lock, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, usePermissionCatalog, useRoles } from "../../hooks/admin";
import httpClient from "../../api/httpClient";
import { Badge, Button, Card, Checkbox, ConfirmDialog, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, Skeleton, Switch, Textarea } from "../../components/ui";
import { cn } from "../../lib/cn";

const blank = { name: "", displayName: "", description: "", isActive: true, permissions: [] };

/** Grouped permission picker. Keys you do not hold yourself are locked (you cannot hand out more than you have). */
function PermissionPicker({ catalog, value, onChange, mine, isSuper, disabled }) {
  const set = new Set(value);
  const allowed = (k) => isSuper || mine.has(k);
  const toggle = (k) => { const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); onChange([...n]); };
  const toggleGroup = (items, on) => {
    const n = new Set(set);
    items.filter((i) => allowed(i.key)).forEach((i) => (on ? n.add(i.key) : n.delete(i.key)));
    onChange([...n]);
  };
  return (
    <div className="space-y-4">
      {catalog.map((g) => {
        const usable = g.items.filter((i) => allowed(i.key));
        const selected = g.items.filter((i) => set.has(i.key)).length;
        return (
          <fieldset key={g.group} className="rounded-xl border border-line">
            <legend className="sr-only">{g.group}</legend>
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-4 py-2.5">
              <p className="text-sm font-semibold text-fg">{g.group} <span className="ml-1 text-xs font-normal text-fg-subtle">{selected}/{g.items.length}</span></p>
              {!disabled && usable.length > 0 && (
                <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => toggleGroup(g.items, selected < usable.length)}>
                  {selected < usable.length ? "Select all" : "Clear"}
                </button>
              )}
            </div>
            <div className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              {g.items.map((i) => (
                <Checkbox key={i.key} checked={set.has(i.key)} onChange={() => toggle(i.key)} disabled={disabled || !allowed(i.key)} label={i.label}
                  description={!allowed(i.key) ? "You don't have this permission" : i.key} />
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function RoleForm({ role, onClose }) {
  const editing = Boolean(role?._id);
  const { isSuper } = usePermission();
  const { data: cat, isLoading } = usePermissionCatalog();
  const [form, setForm] = useState(() => (editing ? { ...role } : blank));
  const [error, setError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const mine = useMemo(() => new Set(cat?.mine || []), [cat]);

  const save = useApiMutation(
    () => (editing
      ? httpClient.put(`/roles/${role._id}`, { displayName: form.displayName, description: form.description, permissions: form.permissions, isActive: form.isActive }).then((r) => r.data)
      : httpClient.post("/roles", form).then((r) => r.data)),
    { invalidate: ["roles"], onSuccess: onClose }
  );
  const submit = (e) => {
    e.preventDefault();
    if (!editing && !/^[a-z][a-z0-9_-]{1,29}$/.test(form.name)) return setError("Role key: 2-30 chars, lowercase letters, digits, - or _, starting with a letter");
    if (!form.permissions.length) return setError("Select at least one permission");
    setError(""); save.mutate();
  };

  return (
    <Modal open onClose={onClose} size="xl" title={editing ? `Edit role · ${role.displayName || role.name}` : "Create role"}
      description="Roles decide what a team member can see and do. Permissions are checked on the server for every request."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="role-form" loading={save.isPending}>{editing ? "Save changes" : "Create role"}</Button></>}>
      <form id="role-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role key" required hint={editing ? "The key cannot be changed" : "Used internally, e.g. desk-editor"}>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value.toLowerCase().replace(/\s+/g, "-") })} disabled={editing} placeholder="desk-editor" />
          </Field>
          <Field label="Display name"><Input value={form.displayName} onChange={(e) => set({ displayName: e.target.value })} placeholder="Desk editor" maxLength={40} /></Field>
        </div>
        <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={200} /></Field>
        {editing && !role.isSystem && <Switch checked={form.isActive} onChange={(v) => set({ isActive: v })} label="Role is active" description="Disabled roles lock out everyone who has them" />}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {isLoading ? <Skeleton className="h-60 w-full" /> : (
          <PermissionPicker catalog={cat?.groups || []} value={form.permissions} onChange={(permissions) => set({ permissions })} mine={mine} isSuper={isSuper} />
        )}
      </form>
    </Modal>
  );
}

function DeleteRole({ role, roles, onClose }) {
  const [target, setTarget] = useState("");
  const del = useApiMutation(() => httpClient.delete(`/roles/${role._id}`, { params: target ? { reassignTo: target } : {} }).then((r) => r.data), { invalidate: ["roles", "users"], onSuccess: onClose });
  const others = roles.filter((r) => r._id !== role._id && r.isActive);
  return (
    <ConfirmDialog open onClose={onClose} onConfirm={() => del.mutate()} loading={del.isPending} tone="danger" confirmLabel="Delete role" title={`Delete “${role.displayName || role.name}”?`}
      message={role.users ? `${role.users} user(s) still have this role. Choose a role to move them to.` : "This role has no users."}>
      {role.users > 0 && (
        <div className="mt-4"><Field label="Move users to" required><Select value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Select a role" options={others.map((r) => ({ value: r.name, label: r.displayName || r.name }))} /></Field></div>
      )}
    </ConfirmDialog>
  );
}

export default function Roles() {
  const { can } = usePermission();
  const { data: roles = [], isLoading, error, refetch } = useRoles();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  return (
    <>
      <PageHeader title="Roles & permissions" description="Create roles for your newsroom and choose exactly what each one can do."
        actions={can("role.create") && <Button leftIcon={Plus} onClick={() => setEditing({})}>New role</Button>} />
      {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : !roles.length ? <Card><EmptyState icon={KeyRound} title="No roles yet" /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => (
            <Card key={r._id} className={cn("flex flex-col gap-4", !r.isActive && "opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{r.isSystem ? <Lock className="size-5" /> : <ShieldCheck className="size-5" />}</span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-fg">{r.displayName || r.name}</h3>
                    <p className="truncate font-mono text-xs text-fg-subtle">{r.name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {r.isSystem && <Badge tone="primary" size="sm">Built-in</Badge>}
                  {!r.isActive && <Badge tone="danger" size="sm">Disabled</Badge>}
                </div>
              </div>
              <p className="line-clamp-2 min-h-10 text-sm text-fg-subtle">{r.description || "No description"}</p>
              <div className="flex items-center gap-4 text-sm text-fg-muted">
                <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-fg-faint" />{r.users} user{r.users === 1 ? "" : "s"}</span>
                <span className="inline-flex items-center gap-1.5"><KeyRound className="size-4 text-fg-faint" />{r.name === "admin" ? "Full access" : `${r.permissionCount} permissions`}</span>
              </div>
              <div className="mt-auto flex gap-2 border-t border-line pt-3">
                {r.name === "admin" ? <p className="text-xs text-fg-subtle">The admin role always has full access and cannot be edited.</p> : (
                  <>
                    {can("role.update") && <Button size="sm" variant="outline" leftIcon={Pencil} onClick={() => setEditing(r)}>Edit</Button>}
                    {can("role.delete") && !r.isSystem && <Button size="sm" variant="danger-soft" leftIcon={Trash2} onClick={() => setDeleting(r)}>Delete</Button>}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <RoleForm role={editing._id ? editing : null} onClose={() => setEditing(null)} />}
      {deleting && <DeleteRole role={deleting} roles={roles} onClose={() => setDeleting(null)} />}
    </>
  );
}
