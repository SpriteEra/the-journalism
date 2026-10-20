import { useState, useEffect } from "react";
import { Bell, BellOff, Check, X, AlertCircle, Settings } from "lucide-react";
import { useSelector } from "react-redux";
import { fetchToken, messaging } from "../../firebase";
import httpClient from "../api/httpClient";
import { useFetchNotification } from "../hooks/user";
import AsyncWrapper from "../utils/AsyncWrapper";

const NotificationSettings = ({ onclose }) => {
  const { user } = useSelector((state) => state.user);
  const [notificationPermission, setNotificationPermission] =
    useState("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const { data, isPending, isError, error, refetch } = useFetchNotification();
  const [notificationPreferences, setNotificationPreferences] = useState({
    newsAdded: true,
    eventNews: true,
    newsDeleted: false,
    newsUpdated: false,
    others: false,
  });

  useEffect(() => {
    // Check current notification permission status
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    setIsRequesting(true);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        // Show a test notification
        new Notification("Notifications Enabled!", {
          body: "You will now receive notifications from this app.",
          icon: "/favicon.ico",
        });
        // api call here
        const token = await fetchToken();
        await httpClient.put("update-fcm", { fcm: token });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case "granted":
        return {
          text: "Enabled",
          color: "text-success",
          bgColor: "bg-success-soft",
          icon: <Check size={16} />,
        };
      case "denied":
        return {
          text: "Blocked",
          color: "text-danger",
          bgColor: "bg-danger-soft",
          icon: <X size={16} />,
        };
      default:
        return {
          text: "Not Set",
          color: "text-warning",
          bgColor: "bg-warning-soft",
          icon: <BellOff size={16} />,
        };
    }
  };

  const handlePreferenceChange = async (type) => {
    const newValue = !notificationPreferences[type];

    // Update UI state
    setNotificationPreferences((prev) => ({
      ...prev,
      [type]: newValue,
    }));

    // Call API to update preference on backend
    try {
      await httpClient.post("update-notification-preference", {
        type,
        enabled: newValue,
      });
      refetch();
    } catch (error) {
      console.error("Failed to update preference:", error);
    }
  };

  const sendTestNotification = () => {
    if (notificationPermission === "granted") {
      new Notification("Test Notification", {
        body: "This is a test notification to verify everything is working correctly.",
        icon: "/favicon.ico",
        tag: "test-notification",
      });
    }
  };

  const status = getPermissionStatus();

  useEffect(() => {
    if (data) {
      setNotificationPreferences(data);
    }
  }, [isPending]);

  return (
    <AsyncWrapper isPending={isPending} isError={isError} error={error}>
      <div className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${status.bgColor}`}>
              <div className={status.color}>{status.icon}</div>
            </div>
            <div>
              <span className="font-medium text-fg">
                Browser Notifications
              </span>
              <p className="text-sm text-fg-subtle">
                Status: {status.text}
              </p>
            </div>
          </div>

          {/* Permission Action Buttons */}
          <div className="flex items-center gap-2">
            {(notificationPermission === "default" ||
              notificationPermission === "denied") && (
              <button
                onClick={requestNotificationPermission}
                disabled={isRequesting}
                className="bg-primary hover:bg-primary-hover disabled:bg-primary text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                {isRequesting ? "Requesting..." : "Enable Notifications"}
              </button>
            )}

            {notificationPermission === "granted" && (
              <button
                onClick={sendTestNotification}
                className="bg-success hover:bg-success text-paper px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
              >
                Test
              </button>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        {notificationPermission === "granted" && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wide">
              Notification Types
            </h3>

            {/* Add News by Reporter */}
            {user.role === "admin" && (
              <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary-soft">
                    <Bell
                      className="text-primary"
                      size={16}
                    />
                  </div>
                  <div>
                    <span className="font-medium text-fg">
                      Add News
                    </span>
                    <p className="text-sm text-fg-subtle">
                      News added by reporter
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceChange("newsAdded")}
                  className={`w-5 h-5 rounded-full border-2 ${
                    notificationPreferences.newsAdded
                      ? "bg-primary border-primary"
                      : "bg-surface-3 border-line-strong"
                  }`}
                >
                  {notificationPreferences.newsAdded && (
                    <div className="w-full h-full rounded-full bg-surface transform scale-50" />
                  )}
                </button>
              </div>
            )}

            {/* Add Event News by Reporter */}

            {user.role === "admin" && (
              <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary-soft">
                    <AlertCircle
                      className="text-primary"
                      size={16}
                    />
                  </div>
                  <div>
                    <span className="font-medium text-fg">
                      Event News
                    </span>
                    <p className="text-sm text-fg-subtle">
                      Event news added by reporter
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceChange("eventNews")}
                  className={`w-5 h-5 rounded-full border-2 ${
                    notificationPreferences.eventNews
                      ? "bg-primary border-primary"
                      : "bg-surface-3 border-line-strong"
                  }`}
                >
                  {notificationPreferences.eventNews && (
                    <div className="w-full h-full rounded-full bg-surface transform scale-50" />
                  )}
                </button>
              </div>
            )}

            {/* News Deleted by Admin */}

            {user.role === "reporter" && (
              <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success-soft">
                    <Bell
                      className="text-success"
                      size={16}
                    />
                  </div>
                  <div>
                    <span className="font-medium text-fg">
                      Deleted News
                    </span>
                    <p className="text-sm text-fg-subtle">
                      News deleted by admin
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceChange("newsDeleted")}
                  className={`w-5 h-5 rounded-full border-2 ${
                    notificationPreferences.newsDeleted
                      ? "bg-primary border-primary"
                      : "bg-surface-3 border-line-strong"
                  }`}
                >
                  {notificationPreferences.newsDeleted && (
                    <div className="w-full h-full rounded-full bg-surface transform scale-50" />
                  )}
                </button>
              </div>
            )}

            {/* News Updated by Reporter */}
            {user.role === "admin" && (
              <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-warning-soft">
                    <Bell
                      className="text-warning"
                      size={16}
                    />
                  </div>
                  <div>
                    <span className="font-medium text-fg">
                      Updated News
                    </span>
                    <p className="text-sm text-fg-subtle">
                      News updated by reporter
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePreferenceChange("newsUpdated")}
                  className={`w-5 h-5 rounded-full border-2 ${
                    notificationPreferences.newsUpdated
                      ? "bg-primary border-primary"
                      : "bg-surface-3 border-line-strong"
                  }`}
                >
                  {notificationPreferences.newsUpdated && (
                    <div className="w-full h-full rounded-full bg-surface transform scale-50" />
                  )}
                </button>
              </div>
            )}

            {/* Other Notifications */}
            <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-danger-soft">
                  <Bell className="text-danger" size={16} />
                </div>
                <div>
                  <span className="font-medium text-fg">
                    Other Notifications
                  </span>
                  <p className="text-sm text-fg-subtle">
                    All other types of notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => handlePreferenceChange("others")}
                className={`w-5 h-5 rounded-full border-2 ${
                  notificationPreferences.others
                    ? "bg-primary border-primary"
                    : "bg-surface-3 border-line-strong"
                }`}
              >
                {notificationPreferences.others && (
                  <div className="w-full h-full rounded-full bg-surface transform scale-50" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Help text for blocked notifications */}
        {notificationPermission === "denied" && (
          <div className="p-4 bg-danger-soft rounded-lg border border-danger/30">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-danger mt-0.5"
              />
              <div>
                <h4 className="font-medium text-danger mb-1">
                  Notifications Blocked
                </h4>
                <p className="text-sm text-danger mb-2">
                  Click "Enable Notifications" above to request permission
                  again, or manually enable in browser settings:
                </p>
                <ol className="text-sm text-danger list-decimal list-inside space-y-1">
                  <li>
                    Click the lock/info icon in your browser's address bar
                  </li>
                  <li>Change notifications setting to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="p-4 bg-primary-soft rounded-lg border border-primary/30">
          <p className="text-sm text-primary">
            <strong>About Notifications:</strong> Stay updated with important
            news articles, account security alerts, and personalized content
            recommendations.
          </p>
        </div>
      </div>
    </AsyncWrapper>
  );
};

export default NotificationSettings;
