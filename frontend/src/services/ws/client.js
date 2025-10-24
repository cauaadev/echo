// services/ws/client.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const listeners = new Map();
let client = null;
let connected = false;
let meIdRef = null;

// presence buffering / retry
let pendingPresence = null;
let presenceRetryTimer = null;
let presenceRetryAttempts = 0;
const PRESENCE_MAX_RETRIES = 6;
const PRESENCE_BASE_DELAY_MS = 300;

// outbound buffer for signaling messages
const outboundBuffer = [];
const OUTBOUND_MAX_RETRIES = 8;
let outboundFlushTimer = null;

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function emit(type, payload) {
    const set = listeners.get(type);
    if (set && set.size) [...set].forEach(fn => { try { fn(payload); } catch {} });
    const anySet = listeners.get("*");
    if (anySet && anySet.size) [...anySet].forEach(fn => { try { fn({ type, payload }); } catch {} });
}

function clearPresenceRetry() {
    if (presenceRetryTimer) { clearTimeout(presenceRetryTimer); presenceRetryTimer = null; presenceRetryAttempts = 0; }
}
function schedulePresenceRetry() {
    clearPresenceRetry();
    if (!pendingPresence) return;
    const attempt = Math.min(presenceRetryAttempts, PRESENCE_MAX_RETRIES - 1);
    const delay = PRESENCE_BASE_DELAY_MS * Math.pow(2, attempt);
    presenceRetryTimer = setTimeout(() => {
        presenceRetryAttempts++;
        try {
            if (client && connected && meIdRef && pendingPresence) {
                client.publish({ destination: "/app/presence", body: JSON.stringify({ userId: meIdRef, status: pendingPresence }) });
                pendingPresence = null;
                clearPresenceRetry();
            } else {
                if (presenceRetryAttempts < PRESENCE_MAX_RETRIES) schedulePresenceRetry();
            }
        } catch (err) {
            if (presenceRetryAttempts < PRESENCE_MAX_RETRIES) schedulePresenceRetry();
            else console.warn("publishPresence retry exhausted", err);
        }
    }, delay);
}

function publishPresence(status) {
    try {
        const s = (status || "ONLINE").toUpperCase();
        if (client && connected && meIdRef) {
            try {
                client.publish({ destination: "/app/presence", body: JSON.stringify({ userId: meIdRef, status: s }) });
                pendingPresence = null;
                clearPresenceRetry();
                return;
            } catch (err) {
                console.warn("publishPresence immediate failed, buffering", err);
                pendingPresence = s;
                presenceRetryAttempts = 0;
                schedulePresenceRetry();
                return;
            }
        }
        pendingPresence = s;
        presenceRetryAttempts = 0;
        schedulePresenceRetry();
    } catch (err) {
        console.warn("publishPresence error", err);
        pendingPresence = status;
        presenceRetryAttempts = 0;
        schedulePresenceRetry();
    }
}

export function announcePresence(status) { publishPresence(status); }

// outbound buffer helpers
function bufferOutbound(type, payload) {
    outboundBuffer.push({ type, payload, attempts: 0 });
    flushOutboundBufferSoon();
}
function flushOutboundBufferSoon(delay = 100) {
    if (outboundFlushTimer) clearTimeout(outboundFlushTimer);
    outboundFlushTimer = setTimeout(flushOutboundBuffer, delay);
}
function flushOutboundBuffer() {
    if (!client || !connected) return;
    while (outboundBuffer.length) {
        const item = outboundBuffer.shift();
        try {
            const dest = "/app/" + item.type.split(":").join("/");
            client.publish({ destination: dest, body: JSON.stringify(item.payload || {}) });
        } catch (err) {
            item.attempts = (item.attempts || 0) + 1;
            if (item.attempts < OUTBOUND_MAX_RETRIES) {
                setTimeout(() => outboundBuffer.unshift(item), 200 * item.attempts);
            } else {
                console.warn("Dropping outbound message after retries", item.type, item.payload);
            }
        }
    }
}

// main connect
export function connect({ token, meId } = {}) {
    if (!token) return console.warn("ws.connect: token ausente");
    meIdRef = meId ?? null;
    if (client && connected) return;

    const clientInstance = new Client({
        webSocketFactory: () => new SockJS(`${BASE}/ws`),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (msg) => { /* optional: console.debug("STOMP:", msg); */ }
    });

    client = clientInstance;

    client.onConnect = function () {
        connected = true;
        console.debug("[WS] stomp connected, meIdRef=", meIdRef);

        if (meIdRef) {
            try {
                this.subscribe(`/topic/notifications/${meIdRef}`, msg => {
                    console.debug("[WS] /topic/notifications/%s message:", meIdRef, msg.body);
                    try {
                        const data = JSON.parse(msg.body);
                        const { type, ...rest } = data || {};
                        if (type) emit(type.toLowerCase() === type ? type : type.toLowerCase(), rest);
                        if (type) emit(type, rest);
                    } catch (err) { console.warn("WS parse error", err); }
                });
            } catch (err) { console.warn("WS subscribe notifications failed", err); }
        }

        try {
            this.subscribe(`/topic/presence`, msg => {
                try { const data = JSON.parse(msg.body); emit("presence", data); } catch {}
            });
        } catch (err) {}

        // try immediate presence publish via this.publish (context correct)
        try {
            const toSend = pendingPresence || "ONLINE";
            try {
                this.publish({ destination: "/app/presence", body: JSON.stringify({ userId: meIdRef, status: toSend }) });
                pendingPresence = null;
                clearPresenceRetry();
            } catch (err) {
                if (!pendingPresence) pendingPresence = toSend;
                presenceRetryAttempts = 0;
                schedulePresenceRetry();
            }
        } catch (err) { if (!pendingPresence) pendingPresence = "ONLINE"; schedulePresenceRetry(); }

        // flush buffered outbound signaling
        flushOutboundBufferSoon(50);

        emit("open"); emit("connected"); emit("stomp:connected");
    };

    client.onStompError = (frame) => { console.error("STOMP error:", frame && frame.headers ? frame.headers["message"] : frame); };
    client.onWebSocketClose = () => { connected = false; emit("close"); };

    client.activate();
}

export function disconnect() {
    try { if (client && connected && meIdRef) client.publish({ destination: "/app/presence", body: JSON.stringify({ userId: meIdRef, status: "OFFLINE" }) }); } catch (err) {}
    try { client?.deactivate?.(); } catch (err) {}
    client = null; connected = false; meIdRef = null; pendingPresence = null; clearPresenceRetry();
    outboundBuffer.length = 0;
}

export function isConnected() { return !!client && connected; }

export function on(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); return () => off(type, fn); }
export function off(type, fn) { const set = listeners.get(type); if (!set) return; set.delete(fn); if (set.size === 0) listeners.delete(type); }

export function subscribeConversation(conversationId, handler) {
    if (!client || !connected || !conversationId) return null;
    try { return client.subscribe(`/topic/chat/${conversationId}`, msg => { try { const body = JSON.parse(msg.body); handler?.(body); emit("chat:message", body); } catch {} }); } catch (err) { return null; }
}

// send: if not connected, buffer call:* messages
export function send(type, payload) {
    if (!client || !connected) {
        if (type && type.startsWith("call:")) {
            bufferOutbound(type, payload);
            return;
        }
        console.warn("ws.send: not connected, cannot send", type, payload);
        return;
    }
    const dest = "/app/" + type.split(":").join("/");
    try { client.publish({ destination: dest, body: JSON.stringify(payload || {}) }); } catch (err) { console.warn("ws.send failed", err); }
}

export function sendChat(conversationId, payload) {
    if (!client || !connected) {
        console.warn("sendChat: not connected", conversationId, payload);
        return;
    }
    try { client.publish({ destination: `/app/chat/${conversationId}`, body: JSON.stringify(payload || {}) }); } catch (err) { console.warn("sendChat failed", err); }
}

export default { connect, disconnect, isConnected, on, off, send, subscribeConversation, sendChat, setToken: (token) => { const meId = meIdRef; disconnect(); connect({ token, meId }); }, announcePresence: publishPresence };