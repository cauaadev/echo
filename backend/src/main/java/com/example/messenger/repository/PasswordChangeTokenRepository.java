package com.example.messenger.repository;

import com.example.messenger.entity.PasswordChangeToken;
import com.example.messenger.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordChangeTokenRepository extends JpaRepository<PasswordChangeToken, Long> {
    Optional<PasswordChangeToken> findTopByUserAndUsedIsFalseOrderByCreatedAtDesc(User user);
}