import React, { useState, useMemo } from 'react';
import '../../styles/chat/ChatList.css';

const ChatList = ({
    conversations,
    currentChat,
    onChatSelect,
    loading,
    userId,
    isMobile,
    isTablet,
    isTouch,
    onCloseSidebar
}) => {
    const [newChatUserId, setNewChatUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Sort conversations by last message timestamp (newest first)
    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            const timeA = a.lastMessageTimestamp || 0;
            const timeB = b.lastMessageTimestamp || 0;
            return timeB - timeA; // Descending order (newest first)
        });
    }, [conversations]);

    const filteredConversations = sortedConversations.filter(conv =>
        conv.otherUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.otherUserNickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessageContent?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNewChat = () => {
        const targetUserId = newChatUserId.trim();

        if (!targetUserId) {
            alert('Please enter a user ID');
            return;
        }

        if (targetUserId === userId) {
            alert('You cannot chat with yourself');
            return;
        }

        // Check if conversation already exists
        const existingConv = conversations.find(conv => conv.otherUserId === targetUserId);
        if (existingConv) {
            onChatSelect(existingConv);
            setNewChatUserId('');
            return;
        }

        // Create new conversation
        const newConversation = {
            chatId: generateChatId(userId, targetUserId),
            otherUserId: targetUserId,
            otherUserNickname: targetUserId,
            lastMessageContent: '',
            lastMessageTimestamp: Date.now(),
            unreadCount: 0
        };

        onChatSelect(newConversation);
        setNewChatUserId('');
    };

    const generateChatId = (userId1, userId2) => {
        const sortedIds = [userId1, userId2].sort();
        return `chat_${sortedIds[0]}_${sortedIds[1]}`;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Today - show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            // Yesterday
            return 'Yesterday';
        } else if (diffDays < 7) {
            // This week - show day name
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            // Older - show date
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const truncateMessage = (message, maxLength = 50) => {
        if (!message) return 'No messages yet';
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddNewChat();
        }
    };

    return (
        <div className="chat-list">
            {/* Header */}
            <div className="chat-list-header">
                <div className="chat-list-title">
                    <h2>Conversations</h2>
                    {/* 移动端关闭按钮 */}
                    {isMobile && onCloseSidebar && (
                        <button
                            className="close-sidebar-btn"
                            onClick={onCloseSidebar}
                            aria-label="Close sidebar"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Add New Chat */}
                {/*<div className="add-chat-container">*/}
                {/*    <input*/}
                {/*        type="text"*/}
                {/*        placeholder="Enter user ID to start chat"*/}
                {/*        value={newChatUserId}*/}
                {/*        onChange={(e) => setNewChatUserId(e.target.value)}*/}
                {/*        onKeyPress={handleKeyPress}*/}
                {/*        className="add-chat-input"*/}
                {/*    />*/}
                {/*    <button*/}
                {/*        onClick={handleAddNewChat}*/}
                {/*        className="add-chat-btn"*/}
                {/*        disabled={!newChatUserId.trim()}*/}
                {/*    >*/}
                {/*        Add*/}
                {/*    </button>*/}
                {/*</div>*/}
            </div>

            {/* Conversations List */}
            <div className="conversations-container">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <span>Loading conversations...</span>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="empty-state">
                        {searchTerm ? (
                            <p>No conversations found matching "{searchTerm}"</p>
                        ) : (
                            <div>
                                <p>No conversations yet</p>
                                {/*<p className="empty-hint">Add a user ID above to start chatting</p>*/}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="conversations-list">
                        {filteredConversations.map((conversation) => (
                            <div
                                key={conversation.chatId}
                                className={`conversation-item ${currentChat?.chatId === conversation.chatId ? 'active' : ''
                                    }`}
                                onClick={() => onChatSelect(conversation)}
                            >
                                <div className="conversation-avatar">
                                    <div className="avatar-circle">
                                        {conversation.otherUserNickname?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    {/* Online status indicator could go here */}
                                </div>

                                <div className="conversation-content">
                                    <div className="conversation-header">
                                        <div className="conversation-name">
                                            {conversation.otherUserNickname || conversation.otherUserId}
                                        </div>
                                        <div className="conversation-time">
                                            {formatTimestamp(conversation.lastMessageTimestamp)}
                                        </div>
                                    </div>

                                    <div className="conversation-footer">
                                        <div className="last-message">
                                            {truncateMessage(conversation.lastMessageContent)}
                                        </div>

                                        {conversation.unreadCount > 0 && (
                                            <div className="unread-badge">
                                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with stats */}
            <div className="chat-list-footer">
                <div className="stats">
                    {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
                    {conversations.some(c => c.unreadCount > 0) && (
                        <span className="unread-total">
                            • {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)} unread
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatList; 