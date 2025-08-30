import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 检查是否为Web Component构建模式
if (process.env.REACT_APP_BUILD_TARGET === 'webcomponent') {
  // Web Component模式：导出为自定义元素
  import('react-to-webcomponent').then(({ default: reactToWebComponent }) => {
    const ChatWebComponent = reactToWebComponent(App, React, ReactDOM, {
      props: ['initial-chat-user-id', 'disable-navigation'],
      shadow: false // 不使用Shadow DOM，便于样式继承
    });

    // 注册自定义元素
    if (!customElements.get('airis-chat')) {
      customElements.define('airis-chat', ChatWebComponent);
    }
  });
} else {
  // 标准React应用模式
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
