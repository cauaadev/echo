// Java
package com.backend.echo.repository;

import com.backend.echo.entity.Mute;
import com.backend.echo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MuteRepository extends JpaRepository<Mute, Long> {
    Optional<Mute> findByOwnerAndTarget(User owner, User target);
    List<Mute> findByOwnerAndMutedIsTrue(User owner);
}