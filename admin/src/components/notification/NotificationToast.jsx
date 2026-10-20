// src/components/NotificationToast.jsx
import React, { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

const NotificationToast = ({
  notification,
  onClose,
  onAction,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Trigger slide-in animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto-hide timer
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    // Progress bar animation
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 100);
        return newProgress > 0 ? newProgress : 0;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
      clearInterval(progressTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case "urgent":
        return "border-danger bg-danger-soft";
      case "high":
        return "border-warning bg-warning-soft";
      default:
        return "border-primary bg-primary-soft";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm w-full bg-surface rounded-lg shadow-lg border-l-4 ${getPriorityStyles()} transform transition-all duration-300 ease-in-out z-50 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      {/* Progress bar */}
      <div
        className="absolute top-0 left-0 h-1 bg-primary rounded-t transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-semibold text-fg mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-fg-muted leading-relaxed">
              {notification.body}
            </p>

            {/* Meta info */}
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  notification.priority === "urgent"
                    ? "bg-danger-soft text-danger"
                    : notification.priority === "high"
                    ? "bg-warning-soft text-warning"
                    : "bg-primary-soft text-primary"
                }`}
              >
                {notification.category || notification.type}
              </span>
              <span className="text-xs text-fg-faint">
                {new Date().toLocaleTimeString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-surface-2 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-fg-faint" />
          </button>
        </div>

        {/* Action button */}
        {notification.link && (
          <div className="mt-3 pt-3 border-t border-line">
            <button
              onClick={handleAction}
              className="w-full bg-primary text-paper text-sm py-2 px-3 rounded-md hover:bg-primary-hover transition-colors flex items-center justify-center space-x-1"
            >
              <span>View Details</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationToast;
