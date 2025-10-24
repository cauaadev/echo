package com.backend.echo.service.impl;

import com.backend.echo.entity.*;
import com.backend.echo.repository.*;
import com.backend.echo.service.FriendService;
import com.backend.echo.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final BlockRepository blockRepository;
    private final MuteRepository muteRepository;

    private User me() {
        String username = SecurityUtils.currentUsername();
        if (username == null) throw new IllegalStateException("Não autenticado.");
        return userRepository.findByUsername(username).orElseThrow();
    }

    @Override
    public FriendRequest createRequest(Long toUserId) {
        User requester = me();
        if (Objects.equals(requester.getId(), toUserId)) {
            throw new IllegalArgumentException("Não é possível solicitar amizade a si mesmo.");
        }
        User receiver = userRepository.findById(toUserId).orElseThrow();

        if (friendshipRepository.existsBetween(requester, receiver)) {
            throw new IllegalStateException("Usuários já são amigos.");
        }

        // Bloqueio impede enviar pedido
        if (blockRepository.existsByBlockerAndBlocked(receiver, requester)) {
            throw new IllegalStateException("Não é possível enviar pedido, você foi bloqueado.");
        }

        var existing = friendRequestRepository.findByRequesterAndReceiver(requester, receiver);
        if (existing.isPresent() && existing.get().getStatus() == FriendRequest.Status.PENDING) {
            return existing.get();
        }

        FriendRequest fr = FriendRequest.builder()
                .requester(requester)
                .receiver(receiver)
                .status(FriendRequest.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        return friendRequestRepository.save(fr);
    }

    @Override
    public List<FriendRequest> pendingForCurrentUser() {
        return friendRequestRepository.findByReceiverAndStatus(me(), FriendRequest.Status.PENDING);
    }

    @Override
    public Friendship accept(Long requestId) {
        User current = me();
        FriendRequest fr = friendRequestRepository.findById(requestId).orElseThrow();
        if (!Objects.equals(fr.getReceiver().getId(), current.getId())) {
            throw new SecurityException("Sem permissão.");
        }

        fr.setStatus(FriendRequest.Status.ACCEPTED);
        friendRequestRepository.save(fr);

        User a = fr.getRequester();
        User b = fr.getReceiver();

        // Cria amizade se não existir
        if (!friendshipRepository.existsBetween(a, b)) {
            return friendshipRepository.save(Friendship.builder().user1(a).user2(b).build());
        }
        return friendshipRepository.findByUser1AndUser2(a, b)
                .orElseGet(() -> friendshipRepository.findByUser1AndUser2(b, a).orElseThrow());
    }

    @Override
    public void decline(Long requestId) {
        User current = me();
        FriendRequest fr = friendRequestRepository.findById(requestId).orElseThrow();
        if (!Objects.equals(fr.getReceiver().getId(), current.getId())) {
            throw new SecurityException("Sem permissão.");
        }
        fr.setStatus(FriendRequest.Status.DECLINED);
        friendRequestRepository.save(fr);
    }

    @Override
    public Block block(Long userId) {
        User current = me();
        User target = userRepository.findById(userId).orElseThrow();

        // Remove pedidos pendentes entre os dois
        friendRequestRepository.findByRequesterAndReceiver(target, current)
                .ifPresent(friendRequestRepository::delete);
        friendRequestRepository.findByRequesterAndReceiver(current, target)
                .ifPresent(friendRequestRepository::delete);

        if (blockRepository.existsByBlockerAndBlocked(current, target)) {
            return blockRepository.findByBlocker(current).stream()
                    .filter(b -> Objects.equals(b.getBlocked().getId(), userId))
                    .findFirst()
                    .orElseThrow();
        }

        return blockRepository.save(Block.builder().blocker(current).blocked(target).build());
    }

    @Override
    public void unblock(Long userId) {
        User current = me();
        blockRepository.findByBlocker(current).stream()
                .filter(b -> Objects.equals(b.getBlocked().getId(), userId))
                .findFirst()
                .ifPresent(blockRepository::delete);
    }

    @Override
    public List<Block> myBlocked() {
        return blockRepository.findByBlocker(me());
    }

    @Override
    public void mute(Long userId, boolean muted) {
        User current = me();
        User target = userRepository.findById(userId).orElseThrow();
        muteRepository.findByOwnerAndTarget(current, target)
                .ifPresentOrElse(m -> { m.setMuted(muted); muteRepository.save(m); },
                        () -> muteRepository.save(Mute.builder().owner(current).target(target).muted(muted).build()));
    }

    @Override
    public Set<Long> myMutedIds() {
        return muteRepository.findByOwnerAndMutedIsTrue(me()).stream()
                .map(m -> m.getTarget().getId())
                .collect(Collectors.toSet());
    }

    @Override
    public List<User> myFriends() {
        User current = me();
        return friendshipRepository.findByUser1OrUser2(current, current).stream()
                .map(fs -> Objects.equals(fs.getUser1().getId(), current.getId()) ? fs.getUser2() : fs.getUser1())
                .distinct()
                .toList();
    }

    @Override
    public void unfriend(Long userId) {
        User current = me();
        User other = userRepository.findById(userId).orElseThrow();

        friendshipRepository.findByUser1AndUser2(current, other)
                .ifPresent(friendshipRepository::delete);
        friendshipRepository.findByUser1AndUser2(other, current)
                .ifPresent(friendshipRepository::delete);
    }
}
