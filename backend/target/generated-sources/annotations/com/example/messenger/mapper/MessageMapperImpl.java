package com.example.messenger.mapper;

import com.example.messenger.dto.MessageDTO;
import com.example.messenger.entity.Message;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-10-04T16:15:29-0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.7 (Microsoft)"
)
@Component
public class MessageMapperImpl implements MessageMapper {

    @Override
    public MessageDTO toDto(Message message) {
        if ( message == null ) {
            return null;
        }

        MessageDTO messageDTO = new MessageDTO();

        return messageDTO;
    }

    @Override
    public Message toEntity(MessageDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Message message = new Message();

        return message;
    }
}
