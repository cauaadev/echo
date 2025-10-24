// useFriendsAndChat.js
import { useEffect, useState } from "react";
import axios from "axios";
import ws from "./client";

export function useFriendsAndChat(token, meId) {
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [messages, setMessages] = useState({}); // { conversationId: [msg, ...] }

    const fetchFriends = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/friends/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setFriends(res.data);
    };

    const fetchRequests = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/friends/requests`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setPendingRequests(res.data);
    };

    const subscribeConversation = (conversationId) => {
        return ws.subscribeConversation(conversationId, msg => {
            setMessages(prev => {
                const old = prev[conversationId] || [];
                return { ...prev, [conversationId]: [...old, msg] };
            });
        });
    };

    const sendMessage = (conversationId, content) => {
        ws.sendChat(conversationId, { content });
    };

    useEffect(() => {
        if (!token || !meId) return;

        ws.connect({ token, meId });

        const unsubRequest = ws.on("friend:request", req => {
            setPendingRequests(prev => [...prev, req]);
        });

        const unsubAccepted = ws.on("friend:accepted", f => {
            fetchFriends();
            setPendingRequests(prev => prev.filter(r => r.requestId !== f.requestId));
        });

        const unsubChat = ws.on("chat:message", msg => {
            const convId = [msg.senderId, msg.receiverId].sort((a,b) => a-b).join("_");
            setMessages(prev => {
                const old = prev[convId] || [];
                return { ...prev, [convId]: [...old, msg] };
            });
        });

        fetchFriends();
        fetchRequests();

        return () => {
            unsubRequest();
            unsubAccepted();
            unsubChat();
            ws.disconnect();
        };
    }, [token, meId]);

    return { friends, pendingRequests, messages, fetchFriends, fetchRequests, subscribeConversation, sendMessage };
}
