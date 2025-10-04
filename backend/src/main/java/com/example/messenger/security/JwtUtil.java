package com.example.messenger.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret:BASE64_ENCODED_SECRET_GOES_HERE}")
    private String secretBase64;

    @Value("${app.jwt.access-ttl-millis:900000}")
    private long accessTtlMillis;

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretBase64);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username) {
        Date now = new Date();
        Date expiresAt = new Date(now.getTime() + accessTtlMillis);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiresAt)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token, String username) {
        try {
            String extractedUsername = extractUsername(token);
            return extractedUsername.equals(username) &&
                    Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                            .parseClaimsJws(token).getBody().getExpiration().after(new Date());
        } catch (JwtException e) {
            return false;
        }
    }
}
