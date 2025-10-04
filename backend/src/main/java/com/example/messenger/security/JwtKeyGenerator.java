package com.example.messenger.security;

import java.util.Base64;

public class JwtKeyGenerator {
        public String generateKey() {
            String key = "minha-senha-super-secreta-123";
            String base64Key = Base64.getEncoder().encodeToString(key.getBytes());
            return base64Key;
        }
}

