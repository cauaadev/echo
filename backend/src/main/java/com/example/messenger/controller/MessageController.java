package com.example.messenger.controller;

import com.example.messenger.dto.MessageDTO;
import com.example.messenger.entity.Message;
import com.example.messenger.mapper.MessageMapper;
import com.example.messenger.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final MessageMapper messageMapper;

    @PostMapping
    public MessageDTO sendMessage(@RequestBody @Valid MessageDTO dto) {
        Message message = messageMapper.toEntity(dto);
        Message saved = messageService.save(message);
        return messageMapper.toDto(saved);
    }

    @GetMapping("/conversation")
    public List<MessageDTO> getConversation(
            @RequestParam Long userAId,
            @RequestParam Long userBId) {

        return messageService.getConversation(userAId, userBId)
                .stream()
                .map(messageMapper::toDto)
                .collect(Collectors.toList());
    }
}
