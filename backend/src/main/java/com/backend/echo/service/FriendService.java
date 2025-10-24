package com.backend.echo.service;

import com.backend.echo.entity.Block;
import com.backend.echo.entity.FriendRequest;
import com.backend.echo.entity.Friendship;
import com.backend.echo.entity.User;

import java.util.List;
import java.util.Set;

public interface FriendService {
    FriendRequest createRequest(Long toUserId);
    List<FriendRequest> pendingForCurrentUser();
    Friendship accept(Long requestId);
    void decline(Long requestId);

    Block block(Long userId);
    void unblock(Long userId);
    List<Block> myBlocked();

    void mute(Long userId, boolean muted);
    Set<Long> myMutedIds();

    // novos
    List<User> myFriends();
    void unfriend(Long userId);
}