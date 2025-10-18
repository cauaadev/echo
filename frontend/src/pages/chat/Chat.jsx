// javascript
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Mic, MicOff, Camera, CameraOff, Settings, UserPlus } from "lucide-react";
import "./style.css";
import SettingsModal from "../settings/SettingsModal";
import defaultAvatar from "../../assets/default-avatar.png";
import ws from "../../services/ws";
import CallManager from "../../services/call/CallManager.js";
import api from "../../services/api/api";

const BASE = (import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/";
const CALLING_SOUND_URL = `${BASE}assets/calling-mp3.mp3`;
const MESSAGE_SOUND_URL = `${BASE}assets/message-mp3.mp3`;

function Toast({ toast, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, toast.duration || 3500);
        return () => clearTimeout(t);
    }, [toast, onClose]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="mini-toast"
        >
            <img
                src={toast.avatar || defaultAvatar}
                alt=""
                width={32}
                height={32}
                style={{ borderRadius: 8, objectFit: "cover" }}
                onError={(e) => { e.currentTarget.src = defaultAvatar; }}
            />
            <div className="mini-toast-texts">
                <strong>{toast.title}</strong>
                <span>{toast.message}</span>
            </div>
        </motion.div>
    );
}

export default function Chat({ user, onUserUpdate }) {
    const navigate = useNavigate();

    const [users, setUsers] = useState([
        { id: 1, name: "Alice", blocked: false, hidden: false, avatar: defaultAvatar },
        { id: 2, name: "Bob", blocked: false, hidden: false, avatar: defaultAvatar },
        { id: 3, name: user?.name || user?.username || "Você", blocked: false, hidden: false, avatar: user?.avatar || user?.avatarUrl || defaultAvatar }
    ]);
    const [activeUser, setActiveUser] = useState(users[0]);
    const [messages, setMessages] = useState({
        Alice: [{ id: 1, text: "Oi, eu sou Alice!", sender: "other" }],
        Bob: [{ id: 2, text: "Oi, eu sou Bob!", sender: "other" }],
        [user?.name || user?.username || "Você"]: []
    });
    const [input, setInput] = useState("");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [search, setSearch] = useState("");
    const [archivedUsers, setArchivedUsers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Chamada
    const [call, setCall] = useState({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);

    const messagesEndRef = useRef(null);
    const messageAudioRef = useRef(null);
    const callingAudioRef = useRef(null);
    const [isWindowFocused, setIsWindowFocused] = useState(!document.hidden);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeUser, messages]);

    useEffect(() => {
        const onVis = () => setIsWindowFocused(!document.hidden);
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    // Sons
    useEffect(() => {
        messageAudioRef.current = new Audio(MESSAGE_SOUND_URL);
        messageAudioRef.current.volume = 0.6;

        callingAudioRef.current = new Audio(CALLING_SOUND_URL);
        callingAudioRef.current.loop = true;
        callingAudioRef.current.volume = 0.7;
    }, []);

    // WS
    useEffect(() => {
        const offMsg = ws.on("message:new", ({ from, text, avatar }) => {
            setMessages(prev => {
                const arr = prev[from] || [];
                return { ...prev, [from]: [...arr, { id: Date.now(), text, sender: "other" }] };
            });
            const notActive = activeUser?.name !== from;
            if (notActive || !isWindowFocused) {
                try { messageAudioRef.current?.play?.(); } catch {}
                pushToast({ title: from, message: text, avatar: avatar || defaultAvatar });
            }
        });

        const offUserUpdated = ws.on("user:updated", (payload) => {
            if (!payload) return;
            if ((payload.id && payload.id === user.id) || (payload.username && payload.username === user.username)) {
                onUserUpdate?.({
                    username: payload.username ?? user.username,
                    email: payload.email ?? user.email,
                    avatarUrl: payload.avatarUrl,
                    avatar: payload.avatarUrl
                });
            }
        });

        const offCallIncoming = ws.on("call:incoming", (payload) => {
            setCall({ mode: "incoming", media: payload.media || { audio: true, video: false }, peer: payload.from, payload });
            try { callingAudioRef.current?.play?.(); } catch {}
            setMicOn(true);
            setCamOn(!!(payload.media && payload.media.video));
        });

        const offCallAnswer = ws.on("call:answer", async ({ from, sdp }) => {
            const ok = await CallManager.applyAnswer({ from, sdp });
            if (ok) {
                setCall(prev => ({ ...prev, mode: "active" }));
                stopRinging();
            }
        });

        const offIce = ws.on("call:ice", async ({ from, candidate }) => {
            try { await CallManager.onRemoteIce({ from, candidate }); } catch {}
        });

        const offEnd = ws.on("call:end", () => {
            handleEndCall();
        });

        return () => { offMsg?.(); offUserUpdated?.(); offCallIncoming?.(); offCallAnswer?.(); offIce?.(); offEnd?.(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeUser?.name, isWindowFocused, onUserUpdate, user]);

    const stopRinging = () => {
        try { callingAudioRef.current?.pause?.(); callingAudioRef.current.currentTime = 0; } catch {}
    };

    const pushToast = (t) => {
        const toast = { id: crypto.randomUUID?.() || String(Date.now()), ...t, duration: 3500 };
        setToasts(prev => [...prev, toast]);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const sendMessage = () => {
        if (!input.trim()) return;
        const newMessage = { id: Date.now(), text: input, sender: "me" };
        setMessages(prev => ({
            ...prev,
            [activeUser.name]: [...(prev[activeUser.name] || []), newMessage]
        }));
        ws.send("message:new", { to: activeUser.name, text: input });
        setInput("");
    };

    const addUser = async () => {
        const name = (search || "").trim();
        if (!name) return;

        if (name.toLowerCase() === (user?.username || "").toLowerCase()) {
            alert("Você não pode adicionar a si mesmo.");
            return;
        }

        if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
            alert("Usuário já está na sua lista.");
            return;
        }

        try {
            const { data } = await api.get(`/users/${encodeURIComponent(name)}`);
            const contactName = data?.username || name;

            const newUser = {
                id: data?.id || Date.now(),
                name: contactName,
                blocked: false,
                hidden: false,
                avatar: data?.avatarUrl || defaultAvatar
            };

            setUsers(prev => [...prev, newUser]);
            setMessages(prev => ({ ...prev, [contactName]: [] }));
            setSearch("");
            pushToast({ title: "Contato adicionado", message: contactName, avatar: newUser.avatar });
        } catch (err) {
            const msg = err?.response?.data?.message || "Usuário não encontrado.";
            alert(msg);
        }
    };

    const toggleBlock = (u) => {
        setUsers(prev => prev.map(user => user.id === u.id ? { ...user, blocked: !user.blocked } : user));
    };

    const toggleHide = (u) => {
        setUsers(prev => prev.map(user => user.id === u.id ? { ...user, hidden: !user.hidden } : user));
    };

    const archiveConversation = (u) => {
        setArchivedUsers(prev => [...prev, u.id]);
        if (activeUser.id === u.id) setActiveUser(users[0]);
    };

    const filteredUsers = users.filter(
        u => !u.hidden && !archivedUsers.includes(u.id) && u.name.toLowerCase().includes(search.toLowerCase())
    );
    const currentMessages = messages[activeUser.name] || [];

    const handleLogout = () => {
        const lastUsers = JSON.parse(localStorage.getItem("lastUsers") || "[]");
        const entry = {
            email: user?.email || "",
            username: user?.username || user?.name || "",
            avatar: user?.avatar || user?.avatarUrl || defaultAvatar,
            lastUsedAt: Date.now()
        };
        const updatedList = [entry, ...lastUsers.filter(u => !(u.email === entry.email || u.username === entry.username))].slice(0, 5);
        localStorage.setItem("lastUsers", JSON.stringify(updatedList));
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setShowProfileMenu(false);
        navigate("/login", { replace: true });
    };

    const handleSwitchAccount = () => {
        const lastUsers = JSON.parse(localStorage.getItem("lastUsers") || "[]");
        const entry = {
            email: user?.email || "",
            username: user?.username || user?.name || "",
            avatar: user?.avatar || user?.avatarUrl || defaultAvatar,
            lastUsedAt: Date.now()
        };
        const updatedList = [entry, ...lastUsers.filter(u => !(u.email === entry.email || u.username === entry.username))].slice(0, 5);
        localStorage.setItem("lastUsers", JSON.stringify(updatedList));
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setShowProfileMenu(false);
        navigate("/login", { replace: true });
    };

    const startVoiceCall = async () => {
        setCall({ mode: "outgoing", media: { audio: true, video: false }, peer: activeUser.name, payload: null });
        setMicOn(true); setCamOn(false);
        try { await CallManager.startCall({ callee: activeUser.name, media: { audio: true, video: false } }); } catch {}
        try { callingAudioRef.current?.play?.(); } catch {}
    };

    const startVideoCall = async () => {
        setCall({ mode: "outgoing", media: { audio: true, video: true }, peer: activeUser.name, payload: null });
        setMicOn(true); setCamOn(true);
        try { await CallManager.startCall({ callee: activeUser.name, media: { audio: true, video: true } }); } catch {}
        try { callingAudioRef.current?.play?.(); } catch {}
    };

    const handleAcceptIncoming = async () => {
        if (call.mode !== "incoming" || !call.payload) return;
        try {
            await CallManager.acceptIncoming(call.payload);
            setCall(prev => ({ ...prev, mode: "active" }));
        } finally {
            stopRinging();
        }
    };

    const handleDeclineIncoming = () => {
        ws.send("call:end", { to: call.peer });
        stopRinging();
        CallManager.endCall();
        setCall({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
    };

    const handleEndCall = () => {
        stopRinging();
        CallManager.endCall();
        setCall({ mode: "idle", media: { audio: true, video: false }, peer: null, payload: null });
    };

    const toggleMic = () => {
        const next = !micOn;
        setMicOn(next);
        CallManager.setAudioEnabled(next);
    };

    const toggleCam = () => {
        const next = !camOn;
        setCamOn(next);
        CallManager.setVideoEnabled(next);
    };

    useEffect(() => {
        if (call.mode === "idle") return;
        const local = localVideoRef.current;
        const remote = remoteVideoRef.current;
        CallManager.bindElements({ localEl: local, remoteEl: remote });
        return () => CallManager.bindElements({ localEl: null, remoteEl: null });
    }, [call.mode]);

    return (
        <div className="chat-container">
            <aside className="user-list">
                <div className="profile-header">
                    <img
                        key={user?.avatar || user?.avatarUrl}
                        src={user?.avatar || user?.avatarUrl || defaultAvatar}
                        alt="Perfil"
                        className="profile-avatar"
                        onClick={() => setShowProfileMenu(prev => !prev)}
                        onError={(e) => { e.currentTarget.src = defaultAvatar; }}
                    />
                    {showProfileMenu && (
                        <div className="profile-menu">
                            <button onClick={() => setShowSettings(true)}><Settings size={16} /> Ajustes</button>
                            <button onClick={handleSwitchAccount}>Trocar de conta</button>
                            <button onClick={handleLogout}>Sair</button>
                        </div>
                    )}
                </div>

                <div className="search-row">
                    <input
                        type="text"
                        placeholder="Procurar ou adicionar usuário"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addUser()}
                        className="search-user"
                    />
                    <button className="icon-btn" title="Adicionar" onClick={addUser}><UserPlus size={18} /></button>
                </div>

                <h3>Conversas</h3>
                <ul className="users-ul">
                    {filteredUsers.map(u => (
                        <li
                            key={u.id}
                            className={`user-item ${u.name === activeUser.name ? "active" : ""}`}
                            onClick={() => setActiveUser(u)}
                        >
                            <div className="avatar-badge">
                                <img src={u.avatar || defaultAvatar} alt="" onError={(e) => { e.currentTarget.src = defaultAvatar; }} />
                            </div>
                            <div className="user-meta">
                                <div className="user-title">{u.name}</div>
                                <div className="user-subtitle">{u.blocked ? "Bloqueado" : "Online"}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </aside>

            <main className="chat-window">
                <div className="chat-window-header">
                    <div className="peer-title">{activeUser.name}</div>
                    <div className="actions">
                        <button className="pill-btn" onClick={startVoiceCall}><Phone size={16} /> Ligação</button>
                        <button className="pill-btn" onClick={startVideoCall}><Video size={16} /> Vídeo</button>
                    </div>
                </div>

                <div className="messages">
                    <AnimatePresence initial={false}>
                        {currentMessages.map(msg => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: msg.sender === "me" ? 50 : -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: msg.sender === "me" ? 50 : -50 }}
                                className={`message ${msg.sender}`}
                            >
                                {msg.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        placeholder="Digite uma mensagem..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage} className="send-btn">Enviar</button>
                </div>
            </main>

            <AnimatePresence>
                {call.mode !== "idle" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="call-overlay"
                    >
                        <div className="call-card">
                            <div className="call-header">
                                <strong>{call.mode === "incoming" ? `Chamada de ${call.peer}` : call.mode === "outgoing" ? `Chamando ${call.peer}` : `Em chamada com ${call.peer}`}</strong>
                                <div className="call-actions">
                                    {call.mode === "incoming" ? (
                                        <>
                                            <button className="btn-accept" onClick={handleAcceptIncoming}><Phone size={16} /> Atender</button>
                                            <button className="btn-decline" onClick={handleDeclineIncoming}><PhoneOff size={16} /> Recusar</button>
                                        </>
                                    ) : (
                                        <button className="btn-decline" onClick={handleEndCall}><PhoneOff size={16} /> Encerrar</button>
                                    )}
                                </div>
                            </div>

                            {call.media.video ? (
                                <div className="call-videos">
                                    <video ref={remoteVideoRef} id="remoteVideo" autoPlay playsInline className="remote-video" />
                                    <video ref={localVideoRef} id="localVideo" autoPlay muted playsInline className="local-video" />
                                </div>
                            ) : (
                                <div className="call-audio-visual">
                                    <img src={defaultAvatar} alt="" />
                                    <div className="status-text">
                                        {call.mode === "incoming" ? "Recebendo chamada de áudio..." : call.mode === "outgoing" ? "Chamando..." : "Em chamada..."}
                                    </div>
                                </div>
                            )}

                            <div className="call-controls">
                                <button className="circle-btn" onClick={toggleMic} title={micOn ? "Mutar microfone" : "Desmutar microfone"}>
                                    {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                                </button>
                                {call.media.video && (
                                    <button className="circle-btn" onClick={toggleCam} title={camOn ? "Desligar câmera" : "Ligar câmera"}>
                                        {camOn ? <Camera size={18} /> : <CameraOff size={18} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSettings && (
                    <SettingsModal
                        user={user}
                        onClose={() => setShowSettings(false)}
                        onUpdated={(updated) => onUserUpdate?.(updated)}
                    />
                )}
            </AnimatePresence>

            <div className="toasts">
                <AnimatePresence>
                    {toasts.map(t => (
                        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}