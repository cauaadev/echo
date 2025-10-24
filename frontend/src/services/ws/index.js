// services/ws/index.js
// Re-export do client (assume services/ws/client.js existe)
import * as client from "./client";
export default client;
export const { connect, disconnect, isConnected, on, off, send, subscribeConversation, sendChat, setToken, announcePresence } = client;