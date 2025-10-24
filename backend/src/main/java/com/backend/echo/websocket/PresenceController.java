// url=https://github.com/your/repo/blob/main/src/main/java/.../PresenceController.java
package com.backend.echo.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class PresenceController {

    private final SimpMessagingTemplate messaging;

    public PresenceController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    // Recebe do cliente em /app/presence
    @MessageMapping("/presence")
    public void handlePresence(@Payload PresenceMessage msg) {
        // msg deve conter { userId, status }
        // re-broadcast para todos os inscritos em /topic/presence
        messaging.convertAndSend("/topic/presence", msg);
    }
}