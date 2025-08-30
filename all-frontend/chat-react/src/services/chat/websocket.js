import authService from './auth';

class WebSocketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.heartbeatInterval = null;
        this.heartbeatTimer = null;
        this.lastHeartbeatTime = null;
        this.heartbeatTimeout = 10000; // 10 seconds timeout
        this.messageHandlers = new Map();
        this.connectionHandlers = [];
        this.tempMessageMap = new Map(); // Map temp IDs to real IDs
        this.pendingMessages = new Map(); // Store pending messages
        this.isReconnecting = false; // Flag to track reconnection state
    }

    // Get WebSocket URL based on configuration
    getWebSocketUrl(userId) {
        // Websocket service url
        const token = authService.getAccessToken();
        let url = `ws://10.144.2.1:8088/ws/chat?userId=${userId}`;
        // let url = `ws://10.144.1.1:9531/ws/chat?userId=${userId}`;
        if (token) {
            url += `&token=${encodeURIComponent(token)}`;
        }
        return url;
    }

    // Connect to WebSocket
    connect(userId) {
        if (this.isConnected) {
            console.log('WebSocket already connected');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                const wsUrl = this.getWebSocketUrl(userId);
                console.log('Connecting to WebSocket:', wsUrl);

                this.ws = new WebSocket(wsUrl);
                this.userId = userId;

                this.ws.onopen = () => {
                    console.log('WebSocket connected successfully');
                    this.isConnected = true;
                    const wasReconnecting = this.isReconnecting;
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;
                    this.isReconnecting = false;
                    this.startHeartbeat();
                    this.notifyConnectionHandlers('CONNECTED', { wasReconnecting });
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket connection closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.stopHeartbeat();

                    // Only trigger reconnect if this wasn't a clean disconnect
                    if (event.code !== 1000) {
                        console.log('Unclean disconnect detected, triggering reconnect...');
                        this.isReconnecting = true;
                        this.notifyConnectionHandlers('CONNECTING');
                        this.scheduleReconnect();
                    } else {
                        this.notifyConnectionHandlers('DISCONNECTED');
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnected = false;

                    // Don't reject immediately, let onclose handle the reconnection
                    this.notifyConnectionHandlers('ERROR');
                };

                // Connection timeout
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);

            } catch (error) {
                console.error('Error creating WebSocket connection:', error);
                reject(error);
            }
        });
    }

    // Disconnect WebSocket
    disconnect() {
        if (this.ws) {
            this.isConnected = false;
            this.stopHeartbeat();
            this.ws.close(1000, 'User disconnected');
            this.ws = null;
            this.notifyConnectionHandlers('DISCONNECTED');
        }
    }

    // Send message
    sendMessage(message) {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected, readyState:', this.ws?.readyState);
            return false;
        }

        try {
            // Add temporary ID for message tracking (only for chat messages that don't already have one)
            if (message.type === 'CHAT_MESSAGE') {
                let tempId = message.tempMessageId;
                if (!tempId) {
                    tempId = this.generateTempId();
                    message.tempMessageId = tempId;
                }

                // Store pending message
                this.pendingMessages.set(tempId, message);

                // Set timeout for pending message
                setTimeout(() => {
                    if (this.pendingMessages.has(tempId)) {
                        console.warn('Message timeout:', tempId);
                        this.pendingMessages.delete(tempId);
                        this.notifyMessageHandlers('MESSAGE_TIMEOUT', { tempMessageId: tempId });
                    }
                }, 30000); // 30 second timeout
            }

            // Log read receipt messages for debugging
            if (message.type === 'READ_RECEIPT') {
                console.log('Sending READ_RECEIPT message via WebSocket:', message);
            }

            this.ws.send(JSON.stringify(message));
            console.log('WebSocket message sent successfully:', message.type);
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            // If send fails, mark as disconnected and trigger reconnect
            if (this.isConnected) {
                console.warn('Send failed, marking as disconnected and triggering reconnect');
                this.isConnected = false;
                this.notifyConnectionHandlers('DISCONNECTED');
                this.scheduleReconnect();
            }
            return false;
        }
    }

    // Handle incoming messages
    handleMessage(message) {
        console.log('Received WebSocket message:', message);

        switch (message.type) {
            case 'CONNECTED':
                console.log('Connection established:', message.content);
                break;

            case 'HEARTBEAT_ACK':
                this.handleHeartbeatAck();
                break;

            case 'MESSAGE_ACK':
                this.handleMessageAck(message);
                break;

            case 'CHAT_MESSAGE':
                this.handleChatMessage(message);
                break;

            case 'READ_RECEIPT':
                this.handleReadReceipt(message);
                break;

            case 'ERROR':
                this.handleError(message);
                break;

            case 'SYSTEM_NOTIFICATION':
                console.log('System notification:', message.content);
                break;

            default:
                console.log('Unknown message type:', message.type);
        }

        // Notify message handlers
        this.notifyMessageHandlers(message.type, message);
    }

    // Handle message acknowledgment
    handleMessageAck(message) {
        const tempId = message.tempMessageId;
        const realId = message.messageId;

        if (tempId && realId) {
            console.log('Message ACK received:', tempId, '->', realId);
            this.tempMessageMap.set(tempId, realId);
            this.pendingMessages.delete(tempId);

            // Notify handlers about the message confirmation
            this.notifyMessageHandlers('MESSAGE_ACK', {
                tempMessageId: tempId,
                messageId: realId,
                chatId: message.chatId,
                receiverId: message.receiverId,
                senderId: message.senderId,
                timestamp: message.timestamp
            });
        }
    }

    // Handle incoming chat message
    handleChatMessage(message) {
        console.log('Processing incoming chat message:', message);

        // Auto-send read receipt if configured and it's not our own message
        if (this.shouldSendReadReceipt(message)) {
            // Don't auto-send read receipt here - let the Chat component handle it
            // based on whether the message is for the current chat
            console.log('Message requires read receipt:', message.messageId);
        }
    }

    // Handle read receipt
    handleReadReceipt(message) {
        console.log('Read receipt received:', message);
    }

    // Handle error messages
    handleError(message) {
        console.error('WebSocket error message:', message);

        // If error is related to a specific message, handle it
        if (message.tempMessageId) {
            this.pendingMessages.delete(message.tempMessageId);
            this.notifyMessageHandlers('MESSAGE_ERROR', message);
        }
    }

    // Send read receipt
    sendReadReceipt(originalMessage) {
        const readReceiptMessage = {
            type: 'READ_RECEIPT',
            chatId: originalMessage.chatId,
            receiverId: originalMessage.senderId,
            extraData: {
                messageId: originalMessage.messageId
            },
            timestamp: Date.now()
        };

        this.sendMessage(readReceiptMessage);
    }

    // Check if should send read receipt
    shouldSendReadReceipt(message) {
        // Don't send read receipt for our own messages
        return message.senderId !== this.userId;
    }

    // Start heartbeat
    startHeartbeat() {
        this.stopHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendHeartbeat();
            }
        }, 5000); // Send heartbeat every 5 seconds

        // Start heartbeat timeout checker
        this.heartbeatTimer = setInterval(() => {
            this.checkHeartbeatTimeout();
        }, 1000); // Check every second
    }

    // Stop heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // Send heartbeat
    sendHeartbeat() {
        if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Only set timestamp if not already waiting for ACK
            if (!this.lastHeartbeatTime) {
                this.lastHeartbeatTime = Date.now();
                console.log('📤 Starting heartbeat timeout detection');
            }

            const success = this.sendMessage({
                type: 'HEARTBEAT',
                content: 'ping',
                timestamp: Date.now()
            });

            if (!success) {
                console.warn('Heartbeat send failed, but keeping timeout detection active');
            }
        } else {
            console.warn('Cannot send heartbeat - WebSocket not ready:', {
                isConnected: this.isConnected,
                readyState: this.ws?.readyState
            });
            // Mark as disconnected if WebSocket is not ready
            if (this.isConnected) {
                this.isConnected = false;
                this.notifyConnectionHandlers('DISCONNECTED');
                this.scheduleReconnect();
            }
        }
    }

    // Handle heartbeat ACK
    handleHeartbeatAck() {
        console.log('✅ Heartbeat ACK received, resetting timeout');
        this.lastHeartbeatTime = null; // Reset timeout
    }

    // Check heartbeat timeout
    checkHeartbeatTimeout() {
        if (this.lastHeartbeatTime) {
            const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatTime;

            if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
                console.warn(`❌ Heartbeat timeout detected! No ACK received for ${timeSinceLastHeartbeat}ms (threshold: ${this.heartbeatTimeout}ms)`);
                this.lastHeartbeatTime = null;
                this.isReconnecting = true;

                // Set status to CONNECTING before attempting reconnection
                this.notifyConnectionHandlers('CONNECTING');

                this.disconnect();
                this.scheduleReconnect();
            } else {
                // Log waiting status every 3 seconds (since timeout is now 10s)
                if (Math.floor(timeSinceLastHeartbeat / 3000) > Math.floor((timeSinceLastHeartbeat - 1000) / 3000)) {
                    console.log(`⏳ Waiting for heartbeat ACK... ${Math.floor(timeSinceLastHeartbeat / 1000)}s/${this.heartbeatTimeout / 1000}s`);
                }
            }
        }
    }

    // Schedule reconnection (unlimited attempts)
    scheduleReconnect() {
        this.reconnectAttempts++;
        this.isReconnecting = true;
        console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${this.reconnectDelay}ms`);

        // Ensure CONNECTING state is maintained
        this.notifyConnectionHandlers('CONNECTING');

        setTimeout(() => {
            if (!this.isConnected && this.userId && this.isReconnecting) {
                console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})`);
                this.connect(this.userId).catch(error => {
                    console.error('Reconnection failed:', error);
                    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Exponential backoff, max 30 seconds

                    // Continue trying indefinitely if still should be reconnecting
                    if (this.isReconnecting) {
                        console.log('Continuing reconnection attempts... (unlimited)');
                        this.scheduleReconnect();
                    }
                });
            }
        }, this.reconnectDelay);
    }

    // Generate temporary ID
    generateTempId() {
        return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Add message handler
    addMessageHandler(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }

        // Check if handler already exists to prevent duplicates
        const handlers = this.messageHandlers.get(type);
        if (!handlers.includes(handler)) {
            handlers.push(handler);
        }
    }

    // Remove message handler
    removeMessageHandler(type, handler) {
        if (this.messageHandlers.has(type)) {
            const handlers = this.messageHandlers.get(type);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // Notify message handlers
    notifyMessageHandlers(type, message) {
        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });
        }
    }

    // Add connection handler
    addConnectionHandler(handler) {
        this.connectionHandlers.push(handler);
    }

    // Remove connection handler
    removeConnectionHandler(handler) {
        const index = this.connectionHandlers.indexOf(handler);
        if (index > -1) {
            this.connectionHandlers.splice(index, 1);
        }
    }

    // Notify connection handlers
    notifyConnectionHandlers(status, extra = {}) {
        this.connectionHandlers.forEach(handler => {
            try {
                handler(status, extra);
            } catch (error) {
                console.error('Error in connection handler:', error);
            }
        });
    }

    // Stop reconnection attempts
    stopReconnecting() {
        console.log('Stopping reconnection attempts');
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isReconnecting: this.isReconnecting,
            reconnectAttempts: this.reconnectAttempts,
            userId: this.userId
        };
    }
}

export default new WebSocketService(); 