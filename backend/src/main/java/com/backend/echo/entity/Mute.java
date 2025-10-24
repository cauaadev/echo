// Java
package com.backend.echo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"owner_id","target_id"}))
public class Mute {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "owner_id")
    private User owner;  // quem silencia

    @ManyToOne(optional = false) @JoinColumn(name = "target_id")
    private User target; // quem é silenciado

    @Column(nullable = false)
    private boolean muted;
}