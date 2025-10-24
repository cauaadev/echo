// Java
package com.backend.echo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id","blocked_id"}))
public class Block {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "blocker_id")
    private User blocker;

    @ManyToOne(optional = false) @JoinColumn(name = "blocked_id")
    private User blocked;
}