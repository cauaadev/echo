package com.backend.echo.config;

import com.backend.echo.websocket.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // In development allow the Vite origin; if you still have CORS issues try "*"
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5182", "http://127.0.0.1:5182", "http://localhost:5173", "*")
                .withSockJS();

        log.info("STOMP endpoint registered at /ws (SockJS), allowed origins: http://localhost:5182, *");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
        log.info("Message broker configured: simple broker '/topic', app prefix '/app'");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // interceptor typically validates CONNECT headers (Authorization). If you debug, temporarily disable it.
        registration.interceptors(stompAuthChannelInterceptor);
        log.info("StompAuthChannelInterceptor registered on inbound channel");
    }
}