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
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-fg-muted">
              Loading article...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && !article && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-fg mb-2">
              Article Not Found
            </h2>
            <p className="text-fg-muted">
              The article you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      )}

      {/* Article Content */}
      {!loading && article && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <article className="bg-surface rounded-lg shadow-lg overflow-hidden">
                {/* Banner Image */}
                {article.banner && (
                  <div className="relative">
                    <img
                      src={article.banner}
                      alt={article.title}
                      className="w-full aspect-video object-cover"
                    />
                    {article.isVideo && (
                      <div className="absolute top-4 right-4 bg-danger text-paper px-3 py-2 rounded-full flex items-center gap-2">
                        <Video size={16} />
                        <span>Video Content</span>
                      </div>
                    )}
                    {article.is_literature && (
                      <div className="absolute top-4 left-4 bg-primary text-paper px-3 py-2 rounded-full flex items-center gap-2">
                        <FileText size={16} />
                        <span>Literature</span>
                      </div>
                    )}

                    {/* Status Badges on Image */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <span className="text-sm font-medium text-primary bg-ink bg-opacity-50 px-3 py-1 rounded-full">
                        News ID: {article.news_id}
                      </span>
                      {article.isPublished && (
                        <span className="flex items-center gap-1 bg-success bg-opacity-90 text-paper text-xs px-2 py-1 rounded-full">
                          <CheckCircle size={12} />
                          Published
                        </span>
                      )}
                      {article.draft && (
                        <span className="flex items-center gap-1 bg-warning bg-opacity-90 text-paper text-xs px-2 py-1 rounded-full">
                          <AlertCircle size={12} />
                          Draft
                        </span>
                      )}
                      {article.need_approval && (
                        <span className="flex items-center gap-1 bg-warning bg-opacity-90 text-paper text-xs px-2 py-1 rounded-full">
                          <AlertCircle size={12} />
                          Needs Approval
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 md:p-8">
                  {/* Title */}
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-fg mb-6 leading-tight">
                    {article.title}
                  </h1>

                  {/* Description */}
                  {article.description && (
                    <div className="bg-surface-2 border-l-4 border-primary p-4  md:p-6 mb-6 md:mb-8">
                      <p className="text-lg text-fg-muted leading-relaxed italic">
                        {article.description}
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div className="prose prose-lg max-w-none mb-8">
                    <NewsContent item={article} />
                  </div>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="border-t border-line pt-6">
                      <h3 className="text-sm font-medium text-fg mb-3">
                        Tags:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-primary-soft text-primary text-sm px-3 py-1 rounded-full hover:bg-primary-soft cursor-pointer"
                          >
                            <Tag size={14} />
                            {nm(tag, "title")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Article Stats */}
              <div className="bg-surface rounded-lg shadow-lg p-4 md:p-6">
                <h3 className="font-semibold text-fg mb-4">
                  Article Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-fg-muted">
                      <Eye size={16} />
                      <span>Total Reads</span>
                    </div>
                    <span className="font-semibold text-fg">
                      {article.activity?.total_reads?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-fg-muted">
                      <Clock size={16} />
                      <span>Today</span>
                    </div>
                    <span className="font-semibold text-success">
                      {article.activity?.total_today_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publication Info */}
              <div className="bg-surface rounded-lg shadow-lg p-4 md:p-6">
                <h3 className="font-semibold text-fg mb-4">
                  Publication Details
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-fg-muted">
                      Published:
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={14} className="" />
                      <span className="text-fg">
                        {formatDate(article.post_time)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-fg-muted">
                      Author:
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <User size={14} className="" />
                      <span className="text-fg">
                        @ {article.author?.username}
                      </span>
                    </div>
                  </div>

                  {article.ref_reporter && (
                    <div>
                      <label className="text-fg-muted">
                        Reporter:
                      </label>
                      <p className="text-fg mt-1">
                        {article.ref_reporter}
                      </p>
                    </div>
                  )}

                  {article.updatedBy && (
                    <div>
                      <label className="text-fg-muted">
                        Last Updated By:
                      </label>
                      <p className="text-fg mt-1">
                        @ {article.updatedBy.username}
                      </p>
                    </div>
                  )}

                  {article.approved_by && (
                    <div>
                      <label className="text-fg-muted">
                        Approved By:
                      </label>
                      <p className="text-fg mt-1">
                        @{article.approved_by.username}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-fg-muted">
                      Created:
                    </label>
                    <p className="text-fg mt-1">
                      {formatDate(article.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="text-fg-muted">
                      Updated:
                    </label>
                    <p className="text-fg mt-1">
                      {formatDate(article.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-surface rounded-lg shadow-lg p-4 md:p-6">
                <h3 className="font-semibold text-fg mb-4">
                  Location & Coverage
                </h3>

                <div className="space-y-4">
                  {article.location && (
                    <div>
                      <div className="flex items-center gap-2 text-fg-muted mb-2">
                        <MapPin size={16} />
                        <span className="font-medium">Location</span>
                      </div>
                      <p className="text-fg">
                        {article.location}
                      </p>
                    </div>
                  )}

                  {article.state && article.state.length > 0 && (
                    <div>
                      <label className="text-fg-muted text-sm">
                        States:
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {article.state.map((state, index) => (
                          <span
                            key={index}
                            className="bg-success-soft text-success text-xs px-2 py-1 rounded"
                          >
                            {nm(state, "displayName", "state")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {article.district && article.district.length > 0 && (
                    <div>
                      <label className="text-fg-muted text-sm">
                        Districts:
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {article.district.map((district, index) => (
                          <span
                            key={index}
                            className="bg-primary-soft text-primary text-xs px-2 py-1 rounded"
                          >
                            {nm(district, "displayName", "district")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {article.category?.length > 0 && (
                    <div>
                      <label className="text-fg-muted text-sm">Categories:</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {article.category.map((c, index) => (
                          <span key={index} className="bg-primary-soft text-primary text-xs px-2 py-1 rounded">{nm(c, "name")}</span>
                        ))}
                        {(article.subCategory || []).map((c, index) => (
                          <span key={`s${index}`} className="bg-surface-3 text-fg-muted text-xs px-2 py-1 rounded">{nm(c, "name")}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Section */}
              {article.isVideo && article.video && (
                <div className="bg-surface rounded-lg shadow-lg p-4 md:p-6">
                  <h3 className="font-semibold text-fg mb-4 flex items-center gap-2">
                    <Video size={18} />
                    Video Content
                  </h3>
                  <div className="bg-surface-2 p-4 rounded text-center">
                    <p className="text-fg-muted text-sm mb-2">
                      Video URL:
                    </p>
                    <p className="text-primary text-xs break-all">
                      {article.video}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDetails;
