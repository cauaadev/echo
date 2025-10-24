// Java
package com.backend.echo.service;

import com.backend.echo.dto.ChatMessageDto;
import com.backend.echo.dto.MessageDTO;

public interface ChatService {
    MessageDTO processIncoming(String conversationId, ChatMessageDto dto, String currentUsername);
    String conversationTopic(Long userA, Long userB); // retorna /topic/chat/{min_max}
    void validateCanSend(Long senderId, Long receiverId);
}