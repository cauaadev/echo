package com.backend.echo.service.impl;

import com.backend.echo.security.PasswordChangeToken;
import com.backend.echo.entity.User;
import com.backend.echo.repository.PasswordChangeTokenRepository;
import com.backend.echo.service.MailService;
import com.backend.echo.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VerificationServiceImpl implements VerificationService {

    private final PasswordChangeTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private String generate6DigitCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    @Override
    public void sendPasswordChangeCode(User user) {
        // Invalida token anterior não usado (opcional)
        tokenRepository.findTopByUserAndUsedIsFalseOrderByCreatedAtDesc(user).ifPresent(t -> {
            t.setUsed(true);
            tokenRepository.save(t);
        });

        String code = generate6DigitCode();
        String codeHash = passwordEncoder.encode(code);

        PasswordChangeToken token = PasswordChangeToken.builder()
                .user(user)
                .codeHash(codeHash)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        tokenRepository.save(token);

        String subject = "Código de verificação para troca de senha";
        String body = "Olá " + user.getUsername() + ",\n\n"
                + "Seu código de verificação é: " + code + "\n"
                + "Ele expira em 10 minutos.\n\n"
                + "Se você não solicitou, ignore este email.\n\n"
                + "Atenciosamente,\nEquipe";
        mailService.sendEmail(user.getEmail(), subject, body);
    }

    @Override
    public void verifyPasswordChangeCode(User user, String code) {
        PasswordChangeToken token = tokenRepository.findTopByUserAndUsedIsFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new IllegalArgumentException("Nenhum código encontrado."));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado.");
        }
        if (!passwordEncoder.matches(code, token.getCodeHash())) {
            throw new IllegalArgumentException("Código inválido.");
        }
        // Não consome aqui; apenas valida. O consumo acontece na alteração de senha.
    }

    @Override
    public void consumePasswordChangeCode(User user, String code) {
        PasswordChangeToken token = tokenRepository.findTopByUserAndUsedIsFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new IllegalArgumentException("Nenhum código encontrado."));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado.");
        }
        if (!passwordEncoder.matches(code, token.getCodeHash())) {
            throw new IllegalArgumentException("Código inválido.");
        }
        token.setUsed(true);
        tokenRepository.save(token);
    }
}