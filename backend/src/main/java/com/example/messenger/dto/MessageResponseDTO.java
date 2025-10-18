package com.example.messenger.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponseDTO {
    private Long id;
    private String fromUsername;
    private String toUsername; // "all" ou nome do usuário
    private String content;
    private LocalDateTime timestamp;
    private List<Map<String, String>> reactions;
}
