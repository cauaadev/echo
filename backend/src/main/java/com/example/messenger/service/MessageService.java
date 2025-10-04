package com.example.messenger.service;

import com.example.messenger.entity.Message;
import com.example.messenger.repository.MessageRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;

    public Message save(Message message) {
        return messageRepository.save(message);
    }

    public List<Message> getConversation(Long senderId, Long receiverId) {
        return messageRepository.findBySenderIdAndReceiverIdOrderByTimestamp(senderId, receiverId);
    }
}

