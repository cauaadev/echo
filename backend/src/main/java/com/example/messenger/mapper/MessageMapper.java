package com.example.messenger.mapper;

import com.example.messenger.entity.Message;
import com.example.messenger.dto.MessageDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MessageMapper {
    MessageDTO toDto(Message message);
    Message toEntity(MessageDTO dto);
}

