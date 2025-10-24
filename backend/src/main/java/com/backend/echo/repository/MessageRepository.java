package com.backend.echo.repository;

import com.backend.echo.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findBySenderIdAndReceiverIdOrderByTimestamp(Long senderId, Long receiverId);

    @Query("""
           select m from Message m
           where (m.sender.id = :a and m.receiver.id = :b)
              or (m.sender.id = :b and m.receiver.id = :a)
           order by m.timestamp asc
           """)
    List<Message> findConversation(Long a, Long b);
}