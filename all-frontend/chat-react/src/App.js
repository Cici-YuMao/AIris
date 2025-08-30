import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Welcome from './components/chat/Welcome';
import Chat from './components/chat/Chat';
import Config from './components/chat/Config';
import './styles/chat/App.css';

// URL参数处理函数
function processUrlParams() {
  const searchParams = new URLSearchParams(window.location.search);
  let hasChanges = false;
  let extracted = {};

  // 处理 userId 参数
  const urlUserId = searchParams.get('userId');
  if (urlUserId) {
    console.log('📝 Processing userId from URL:', urlUserId);
    // 更新 chatConfig
    const existingConfig = localStorage.getItem('chatConfig');
    let configObj = {};
    if (existingConfig) {
      try {
        configObj = JSON.parse(existingConfig);
      } catch (e) {
        console.error('Error parsing existing chatConfig:', e);
        configObj = {};
      }
    }
    configObj.userId = urlUserId;
    localStorage.setItem('chatConfig', JSON.stringify(configObj));
    // 同时更新独立的 chatUserId（向后兼容）
    localStorage.setItem('chatUserId', urlUserId);
    hasChanges = true;
    console.log('✅ userId saved to localStorage');
  }
  // 处理 accessToken 参数
  const urlAccessToken = searchParams.get('accessToken');
  if (urlAccessToken) {
    console.log('🔐 Processing accessToken from URL');
    localStorage.setItem('accessToken', urlAccessToken);
    hasChanges = true;
    console.log('✅ accessToken saved to localStorage');
  }
  // 处理 displayName 参数（新加）
  const urlDisplayName = searchParams.get('displayName');
  if (urlDisplayName) {
    extracted.displayName = urlDisplayName;
    hasChanges = true;
  }
  // 如果有参数被处理，清除URL中的这些参数
  if (hasChanges) {
    const newSearchParams = new URLSearchParams();
    // 保留 start 参数（如果存在）
    const startParam = searchParams.get('start');
    if (startParam) {
      newSearchParams.set('start', startParam);
    }
    // 保留 with 参数（如果存在，作为 start 的别名）
    const withParam = searchParams.get('with');
    if (withParam && !startParam) {
      newSearchParams.set('start', withParam);
    }
    // 保留 displayName 参数（如果存在）
    if (urlDisplayName) {
      newSearchParams.set('displayName', urlDisplayName);
    }
    // 构建新的URL
    const newUrl = window.location.pathname +
      (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
    // 更新URL，不触发页面刷新
    window.history.replaceState({}, '', newUrl);
    console.log('🔄 URL updated, removed userId and accessToken parameters');
  }
  return { hasChanges, ...extracted };
}

// 内部路由组件，处理Web Component的路由逻辑
function InternalRoutes({ initialChatUserId, initialChatDisplayName, disableNavigation }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  const [displayName, setDisplayName] = useState(initialChatDisplayName);

  useEffect(() => {
    setMounted(true);
    // 处理URL参数（只在组件挂载时执行一次）
    if (!urlParamsProcessed) {
      const { hasChanges, displayName: urlDisplayName } = processUrlParams();
      setUrlParamsProcessed(true);
      // 如果处理了userId或accessToken参数，可能需要重新加载页面或刷新状态
      if (hasChanges) {
        console.log('🔄 URL parameters processed, application state updated');
      }
      if (urlDisplayName) setDisplayName(urlDisplayName);
    }
    // 如果设置了初始聊天用户ID，直接跳转到聊天页面
    if (initialChatUserId && location.pathname === '/') {
      let url = `/chat?start=${initialChatUserId}`;
      if (displayName) url += `&displayName=${encodeURIComponent(displayName)}`;
      navigate(url);
    }
  }, [initialChatUserId, location.pathname, navigate, urlParamsProcessed, displayName]);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/chat" element={
        <Chat
          initialChatUserId={initialChatUserId}
          initialChatDisplayName={displayName}
          disableNavigation={disableNavigation}
        />
      } />
      <Route path="/config" element={<Config />} />
    </Routes>
  );
}

function App({
  initialChatUserId,
  initialChatDisplayName,
  disableNavigation = false,
  // Web Component属性会被转换为camelCase
  'initial-chat-user-id': webComponentInitialChatUserId,
  'initial-chat-display-name': webComponentInitialChatDisplayName,
  'disable-navigation': webComponentDisableNavigation
}) {
  // 处理Web Component属性的转换
  const effectiveInitialChatUserId = initialChatUserId || webComponentInitialChatUserId;
  const effectiveInitialChatDisplayName = initialChatDisplayName || webComponentInitialChatDisplayName;
  const effectiveDisableNavigation = disableNavigation || webComponentDisableNavigation === 'true' || webComponentDisableNavigation === true;

  // 检查是否在Web Component环境中运行
  const isWebComponent = typeof window !== 'undefined' && window.customElements && !!effectiveInitialChatUserId;

  // 如果是Web Component且有初始用户ID，直接渲染Chat组件
  if (isWebComponent && effectiveInitialChatUserId) {
    return (
      <div className="chat-app">
        <div className="App">
          <Chat
            initialChatUserId={effectiveInitialChatUserId}
            initialChatDisplayName={effectiveInitialChatDisplayName}
            disableNavigation={effectiveDisableNavigation}
          />
        </div>
      </div>
    );
  }

  // 标准应用模式或Web Component无初始用户ID时，使用完整路由
  return (
    <div className="chat-app">
      <Router>
        <div className="App">
          <InternalRoutes
            initialChatUserId={effectiveInitialChatUserId}
            initialChatDisplayName={effectiveInitialChatDisplayName}
            disableNavigation={effectiveDisableNavigation}
          />
        </div>
      </Router>
    </div>
  );
}

export default App;
