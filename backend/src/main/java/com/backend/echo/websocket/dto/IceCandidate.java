package com.backend.echo.websocket.dto;

public class IceCandidate {
    private String from;
    private String to;
    private Object candidate;
    // getters/setters
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public Object getCandidate() { return candidate; }
    public void setCandidate(Object candidate) { this.candidate = candidate; }
}