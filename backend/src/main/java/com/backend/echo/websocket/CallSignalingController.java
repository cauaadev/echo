package com.backend.echo.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class CallSignalingController {

    private final SimpMessagingTemplate messaging;
    private final Logger log = LoggerFactory.getLogger(CallSignalingController.class);

    public CallSignalingController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @MessageMapping("/call/offer")
    public void offer(@Payload Map<String, Object> offer) {
        Object to = offer == null ? null : offer.get("to");
        log.info("Call offer received, to={}", to);
        if (to == null) return;

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "call:offer");
        // copy known fields defensively
        if (offer.get("from") != null) payload.put("from", offer.get("from"));
        if (offer.get("sdp") != null) payload.put("sdp", offer.get("sdp"));
        if (offer.get("media") != null) payload.put("media", offer.get("media"));
        // include any other fields if necessary
        messaging.convertAndSend("/topic/notifications/" + String.valueOf(to), payload);
    }

    @MessageMapping("/call/answer")
    public void answer(@Payload Map<String, Object> answer) {
        Object to = answer == null ? null : answer.get("to");
        log.info("Call answer received, to={}", to);
        if (to == null) return;

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "call:answer");
        if (answer.get("from") != null) payload.put("from", answer.get("from"));
        if (answer.get("sdp") != null) payload.put("sdp", answer.get("sdp"));
        messaging.convertAndSend("/topic/notifications/" + String.valueOf(to), payload);
    }

    @MessageMapping("/call/ice")
    public void ice(@Payload Map<String, Object> ice) {
        Object to = ice == null ? null : ice.get("to");
        if (to == null) {
            log.warn("ICE message received without 'to' field: {}", ice);
            return;
        }

        Object candidate = ice.get("candidate");
        if (candidate == null) {
            // it's common for browsers to emit a null candidate to signal end-of-candidates;
            // ignore null candidates (do not forward)
            log.debug("Ignoring null ICE candidate for to={}", to);
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "call:ice");
        if (ice.get("from") != null) payload.put("from", ice.get("from"));
        payload.put("candidate", candidate);

        log.debug("Forwarding ICE candidate to {}", to);
        messaging.convertAndSend("/topic/notifications/" + String.valueOf(to), payload);
    }

    @MessageMapping("/call/end")
    public void end(@Payload Map<String, Object> end) {
        Object to = end == null ? null : end.get("to");
        if (to == null) {
            log.warn("Call end received without 'to': {}", end);
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "call:end");
        if (end.get("from") != null) payload.put("from", end.get("from"));
        messaging.convertAndSend("/topic/notifications/" + String.valueOf(to), payload);
    }
}