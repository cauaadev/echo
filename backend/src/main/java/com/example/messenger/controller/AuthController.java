package com.example.messenger.controller;

import com.example.messenger.dto.AuthenticationRequest;
import com.example.messenger.dto.AuthenticationResponse;
import com.example.messenger.dto.RegisterRequest;
import com.example.messenger.entity.User;
import com.example.messenger.repository.UserRepository;
import com.example.messenger.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;

    @PostMapping("/register")
    public AuthenticationResponse register(@RequestBody RegisterRequest request) {
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER") // qualquer registro é USER por padrão
                .avatarUrl(request.getAvatarUrl())
                .build();
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthenticationResponse(token);
    }

    @PostMapping("/login")
    public AuthenticationResponse login(@RequestBody AuthenticationRequest request) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthenticationResponse(token);
    }
}
