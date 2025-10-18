// javascript
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Chat from "./pages/chat/Chat.jsx";
import Help from "./pages/help/Help.jsx";
import Support from "./pages/support/Support.jsx";
import Login from "./pages/login/Login.jsx";
import Register from "./pages/register/Register.jsx";
import ForgotPassword from "./pages/forgot/ForgotPassword.jsx";
import api from "./services/api/api";
import ws from "./services/ws";

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
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                setUser(null);
                navigate("/login", { replace: true });
            }
        };
        syncUser();
    }, [user?.id, navigate]);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        ws.connect({ token });

        const offUpdated = ws.on("user:updated", (payload) => {
            if (!payload) return;
            const isMe =
                (payload.id && payload.id === user.id) ||
                (payload.username && payload.username === user.username);
            const avatarBusted = payload.avatarUrl ? addCacheBuster(payload.avatarUrl) : undefined;

            if (isMe) {
                handleUserUpdate({
                    username: payload.username ?? user.username,
                    email: payload.email ?? user.email,
                    avatarUrl: avatarBusted ?? user.avatarUrl,
                    avatar: avatarBusted ?? user.avatar
                });
            }
        });

        return () => {
            offUpdated?.();
        };
    }, [user]);

    return (
        <Routes>
            <Route path="/login" element={<Login onLogin={(u) => { setUser(u); }} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route
                path="/"
                element={
                    user
                        ? <Chat user={user} onUserUpdate={handleUserUpdate} />
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