import { useMemo, useState } from "react";
import { Check, Minus, RotateCcw, ShieldCheck, X } from "lucide-react";
import httpClient from "../../api/httpClient";
import { useApiMutation, usePermissionCatalog, useRoles, useUserDetail } from "../../hooks/admin";
import usePermission from "../../hooks/usePermission";
import { cn } from "../../lib/cn";
import { Alert, Badge, Button, Card, CardHeader, Skeleton } from "../ui";

const expandKeys = (list = [], all) => {
  const out = new Set();
  list.forEach((p) => { if (p === "*") all.forEach((k) => out.add(k)); else if (p.endsWith(".*")) all.filter((k) => k.startsWith(p.slice(0, -1))).forEach((k) => out.add(k)); else out.add(p); });
  return out;
};

const OPTIONS = [["role", "Role", Minus], ["grant", "Allow", Check], ["deny", "Deny", X]];

/**
 * Extra permissions for ONE person, on top of their role (shown on their profile page).
 * Each permission is: from the role (default) · always allowed · always denied. The server blocks granting what you do not have yourself.
 */
export default function PermissionOverridesPanel({ userId, role }) {
  const { isSuper, can } = usePermission();
  const { data: cat } = usePermissionCatalog();
  const { data: roles = [] } = useRoles();
  const { data: detail, isLoading } = useUserDetail(userId);
  const [grant, setGrant] = useState(null); const [deny, setDeny] = useState(null);
  const groups = cat?.groups || [];
  const allKeys = useMemo(() => groups.flatMap((g) => g.items.map((i) => i.key)), [groups]);
  const roleSet = useMemo(() => expandKeys(roles.find((r) => r.name === role)?.permissions, allKeys), [roles, role, allKeys]);
  const mine = useMemo(() => new Set(cat?.mine || []), [cat]);
  const g = new Set(grant ?? detail?.user?.permissionOverrides?.grant ?? []); const dn = new Set(deny ?? detail?.user?.permissionOverrides?.deny ?? []);
  const stateOf = (k) => (g.has(k) ? "grant" : dn.has(k) ? "deny" : "role");
  const setState = (k, v) => {
    const ng = new Set(g); const nd = new Set(dn); ng.delete(k); nd.delete(k);
    if (v === "grant") ng.add(k); if (v === "deny") nd.add(k);
    setGrant([...ng]); setDeny([...nd]);
  };
  const save = useApiMutation(() => httpClient.put(`/reporters/${userId}/permissions`, { grant: [...g], deny: [...dn] }).then((r) => r.data),
    { invalidate: ["users", "user"], success: "Permissions saved", onSuccess: () => { setGrant(null); setDeny(null); } });
  const changed = grant !== null || deny !== null;
  const canEdit = can("user.permissions") && role !== "admin";
  const extras = g.size + dn.size;

  return (
    <Card padded={false}>
      <CardHeader icon={ShieldCheck} title="Permissions" description={`Role “${role}” gives the defaults. Allow or deny single permissions for this person only.`}
        actions={<>{extras > 0 && <Badge tone="info" size="sm">{extras} custom</Badge>}
          {canEdit && <><Button size="sm" variant="ghost" leftIcon={RotateCcw} disabled={!changed} onClick={() => { setGrant(null); setDeny(null); }}>Reset</Button><Button size="sm" onClick={() => save.mutate()} loading={save.isPending} disabled={!changed}>Save</Button></>}</>} />
      <div className="space-y-4 p-4 sm:p-5">
        {role === "admin" && <Alert tone="info">Admins always have full access — overrides don't apply.</Alert>}
        {!canEdit && role !== "admin" && <Alert tone="info">You can see the permissions but you need “change permissions of a user” to edit them.</Alert>}
        {isLoading ? <Skeleton className="h-64 w-full" /> : groups.map((grp) => (
          <fieldset key={grp.group} className="overflow-hidden rounded-2xl border border-line">
            <legend className="sr-only">{grp.group}</legend>
            <p className="border-b border-line bg-surface-2/60 px-4 py-2.5 text-sm font-semibold text-fg">{grp.group}</p>
            <ul className="divide-y divide-line">
              {grp.items.map((i) => {
                const s = stateOf(i.key); const base = roleSet.has(i.key); const allowed = s === "grant" || (s === "role" && base);
                const locked = !canEdit || (!isSuper && !mine.has(i.key) && s !== "deny");
                return (
                  <li key={i.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="text-sm text-fg">{i.label}</p><p className="font-mono text-[11px] text-fg-faint">{i.key}</p></div>
                    <div className="flex items-center gap-3">
                      <Badge tone={allowed ? "success" : "neutral"} size="sm">{allowed ? "Allowed" : "Not allowed"}</Badge>
                      <div role="radiogroup" aria-label={`Override ${i.key}`} className={cn("inline-flex rounded-full bg-surface-3 p-0.5", locked && "opacity-50")}>
                        {OPTIONS.map(([v, label, Icon]) => (
                          <button key={v} type="button" role="radio" aria-checked={s === v} disabled={locked} onClick={() => setState(i.key, v)}
                            className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors", s === v ? (v === "grant" ? "bg-success text-paper" : v === "deny" ? "bg-danger text-paper" : "bg-surface text-fg shadow-sm") : "text-fg-subtle hover:text-fg")}>
                            <Icon className="size-3" />{label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>
    </Card>
  );
}
