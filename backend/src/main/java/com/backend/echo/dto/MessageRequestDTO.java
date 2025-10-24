package com.backend.echo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequestDTO {
    private String toUsername; // "all" ou nome do usuário
    private String content;
}
