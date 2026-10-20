// src/components/NotificationItem.jsx
import React, { useState } from "react";
import { Clock, ExternalLink, Check, MoreVertical } from "lucide-react";
import { useSelector } from "react-redux";
import httpClient from "../../api/httpClient";
import toast from "react-hot-toast";

const NotificationItem = ({
  notification,
  onClick,
  onMarkRead,
  onDelete,
  getIcon,
  formatTime,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { user: admin } = useSelector((state) => state.user);

  const me = String(admin?._id || admin?.id || "");
  const isRead = notification.isRead ?? Boolean(notification.readBy?.some((r) => String(r.userId) === me));

  // Delete notification function
  const deleteNotification = async () => {
    setIsDeleting(true);
    try {
      const notificationId = notification.id || notification._id;

      const { data } = await httpClient.delete(`notifications/${notificationId}`);

      if (data.success) {
        toast.success("Notification deleted successfully");

        if (onDelete) {
          onDelete(notificationId);
        }
      }
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
      toast.error("Failed to delete notification. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Archive notification function
  const archiveNotification = async () => {
    setIsArchiving(true);
    try {
      const notificationId = notification.id || notification._id;

      const { data } = await httpClient.patch(`notifications/${notificationId}/archive`);

      if (data.success) {
        toast.success("Notification archived successfully");

        if (onDelete) {
          onDelete(notificationId);
        }
      }
    } catch (error) {
      console.error("❌ Error archiving notification:", error);
      toast.error("Failed to archive notification. Please try again.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    setShowActions(false);

    switch (action) {
      case "markRead":
        onMarkRead();
        break;
      case "archive":
        if (
          window.confirm("Are you sure you want to archive this notification?")
        ) {
          archiveNotification();
        }
        break;
      case "delete":
        if (
          window.confirm("Are you sure you want to delete this notification?")
        ) {
          deleteNotification();
        }
        break;
    }
  };

  const hasUsefulEventData = (eventData) => {
    if (!eventData) return false;

    const allowedKeys = ["title", "body", "link", "author"];
    const actualKeys = Object.keys(eventData);

    // Keep only keys that are NOT in allowedKeys
    const relevantKeys = actualKeys.filter((k) => !allowedKeys.includes(k));

    return relevantKeys.length > 0;
  };

  // Close actions menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowActions(false);
    };

    if (showActions) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showActions]);

  return (
    <div
      className={`relative p-4 border-b border-line hover:bg-surface-2 ${
        notification?.eventData?.clickable === false ? "" : "cursor-pointer"
      } transition-colors group ${
        !isRead
          ? "bg-primary-soft border-l-4 border-l-primary"
          : ""
      } ${isDeleting || isArchiving ? "opacity-50 pointer-events-none" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 p-2 rounded-full ${
            notification.priority === "urgent"
              ? "bg-danger-soft text-danger"
              : notification.priority === "high"
              ? "bg-warning-soft text-warning"
              : "bg-primary-soft text-primary"
          }`}
        >
          {getIcon(notification.type, notification.category)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4
                className={`text-sm font-medium ${
                  !isRead
                    ? "text-fg"
                    : "text-fg-muted"
                }`}
              >
                {notification.title}
              </h4>
              <p className="text-sm text-fg-subtle mt-1 line-clamp-2">
                {notification.body}
              </p>
            </div>

            {/* Actions */}
            {!isRead && (
              <div className="relative ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  className="p-1 hover:bg-surface-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isDeleting || isArchiving}
                >
                  <MoreVertical className="w-4 h-4 text-fg-faint" />
                </button>

                {showActions && (
                  <div className="absolute right-0 top-6 bg-surface border border-line rounded-lg shadow-lg z-10 py-1 w-32">
                    {!isRead && (
                      <button
                        onClick={(e) => handleActionClick(e, "markRead")}
                        className="w-full px-3 py-2 text-left text-sm text-fg-muted hover:bg-surface-2 flex items-center space-x-2"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meta Information */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2 text-xs text-fg-faint">
              <span>
                {formatTime(notification.createdAt || notification.timestamp)}
              </span>
              {notification.link && <ExternalLink className="w-3 h-3" />}
            </div>
          </div>

          {/* Event Data Preview */}
          {hasUsefulEventData(notification.eventData) && (
            <div className="mt-2 p-2 bg-surface-2 rounded text-xs">
              <div className="font-medium text-fg-muted mb-1">
                Details:
              </div>
              <div className="text-fg-muted space-y-1">
                {notification.eventData.updatedBy && (
                  <div>Updated By: @{notification.eventData.updatedBy}</div>
                )}
                {notification.eventData.deletedBy && (
                  <div>Deleted By: @{notification.eventData.deletedBy}</div>
                )}
                {notification.eventData.createdBy && (
                  <div>Created By: @{notification.eventData.createdBy}</div>
                )}
                {notification.eventData.restoredBy && (
                  <div>Restored By: @{notification.eventData.restoredBy}</div>
                )}
                {notification.eventData.publishedBy && (
                  <div>Published By: @{notification.eventData.publishedBy}</div>
                )}
              </div>
            </div>
          )}

          {/* Additional Data */}
          {notification.additionalData &&
            Object.keys(notification.additionalData).length > 0 && (
              <div className="mt-2 p-2 bg-warning-soft rounded text-xs">
                <div className="font-medium text-warning mb-1">
                  Additional Info:
                </div>
                <div className="text-warning space-y-1">
                  {Object.entries(notification.additionalData).map(
                    ([key, value]) => (
                      <div key={key}>
                        {key}:{" "}
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : value}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Expiry Information */}
          {notification.expiresAt && (
            <div className="mt-2 text-xs text-warning">
              <Clock className="w-3 h-3 inline mr-1" />
              Expires: {new Date(notification.expiresAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
            </div>
          )}
        </div>

        {/* Unread Indicator */}
        {!isRead && (
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
