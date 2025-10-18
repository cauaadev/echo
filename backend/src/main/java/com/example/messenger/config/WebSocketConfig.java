package com.example.messenger.config;

import com.example.messenger.security.JwtUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.*;
import org.springframework.web.socket.config.annotation.*;

import java.util.Map;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatHandler;
    private final JwtUtil jwtUtil;

    public WebSocketConfig(ChatWebSocketHandler chatHandler, JwtUtil jwtUtil) {
        this.chatHandler = chatHandler;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new WebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                String token = getToken(session.getUri().getQuery());
                if (token == null || jwtUtil.parseClaims(token).getSubject() == null) {
                    session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Token inválido"));
                    return;
                }
                String username = jwtUtil.parseClaims(token).getSubject();
                session.getAttributes().put("username", username);
                chatHandler.afterConnectionEstablished(session);
            }

            @Override
            public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
                chatHandler.handleMessage(session, (TextMessage) message);
            }

            @Override
            public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {}

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
                chatHandler.afterConnectionClosed(session, closeStatus);
            }

            @Override
            public boolean supportsPartialMessages() {
                return false;
            }

            private String getToken(String query) {
                if (query == null) return null;
                for (String param : query.split("&")) {
                    if (param.startsWith("token=")) return param.split("=")[1];
                }
                return null;
            }
        }, "/ws").setAllowedOriginPatterns("*");
    }
}
