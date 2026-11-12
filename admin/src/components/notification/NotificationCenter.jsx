import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  const [tab, setTab] = useState("all"); // "all" | "unread"
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const { user: admin } = useSelector((state) => state.user);
  const { newNotifications, isConnected, clearNewNotifications } = useSocket();
  const adminId = admin?.id || admin?._id;
  const me = String(adminId || "");

  const navigate = useNavigate();
  const rootRef = useRef(null);

  // One place that decides whether a notification is read
  const isReadByMe = useCallback(
    (n) =>
      n.isRead ??
      Boolean(n.readBy?.some((r) => String(r.userId) === me)),
    [me]
  );

  const loadUnread = useCallback(async () => {
    if (!adminId) return;
    try {
      const { data } = await httpClient.get(`notifications/${adminId}/stats`);
      setUnreadCount(data.stats?.unread ?? 0);
    } catch {
      /* keep the old number */
    }
  }, [adminId]);

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 60_000);
    const onVisible = () => !document.hidden && loadUnread();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadUnread]);

  useEffect(() => {
    if (newNotifications?.length > 0) {
      setNotifications((prev) => {
        const merged = [...newNotifications, ...prev];
        const unique = merged.filter(
          (notification, index, self) =>
            index ===
            self.findIndex(
              (n) => (n.id || n._id) === (notification.id || notification._id)
            )
        );
        return unique.sort(
          (a, b) =>
            new Date(b.createdAt || b.timestamp) -
            new Date(a.createdAt || a.timestamp)
        );
      });
      setUnreadCount((n) => n + newNotifications.length);
      clearNewNotifications();
    }
  }, [newNotifications, clearNewNotifications]);

  const fetchNotifications = async (page = 1, append = false) => {
    if (!adminId) return;
    page === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const { data } = await httpClient.get(`notifications/${adminId}`, {
        params: { page, limit: 15 },
      });
      const list = data?.notifications || [];
      setNotifications((prev) => (append ? [...prev, ...list] : list));
      setTotalNotifications(data?.pagination?.totalNotifications ?? list.length);
      setHasMore(Boolean(data?.pagination?.hasNextPage));
      setUnreadCount(data?.unreadCount ?? 0);
      setCurrentPage(page);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await httpClient.patch(`notifications/${notificationId}/read`, {
        userId: adminId,
      });
      loadUnread();
      setNotifications((prev) =>
        prev.map((n) =>
          (n.id || n._id) === notificationId && !isReadByMe(n)
            ? {
              ...n,
              isRead: true,
              readBy: [...(n.readBy || []), { userId: adminId, readAt: new Date() }],
            }
            : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await httpClient.patch(`notifications/mark-all-read`, { userId: adminId });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readBy: [
            ...(n.readBy || []).filter((r) => String(r.userId) !== me),
            { userId: adminId, readAt: new Date() },
          ],
        }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredNotifications = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return notifications.filter((n) => {
      if (tab === "unread" && isReadByMe(n)) return false;
      if (!q) return true;
      return (
        (n.title || "").toLowerCase().includes(q) ||
        (n.body || "").toLowerCase().includes(q)
      );
    });
  }, [notifications, searchTerm, tab, isReadByMe]);

  // Group into Today / Earlier
  const groups = useMemo(() => {
    const today = new Date().toDateString();
    const todayList = [];
    const earlier = [];
    filteredNotifications.forEach((n) => {
      const d = new Date(n.createdAt || n.timestamp).toDateString();
      (d === today ? todayList : earlier).push(n);
    });
    return [
      { label: "Today", items: todayList },
      { label: "Earlier", items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [filteredNotifications]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) fetchNotifications(currentPage + 1, true);
  };

  useEffect(() => {
    if (isOpen && adminId) fetchNotifications(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, adminId]);

  const handleToggleOpen = () => setIsOpen((v) => !v);

  const getNotificationIcon = (type, category) => {
    const iconClass = "size-[18px]";
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
    const diffInMinutes = Math.floor((now - date) / 60000);
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
    });
  };

  const handleNotificationClick = (notification) => {
    const id = notification.id || notification._id;
    if (!isReadByMe(notification)) markAsRead(id);
    if (notification.link) {
      setIsOpen(false);
      navigate(
        notification.link.startsWith("/") ? notification.link : `/${notification.link}`
      );
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const tabBtn = (key, label, count) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${tab === key
        ? "bg-surface text-fg shadow-sm"
        : "text-fg-subtle hover:text-fg"
        }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 text-[11px] leading-4 ${tab === key ? "bg-primary text-white" : "bg-surface-3 text-fg-muted"
            }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );

  return (
    <div className="relative" ref={rootRef}>
      {/* Bell */}
      <button
        onClick={handleToggleOpen}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={`relative rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isOpen ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg"
          }`}
      >
        <Bell className="size-6" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid size-3 place-items-center rounded-full bg-danger pt-px text-[8px] font-bold leading-none text-white ring-2 ring-surface sm:-right-0.5 sm:-top-0.5 sm:size-4 sm:text-[10px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />

          <div className="fixed inset-x-2 top-16 z-[101] flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 sm:max-h-[80vh] sm:w-[26rem]">
            {/* Header */}
            <div className="shrink-0 px-4 pb-3 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-fg sm:text-lg">
                    Notifications
                  </h3>
                  <span
                    title={isConnected ? "Live updates on" : "Offline"}
                    className="flex items-center gap-1.5 text-xs text-fg-subtle"
                  >
                    <span className="relative flex size-2">
                      {isConnected && (
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                      )}
                      <span
                        className={`relative inline-flex size-2 rounded-full ${isConnected ? "bg-success" : "bg-danger"
                          }`}
                      />
                    </span>
                    {isConnected ? "Live" : "Offline"}
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-full text-fg-subtle hover:bg-surface-3 hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
                <input
                  type="text"
                  placeholder="Search notifications"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-transparent bg-surface-2 py-2 pl-9 pr-8 text-sm text-fg placeholder-fg-subtle transition focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-fg-subtle hover:bg-surface-3"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Tabs + mark all */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex gap-0.5 rounded-lg bg-surface-2 p-0.5">
                  {tabBtn("all", "All", 0)}
                  {tabBtn("unread", "Unread", unreadCount)}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-primary-soft"
                  >
                    <CheckCheck className="size-4" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line sm:max-h-[26rem] sm:flex-none">
              {loading ? (
                <div className="space-y-4 p-4" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex animate-pulse gap-3">
                      <div className="size-9 rounded-xl bg-surface-3" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-surface-3" />
                        <div className="h-3 w-full rounded bg-surface-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 size-10 text-danger" />
                  <p className="text-sm text-fg-muted">{error}</p>
                  <button
                    onClick={() => fetchNotifications(1, false)}
                    className="mt-3 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-soft"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-surface-2">
                    <Bell className="size-5 text-fg-faint" />
                  </div>
                  <p className="text-sm font-medium text-fg-muted">
                    {tab === "unread" && !searchTerm
                      ? "You're all caught up"
                      : "No notifications found"}
                  </p>
                  {searchTerm && (
                    <p className="mt-1 text-xs text-fg-subtle">
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {groups.map((group) => (
                    <section key={group.label}>
                      <h4 className="sticky top-0 z-[1] bg-surface/95 px-4 py-1.5 text-xs font-medium text-fg-subtle backdrop-blur">
                        {group.label}
                      </h4>
                      {group.items.map((notification) => {
                        const id = notification.id || notification._id;
                        return (
                          <NotificationItem
                            key={id}
                            notification={notification}
                            isRead={isReadByMe(notification)}
                            onClick={() => handleNotificationClick(notification)}
                            onMarkRead={() => markAsRead(id)}
                            getIcon={getNotificationIcon}
                            formatTime={formatTime}
                          />
                        );
                      })}
                    </section>
                  ))}

                  {hasMore && !searchTerm && tab === "all" && (
                    <div className="border-t border-line p-3">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Loading
                          </>
                        ) : (
                          <>
                            <ChevronDown className="size-4" />
                            Load more
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="shrink-0 border-t border-line bg-surface-2 px-4 py-2.5 pb-3">
                <p className="text-xs text-fg-subtle">
                  Showing {notifications.length} of {totalNotifications}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;