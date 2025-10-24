import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api/api";
import "../login/style.css";
import defaultAvatar from "../../assets/default-avatar.png";

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "", avatarUrl: "" });
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // handle file selection and upload
    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // preview
        const url = URL.createObjectURL(file);
        setPreview(url);

        // try upload to backend endpoint /uploads (multipart)
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            // assume backend exposes POST /uploads that returns { url: "/uploads/filename.jpg" } or full URL
            const resp = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const uploadedUrl = resp?.data?.url || resp?.data?.path || resp?.data?.filename;
            if (uploadedUrl) {
                // if backend returns relative path, prefix with base
                const finalUrl = uploadedUrl.startsWith("http") ? uploadedUrl : (import.meta.env.VITE_API_BASE_URL || "") + uploadedUrl;
                setForm(prev => ({ ...prev, avatarUrl: finalUrl }));
            } else {
                // fallback: convert to data URL
                const dataUrl = await fileToDataUrl(file);
                setForm(prev => ({ ...prev, avatarUrl: dataUrl }));
            }
        } catch (err) {
            // fallback to data URL
            try {
                const dataUrl = await fileToDataUrl(file);
                setForm(prev => ({ ...prev, avatarUrl: dataUrl }));
            } catch {}
        } finally {
            setUploading(false);
        }
    };

    const fileToDataUrl = (file) => new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(file);
    });

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

                    <label>Avatar (arquivo do seu PC)</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="file" accept="image/*" onChange={handleFile} />
                        <div style={{ width: 64, height: 64 }}>
                            <img src={preview || form.avatarUrl || defaultAvatar} alt="preview" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} onError={(e) => e.currentTarget.src = defaultAvatar} />
                        </div>
                    </div>

                    <label>Avatar (URL opcional)</label>
                    <input name="avatarUrl" value={form.avatarUrl} onChange={onChange} placeholder="https://..." />

                    <button className="login-btn" type="submit" disabled={loading || uploading}>
                        {loading ? "Criando..." : uploading ? "Enviando avatar..." : "Registrar"}
                    </button>
                    <button type="button" className="login-btn alt" onClick={() => navigate("/login")}>
                        Já tenho conta
                    </button>
                </form>
            </div>
        </div>
    );
}