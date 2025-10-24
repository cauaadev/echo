import React from "react";
import { useFriends } from "./useFriends";
import axios from "axios";

export default function FriendsPanel({ token, meId }) {
    const { friends, pendingRequests, fetchFriends, fetchRequests } = useFriends(token, meId);

    const acceptRequest = async (id) => {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/friends/requests/${id}/accept`, null, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchFriends();
        fetchRequests();
    };

    const declineRequest = async (id) => {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/friends/requests/${id}/decline`, null, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchRequests();
    };

    return (
        <div>
            <h3>Pedidos Pendentes</h3>
            <ul>
                {pendingRequests.map(req => (
                    <li key={req.requestId}>
                        {req.fromUsername}
                        <button onClick={() => acceptRequest(req.requestId)}>Aceitar</button>
                        <button onClick={() => declineRequest(req.requestId)}>Recusar</button>
                    </li>
                ))}
            </ul>

            <h3>Amigos</h3>
            <ul>
                {friends.map(f => (
                    <li key={f.id}>{f.username}</li>
                ))}
            </ul>
        </div>
    );
}
