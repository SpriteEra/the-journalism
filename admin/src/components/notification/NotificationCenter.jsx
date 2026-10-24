import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell,
  X,
  Search,
  CheckCheck,
  Clock,
  AlertCircle,
  Info,
  Gift,
  Settings,
  Calendar,
  ChevronDown,
  MessageCircle,
  Users,
  FileText,
} from "lucide-react";
import { useSelector } from "react-redux";
import NotificationItem from "./NotificationItem";
import httpClient from "../../api/httpClient";
import useSocket from "../../hooks/useSocket";
import { useNavigate } from "react-router-dom";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const { user: admin } = useSelector((state) => state.user);
  const { newNotifications, isConnected, clearNewNotifications } = useSocket();

  const navigate = useNavigate();
  const rootRef = useRef(null);

  // Calculate unread count from notifications
  const calculateUnreadCount = useCallback(() => {
    if (!admin?.id) return 0;

    return notifications.filter((notification) => {
      if (notification.readBy && Array.isArray(notification.readBy)) {
        return !notification.readBy.some(
          (read) => read.userId?.toString() === admin.id?.toString()
        );
      }
      return !notification.isRead;
    })?.length;
  }, [notifications, admin?.id]);

  const unreadCount = calculateUnreadCount();

  // Merge new socket notifications with existing notifications
  useEffect(() => {
    if (newNotifications?.length > 0) {
      setNotifications((prev) => {
        // Merge new notifications, avoiding duplicates
        const merged = [...newNotifications, ...prev];
        const unique = merged.filter(
          (notification, index, self) =>
            index ===
            self.findIndex(
              (n) => (n.id || n._id) === (notification.id || notification._id)
            )
        );

        // Sort by date
        return unique.sort(
          (a, b) =>
            new Date(b.createdAt || b.timestamp) -
            new Date(a.createdAt || a.timestamp)
        );
      });

      // Clear processed notifications from socket
      clearNewNotifications();
    }
  }, [newNotifications, clearNewNotifications]);

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, append = false) => {
    if (!admin?.id) return;

    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: page,
        limit: 15,
      });

      const { data } = await httpClient.get(
        `notifications/${admin.id}?${params}`
      );
      const newNotifications = data.notifications || [];

      if (append) {
        setNotifications((prev) => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      setTotalNotifications(data.total || 0);
      setHasMore(data.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Mark single notification as read (API only)
  const markAsRead = async (notificationId) => {
    try {
      await httpClient.patch(`notifications/${notificationId}/read`, {
        userId: admin.id,
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => {
          if ((n.id || n._id) === notificationId) {
            const readBy = n.readBy || [];
            const isAlreadyRead = readBy.some(
              (read) => read.userId?.toString() === admin.id?.toString()
            );

            if (!isAlreadyRead) {
              return {
                ...n,
                readBy: [...readBy, { userId: admin.id, readAt: new Date() }],
              };
            }
          }
          return n;
        })
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read (API only)
  const handleMarkAllRead = async () => {
    try {
      await httpClient.patch(`notifications/mark-all-read`, {
        userId: admin.id,
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readBy: [
            ...(n.readBy || []).filter(
              (read) => read.userId?.toString() !== admin.id?.toString()
            ),
            { userId: admin.id, readAt: new Date() },
          ],
        }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Filter notifications by search term
  const filteredNotifications = notifications.filter((notification) => {
    if (!searchTerm) return true;

    return (
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.body.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(currentPage + 1, true);
    }
  };

  // Load notifications when component mounts or opens
  useEffect(() => {
    if (isOpen && admin?.id) {
      fetchNotifications(1, false);
    }
  }, [isOpen, admin?.id]);

  // Reset when opening notification center
  const handleToggleOpen = () => {
    if (!isOpen) {
      setCurrentPage(1);
      setNotifications([]);
    }
    setIsOpen(!isOpen);
  };

  // Icon functions with theme support
  const getNotificationIcon = (type, category) => {
    const iconClass = "w-5 h-5";
    switch (type || category) {
      case "newsAdded":
      case "newsUpdated":
      case "newsDeleted":
      case "eventNews":
      case "news":
        return <FileText className={iconClass} />;
      case "newUserRegistration":
      case "userBlocked":
      case "userApproved":
      case "user":
        return <Users className={iconClass} />;
      case "assignmentNew":
      case "assignmentUpdate":
      case "assignmentComplete":
      case "assignment":
        return <Calendar className={iconClass} />;
      case "queryReceived":
      case "queryResolved":
      case "queryUpdated":
      case "query":
        return <MessageCircle className={iconClass} />;
      case "system":
      case "systemAlert":
      case "maintenance":
      case "backup":
        return <Settings className={iconClass} />;
      case "promotion":
        return <Gift className={iconClass} />;
      case "reminder":
        return <Clock className={iconClass} />;
      case "broadcast":
      case "announcement":
        return <AlertCircle className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short" });
    }
  };

  const handleNotificationClick = (notification) => {
    const notificationId = notification.id || notification._id;

    // Mark as read when clicked (only if not already read)
    const isRead = notification.readBy?.some(
      (read) => read.userId?.toString() === admin.id?.toString()
    );

    if (!isRead) {
      markAsRead(notificationId);
    }

    // Navigate if link is available
    if (notification.link) {
      setIsOpen(false);
      navigate(`/${notification.link}`);
    }
  };

  // Close when clicking outside the bell + panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={rootRef}>
      {/* Notification Bell */}
      <button
        onClick={handleToggleOpen}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative rounded-lg p-2 text-fg-muted transition-colors hover:text-fg focus:outline-none"
      >
        <Bell className="size-6" />

        {/* Unread dot */}
        {unreadCount > 0 && (
          <span className="absolute right-1 sm:-right-0.5 top-1 sm:-top-0.5 grid size-3 sm:size-4 place-items-center rounded-full bg-danger pt-px text-[8px] sm:text-[10px] font-bold leading-none text-white ring-2 ring-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* phones only: dim backdrop, just under the panel */}
          <div
            className="fixed inset-0 z-[100] bg-black/40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />

          <div
            className="fixed inset-x-2 top-16 z-[101] flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:max-h-[80vh] sm:w-96 sm:rounded-lg"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-line bg-surface-2 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-fg sm:text-lg">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center rounded-full px-2 py-1 text-xs ${isConnected
                      ? "bg-success-soft text-success"
                      : "bg-danger-soft text-danger"
                      }`}
                  >
                    <span
                      className={`mr-1 size-2 rounded-full ${isConnected ? "bg-success" : "bg-danger"
                        }`}
                    />
                    {isConnected ? "Live" : "Offline"}
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                    className="grid size-8 place-items-center rounded-full hover:bg-surface-3"
                  >
                    <X className="size-4 text-fg-subtle" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-line-strong bg-surface py-2 pl-10 pr-4 text-sm text-fg placeholder-fg-subtle focus:border-transparent focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <div className="mt-2 flex w-full justify-end">
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-primary hover:bg-primary-soft"
                  >
                    <CheckCheck className="size-4" />
                    <span>Mark all read</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain sm:max-h-96 sm:flex-none">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="mt-2 text-sm text-fg-subtle">
                    Loading notifications...
                  </p>
                </div>
              ) : filteredNotifications?.length === 0 ? (
                <div className="p-8 text-center text-fg-subtle">
                  <Bell className="mx-auto mb-3 size-12 text-fg-faint" />
                  <p className="text-sm">No notifications found</p>
                  {searchTerm && (
                    <p className="mt-1 text-xs">Try adjusting your search</p>
                  )}
                </div>
              ) : (
                <>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id || notification._id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      getIcon={getNotificationIcon}
                      formatTime={formatTime}
                      isRead={notification.readBy?.some(
                        (read) => read.userId?.toString() === admin.id?.toString()
                      )}
                      onMarkRead={() =>
                        markAsRead(notification.id || notification._id)
                      }
                    />
                  ))}

                  {/* Load More Button */}
                  {hasMore && !searchTerm && (
                    <div className="border-t border-line p-3 sm:p-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-soft px-4 py-2 text-primary transition-colors hover:bg-primary-soft/70 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <span className="text-sm">Loading more...</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="size-4" />
                            <span className="text-sm">Load More</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications?.length > 0 && (
              <div className="shrink-0 border-t border-line bg-surface-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between text-xs text-fg-subtle">
                  <span>
                    {filteredNotifications?.length} of {totalNotifications}{" "}
                    notifications
                  </span>
                  <span>{unreadCount} unread</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;