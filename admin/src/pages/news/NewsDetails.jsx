import React, { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  User,
  Eye,
  Video,
  FileText,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import httpClient from "../../api/httpClient";
import { formatDate } from "../../utils/utils";
const nm = (x, ...keys) => (x && typeof x === "object" ? keys.map((k) => x[k]).find(Boolean) : x);   // populated doc or plain value -> label
import NewsContent from "../../utils/BlogContent";

// Sample detailed news data
const sampleNewsArticle = {
  _id: "1",
  news_id: "NEWS001",
  title:
    "Major Infrastructure Development Project Transforms Mumbai Metropolitan Region",
  banner:
    "https://via.placeholder.com/1200x600/0066cc/ffffff?text=Infrastructure+Development+Mumbai",
  description:
    "A comprehensive overview of the latest infrastructure projects being developed across Mumbai metropolitan area, including new metro lines, highways, and urban development initiatives that will reshape the city's landscape.",
  content: [
    {
      type: "paragraph",
      text: "The Mumbai Metropolitan Region Development Authority (MMRDA) has announced several groundbreaking infrastructure projects that promise to revolutionize transportation and urban connectivity across the region. These ambitious initiatives represent an investment of over ₹50,000 crores and are expected to be completed by 2027.",
    },
    {
      type: "paragraph",
      text: "The flagship project includes the extension of Metro Line 3 (Colaba-Bandra-SEEPZ), which will add 15 new stations and reduce travel time between South Mumbai and the international airport by 40 minutes. Additionally, the proposed Metro Line 6 (Lokhandwala-Jogeshwari-Vikhroli) will serve the densely populated western suburbs.",
    },
    {
      type: "paragraph",
      text: "Key highlights of the development plan include: Construction of 4 new flyovers to ease traffic congestion, Development of 2 integrated transport hubs, Modernization of 12 railway stations, Creation of 500 acres of green spaces and parks.",
    },
    {
      type: "paragraph",
      text: "The project is expected to generate approximately 75,000 direct and indirect employment opportunities during the construction phase. Environmental impact assessments have been completed, and the projects have received necessary clearances from the Ministry of Environment and Forests.",
    },
    {
      type: "paragraph",
      text: "Citizens can expect improved air quality due to reduced vehicular emissions, better connectivity to employment centers, and enhanced quality of life. The MMRDA has also announced a citizen feedback portal where residents can share their suggestions and concerns regarding the ongoing projects.",
    },
  ],
  state: ["Maharashtra"],
  district: ["Mumbai", "Thane", "Navi Mumbai"],
  location: "Mumbai Metropolitan Region, Maharashtra",
  tags: [
    "infrastructure",
    "development",
    "mumbai",
    "transport",
    "metro",
    "urban-planning",
    "MMRDA",
  ],
  news_section_type: ["Development", "Transportation", "Urban Planning"],
  imageRef: "mumbai-infrastructure-2024",
  author: {
    _id: "author1",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@newsportal.com",
  },
  ref_reporter: "Priya Sharma, Mumbai Bureau",
  is_literature: false,
  updatedBy: {
    _id: "editor1",
    name: "Anjali Mehta",
  },
  post_time: "2024-03-15T10:30:00.000Z",
  activity: {
    total_reads: 12450,
    total_today_count: 345,
  },
  isVideo: false,
  video: "",
  isPublished: true,
  draft: false,
  approved_by: {
    _id: "approver1",
    name: "Vikram Singh",
  },
  isDeleted: false,
  need_approval: false,
  createdAt: "2024-03-15T10:30:00.000Z",
  updatedAt: "2024-03-15T16:45:00.000Z",
};

/* ---------- small presentational helpers ---------- */

const SideCard = ({ title, icon: Icon, className = "", children }) => (
  <section className={`rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${className}`}>
    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg">
      {Icon && <Icon size={16} className="text-primary" />}
      {title}
    </h3>
    {children}
  </section>
);

const Row = ({ label, icon: Icon, children }) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium text-fg-muted">{label}</dt>
    <dd className="mt-0.5 flex items-center gap-1.5 break-words text-sm text-fg">
      {Icon && <Icon size={14} className="shrink-0 text-fg-subtle" />}
      <span className="min-w-0">{children}</span>
    </dd>
  </div>
);

const Chip = ({ tone = "primary", children }) => {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    neutral: "bg-surface-3 text-fg-muted",
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
};

const StatusPill = ({ tone, icon: Icon, children }) => {
  const tones = {
    success: "bg-success-soft text-success",
    warning: "bg-warning/15 text-warning",
    neutral: "bg-surface-3 text-fg-muted",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

/* ---------- page ---------- */

const NewsDetails = () => {
  const [article, setArticle] = useState(sampleNewsArticle);
  let { news_id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!news_id) {
      return setLoading(false);
    }

    const query = new URLSearchParams(window.location.search);
    const type = query.get("type");

    let fetchUrl = "/";

    switch (type) {
      case "schedule_news":
        fetchUrl = "/get-scheduled-news";
        break;
      case "guest-news":
        fetchUrl = "/get-guest-news";
        break;

      default:
        fetchUrl = "/get-single-news";
        break;
    }
    httpClient
      .get(fetchUrl + `?news_id=${news_id}`, {
        news_id,
        mode: "edit",
      })
      .then(({ data: { news } }) => {
        setArticle(news);
        setLoading(false);
      })
      .catch((err) => {
        setArticle(null);
        setLoading(false);
        console.log(err);
      });
  }, [news_id]);

  return (
    <div className="min-h-screen bg-surface-2">
      {/* Loading State */}
      {loading && (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-fg-muted">Loading article...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && !article && (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-sm text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-danger sm:h-16 sm:w-16" />
            <h2 className="mb-2 text-xl font-bold text-fg sm:text-2xl">Article Not Found</h2>
            <p className="text-fg-muted">
              The article you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      )}

      {/* Article Content */}
      {!loading && article && (
        <div className="mx-auto max-w-6xl =sm:px-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {/* Main Content */}
            <div className="min-w-0 lg:col-span-3">
              <article className="overflow-hidden rounded-xl sm:rounded-2xl border border-line bg-surface shadow-sm">
                {/* Banner Image */}
                {article.banner && (
                  <div className="relative bg-surface-3">
                    <img
                      src={article.banner}
                      alt={article.title}
                      className="aspect-video w-full object-cover"
                    />
                    {(article.is_literature || article.isVideo) && (
                      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                        {article.is_literature ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-paper shadow sm:px-3 sm:py-1.5 sm:text-sm">
                            <FileText size={14} />
                            Literature
                          </span>
                        ) : <span />}
                        {article.isVideo && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger px-2.5 py-1 text-xs font-medium text-paper shadow sm:px-3 sm:py-1.5 sm:text-sm">
                            <Video size={14} />
                            Video Content
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 sm:p-6 md:p-8">
                  {/* Status + ID */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {article.news_id && <StatusPill tone="neutral">ID: {article.news_id}</StatusPill>}
                    {article.isPublished && <StatusPill tone="success" icon={CheckCircle}>Published</StatusPill>}
                    {article.draft && <StatusPill tone="warning" icon={AlertCircle}>Draft</StatusPill>}
                    {article.need_approval && <StatusPill tone="warning" icon={AlertCircle}>Needs Approval</StatusPill>}
                  </div>

                  {/* Title */}
                  <h1 className="mb-3 break-words text-xl font-semibold leading-snug text-fg sm:text-2xl lg:text-3xl lg:leading-tight">
                    {article.title}
                  </h1>

                  {/* Quick meta (author + date) */}
                  <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line pb-4 text-xs text-fg-muted sm:mb-6 sm:text-sm">
                    {(article.author?.username || article.author?.name) && (
                      <span className="inline-flex items-center gap-1.5">
                        <User size={14} />
                        {article.author?.username ? `@${article.author.username}` : article.author.name}
                      </span>
                    )}
                    {(article.post_time || article.createdAt) && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDate(article.post_time || article.createdAt)}
                      </span>
                    )}
                    {article.location && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{article.location}</span>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {article.description && (
                    <div className="mb-6 rounded-r-xl border-l-4 border-primary bg-surface-2 p-3 sm:p-4 md:mb-8 md:p-6">
                      <p className="text-base italic leading-relaxed text-fg-muted sm:text-lg">
                        {article.description}
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose max-w-none break-words md:prose-lg mb-8 [&_iframe]:max-w-full [&_img]:h-auto [&_img]:max-w-full [&_table]:block [&_table]:overflow-x-auto">
                    <NewsContent item={article} />
                  </div>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="border-t border-line pt-5 sm:pt-6">
                      <h3 className="mb-3 text-sm font-medium text-fg">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary sm:px-3 sm:text-sm"
                          >
                            <Tag size={13} />
                            {nm(tag, "title")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </div>

            {/* Sidebar: stacks on mobile, 2 columns on tablet, single column on desktop */}
            <aside className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 sm:gap-6 lg:col-span-1 lg:grid-cols-1">
              {/* Article Stats */}
              <SideCard title="Article Statistics" icon={Eye} className="sm:col-span-2 lg:col-span-1">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                  <div className="rounded-xl bg-surface-2 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                      <Eye size={14} />
                      Total Reads
                    </div>
                    <p className="mt-1 text-xl font-semibold text-fg">
                      {article.activity?.total_reads?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                      <Clock size={14} />
                      Today
                    </div>
                    <p className="mt-1 text-xl font-semibold text-success">
                      {article.activity?.total_today_count || 0}
                    </p>
                  </div>
                </div>
              </SideCard>

              {/* Publication Info */}
              <SideCard title="Publication Details" icon={Calendar}>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-1">
                  <Row label="Published" icon={Calendar}>{formatDate(article.post_time)}</Row>
                  <Row label="Author" icon={User}>@ {article.author?.username}</Row>

                  {article.ref_reporter && <Row label="Reporter">{article.ref_reporter}</Row>}
                  {article.updatedBy && <Row label="Last Updated By">@ {article.updatedBy.username}</Row>}
                  {article.approved_by && <Row label="Approved By">@{article.approved_by.username}</Row>}

                  <Row label="Created">{formatDate(article.createdAt)}</Row>
                  <Row label="Updated">{formatDate(article.updatedAt)}</Row>
                </dl>
              </SideCard>

              {/* Location Info */}
              <SideCard title="Location & Coverage" icon={MapPin}>
                <div className="space-y-4">
                  {article.location && (
                    <div>
                      <p className="text-xs font-medium text-fg-muted">Location</p>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-fg">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-fg-subtle" />
                        <span className="break-words">{article.location}</span>
                      </p>
                    </div>
                  )}

                  {article.state && article.state.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-fg-muted">States</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {article.state.map((state, index) => (
                          <Chip key={index} tone="success">{nm(state, "displayName", "state")}</Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {article.district && article.district.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-fg-muted">Districts</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {article.district.map((district, index) => (
                          <Chip key={index}>{nm(district, "displayName", "district")}</Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {article.category?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-fg-muted">Categories</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {article.category.map((c, index) => (
                          <Chip key={index}>{nm(c, "name")}</Chip>
                        ))}
                        {(article.subCategory || []).map((c, index) => (
                          <Chip key={`s${index}`} tone="neutral">{nm(c, "name")}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SideCard>

              {/* Video Section */}
              {article.isVideo && article.video && (
                <SideCard title="Video Content" icon={Video} className="sm:col-span-2 lg:col-span-1">
                  <div className="rounded-xl bg-surface-2 p-3 sm:p-4">
                    <p className="mb-1 text-xs text-fg-muted">Video URL</p>
                    <p className="break-all text-xs text-primary">{article.video}</p>
                  </div>
                </SideCard>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDetails;