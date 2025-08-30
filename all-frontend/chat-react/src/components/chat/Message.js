import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../../styles/chat/Message.css';

// VoiceMessage component for handling voice message playback
const VoiceMessage = ({ url, duration, fileName, isOwn = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);

    const handlePlayPause = useCallback(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return;

        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration || duration;

        setCurrentTime(current);
        setProgress(total > 0 ? (current / total) * 100 : 0);
    }, [duration]);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setProgress(0);
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        // Handle audio loaded metadata
        if (audioRef.current && !duration) {
            // Get duration from audio element if not provided
            const audioDuration = audioRef.current.duration;
            if (audioDuration) {
                // Could update parent component duration, but currently only used internally
            }
        }
    }, [duration]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [handleTimeUpdate, handleEnded, handleLoadedMetadata]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`media-voice-container ${isOwn ? 'own' : 'other'}`}>
            <div className="voice-player">
                <button
                    className="voice-play-btn"
                    onClick={handlePlayPause}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div className="voice-waveform">
                    <div
                        className="voice-progress"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className="voice-duration">
                    {isPlaying || currentTime > 0
                        ? formatTime(currentTime)
                        : formatTime(duration)
                    }
                </span>
            </div>
            <audio
                ref={audioRef}
                src={url}
                className="voice-audio"
                preload="metadata"
            />
        </div>
    );
};

const Message = ({
    message,
    isOwn,
    showAvatar,
    status,
    userId
}) => {

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Today - show time
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } else if (diffDays === 1) {
            // Yesterday
            return `Yesterday ${date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}`;
        } else {
            // Older - show date and time
            return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return 'Sending ⏳';
            case 'DELIVERED':
            case 'DELIVERED_TO_SERVER':
                return '✓';
            case 'READ':
                return '✓✓';
            case 'FAILED':
                return 'Failed to sent ❌';
            default:
                return '';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING':
                return 'Sending...';
            case 'DELIVERED':
            case 'DELIVERED_TO_SERVER':
                return 'Delivered';
            case 'READ':
                return 'Read';
            case 'FAILED':
                return 'Failed to send';
            default:
                return '';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING':
                return 'status-pending';
            case 'DELIVERED':
            case 'DELIVERED_TO_SERVER':
                return 'status-delivered';
            case 'READ':
                return 'status-read';
            case 'FAILED':
                return 'status-failed';
            default:
                return '';
        }
    };

    const isSystemMessage = message.senderId === 'system';
    const isImageOnlyMessage = message.messageType === 'IMAGE' && (!message.content || message.content.trim() === '');
    const isVoiceOnlyMessage = message.messageType === 'VOICE' && (!message.content || message.content.trim() === '');

    if (isSystemMessage) {
        return (
            <div className="message-container system">
                <div className="system-message">
                    <span className="system-content">{message.content}</span>
                    <span className="system-timestamp">
                        {formatTimestamp(message.timestamp)}
                    </span>
                </div>
            </div>
        );
    }

    // 纯图片消息的特殊布局（无气泡框）
    if (isImageOnlyMessage) {
        return (
            <div className={`message-container ${isOwn ? 'own' : 'other'} image-only`}>
                <div className="message-content">
                    <div className="message-media-standalone">
                        <div className="media-image-container">
                            <img
                                src={message.mediaMetadata.url}
                                alt={message.mediaMetadata.fileName || 'Image'}
                                className="message-image"
                                loading="lazy"
                                onClick={() => openMediaModal(message.mediaMetadata.url, 'image')}
                            />
                        </div>
                    </div>

                    <div className="message-meta">
                        <span className="message-timestamp">
                            {formatTimestamp(message.timestamp)}
                        </span>

                        {isOwn && status && status !== 'UNKNOWN' && (
                            <span
                                className={`message-status ${getStatusClass(status)}`}
                                title={getStatusText(status)}
                            >
                                {getStatusIcon(status)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 纯语音消息的特殊布局（无外层气泡框）
    if (isVoiceOnlyMessage) {
        return (
            <div className={`message-container ${isOwn ? 'own' : 'other'} voice-only`}>
                <div className="message-content">
                    <div className="message-media-standalone">
                        <VoiceMessage
                            url={message.mediaMetadata.url}
                            duration={message.mediaMetadata.duration || 0}
                            fileName={message.mediaMetadata.fileName}
                            isOwn={isOwn}
                        />
                    </div>

                    <div className="message-meta">
                        <span className="message-timestamp">
                            {formatTimestamp(message.timestamp)}
                        </span>

                        {isOwn && status && status !== 'UNKNOWN' && (
                            <span
                                className={`message-status ${getStatusClass(status)}`}
                                title={getStatusText(status)}
                            >
                                {getStatusIcon(status)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 常规消息布局（有气泡框）
    return (
        <div className={`message-container ${isOwn ? 'own' : 'other'}`}>
            <div className="message-content">
                <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                    {message.content && message.content.trim() && (
                        <div className="message-text">
                            {message.content}
                        </div>
                    )}

                    {/* Media content (if any) */}
                    {message.mediaMetadata && (
                        <div className="message-media">
                            {message.messageType === 'IMAGE' && (
                                <div className="media-image-container">
                                    <img
                                        src={message.mediaMetadata.url}
                                        alt={message.mediaMetadata.fileName || 'Image'}
                                        className="message-image"
                                        loading="lazy"
                                        onClick={() => openMediaModal(message.mediaMetadata.url, 'image')}
                                    />
                                    {/* 隐藏图片尺寸显示
                                    {message.mediaMetadata.width && message.mediaMetadata.height && (
                                        <div className="image-dimensions">
                                            {message.mediaMetadata.width} × {message.mediaMetadata.height}
                                        </div>
                                    )}
                                    */}
                                </div>
                            )}

                            {message.messageType === 'VIDEO' && (
                                <div className="media-video-container">
                                    <video
                                        src={message.mediaMetadata.url}
                                        className="message-video"
                                        controls
                                        preload="metadata"
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                    <div className="video-info">
                                        {message.mediaMetadata.duration && (
                                            <span className="video-duration">
                                                {formatDuration(message.mediaMetadata.duration)}
                                            </span>
                                        )}
                                        {message.mediaMetadata.fileName && (
                                            <span className="video-filename">
                                                {message.mediaMetadata.fileName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {message.messageType === 'VOICE' && (
                                <VoiceMessage
                                    url={message.mediaMetadata.url}
                                    duration={message.mediaMetadata.duration || 0}
                                    fileName={message.mediaMetadata.fileName}
                                    isOwn={isOwn}
                                />
                            )}

                            {message.messageType === 'FILE' && (
                                <div className="message-file">
                                    <div className="file-icon">
                                        {getFileIcon(message.mediaMetadata.fileName)}
                                    </div>
                                    <div className="file-info">
                                        <div className="file-name">
                                            {message.mediaMetadata.fileName || 'Unknown file'}
                                        </div>
                                        <div className="file-size">
                                            {formatFileSize(message.mediaMetadata.fileSize)}
                                        </div>
                                    </div>
                                    <a
                                        href={message.mediaMetadata.url}
                                        download={message.mediaMetadata.fileName}
                                        className="file-download-btn"
                                        title="Download file"
                                    >
                                        ⬇️
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="message-meta">
                    <span className="message-timestamp">
                        {formatTimestamp(message.timestamp)}
                    </span>

                    {isOwn && status && status !== 'UNKNOWN' && (
                        <span
                            className={`message-status ${getStatusClass(status)}`}
                            title={getStatusText(status)}
                        >
                            {getStatusIcon(status)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper functions
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDuration = (seconds) => {
    if (!seconds) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getFileIcon = (fileName) => {
    if (!fileName) return '📎';

    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
        case 'pdf':
            return '📄';
        case 'doc':
        case 'docx':
            return '📝';
        case 'xls':
        case 'xlsx':
            return '📊';
        case 'ppt':
        case 'pptx':
            return '📈';
        case 'zip':
        case 'rar':
        case '7z':
            return '🗜️';
        case 'mp3':
        case 'wav':
        case 'flac':
            return '🎵';
        case 'mp4':
        case 'avi':
        case 'mov':
            return '🎬';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return '🖼️';
        case 'txt':
            return '📋';
        default:
            return '📎';
    }
};

const openMediaModal = (url, type) => {
    console.log('Open media modal:', url, type);
    window.open(url, '_blank');
};

export default Message; 