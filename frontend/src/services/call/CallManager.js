// javascript
import ws from "../ws";

const iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];

let pc = null;
let localStream = null;
let localEl = null;
let remoteEl = null;
let currentPeer = null;

function bindElements({ localEl: l, remoteEl: r }) {
    localEl = l || null;
    remoteEl = r || null;
    if (localEl && localStream) {
        localEl.srcObject = localStream;
    }
}

function attachRemote(e) {
    const stream = e.streams?.[0];
    if (remoteEl && stream) remoteEl.srcObject = stream;
}

async function createPeer() {
    pc = new RTCPeerConnection({ iceServers });
    pc.onicecandidate = (e) => {
        if (e.candidate && currentPeer) {
            ws.send("call:ice", { to: currentPeer, candidate: e.candidate });
        }
    };
    pc.ontrack = attachRemote;
}

async function ensureLocal(media) {
    if (!pc) await createPeer();
    localStream = await navigator.mediaDevices.getUserMedia(media);
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    if (localEl) localEl.srcObject = localStream;
}

async function startCall({ callee, media }) {
    currentPeer = callee;
    await createPeer();
    await ensureLocal(media);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send("call:offer", { to: callee, sdp: offer, media });
}

async function acceptIncoming(payload) {
    // payload: { from, sdp (offer), media }
    currentPeer = payload.from;
    await createPeer();
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    await ensureLocal(payload.media || { audio: true, video: false });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send("call:answer", { to: currentPeer, sdp: answer });
}

async function applyAnswer({ from, sdp }) {
    if (!pc || from !== currentPeer) return false;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    return true;
}

async function onRemoteIce({ from, candidate }) {
    if (!pc || from !== currentPeer || !candidate) return;
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
}

function setAudioEnabled(enabled) {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => { t.enabled = !!enabled; });
}

function setVideoEnabled(enabled) {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(t => { t.enabled = !!enabled; });
}

function endCall() {
    try {
        pc?.getSenders?.().forEach(s => s.track?.stop?.());
        localStream?.getTracks?.().forEach(t => t.stop());
        pc?.close?.();
    } catch {}
    pc = null;
    localStream = null;
    if (currentPeer) {
        ws.send("call:end", { to: currentPeer });
    }
    currentPeer = null;
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