import { useCallback } from "react";

export default function useSound(src) {
    return useCallback(() => {
        if (!src) return;
        const audio = new Audio(src);
        audio.play().catch((err) => console.log("Erro ao tocar som:", err));
    }, [src]);
}
