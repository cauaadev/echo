package com.backend.echo.websocket;

public class Notification {
    private String type;
    private Object payload;
    public Notification() {}
    public Notification(String type, Object payload) { this.type = type; this.payload = payload; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}