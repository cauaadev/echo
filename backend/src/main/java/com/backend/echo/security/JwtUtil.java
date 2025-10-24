package com.backend.echo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms:3600000}")
    private long jwtExpirationMs;

    private Key key;

    @PostConstruct
    public void init() {
        // Tenta decodificar como Base64 primeiro
        byte[] keyBytes = null;
        if (secret != null) {
            String trimmed = secret.trim();
            try {
                byte[] decoded = Decoders.BASE64.decode(trimmed);
                if (decoded.length >= 32) {
                    keyBytes = decoded;
                } else {
                    // se Base64 válido mas muito curto, ignoramos e caímos para fallback
                }
            } catch (Exception e) {
                // não é Base64 válido -> fallback abaixo
            }

            if (keyBytes == null) {
                // fallback: gera um keyBytes de 32 bytes a partir do texto (SHA-256)
                try {
                    MessageDigest md = MessageDigest.getInstance("SHA-256");
                    byte[] hashed = md.digest(trimmed.getBytes(StandardCharsets.UTF_8));
                    // hashed já tem 32 bytes (SHA-256), use diretamente
                    keyBytes = hashed;
                } catch (Exception ex) {
                    throw new IllegalStateException("Erro ao derivar chave JWT", ex);
                }
            }

            this.key = Keys.hmacShaKeyFor(keyBytes);
        } else {
            throw new IllegalStateException("Propriedade 'app.jwt.secret' não encontrada.");
        }
    }

    public String generateToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(jwtExpirationMs)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
