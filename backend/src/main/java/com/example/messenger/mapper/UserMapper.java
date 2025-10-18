package com.example.messenger.mapper;

import com.example.messenger.entity.User;
import com.example.messenger.dto.UserDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDTO toDto(User user);
    User toEntity(UserDTO dto);
}

