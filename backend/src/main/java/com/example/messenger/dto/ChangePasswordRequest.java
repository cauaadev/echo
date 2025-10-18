package com.example.messenger.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
    private String code;
}