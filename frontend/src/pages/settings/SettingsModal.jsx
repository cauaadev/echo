// javascript
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api/api";
import AvatarUploader from "../../components/Avatar/AvatarUploader";
import defaultAvatar from "../../assets/default-avatar.png";
import ws from "../../services/ws";
import "./settingsmodal.css";

const TABS = [
    { id: "profile", label: "Perfil" },
    { id: "password", label: "Senha" },
    { id: "webcam", label: "Webcam" },
    { id: "mic", label: "Microfone" },
];

function addCacheBuster(url) {
    if (!url) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}v=${Date.now()}`;
}

function maskEmail(email) {
    if (!email) return "";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}${"*".repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}`;
    return `${maskedUser}@${domain}`;
}

export default function SettingsModal({ user, onClose, onUpdated }) {
    const [tab, setTab] = useState("profile");

    const [avatar, setAvatar] = useState(user?.avatar || user?.avatarUrl || defaultAvatar);
    const [username, setUsername] = useState(user?.username || user?.name || "");
    const [nickname, setNickname] = useState(user?.nickname || "");
    const [email, setEmail] = useState(user?.email || "");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [passwordCurrent, setPasswordCurrent] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [codeVerified, setCodeVerified] = useState(false);

    const [videoDevices, setVideoDevices] = useState([]);
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState("");
    const [selectedAudio, setSelectedAudio] = useState("");
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    const [micLevel, setMicLevel] = useState(0);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data } = await api.get("/user/me");
                if (!mounted) return;
                setUsername(data?.username || user?.username || "");
                setNickname(data?.nickname || user?.nickname || "");
                setEmail(data?.email || user?.email || "");
                const url = data?.avatarUrl || data?.avatar || user?.avatarUrl || user?.avatar || "";
                setAvatar(url ? addCacheBuster(url) : defaultAvatar);
            } catch {}
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setUsername(user?.username || user?.name || "");
        setNickname(user?.nickname || "");
        setEmail(user?.email || "");
        setAvatar(user?.avatar || user?.avatarUrl || defaultAvatar);
    }, [user]);

    useEffect(() => {
        let mounted = true;
        if (!navigator?.mediaDevices?.enumerateDevices) return;
        navigator.mediaDevices.enumerateDevices().then(devices => {
            if (!mounted) return;
            setVideoDevices(devices.filter(d => d.kind === "videoinput"));
            setAudioDevices(devices.filter(d => d.kind === "audioinput"));
            setSelectedVideo(devices.find(d => d.kind === "videoinput")?.deviceId || "");
            setSelectedAudio(devices.find(d => d.kind === "audioinput")?.deviceId || "");
        }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (tab !== "webcam" && tab !== "mic") {
            stopStreams();
            return;
        }
        if (!navigator?.mediaDevices?.getUserMedia) return;

        stopStreams();
        const constraints = {
            video: tab === "webcam" ? { deviceId: selectedVideo ? { exact: selectedVideo } : undefined } : false,
            audio: tab === "mic" ? { deviceId: selectedAudio ? { exact: selectedAudio } : undefined } : false
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(s => {
                setStream(s);
                if (videoRef.current && tab === "webcam") videoRef.current.srcObject = s;
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, selectedVideo, selectedAudio]);

    useEffect(() => {
        if (tab !== "mic" || !stream) {
            teardownAudio();
            return;
        }
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            source.connect(analyser);

            audioCtxRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const loop = () => {
                analyser.getByteTimeDomainData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const v = (dataArray[i] - 128) / 128;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / dataArray.length);
                const level = Math.min(1, rms * 1.8);
                setMicLevel(level);
                rafRef.current = requestAnimationFrame(loop);
            };
            loop();
        } catch {
            teardownAudio();
        }
        return () => teardownAudio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, stream]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const stopStreams = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        setStream(null);
        teardownAudio();
    };

    const teardownAudio = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch {}
        }
        audioCtxRef.current = null;
        analyserRef.current = null;
        setMicLevel(0);
    };

    const validateProfile = () => {
        const e = {};
        if (!username || username.trim().length < 3) e.username = "Mínimo 3 caracteres.";
        if (nickname && nickname.length > 32) e.nickname = "Máximo 32 caracteres.";
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) e.email = "Email inválido.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validatePassword = () => {
        const e = {};
        if (!passwordCurrent) e.passwordCurrent = "Informe sua senha atual.";
        if (!newPassword || newPassword.length < 6) e.newPassword = "Nova senha deve ter pelo menos 6 caracteres.";
        if (newPassword !== confirmPassword) e.confirmPassword = "As senhas novas não coincidem.";
        if (!codeSent) e.code = "Envie o código de verificação para o seu email.";
        if (!verificationCode) e.code = "Digite o código de verificação enviado ao seu email.";
        if (!codeVerified) e.code = "Valide o código antes de alterar a senha.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSendCode = async () => {
        if (!email) return alert("Email do usuário não encontrado.");
        setSendingCode(true);
        try {
            await api.post("/user/me/password/code");
            setCodeSent(true);
            setCodeVerified(false);
            alert(`Código enviado para ${email}.`);
        } catch (err) {
            const msg = err?.response?.data?.message || "Não foi possível enviar o código.";
            alert(msg);
        } finally {
            setSendingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) {
            setErrors(prev => ({ ...prev, code: "Informe o código recebido por email." }));
            return;
        }
        setVerifyingCode(true);
        try {
            await api.post("/user/me/password/verify", { code: verificationCode });
            setCodeVerified(true);
            setErrors(prev => ({ ...prev, code: undefined }));
            alert("Código verificado com sucesso.");
        } catch (err) {
            setCodeVerified(false);
            const msg = err?.response?.data?.message || "Código inválido.";
            alert(msg);
        } finally {
            setVerifyingCode(false);
        }
    };

    const handleSave = async () => {
        if (tab === "password") {
            if (!validatePassword()) return;
            setLoading(true);
            try {
                await api.post("/user/me/password", {
                    currentPassword: passwordCurrent,
                    newPassword,
                    code: verificationCode
                });
                setPasswordCurrent("");
                setNewPassword("");
                setConfirmPassword("");
                setVerificationCode("");
                setCodeSent(false);
                setCodeVerified(false);
                alert("Senha alterada com sucesso.");
            } catch (err) {
                const msg = err?.response?.data?.message || "Erro ao alterar senha.";
                alert(msg);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!validateProfile()) return;

        const formData = new FormData();
        if (avatar instanceof File) formData.append("avatar", avatar);
        formData.append("username", username);
        formData.append("nickname", nickname);
        formData.append("email", email);

        setLoading(true);
        try {
            await api.patch("/user/me", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const { data } = await api.get("/user/me");
            const freshUrl = data?.avatarUrl || data?.avatar || "";
            const busted = freshUrl ? addCacheBuster(freshUrl) : defaultAvatar;

            onUpdated?.({
                ...user,
                username: data?.username ?? username,
                name: data?.username ?? user?.name ?? username,
                nickname,
                email: data?.email ?? email,
                avatar: busted,
                avatarUrl: busted
            });

            ws.send("user:update", {
                id: user.id,
                username: data?.username ?? username,
                email: data?.email ?? email,
                avatarUrl: data?.avatarUrl || freshUrl
            });

            alert("Perfil atualizado com sucesso.");
        } catch (err) {
            const msg = err?.response?.data?.message || "Erro ao salvar perfil.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const content = useMemo(() => {
        switch (tab) {
            case "profile":
                return (
                    <div className="sm-grid">
                        <div className="sm-left">
                            <div className="sm-card">
                                <h4>Foto de perfil</h4>
                                <AvatarUploader avatar={avatar} setAvatar={setAvatar} />
                                <small className="sm-hint">Se remover, será usado o avatar padrão.</small>
                            </div>
                        </div>
                        <div className="sm-right">
                            <div className="sm-card">
                                <label>Nome de Usuário</label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="seu-usuario" />
                                {errors.username && <small className="sm-error">{errors.username}</small>}

                                <label>Nickname (exibição)</label>
                                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Seu apelido" />
                                {errors.nickname && <small className="sm-error">{errors.nickname}</small>}

                                <label>Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
                                {errors.email && <small className="sm-error">{errors.email}</small>}
                                <small className="sm-hint">O email é usado para verificações e recuperação.</small>
                            </div>
                        </div>
                    </div>
                );
            case "password":
                return (
                    <div className="sm-card">
                        <div className="sm-grid-1col">
                            <div className="sm-row">
                                <label>Email para verificação</label>
                                <input type="text" value={email} readOnly />
                                <small className="sm-hint">O código será enviado para: {maskEmail(email)}</small>
                            </div>

                            <div className="sm-row inline">
                                <button className="sm-btn ghost" onClick={handleSendCode} disabled={sendingCode}>
                                    {sendingCode ? "Enviando..." : "Enviar código"}
                                </button>
                                <input
                                    type="text"
                                    placeholder="Código de verificação"
                                    value={verificationCode}
                                    onChange={e => setVerificationCode(e.target.value)}
                                    className="sm-code-input"
                                />
                                <button className="sm-btn alt" onClick={handleVerifyCode} disabled={verifyingCode || !verificationCode}>
                                    {verifyingCode ? "Verificando..." : (codeVerified ? "Verificado ✓" : "Validar código")}
                                </button>
                            </div>
                            {errors.code && <small className="sm-error">{errors.code}</small>}

                            <label>Nova Senha</label>
                            <input type="password" placeholder="Nova senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            {errors.newPassword && <small className="sm-error">{errors.newPassword}</small>}

                            <label>Confirmar Nova Senha</label>
                            <input type="password" placeholder="Confirme a nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            {errors.confirmPassword && <small className="sm-error">{errors.confirmPassword}</small>}

                            <label>Senha Atual</label>
                            <input type="password" placeholder="Digite sua senha atual" value={passwordCurrent} onChange={e => setPasswordCurrent(e.target.value)} />
                            {errors.passwordCurrent && <small className="sm-error">{errors.passwordCurrent}</small>}
                        </div>
                    </div>
                );
            case "webcam":
                return (
                    <div className="sm-card">
                        <label>Dispositivo de Vídeo</label>
                        <select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)}>
                            {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Câmera"}</option>)}
                        </select>
                        <div className="webcam-preview">
                            <video ref={videoRef} autoPlay muted playsInline />
                        </div>
                    </div>
                );
            case "mic":
                return (
                    <div className="sm-card">
                        <label>Entrada de Áudio</label>
                        <select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)}>
                            {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || "Microfone"}</option>)}
                        </select>

                        <label style={{ marginTop: 12 }}>Teste de volume</label>
                        <div className="mic-meter">
                            <div className="mic-meter-bg" />
                            <div
                                className="mic-meter-fill"
                                style={{ width: `${Math.round(micLevel * 100)}%` }}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(micLevel * 100)}
                            />
                        </div>
                        <small className="sm-hint">Fale no microfone para ver a barra se mover.</small>
                    </div>
                );
            default:
                return null;
        }
    }, [
        tab, avatar, username, nickname, email,
        passwordCurrent, newPassword, confirmPassword,
        errors, videoDevices, audioDevices, selectedVideo, selectedAudio, micLevel,
        codeSent, codeVerified, sendingCode, verificationCode, verifyingCode, user
    ]);

    return createPortal(
        <AnimatePresence>
            <motion.div className="sm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="sm-modal" role="dialog" aria-modal="true" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }}>
                    <div className="sm-header">
                        <h3>Configurações</h3>
                        <button className="sm-close" aria-label="Fechar" onClick={() => { stopStreams(); onClose?.(); }}>×</button>
                    </div>

                    <div className="sm-tabs">
                        {TABS.map(t => (
                            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="sm-content">
                        {content}
                    </div>

                    <div className="sm-footer">
                        <button className="sm-btn" onClick={handleSave} disabled={loading}>
                            {loading ? "Salvando..." : (tab === "password" ? "Salvar nova senha" : "Salvar Configurações")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}