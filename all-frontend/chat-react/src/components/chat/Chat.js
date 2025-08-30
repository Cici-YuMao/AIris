import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatList from './ChatList';
import ChatArea from './ChatArea';
import MessageSearch from './MessageSearch';
import ConversationListPage from './ConversationListPage';
import ChatPage from './ChatPage';
import apiService from '../../services/chat/api';
import webSocketService from '../../services/chat/websocket';
import authService from '../../services/chat/auth';
import { useResponsive, usePrefersReducedMotion } from '../../hooks/chat/useResponsive';
import '../../styles/chat/Chat.css';

const Chat = ({
    initialChatUserId,
    initialChatDisplayName,
    onMessageSent,
    onChatClose,
    onUserClick,
    disableNavigation = false
} = {}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userId, setUserId] = useState('');
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [messageStatuses, setMessageStatuses] = useState(new Map());
    const [showSearch, setShowSearch] = useState(false);
    const [authStatus, setAuthStatus] = useState(null);

    // 移动端状态管理
    const [mobileView, setMobileView] = useState('conversations'); // 'conversations' | 'chat'
    const [searchTerm, setSearchTerm] = useState('');
    const [newChatUserId, setNewChatUserId] = useState(initialChatUserId || '');

    // 使用响应式Hooks - 简化为只区分移动端和桌面端
    const { isMobile, isTouch } = useResponsive();
    const prefersReducedMotion = usePrefersReducedMotion();

    const chatAreaRef = useRef(null);
    const messagesCache = useRef(new Map()); // Cache for messages by chatId
    const isInitialConnection = useRef(true); // Track if this is the first connection

    // Use refs to store latest values for handlers to avoid frequent re-creation
    const currentChatRef = useRef(currentChat);
    const userIdRef = useRef(userId);

    // Update refs when values change
    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    // 移动端初始化：确保显示对话列表
    useEffect(() => {
        if (isMobile) {
            if (currentChat) {
                setMobileView('chat');
            } else {
                setMobileView('conversations');
            }
        }
    }, [isMobile, currentChat]);

    // URL参数处理状态
    const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);

    // 处理URL参数中的快速开始聊天
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const targetUserId = searchParams.get('start') || searchParams.get('with');
        const displayNameFromUrl = searchParams.get('displayName');
        const effectiveDisplayName = displayNameFromUrl || initialChatDisplayName;

        // 只在有targetUserId，且还未处理过URL参数时才执行
        if (targetUserId && userId && !urlParamsProcessed && !loading && conversations.length >= 0) {
            console.log('🚀 Quick start chat initiated with user:', targetUserId);
            console.log('📱 Current user ID:', userId);
            console.log('📋 Available conversations:', conversations.length);

            // 立即标记为已处理，防止重复执行
            setUrlParamsProcessed(true);

            // 立即清除URL参数
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            handleQuickStartChat(targetUserId, effectiveDisplayName);
        } else if (!targetUserId && urlParamsProcessed) {
            // 如果URL中没有参数了，重置处理状态
            setUrlParamsProcessed(false);
        }
    }, [userId, location.search, loading, conversations.length, urlParamsProcessed, initialChatDisplayName]);

    // 聊天选择处理（移动端切换到聊天视图，桌面端不需要关闭侧边栏）
    const handleChatSelectWithSidebarControl = (conversation) => {
        handleChatSelect(conversation);
        if (isMobile) {
            setMobileView('chat');
        }
    };

    // 认证状态监听
    useEffect(() => {
        const handleAuthStatusChange = (event) => {
            setAuthStatus(event.detail);

            if (!event.detail.isAuthenticated) {
                console.warn('User not authenticated, redirecting to home');
                if (!disableNavigation) {
                    navigate('/');
                }
            } else if (event.detail.isExpiringSoon) {
                console.warn('Token expiring soon');
                // 可以在这里添加用户提醒逻辑
            }
        };

        window.addEventListener('auth-status-change', handleAuthStatusChange);

        return () => {
            window.removeEventListener('auth-status-change', handleAuthStatusChange);
        };
    }, [navigate, disableNavigation]);

    useEffect(() => {
        initializeChat();

        return () => {
            webSocketService.stopReconnecting();
            webSocketService.disconnect();
            authService.stopTokenMonitoring();
        };
    }, []);

    useEffect(() => {
        if (userId && authService.isAuthenticated()) {
            connectWebSocket();
            loadConversations();
            // 启动token监控
            authService.startTokenMonitoring();
        }
    }, [userId]);

    // 处理 initialChatUserId - 在会话加载完成后自动打开指定聊天
    useEffect(() => {
        if (initialChatUserId && conversations.length > 0 && userId && !currentChat) {
            console.log('Auto-opening chat for user:', initialChatUserId);

            // 查找现有的会话
            const existingConversation = conversations.find(conv =>
                conv.otherUserId === initialChatUserId
            );

            if (existingConversation) {
                // 如果已存在会话，直接打开
                handleChatSelect(existingConversation);
            } else {
                // 如果不存在会话，创建新的会话
                handleQuickStartChat(initialChatUserId, initialChatDisplayName);
            }
        }
    }, [initialChatUserId, conversations, userId, currentChat, initialChatDisplayName]);

    const initializeChat = () => {
        // 检查认证状态
        if (!authService.isAuthenticated()) {
            console.warn('User not authenticated, redirecting to welcome page');
            navigate('/');
            return;
        }

        // 尝试从chatConfig中获取userId
        const config = localStorage.getItem('chatConfig');
        let savedUserId = null;

        if (config) {
            try {
                const configObj = JSON.parse(config);
                savedUserId = configObj.userId;
            } catch (e) {
                console.error('Error parsing chatConfig:', e);
            }
        }

        // 如果chatConfig中没有userId，则从独立的chatUserId中获取
        if (!savedUserId) {
            savedUserId = localStorage.getItem('chatUserId');
        }

        if (!savedUserId) {
            console.warn('No user ID found, redirecting to welcome page');
            navigate('/');
            return;
        }

        // 验证token中的用户ID与保存的用户ID是否匹配
        const userInfo = authService.getUserInfo();
        if (userInfo && userInfo.userId && userInfo.userId !== savedUserId) {
            console.warn('Token user ID does not match saved user ID, clearing auth data');
            authService.clearAuthData();
            navigate('/');
            return;
        }

        setUserId(savedUserId);

        // 初始化认证状态
        const status = authService.refreshAuthStatus();
        setAuthStatus(status);
    };

    const setupWebSocketHandlers = () => {
        // Clear existing handlers first to prevent duplicates
        webSocketService.messageHandlers.clear();
        webSocketService.connectionHandlers.length = 0;

        // Connection status handler
        webSocketService.addConnectionHandler((status, extra = {}) => {
            const previousStatus = connectionStatus;
            setConnectionStatus(status);

            if (status === 'CONNECTED') {
                console.log('WebSocket connected successfully');

                // Check if this is a reconnection (not the initial connection)
                if (!isInitialConnection.current) {
                    console.log('Detected reconnection, refreshing data...');
                    setTimeout(() => {
                        refreshAfterReconnection();
                    }, 100); // Small delay to ensure state is updated
                } else {
                    console.log('Initial connection established');
                    isInitialConnection.current = false;
                }
            } else if (status === 'DISCONNECTED') {
                console.log('WebSocket disconnected');
                // Mark any pending messages as failed
                setMessageStatuses(prev => {
                    const newMap = new Map(prev);
                    for (const [key, value] of newMap) {
                        if (value === 'PENDING') {
                            newMap.set(key, 'FAILED');
                            console.log('Marking pending message as failed due to disconnect:', key);
                        }
                    }
                    return newMap;
                });
            } else if (status === 'CONNECTING') {
                console.log('WebSocket connecting...');
            } else if (status === 'ERROR') {
                console.error('WebSocket error:', extra);

                // 检查是否为认证错误
                if (extra.reason === 'not_authenticated' || extra.reason === 'auth_failed') {
                    console.warn('WebSocket authentication error, redirecting to home');
                    authService.clearAuthData();
                    navigate('/');
                }
            }
        });

        // Message handlers
        webSocketService.addMessageHandler('CHAT_MESSAGE', handleIncomingMessage);
        webSocketService.addMessageHandler('MESSAGE_ACK', handleMessageAck);
        webSocketService.addMessageHandler('MESSAGE_TIMEOUT', handleMessageTimeout);
        webSocketService.addMessageHandler('MESSAGE_ERROR', handleMessageError);
        webSocketService.addMessageHandler('READ_RECEIPT', handleReadReceipt);
    };

    const connectWebSocket = async () => {
        try {
            await webSocketService.connect(userId);
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);

            // 检查是否为认证错误
            if (error.message === 'Authentication required') {
                authService.clearAuthData();
                navigate('/');
                return;
            }

            alert('Failed to connect to chat service. Please check your configuration.');
        }
    };

    const loadConversations = async () => {
        setLoading(true);
        try {
            const result = await apiService.getConversations(userId);
            const serverConversations = result.records || [];

            // 合并服务器conversations和本地创建的conversations
            setConversations(prev => {
                // 找出本地创建的conversations
                const localConversations = prev.filter(localConv => {
                    // 检查这个conversation是否在服务器列表中不存在
                    const existsOnServer = serverConversations.some(serverConv =>
                        serverConv.chatId === localConv.chatId ||
                        serverConv.otherUserId === localConv.otherUserId
                    );
                    // 保留本地创建的且服务器上不存在的conversations
                    // 使用 isLocalCreated 标记 + 没有真实消息内容作为双重判断
                    return !existsOnServer && (
                        localConv.isLocalCreated ||
                        (!localConv.lastMessageContent || localConv.lastMessageContent === '')
                    );
                });

                console.log('🔄 Merging conversations:', {
                    serverCount: serverConversations.length,
                    localCount: localConversations.length,
                    localConversations: localConversations.map(c => ({
                        chatId: c.chatId,
                        otherUserId: c.otherUserId,
                        isLocalCreated: c.isLocalCreated
                    }))
                });

                // 清除合并的本地conversations的 isLocalCreated 标记
                const cleanedLocalConversations = localConversations.map(conv => {
                    const { isLocalCreated, ...cleanConv } = conv;
                    return cleanConv;
                });

                // 合并并排序
                const mergedConversations = [...serverConversations, ...cleanedLocalConversations];
                return mergedConversations.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
            });
        } catch (error) {
            console.error('Error loading conversations:', error);

            // 检查是否为认证错误
            if (error.response && error.response.status === 401) {
                console.warn('Authentication failed while loading conversations');
                authService.clearAuthData();
                navigate('/');
                return;
            }

            alert('Failed to load conversations. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (chatId, page = 1, append = false, forceRefresh = false) => {
        if (!append) {
            setMessagesLoading(true);
        }

        try {
            // Check cache first (unless forced refresh)
            const cacheKey = `${chatId}_page_${page}`;
            const cached = messagesCache.current.get(cacheKey);

            if (cached && !append && !forceRefresh) {
                setMessages(cached.messages);
                setHasMoreMessages(cached.hasMore);
                setMessagesLoading(false);
                return;
            }

            const result = await apiService.getMessages(chatId, userId, page, 30);
            const newMessages = result.records || [];

            // Sort messages by timestamp (oldest first for proper chat display)
            const sortedNewMessages = [...newMessages].sort((a, b) =>
                (a.timestamp || 0) - (b.timestamp || 0)
            );

            if (append) {
                // When loading more (older) messages, add them at the beginning
                setMessages(prev => {
                    const combined = [...sortedNewMessages, ...prev];
                    // Ensure entire array is sorted by timestamp
                    return combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                });
            } else {
                // Initial load - just set the sorted messages
                setMessages(sortedNewMessages);
                // Cache the first page with sorted messages
                messagesCache.current.set(cacheKey, {
                    messages: sortedNewMessages,
                    hasMore: result.hasNext
                });
            }

            setHasMoreMessages(result.hasNext);

            // Send read receipts for unread messages from other users when loading messages
            if (!append && newMessages.length > 0) {
                const unreadMessages = newMessages.filter(msg =>
                    msg.senderId !== userId &&
                    (!msg.status || msg.status !== 'read')
                );

                console.log('Sending read receipts for', unreadMessages.length, 'unread messages');

                // Send read receipts for all unread messages
                for (const msg of unreadMessages) {
                    console.log('Sending read receipt for loaded message:', msg.messageId);
                    await sendReadReceipt(chatId, msg.messageId);
                }
            }

        } catch (error) {
            console.error('Error loading messages:', error);

            // 检查是否为认证错误
            if (error.response && error.response.status === 401) {
                console.warn('Authentication failed while loading messages');
                authService.clearAuthData();
                navigate('/');
                return;
            }
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleChatSelect = async (conversation) => {
        if (currentChat?.chatId === conversation.chatId) {
            return; // Already selected
        }

        setCurrentChat(conversation);
        setMessages([]);
        setHasMoreMessages(true);
        messagesCache.current.clear(); // Clear cache when switching chats

        // If this is a new conversation (not in the conversations list), add it
        setConversations(prev => {
            const exists = prev.find(conv => conv.chatId === conversation.chatId);
            if (!exists) {
                console.log('Adding new conversation to list:', conversation.chatId);
                const updated = [conversation, ...prev];
                // Sort by timestamp (newest first)
                return updated.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
            }
            return prev;
        });

        await loadMessages(conversation.chatId);

        // Mark conversation as read (reset unread count)
        setConversations(prev => {
            const updated = prev.map(conv =>
                conv.chatId === conversation.chatId
                    ? { ...conv, unreadCount: 0 }
                    : conv
            );
            // Sort by timestamp (newest first)
            return updated.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
        });
    };

    const handleSendMessage = (content, messageType = 'TEXT', mediaMetadata = null) => {
        if (!currentChat || (!content.trim() && !mediaMetadata)) {
            return;
        }

        // 检查认证状态
        if (!authService.isAuthenticated()) {
            console.warn('User not authenticated, cannot send message');
            alert('Authentication required. Please check your access token.');
            navigate('/');
            return;
        }

        const chatId = currentChat.chatId;
        const receiverId = currentChat.otherUserId;
        const tempId = generateTempId();

        console.log('Sending message with tempId:', tempId, 'type:', messageType);

        // Create message object for WebSocket
        const message = {
            type: 'CHAT_MESSAGE',
            chatId,
            receiverId,
            content: content ? content.trim() : '',
            chatMessageType: messageType,
            mediaMetadata: mediaMetadata,
            tempMessageId: tempId,
            timestamp: Date.now()
        };

        // Add message to local state immediately with temp ID
        const localMessage = {
            messageId: tempId,
            chatId,
            senderId: userId,
            receiverId,
            content: content ? content.trim() : '',
            messageType: messageType,
            mediaMetadata: mediaMetadata,
            timestamp: Date.now(),
            status: 'PENDING'
        };

        console.log('Adding local message with PENDING status:', localMessage);

        setMessages(prev => {
            const combined = [...prev, localMessage];
            // Sort by timestamp to maintain proper order
            return combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        });
        setMessageStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(tempId, 'PENDING');
            return newMap;
        });

        // Send via WebSocket
        const success = webSocketService.sendMessage(message);
        if (!success) {
            // If WebSocket send fails, mark as error
            console.log('WebSocket send failed, marking as FAILED');
            setMessageStatuses(prev => new Map(prev.set(tempId, 'FAILED')));
        }

        // Update conversation list with last message and sort by timestamp
        const lastMessageContent = getMessagePreview(messageType, content, mediaMetadata);
        setConversations(prev => {
            const updated = prev.map(conv =>
                conv.chatId === chatId
                    ? {
                        ...conv,
                        lastMessageContent: lastMessageContent,
                        lastMessageTimestamp: Date.now(),
                        // 清除本地创建标记，因为现在有了真实消息
                        isLocalCreated: undefined
                    }
                    : conv
            );
            // Sort by timestamp (newest first)
            return updated.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
        });

        // 调用外部回调函数（用于 Web Component 集成）
        if (onMessageSent) {
            onMessageSent({
                tempId,
                chatId,
                receiverId,
                content: content ? content.trim() : '',
                messageType,
                mediaMetadata,
                timestamp: Date.now()
            });
        }
    };

    const handleMediaSend = useCallback((mediaInfo) => {
        if (!currentChat) {
            console.warn('No current chat selected');
            return;
        }

        const { messageType, metadata, url, fileName } = mediaInfo;

        // Create media metadata for the message
        const mediaMetadata = {
            url: url,
            fileName: fileName,
            fileSize: metadata.fileSize,
            width: metadata.width,
            height: metadata.height,
            duration: metadata.duration
        };

        // Send the media message
        handleSendMessage('', messageType, mediaMetadata);

        console.log('Media message sent:', messageType, mediaMetadata);
    }, [currentChat, handleSendMessage]);

    // Helper function to generate message preview for conversation list
    const getMessagePreview = (messageType, content, mediaMetadata) => {
        if (content && content.trim()) {
            return content.trim();
        }

        switch (messageType) {
            case 'IMAGE':
                return '📷 Image';
            case 'VIDEO':
                return '🎬 Video';
            case 'VOICE':
                return '🎵 Voice';
            case 'FILE':
                return `📎 ${mediaMetadata?.fileName || 'File'}`;
            case 'EMOJI':
                return '😀 Emoji';
            default:
                return 'Message';
        }
    };

    const handleIncomingMessage = useCallback((message) => {
        console.log('Incoming message:', message);
        console.log('Current chat:', currentChatRef.current);
        console.log('Current userId:', userIdRef.current);
        console.log('Message senderId:', message.senderId);

        const messageWithStatus = {
            ...message,
            // Ensure all incoming messages have proper status
            status: message.status || 'DELIVERED'
        };

        // Always add to messages if it's for the current chat
        if (currentChatRef.current && message.chatId === currentChatRef.current.chatId) {
            console.log('✅ Adding message to current chat');
            setMessages(prev => {
                const combined = [...prev, messageWithStatus];
                // Sort by timestamp to maintain proper order
                return combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            });

            // Send read receipt immediately if user is viewing this chat and message is from someone else
            if (message.senderId !== userIdRef.current) {
                console.log('✅ Conditions met for sending read receipt:', {
                    isCurrentChat: true,
                    isDifferentSender: true,
                    messageId: message.messageId
                });
                setTimeout(() => {
                    sendReadReceipt(message.chatId, message.messageId);
                }, 100); // Small delay to ensure message is rendered
            } else {
                console.log('❌ Not sending read receipt - message is from current user');
            }
        } else {
            console.log('❌ Not adding to current chat - different chat or no current chat');
        }

        // Update conversation list using functional update to avoid stale closure
        setConversations(prev => {
            const existingConvIndex = prev.findIndex(conv => conv.chatId === message.chatId);
            let updated;

            if (existingConvIndex !== -1) {
                // Update existing conversation
                updated = prev.map((conv, index) => {
                    if (index === existingConvIndex) {
                        return {
                            ...conv,
                            lastMessageContent: message.content,
                            lastMessageTimestamp: message.timestamp,
                            unreadCount: message.chatId === currentChatRef.current?.chatId ? 0 : (conv.unreadCount || 0) + 1,
                            // 清除本地创建标记，因为现在有了真实消息
                            isLocalCreated: undefined
                        };
                    }
                    return conv;
                });
            } else {
                // Create new conversation only if it doesn't exist
                const newConversation = {
                    chatId: message.chatId,
                    otherUserId: message.senderId,
                    otherUserNickname: message.senderId,
                    lastMessageContent: message.content,
                    lastMessageTimestamp: message.timestamp,
                    unreadCount: message.chatId === currentChatRef.current?.chatId ? 0 : 1
                };

                updated = [newConversation, ...prev];
            }

            // Sort by timestamp (newest first)
            return updated.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
        });

        // Note: Removed the fallback for new chat case to avoid messages dependency
        // The conversation list update will handle new conversations
    }, []); // Remove dependencies to prevent frequent re-creation

    const handleMessageAck = useCallback(({ tempMessageId, messageId, chatId }) => {
        console.log('Message acknowledged:', tempMessageId, '->', messageId);

        // Update message status map first - remove temp ID and add real ID
        setMessageStatuses(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempMessageId);
            newMap.set(messageId, 'DELIVERED');
            // Reduced logging: console.log('Updated messageStatuses map:', messageId, 'DELIVERED');
            return newMap;
        });

        // Update message ID in the messages list AND update the message status
        setMessages(prev => {
            const updated = prev.map(msg => {
                if (msg.messageId === tempMessageId) {
                    // Reduced logging: console.log('Updating message:', tempMessageId, '->', messageId, 'status: DELIVERED');
                    return { ...msg, messageId, status: 'DELIVERED' };
                }
                return msg;
            });
            // Ensure messages remain sorted after update
            return updated.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        });

        // Update conversation list if this message was for current chat
        if (currentChatRef.current && chatId === currentChatRef.current.chatId) {
            setConversations(prev => {
                const updated = prev.map(conv =>
                    conv.chatId === chatId
                        ? { ...conv, lastMessageTimestamp: Date.now() }
                        : conv
                );
                // Sort by timestamp (newest first)
                return updated.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
            });
        }
    }, []); // Remove dependencies to prevent frequent re-creation

    const handleMessageTimeout = useCallback(({ tempMessageId }) => {
        console.log('Message timeout:', tempMessageId);
        setMessageStatuses(prev => new Map(prev.set(tempMessageId, 'FAILED')));
    }, []);

    const handleMessageError = useCallback((message) => {
        console.log('Message error:', message);
        if (message.tempMessageId) {
            setMessageStatuses(prev => new Map(prev.set(message.tempMessageId, 'FAILED')));
        }
    }, []);

    const handleReadReceipt = useCallback((message) => {
        console.log('✅ Read receipt received:', message);

        if (message.extraData?.messageId) {
            const messageId = message.extraData.messageId;
            // Reduced logging: console.log('Updating message status to read for:', messageId);

            setMessageStatuses(prev => {
                const newMap = new Map(prev);
                newMap.set(messageId, 'READ'); // 统一大写
                // Reduced logging: console.log('Updated status to read in map for:', messageId);
                return newMap;
            });

            // Also update the message in the messages array
            setMessages(prev => {
                const updated = prev.map(msg =>
                    msg.messageId === messageId
                        ? { ...msg, status: 'READ' } // 统一大写
                        : msg
                );
                // Ensure messages remain sorted after status update
                return updated.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            });

            console.log('✅ Message status updated to read for:', messageId);
        } else {
            console.warn('❌ Read receipt missing messageId in extraData:', message);
        }
    }, []);

    const sendReadReceipt = useCallback(async (chatId, messageId) => {
        if (!messageId || !chatId || !currentChatRef.current) {
            console.warn('Missing data for read receipt:', { chatId, messageId, currentChat: !!currentChatRef.current });
            return;
        }

        try {
            console.log('Sending read receipt for message:', messageId, 'in chat:', chatId);

            // Send WebSocket read receipt with correct format
            const readReceiptMessage = {
                type: 'READ_RECEIPT',
                chatId: chatId,
                content: null,
                receiverId: currentChatRef.current.otherUserId,
                senderId: userIdRef.current,
                messageId: null,
                tempMessageId: null,
                extraData: {
                    messageId: messageId
                },
                timestamp: Date.now()
            };

            // Reduced logging: console.log('READ_RECEIPT message payload:', readReceiptMessage);
            const success = webSocketService.sendMessage(readReceiptMessage);

            if (success) {
                console.log('✅ Read receipt sent successfully via WebSocket');
            } else {
                console.warn('❌ WebSocket read receipt failed, trying API fallback');
                await apiService.markMessagesAsRead(chatId, userIdRef.current, messageId);
                console.log('✅ Read receipt sent via API fallback');
            }
        } catch (error) {
            console.error('❌ Error sending read receipt:', error);
            // Final fallback attempt
            try {
                await apiService.markMessagesAsRead(chatId, userIdRef.current, messageId);
                console.log('✅ Read receipt sent via final API fallback');
            } catch (apiError) {
                console.error('❌ All read receipt attempts failed:', apiError);
            }
        }
    }, []); // Remove dependencies to prevent frequent re-creation

    const handleLoadMoreMessages = () => {
        if (currentChat && hasMoreMessages && !messagesLoading) {
            const currentPage = Math.ceil(messages.length / 30) + 1;
            loadMessages(currentChat.chatId, currentPage, true);
        }
    };

    const generateTempId = () => {
        return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    };



    // 移动端相关回调函数
    const handleMobileAddNewChat = () => {
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
            handleChatSelectWithSidebarControl(existingConv);
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

        handleChatSelectWithSidebarControl(newConversation);
        setNewChatUserId('');
    };

    // 快速开始聊天处理函数
    const handleQuickStartChat = (targetUserId, displayName) => {
        if (!targetUserId || !userId) {
            console.warn('❌ Missing user ID for quick start chat');
            return;
        }

        if (targetUserId === userId) {
            console.warn('❌ Cannot chat with yourself');
            alert('You cannot chat with yourself');
            return;
        }

        // 检查是否已存在该聊天
        const existingConv = conversations.find(conv => conv.otherUserId === targetUserId);
        if (existingConv) {
            console.log('✅ Found existing conversation, selecting it:', existingConv.chatId);
            handleChatSelectWithSidebarControl(existingConv);
            return;
        }

        // 创建新的聊天会话
        const newConversation = {
            chatId: generateChatId(userId, targetUserId),
            otherUserId: targetUserId,
            otherUserNickname: displayName || targetUserId,
            lastMessageContent: '',
            lastMessageTimestamp: Date.now(),
            unreadCount: 0,
            isLocalCreated: true // 标记这是本地创建的conversation
        };

        console.log('🆕 Creating new conversation for quick start:', newConversation.chatId);

        // 添加到对话列表
        setConversations(prev => {
            const updated = [newConversation, ...prev];
            return updated.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
        });

        // 选择新创建的聊天
        handleChatSelectWithSidebarControl(newConversation);

        console.log('✅ Quick start chat completed successfully');
    };

    const handleMobileBackToConversations = () => {
        setMobileView('conversations');
        setCurrentChat(null);
    };

    const generateChatId = (userId1, userId2) => {
        const sortedIds = [userId1, userId2].sort();
        return `chat_${sortedIds[0]}_${sortedIds[1]}`;
    };

    const handleOpenSearch = () => {
        setShowSearch(true);
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
    };

    const handleSearchMessageClick = async (message) => {
        // Close search interface
        setShowSearch(false);

        // Could consider scrolling to specific message position in the future
        // For now, just close the search modal since we're already in the correct chat
        console.log('Clicked on search result message:', message.messageId);
    };

    // Re-register WebSocket handlers only when userId changes
    useEffect(() => {
        if (userId && authService.isAuthenticated()) {
            setupWebSocketHandlers();
        }
    }, [userId]); // Remove other dependencies to prevent frequent re-registration

    // Handle page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && connectionStatus === 'DISCONNECTED') {
                console.log('Page became visible, attempting to reconnect...');
                if (userId && authService.isAuthenticated()) {
                    connectWebSocket();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [userId, connectionStatus]);

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

    // Refresh data after reconnection
    const refreshAfterReconnection = async () => {
        try {
            console.log('🔄 Starting data refresh after reconnection...');

            // Clear all caches to ensure fresh data
            messagesCache.current.clear();

            // Refresh conversations list first
            console.log('🔄 Refreshing conversations list...');
            await loadConversations();

            // Refresh current chat messages if there's an active chat
            if (currentChatRef.current) {
                console.log('🔄 Refreshing current chat messages for:', currentChatRef.current.chatId);
                setMessages([]);
                setHasMoreMessages(true);
                setMessageStatuses(new Map()); // Clear message statuses

                // Reload messages for current chat with force refresh
                await loadMessages(currentChatRef.current.chatId, 1, false, true);

                console.log('✅ Current chat messages refreshed');
            }

            console.log('✅ All data refreshed successfully after reconnection');
        } catch (error) {
            console.error('❌ Error refreshing data after reconnection:', error);

            // Retry after a delay if refresh fails
            setTimeout(() => {
                console.log('🔄 Retrying data refresh...');
                refreshAfterReconnection();
            }, 2000);
        }
    };

    // 如果未认证，显示加载状态（实际会被重定向）
    if (!authService.isAuthenticated()) {
        return <div className="loading">Checking authentication...</div>;
    }

    if (!userId) {
        return <div className="loading">Loading...</div>;
    }

    // 移动端渲染逻辑
    if (isMobile) {
        if (mobileView === 'conversations') {
            return (
                <ConversationListPage
                    userId={userId}
                    conversations={conversations}
                    loading={loading}
                    connectionStatus={connectionStatus}
                    newChatUserId={newChatUserId}
                    setNewChatUserId={setNewChatUserId}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onChatSelect={handleChatSelectWithSidebarControl}
                    onAddNewChat={handleMobileAddNewChat}
                />
            );
        } else if (mobileView === 'chat' && currentChat) {
            return (
                <ChatPage
                    userId={userId}
                    currentChat={currentChat}
                    messages={messages}
                    connectionStatus={connectionStatus}
                    messagesLoading={messagesLoading}
                    hasMoreMessages={hasMoreMessages}
                    messageStatuses={messageStatuses}
                    showSearch={showSearch}
                    onSendMessage={handleSendMessage}
                    onMediaSend={handleMediaSend}
                    onLoadMoreMessages={handleLoadMoreMessages}
                    onOpenSearch={handleOpenSearch}
                    onCloseSearch={handleCloseSearch}
                    onSearchMessageClick={handleSearchMessageClick}
                    onBack={handleMobileBackToConversations}
                />
            );
        }
    }

    // 桌面端渲染逻辑（原有的布局）
    return (
        <div className="chat-container">
            {/* Connection overlay - show when connecting */}
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

            {/* Header */}
            <div className="chat-header">
                <div className="header-left">
                    <h1>Chat</h1>
                    <span className="user-info">User: {userId}</span>
                    {/*{authStatus && authStatus.isExpiringSoon && (*/}
                    {/*    <span className="token-warning">⚠️ Token expiring soon</span>*/}
                    {/*)}*/}
                </div>
                <div className="header-right">
                    <div className="connection-status">
                        <span
                            className="status-indicator"
                            style={{ backgroundColor: getConnectionStatusColor() }}
                        ></span>
                        <span className="status-text">{getConnectionStatusText()}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="chat-content">
                {/* 侧边栏 - 桌面端始终显示 */}
                <div className="sidebar-container">
                    <ChatList
                        conversations={conversations}
                        currentChat={currentChat}
                        onChatSelect={handleChatSelectWithSidebarControl}
                        loading={loading}
                        userId={userId}
                        isMobile={false}
                        isTouch={isTouch}
                    />
                </div>

                {/* 聊天区域 */}
                <div className="main-chat-area">
                    <ChatArea
                        ref={chatAreaRef}
                        currentChat={currentChat}
                        messages={messages}
                        messageStatuses={messageStatuses}
                        messagesLoading={messagesLoading}
                        hasMoreMessages={hasMoreMessages}
                        onSendMessage={handleSendMessage}
                        onMediaSend={handleMediaSend}
                        onLoadMoreMessages={handleLoadMoreMessages}
                        userId={userId}
                        onOpenSearch={handleOpenSearch}
                        isMobile={false}
                        isTouch={isTouch}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                </div>
            </div>

            {/* Message Search Modal */}
            {
                showSearch && currentChat && (
                    <MessageSearch
                        userId={userId}
                        currentChat={currentChat}
                        onClose={handleCloseSearch}
                        onMessageClick={handleSearchMessageClick}
                    />
                )
            }
        </div >
    );
};

export default Chat; 