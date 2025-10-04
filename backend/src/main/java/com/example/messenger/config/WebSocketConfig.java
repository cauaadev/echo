package com.example.messenger.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new com.example.messenger.config.ChatWebSocketHandler(), "/ws")
                .setAllowedOriginPatterns("*");
    }
}

