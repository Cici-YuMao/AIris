import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { GATEWAY_URL } from "../config/api.js";

export default function UploadPage({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [moderationStatus, setModerationStatus] = useState('');
  const { userId } = useUser();

  // 自动隐藏消息和进度条
  useEffect(() => {
    if (showMessages && (result || progress > 0) && !isPolling) {
      const timer = setTimeout(() => {
        setShowMessages(false);
        setResult('');
        setProgress(0);
        setModerationStatus('');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showMessages, result, progress, isPolling]);

  // 轮询AI审核结果
  const pollModerationStatus = async (mediaId) => {
    setIsPolling(true);
    setPollCount(0);

    const poll = async (attempt) => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await axios.get(`${GATEWAY_URL}/media/${mediaId}/moderation`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const status = response.data.moderationStatus;

        setModerationStatus(status);

        if (status === 'APPROVED' || status === 'REJECTED') {
          // 审核完成，刷新页面显示最新状态
          setIsPolling(false);
          if (onUploadSuccess) onUploadSuccess();
          return;
        }

        // 如果还在审核中且未达到最大轮询次数
        if (attempt < 3) {
          setPollCount(attempt + 1);
          setTimeout(() => poll(attempt + 1), 10000); // 10秒后再次轮询
        } else {
          // 达到最大轮询次数，停止轮询
          setIsPolling(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
        if (attempt < 3) {
          setPollCount(attempt + 1);
          setTimeout(() => poll(attempt + 1), 10000);
        } else {
          setIsPolling(false);
        }
      }
    };

    // 开始第一次轮询
    setTimeout(() => poll(1), 10000); // 10秒后开始第一次轮询
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setResult('');
    setProgress(0);
    setShowMessages(true);
    setModerationStatus('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const res = await axios.post(`${GATEWAY_URL}/media/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${accessToken}`
        },
        responseType: 'text',
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
      });

      const mediaId = res.data; // 假设后端返回的是 media ID
      setResult(`✅ Upload successful!`);
      setFile(null);
      
      // 立即刷新页面显示文件列表（此时文件状态为PENDING）
      if (onUploadSuccess) onUploadSuccess();
      
      // 开始轮询AI审核结果来更新状态
      pollModerationStatus(mediaId);
      
    } catch (err) {
      if (err.response) {
        setResult(`❌ Upload failed: ${err.response.status}`);
      } else if (err.request) {
        setResult('❌ No server response');
      } else {
        setResult(`❌ Upload error`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      

      {/* 文件选择区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label
            htmlFor="upload-input"
            style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              backgroundColor: '#add8ff',
              color: '#0b3c5d',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Select File
          </label>

          <input
            id="upload-input"
            type="file"
            accept="image/*"  // 限制只能选择图片
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: 'none' }}
          />

          <input
            type="text"
            value={file ? file.name : 'No file selected'}
            readOnly
            style={{
              flexGrow: 1,
              maxWidth: '350px',
              padding: '0.5rem',
              border: '1.5px solid #ccc',
              borderRadius: '9px',
              backgroundColor: '#fff',
              color: '#666',
              fontSize: '0.9rem',
              minWidth: '0',
              textAlign: 'center'
            }}
          />
        </div>

        <small style={{ color: '#888', marginLeft: '0.2rem', fontSize: '0.95rem' }}>
          Only image files are allowed.
        </small>
      </div>


      {/* Upload 按钮 */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={handleUpload}
          disabled={isUploading || !file}
          style={{
            padding: '0.7rem 1.35rem',
            backgroundColor: isUploading ? '#aaa' : '#add8ff',
            color: '#0b3c5d',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            border: 'none',
            borderRadius: '10px',
            cursor: isUploading ? 'not-allowed' : 'pointer'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* 上传进度条 */}
      {showMessages && progress > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ width: '100%', backgroundColor: '#eee', height: '10px', borderRadius: '5px' }}>
            <div
              style={{
                width: `${progress}%`,
                backgroundColor: '#4caf50',
                height: '10px',
                borderRadius: '5px'
              }}
            ></div>
          </div>
          <p>{progress}%</p>
        </div>
      )}

      {/* 上传提示 */}
      {showMessages && result && (
        <p
          style={{
            marginTop: '1rem',
            color: result.startsWith('✅') ? 'green' : 'red'
          }}
        >
          {result}
        </p>
      )}

      {/* 轮询状态显示 */}
      {showMessages && isPolling && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#f0f8ff',
            border: '1px solid #add8e6',
            borderRadius: '6px',
            fontSize: '0.9rem'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid #add8e6',
              borderTop: '2px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>AI reviewing... (Check {pollCount}/3)</span>
          </div>
        </div>
      )}

      {/* 添加CSS动画 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
