import { addDays, istDay, istEndOfDay } from "../../lib/time";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ban, IdCard, KeyRound, ListChecks, MoreHorizontal, Pencil, ShieldCheck, Trash2, Unlock, UserPlus, Users } from "lucide-react";
import httpClient from "../../api/httpClient";
import usePermission from "../../hooks/usePermission";
import { useApiMutation, usePermissionCatalog, useRoles, useUserDetail, useUsers } from "../../hooks/admin";
import { fmtDate } from "../../lib/api";
import {
  Alert, Avatar, Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, Field, IconButton, Input, Menu, MenuItem, MenuSeparator, Modal,
  PageHeader, Pagination, SearchInput, Select, Skeleton, StatusBadge, Switch,
} from "../../components/ui";
import PasswordResetReporter from "./PasswordResetReporter";
import RowMenu from "../../components/common/RowMenu";

const roleOptions = (roles = []) => roles.filter((r) => r.isActive).map((r) => ({ value: r.name, label: r.displayName || r.name }));

/* ───────────── create / edit ───────────── */
function UserForm({ user, roles, onClose }) {
  const { can } = usePermission();
  const editing = Boolean(user?._id);
  const [f, setF] = useState(() => ({ username: "", email: "", fullName: "", password: "", role: "reporter", ...(editing ? { ...user, password: "" } : {}) }));
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const save = useApiMutation(() => (editing
    ? httpClient.put("/update-reporter", { userId: user._id, email: f.email, fullName: f.fullName, ...(can("user.assign.role") ? { role: f.role } : {}) }).then((r) => r.data)
    : httpClient.post("/add-reporter", { username: f.username, email: f.email, fullName: f.fullName, password: f.password, ...(can("user.assign.role") ? { role: f.role } : {}) }).then((r) => r.data)),
    { invalidate: ["users"], onSuccess: onClose });
  return (
    <Modal open onClose={onClose} title={editing ? `Edit ${user.username}` : "Add team member"}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="user-form" loading={save.isPending}>{editing ? "Save changes" : "Create account"}</Button></>}>
      <form id="user-form" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username" required><Input value={f.username} onChange={(e) => set({ username: e.target.value })} disabled={editing} required autoFocus data-autofocus /></Field>
          <Field label="Full name"><Input value={f.fullName || ""} onChange={(e) => set({ fullName: e.target.value })} /></Field>
        </div>
        <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} required /></Field>
        {!editing && <Field label="Password" required hint="At least 5 characters"><Input type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} required minLength={5} autoComplete="new-password" /></Field>}
        {can("user.assign.role") && <Field label="Role" hint="Decides what this person can do"><Select value={f.role} onChange={(e) => set({ role: e.target.value })} options={roleOptions(roles)} /></Field>}
      </form>
    </Modal>
  );
}

/* ───────────── block / unblock ───────────── */
export function BlockDialog({ user, onClose }) {
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const block = useApiMutation(() => httpClient.patch("/block-unblock", { userId: user._id, action: "block", reason, ...(until ? { until: istEndOfDay(until).toISOString() } : {}) }).then((r) => r.data), { invalidate: ["users"], onSuccess: onClose, success: `${user.username} is blocked` });
  return (
    <Modal open onClose={onClose} size="sm" title={`Block ${user.username}?`} description="They are signed out and can't use the panel until unblocked."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" loading={block.isPending} onClick={() => block.mutate()}>Block user</Button></>}>
      <div className="space-y-4">
        <Field label="Reason" hint="Shown to the user when they try to sign in"><Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} autoFocus data-autofocus /></Field>
        <Field label="Block until" hint="Last day of the block, India time. Leave empty for a permanent block"><Input type="date" min={addDays(istDay(), 1)} value={until} onChange={(e) => setUntil(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

/* ───────────── per-user permission overrides ───────────── */
const expandKeys = (list = [], all = []) => {
  const out = new Set();
  list.forEach((p) => { if (p === "*") all.forEach((k) => out.add(k)); else if (p.endsWith(".*")) all.filter((k) => k.startsWith(p.slice(0, -1))).forEach((k) => out.add(k)); else out.add(p); });
  return out;
};

function PermissionOverrides({ user, roles, onClose }) {
  const { isSuper, can } = usePermission();
  const { data: cat } = usePermissionCatalog();
  const { data: detail, isLoading } = useUserDetail(user._id);
  const [grant, setGrant] = useState(null); const [deny, setDeny] = useState(null);
  const groups = cat?.groups || [];
  const allKeys = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.key)), [groups]);
  const roleSet = useMemo(() => expandKeys(roles.find((r) => r.name === user.role)?.permissions, allKeys), [roles, user.role, allKeys]);
  const mine = useMemo(() => new Set(cat?.mine || []), [cat]);
  const g = new Set(grant ?? detail?.user?.permissionOverrides?.grant ?? []); const dn = new Set(deny ?? detail?.user?.permissionOverrides?.deny ?? []);

  const state = (k) => (g.has(k) ? "grant" : dn.has(k) ? "deny" : "role");
  const setState = (k, v) => {
    const ng = new Set(g); const nd = new Set(dn);
    ng.delete(k); nd.delete(k);
    if (v === "grant") ng.add(k); if (v === "deny") nd.add(k);
    setGrant([...ng]); setDeny([...nd]);
  };
  const save = useApiMutation(() => httpClient.put(`/reporters/${user._id}/permissions`, { grant: [...g], deny: [...dn] }).then((r) => r.data), { invalidate: ["users", "user"], onSuccess: onClose });
  const changed = grant !== null || deny !== null;

  return (
    <Modal open onClose={onClose} size="xl" title={`Permissions · ${user.username}`}
      description={`Role “${user.role}” gives the defaults. Allow or deny single permissions for this person only.`}
      footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => save.mutate()} loading={save.isPending} disabled={!changed}>Save overrides</Button></>}>
      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <div className="space-y-4">
          {user.role === "admin" && <Alert tone="info">Admins always have full access – overrides don't apply.</Alert>}
          {groups.map((grp) => (
            <fieldset key={grp.group} className="rounded-xl border border-line">
              <legend className="sr-only">{grp.group}</legend>
              <p className="border-b border-line bg-surface-2/60 px-4 py-2.5 text-sm font-semibold text-fg">{grp.group}</p>
              <ul className="divide-y divide-line">
                {grp.items.map((i) => {
                  const s = state(i.key); const base = roleSet.has(i.key);
                  const effective = s === "grant" || (s === "role" && base);
                  const locked = user.role === "admin" || !can("user.permissions") || (!isSuper && !mine.has(i.key) && s !== "deny");
                  return (
                    <li key={i.key} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0"><p className="text-sm text-fg">{i.label}</p><p className="break-all font-mono text-[11px] text-fg-faint">{i.key}</p></div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <Badge tone={effective ? "success" : "neutral"} size="sm">{effective ? "Allowed" : "Not allowed"}</Badge>
                        <div className="w-36"><Select size="sm" aria-label={`Override ${i.key}`} disabled={locked} value={s} onChange={(e) => setState(i.key, e.target.value)}
                          options={[{ value: "role", label: base ? "From role ✓" : "From role ✗" }, { value: "grant", label: "Always allow" }, { value: "deny", label: "Always deny" }]} /></div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ───────────── page ───────────── */
export default function Reporters() {
  const { can, user: me } = usePermission();
  const navigate = useNavigate();
  const [params, setParams] = useState({ page: 1, limit: 10, search: "", role: "all", status: "all" });
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);       // { type, user }
  const { data, isLoading, error, refetch } = useUsers(params);
  const { data: roles = [] } = useRoles();
  const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));
  const close = () => setDialog(null);

  const trust = useApiMutation((u) => httpClient.patch(`/reporters/${encodeURIComponent(u.email)}/trust`, { trusted: !u.trusted }).then((r) => r.data), { invalidate: ["users"] });
  const unblock = useApiMutation((u) => httpClient.patch("/block-unblock", { userId: u._id, action: "unblock" }).then((r) => r.data), { invalidate: ["users"], success: "User unblocked" });
  const del = useApiMutation(() => httpClient.delete("/admin/delete-user", { data: { data: dialog.user._id } }).then((r) => r.data), { invalidate: ["users"], onSuccess: close });

  const columns = [
    {
      key: "user", header: "Member", primary: true, cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={u.fullName || u.username} src={u.profile} className="shrink-0" />
          <div className="min-w-0">
            <Link to={`/dashboard/reporters/${u._id}`} className="block truncate font-medium text-fg hover:text-primary">{u.fullName || u.username}</Link>
            <p className="truncate text-xs text-fg-subtle">@{u.username}</p>
            <p className="truncate text-xs text-fg-subtle">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", cell: (u) => <Badge tone={u.role === "admin" ? "accent" : "primary"} className="capitalize">{u.role}</Badge> },
    { key: "publishing", header: "Publishing", cell: (u) => (u.role === "admin" ? <span className="text-xs text-fg-subtle">Always</span> : can("user.trust") && u._id !== me?.id ? <Switch checked={u.trusted} onChange={() => trust.mutate(u)} label={undefined} className="w-fit" /> : <Badge tone={u.trusted ? "success" : "neutral"} size="sm">{u.trusted ? "Auto-publish" : "Needs review"}</Badge>) },
    { key: "status", header: "Status", cell: (u) => (u.is_blocked ? <div><StatusBadge status="blocked" />{u.blockedUntil && <p className="mt-0.5 text-[11px] text-fg-subtle">until {fmtDate(u.blockedUntil)}</p>}</div> : <StatusBadge status="active" />) },
    { key: "joined", header: "Joined", hideOnMobile: true, cell: (u) => <span className="text-xs">{fmtDate(u.createdAt)}</span> },
    {
      key: "actions", header: "", align: "right", cell: (u) => {
        const self = u._id === me?.id;
        return (
          <Menu trigger={<IconButton label="Actions" size="icon-sm"><MoreHorizontal className="size-4.5" /></IconButton>} width="w-56">
            <MenuItem as={Link} to={`/dashboard/reporters/${u._id}`} icon={IdCard}>View profile</MenuItem>
            {can("user.update") && <MenuItem as={Link} to={`/dashboard/reporters/${u._id}/edit`} icon={Pencil}>Edit profile</MenuItem>}
            {can("user.permissions") && !self && u.role !== "admin" && <MenuItem icon={ListChecks} onClick={() => setDialog({ type: "perms", user: u })}>Permissions</MenuItem>}
            {can("user.password.reset") && <MenuItem icon={KeyRound} onClick={() => setDialog({ type: "password", user: u })}>Reset password</MenuItem>}
            {can("user.block") && !self && (u.is_blocked ? <MenuItem icon={Unlock} onClick={() => unblock.mutate(u)}>Unblock</MenuItem> : <MenuItem icon={Ban} onClick={() => setDialog({ type: "block", user: u })}>Block…</MenuItem>)}
            {can("user.delete") && !self && <><MenuSeparator /><MenuItem icon={Trash2} tone="danger" onClick={() => setDialog({ type: "delete", user: u })}>Delete</MenuItem></>}
          </Menu>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Reporters"
        description="Everyone who can sign in to the panel. Roles decide what they can do; permissions can be fine-tuned per person."
        actions={
          <>
            {/* md and up: normal buttons */}
            <div className="hidden items-center gap-2 md:flex">
              {can("role.view") && <Button as={Link} to="/dashboard/roles" variant="outline" leftIcon={ShieldCheck}>Roles</Button>}
              {can("user.create") && <Button as={Link} to="/dashboard/reporters/new" leftIcon={UserPlus}>Add member</Button>}
            </div>

            {/* below md: one button that opens the same actions */}
            <div className="md:hidden">
              <RowMenu
                variant="filled"
                icon={UserPlus}
                label="Actions"
                items={[
                  { label: "Add member", icon: UserPlus, hidden: !can("user.create"), onClick: () => navigate("/dashboard/reporters/new") },
                  { label: "Roles", icon: ShieldCheck, hidden: !can("role.view"), onClick: () => navigate("/dashboard/roles") },
                ]}
              />
            </div>
          </>
        }
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="w-full lg:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }} placeholder="Search name, username or email (Enter)" />
          </form>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <div className="sm:w-44"><Select size="sm" aria-label="Role" value={params.role} onChange={(e) => patch({ role: e.target.value })} options={[{ value: "all", label: "All roles" }, ...roleOptions(roles)]} /></div>
            <div className="sm:w-40"><Select size="sm" aria-label="Status" value={params.status} onChange={(e) => patch({ status: e.target.value })} options={[{ value: "all", label: "Any status" }, { value: "active", label: "Active" }, { value: "blocked", label: `Blocked${data?.blockedTotal ? ` (${data.blockedTotal})` : ""}` }]} /></div>
          </div>
        </div>
        {error ? <ErrorState error={error} onRetry={refetch} /> : (
          <>
            <DataTable columns={columns} rows={data?.users} loading={isLoading} empty={<EmptyState icon={Users} title="No members found" description="Try a different search or filter." />} />
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="border-t border-line" />
          </>
        )}
      </Card>

      {(dialog?.type === "create" || dialog?.type === "edit") && <UserForm user={dialog.user} roles={roles} onClose={close} />}
      {dialog?.type === "block" && <BlockDialog user={dialog.user} onClose={close} />}
      {dialog?.type === "perms" && <PermissionOverrides user={dialog.user} roles={roles} onClose={close} />}
      {dialog?.type === "password" && <Modal open onClose={close} size="sm" title={`Reset password · ${dialog.user.username}`}><PasswordResetReporter user={dialog.user} setPasswordResetUser={close} /></Modal>}
      {dialog?.type === "delete" && <ConfirmDialog open onClose={close} tone="danger" loading={del.isPending} onConfirm={() => del.mutate()} confirmLabel="Delete member" title={`Delete ${dialog.user.username}?`} message="They lose access immediately. The account moves to the trash and can be restored." />}
    </>
  );
}