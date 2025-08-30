package com.airis.message.mapper;

import com.airis.message.entity.ChatSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Chat session Mapper
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Mapper
public interface ChatSessionMapper {

        /**
         * Insert chat session
         * 
         * @param chatSession Chat session
         * @return Affected rows
         */
        int insert(ChatSession chatSession);

        /**
         * Update chat session
         * 
         * @param chatSession Chat session
         * @return Affected rows
         */
        int updateByPrimaryKey(ChatSession chatSession);

        /**
         * Query chat session by primary key
         * 
         * @param id Primary key ID
         * @return Chat session
         */
        ChatSession selectByPrimaryKey(Long id);

        /**
         * Query chat session by chat ID
         * 
         * @param chatId Chat ID
         * @return Chat session
         */
        ChatSession selectByChatId(@Param("chatId") String chatId);

        /**
         * Query chat session list by user ID
         * 
         * @param userId User ID
         * @param offset Offset
         * @param limit  Limit
         * @return Chat session list
         */
        List<ChatSession> selectByUserId(@Param("userId") String userId,
                        @Param("offset") int offset,
                        @Param("limit") int limit);

        /**
         * Query chat session list by user ID (with time filter)
         * 
         * @param userId          User ID
         * @param beforeTimestamp Timestamp
         * @param offset          Offset
         * @param limit           Limit
         * @return Chat session list
         */
        List<ChatSession> selectByUserIdWithTimestamp(@Param("userId") String userId,
                        @Param("beforeTimestamp") Long beforeTimestamp,
                        @Param("offset") int offset,
                        @Param("limit") int limit);

        /**
         * Count user's chat sessions
         * 
         * @param userId User ID
         * @return Session count
         */
        long countByUserId(@Param("userId") String userId);

        /**
         * Update last message info
         * 
         * @param chatId               Chat ID
         * @param lastMessageId        Last message ID
         * @param lastMessageContent   Last message content
         * @param lastMessageTimestamp Last message timestamp
         * @return Affected rows
         */
        int updateLastMessage(@Param("chatId") String chatId,
                        @Param("lastMessageId") String lastMessageId,
                        @Param("lastMessageContent") String lastMessageContent,
                        @Param("lastMessageTimestamp") Long lastMessageTimestamp);

        /**
         * Update user's unread message count
         * 
         * @param chatId      Chat ID
         * @param userId      User ID
         * @param unreadCount Unread count
         * @return Affected rows
         */
        int updateUnreadCount(@Param("chatId") String chatId,
                        @Param("userId") String userId,
                        @Param("unreadCount") Integer unreadCount);

        /**
         * Update user's last read message ID
         * 
         * @param chatId            Chat ID
         * @param userId            User ID
         * @param lastReadMessageId Last read message ID
         * @return Affected rows
         */
        int updateLastReadMessageId(@Param("chatId") String chatId,
                        @Param("userId") String userId,
                        @Param("lastReadMessageId") String lastReadMessageId);

        /**
         * Create or update chat session
         * 
         * @param chatSession Chat session
         * @return Affected rows
         */
        int insertOrUpdate(ChatSession chatSession);

        /**
         * Query chat session by two user IDs
         * 
         * @param userAId User A's ID
         * @param userBId User B's ID
         * @return Chat session
         */
        ChatSession selectByTwoUserIds(@Param("userAId") String userAId, @Param("userBId") String userBId);
}