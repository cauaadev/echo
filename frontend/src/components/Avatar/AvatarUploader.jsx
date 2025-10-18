// javascript
// src/components/Avatar/AvatarUploader.jsx
import React, { useEffect, useRef, useState } from "react";
import defaultAvatar from "../../assets/default-avatar.png";

export default function AvatarUploader({ avatar, setAvatar }) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(typeof avatar === "string" ? avatar : defaultAvatar);

    useEffect(() => {
        if (avatar instanceof File) {
            const url = URL.createObjectURL(avatar);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        } else if (typeof avatar === "string") {
            setPreview(avatar || defaultAvatar);
        }
    }, [avatar]);

    const onPick = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
            alert("Escolha uma imagem (png, jpg, jpeg, webp).");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Imagem até 5MB.");
            return;
        }
        setAvatar(file);
    };

    const remove = () => {
        setAvatar(defaultAvatar);
        setPreview(defaultAvatar);
    };

    return (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img
                src={preview || defaultAvatar}
                alt="avatar"
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,.12)" }}
                onError={(e) => { e.currentTarget.src = defaultAvatar; }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="sm-btn" onClick={() => inputRef.current?.click()}>Escolher imagem</button>
                <button className="sm-btn ghost" onClick={remove}>Remover</button>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPick} />
            </div>
        </div>
    );
}