import React, { useEffect, useRef, useState } from "react";
import { X, ExternalLink } from "lucide-react";

const TONE = {
  urgent: { bar: "bg-danger", border: "border-l-danger", chip: "bg-danger-soft text-danger" },
  high: { bar: "bg-warning", border: "border-l-warning", chip: "bg-warning-soft text-warning" },
  normal: { bar: "bg-primary", border: "border-l-primary", chip: "bg-primary-soft text-primary" },
};

const NotificationToast = ({ notification, onClose, onAction, duration = 6000 }) => {
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const closing = useRef(false);
  const tone = TONE[notification.priority] || TONE.normal;

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setVisible(false);
    setTimeout(onClose, 250);
  };

  useEffect(() => { const t = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(t); }, []);

  // hover or keyboard focus pauses the countdown
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(close, duration);
    return () => clearTimeout(t);
  }, [paused, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const time = new Date(notification.createdAt || notification.timestamp || Date.now())
    .toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

  return (
    <div
      role="status" aria-live="polite"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className={`fixed right-3 top-3 z-[200] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-line border-l-4 bg-surface shadow-xl transition-all duration-300 ${tone.border} ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
    >
      {/* countdown bar: pure CSS, pauses with hover */}
      <div className="h-1 w-full bg-surface-3">
        <div
          className={`h-full origin-left ${tone.bar}`}
          style={{ animation: `toast-shrink ${duration}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
        />
      </div>
      <style>{`@keyframes toast-shrink { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>

      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-fg">{notification.title}</h4>
            <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-fg-muted">{notification.body}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${tone.chip}`}>{notification.category || notification.type}</span>
              <span className="text-xs text-fg-faint">{time}</span>
            </div>
          </div>
          <button onClick={close} aria-label="Dismiss" className="shrink-0 rounded-full p-1 hover:bg-surface-2">
            <X className="size-4 text-fg-faint" />
          </button>
        </div>

        {notification.link && (
          <button
            onClick={() => { onAction?.(); close(); }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm text-paper transition-colors hover:bg-primary-hover"
          >
            View details <ExternalLink className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationToast;