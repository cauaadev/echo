// Java
package com.backend.echo.service.impl;

import com.backend.echo.dto.ChatMessageDto;
import com.backend.echo.dto.MessageDTO;
import com.backend.echo.entity.Message;
import com.backend.echo.entity.User;
import com.backend.echo.repository.BlockRepository;
import com.backend.echo.repository.FriendshipRepository;
import com.backend.echo.repository.MessageRepository;
import com.backend.echo.repository.UserRepository;
import com.backend.echo.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final FriendshipRepository friendshipRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Override
    public MessageDTO processIncoming(String conversationId, ChatMessageDto dto, String currentUsername) {
        User sender = userRepository.findByUsername(currentUsername).orElseThrow();
        User receiver = userRepository.findById(dto.getReceiverId())
                .orElseThrow(() -> new IllegalArgumentException("Destinatário não encontrado."));

        validateCanSend(sender.getId(), receiver.getId());

        Message toSave = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(dto.getContent())
                .mediaUrl(dto.getMediaUrl())
                .timestamp(dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(toSave);

        return MessageDTO.builder()
                .id(saved.getId())
                .senderId(sender.getId())
                .receiverId(receiver.getId())
                .content(saved.getContent())
                .mediaUrl(saved.getMediaUrl())
                .timestamp(saved.getTimestamp())
                .build();
    }

    @Override
    public String conversationTopic(Long userA, Long userB) {
        long min = Math.min(userA, userB);
        long max = Math.max(userA, userB);
        return "/topic/chat/" + min + "_" + max;
    }

    @Override
    public void validateCanSend(Long senderId, Long receiverId) {
        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        // bloqueio em qualquer direção
        if (blockRepository.existsByBlockerAndBlocked(sender, receiver)
                || blockRepository.existsByBlockerAndBlocked(receiver, sender)) {
            throw new SecurityException("Envio bloqueado.");
        }

        // deve haver amizade
        if (!friendshipRepository.existsBetween(sender, receiver)) {
            throw new SecurityException("Usuários não são amigos.");
        }
    }
}