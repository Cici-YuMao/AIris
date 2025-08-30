import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ChatPage.css';
import { storage } from '../../utils/storage.js';

function ChatPage() {
  const { userId, displayName } = useParams();
  const navigate = useNavigate();

  const userInfo = storage.getUserInfo();
  const accessToken = storage.getAccessToken();
  const userIdParam = userInfo?.id || userInfo?.userId ||'';
  const accessTokenParam = accessToken || '';
  let iframeSrc = `http://10.144.1.1:3000/chat?userId=${encodeURIComponent(userIdParam)}&accessToken=${encodeURIComponent(accessTokenParam)}`;
  if (userId && displayName) {
    iframeSrc += `&start=${encodeURIComponent(userId)}`;
    iframeSrc += `&displayName=${encodeURIComponent(displayName)}`;
  }

  return (
    <div className="chat-page">
      {/* Iframe Container */}
      <div className="iframe-container">
        <iframe
          src={iframeSrc}
          title="Chat Interface"
          className="chat-iframe"
          frameBorder="0"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="camera *; microphone *"
        />
      </div>
    </div>
  );
}

export default ChatPage;
