package com.example.messenger.config;

import com.example.messenger.dto.MessageRequestDTO;
import com.example.messenger.dto.MessageResponseDTO;
import com.example.messenger.dto.ReactionRequestDTO;
import com.example.messenger.dto.ReactionDTO;
import com.example.messenger.entity.Message;
import com.example.messenger.entity.Reaction;
import com.example.messenger.entity.User;
import com.example.messenger.repository.MessageRepository;
import com.example.messenger.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> onlineUsers = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(UserRepository userRepository, MessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String username = (String) session.getAttributes().get("username");
        if (username != null) {
            onlineUsers.put(username, session);
            broadcastOnlineUsers();
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage textMessage) throws Exception {
        Map<String, Object> payload = mapper.readValue(textMessage.getPayload(), Map.class);
        String type = (String) payload.get("type");

        switch (type) {
            case "message":
                handleMessage(mapper.convertValue(payload, MessageRequestDTO.class), session);
                break;
            case "reaction":
                handleReaction(mapper.convertValue(payload, ReactionRequestDTO.class), session);
                break;
            default:
                break; // ignora tipos desconhecidos
        }
    }

    private void handleMessage(MessageRequestDTO request, WebSocketSession session) throws Exception {
        String fromUsername = (String) session.getAttributes().get("username");
        User sender = userRepository.findByUsername(fromUsername).orElseThrow();
        User receiver = "all".equals(request.getToUsername()) ? null : userRepository.findByUsername(request.getToUsername()).orElse(null);

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .reactions(new ArrayList<>())
                .build();

        messageRepository.save(message);

        MessageResponseDTO responseDTO = MessageResponseDTO.builder()
                .id(message.getId())
                .fromUsername(sender.getUsername())
                .toUsername(receiver != null ? receiver.getUsername() : "all")
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .reactions(new ArrayList<>()) // inicialmente vazio
                .build();

        String json = mapper.writeValueAsString(responseDTO);

        if (receiver == null) {
            broadcast(json);
        } else {
            sendToUser(receiver.getUsername(), json);
            sendToUser(sender.getUsername(), json);
        }
    }

    private void handleReaction(ReactionRequestDTO request, WebSocketSession session) throws Exception {
        String fromUsername = (String) session.getAttributes().get("username");
        User fromUser = userRepository.findByUsername(fromUsername).orElseThrow();
        Optional<Message> msgOpt = messageRepository.findById(request.getMessageId());

        if (msgOpt.isPresent()) {
            Message msg = msgOpt.get();

            if (msg.getReactions() == null) msg.setReactions(new ArrayList<>());

            Reaction reaction = Reaction.builder()
                    .emoji(request.getEmoji())
                        .fromUser(fromUser)
                    .message(msg)
                    .build();

            msg.getReactions().add(reaction);
            messageRepository.save(msg);

            ReactionDTO reactionDTO = ReactionDTO.builder()
                    .messageId(msg.getId())
                    .fromUsername(fromUsername)
                    .emoji(request.getEmoji())
                    .timestamp(LocalDateTime.now())
                    .build();

            String json = mapper.writeValueAsString(reactionDTO);

            if (msg.getReceiver() != null) sendToUser(msg.getReceiver().getUsername(), json);
            sendToUser(msg.getSender().getUsername(), json);
        }
    }

    private void broadcast(String message) throws Exception {
        for (WebSocketSession s : onlineUsers.values()) {
            if (s.isOpen()) s.sendMessage(new TextMessage(message));
        }
    }

    private void sendToUser(String username, String message) throws Exception {
        WebSocketSession s = onlineUsers.get(username);
        if (s != null && s.isOpen()) s.sendMessage(new TextMessage(message));
    }

    private void broadcastOnlineUsers() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "online");
        payload.put("users", new ArrayList<>(onlineUsers.keySet()));
        String json = mapper.writeValueAsString(payload);
        broadcast(json);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = (String) session.getAttributes().get("username");
        if (username != null) {
            onlineUsers.remove(username);
            broadcastOnlineUsers();
        }
    }
}
