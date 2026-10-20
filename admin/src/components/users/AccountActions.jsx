import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, KeyRound, ShieldCheck, Trash2, Unlock, UserCheck } from "lucide-react";
import httpClient from "../../api/httpClient";
import { useApiMutation } from "../../hooks/admin";
import usePermission from "../../hooks/usePermission";
import { fmtDate } from "../../lib/api";
import PasswordResetReporter from "../../pages/reporters/PasswordResetReporter";
import { BlockDialog } from "../../pages/reporters/Reporters";
import { Alert, Badge, Button, Card, CardHeader, Modal, Switch, useConfirm } from "../ui";

function Row({ icon: Icon, title, description, children, tone }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl border border-line ${tone === "danger" ? "bg-danger-soft text-danger" : "bg-surface-2 text-fg-muted"}`}><Icon className="size-5" /></span>
        <div className="min-w-0"><p className="text-sm font-semibold text-fg">{title}</p><p className="text-sm text-fg-subtle">{description}</p></div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Everything an admin can do to ONE person's account, on their profile page: password, publishing trust, block, delete. */
export default function AccountActions({ user: u }) {
  const { can, user: me } = usePermission();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState(null);
  const self = String(me?.id || me?._id) === String(u._id);
  const isAdmin = u.role === "admin";

  const trust = useApiMutation(() => httpClient.patch(`/reporters/${encodeURIComponent(u.email)}/trust`, { trusted: !u.trusted }).then((r) => r.data), { invalidate: ["user", "users"], success: "Publishing setting changed" });
  const unblock = useApiMutation(() => httpClient.patch("/block-unblock", { userId: u._id, action: "unblock" }).then((r) => r.data), { invalidate: ["user", "users"], success: "User unblocked" });
  const del = useApiMutation(() => httpClient.delete("/admin/delete-user", { data: { data: u._id } }).then((r) => r.data), { invalidate: ["users"], success: "User deleted", onSuccess: () => navigate("/dashboard/reporters") });

  const any = can("user.password.reset") || can("user.trust") || can("user.block") || can("user.delete");
  if (!any) return <Card><Alert tone="info">You don't have permission to manage accounts.</Alert></Card>;

  return (
    <>
      <Card padded={false} className="divide-y divide-line">
        <CardHeader icon={ShieldCheck} title="Account" description="Sign-in, publishing and access of this person" />
        {can("user.password.reset") && (
          <Row icon={KeyRound} title="Password" description="Set a new password. They stay signed out of other devices until they use it.">
            <Button variant="outline" leftIcon={KeyRound} onClick={() => setDialog("password")}>Reset password</Button>
          </Row>
        )}
        {can("user.trust") && !self && !isAdmin && (
          <Row icon={UserCheck} title="Publish without review" description={u.trusted ? "Their stories go live right away." : "Their stories wait in the review queue for an approver."}>
            <Switch checked={Boolean(u.trusted)} onChange={() => trust.mutate()} disabled={trust.isPending} aria-label="Publish without review" />
          </Row>
        )}
        {can("user.block") && !self && (
          <Row icon={u.is_blocked ? Unlock : Ban} title="Access" description={u.is_blocked ? `Blocked${u.blockReason ? ` — ${u.blockReason}` : ""}${u.blockedUntil ? ` until ${fmtDate(u.blockedUntil)}` : ""}.` : "They can sign in and use the panel."}>
            {u.is_blocked ? <Button variant="outline" leftIcon={Unlock} loading={unblock.isPending} onClick={() => unblock.mutate()}>Unblock</Button> : <Button variant="outline" leftIcon={Ban} onClick={() => setDialog("block")}>Block…</Button>}
            <Badge tone={u.is_blocked ? "danger" : "success"} dot>{u.is_blocked ? "Blocked" : "Active"}</Badge>
          </Row>
        )}
        {can("user.delete") && !self && (
          <Row icon={Trash2} tone="danger" title="Delete account" description="Removes the account. Their stories stay on the website.">
            <Button variant="danger" leftIcon={Trash2} loading={del.isPending} onClick={async () => { if (await confirm({ title: `Delete ${u.username}?`, message: "They lose access immediately. This cannot be undone.", tone: "danger", confirmLabel: "Delete" })) del.mutate(); }}>Delete</Button>
          </Row>
        )}
      </Card>
      {dialog === "password" && <Modal open onClose={() => setDialog(null)} size="sm" title={`Reset password · ${u.username}`} icon={KeyRound}><PasswordResetReporter user={u} setPasswordResetUser={() => setDialog(null)} /></Modal>}
      {dialog === "block" && <BlockDialog user={u} onClose={() => setDialog(null)} />}
    </>
  );
}
