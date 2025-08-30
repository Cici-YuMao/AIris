import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { GATEWAY_URL } from './config/api.js';

const useWebSocket = () => {
    const [stompClient, setStompClient] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const socket = new SockJS('${GATEWAY_URL}/ws');
        const stomp = Stomp.over(socket);

        stomp.connect({}, () => {
            console.log('✅ WebSocket连接成功');
            stomp.subscribe('/topic/public', (message) => {
                const msg = JSON.parse(message.body);
                console.log('📩 收到消息:', msg.content);
                setMessages(prev => [msg.content, ...prev]);
            });
        }, (error) => {
            console.error('❌ WebSocket连接失败:', error);
        });

        setStompClient(stomp);

       return () => {
            if (stomp && stomp.connected) {
                stomp.disconnect(() => {
                    console.log('🛑 WebSocket已断开');
                });
            }
        };
    }, []);

    const sendMessage = (content) => {
        if (stompClient && stompClient.connected) {
            stompClient.send('/app/sendMessage', {}, JSON.stringify({ content }));
        } else {
            console.log('客户端未连接');
        }
    };

    return { sendMessage, messages };
};

export default useWebSocket;
