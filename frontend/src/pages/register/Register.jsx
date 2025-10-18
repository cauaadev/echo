// javascript
// src/pages/register/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api/api";
import "../login/style.css";

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "", avatarUrl: "" });
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password || !form.email) {
            alert("Preencha usuário, e-mail e senha.");
            return;
        }
        setLoading(true);
        try {
            await api.post("/auth/register", {
                username: form.username,
                password: form.password,
                email: form.email,
                avatarUrl: form.avatarUrl || ""
            });
            alert("Conta criada com sucesso!");
            navigate(`/login?username=${encodeURIComponent(form.username)}`, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Falha ao registrar.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card apple">
                <h2>Criar conta</h2>
                <form onSubmit={submit}>
                    <label>Usuário</label>
                    <input name="username" value={form.username} onChange={onChange} placeholder="seu-usuario" />

                    <label>E-mail</label>
                    <input name="email" type="email" value={form.email} onChange={onChange} placeholder="voce@exemplo.com" />

                    <label>Senha</label>
                    <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Crie uma senha" />

                    <label>Avatar (URL opcional)</label>
                    <input name="avatarUrl" value={form.avatarUrl} onChange={onChange} placeholder="https://..." />

                    <button className="login-btn" type="submit" disabled={loading}>
                        {loading ? "Criando..." : "Registrar"}
                    </button>
                    <button type="button" className="login-btn alt" onClick={() => navigate("/login")}>
                        Já tenho conta
                    </button>
                </form>
            </div>
        </div>
    );
}