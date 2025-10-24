package com.backend.echo.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReactionRequestDTO {
    private Long messageId;
    private String emoji;
}
