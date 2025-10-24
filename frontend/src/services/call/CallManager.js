// services/call/CallManager.js
// Robust CallManager: add guards, avoid calling methods on non-MediaStream objects,
// attach streams only when present, and safe endCall.

import ws from "../ws"; // ajuste se necessário (../ws/client)

const iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];

let pc = null;
let localStream = null;
let localEl = null;
let remoteEl = null;
let currentPeer = null;
let ringingTimeout = null;

function isMediaStream(obj) {
    return !!obj && typeof obj.getTracks === "function";
}

function bindElements({ localEl: l, remoteEl: r }) {
    localEl = l || null;
    remoteEl = r || null;
    try {
        if (localEl && isMediaStream(localStream)) localEl.srcObject = localStream;
    } catch (e) {
        console.warn("bindElements error", e);
    }
}

function attachRemote(e) {
    const stream = e.streams?.[0];
    if (!stream) return;
    if (remoteEl) {
        try { remoteEl.srcObject = stream; } catch (err) { console.warn("attachRemote error", err); }
    }
}

async function createPeer() {
    if (pc) return pc;
    pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (ev) => {
        if (ev.candidate && currentPeer) {
            try { ws.send("call:ice", { to: currentPeer, candidate: ev.candidate }); } catch (err) { console.warn("send ice failed", err); }
        }
    };

    pc.ontrack = attachRemote;

    pc.onconnectionstatechange = () => {
        if (!pc) return;
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
            endCall();
        }
    };

    return pc;
}

async function ensureLocal(media) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("MediaDevicesNotSupported");

    // stop previous
    if (isMediaStream(localStream)) {
        try { localStream.getTracks().forEach(t => t.stop()); } catch {}
        localStream = null;
    } else {
        // if somehow localStream is not a MediaStream, clear it
        localStream = null;
    }

    const s = await navigator.mediaDevices.getUserMedia(media);
    if (!s || !s.getTracks || s.getTracks().length === 0) {
        try { s.getTracks().forEach(t => t.stop()); } catch {}
        throw new Error("NoTracks");
    }
    localStream = s;

    await createPeer();

    // Add tracks to peer (defensive: pc may be null)
    try {
        if (pc && isMediaStream(localStream)) {
            localStream.getTracks().forEach(track => {
                try { pc.addTrack(track, localStream); } catch (e) { console.warn("addTrack failed", e); }
            });
        }
    } catch (e) {
        console.warn("Error adding tracks to pc", e);
    }

    if (localEl && isMediaStream(localStream)) {
        try { localEl.srcObject = localStream; } catch (e) { console.warn("localEl.srcObject failed", e); }
    }
}

async function startCall({ callee, media }) {
    currentPeer = callee;
    try {
        await createPeer();
        await ensureLocal(media || { audio: true, video: false });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        try { ws.send("call:offer", { to: callee, sdp: offer, media }); } catch (err) { endCall(); throw err; }

        if (ringingTimeout) clearTimeout(ringingTimeout);
        ringingTimeout = setTimeout(() => {
            try { ws.send("call:cancel", { to: callee }); } catch {}
            endCall();
        }, 30000);

        return true;
    } catch (err) {
        endCall();
        throw err;
    }
}

async function acceptIncoming(payload) {
    currentPeer = payload.from;
    await createPeer();

    try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    } catch (err) {
        throw err;
    }

    try {
        await ensureLocal(payload.media || { audio: true, video: false });
    } catch (err) {
        try { ws.send("call:cancel", { to: currentPeer }); } catch {}
        throw err;
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    try { ws.send("call:answer", { to: currentPeer, sdp: answer }); } catch (err) { throw err; }
}

async function applyAnswer({ from, sdp }) {
    if (!pc || String(from) !== String(currentPeer)) return false;
    try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        if (ringingTimeout) { clearTimeout(ringingTimeout); ringingTimeout = null; }
        return true;
    } catch (err) {
        console.warn("applyAnswer failed", err);
        return false;
    }
}

async function onRemoteIce({ from, candidate }) {
    if (!pc || String(from) !== String(currentPeer) || !candidate) return;
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (err) { console.warn("addIceCandidate failed", err); }
}

function setAudioEnabled(enabled) {
    if (!isMediaStream(localStream)) return;
    localStream.getAudioTracks().forEach(t => t.enabled = !!enabled);
}

function setVideoEnabled(enabled) {
    if (!isMediaStream(localStream)) return;
    localStream.getVideoTracks().forEach(t => t.enabled = !!enabled);
}

function endCall() {
    try {
        if (pc?.getSenders) pc.getSenders().forEach(s => s.track?.stop?.());
        if (isMediaStream(localStream)) localStream.getTracks().forEach(t => t.stop());
        pc?.close?.();
    } catch (err) { console.warn("endCall error", err); }
    pc = null;
    localStream = null;
    if (currentPeer) {
        try { ws.send("call:end", { to: currentPeer }); } catch (err) { /* ignore */ }
    }
    currentPeer = null;
    if (ringingTimeout) { clearTimeout(ringingTimeout); ringingTimeout = null; }
}

export default {
    bindElements,
    startCall,
    acceptIncoming,
    applyAnswer,
    onRemoteIce,
    setAudioEnabled,
    setVideoEnabled,
    endCall,
};