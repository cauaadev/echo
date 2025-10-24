package com.backend.echo.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageDTO {
    private long id;
    private Long senderId;    // será validado/ajustado pelo serviço
    private Long receiverId;  // usuário destino
    private String content;
    private LocalDateTime timestamp;
    private String mediaUrl;

}
