package com.example.messenger.repository;

import com.example.messenger.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderIdAndReceiverIdOrderByTimestamp(Long senderId, Long receiverId);
}
