package com.backend.echo.websocket.dto;

public class CallAnswer {
    private String from;
    private String to;
    private Object sdp;
    // getters/setters
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public Object getSdp() { return sdp; }
    public void setSdp(Object sdp) { this.sdp = sdp; }
}