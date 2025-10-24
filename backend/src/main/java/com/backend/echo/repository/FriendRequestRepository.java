// Java
package com.backend.echo.repository;

import com.backend.echo.entity.FriendRequest;
import com.backend.echo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    List<FriendRequest> findByReceiverAndStatus(User receiver, FriendRequest.Status status);
    Optional<FriendRequest> findByRequesterAndReceiver(User requester, User receiver);
}