package com.backend.echo.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthenticationRequest {
    private String username;
    private String password;
}
