package com.backend.echo.service;

public interface MailService {
    void sendEmail(String to, String subject, String body);
}