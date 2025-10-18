package com.example.messenger.service;

import com.example.messenger.entity.User;

public interface VerificationService {
    void sendPasswordChangeCode(User user);
    void verifyPasswordChangeCode(User user, String code);
    void consumePasswordChangeCode(User user, String code);
}