package com.backend.echo.mapper;

import com.backend.echo.entity.User;
import com.backend.echo.dto.UserDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDTO toDto(User user);
    User toEntity(UserDTO dto);
}

