// javascript
// src/pages/forgot/ForgotPassword.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api/api";
import "../login/style.css";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const [step, setStep] = useState("request"); // request | reset
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [sending, setSending] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        const prefill = params.get("username") || params.get("email") || "";
        if (prefill) setUsernameOrEmail(prefill);
    }, [params]);

    useEffect(() => {
        if (!resendCooldown) return;
        const t = setInterval(() => setResendCooldown((v) => (v > 0 ? v - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [resendCooldown]);

    const sendCode = async () => {
        if (!usernameOrEmail.trim()) {
            alert("Informe seu usuário ou e-mail.");
            return;
        }
        setSending(true);
        try {
            await api.post("/auth/password/forgot", { usernameOrEmail });
            setStep("reset");
            setResendCooldown(30);
            alert("Enviamos um código de verificação para o e-mail cadastrado.");
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Não foi possível enviar o código.";
            alert(msg);
        } finally {
            setSending(false);
        }
    };

    const resendCode = async () => {
        if (resendCooldown > 0) return;
        await sendCode();
    };

    const doReset = async () => {
        if (!code.trim()) {
            alert("Informe o código recebido por e-mail.");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            alert("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }

        setResetting(true);
        try {
            await api.post("/auth/password/reset", {
                usernameOrEmail,
                code,
                newPassword
            });
            alert("Senha redefinida com sucesso. Faça login.");
            const next = usernameOrEmail.includes("@") ? "" : usernameOrEmail;
            navigate(`/login${next ? `?username=${encodeURIComponent(next)}` : ""}`, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Não foi possível redefinir a senha.";
            alert(msg);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card apple">
                <h2>Recuperar acesso</h2>

                {step === "request" && (
                    <>
                        <label>Usuário ou e-mail</label>
                        <input
                            type="text"
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            placeholder="seu-usuario ou voce@exemplo.com"
                        />
                        <button className="login-btn" onClick={sendCode} disabled={sending}>
                            {sending ? "Enviando..." : "Enviar código"}
                        </button>

                        <button className="login-btn alt" onClick={() => navigate("/login")}>
                            Voltar ao login
                        </button>
                    </>
                )}

                {step === "reset" && (
                    <>
                        <label>Código recebido por e-mail</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Digite o código"
                        />

                        <label>Nova senha</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Pelo menos 6 caracteres"
                        />

                        <label>Confirmar nova senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                        />

                        <button className="login-btn" onClick={doReset} disabled={resetting}>
                            {resetting ? "Redefinindo..." : "Redefinir senha"}
                        </button>

                        <button
                            className="login-btn alt"
                            onClick={resendCode}
                            disabled={sending || resendCooldown > 0}
                            title={resendCooldown > 0 ? `Aguarde ${resendCooldown}s` : "Reenviar código"}
                        >
                            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar código"}
                        </button>

                        <button className="login-btn ghost" onClick={() => setStep("request")}>
                            Trocar usuário/e-mail
                        </button>
                        <button className="login-btn alt" onClick={() => navigate("/login")}>
                            Voltar ao login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}