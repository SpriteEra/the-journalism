// src/components/NotificationItem.jsx
import React from "react";
import { Clock, ExternalLink, Check } from "lucide-react";

const tone = (priority) =>
  priority === "urgent"
    ? "bg-danger-soft text-danger"
    : priority === "high"
      ? "bg-warning-soft text-warning"
      : "bg-primary-soft text-primary";

const actorLabels = [
  ["updatedBy", "Updated by"],
  ["deletedBy", "Deleted by"],
  ["createdBy", "Created by"],
  ["restoredBy", "Restored by"],
  ["publishedBy", "Published by"],
];

const NotificationItem = ({
  notification,
  isRead,
  onClick,
  onMarkRead,
  getIcon,
  formatTime,
}) => {
  const clickable = notification?.eventData?.clickable !== false;
  const actors = actorLabels.filter(([k]) => notification.eventData?.[k]);
  const extra = notification.additionalData
    ? Object.entries(notification.additionalData)
    : [];

  return (
    <div
      onClick={onClick}
      className={`group relative flex gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2 ${clickable ? "cursor-pointer" : ""
        } ${!isRead ? "bg-primary-soft/40" : ""}`}
    >
      {/* Unread marker */}
      {!isRead && (
        <span
          aria-label="Unread"
          className="absolute left-1.5 top-5 size-1.5 rounded-full bg-primary"
        />
      )}

      {/* Icon */}
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone(
          notification.priority
        )}`}
      >
        {getIcon(notification.type, notification.category)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4
            className={`truncate text-sm ${!isRead ? "font-semibold text-fg" : "font-medium text-fg-muted"
              }`}
          >
            {notification.title}
          </h4>
          <span className="flex shrink-0 items-center gap-1 text-xs text-fg-faint">
            {notification.link && <ExternalLink className="size-3" />}
            {formatTime(notification.createdAt || notification.timestamp)}
          </span>
        </div>

        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-fg-subtle">
          {notification.body}
        </p>

        {actors.length > 0 && (
          <p className="mt-1.5 text-xs text-fg-faint">
            {actors
              .map(([k, label]) => `${label} @${notification.eventData[k]}`)
              .join(" · ")}
          </p>
        )}

        {extra.length > 0 && (
          <div className="mt-2 space-y-0.5 rounded-lg bg-warning-soft px-2.5 py-1.5 text-xs text-warning">
            {extra.map(([key, value]) => (
              <div key={key}>
                {key}: {typeof value === "object" ? JSON.stringify(value) : value}
              </div>
            ))}
          </div>
        )}

        {notification.expiresAt && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-warning">
            <Clock className="size-3" />
            Expires{" "}
            {new Date(notification.expiresAt).toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}
          </p>
        )}
      </div>

      {/* Quick action: mark as read */}
      {!isRead && (
        <button
          type="button"
          aria-label="Mark as read"
          title="Mark as read"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead();
          }}
          className="absolute bottom-2 right-3 grid size-7 place-items-center rounded-full border border-line bg-surface text-fg-subtle opacity-100 shadow-sm transition hover:text-primary sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Check className="size-3.5" />
        </button>
      )}
    </div>
  );
};

export default NotificationItem;