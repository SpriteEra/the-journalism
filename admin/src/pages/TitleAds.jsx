import { useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, CalendarPlus, Link2, Mail, Pencil, Plus, RefreshCw, Search, Trash2, User } from "lucide-react";
import { useFetchTitleAds } from "../hooks/ads";
import httpClient from "../api/httpClient";
import { errMsg } from "../lib/api";
import { formatDate } from "../utils/utils";
import Pagination from "../utils/Pagination";
import AsyncWrapper from "../utils/AsyncWrapper";
import Modal from "../components/ui/Modal";
import { Button, Card, PageHeader, useConfirm } from "../components/ui";
import EditTitleAds from "../components/title-ads/EditTitleAds";
import AddAdvertisementNews from "../components/title-ads/AddAdvertisementNews";

function Meta({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

/** One title ad: title, link, email, created / expires / created by, and Edit · Extend (or Renew when expired) · Delete. */
function TitleAdRow({ ad, onEdit, onExtend, onRenew, onDelete }) {
  return (
    <Card padded={false} className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="line-clamp-1 text-base font-semibold text-fg">{ad.title}</h3>

          {(ad.link || ad.email) && (
            <div className="flex flex-wrap gap-2">
              {ad.link && (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-info ring-1 ring-line transition-colors hover:bg-surface-3"
                >
                  <Link2 className="size-3.5 shrink-0" />
                  <span className="truncate">{ad.link}</span>
                </a>
              )}
              {ad.email && (
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-fg-muted ring-1 ring-line">
                  <Mail className="size-3.5 shrink-0 text-fg-subtle" />
                  <span className="truncate">{ad.email}</span>
                </span>
              )}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Meta icon={CalendarPlus} label="Created on">{formatDate(ad.createdAt)}</Meta>
            <Meta icon={CalendarClock} label="Expire on">{formatDate(ad.expireDate)}</Meta>
            <Meta icon={User} label="Created by">@{ad.author?.username}</Meta>
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-3 lg:w-auto lg:justify-end lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <Button size="sm" variant="soft" leftIcon={Pencil} onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="outline" leftIcon={RefreshCw} onClick={ad.isExpired ? onRenew : onExtend}>
            {ad.isExpired ? "Renew" : "Extend"}
          </Button>
          <Button size="sm" variant="danger" leftIcon={Trash2} onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </Card>
  );
}

const TitleAds = () => {
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [finalSearch, setFinalSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const itemsPerPage = 6;

  const { isPending, data, isError, error, refetch } = useFetchTitleAds({
    page,
    limit: itemsPerPage,
    search: finalSearch,
  });

  const submitSearch = (e) => {
    e.preventDefault();
    setFinalSearch(search);
  };

  const run = async (label, fn, done) => {
    const t = toast.loading(`${label}…`);
    try {
      await fn();
      toast.success(done, { id: t });
      refetch();
    } catch (e) {
      toast.error(errMsg(e, `${label} failed`), { id: t });
    }
  };

  const del = async (ad) => {
    const ok = await confirm({
      title: "Delete Ads",
      message: "Are you sure you want to delete this ads?",
      tone: "danger",
      confirmLabel: "Delete",
    });
    if (ok) await run("Deleting", () => httpClient.delete(`delete-title-ads/${ad._id}`), "Advertisement Deleted Successfully");
  };

  const extend = async (ad) => {
    const ok = await confirm({
      title: "Extend Expiry",
      message: "Are you sure, you want to extend expiry for this advertisement?",
      confirmLabel: "Extend",
    });
    if (ok) await run("Extending", () => httpClient.put(`extend-expiry/${ad._id}`), "Advertisement Extended Successfully");
  };

  const renew = async (ad) => {
    const ok = await confirm({
      title: "Renew Ads",
      message: "Are you sure, you want to renew this advertisement?",
      confirmLabel: "Renew Now",
    });
    if (ok) await run("Renewing", () => httpClient.put(`renew-expiry/${ad._id}`), "Advertisement Renewed Successfully");
  };

  const ads = data?.ads ?? [];

  return (
    <>
      <PageHeader
        title="Title ads"
        description="Text advertisements shown with the headlines."
        actions={<Button leftIcon={Plus} onClick={() => setAdding(true)}>Add title ad</Button>}
      />

      <div className="space-y-4">
        <form onSubmit={submitSearch} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search News"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-3 pr-10 text-sm text-fg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button type="submit" aria-label="Search" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg">
            <Search className="size-4" />
          </button>
        </form>

        <AsyncWrapper isError={isError} isPending={isPending} error={error}>
          {ads.length ? (
            <div className="space-y-3">
              {ads.map((ad) => (
                <TitleAdRow
                  key={ad._id}
                  ad={ad}
                  onEdit={() => setEditing(ad)}
                  onExtend={() => extend(ad)}
                  onRenew={() => renew(ad)}
                  onDelete={() => del(ad)}
                />
              ))}
            </div>
          ) : (
            <Card className="flex min-h-[max(18rem,calc(100dvh-22rem))] items-center justify-center">
              <h5 className="text-3xl text-fg-muted hindi-font">कोई खबर उपलब्ध नहीं है</h5>
            </Card>
          )}
        </AsyncWrapper>

        <div className="flex justify-between">
          <Pagination
            totalItems={0}
            itemsPerPage={10}
            defaultCurrent={1}
            current={page}
            onChange={(val) => setPage(val)}
            isLoading={false}
          />
        </div>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add title ad" size="xl">
        {adding && <AddAdvertisementNews setAddBreakingNews={setAdding} refetch={refetch} />}
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit Title Ads" size="xl">
        {editing && (
          <EditTitleAds
            news={editing}
            setEditBreakingNews={(open) => !open && setEditing(null)}
            refetch={refetch}
          />
        )}
      </Modal>
    </>
  );
};

export default TitleAds;