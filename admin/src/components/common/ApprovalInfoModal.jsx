import { BadgeCheck, CheckCircle2, Clock, Send, ShieldAlert, XCircle } from "lucide-react";
import { Avatar, Badge, Button, Modal } from "../ui";
import { fmtDate } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Link } from "react-router-dom";
import { ScanEye } from "lucide-react";

const who = (u) => u?.fullName || u?.username || "—";
const time = (d) => (d ? new Date(d).getTime() : 0);

/** verified | pending | rejected | direct | null (draft, nothing to say) */
/** verified | pending | rejected | null (direct publish / draft: nothing to show) */
export const approvalState = (i) => {
    if (!i) return null;
    if (i.need_approval) return "pending";
    if (i.rejected_at && time(i.rejected_at) > time(i.approved_at)) return "rejected";
    if (i.approved_by || i.approved_at) return "verified";
    return null;
};

/** show the "Approval details" action only when there is a trail to look at */
export const hasApprovalInfo = (i) => ["verified", "pending", "rejected"].includes(approvalState(i));

const META = {
    verified: { icon: BadgeCheck, cls: "bg-success-soft text-success", label: "Verified" },
    pending: { icon: Clock, cls: "bg-warning-soft text-warning", label: "Awaiting approval" },
    rejected: { icon: XCircle, cls: "bg-danger-soft text-danger", label: "Rejected" },
};

/** Small trust badge for lists. Click opens the details popup (when onClick is given). */
export function ApprovalBadge({ item, onClick, className }) {
    const state = approvalState(item);
    if (!state) return null;
    const { icon: Icon, cls, label } = META[state];
    const by = state === "verified" ? item.approved_by : state === "rejected" ? item.rejected_by : null;

    const body = (
        <>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>
                <Icon className="size-3.5" aria-hidden />{label}
            </span>
            {by && <span className="truncate text-[11px] text-fg-subtle">by {who(by)}</span>}
        </>
    );

    return onClick ? (
        <button type="button" onClick={() => onClick(item)} title="View approval details"
            className={cn("inline-flex max-w-full items-center gap-1.5 rounded-full focus-ring hover:opacity-80", className)}>
            {body}
        </button>
    ) : (
        <span className={cn("inline-flex max-w-full items-center gap-1.5", className)}>{body}</span>
    );
}

function Row({ icon: Icon, tone, title, by, at, children }) {
    const tones = { success: "bg-success-soft text-success", danger: "bg-danger-soft text-danger", warning: "bg-warning-soft text-warning", neutral: "bg-surface-3 text-fg-subtle" };
    return (
        <li className="flex gap-3">
            <span className={`grid size-8 shrink-0 place-items-center rounded-full ${tones[tone]}`}><Icon className="size-4" aria-hidden /></span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">{title}</p>
                {by && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                        <Avatar name={who(by)} src={by.profile} size="xs" />{who(by)}{at && <span className="text-fg-subtle">· {fmtDate(at, true)}</span>}
                    </p>
                )}
                {!by && at && <p className="mt-0.5 text-xs text-fg-subtle">{fmtDate(at, true)}</p>}
                {children}
            </div>
        </li>
    );
}

export default function ApprovalInfoModal({ item, onClose, reviewTo }) {
    if (!item) return null;
    const state = approvalState(item);
    return (
        <Modal open onClose={onClose} size="md" title="Approval details" description={item.title}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {reviewTo && (
                        <Button as={Link} to={reviewTo} leftIcon={ScanEye} onClick={onClose}>Review</Button>
                    )}
                </>
            }>
            <ul className="space-y-4">
                <Row icon={Send} tone="neutral" title="Submitted" by={item.author} at={item.createdAt}>
                    {item.requestedStatus && <Badge size="sm" tone="accent" className="mt-1.5">Asked for: {item.requestedStatus}</Badge>}
                </Row>

                {item.rejected_at && (
                    <Row icon={XCircle} tone="danger" title="Rejected" by={item.rejected_by} at={item.rejected_at}>
                        {item.rejected_reason && <p className="mt-1.5 whitespace-pre-line rounded-lg bg-surface-2 p-2 text-xs text-fg-muted">{item.rejected_reason}</p>}
                    </Row>
                )}

                {state === "verified" && <Row icon={CheckCircle2} tone="success" title="Approved" by={item.approved_by} at={item.approved_at} />}
                {state === "pending" && <Row icon={Clock} tone="warning" title="Waiting for approval" />}
            </ul>
        </Modal>
    );
}