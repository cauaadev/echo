package com.backend.echo.websocket;

public class PresenceMessage {
    private String userId;
    private String status; // ONLINE, OFFLINE, AWAY, DND, etc.

    public PresenceMessage() {}
    public PresenceMessage(String userId, String status) { this.userId = userId; this.status = status; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}