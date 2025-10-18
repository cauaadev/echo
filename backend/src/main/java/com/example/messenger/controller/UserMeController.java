// java
package com.example.messenger.controller;

import com.example.messenger.dto.ChangePasswordRequest;
import com.example.messenger.dto.UserResponse;
import com.example.messenger.dto.VerifyCodeRequest;
import com.example.messenger.entity.User;
import com.example.messenger.repository.UserRepository;
import com.example.messenger.service.VerificationService;
import com.example.messenger.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.*;
import java.util.Objects;

@RestController
@RequestMapping("/user/me")
@RequiredArgsConstructor
public class UserMeController {

    private final UserRepository userRepository;
    private final VerificationService verificationService;
    private final PasswordEncoder passwordEncoder;

    private User getCurrentUser() {
        String username = SecurityUtils.currentUsername();
        if (username == null) throw new IllegalStateException("Não autenticado.");
        return userRepository.findByUsername(username).orElseThrow();
    }

    private String toAbsoluteUrl(String maybeRelative) {
        if (maybeRelative == null || maybeRelative.isBlank()) return null;
        if (maybeRelative.startsWith("http://") || maybeRelative.startsWith("https://")) return maybeRelative;
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(maybeRelative.startsWith("/") ? maybeRelative : "/" + maybeRelative)
                .toUriString();
    }

    @GetMapping
    public UserResponse me() {
        User u = getCurrentUser();
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .avatarUrl(toAbsoluteUrl(u.getAvatarUrl()))
                .build();
    }

    @PostMapping("/password/code")
    public void sendPasswordCode() {
        User u = getCurrentUser();
        verificationService.sendPasswordChangeCode(u);
    }

    @PostMapping("/password/verify")
    public void verifyCode(@RequestBody VerifyCodeRequest req) {
        User u = getCurrentUser();
        verificationService.verifyPasswordChangeCode(u, req.getCode());
    }

    @PostMapping("/password")
    public void changePassword(@RequestBody ChangePasswordRequest req) {
        User u = getCurrentUser();
        if (!passwordEncoder.matches(req.getCurrentPassword(), u.getPassword())) {
            throw new IllegalArgumentException("Senha atual incorreta.");
        }
        verificationService.consumePasswordChangeCode(u, req.getCode());
        u.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(u);
    }

    @PatchMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse updateProfile(
            @RequestPart(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam("username") String username,
            @RequestParam("email") String email,
            @RequestParam(value = "nickname", required = false) String nickname
    ) throws Exception {
        User u = getCurrentUser();

        if (!Objects.equals(u.getEmail(), email) && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email já utilizado.");
        }
        if (!Objects.equals(u.getUsername(), username) && userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Usuário já utilizado.");
        }

        u.setUsername(username);
        u.setEmail(email);

        if (avatar != null && !avatar.isEmpty()) {
            String ext = StringUtils.getFilenameExtension(avatar.getOriginalFilename());
            if (ext == null || ext.isBlank()) ext = "png";
            Path baseDir = Paths.get("uploads", "avatars");
            Files.createDirectories(baseDir);
            Path target = baseDir.resolve(u.getId() + "." + ext.toLowerCase());
            Files.write(target, avatar.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            u.setAvatarUrl("/uploads/avatars/" + target.getFileName());
        }

        userRepository.save(u);

        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .avatarUrl(toAbsoluteUrl(u.getAvatarUrl()))
                .build();
    }
}