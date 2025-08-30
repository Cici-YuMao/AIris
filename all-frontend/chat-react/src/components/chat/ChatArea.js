import React, { useState, useRef, useEffect, forwardRef } from 'react';
import Message from './Message';
import FileUploader from './FileUploader';
import ImageUploader from './ImageUploader';
import VoiceRecorder from './VoiceRecorder';
import '../../styles/chat/ChatArea.css';
import apiService from '../../services/chat/api';

const ChatArea = forwardRef(({
    currentChat,
    messages,
    messageStatuses,
    messagesLoading,
    hasMoreMessages,
    onSendMessage,
    onMediaSend,
    onLoadMoreMessages,
    userId,
    onOpenSearch,
    onToggleSidebar,
    isMobile,
    isTablet,
    isTouch,
    prefersReducedMotion,
    hideHeader = false
}, ref) => {
    const [messageInput, setMessageInput] = useState('');
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [showImageUploader, setShowImageUploader] = useState(false);
    const [showFileUploader, setShowFileUploader] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const messagesContainerRef = useRef(null);
    const messageInputRef = useRef(null);
    const uploadMenuRef = useRef(null);
    const isUserScrolling = useRef(false);
    const lastScrollTop = useRef(0);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive (but not when loading history)
        if (messagesContainerRef.current && !messagesLoading) {
            const container = messagesContainerRef.current;
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

            if (isAtBottom || !isUserScrolling.current) {
                scrollToBottom();
            }
        }
    }, [messages, messagesLoading]);

    useEffect(() => {
        // Focus on message input when chat changes
        if (currentChat && messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [currentChat]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            isUserScrolling.current = false;
        }
    };

    const handleSendMessage = () => {
        const content = messageInput.trim();
        if (content && currentChat) {
            onSendMessage(content);
            setMessageInput('');

            // Auto-scroll to bottom after sending
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
    };

    // Media upload handlers
    const handleToggleUploadMenu = () => {
        setShowUploadMenu(!showUploadMenu);
    };

    const handleImageUpload = (imageInfo) => {
        if (onMediaSend) {
            onMediaSend({
                messageType: 'IMAGE',
                metadata: imageInfo.metadata,
                url: imageInfo.url,
                fileName: imageInfo.metadata.fileName
            });
        }
        setShowImageUploader(false);
        setShowUploadMenu(false);
    };

    const handleFileUpload = (file, fileId, onProgress, onComplete, uploadResult) => {
        // The FileUploader now handles the actual upload
        // We just need to handle the result if provided
        if (uploadResult && onMediaSend) {
            onMediaSend({
                messageType: 'FILE',
                metadata: {
                    fileName: uploadResult.fileName,
                    fileSize: uploadResult.fileSize
                },
                url: uploadResult.url,
                fileName: uploadResult.fileName
            });
        }
    };

    const handleVoiceUpload = async (voiceInfo) => {
        try {
            // Upload voice file to media service
            const response = await apiService.uploadMedia(
                voiceInfo.file,
                userId,
                currentChat.otherUserId
            );

            if (onMediaSend) {
                onMediaSend({
                    messageType: 'VOICE',
                    metadata: {
                        fileName: response.fileName,
                        fileSize: response.fileSize,
                        duration: voiceInfo.duration,
                        mimeType: voiceInfo.metadata.mimeType
                    },
                    url: response.url,
                    fileName: response.fileName
                });
            }
        } catch (error) {
            console.error('Voice upload failed:', error);
            alert(`Voice upload failed: ${error.message}`);
        }

        setShowVoiceRecorder(false);
        setShowUploadMenu(false);
    };

    // Close upload menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target)) {
                setShowUploadMenu(false);
            }
        };

        if (showUploadMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUploadMenu]);

    const handleScroll = (e) => {
        const container = e.target;
        const currentScrollTop = container.scrollTop;

        // Check if user is scrolling up
        if (currentScrollTop < lastScrollTop.current) {
            isUserScrolling.current = true;
        }

        lastScrollTop.current = currentScrollTop;

        // Load more messages when scrolling to top
        if (container.scrollTop === 0 && hasMoreMessages && !messagesLoading) {
            const oldScrollHeight = container.scrollHeight;

            onLoadMoreMessages();

            // Maintain scroll position after loading more messages
            setTimeout(() => {
                const newScrollHeight = container.scrollHeight;
                container.scrollTop = newScrollHeight - oldScrollHeight;
            }, 100);
        }
    };

    const getMessageStatus = (messageId, message) => {
        // First check the messageStatuses map (most up-to-date)
        const mapStatus = messageStatuses.get(messageId);
        if (mapStatus) {
            return mapStatus;
        }

        // Fallback to message's internal status
        if (message && message.status) {
            return message.status;
        }

        return 'UNKNOWN';
    };

    const scrollToTop = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = 0;
        }
    };

    if (!currentChat) {
        return (
            <div className="chat-area">
                <div className="no-chat-selected">
                    <div className="no-chat-content">
                        <div className="no-chat-icon">💬</div>
                        <h2>Welcome to Chat</h2>
                        <p>Select a conversation from the sidebar to start chatting</p>
                        {/* <p className="hint">Or add a new user ID to start a new conversation</p> */}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-area" ref={ref}>
            {/* Chat Header */}
            {!hideHeader && (
                <div className="chat-area-header">
                    <div className="chat-info">
                        {/* Mobile back button */}
                        {isMobile && onToggleSidebar && (
                            <button
                                className="back-btn"
                                onClick={onToggleSidebar}
                                aria-label="Back to chat list"
                            >
                                ←
                            </button>
                        )}
                        <div className="chat-avatar">
                            <div className="avatar-circle">
                                {currentChat.otherUserNickname?.[0]?.toUpperCase() || '?'}
                            </div>
                        </div>
                        <div className="chat-details">
                            <h3 className="chat-name">
                                {currentChat.otherUserNickname || currentChat.otherUserId}
                            </h3>
                        </div>
                    </div>

                    <div className="chat-actions">
                        <button
                            onClick={onOpenSearch}
                            className="btn btn-secondary btn-small"
                            title="Search in this chat"
                        >
                            🔍 Search
                        </button>
                        {hasMoreMessages && (
                            <button
                                onClick={scrollToTop}
                                className="btn btn-secondary btn-small"
                                title="Scroll to top"
                            >
                                ↑ Top
                            </button>
                        )}
                        <button
                            onClick={scrollToBottom}
                            className="btn btn-secondary btn-small"
                            title="Scroll to bottom"
                        >
                            ↓ Bottom
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Container */}
            <div
                className="messages-container"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {/* Load More Messages Indicator */}
                {hasMoreMessages && (
                    <div className="load-more-container">
                        {messagesLoading ? (
                            <div className="loading-more">
                                <div className="loading-spinner small"></div>
                                <span>Loading more messages...</span>
                            </div>
                        ) : (
                            <button
                                onClick={onLoadMoreMessages}
                                className="load-more-btn"
                            >
                                Load more messages
                            </button>
                        )}
                    </div>
                )}

                {/* Messages List */}
                <div className="messages-list">
                    {messagesLoading && messages.length === 0 ? (
                        <div className="loading-messages">
                            <div className="loading-spinner"></div>
                            <span>Loading messages...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="no-messages">
                            <div className="no-messages-icon">📝</div>
                            <p>No messages yet</p>
                            <p className="hint">Send a message to start the conversation</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isOwn = message.senderId === userId;
                            const showAvatar = !isOwn && (
                                index === messages.length - 1 ||
                                messages[index + 1]?.senderId !== message.senderId
                            );
                            const status = getMessageStatus(message.messageId, message);

                            return (
                                <Message
                                    key={message.messageId || `temp_${index}`}
                                    message={message}
                                    isOwn={isOwn}
                                    showAvatar={showAvatar}
                                    status={status}
                                    userId={userId}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Upload Overlays */}
            {showImageUploader && (
                <div className="upload-overlay">
                    <div className="upload-modal">
                        <div className="upload-header">
                            <h3>Upload Image</h3>
                            <button
                                onClick={() => setShowImageUploader(false)}
                                className="close-button"
                            >
                                ✕
                            </button>
                        </div>
                        <ImageUploader
                            onImageSelect={handleImageUpload}
                            userId={userId}
                            receiverId={currentChat.otherUserId}
                        />
                    </div>
                </div>
            )}

            {showFileUploader && (
                <div className="upload-overlay">
                    <div className="upload-modal">
                        <div className="upload-header">
                            <h3>Upload File</h3>
                            <button
                                onClick={() => setShowFileUploader(false)}
                                className="close-button"
                            >
                                ✕
                            </button>
                        </div>
                        <FileUploader
                            onFileSelect={handleFileUpload}
                            userId={userId}
                            receiverId={currentChat.otherUserId}
                        />
                    </div>
                </div>
            )}

            {showVoiceRecorder && (
                <div className="upload-overlay">
                    <div className="upload-modal">
                        <div className="upload-header">
                            <h3>Record Voice Message</h3>
                            <button
                                onClick={() => setShowVoiceRecorder(false)}
                                className="close-button"
                            >
                                ✕
                            </button>
                        </div>
                        <VoiceRecorder onVoiceSelect={handleVoiceUpload} />
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="message-input-container">
                <div className="input-wrapper">
                    <div className="input-row">
                        {/* Upload Button */}
                        <div className="upload-section" ref={uploadMenuRef}>
                            <button
                                onClick={handleToggleUploadMenu}
                                className="upload-button"
                                title="Attach file"
                            >
                                📎
                            </button>

                            {showUploadMenu && (
                                <div className="upload-menu">
                                    <button
                                        onClick={() => {
                                            setShowImageUploader(true);
                                            setShowUploadMenu(false);
                                        }}
                                        className="upload-option"
                                    >
                                        <span className="upload-icon">🖼️</span>
                                        <span>Image</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowFileUploader(true);
                                            setShowUploadMenu(false);
                                        }}
                                        className="upload-option"
                                    >
                                        <span className="upload-icon">📄</span>
                                        <span>File</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowVoiceRecorder(true);
                                            setShowUploadMenu(false);
                                        }}
                                        className="upload-option"
                                    >
                                        <span className="upload-icon">🎤</span>
                                        <span>Voice</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <textarea
                            ref={messageInputRef}
                            value={messageInput}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={`Type a message to ${currentChat.otherUserNickname || currentChat.otherUserId}...`}
                            className="message-input"
                            rows="1"
                            maxLength="2000"
                        />

                        <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="send-button"
                            title="Send message (Enter)"
                        >
                            ➤
                        </button>
                    </div>

                    <div className="input-meta">
                        <div className="input-hint">
                            Press Enter to send, Shift+Enter for new line
                        </div>
                        <div className="character-count">
                            {messageInput.length}/2000
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ChatArea.displayName = 'ChatArea';

export default ChatArea; 