// src/hooks/useWebRTC.js
import { useRef, useEffect } from "react";
import ws from "../../services/ws";

export default function useWebRTC(localRef, remoteRef) {
    const pcRef = useRef(null);

    useEffect(() => {
        return () => {
            if (pcRef.current) {
                try { pcRef.current.close(); } catch {}
                pcRef.current = null;
            }
        };
    }, []);

    const startCall = async ({ callee, media }) => {
        pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] });
        const pc = pcRef.current;
        pc.onicecandidate = (e) => {
            if (e.candidate) ws.send("call:ice", { to: callee, candidate: e.candidate });
        };
        pc.ontrack = (ev) => {
            const stream = ev.streams?.[0];
            if (remoteRef.current && stream) remoteRef.current.srcObject = stream;
        };

        const stream = await navigator.mediaDevices.getUserMedia(media || { audio: true, video: false });
        if (localRef.current) localRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send("call:offer", { to: callee, sdp: offer, media });
    };

    const endCall = () => {
        try {
            pcRef.current?.getSenders?.().forEach(s => s.track?.stop?.());
            pcRef.current?.close?.();
        } catch {}
        pcRef.current = null;
    };

    return { startCall, endCall };
}