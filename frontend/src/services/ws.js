// javascript
// src/services/ws.js
const listeners = new Map(); // type -> Set<fn>
let socket = null;
let tokenRef = null;
let pathRef = "/ws";
let reconnectTimer = null;
let connecting = false;
let retry = 0;

const QUEUE_MAX = 100;
const outboundQueue = [];

function emit(type, payload) {
    const set = listeners.get(type);
    if (set && set.size) {
        [...set].forEach((fn) => {
            try { fn(payload); } catch {}
        });
    }
    const anySet = listeners.get("*");
    if (anySet && anySet.size) {
        [...anySet].forEach((fn) => {
            try { fn({ type, payload }); } catch {}
        });
    }
}

function wsBaseUrl() {
    const { protocol, host } = window.location;
    const proto = protocol === "https:" ? "wss" : "ws";
    return `${proto}://${host}`;
}

function buildUrl() {
    const q = tokenRef ? `?token=${encodeURIComponent(tokenRef)}` : "";
    return `${wsBaseUrl()}${pathRef}${q}`;
}

function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    const delay = Math.min(10000, 500 * Math.pow(2, retry++));
    reconnectTimer = setTimeout(() => {
        if (tokenRef) open();
    }, delay);
}

function flushQueue() {
    while (socket && socket.readyState === WebSocket.OPEN && outboundQueue.length) {
        const msg = outboundQueue.shift();
        try { socket.send(msg); } catch {}
    }
}

function open() {
    if (!tokenRef || connecting) return;
    if (socket && socket.readyState === WebSocket.OPEN) return;

    connecting = true;
    const url = buildUrl();
    socket = new WebSocket(url);

    socket.onopen = () => {
        connecting = false;
        retry = 0;
        emit("open");
        flushQueue();
    };

    socket.onclose = () => {
        connecting = false;
        emit("close");
        socket = null;
        scheduleReconnect();
    };

    socket.onerror = () => {
        try { socket?.close?.(); } catch {}
    };

    socket.onmessage = (evt) => {
        try {
            const data = JSON.parse(evt.data);
            const type = data?.type;
            if (!type) return;
            emit(type, data.payload);
        } catch {}
    };
}

function connect({ token, path = "/ws" } = {}) {
    tokenRef = token || tokenRef;
    pathRef = path || pathRef;
    open();
}

function disconnect() {
    tokenRef = null;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
    connecting = false;
    retry = 0;
    try { socket?.close?.(); } catch {}
    socket = null;
}

function isConnected() {
    return !!socket && socket.readyState === WebSocket.OPEN;
}

function setToken(token) {
    tokenRef = token;
    if (socket) {
        try { socket.close(); } catch {}
    }
    open();
}

function send(type, payload) {
    const msg = JSON.stringify({ type, payload });
    if (socket && socket.readyState === WebSocket.OPEN) {
        try { socket.send(msg); } catch {}
        return;
    }
    outboundQueue.push(msg);
    if (outboundQueue.length > QUEUE_MAX) outboundQueue.shift();
}

function on(type, fn) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => off(type, fn);
}

function off(type, fn) {
    const set = listeners.get(type);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) listeners.delete(type);
}

export default {
    connect,
    disconnect,
    isConnected,
    setToken,
    send,
    on,
    off,
};