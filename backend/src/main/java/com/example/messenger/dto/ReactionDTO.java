package com.example.messenger.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReactionDTO {
    private Long messageId;
    private String fromUsername;
    private String emoji;
    private LocalDateTime timestamp;
}
