package com.example.messenger.service;

public interface MailService {
    void sendEmail(String to, String subject, String body);
}