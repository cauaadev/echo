package com.backend.echo.mapper;

import com.backend.echo.entity.Message;
import com.backend.echo.dto.MessageDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MessageMapper {
    MessageDTO toDto(Message message);
    Message toEntity(MessageDTO dto);
}

