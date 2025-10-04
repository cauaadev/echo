package com.example.messenger.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageDTO {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private String mediaUrl;
    private LocalDateTime timestamp;
}
