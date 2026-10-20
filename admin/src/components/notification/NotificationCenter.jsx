import React, { useState, useEffect, useCallback } from "react";
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
import { useRef } from "react";
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
  const panelRef = useRef(null);

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

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={handleToggleOpen}
        className="relative p-2 text-fg-muted hover:text-fg focus:outline-none rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <div className="absolute top-1 right-2 w-3 h-3 rounded-full bg-success" />
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute -right-20 sm:right-0 mt-2 w-96 bg-surface rounded-lg shadow-xl border border-line z-50 max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-line bg-surface-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-fg">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <span
                  className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    isConnected
                      ? "bg-success-soft text-success"
                      : "bg-danger-soft text-danger"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-1 ${
                      isConnected ? "bg-success" : "bg-danger"
                    }`}
                  />
                  {isConnected ? "Live" : "Offline"}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-surface-3 rounded-full"
                >
                  <X className="w-4 h-4 text-fg-subtle" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fg-faint w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-line-strong rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-surface text-fg placeholder-fg-subtle"
              />
            </div>

            {/* Mark All Read Button */}
            <div className="flex justify-end w-full">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center space-x-1 text-sm text-primary hover:text-primary"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-fg-subtle mt-2">
                  Loading notifications...
                </p>
              </div>
            ) : filteredNotifications?.length === 0 ? (
              <div className="p-8 text-center text-fg-subtle">
                <Bell className="w-12 h-12 mx-auto mb-3 text-fg-faint" />
                <p className="text-sm">No notifications found</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Try adjusting your search</p>
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
                  <div className="p-4 border-t border-line">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-primary-soft hover:bg-primary-soft text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                          <span className="text-sm">Loading more...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
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
            <div className="p-3 border-t border-line bg-surface-2">
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
      )}
    </div>
  );
};

export default NotificationCenter;
