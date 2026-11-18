import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clapperboard, ImageIcon, Newspaper, Plus, Radio, RefreshCw, UploadCloud } from "lucide-react";
import usePermission from "../../hooks/usePermission";
import { isWide, pickImage, useMedia } from "../../hooks/media";
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Pagination, SearchInput, Select, Skeleton } from "../../components/ui";
import { fmtBytes } from "../../lib/api";
import { cn } from "../../lib/cn";

const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
const GRID = "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-4";

export default function MediaLibrary() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canUpload = can("media.upload");
  const [params, setParams] = useState({ page: 1, limit: 40, search: "", type: "all", archived: "all" });
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const { data, isLoading, error, refetch, isFetching } = useMedia(params);
  const items = data?.media || [];
  const patch = (p) => setParams((s) => ({ ...s, page: 1, ...p }));
  const filtered = Boolean(params.search) || params.type !== "all" || params.archived !== "all";

  // drop an image anywhere on the page -> open "Add media" with that file
  const drop = (e) => {
    e.preventDefault(); depth.current = 0; setDragging(false);
    if (!canUpload) return;
    const file = pickImage(e.dataTransfer?.files);
    if (file) navigate("/dashboard/media/new", { state: { file } });
  };
  const enter = (e) => { if (canUpload && hasFiles(e)) { e.preventDefault(); depth.current += 1; setDragging(true); } };
  const leave = (e) => { if (canUpload && hasFiles(e)) { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); } };

  useEffect(() => {
    const stop = (e) => hasFiles(e) && e.preventDefault();
    window.addEventListener("dragover", stop); window.addEventListener("drop", stop);
    return () => { window.removeEventListener("dragover", stop); window.removeEventListener("drop", stop); };
  }, []);

  return (
    <div onDragEnter={enter} onDragLeave={leave} onDragOver={(e) => canUpload && hasFiles(e) && e.preventDefault()} onDrop={drop} className="relative flex flex-col">
      <PageHeader
        title="Media library"
        description="Shared images for Live and News."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label="Reload" title="Reload" className="!px-2.5">
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            {canUpload && <Button as={Link} to="/dashboard/media/new" leftIcon={Plus}>Add media</Button>}
          </div>
        }
      />

      <section aria-label="About this library" className="mb-3 overflow-hidden rounded-xl border border-line bg-linear-to-br from-primary-soft/70 via-surface to-surface">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg"><ImageIcon className="size-5" /></span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-fg">One library for Live and News</h2>
              <p className="mt-0.5 max-w-xl text-sm text-fg-subtle">Anything you add here can be picked in live coverage and in news stories. Every image is sized to <b className="text-fg-muted">1280 × 720 (16:9)</b> for the cleanest result.</p>
            </div>
          </div>

        </div>
      </section>

      <Card padded={false}>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <form className="w-full sm:max-w-xs lg:max-w-sm" onSubmit={(e) => { e.preventDefault(); patch({ search }); }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); if (!v) patch({ search: "" }); }} placeholder="Search name, file name or tag (Enter)" />
          </form>
          <div className="flex items-center gap-3">
            {!isLoading && <p className="hidden text-sm text-fg-subtle sm:block"><b className="font-medium text-fg">{data?.total || 0}</b> {data?.total === 1 ? "image" : "images"}</p>}
            <div className="w-full sm:w-40">
              <Select size="sm" aria-label="Filter by status" value={params.archived} onChange={(e) => patch({ archived: e.target.value })}
                options={[{ value: "all", label: "All images" }, { value: "exclude", label: "Available" }, { value: "only", label: "Retired" }]} />
            </div>
            <div className="w-full sm:w-40">
              <Select size="sm" aria-label="Filter by type" value={params.type} onChange={(e) => patch({ type: e.target.value })}
                options={[{ value: "all", label: "All types" }, { value: "png", label: "PNG" }, { value: "jpeg", label: "JPG" }, { value: "webp", label: "WebP" }, { value: "gif", label: "GIF" }, { value: "svg+xml", label: "SVG" }]} />
            </div>
          </div>
        </div>

        {error ? <ErrorState error={error} onRetry={refetch} /> : (
          <>
            <div className={cn("p-3 sm:p-4", isFetching && !isLoading && "opacity-70 transition-opacity")}>
              {isLoading ? (
                <ul className={GRID}>{Array.from({ length: 10 }).map((_, i) => <li key={i} className="space-y-2"><Skeleton className="aspect-video w-full rounded-xl" /><Skeleton className="h-3 w-2/3" /></li>)}</ul>
              ) : !items.length ? (
                <EmptyState icon={ImageIcon} title={filtered ? "No images match" : "No images yet"}
                  description={filtered ? "Try another search or filter." : "Add your first image for Live and News, or drag a file onto this page."}
                  action={canUpload && !filtered ? <Button as={Link} to="/dashboard/media/new" leftIcon={UploadCloud}>Add media</Button> : null} />
              ) : (
                <ul className={GRID}>
                  {items.map((m) => (
                    <li key={m._id}>
                      <Link to={`/dashboard/media/${m._id}/edit`} className="group block w-full rounded-xl text-left focus-ring">
                        <span className="relative block aspect-video overflow-hidden rounded-xl border border-line bg-surface-2 transition-shadow group-hover:shadow-md">
                          <img src={m.url} alt={m.altText || ""} loading="lazy" className={cn("size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none", m.isArchived && "opacity-60 grayscale")} />
                          {m.isArchived && <Badge tone="danger" size="sm" className="absolute bottom-2 left-2 shadow-sm">Retired</Badge>}
                          <span className="absolute inset-0 bg-linear-to-t from-ink/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          {m.isDefault && <Badge tone="warning" size="sm" className="absolute right-2 top-2 shadow-sm">Default</Badge>}
                          {isWide(m.width, m.height)
                            ? <Badge tone="success" size="sm" className="absolute left-2 top-2 shadow-sm">16:9</Badge>
                            : m.width && <Badge size="sm" className="absolute left-2 top-2 bg-surface/90 shadow-sm backdrop-blur">Not 16:9</Badge>}
                        </span>
                        <span className="mt-2 block truncate text-sm font-medium text-fg">{m.title || m.fileName || "(no title)"}</span>
                        {m.tags?.length > 0 && <span className="block truncate text-xs text-primary">{m.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}{m.tags.length > 3 ? ` +${m.tags.length - 3}` : ""}</span>}
                        <span className="block truncate text-xs text-fg-subtle">{[m.width && m.height ? `${m.width} × ${m.height}` : null, m.size ? fmtBytes(m.size) : null].filter(Boolean).join(" · ") || "—"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Pagination page={params.page} total={data?.total || 0} limit={params.limit} limits={[20, 40, 80]} onPage={(page) => setParams((s) => ({ ...s, page }))} onLimit={(limit) => patch({ limit })} className="border-t border-line" />
          </>
        )}
      </Card>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-primary/10 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-surface px-10 py-8 shadow-lg">
            <UploadCloud className="size-10 text-primary" />
            <p className="font-medium text-fg">Drop the image to add it</p>
            <p className="text-xs text-fg-subtle">You can resize it to 1280 × 720 next</p>
          </div>
        </div>
      )}
    </div>
  );
}