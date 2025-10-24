import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api/api";
import defaultAvatar from "../../assets/default-avatar.png";
import "./style.css";

function addCacheBuster(url) {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${Date.now()}`;
}

export default function Login({ onLogin }) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [step, setStep] = useState("choose");
    const [lastUsers, setLastUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("user");
        if (saved) {
            // already logged in
            navigate("/", { replace: true });
            return;
        }
        const lu = JSON.parse(localStorage.getItem("lastUsers") || "[]");
        // Normaliza avatar (põe cache buster se houver)
        const normalized = (lu || []).map(u => ({ ...u, avatar: u.avatar ? addCacheBuster(u.avatar) : defaultAvatar }));
        setLastUsers(normalized);
        const forced = params.get("username");
        if (forced) {
            setUsername(forced);
            setStep("password");
        } else if (normalized.length === 0) {
            setStep("username");
        } else {
            setStep("choose");
        }
    }, [navigate, params]);

    const chooseAccount = (u) => {
        setSelectedUser(u);
        setUsername(u.username || u.email || "");
        setStep("password");
    };

    const useAnother = () => {
        setSelectedUser(null);
        setUsername("");
        setPassword("");
        setStep("username");
    };

    const handleNext = () => {
        if (!username) return;
        setStep("password");
    };

    const doLogin = async () => {
        if (!username || !password) return;
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { username, password });
            const token = data?.token || data?.jwt || data?.accessToken;
            if (!token) throw new Error("Token não retornado pelo servidor.");
            localStorage.setItem("token", token);

            const me = await api.get("/user/me");
            const userData = me.data || {};
            const rawAvatar = userData.avatarUrl || "";
            const avatarBusted = rawAvatar ? addCacheBuster(rawAvatar) : defaultAvatar;

            const logged = {
                id: userData.id,
                username: userData.username || username,
                name: userData.username || username,
                email: userData.email || "",
                avatar: avatarBusted,
                avatarUrl: avatarBusted
            };

            localStorage.setItem("user", JSON.stringify(logged));

            const lu = JSON.parse(localStorage.getItem("lastUsers") || "[]");
            const entry = {
                username: logged.username,
                email: logged.email,
                avatar: avatarBusted || defaultAvatar,
                lastUsedAt: Date.now()
            };
            const filtered = lu.filter(x => !(x.email === entry.email || x.username === entry.username));
            localStorage.setItem("lastUsers", JSON.stringify([entry, ...filtered].slice(0, 5)));

            onLogin?.(logged);
            navigate("/", { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Falha no login.";
            alert(msg);
            localStorage.removeItem("token");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card apple">
                <h2>Entrar</h2>

                {step === "choose" && (
                    <>
                        <div className="account-list">
                            {lastUsers.map(u => (
                                <button key={`${u.username}-${u.email}`} className="account-item apple" onClick={() => chooseAccount(u)}>
                                    <img
                                        src={u.avatar || defaultAvatar}
                                        alt={u.username || u.email}
                                        onError={(e) => { e.currentTarget.src = defaultAvatar; }}
                                    />
                                    <div className="meta">
                                        <strong className="title">{u.username || u.email}</strong>
                                        {u.email && <span className="subtitle">{u.email}</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button className="login-btn alt ghost" onClick={useAnother}>Usar outra conta</button>
                    </>
                )}

                {step === "username" && (
                    <>
                        <label>Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="seu-usuario"
                        />
                        <button className="login-btn" onClick={handleNext}>Próximo</button>
                    </>
                )}

                {step === "password" && (
                    <>
                        <div className="account-selected">
                            <img src={selectedUser?.avatar || defaultAvatar} alt="avatar" onError={(e) => { e.currentTarget.src = defaultAvatar; }} />
                            <div className="meta">
                                <strong className="title">{selectedUser?.username || username}</strong>
                                {selectedUser?.email && <span className="subtitle">{selectedUser.email}</span>}
                            </div>
                        </div>
                        <label>Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" />
                        <button className="login-btn" disabled={loading} onClick={doLogin}>
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                        <button className="login-btn alt ghost" onClick={useAnother}>Usar outra conta</button>
                    </>
                )}

                <button className="login-btn alt" onClick={() => navigate("/register")}>
                    Criar conta
                </button>
                <button className="login-btn ghost" onClick={() => navigate("/forgot")}>
                    Esqueci minha senha
                </button>
            </div>
        </div>
    );
}