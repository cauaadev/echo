package com.backend.echo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class VerifyCodeRequest {
    private String code;
}