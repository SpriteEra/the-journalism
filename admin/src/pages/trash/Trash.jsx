import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Eye, FileText, Hash, History, MessageSquareWarning, RotateCcw, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";
import httpClient from "../../api/httpClient.js";
import { formatDate } from "../../utils/utils";
import Confirmation from "../../utils/Confirmation";
import Pagination from "../../utils/Pagination";
import AsyncWrapper from "../../utils/AsyncWrapper";
import { handleImageError } from "../../utils/imageError.js";
import { useFetchTrash } from "../../hooks/trash.js";
import TrashItemDetailPanel from "../../components/TrashItemDetailPanel.jsx";
import UpdateStackPanel from "../../components/UpdateStack.jsx";
import { Button, Card, EmptyState, PageHeader } from "../../components/ui";

const RETENTION_DAYS = 30;
/** Space taken above the page content (top bar + page padding). Adjust if the card ends too high or the page scrolls. */
const PAGE_OFFSET = "7.5rem";

/** Days before an item is removed for good, with a colour that gets louder as the date gets close. */
function daysLeft(deletedAt) {
  const left = RETENTION_DAYS - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
  if (Number.isNaN(left)) return null;
  const n = Math.max(0, left);
  return {
    text: n === 0 ? "Deleted for good today" : `${n} day${n === 1 ? "" : "s"} left`,
    tone: n <= 3 ? "bg-danger-soft text-danger" : n <= 10 ? "bg-warning-soft text-warning" : "bg-surface-2 text-fg-muted",
  };
}

function Meta({ icon: Icon, label, children }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-sm">
      <Icon className="size-4 shrink-0 text-fg-faint" aria-hidden />
      <span className="text-fg-subtle">{label}</span>
      <span className="truncate font-medium text-fg">{children}</span>
    </span>
  );
}

const Trash = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDetailModalOpen, setDetailIsModalOpen] = useState(false);
  const [isShowUpdatedStack, setIsShowUpdatedStack] = useState(false);
  const [isRestore, setIsRestore] = useState(false);
  const itemsPerPage = 9;
  const [id, setId] = useState(null);
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = useState(pageFromUrl);
  const scrollRef = useRef(null);

  const { data, isPending, isError, error, refetch } = useFetchTrash({ page, limit: itemsPerPage });

  const handleRestore = async () => {
    if (!id) return;
    const loadingToast = toast.loading("Restoring...");
    try {
      await httpClient.delete(`/trash-restore/${id}`);
      setIsRestore(false);
      toast.dismiss(loadingToast);
      toast.success("Item Restored Successfully");
      refetch();
    } catch (err) {
      toast.dismiss(loadingToast);
      console.log(err);
      toast.error(err.response?.data?.message || err.message || "Something went wrong");
      setIsRestore(false);
    }
  };

  useEffect(() => {
    setSearchParams({ page });
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <>
      {/* Full-height page: header on top, card fills the rest, pagination pinned to the card's bottom edge. */}
      <div className="flex flex-col" style={{ minHeight: `calc(100dvh - ${PAGE_OFFSET})` }}>
        <PageHeader
          title="Trash"
          description={`Deleted items stay here for ${RETENTION_DAYS} days. Restore them before they are removed for good.`}
          actions={
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-sm text-fg-muted">
              <Trash2 className="size-4" aria-hidden />
              <span className="font-semibold tabular-nums text-fg">{data?.count ?? 0}</span> {data?.count === 1 ? "item" : "items"}
            </span>
          }
        />

        <Card padded={false} className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
            <AsyncWrapper isError={isError} isPending={isPending} error={error}>
              {data?.data?.length ? (
                data.data.map((item) => {
                  const doc = item.docId;
                  const isUser = item.model === "User";
                  const title = doc?.title || doc?.fullName || "Deleted Item";
                  const left = item.deletedAt ? daysLeft(item.deletedAt) : null;
                  return (
                    <article key={item._id} className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface p-3 transition-all duration-200 hover:border-danger/50 hover:shadow-md sm:flex-row sm:p-4">
                      {/* Thumbnail */}
                      <div className="shrink-0">
                        <div className={`size-24 overflow-hidden bg-surface-2 sm:size-28 ${isUser ? "rounded-full" : "rounded-xl"}`}>
                          <img src={isUser ? doc?.profile || "/avatar.png" : doc?.banner} alt={title} className="size-full object-cover opacity-90 grayscale-[30%] transition group-hover:opacity-100 group-hover:grayscale-0" onError={handleImageError} />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                            <FileText className="size-3.5" aria-hidden />{item.model}
                          </span>
                          {left && <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${left.tone}`}>{left.text}</span>}
                        </div>

                        <h3 className="hindi-font mt-2 line-clamp-2 text-lg font-semibold leading-snug text-fg">{title}</h3>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                          <Meta icon={Calendar} label="Deleted">{formatDate(item.deletedAt)}</Meta>
                          <Meta icon={User} label="By">{item.deletedBy?.fullName || item.deletedBy?.username || item.deletedBy}</Meta>
                          {doc?.news_id && <Meta icon={Hash} label="ID"><span className="font-mono text-xs">{doc.news_id}</span></Meta>}
                        </div>

                        {item.reason && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm">
                            <MessageSquareWarning className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                            <p className="min-w-0 text-fg"><span className="font-semibold text-warning">Reason: </span>{item.reason}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap gap-2 sm:w-32 sm:flex-col sm:justify-center">
                        <Button size="sm" leftIcon={RotateCcw} className="sm:w-full" onClick={() => { setId(item._id); setIsRestore(true); }}>Restore</Button>
                        <Button size="sm" variant="outline" leftIcon={Eye} className="sm:w-full" onClick={() => { setId(item._id); setDetailIsModalOpen(true); }}>Details</Button>
                        {doc?.update_stack && (
                          <Button size="sm" variant="outline" leftIcon={History} className="sm:w-full" onClick={() => { setId(doc.update_stack); setIsShowUpdatedStack(true); }}>History</Button>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="grid h-full place-items-center">
                  <EmptyState icon={Trash2} title="कोई डिलीट की गई खबर उपलब्ध नहीं है" description="No deleted items found in trash" />
                </div>
              )}
            </AsyncWrapper>
          </div>

          <div className="shrink-0 border-t border-line px-3 py-3 sm:px-4">
            <Pagination totalItems={data?.count} itemsPerPage={itemsPerPage} defaultCurrent={1} current={page} onChange={(val) => setPage(val)} isLoading={isPending} />
          </div>
        </Card>
      </div>

      <Confirmation
        isOpen={isRestore}
        onClose={() => setIsRestore(false)}
        onConfirm={handleRestore}
        btnTitle="Restore"
        title="Are you sure?"
        description="Are you sure you want to restore this item? This action cannot be undone."
      />
      <TrashItemDetailPanel docId={id} isOpen={isDetailModalOpen} onClose={() => setDetailIsModalOpen(false)} title="User Details" width="400px" />
      <UpdateStackPanel isOpen={isShowUpdatedStack} onClose={() => setIsShowUpdatedStack(false)} stack_id={id} />
    </>
  );
};

export default Trash;