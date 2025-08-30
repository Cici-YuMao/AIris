import React, { useMemo } from 'react';
import '../../styles/chat/ConversationListPage.css';

const ConversationListPage = ({
    userId,
    conversations,
    loading,
    connectionStatus,
    newChatUserId,
    setNewChatUserId,
    searchTerm,
    setSearchTerm,
    onChatSelect,
    onAddNewChat
}) => {
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
            onAddNewChat();
        }
    };

    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'CONNECTED': return '#4CAF50';
            case 'CONNECTING': return '#FF9800';
            case 'DISCONNECTED': return '#f44336';
            default: return '#ccc';
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'CONNECTED': return 'Connected';
            case 'CONNECTING': return 'Connecting...';
            case 'DISCONNECTED': return 'Disconnected';
            default: return 'Unknown';
        }
    };

    return (
        <div className="conversation-list-page">
            {/* Header */}
            <div className="conversation-list-header">
                <div className="header-content">
                    <h1>Chats</h1>
                    <div className="header-actions">
                        <div className="connection-status">
                            <span
                                className="status-indicator"
                                style={{ backgroundColor: getConnectionStatusColor() }}
                            ></span>
                            <span className="status-text">{getConnectionStatusText()}</span>
                        </div>
                        <span className="user-info">User: {userId}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="conversation-list-content">
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
                {/*        onClick={onAddNewChat}*/}
                {/*        className="add-chat-btn"*/}
                {/*        disabled={!newChatUserId.trim()}*/}
                {/*    >*/}
                {/*        Start Chat*/}
                {/*    </button>*/}
                {/*</div>*/}

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
                                    className="conversation-item"
                                    onClick={() => onChatSelect(conversation)}
                                >
                                    <div className="conversation-avatar">
                                        <div className="avatar-circle">
                                            {conversation.otherUserNickname?.[0]?.toUpperCase() || '?'}
                                        </div>
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

                                        <div className="conversation-preview">
                                            <div className="conversation-message">
                                                {truncateMessage(conversation.lastMessageContent)}
                                            </div>
                                            {conversation.unreadCount > 0 && (
                                                <div className="unread-badge">
                                                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="conversation-chevron">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationListPage; 