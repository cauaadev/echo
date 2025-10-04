package com.example.messenger.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDTO {
    private Long id;
    private String username;
    private String password; // apenas para requests
    private String avatarUrl;
}
