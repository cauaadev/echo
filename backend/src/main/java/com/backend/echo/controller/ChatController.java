package com.backend.echo.controller;

import com.backend.echo.dto.ChatMessageDto;
import com.backend.echo.dto.MessageDTO;
import com.backend.echo.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat/{conversationId}")
    public void send(@DestinationVariable String conversationId,
                     @Payload ChatMessageDto dto,
                     Principal principal) {
        // identifica remetente pelo Principal autenticado no WS
        MessageDTO saved = chatService.processIncoming(conversationId, dto, principal.getName());

        // publica no tópico canônico da conversa (mesmo para os dois lados)
        String topic = chatService.conversationTopic(saved.getSenderId(), saved.getReceiverId());
        messagingTemplate.convertAndSend(topic, saved);
    }
}