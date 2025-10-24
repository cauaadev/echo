// substitua/adicione este arquivo
import React from "react";
import defaultAvatar from "../assets/default-avatar.png";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - requests: Array<{ requestId, fromId, fromUsername, avatar, createdAt }>
 * - onAccept(requestId)
 * - onDecline(requestId)
 * - loadingIds: Set or Array of requestIds that are in-flight
 */
export default function FriendRequestsModal({ open, onClose, requests = [], onAccept, onDecline, loadingIds = new Set() }) {
    if (!open) return null;

    const isLoading = (id) => loadingIds && (loadingIds.has ? loadingIds.has(id) : (Array.isArray(loadingIds) ? loadingIds.includes(id) : false));

    return (
        <div className="requests-modal-overlay">
            <div className="requests-modal">
                <div className="requests-modal-header">
                    <strong>Pedidos de amizade</strong>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="pill-btn" onClick={onClose}>Fechar</button>
                    </div>
                </div>

                <div className="requests-modal-list">
                    {requests.length === 0 ? (
                        <div className="requests-empty">Nenhum pedido pendente</div>
                    ) : requests.map(r => (
                        <div key={r.requestId || r.fromId} className="request-item">
                            <img src={r.avatar || defaultAvatar} alt="" className="request-avatar" onError={(e) => e.currentTarget.src = defaultAvatar} />
                            <div className="request-meta">
                                <div className="request-username">{r.fromUsername}</div>
                                <div className="request-date">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</div>
                            </div>
                            <div className="request-actions">
                                <button className="btn-accept" disabled={isLoading(r.requestId)} onClick={() => onAccept(r.requestId)}>
                                    {isLoading(r.requestId) ? "..." : "Aceitar"}
                                </button>
                                <button className="btn-decline" disabled={isLoading(r.requestId)} onClick={() => onDecline(r.requestId)}>
                                    {isLoading(r.requestId) ? "..." : "Recusar"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}