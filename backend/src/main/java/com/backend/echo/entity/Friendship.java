// Java
package com.backend.echo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(indexes = {
        @Index(name = "idx_friendship_users", columnList = "user1_id,user2_id", unique = true)
})
public class Friendship {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "user1_id")
    private User user1;

    @ManyToOne(optional = false) @JoinColumn(name = "user2_id")
    private User user2;
}