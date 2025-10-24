package com.backend.echo.service;

import com.backend.echo.entity.User;

public interface VerificationService {
    void sendPasswordChangeCode(User user);
    void verifyPasswordChangeCode(User user, String code);
    void consumePasswordChangeCode(User user, String code);
}