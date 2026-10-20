// src/hooks/useSocket.js
import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [newNotifications, setNewNotifications] = useState([]);
    const { user: admin } = useSelector((state) => state.user);
    const connectSocket = useCallback(() => {
        if (!admin?.id) {
            return;
        }

        const token = localStorage.getItem('authToken') || admin.token;
        const baseURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

        // Connect to /admin namespace
        const newSocket = io(`${baseURL}/admin`, {
            auth: { token: token },
            transports: ['websocket', 'polling'],
            withCredentials: true,        // the accessToken cookie authenticates the socket when no token is passed
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        });

        // Connection events
        newSocket.on('connect', () => {
            setIsConnected(true);

            // Join admin's personal room after connecting
            if (admin?.id) {
                newSocket.emit('join_user_room', admin.id);
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            setIsConnected(false);
        });

        // Only handle new notifications
        newSocket.on('notification', (data) => {
            console.log('📡 New notification received:', data);
            setNewNotifications(prev => [data, ...prev]);

            // Show browser notification if page is not visible
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(data.title, {
                    body: data.body,
                    icon: '/logo.png',
                    tag: data.id,
                    data: { url: data.link }
                });
            }
        });

        newSocket.on('joined_room', (roomName) => {
            console.log(`✅ Admin joined room: ${roomName}`);
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        setSocket(newSocket);
        return newSocket;
    }, [admin]);

    // Disconnect socket
    const disconnectSocket = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [socket]);

    // Clear processed notifications
    const clearNewNotifications = useCallback(() => {
        setNewNotifications([]);
    }, []);

    // Connect when component mounts and admin is available
    useEffect(() => {
        if (admin?.id) {
            connectSocket();
        }

        return () => {
            disconnectSocket();
        };
    }, [admin?.id]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    return {
        socket,
        isConnected,
        newNotifications,
        clearNewNotifications,
        connectSocket,
        disconnectSocket,
        namespace: '/admin'
    };
};

export default useSocket;
