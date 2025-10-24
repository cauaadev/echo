// Java
package com.backend.echo.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageDto {
    private Long senderId;    // será ignorado/forçado pelo backend via Principal
    private Long receiverId;  // obrigatório
    private String content;
    private String mediaUrl;
    private LocalDateTime timestamp;
}