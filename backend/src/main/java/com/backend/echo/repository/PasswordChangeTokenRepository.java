package com.backend.echo.repository;

import com.backend.echo.security.PasswordChangeToken;
import com.backend.echo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordChangeTokenRepository extends JpaRepository<PasswordChangeToken, Long> {
    Optional<PasswordChangeToken> findTopByUserAndUsedIsFalseOrderByCreatedAtDesc(User user);
}