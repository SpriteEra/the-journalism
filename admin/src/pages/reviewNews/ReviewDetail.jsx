import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, History, Pencil, ScanEye, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient";
import { useApiMutation } from "../../hooks/admin";
import { fetchSingleNews } from "../../hooks/news";
import { useReviewItem } from "../../hooks/review";
import { errMsg, fmtDate } from "../../lib/api";
import UpdateStackPanel from "../../components/UpdateStack";
import NewsPreview from "../../components/news/NewsPreview";
import { toPreview } from "../../components/news/toPreview";
import { Alert, Avatar, Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Skeleton, Textarea } from "../../components/ui";
import VideoPlayer from "../../components/VideoPlayer";
import MediaPlayer from "../../components/MediaPlayer";

const QUEUE = "/dashboard/review-news";
const EDIT = {   // <- set these to your real edit routes
    news: (id, reviewer, status) => (reviewer ? `/dashboard/news/edit-news/${id}?mode=edit&type=review` : status === "rejected" ? `/dashboard/news/edit-news/${id}?mode=edit&type=draft` : `/dashboard/news/edit-news/${id}?mode=edit`),
    yt: (id) => `/dashboard/videos/edit/${id}`,
    short: (id) => `/dashboard/short-videos/${id}/edit`,
    live: (id) => `/dashboard/live/${id}`,
};
const INVALIDATE = ["review-queue", "review-item", "news", "yt-news", "short-videos", "live-news"];

export default function ReviewDetail() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const { data, isPending, isError, error, refetch } = useReviewItem(type, id);
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const [history, setHistory] = useState(false);
    const [preview, setPreview] = useState(null);

    const call = (action, body) => httpClient.patch(`/review/${type}/${id}/${action}`, body).then((r) => r.data);
    const approve = useApiMutation(() => call("approve"), { invalidate: INVALIDATE, success: "Approved and published", onSuccess: () => navigate(QUEUE) });
    const reject = useApiMutation(() => call("reject", { reason }), { invalidate: INVALIDATE, success: "Sent back to the author", onSuccess: () => navigate(QUEUE) });
    const resubmit = useApiMutation(() => call("resubmit", { note }), { invalidate: INVALIDATE, success: "Sent for approval again", onSuccess: () => setNote("") });

    const openPreview = async () => {
        const tid = toast.loading("Loading preview…");
        try { setPreview(toPreview(await fetchSingleNews(id))); toast.dismiss(tid); }
        catch (e) { toast.error(errMsg(e, "Could not load the preview"), { id: tid }); }
    };

    if (isError) return <ErrorState error={error} onRetry={refetch} />;
    if (isPending) return <Skeleton className="h-96 w-full" />;

    const { item, status, label, isOwner, canReview, thumbnail, type: videoType } = data;
    const author = item.author || {};
    const embed = item.videoLinkId ? `https://www.youtube.com/embed/${item.videoLinkId}` : "";
    const video = embed ? "" : item.videoUrl || item.hlsUrl || "";

    const editTo = (EDIT[type] || (() => null))(id, canReview, status);

    return (
        <>
            <PageHeader title={item.title} description={`${label} · submitted by ${author.fullName || author.username}`}
                actions={<Button as={Link} to={QUEUE} variant="outline" leftIcon={ArrowLeft}>Back</Button>} />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                <Card className="space-y-4">
                    {item.videoLinkId || video ? (
                        <MediaPlayer
                            title={item.title}
                            youtubeId={item.videoLinkId}
                            src={video}
                            thumbnail={thumbnail}
                            vertical={videoType === "short"}
                        />
                    ) : thumbnail ? (
                        <img src={thumbnail} alt="" className="w-full rounded-xl object-cover" />
                    ) : null}

                    {item.description && <p className="hindi-font whitespace-pre-line text-sm text-fg-muted">{item.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-fg-subtle">
                        <span className="inline-flex items-center gap-1.5"><Avatar name={author.fullName || author.username} src={author.profile} size="xs" />{author.fullName || author.username}</span>
                        <Badge size="sm" tone="accent">{label}</Badge>
                        <span>Last change {fmtDate(item.updatedAt, true)}</span>
                    </div>
                </Card>

                <aside className="space-y-4 lg:sticky lg:top-4">
                    <Card className="space-y-3">
                        {status === "pending" && <Alert tone="warning">Waiting for approval.</Alert>}
                        {status === "rejected" && <Alert tone="danger"><p className="font-semibold">Rejected by {item.rejected_by?.username} · {fmtDate(item.rejected_at, true)}</p><p className="mt-1 whitespace-pre-line">{item.rejected_reason}</p></Alert>}
                        {status === "approved" && <Alert tone="success">Approved by {item.approved_by?.username} · {fmtDate(item.approved_at, true)}</Alert>}

                        {canReview && status === "pending" && (
                            <div className="flex gap-2">
                                <Button className="flex-1" leftIcon={Check} loading={approve.isPending} onClick={() => approve.mutate()}>Approve</Button>
                                <Button className="flex-1" variant="danger-soft" leftIcon={X} onClick={() => setRejecting(true)}>Reject</Button>
                            </div>
                        )}

                        {(isOwner || canReview) && status === "rejected" && (
                            <div className="space-y-2">
                                <Field label="Note for the reviewer" hint="Optional. Say what you changed."><Textarea rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                                <Button className="w-full" leftIcon={Send} loading={resubmit.isPending} onClick={() => resubmit.mutate()}>Apply for approval again</Button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                            {editTo && <Button as={Link} to={editTo} size="sm" variant="outline" leftIcon={Pencil}>{canReview && status === "pending" ? "Open in editor" : "Edit"}</Button>}
                            {type === "news" && <Button size="sm" variant="ghost" leftIcon={ScanEye} onClick={openPreview}>Preview</Button>}
                            {item.update_stack && <Button size="sm" variant="ghost" leftIcon={History} onClick={() => setHistory(true)}>History</Button>}
                        </div>
                    </Card>
                </aside>
            </div>

            <Modal open={rejecting} onClose={() => setRejecting(false)} size="sm" title="Reject and send back?" description="The author sees this message, can fix the item and apply again."
                footer={<><Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button><Button variant="danger" loading={reject.isPending} disabled={reason.trim().length < 5} onClick={() => reject.mutate()}>Reject</Button></>}>
                <Field label="Reason" required hint="At least 5 characters, at most 300">
                    <Textarea rows={4} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus data-autofocus />
                </Field>
            </Modal>
            <UpdateStackPanel isOpen={history} onClose={() => setHistory(false)} stack_id={item.update_stack} />
            <NewsPreview open={Boolean(preview)} onClose={() => setPreview(null)} news={preview} />
        </>
    );
}