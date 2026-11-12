import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [newNotifications, setNewNotifications] = useState([]);
    const { user: admin } = useSelector((state) => state.user);
    const adminId = admin?.id || admin?._id;

    useEffect(() => {
        if (!adminId) return;
        const baseURL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
        const socket = io(`${baseURL}/admin`, {
            auth: { token: localStorage.getItem("authToken") || admin?.token },
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000,
        });

        socket.on("connect", () => { setIsConnected(true); socket.emit("join_user_room", adminId); });
        socket.on("disconnect", () => setIsConnected(false));
        socket.on("connect_error", (err) => { console.error("Socket connection error:", err.message); setIsConnected(false); });
        socket.on("notification", (data) => {
            setNewNotifications((prev) => [data, ...prev]);
            if (document.hidden && "Notification" in window && Notification.permission === "granted") {
                new Notification(data.title, { body: data.body, icon: "/logo.png", tag: data.id, data: { url: data.link } });
            }
        });

        return () => socket.disconnect();     // the local variable, so it really closes
    }, [adminId]);

    const clearNewNotifications = useCallback(() => setNewNotifications([]), []);
    return { isConnected, newNotifications, clearNewNotifications };
};

export default useSocket;