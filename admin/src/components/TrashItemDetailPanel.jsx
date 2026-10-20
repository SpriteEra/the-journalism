import React, { useEffect, useState } from "react";
import SlidePanel from "../utils/SlidePannel";
import httpClient from "../api/httpClient";
import {
  Calendar,
  User,
  Tag,
  MapPin,
  Eye,
  TrendingUp,
  FileText,
  Image,
  Video,
  Globe,
  Clock,
  Hash,
  AlertCircle,
  CheckCircle,
  Edit,
  Mail,
  Phone,
  Home,
  Shield,
  Camera,
  FileImage,
  ImageOff,
  Images,
  ExternalLink,
  Play,
  Youtube,
  Copy,
} from "lucide-react";
import useTaxonomyNames from "../hooks/useTaxonomyNames";
import NewsContent from "../utils/BlogContent";

const TrashItemDetailPanel = ({ docId, isOpen, onClose }) => {
  const nameOf = useTaxonomyNames();
  const [loading, setLoading] = useState(false);
  const [trashDetail, setTrashDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId || !isOpen) return;

    setLoading(true);
    setError(null);

    httpClient
      .get(`trash/${docId}`)
      .then((response) => {
        setTrashDetail(response.data);
      })
      .catch((err) => {
        setError("Failed to load trash item details");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [docId, isOpen]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  };

  const InfoItem = ({ icon: Icon, label, children, className = "" }) => (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg bg-surface-2 ${className}`}
    >
      <Icon
        size={18}
        className="text-primary mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-fg-muted block mb-1">
          {label}
        </span>
        <div className="text-fg">{children}</div>
      </div>
    </div>
  );

  const StatusBadge = ({
    condition,
    trueText,
    falseText,
    trueColor = "green",
    falseColor = "gray",
  }) => {
    if (condition === undefined || condition === null) return null;

    const colorClasses = {
      green:
        "bg-success-soft text-success",
      red: "bg-danger-soft text-danger",
      blue: "bg-primary-soft text-primary",
      yellow:
        "bg-warning-soft text-warning",
      purple:
        "bg-primary-soft text-primary",
      gray: "bg-surface-2 text-fg",
    };

    const isActive = condition === true;
    const text = isActive ? trueText : falseText;
    const colorClass = colorClasses[isActive ? trueColor : falseColor];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {text}
      </span>
    );
  };

  const TagList = ({ tags, title }) => {
    if (!tags || tags.length === 0) return null;

    return (
      <InfoItem icon={Tag} label={title}>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-soft text-primary"
            >
              {typeof tag === "object" ? tag.title : /^[a-f0-9]{24}$/i.test(String(tag)) ? "tag" : tag}
            </span>
          ))}
        </div>
      </InfoItem>
    );
  };

  const ActivityStats = ({ activity }) => {
    if (!activity) return null;

    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-soft">
          <Eye size={16} className="text-primary" />
          <div>
            <div className="text-sm font-medium text-fg-muted">
              Total Reads
            </div>
            <div className="text-lg font-semibold text-fg">
              {activity.total_reads || 0}
            </div>
          </div>
        </div>
        {/* <div className="flex items-center gap-2 p-3 rounded-lg bg-success-soft">
          <TrendingUp
            size={16}
            className="text-success"
          />
          <div>
            <div className="text-sm font-medium text-fg-muted">
              Today's Count
            </div>
            <div className="text-lg font-semibold text-fg">
              {activity.total_today_count || 0}
            </div>
          </div>
        </div> */}
      </div>
    );
  };

  const renderModelSpecificContent = (docData, model) => {
    if (!docData) return null;

    const renderCommonInfo = () => (
      <>
        {docData.news_id && (
          <InfoItem icon={Hash} label="News ID">
            <span className="font-mono text-sm">{docData.news_id}</span>
          </InfoItem>
        )}

        {docData.title && (
          <InfoItem icon={FileText} label="Title">
            <h3 className="font-semibold text-lg">{docData.title}</h3>
          </InfoItem>
        )}

        {docData.description && (
          <InfoItem icon={FileText} label="Description">
            <p className="text-sm leading-relaxed">{docData.description}</p>
          </InfoItem>
        )}

        {docData.post_time && (
          <InfoItem icon={Calendar} label="Post Time">
            {formatDate(docData.post_time)}
          </InfoItem>
        )}
      </>
    );

    switch (model) {
      case "News":
        return (
          <div className="space-y-4">
            {renderCommonInfo()}

            {/* Banner Section */}
            {docData.banner && (
              <InfoItem icon={Image} label="Banner">
                <div className="space-y-2">
                  <img
                    src={docData.banner}
                    alt="News Banner"
                    className="w-full h-48 object-cover rounded-lg border border-line"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <div className="hidden text-sm text-fg-subtle p-4 bg-surface-2 rounded-lg text-center">
                    Banner image failed to load
                  </div>
                  <div className="text-xs text-fg-subtle">
                    {docData.banner}
                  </div>
                </div>
              </InfoItem>
            )}

            {/* Image Reference Section */}
            {docData.imageRef && (
              <InfoItem icon={FileImage} label="Image Reference">
                <div className="space-y-2">
                  <div className="text-sm font-mono bg-surface-2 p-3 rounded border">
                    {docData.imageRef}
                  </div>
                  <div className="text-xs text-fg-subtle">
                    Image reference identifier
                  </div>
                </div>
              </InfoItem>
            )}

            {docData.location ||
              docData.state?.length ||
              docData.district?.length ? (
              <InfoItem icon={MapPin} label="Location Details">
                <div className="space-y-2">
                  {docData.location && (
                    <div className="text-sm">
                      <span className="font-medium">Location: </span>
                      {docData.location}
                    </div>
                  )}
                  {docData.state?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-fg-muted block mb-1">
                        States:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {docData.state.map((state, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-primary-soft text-primary rounded capitalize"
                          >
                            {nameOf(state) || "—"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {docData.district?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-fg-muted block mb-1">
                        Districts:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {docData.district.map((district, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-primary-soft text-primary rounded"
                          >
                            {nameOf(district) || "—"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </InfoItem>
            ) : null}

            {docData.category?.length > 0 && (
              <TagList tags={docData.category.map((c) => nameOf(c) || "—")} title="Categories" />
            )}

            {docData.tags?.length > 0 && (
              <TagList tags={docData.tags} title="Topics" />
            )}

            <div className="p-4 rounded-lg bg-surface-2">
              <h4 className="font-medium text-fg mb-3 flex items-center gap-2">
                <Shield size={16} />
                Status & Flags
              </h4>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  condition={docData.isPublished}
                  trueText="Published"
                  falseText="Unpublished"
                  trueColor="green"
                  falseColor="gray"
                />
                <StatusBadge
                  condition={docData.draft}
                  trueText="Draft"
                  falseText="Final"
                  trueColor="yellow"
                  falseColor="green"
                />
                <StatusBadge
                  condition={docData.isVideo}
                  trueText="Video Content"
                  falseText="No Video"
                  trueColor="purple"
                  falseColor="blue"
                />
                <StatusBadge
                  condition={docData.is_anonymous}
                  trueText="Anonymous"
                  falseText="Authored"
                  trueColor="purple"
                  falseColor="blue"
                />
              </div>
            </div>

            {docData.is_anonymous && docData.anonymous_data && (
              <div className="p-4 rounded-lg bg-primary-soft border border-primary/30">
                <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                  <User size={16} />
                  Anonymous Submission Details
                </h4>
                <div className="space-y-2 text-sm">
                  {docData.anonymous_data.author_name && (
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      <span className="font-medium">Name:</span>{" "}
                      {docData.anonymous_data.author_name}
                    </div>
                  )}
                  {docData.anonymous_data.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span className="font-medium">Email:</span>{" "}
                      {docData.anonymous_data.email}
                    </div>
                  )}
                  {docData.anonymous_data.contact && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span className="font-medium">Contact:</span>{" "}
                      {docData.anonymous_data.contact}
                    </div>
                  )}
                  {docData.anonymous_data.address && (
                    <div className="flex items-center gap-2">
                      <Home size={14} />
                      <span className="font-medium">Address:</span>{" "}
                      {docData.anonymous_data.address}
                    </div>
                  )}
                  {docData.anonymous_data.requested_on && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span className="font-medium">Requested On:</span>{" "}
                      {formatDate(docData.anonymous_data.requested_on)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {docData.activity && <ActivityStats activity={docData.activity} />}

            {docData.content && <NewsContent item={docData} />}
          </div>
        );

      case "YtNews":
        return (
          <div className="space-y-4">
            {renderCommonInfo()}

            {/* Description Section */}
            {docData.description && (
              <InfoItem icon={FileText} label="Description">
                <div className="text-sm text-fg-muted leading-relaxed">
                  {docData.description}
                </div>
              </InfoItem>
            )}

            {docData.videoLinkId && (
              <InfoItem icon={Video} label="YouTube Video">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-danger-soft rounded-lg">
                    <Video
                      size={16}
                      className="text-danger"
                    />
                    <span className="font-mono text-sm text-danger">
                      {docData.videoLinkId}
                    </span>
                    <a
                      href={`https://youtube.com/watch?v=${docData.videoLinkId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto p-1 hover:bg-danger-soft rounded transition-colors"
                      title="Open in YouTube"
                    >
                      <ExternalLink
                        size={14}
                        className="text-danger"
                      />
                    </a>
                  </div>

                  {/* YouTube Video Thumbnail */}
                  <div className="aspect-video bg-surface-2 rounded-lg overflow-hidden border border-line relative group">
                    <img
                      src={`https://img.youtube.com/vi/${docData.videoLinkId}/maxresdefault.jpg`}
                      alt={`YouTube Video: ${docData.title || "Video Thumbnail"
                        }`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to high quality thumbnail if maxresdefault fails
                        e.target.src = `https://img.youtube.com/vi/${docData.videoLinkId}/hqdefault.jpg`;
                        e.target.onerror = (err) => {
                          // Final fallback to default thumbnail
                          err.target.src = `https://img.youtube.com/vi/${docData.videoLinkId}/default.jpg`;
                          err.target.onerror = (finalErr) => {
                            // If all thumbnails fail, show placeholder
                            finalErr.target.style.display = "none";
                            finalErr.target.nextSibling.style.display = "flex";
                          };
                        };
                      }}
                    />

                    {/* Fallback placeholder */}
                    <div className="w-full h-full flex items-center justify-center text-center">
                      <div>
                        <Video
                          size={48}
                          className="text-fg-faint mx-auto mb-2"
                        />
                        <p className="text-sm text-fg-subtle">
                          YouTube Video Preview
                        </p>
                        <p className="text-xs text-fg-faint mt-1">
                          Thumbnail not available
                        </p>
                      </div>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-danger hover:bg-danger-hover text-paper rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform duration-200">
                        <Play size={24} fill="currentColor" />
                      </div>
                    </div>

                    {/* Click overlay to open video */}
                    <a
                      href={`https://youtube.com/watch?v=${docData.videoLinkId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-10"
                      aria-label="Watch YouTube video"
                    />
                  </div>

                  {/* Video Info */}
                  <div className="flex items-center justify-between text-xs text-fg-subtle">
                    <div className="flex items-center gap-1">
                      <Youtube size={12} className="text-danger" />
                      <span>Click thumbnail to watch on YouTube</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigator.clipboard?.writeText(
                            `https://youtube.com/watch?v=${docData.videoLinkId}`
                          )
                        }
                        className="flex items-center gap-1 hover:text-fg-muted transition-colors"
                        title="Copy YouTube URL"
                      >
                        <Copy size={12} />
                        <span>Copy URL</span>
                      </button>
                    </div>
                  </div>
                </div>
              </InfoItem>
            )}

            {docData.tags?.length > 0 && (
              <TagList tags={docData.tags} title="Topics" />
            )}

            {docData.activity && <ActivityStats activity={docData.activity} />}
          </div>
        );
      case "EventNews":
        return (
          <div className="space-y-4">
            {renderCommonInfo()}

            {docData.event_type && (
              <InfoItem icon={Tag} label="Event Type">
                <span className="px-3 py-1 bg-warning-soft text-warning rounded-full text-sm font-medium">
                  {docData.event_type}
                </span>
              </InfoItem>
            )}

            {docData.banner && (
              <InfoItem icon={Image} label="Event Banner">
                <div className="aspect-video bg-surface-2 rounded-lg overflow-hidden">
                  <img
                    src={docData.banner}
                    alt="Event Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              </InfoItem>
            )}

            <div className="flex flex-wrap gap-2">
              <StatusBadge
                condition={docData.draft}
                trueText="Draft"
                falseText="Published"
                trueColor="yellow"
                falseColor="green"
              />
            </div>

            {docData.activity && <ActivityStats activity={docData.activity} />}
          </div>
        );

      case "GalleryNews":
        return (
          <div className="space-y-4">
            {renderCommonInfo()}

            {docData.location && (
              <InfoItem icon={MapPin} label="Location">
                {docData.location}
              </InfoItem>
            )}

            {docData.tags?.length > 0 && (
              <TagList tags={docData.tags} title="Topics" />
            )}

            <div className="flex flex-wrap gap-2">
              <StatusBadge
                condition={docData.draft}
                trueText="Draft"
                falseText="Published"
                trueColor="yellow"
                falseColor="green"
              />
              <StatusBadge
                condition={docData.published}
                trueText="Published"
                falseText="Unpublished"
                trueColor="green"
                falseColor="gray"
              />
            </div>

            {docData.activity && <ActivityStats activity={docData.activity} />}

            {/* Complete Photo Gallery Section */}
            {docData.photos?.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary-soft to-primary-soft border border-primary/30">
                <h4 className="font-medium text-primary mb-4 flex items-center gap-2">
                  <Images size={16} />
                  Complete Photo Gallery ({docData.photos.length} photos)
                </h4>
                <div className="space-y-6">
                  {docData.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="bg-surface rounded-lg p-4 border border-primary/30"
                    >
                      <div className="flex flex-col gap-4">
                        {/* Photo Image */}
                        <div className="flex-shrink-0">
                          <div className="w-full h-48 bg-surface-2 rounded-lg overflow-hidden">
                            <img
                              src={photo.image}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div className="w-full h-full flex items-center justify-center text-sm text-fg-subtle bg-surface-2">
                              <div className="text-center">
                                <ImageOff size={20} className="mx-auto mb-1" />
                                <div>Image failed to load</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Photo Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <h5 className="font-semibold text-lg text-fg">
                              {photo.title}
                            </h5>
                            <span className="text-xs text-fg-subtle bg-surface-2 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                                Description
                              </label>
                              <p className="text-sm text-fg-muted mt-1">
                                {photo.description}
                              </p>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                                Image URL
                              </label>
                              <div className="mt-1 text-xs font-mono bg-surface-2 p-2 rounded border break-all">
                                {photo.image}
                              </div>
                            </div>
                          </div>

                          {/* Photo Actions/Info */}
                          <div className="flex items-center justify-between pt-2 border-t border-line">
                            <div className="flex items-center gap-4 text-xs text-fg-subtle">
                              <div className="flex items-center gap-1">
                                <FileImage size={12} />
                                <span>Image</span>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(photo.image, "_blank")}
                              className="text-xs text-primary hover:text-primary font-medium"
                            >
                              View Full Size
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "User":
        return (
          <div className="space-y-4">
            <InfoItem icon={User} label="Username">
              <span className="font-semibold">{docData.username}</span>
            </InfoItem>

            {docData.fullName && (
              <InfoItem icon={User} label="Full Name">
                {docData.fullName}
              </InfoItem>
            )}

            {docData.email && (
              <InfoItem icon={Mail} label="Email">
                {docData.email}
              </InfoItem>
            )}

            {docData.profile && (
              <InfoItem icon={Image} label="Profile Picture">
                <div className="w-20 h-20 bg-surface-2 rounded-full overflow-hidden">
                  <img
                    src={docData.profile}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </InfoItem>
            )}

            {docData.role && (
              <InfoItem icon={Shield} label="Role">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${docData.role === "admin"
                      ? "bg-danger-soft text-danger"
                      : "bg-primary-soft text-primary"
                    }`}
                >
                  {docData.role}
                </span>
              </InfoItem>
            )}

            {docData.account_info && (
              <InfoItem icon={FileText} label="Account Statistics">
                <div className="text-lg font-semibold">
                  {docData.account_info.total_news || 0} Total News
                </div>
              </InfoItem>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 rounded-lg bg-warning-soft border border-warning/30">
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle size={16} />
              <span className="font-medium">Unknown Model Type: {model}</span>
            </div>
            <pre className="mt-2 text-xs overflow-auto bg-surface p-2 rounded border">
              {JSON.stringify(docData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Trash Item Details"
      width="500px"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-danger-soft border border-danger/30">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle size={16} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && trashDetail && (
        <div className="space-y-6">
          {/* Trash Metadata */}
          <div className="p-4 rounded-lg bg-danger-soft border border-danger/30">
            <h3 className="font-semibold text-danger mb-3 flex items-center gap-2">
              <AlertCircle size={16} />
              Deletion Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} className="text-danger" />
                <span className="font-medium">Deleted By:</span>
                {trashDetail.deletedBy?.username ||
                  trashDetail.deletedBy?.fullName ||
                  "System"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar
                  size={14}
                  className="text-danger"
                />
                <span className="font-medium">Deleted At:</span>
                {formatDate(trashDetail.deletedAt)}
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-danger" />
                <span className="font-medium">Content Type:</span>
                <span className="px-2 py-0.5 bg-danger-soft text-danger rounded text-xs">
                  {trashDetail.model}
                </span>
              </div>
              {trashDetail.reason && (
                <div className="flex items-start gap-2">
                  <FileText
                    size={14}
                    className="text-danger mt-0.5"
                  />
                  <span className="font-medium">Reason:</span>
                  <span className="flex-1">{trashDetail.reason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content Details */}
          <div>
            <h3 className="font-semibold text-fg mb-4 flex items-center gap-2">
              <FileText size={16} />
              Content Details
            </h3>
            {renderModelSpecificContent(trashDetail.docId, trashDetail.model)}
          </div>
        </div>
      )}

      {!loading && !error && !trashDetail && (
        <div className="flex flex-col items-center justify-center py-12 text-fg-subtle">
          <AlertCircle size={48} className="mb-4" />
          <p className="text-lg font-medium">No details found</p>
          <p className="text-sm">
            The trash item may have been permanently deleted.
          </p>
        </div>
      )}
    </SlidePanel>
  );
};

export default TrashItemDetailPanel;
