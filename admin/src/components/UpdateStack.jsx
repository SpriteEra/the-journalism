import React, { useState, useEffect } from "react";
import httpClient from "../api/httpClient";
import {
  X,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  FileText,
  Activity,
} from "lucide-react";
import { getRelativeTime } from "../utils/utils";
const UpdateStackPanel = ({
  stack_id = "",
  isOpen = false,
  onClose = () => {},
  showOverlay = true,
  closable = true,
  width = "400px",
}) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalUpdates: 0,
    totalPages: 0,
  });

  // Auto-fetch when component opens
  useEffect(() => {
    if (isOpen && stack_id) {
      fetchUpdates(1);
    }
  }, [isOpen, stack_id]);

  const fetchUpdates = async (page = 1) => {
    if (!stack_id) {
      setError("No Stack ID provided");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await httpClient(
        `update-stack/${stack_id}?page=${page}&limit=${pagination.limit}`
      );

      setUpdates(data.updates || []);
      setPagination(data.pagination);
    } catch (error) {
      setError("Failed to load updates. Please try again.");
      setUpdates([]);
      console.error("Error fetching updates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUpdates(newPage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    // Prevent body scroll when panel is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && closable) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closable]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {showOverlay && (
        <div
          className="fixed inset-0 bg-ink/50 transition-opacity duration-300"
          onClick={closable ? onClose : undefined}
        />
      )}

      {/* Sliding Panel */}
      <div
        className={`fixed right-0 top-0 h-full bg-surface shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-paper">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">
                  Update History
                </h2>
                <p className="text-xs text-fg-subtle">
                  Stack ID: {stack_id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUpdates(pagination.page)}
                disabled={loading}
                className="p-2 text-fg-subtle hover:text-fg-muted hover:bg-surface-2 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-fg-subtle hover:text-fg-muted hover:bg-surface-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-danger-soft border border-danger/30 rounded-lg">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-fg-muted text-sm">
                    Loading updates...
                  </p>
                </div>
              </div>
            ) : updates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-fg-faint" />
                  </div>
                  <h3 className="text-base font-medium text-fg mb-2">
                    No Updates Found
                  </h3>
                  <p className="text-sm text-fg-muted">
                    No update history available for this stack yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Updates List */}
                <div className="space-y-4">
                  {updates.map((update, index) => (
                    <div
                      key={index}
                      className="bg-surface border border-line rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-paper text-sm font-medium flex-shrink-0">
                          {update.updatedBy?.name ? (
                            update.updatedBy.name.charAt(0).toUpperCase()
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-fg text-sm">
                                {update.updatedBy?.username || "Unknown User"}
                              </div>
                              <div className="text-xs text-fg-subtle">
                                {update.updatedBy?.email || "No email"}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-fg-subtle">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(update.updatedAt)}
                            </div>
                          </div>

                          {/* Changes */}
                          {update.changes && (
                            <div className="bg-surface-2 rounded-lg p-3 mb-2">
                              <h4 className="font-medium text-fg text-xs mb-2 flex items-center gap-1">
                                <Activity className="w-3 h-3 text-primary" />
                                Changes
                              </h4>
                              <div className="text-xs space-y-1">
                                {typeof update.changes === "object" ? (
                                  Object.entries(update.changes).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="flex items-center justify-between py-1 px-2 bg-surface rounded border border-line"
                                      >
                                        <span className="text-fg-muted capitalize">
                                          {key
                                            .replace(/([A-Z])/g, " $1")
                                            .trim()}
                                          :
                                        </span>
                                        <span className="text-fg font-mono bg-surface-2 px-1 py-0.5 rounded text-xs">
                                          {String(value)}
                                        </span>
                                      </div>
                                    )
                                  )
                                ) : (
                                  <div className="p-2 bg-surface rounded border border-line">
                                    <span className="text-fg text-xs">
                                      {String(update.changes)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          {update.description && (
                            <div className="p-3 bg-primary-soft rounded-lg border border-primary/30 mb-2">
                              <p className="text-fg-muted text-xs leading-relaxed">
                                {update.description}
                              </p>
                            </div>
                          )}

                          {/* Full Timestamp */}
                          <div className="flex items-center gap-1 text-xs text-fg-faint">
                            <Calendar className="w-3 h-3" />
                            {formatDate(update.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {updates.length > 0 && pagination.totalPages > 1 && (
            <div className="border-t border-line px-6 py-3 bg-surface-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-fg-muted">
                  Page {pagination.page} of {pagination.totalPages} •{" "}
                  {pagination.totalUpdates} total updates
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-lg border border-line-strong hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(3, pagination.totalPages) },
                      (_, i) => {
                        const page = Math.max(1, pagination.page - 1) + i;
                        if (page > pagination.totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              pagination.page === page
                                ? "bg-primary text-paper"
                                : "text-fg-muted hover:bg-surface-2"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 rounded-lg border border-line-strong hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateStackPanel;
