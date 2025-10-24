package com.backend.echo.websocket.dto;

public class CallOffer {
    private String from;
    private String to;
    private Object sdp;
    private Object media; // { audio: true, video: true } etc.

    // getters / setters
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public Object getSdp() { return sdp; }
    public void setSdp(Object sdp) { this.sdp = sdp; }
    public Object getMedia() { return media; }
    public void setMedia(Object media) { this.media = media; }
}