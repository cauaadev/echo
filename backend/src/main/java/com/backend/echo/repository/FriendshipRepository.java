package com.backend.echo.repository;

import com.backend.echo.entity.Friendship;
import com.backend.echo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    Optional<Friendship> findByUser1AndUser2(User u1, User u2);

    default boolean existsBetween(User a, User b) {
        return findByUser1AndUser2(a, b).isPresent() || findByUser1AndUser2(b, a).isPresent();
    }

    List<Friendship> findByUser1OrUser2(User u1, User u2);
}