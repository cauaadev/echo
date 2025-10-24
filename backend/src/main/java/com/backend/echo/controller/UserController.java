package com.backend.echo.controller;

import com.backend.echo.entity.User;
import com.backend.echo.repository.UserRepository;
import com.backend.echo.util.SecurityUtils;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    private String toAbsoluteUrl(String maybeRelative) {
        if (maybeRelative == null || maybeRelative.isBlank()) return null;
        if (maybeRelative.startsWith("http://") || maybeRelative.startsWith("https://")) return maybeRelative;
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(maybeRelative.startsWith("/") ? maybeRelative : "/" + maybeRelative)
                .toUriString();
    }

    @GetMapping
    public List<PublicUserResponse> getAllUsers() {
        String me = SecurityUtils.currentUsername();
        return userRepository.findAll().stream()
                .filter(u -> !u.getUsername().equals(me)) // não listar o próprio usuário
                .map(u -> PublicUserResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .avatarUrl(toAbsoluteUrl(u.getAvatarUrl()))
                        .build())
                .toList();
    }

    @GetMapping("/exists")
    public ExistsResponse exists(@RequestParam("username") String username) {
        return new ExistsResponse(userRepository.existsByUsername(username));
    }

    @GetMapping("/{username}")
    public PublicUserResponse byUsername(@PathVariable String username) {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        return PublicUserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .avatarUrl(toAbsoluteUrl(u.getAvatarUrl()))
                .build();
    }

    @Data
    static class ExistsResponse {
        private final boolean exists;
    }

    @Data @Builder
    static class PublicUserResponse {
        private Long id;
        private String username;
        private String email;
        private String avatarUrl;
    }
}