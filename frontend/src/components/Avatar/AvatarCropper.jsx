import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import getCroppedImg from "./cropImage";
import "./avatar.css";

export default function AvatarCropper({ imageSrc, onCancel, onSave }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, { size: 512 });
            onSave(croppedFile);
        } catch (e) {
            console.error(e);
            alert("Erro ao recortar a imagem");
        }
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onCancel]);

    return createPortal(
        <div className="avc-overlay" role="dialog" aria-modal="true">
            <div className="avc-container">
                <div className="avc-crop">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <div className="avc-controls">
                    <div className="avc-slider">
                        <Slider value={zoom} min={1} max={3} step={0.01} onChange={(e, val) => setZoom(val)} />
                    </div>
                    <div className="avc-actions">
                        <button className="avc-btn avc-cancel" onClick={onCancel}>Cancelar</button>
                        <button className="avc-btn avc-save" onClick={handleSave}>Salvar</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}