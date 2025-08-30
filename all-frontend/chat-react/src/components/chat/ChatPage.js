import React from 'react';
import ChatArea from './ChatArea';
import MessageSearch from './MessageSearch';
import { usePrefersReducedMotion } from '../../hooks/chat/useResponsive';
import '../../styles/chat/ChatPage.css';

const ChatPage = ({
    userId,
    currentChat,
    messages,
    connectionStatus,
    messagesLoading,
    hasMoreMessages,
    messageStatuses,
    showSearch,
    onSendMessage,
    onMediaSend,
    onLoadMoreMessages,
    onOpenSearch,
    onCloseSearch,
    onSearchMessageClick,
    onBack
}) => {
    const prefersReducedMotion = usePrefersReducedMotion();

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

    if (!userId || !currentChat) {
        return (
            <div className="chat-page-loading">
                <div className="loading-spinner"></div>
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <div className="chat-page">
            {connectionStatus === 'CONNECTING' && (
                <div className="connection-overlay">
                    <div className="connection-modal">
                        <div className="loading-spinner"></div>
                        <p>Reconnecting...</p>
                        <small>Please wait while we re-establish the connection</small>
                        <div className="connection-actions">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-secondary"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="chat-page-header">
                <div className="header-left">
                    <button
                        className="back-btn"
                        onClick={onBack}
                        aria-label="Back to conversations"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className="chat-info">
                        <div className="chat-avatar">
                            <div className="avatar-circle">
                                {currentChat.otherUserNickname?.[0]?.toUpperCase() || '?'}
                            </div>
                        </div>
                        <div className="chat-details">
                            <h1>{currentChat.otherUserNickname || currentChat.otherUserId}</h1>
                            <div className="connection-status">
                                <span
                                    className="status-indicator"
                                    style={{ backgroundColor: getConnectionStatusColor() }}
                                ></span>
                                <span className="status-text">{getConnectionStatusText()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="header-right">
                    <button onClick={onOpenSearch} className="btn btn-icon" title="Search in this chat">
                        <span className="btn-text">Search</span>
                    </button>

                </div>
            </div>

            <div className="chat-page-content">
                <ChatArea
                    currentChat={currentChat}
                    messages={messages}
                    messageStatuses={messageStatuses}
                    messagesLoading={messagesLoading}
                    hasMoreMessages={hasMoreMessages}
                    onSendMessage={onSendMessage}
                    onMediaSend={onMediaSend}
                    onLoadMoreMessages={onLoadMoreMessages}
                    userId={userId}
                    onOpenSearch={onOpenSearch}
                    isMobile={true}
                    isTablet={false}
                    isTouch={true}
                    prefersReducedMotion={prefersReducedMotion}
                    hideHeader={true}
                />
            </div>

            {showSearch && currentChat && (
                <MessageSearch
                    userId={userId}
                    currentChat={currentChat}
                    onClose={onCloseSearch}
                    onMessageClick={onSearchMessageClick}
                />
            )}
        </div>
    );
};

export default ChatPage; 