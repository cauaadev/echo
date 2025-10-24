import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Chat from "./pages/chat/Chat.jsx";
import Help from "./pages/help/Help.jsx";
import Support from "./pages/support/Support.jsx";
import Login from "./pages/login/Login.jsx";
import Register from "./pages/register/Register.jsx";
import ForgotPassword from "./pages/forgot/ForgotPassword.jsx";
import api from "./services/api/api";
import wsClient, { announcePresence } from "./services/ws/client"; // use concrete client

function addCacheBuster(url) {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${Date.now()}`;
}

function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    // keep tokenRef for cleanup in unload
    const tokenRef = useRef(localStorage.getItem("token"));

    const handleUserUpdate = (updated) => {
        const merged = { ...(user || {}), ...(updated || {}) };
        if (merged.avatarUrl) merged.avatarUrl = addCacheBuster(merged.avatarUrl);
        if (merged.avatar) merged.avatar = merged.avatarUrl || merged.avatar;
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
    };

    useEffect(() => {
        const syncUser = async () => {
            if (!user) return;
            try {
                const { data } = await api.get("/user/me");
                const merged = {
                    ...user,
                    username: data.username ?? user.username,
                    name: data.username ?? user.name,
                    email: data.email ?? user.email,
                    avatar: data.avatarUrl ? addCacheBuster(data.avatarUrl) : user.avatar,
                    avatarUrl: data.avatarUrl ? addCacheBuster(data.avatarUrl) : user.avatarUrl
                };
                setUser(merged);
                localStorage.setItem("user", JSON.stringify(merged));
            } catch {
                // token invalid or server error -> force logout
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                setUser(null);
                navigate("/login", { replace: true });
            }
        };
        syncUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        tokenRef.current = token;

        if (!user || !token) {
            // nothing to connect
            return;
        }

        // connect WS with meId so server can send personal notifications
        wsClient.connect({ token, meId: user.id });

        // when connection opens, announce presence ONLINE
        const offOpen = wsClient.on("open", () => {
            try { announcePresence("ONLINE"); } catch {}
        });

        // also call announcePresence immediately (connect may already be open)
        try { announcePresence("ONLINE"); } catch {}

        // ensure we announce OFFLINE when window unloads (best effort)
        const onBeforeUnload = () => {
            try { announcePresence("OFFLINE"); } catch {}
            try { wsClient.disconnect(); } catch {}
        };
        window.addEventListener("beforeunload", onBeforeUnload);

        return () => {
            offOpen?.();
            window.removeEventListener("beforeunload", onBeforeUnload);
            // don't forcibly disconnect here — leave disconnect to logout or next login flow
        };
    }, [user?.id]);

    // App-level logout handler (passed into Chat)
    const handleLogoutApp = async () => {
        try {
            // announce OFFLINE first (best-effort)
            try { announcePresence("OFFLINE"); } catch {}
            // disconnect websocket
            try { wsClient.disconnect(); } catch {}
        } finally {
            // persist last users list and clear auth
            const lastUsers = JSON.parse(localStorage.getItem("lastUsers") || "[]");
            const entry = {
                email: user?.email || "",
                username: user?.username || user?.name || "",
                avatar: user?.avatar || user?.avatarUrl || "",
                lastUsedAt: Date.now()
            };
            const updatedList = [entry, ...lastUsers.filter(u => !(u.email === entry.email || u.username === entry.username))].slice(0, 5);
            localStorage.setItem("lastUsers", JSON.stringify(updatedList));
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
            navigate("/login", { replace: true });
        }
    };

    return (
        <Routes>
            <Route path="/login" element={<Login onLogin={(u, token) => { setUser(u); if (token) localStorage.setItem("token", token); }} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route
                path="/"
                element={
                    user
                        ? <Chat user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogoutApp} />
                        : <Navigate to="/login" replace />
                }
            />
            <Route path="/help" element={<Help />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
    );
}

export default App;