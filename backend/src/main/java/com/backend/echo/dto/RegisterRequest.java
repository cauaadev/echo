package com.backend.echo.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String avatarUrl;
    private String role; // String, não Role
}
