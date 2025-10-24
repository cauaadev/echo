package com.backend.echo.controller;

import com.backend.echo.entity.Block;
import com.backend.echo.entity.FriendRequest;
import com.backend.echo.entity.Friendship;
import com.backend.echo.entity.User;
import com.backend.echo.service.FriendService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;
    private final SimpMessagingTemplate messaging;

    @PostMapping("/requests")
    public ResponseEntity<?> sendRequest(@RequestParam Long toUserId) {
        FriendRequest fr = friendService.createRequest(toUserId);

        // Notificação em tempo real
        messaging.convertAndSend("/topic/notifications/" + fr.getReceiver().getId(),
                Map.of("type", "FRIEND_REQUEST", "requestId", fr.getId(),
                        "fromUsername", fr.getRequester().getUsername(),
                        "fromId", fr.getRequester().getId()));

        return ResponseEntity.ok().build();
    }

    @GetMapping("/requests")
    public List<FriendRequest> pending() {
        return friendService.pendingForCurrentUser();
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id) {
        Friendship fs = friendService.accept(id);

        messaging.convertAndSend("/topic/notifications/" + fs.getUser1().getId(),
                Map.of("type", "FRIEND_ACCEPTED",
                        "friendshipId", fs.getId(),
                        "message", "Você agora é amigo!"));

        messaging.convertAndSend("/topic/notifications/" + fs.getUser2().getId(),
                Map.of("type", "FRIEND_ACCEPTED",
                        "friendshipId", fs.getId(),
                        "message", "Você agora é amigo!"));

        return ResponseEntity.ok().build();
    }

    @PostMapping("/requests/{id}/decline")
    public ResponseEntity<?> decline(@PathVariable Long id) {
        friendService.decline(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/block/{userId}")
    public Block block(@PathVariable Long userId) {
        return friendService.block(userId);
    }

    @DeleteMapping("/block/{userId}")
    public ResponseEntity<?> unblock(@PathVariable Long userId) {
        friendService.unblock(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/block")
    public List<Block> blocked() {
        return friendService.myBlocked();
    }

    @PostMapping("/mute/{userId}")
    public ResponseEntity<?> mute(@PathVariable Long userId) {
        friendService.mute(userId, true);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unmute/{userId}")
    public ResponseEntity<?> unmute(@PathVariable Long userId) {
        friendService.mute(userId, false);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mute")
    public Set<Long> mutedIds() {
        return friendService.myMutedIds();
    }

    @GetMapping("/list")
    public List<FriendPublicDto> myFriends() {
        return friendService.myFriends().stream()
                .map(u -> {
                    String avatarUrl = u.getAvatarUrl();
                    // If entity has no public avatar URL, build a public URL to /media/avatar/{userId}
                    if (avatarUrl == null || avatarUrl.isBlank()) {
                        avatarUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                                .path("/media/avatar/")
                                .path(String.valueOf(u.getId()))
                                .toUriString();
                    }
                    return FriendPublicDto.builder()
                            .id(u.getId())
                            .username(u.getUsername())
                            .email(u.getEmail())
                            .avatarUrl(avatarUrl)
                            .build();
                })
                .toList();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> unfriend(@PathVariable Long userId) {
        friendService.unfriend(userId);
        return ResponseEntity.noContent().build();
    }

    @Data @Builder
    static class FriendPublicDto {
        private Long id;
        private String username;
        private String email;
        private String avatarUrl;
    }
}