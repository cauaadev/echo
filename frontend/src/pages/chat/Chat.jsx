import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Mic, MicOff, Camera, CameraOff, Settings, UserPlus, Bell, MoreHorizontal } from "lucide-react";
import "./style.css";
import SettingsModal from "../settings/SettingsModal";
import defaultAvatar from "../../assets/default-avatar.png";
import ws from "../../services/ws";
import CallManager from "../../services/call/CallManager.js";
import api from "../../services/api/api";
import FriendRequestsModal from "../../components/FriendRequestsModal";

const CALLING_SOUND_URL = `${(import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/"}assets/calling-mp3.mp3`;
const MESSAGE_SOUND_URL = `${(import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/"}assets/message-mp3.mp3`;

function conversationIdOf(a, b) {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `${min}_${max}`;
}

function addCacheBuster(url) {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${Date.now()}`;
}

// Normalize presence values for display; keep unknown values so we don't coerce them to offline.
function normalizePresenceValue(raw) {
    if (!raw) return "offline";
    const s = String(raw).toLowerCase();
    if (["online", "on", "available"].includes(s)) return "online";
    if (["away", "ausente"].includes(s)) return "away";
    if (["dnd", "do_not_disturb", "do-not-disturb", "donotdisturb", "do not disturb"].includes(s)) return "dnd";
    if (["offline", "off", "invisible"].includes(s)) return "offline";
    return s; // return as-is for custom/other statuses
}

// Build a public avatar URL fallback if the server didn't provide one.
function publicAvatarUrlFor(userId) {
    try {
        const origin = window?.location?.origin || "";
        return `${origin}/media/avatar/${userId}`;
    } catch {
        return defaultAvatar;
    }
}

function Toast({ toast, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, toast.duration || 3500);
        return () => clearTimeout(t);
    }, [toast, onClose]);
    return (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} className="mini-toast">
            <img src={toast.avatar || defaultAvatar} alt="" width={32} height={32} style={{ borderRadius: 8, objectFit: "cover" }} onError={(e) => { e.currentTarget.src = defaultAvatar; }} />
            <div className="mini-toast-texts"><strong>{toast.title}</strong><span>{toast.message}</span></div>
        </motion.div>
    );
}

export default function Chat({ user, onUserUpdate, onLogout }) {
    const navigate = useNavigate();

    // core state
    const [users, setUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState({});
    const [input, setInput] = useState("");

    // UI state
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [search, setSearch] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [toasts, setToasts] = useState([]);

    // archived & blocked
    const [archivedUsers, setArchivedUsers] = useState([]);
    const [blockedIds, setBlockedIds] = useState(() => new Set());
    const [blockedUsers, setBlockedUsers] = useState([]);

    // call state
    const [call, setCall] = useState({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);

    const messagesEndRef = useRef(null);
    const messageAudioRef = useRef(null);
    const callingAudioRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // presence + requests
    const [presence, setPresence] = useState(() => new Map());
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [requestsLoadingIds, setRequestsLoadingIds] = useState(new Set());

    // sidebar tabs & profile modal
    const [viewTab, setViewTab] = useState("conversations");
    const [profileUser, setProfileUser] = useState(null);

    // subscriptions
    const subsRef = useRef(new Map());
    const subscribeTimersRef = useRef(new Map());

    // profile menu refs
    const profileMenuRef = useRef(null);
    const profileAvatarRef = useRef(null);

    // Utility: scroll
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeUser, messages]);

    // prepare audio elements and unlock on first gesture
    useEffect(() => {
        // audio elements
        messageAudioRef.current = new Audio(MESSAGE_SOUND_URL);
        messageAudioRef.current.volume = 0.6;

        callingAudioRef.current = new Audio(CALLING_SOUND_URL);
        callingAudioRef.current.loop = true;
        callingAudioRef.current.volume = 0.7;

        // add error handlers to avoid unexpected exceptions
        const onMsgErr = (e) => console.warn("message audio error", e);
        const onCallErr = (e) => console.warn("calling audio error", e);
        messageAudioRef.current.addEventListener("error", onMsgErr);
        callingAudioRef.current.addEventListener("error", onCallErr);

        const unlock = async () => {
            try { await messageAudioRef.current.play().catch(()=>{}); await callingAudioRef.current.play().catch(()=>{}); } catch {}
            try { messageAudioRef.current.pause(); } catch {}
            try { callingAudioRef.current.pause(); } catch {}
            window.removeEventListener("click", unlock);
            window.removeEventListener("touchstart", unlock);
        };
        window.addEventListener("click", unlock, { once: true });
        window.addEventListener("touchstart", unlock, { once: true });

        return () => {
            messageAudioRef.current.removeEventListener("error", onMsgErr);
            callingAudioRef.current.removeEventListener("error", onCallErr);
            window.removeEventListener("click", unlock);
            window.removeEventListener("touchstart", unlock);
        };
    }, []);

    // --- Loaders ---
    const loadFriends = async () => {
        try {
            const { data } = await api.get("/friends/list");
            const items = (data || []).map(u => {
                // prefer server-provided avatarUrl; fallback to constructed public /media/avatar/{id}
                const avatarUrl = u.avatarUrl && String(u.avatarUrl).trim() ? u.avatarUrl : publicAvatarUrlFor(u.id);
                return {
                    id: u.id,
                    name: u.username || u.email || String(u.id),
                    avatar: avatarUrl ? addCacheBuster(avatarUrl) : defaultAvatar
                };
            });
            setUsers(items);
            if (!activeUser && items.length > 0) setActiveUser(items[0]);
        } catch (err) {
            console.warn("loadFriends error", err);
        }
    };

    const loadBlocked = async () => {
        try {
            const { data } = await api.get("/friends/block");
            const ids = new Set((data || []).map(b => b?.blocked?.id || b?.blockedId).filter(Boolean));
            setBlockedIds(ids);
            const details = (data || []).map(b => b?.blocked ? { id: b.blocked.id, username: b.blocked.username, avatar: b.blocked.avatarUrl ? addCacheBuster(b.blocked.avatarUrl) : defaultAvatar } : { id: b.blockedId, username: String(b.blockedId), avatar: defaultAvatar });
            setBlockedUsers(details);
        } catch (err) {
            console.warn("loadBlocked error", err);
        }
    };

    const fetchRequests = async () => {
        try {
            const { data } = await api.get("/friends/requests");
            const map = new Map();
            (data || []).forEach(r => {
                if (!map.has(r.id)) map.set(r.id, {
                    requestId: r.id,
                    fromId: r.requester?.id,
                    fromUsername: r.requester?.username || r.requester?.email || "Usuário",
                    avatar: r.requester?.avatarUrl ? addCacheBuster(r.requester.avatarUrl) : defaultAvatar,
                    createdAt: r.createdAt
                });
            });
            setPendingRequests(Array.from(map.values()));
        } catch (err) {
            console.warn("fetchRequests error", err);
        }
    };

    useEffect(() => { loadFriends(); loadBlocked(); }, []);
    useEffect(() => { if (!user?.id) return; fetchRequests(); }, [user?.id]);

    // --- Subscription helpers ---
    const clearSubscribeTimersFor = (cid) => {
        const t = subscribeTimersRef.current.get(cid);
        if (t) {
            clearTimeout(t);
            subscribeTimersRef.current.delete(cid);
        }
    };

    const trySubscribeConversation = (cid, onMessage, attempt = 0) => {
        clearSubscribeTimersFor(cid);
        if (subsRef.current.has(cid)) return;
        try {
            const sub = ws.subscribeConversation(cid, onMessage);
            if (sub && typeof sub.unsubscribe === "function") {
                subsRef.current.set(cid, sub);
                return;
            }
        } catch (err) {}
        if (attempt < 6) {
            const delay = 200 * Math.pow(2, attempt);
            const timer = setTimeout(() => trySubscribeConversation(cid, onMessage, attempt + 1), delay);
            subscribeTimersRef.current.set(cid, timer);
        } else {
            console.warn("Falha ao inscrever conversa:", cid);
        }
    };

    const unsubscribeAll = () => {
        subsRef.current.forEach(sub => { try { sub.unsubscribe(); } catch {} });
        subsRef.current.clear();
        subscribeTimersRef.current.forEach(t => clearTimeout(t));
        subscribeTimersRef.current.clear();
    };

    // --- Subscribe to active conversation only ---
    useEffect(() => {
        if (!user?.id) return;
        unsubscribeAll();
        if (!activeUser) return;

        const cid = conversationIdOf(user.id, activeUser.id);
        const onMessage = (m) => {
            const content = m.content ?? m.text ?? "";
            const senderId = m.senderId ?? m.sender ?? null;
            const receiverId = m.receiverId ?? m.receiver ?? null;
            const serverId = m.id ?? null;
            const otherId = String(senderId) === String(user.id) ? String(receiverId) : String(senderId);

            setMessages(prev => {
                const prevArr = prev[otherId] ? [...prev[otherId]] : [];
                if (serverId && prevArr.some(x => String(x.id) === String(serverId))) return prev;
                if (String(senderId) === String(user.id)) {
                    const idx = prevArr.findIndex(x => x.optimistic && x.text === content);
                    if (idx !== -1) {
                        prevArr[idx] = { id: serverId || `srv-${Date.now()}`, text: content, sender: "me", raw: m };
                        return { ...prev, [otherId]: prevArr };
                    }
                }
                const newMsg = { id: serverId || `srv-${Date.now()}`, text: content, sender: String(senderId) === String(user.id) ? "me" : "them", raw: m };
                return { ...prev, [otherId]: [...prevArr, newMsg] };
            });

            try { if (String(m.senderId) !== String(user.id) && document.hidden) messageAudioRef.current?.play?.(); } catch {}
        };

        trySubscribeConversation(cid, onMessage);
        const offOpen = ws.on("open", () => trySubscribeConversation(cid, onMessage));
        const offStomp = ws.on("stomp:connected", () => trySubscribeConversation(cid, onMessage)) || ws.on("connected", () => trySubscribeConversation(cid, onMessage));

        return () => {
            const sub = subsRef.current.get(cid);
            if (sub) {
                try { sub.unsubscribe(); } catch {}
                subsRef.current.delete(cid);
            }
            offOpen?.();
            offStomp?.();
            clearSubscribeTimersFor(cid);
        };
    }, [activeUser?.id, user?.id]);

    // --- Presence, friend requests and call signaling handlers ---
    useEffect(() => {
        const offPresence = ws.on("presence", (payload) => {
            if (!payload || !payload.userId) return;
            const normalized = normalizePresenceValue(payload.status ?? payload.state ?? payload.presence);
            console.debug("[WS presence] received", payload, "normalized->", normalized);
            setPresence(prev => {
                const next = new Map(prev);
                next.set(String(payload.userId), normalized);
                return next;
            });
        });

        const offFriendReq = ws.on("friend:request", (p) => {
            pushToast({ title: "Pedido de amizade", message: p.fromUsername || "Novo pedido", avatar: p.fromAvatar || defaultAvatar });
            fetchRequests();
        });

        const offFriendAccepted = ws.on("friend:accepted", (p) => {
            pushToast({ title: "Amizade aceita", message: p.message || "Vocês agora são amigos" });
            loadFriends();
            fetchRequests();
        });

        const offCallOffer = ws.on("call:offer", (payload) => {
            console.debug("[Chat] call:offer payload:", payload);
            setCall({ mode: "incoming", media: payload.media || { audio: true, video: false }, peer: payload.from, payload });
            try { callingAudioRef.current?.play?.(); } catch (e) { console.warn("callingAudio play failed", e); }
            setMicOn(true);
            setCamOn(!!(payload.media && payload.media.video));
        });

        const offCallAnswer = ws.on("call:answer", async ({ from, sdp }) => {
            const ok = await CallManager.applyAnswer({ from, sdp });
            if (ok) {
                setCall(prev => ({ ...prev, mode: "active" }));
                try { callingAudioRef.current?.pause?.(); callingAudioRef.current.currentTime = 0; } catch {}
            }
        });

        const offCallIce = ws.on("call:ice", async ({ from, candidate }) => {
            try { await CallManager.onRemoteIce({ from, candidate }); } catch {}
        });

        const offCallEnd = ws.on("call:end", ({ from }) => {
            handleEndCall();
            pushToast({ title: "Chamada finalizada", message: "O outro usuário encerrou a chamada" });
        });

        const offCallCancel = ws.on("call:cancel", ({ from }) => {
            if (call.mode === "incoming" && String(call.peer) === String(from)) {
                try { callingAudioRef.current?.pause?.(); callingAudioRef.current.currentTime = 0; } catch {}
                setCall({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
            }
        });

        // announce presence only after stomp connected to avoid race
        const offStompAnnounce = ws.on("stomp:connected", () => {
            try {
                if (typeof ws.announcePresence === "function") ws.announcePresence("ONLINE");
                else ws.send("presence", { userId: user?.id, status: "ONLINE" });
            } catch (err) { console.warn("announce presence failed", err); }
        });

        return () => {
            offPresence?.();
            offFriendReq?.();
            offFriendAccepted?.();
            offCallOffer?.();
            offCallAnswer?.();
            offCallIce?.();
            offCallEnd?.();
            offCallCancel?.();
            offStompAnnounce?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, call.mode]);

    const stopRinging = () => { try { callingAudioRef.current?.pause?.(); callingAudioRef.current.currentTime = 0; } catch {} };

    const pushToast = (t) => {
        const toast = { id: crypto.randomUUID?.() || String(Date.now()), ...t, duration: 3500 };
        setToasts(prev => [...prev, toast]);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // --- Messaging ---
    const sendMessage = () => {
        if (!input.trim() || !user?.id || !activeUser?.id) return;
        const text = input.trim();
        const cid = conversationIdOf(user.id, activeUser.id);
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        setMessages(prev => {
            const arr = prev[activeUser.id] ? [...prev[activeUser.id]] : [];
            return { ...prev, [activeUser.id]: [...arr, { id: localId, text, sender: "me", optimistic: true }] };
        });
        ws.send(`chat:${cid}`, { receiverId: activeUser.id, content: text });
        setInput("");
    };

    // --- Friends / Requests ---
    const addUser = async () => {
        const name = (search || "").trim();
        if (!name) return;
        if (name.toLowerCase() === (user?.username || "").toLowerCase()) { alert("Você não pode adicionar a si mesmo."); return; }
        try {
            const { data } = await api.get(`/users/${encodeURIComponent(name)}`);
            const targetId = data?.id;
            if (!targetId) { alert("Usuário não encontrado."); return; }
            await api.post(`/friends/requests`, { toUserId: targetId });
            await fetchRequests();
            pushToast({ title: "Pedido enviado", message: `Convite para ${data.username || name}`, avatar: data?.avatarUrl ? addCacheBuster(data.avatarUrl) : defaultAvatar });
            setSearch("");
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Não foi possível enviar o pedido.";
            alert(msg);
            console.warn("addUser failed", err);
        }
    };

    const acceptFriendRequest = async (requestId) => {
        try {
            setRequestsLoadingIds(prev => new Set(prev).add(requestId));
            await api.post(`/friends/requests/${requestId}/accept`);
            pushToast({ title: "Pedido aceito", message: "Agora vocês são amigos" });
            await loadFriends();
            await fetchRequests();
            setShowRequestsModal(false);
        } catch (err) {
            alert(err?.response?.data?.message || "Erro");
        } finally {
            setRequestsLoadingIds(prev => { const n = new Set(prev); n.delete(requestId); return n; });
        }
    };

    const declineFriendRequest = async (requestId) => {
        try {
            setRequestsLoadingIds(prev => new Set(prev).add(requestId));
            await api.post(`/friends/requests/${requestId}/decline`);
            pushToast({ title: "Pedido recusado", message: "Pedido recusado" });
            await fetchRequests();
        } catch {
            alert("Falha ao recusar pedido.");
        } finally {
            setRequestsLoadingIds(prev => { const n = new Set(prev); n.delete(requestId); return n; });
        }
    };

    // --- Block / Archive / Delete ---
    const blockUserFromModal = async (u) => {
        try { await api.post(`/friends/block/${u.id}`); pushToast({ title: "Bloqueado", message: u.name || u.username }); await loadBlocked(); await loadFriends(); setProfileUser(null); }
        catch { alert("Falha ao bloquear"); }
    };

    const unblockUser = async (id) => {
        try { await api.delete(`/friends/block/${id}`); pushToast({ title: "Desbloqueado", message: "Usuário desbloqueado" }); await loadBlocked(); await loadFriends(); }
        catch { alert("Falha ao desbloquear"); }
    };

    const toggleHide = (u) => {
        setArchivedUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]);
        if (activeUser?.id === u.id) {
            const next = users.find(x => x.id !== u.id && !archivedUsers.includes(x.id));
            setActiveUser(next || null);
        }
    };

    const deleteConversation = async (u) => {
        setMessages(prev => { const next = { ...prev }; delete next[u.id]; return next; });
        try { await api.delete(`/messages/conversation/${u.id}`); } catch {}
        pushToast({ title: "Conversa apagada", message: u.name });
    };

    // --- Calls ---
    const startOutgoingCall = async ({ calleeId, media = { audio: true, video: false } }) => {
        try {
            setCall({ mode: "outgoing", media, peer: calleeId, payload: null });
            CallManager.bindElements({ localEl: localVideoRef.current, remoteEl: remoteVideoRef.current });
            await CallManager.startCall({ callee: calleeId, media });
            try { callingAudioRef.current?.play?.(); } catch {}
        } catch (err) {
            let msg = "Falha ao iniciar chamada";
            if (err && err.name === "NotAllowedError") msg = "Permissão negada para microfone/câmera.";
            if (err && err.name === "NotFoundError") msg = "Nenhum dispositivo de áudio/vídeo encontrado.";
            if (err && err.message === "NoTracks") msg = "Nenhum dado de mídia disponível do dispositivo.";
            pushToast({ title: "Erro na chamada", message: msg });
            try { ws.send("call:cancel", { to: calleeId }); } catch {}
            setCall({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
            console.warn("startOutgoingCall failed", err);
        }
    };

    const acceptIncomingCall = async () => {
        if (call.mode !== "incoming" || !call.payload) return;
        try {
            CallManager.bindElements({ localEl: localVideoRef.current, remoteEl: remoteVideoRef.current });
            await CallManager.acceptIncoming(call.payload);
            setCall(prev => ({ ...prev, mode: "active" }));
            stopRinging();
        } catch (err) {
            pushToast({ title: "Erro", message: "Falha ao aceitar chamada" });
            setCall({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
            stopRinging();
        }
    };

    const handleEndCall = () => {
        try { CallManager.endCall(); } catch {}
        stopRinging();
        setCall({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
    };

    useEffect(() => {
        if (call.mode === "idle") {
            CallManager.bindElements({ localEl: null, remoteEl: null });
            try { callingAudioRef.current?.pause?.(); callingAudioRef.current.currentTime = 0; } catch {}
            return;
        }
        CallManager.bindElements({ localEl: localVideoRef.current, remoteEl: remoteVideoRef.current });
    }, [call.mode]);

    // --- Context menu ---
    const [ctx, setCtx] = useState({ open: false, x: 0, y: 0, user: null });
    useEffect(() => {
        const onGlobalClick = () => setCtx({ open: false, x: 0, y: 0, user: null });
        window.addEventListener("click", onGlobalClick);
        window.addEventListener("contextmenu", onGlobalClick);
        return () => { window.removeEventListener("click", onGlobalClick); window.removeEventListener("contextmenu", onGlobalClick); };
    }, []);
    const onUserRightClick = (e, u) => { e.preventDefault(); setCtx({ open: true, x: e.clientX, y: e.clientY, user: u }); };

    // --- Presence / status ---
    const setMyStatus = (status) => {
        localStorage.setItem("presenceStatus", status);
        const normalized = (status === "invisible") ? "OFFLINE" : String(status).toUpperCase(); // preserve DND
        try {
            if (typeof ws.announcePresence === "function") ws.announcePresence(normalized);
            else ws.send("presence", { userId: user?.id, status: normalized });
        } catch (err) {
            console.warn("announce presence failed", err);
        }
        setPresence(prev => { const next = new Map(prev); next.set(String(user?.id), status === "invisible" ? "offline" : status); return next; });
        setShowProfileMenu(false);
    };

    // profile menu open/close handling (fix cropping)
    useEffect(() => {
        const onDocClick = (e) => {
            if (!profileMenuRef.current) return;
            if (profileAvatarRef.current && profileAvatarRef.current.contains(e.target)) return;
            if (!profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    const onAvatarClick = (e) => { e.stopPropagation(); setShowProfileMenu(p => !p); };

    // --- Logout ---
    const handleLogout = async () => {
        try {
            if (typeof onLogout === "function") { onLogout(); return; }
        } catch (err) { console.warn("onLogout failed", err); }
        try { if (typeof ws.announcePresence === "function") ws.announcePresence("OFFLINE"); else ws.send("presence", { userId: user?.id, status: "OFFLINE" }); } catch {}
        try { ws.disconnect?.(); } catch {}
        const lastUsers = JSON.parse(localStorage.getItem("lastUsers") || "[]");
        const entry = { email: user?.email || "", username: user?.username || user?.name || "", avatar: user?.avatar || user?.avatarUrl || defaultAvatar, lastUsedAt: Date.now() };
        const updatedList = [entry, ...lastUsers.filter(u => !(u.email === entry.email || u.username === entry.username))].slice(0, 5);
        localStorage.setItem("lastUsers", JSON.stringify(updatedList));
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
    };

    // --- Lists for rendering ---
    const conversationsList = users.filter(u => !archivedUsers.includes(u.id));
    const archivedList = users.filter(u => archivedUsers.includes(u.id));
    const blockedList = blockedUsers;

    const filteredConversations = conversationsList.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
    const filteredArchived = archivedList.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
    const filteredBlocked = blockedList.filter(u => (u.username || "").toLowerCase().includes(search.toLowerCase()));

    const currentMessages = activeUser ? (messages[activeUser.id] || []) : [];

    return (
        <div className="chat-container">
            <aside className="user-list">
                <div className="profile-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ position: "relative" }}>
                            <img ref={profileAvatarRef} key={user?.avatar || user?.avatarUrl} src={user?.avatar || user?.avatarUrl || defaultAvatar} alt="Perfil" className="profile-avatar" onError={(e) => e.currentTarget.src = defaultAvatar} onClick={onAvatarClick} />
                            <div style={{ position: "absolute", right: -6, bottom: -6 }}>
                                <div className={`presence-dot ${presence.get(String(user?.id)) === "online" ? "online" : presence.get(String(user?.id)) === "away" ? "away" : presence.get(String(user?.id)) === "dnd" ? "dnd" : "offline"}`} title={`Status: ${presence.get(String(user?.id)) || "online"}`} />
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontWeight: 700 }}>{user?.username}</div>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>{presence.get(String(user?.id)) === "online" ? "Online" : presence.get(String(user?.id)) === "away" ? "Ausente" : presence.get(String(user?.id)) === "dnd" ? "Não perturbe" : "Offline"}</div>
                        </div>
                    </div>

                    <div style={{ marginLeft: 8, display: "flex", gap: 8, alignItems: "center" }}>
                        <button className="icon-btn" title="Pedidos" onClick={() => setShowRequestsModal(true)}><Bell size={16} />{pendingRequests.length > 0 && <span className="requests-badge">{pendingRequests.length}</span>}</button>
                        <button className="icon-btn" title="Adicionar" onClick={addUser}><UserPlus size={16} /></button>
                        <div style={{ position: "relative" }}>
                            {showProfileMenu && (
                                <div ref={profileMenuRef} className="profile-menu" style={{ right: 0 }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div style={{ fontWeight: 700 }}>Status</div>
                                        <button className="pill-btn" onClick={() => setMyStatus("online")}>Online</button>
                                        <button className="pill-btn" onClick={() => setMyStatus("away")}>Ausente</button>
                                        <button className="pill-btn" onClick={() => setMyStatus("dnd")}>Não perturbe</button>
                                        <button className="pill-btn" onClick={() => setMyStatus("invisible")}>Invisível</button>
                                        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,.04)", margin: "6px 0" }} />
                                        <button className="pill-btn" onClick={() => { setShowProfileMenu(false); setShowSettings(true); }}><Settings size={14} style={{ marginRight: 8 }} />Ajustes</button>
                                        <button className="pill-btn" onClick={handleLogout}>Sair</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 6, padding: "0 12px 12px" }}>
                    <button className={`pill-btn ${viewTab === "conversations" ? "active" : ""}`} onClick={() => setViewTab("conversations")}>Conversas</button>
                    <button className={`pill-btn ${viewTab === "archived" ? "active" : ""}`} onClick={() => setViewTab("archived")}>Arquivadas</button>
                    <button className={`pill-btn ${viewTab === "blocked" ? "active" : ""}`} onClick={() => setViewTab("blocked")}>Bloqueados</button>
                </div>

                <div className="search-row">
                    <input type="text" className="search-user" placeholder="Procurar..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <h3>{viewTab === "conversations" ? "Conversas" : viewTab === "archived" ? "Arquivadas" : "Bloqueados"}</h3>
                <ul className="users-ul">
                    {viewTab === "conversations" && filteredConversations.map(u => (
                        <li key={u.id} className={`user-item ${activeUser && u.id === activeUser.id ? "active" : ""}`} onClick={() => setActiveUser(u)} onContextMenu={(e) => onUserRightClick(e, u)}>
                            <div className="avatar-badge">
                                <img src={u.avatar || defaultAvatar} alt="" onError={(e) => e.currentTarget.src = defaultAvatar} />
                                <span className={`presence-dot ${presence.get(String(u.id)) === "online" ? "online" : presence.get(String(u.id)) === "away" ? "away" : presence.get(String(u.id)) === "dnd" ? "dnd" : "offline"}`} />
                            </div>
                            <div className="user-meta"><div className="user-title">{u.name}</div><div className="user-subtitle">{presence.get(String(u.id)) === "online" ? "Online" : presence.get(String(u.id)) === "away" ? "Ausente" : presence.get(String(u.id)) === "dnd" ? "Não perturbe" : "Offline"}</div></div>
                        </li>
                    ))}

                    {viewTab === "archived" && filteredArchived.map(u => (
                        <li key={u.id} className="user-item" onClick={() => setActiveUser(u)} onContextMenu={(e) => onUserRightClick(e, u)}>
                            <div className="avatar-badge"><img src={u.avatar || defaultAvatar} alt="" onError={(e) => e.currentTarget.src = defaultAvatar} /><span className={`presence-dot ${presence.get(String(u.id)) === "online" ? "online" : presence.get(String(u.id)) === "away" ? "away" : "offline"}`} /></div>
                            <div className="user-meta"><div className="user-title">{u.name}</div><div className="user-subtitle">Arquivada</div></div>
                        </li>
                    ))}

                    {viewTab === "blocked" && filteredBlocked.map(u => (
                        <li key={u.id} className="user-item" onContextMenu={(e) => onUserRightClick(e, u)}>
                            <div className="avatar-badge"><img src={u.avatar || defaultAvatar} alt="" onError={(e) => e.currentTarget.src = defaultAvatar} /><span className="presence-dot offline" /></div>
                            <div className="user-meta"><div className="user-title">{u.username || u.name || u.id}</div><div className="user-subtitle">Bloqueado</div></div>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="chat-window">
                <div className="chat-window-header">
                    <div className="peer-title">{activeUser?.name || "Selecione um contato"}</div>
                    <div className="actions">
                        <button className="pill-btn" onClick={() => activeUser && startOutgoingCall({ calleeId: activeUser.id, media: { audio: true, video: false } })} disabled={!activeUser}><Phone size={16} /> Ligação</button>
                        <button className="pill-btn" onClick={() => activeUser && startOutgoingCall({ calleeId: activeUser.id, media: { audio: true, video: true } })} disabled={!activeUser}><Video size={16} /> Vídeo</button>
                    </div>
                </div>

                <div className="messages">
                    <AnimatePresence initial={false}>
                        {currentMessages.map(msg => (
                            <motion.div key={msg.id} initial={{ opacity: 0, x: msg.sender === "me" ? 50 : -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: msg.sender === "me" ? 50 : -50 }} className={`message ${msg.sender}`}>{msg.text}</motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <input type="text" placeholder="Digite uma mensagem..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} disabled={!activeUser} />
                    <button onClick={sendMessage} className="send-btn" disabled={!activeUser}>Enviar</button>
                </div>

                {activeUser && (
                    <div className="chat-actions-row" style={{ padding: "8px 16px" }}>
                        <button className="pill-btn" onClick={() => toggleHide(activeUser)}>{archivedUsers.includes(activeUser.id) ? "Desarquivar" : "Arquivar"}</button>
                        <button className="pill-btn" onClick={() => { blockedIds.has(activeUser.id) ? unblockUser(activeUser.id) : blockUserFromModal(activeUser); }}>{blockedIds.has(activeUser.id) ? "Desbloquear" : "Bloquear"}</button>
                    </div>
                )}
            </main>

            {/* Call overlay, context menu, modals and toasts are rendered above */}
        </div>
    );
}