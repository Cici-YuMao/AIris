import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/chat/api';
import '../../styles/chat/Config.css';

const Config = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState({
        serverNode: 'node1',
        userId: '',
        accessToken: '',
        messageServiceUrl: 'http://localhost:9330',
        realtimeServiceUrls: {
            node1: 'ws://localhost:9531',
            node2: 'ws://localhost:9532',
            node3: 'ws://localhost:9533'
        }
    });
    const [connectionStatus, setConnectionStatus] = useState({
        messageService: null,
        realtimeService: null,
        authentication: null,
        testing: false
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = () => {
        try {
            const savedConfig = localStorage.getItem('chatConfig');
            if (savedConfig) {
                setConfig({ ...config, ...JSON.parse(savedConfig) });
            }

            // Load userId from localStorage if exists
            const savedUserId = localStorage.getItem('chatUserId');
            if (savedUserId) {
                setConfig(prev => ({ ...prev, userId: savedUserId }));
            }

            // Load access token from localStorage if exists
            const savedToken = localStorage.getItem('accessToken');
            if (savedToken) {
                setConfig(prev => ({ ...prev, accessToken: savedToken }));
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    };

    const handleConfigChange = (key, value) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const saveConfig = () => {
        try {
            localStorage.setItem('chatConfig', JSON.stringify(config));
            localStorage.setItem('chatUserId', config.userId);
            
            // Save access token separately
            if (config.accessToken) {
                localStorage.setItem('accessToken', config.accessToken);
            } else {
                localStorage.removeItem('accessToken');
            }
            
            alert('Configuration saved successfully!');
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error saving configuration');
        }
    };

    const generateUserId = () => {
        const uuid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        handleConfigChange('userId', uuid);
    };

    const generateSampleToken = () => {
        // Generate a sample JWT token for testing (not a real token)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: config.userId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }));
        const signature = btoa('sample_signature_for_testing');
        const sampleToken = `${header}.${payload}.${signature}`;
        handleConfigChange('accessToken', sampleToken);
    };

    const validateToken = async () => {
        if (!config.accessToken) {
            alert('Please enter an access token first');
            return;
        }

        setConnectionStatus(prev => ({ ...prev, testing: true }));

        try {
            const isValid = await apiService.validateToken(config.accessToken);
            setConnectionStatus(prev => ({
                ...prev,
                authentication: isValid,
                testing: false
            }));

            if (isValid) {
                console.log('Token validation successful');
            } else {
                alert('Token validation failed. Please check your token.');
            }
        } catch (error) {
            console.error('Error validating token:', error);
            setConnectionStatus(prev => ({
                ...prev,
                authentication: false,
                testing: false
            }));
            alert('Token validation failed. Please check your token and connection.');
        }
    };

    const testConnection = async () => {
        setConnectionStatus(prev => ({ ...prev, testing: true }));

        try {
            const results = await apiService.testConnection();
            setConnectionStatus(prev => ({
                ...prev,
                messageService: results.messageService,
                realtimeService: results.realtimeService,
                testing: false
            }));
        } catch (error) {
            console.error('Error testing connection:', error);
            setConnectionStatus(prev => ({
                ...prev,
                messageService: false,
                realtimeService: false,
                testing: false
            }));
        }
    };

    const testAllConnections = async () => {
        setConnectionStatus(prev => ({ ...prev, testing: true }));

        try {
            // Test basic connections
            const connectionResults = await apiService.testConnection();
            
            // Test authentication if token is provided
            let authResult = null;
            if (config.accessToken) {
                authResult = await apiService.validateToken(config.accessToken);
            }

            setConnectionStatus({
                messageService: connectionResults.messageService,
                realtimeService: connectionResults.realtimeService,
                authentication: authResult,
                testing: false
            });
        } catch (error) {
            console.error('Error testing connections:', error);
            setConnectionStatus({
                messageService: false,
                realtimeService: false,
                authentication: false,
                testing: false
            });
        }
    };

    const clearToken = () => {
        handleConfigChange('accessToken', '');
        localStorage.removeItem('accessToken');
        setConnectionStatus(prev => ({ ...prev, authentication: null }));
    };

    const goToChat = () => {
        if (!config.userId.trim()) {
            alert('Please enter a User ID first');
            return;
        }
        
        if (!config.accessToken.trim()) {
            alert('Please enter an access token first');
            return;
        }

        // Save config before navigating
        saveConfig();
        navigate('/chat');
    };

    const getStatusIcon = (status) => {
        if (status === null) return '⚪';
        return status ? '🟢' : '🔴';
    };

    const getStatusText = (status) => {
        if (status === null) return 'Not tested';
        return status ? 'Connected' : 'Failed';
    };

    const isTokenValid = () => {
        if (!config.accessToken) return false;
        try {
            const payload = JSON.parse(atob(config.accessToken.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="config-container">
            <div className="config-header">
                <h1>Chat Application Configuration</h1>
                <p>For developers only</p>
            </div>

            <div className="config-content">
                <div className="config-section">
                    <h2>Authentication Settings</h2>
                    <div className="config-row">
                        <label>Access Token (JWT):</label>
                        <div className="input-group">
                            <input
                                type="text"
                                value={config.accessToken}
                                onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                                placeholder="Enter your JWT access token"
                                className="config-input"
                                style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
                            />
                            <button
                                onClick={generateSampleToken}
                                className="btn btn-secondary"
                                title="Generate a sample token for testing"
                            >
                                Generate Sample
                            </button>
                            <button
                                onClick={clearToken}
                                className="btn btn-secondary"
                                title="Clear the current token"
                            >
                                Clear
                            </button>
                        </div>
                        {config.accessToken && (
                            <div className="token-info">
                                <small>
                                    Token status: {isTokenValid() ? '✅ Valid' : '❌ Invalid/Expired'}
                                </small>
                            </div>
                        )}
                    </div>
                    <div className="config-row">
                        <button
                            onClick={validateToken}
                            disabled={!config.accessToken || connectionStatus.testing}
                            className="btn btn-primary"
                        >
                            {connectionStatus.testing ? 'Validating...' : 'Validate Token'}
                        </button>
                    </div>
                </div>

                <div className="config-section">
                    <h2>User Settings</h2>
                    <div className="config-row">
                        <label>User ID:</label>
                        <div className="input-group">
                            <input
                                type="text"
                                value={config.userId}
                                onChange={(e) => handleConfigChange('userId', e.target.value)}
                                placeholder="Enter your user ID"
                                className="config-input"
                            />
                            <button
                                onClick={generateUserId}
                                className="btn btn-secondary"
                            >
                                Generate ID
                            </button>
                        </div>
                    </div>
                </div>

                <div className="config-section">
                    <h2>Server Configuration</h2>
                    <div className="config-row">
                        <label>Server Node:</label>
                        <select
                            value={config.serverNode}
                            onChange={(e) => handleConfigChange('serverNode', e.target.value)}
                            className="config-select"
                        >
                            <option value="node1">Node 1 (Port 9531)</option>
                            <option value="node2">Node 2 (Port 9532)</option>
                            <option value="node3">Node 3 (Port 9533)</option>
                        </select>
                    </div>

                    <div className="config-row">
                        <label>Message Service URL:</label>
                        <input
                            type="text"
                            value={config.messageServiceUrl}
                            onChange={(e) => handleConfigChange('messageServiceUrl', e.target.value)}
                            className="config-input"
                            readOnly
                        />
                    </div>

                    <div className="config-row">
                        <label>WebSocket URL:</label>
                        <input
                            type="text"
                            value={config.realtimeServiceUrls[config.serverNode]}
                            className="config-input"
                            readOnly
                        />
                    </div>
                </div>

                <div className="config-section">
                    <h2>Connection Status</h2>
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="status-icon">
                                {getStatusIcon(connectionStatus.authentication)}
                            </span>
                            <span className="status-label">Authentication:</span>
                            <span className="status-text">
                                {getStatusText(connectionStatus.authentication)}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="status-icon">
                                {getStatusIcon(connectionStatus.messageService)}
                            </span>
                            <span className="status-label">Message Service:</span>
                            <span className="status-text">
                                {getStatusText(connectionStatus.messageService)}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="status-icon">
                                {getStatusIcon(connectionStatus.realtimeService)}
                            </span>
                            <span className="status-label">Realtime Service:</span>
                            <span className="status-text">
                                {getStatusText(connectionStatus.realtimeService)}
                            </span>
                        </div>
                    </div>

                    <div className="connection-actions">
                        <button
                            onClick={testAllConnections}
                            disabled={connectionStatus.testing}
                            className="btn btn-primary"
                        >
                            {connectionStatus.testing ? 'Testing...' : 'Test All Connections'}
                        </button>
                        <button
                            onClick={testConnection}
                            disabled={connectionStatus.testing}
                            className="btn btn-secondary"
                        >
                            {connectionStatus.testing ? 'Testing...' : 'Test Basic Connection'}
                        </button>
                    </div>
                </div>

                <div className="config-actions">
                    <button
                        onClick={saveConfig}
                        className="btn btn-primary"
                    >
                        Save Configuration
                    </button>
                    <button
                        onClick={goToChat}
                        className="btn btn-success"
                        disabled={!config.userId.trim() || !config.accessToken.trim()}
                    >
                        Go to Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Config; 