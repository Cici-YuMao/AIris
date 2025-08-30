import React, { useState, useRef, useCallback, useEffect } from 'react';
import '../../styles/chat/VoiceRecorder.css';

const VoiceRecorder = ({ onVoiceSelect, maxDuration = 60 }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [hasPermission, setHasPermission] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    // Check microphone permission
    const checkMicrophonePermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasPermission(true);
            stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            setHasPermission(false);
            return false;
        }
    }, []);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            audioStreamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                setRecordedBlob(blob);

                // 停止音频流
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(100); // Collect data every 100ms

            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    // Auto stop recording (reached max duration)
                    if (newTime >= maxDuration) {
                        stopRecording();
                        return maxDuration;
                    }
                    return newTime;
                });
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to access microphone. Please check permissions.');
            setHasPermission(false);
        }
    }, [maxDuration]);

    // 暂停录音
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [isRecording, isPaused]);

    // 恢复录音
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            // 恢复计时
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= maxDuration) {
                        stopRecording();
                        return maxDuration;
                    }
                    return newTime;
                });
            }, 1000);
        }
    }, [isRecording, isPaused, maxDuration]);

    // 停止录音
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            // 停止音频流
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => track.stop());
                audioStreamRef.current = null;
            }
        }
    }, [isRecording]);

    // 播放录音
    const playRecording = useCallback(() => {
        if (recordedBlob && audioRef.current) {
            const url = URL.createObjectURL(recordedBlob);
            audioRef.current.src = url;
            audioRef.current.play();
            setIsPlaying(true);
            setPlaybackTime(0);
        }
    }, [recordedBlob]);

    // 停止播放
    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
            setPlaybackTime(0);
        }
    }, []);

    // Reset recording
    const resetRecording = useCallback(() => {
        stopRecording();
        stopPlayback();
        setRecordedBlob(null);
        setRecordingTime(0);
        setPlaybackTime(0);
    }, [stopRecording, stopPlayback]);

    // Send recording
    const sendRecording = useCallback(() => {
        if (recordedBlob && onVoiceSelect) {
            const fileName = `voice_${Date.now()}.webm`;
            const file = new File([recordedBlob], fileName, { type: 'audio/webm;codecs=opus' });

            onVoiceSelect({
                file: file,
                blob: recordedBlob,
                duration: recordingTime,
                fileName: fileName,
                metadata: {
                    fileName: fileName,
                    fileSize: recordedBlob.size,
                    duration: recordingTime,
                    mimeType: 'audio/webm;codecs=opus'
                }
            });

            // Reset state
            resetRecording();
        }
    }, [recordedBlob, recordingTime, onVoiceSelect, resetRecording]);

    // Format time display
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // 监听音频播放进度
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updatePlaybackTime = () => {
            setPlaybackTime(Math.floor(audio.currentTime));
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setPlaybackTime(0);
        };

        audio.addEventListener('timeupdate', updatePlaybackTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updatePlaybackTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [recordedBlob]);

    // 初始检查麦克风权限
    useEffect(() => {
        checkMicrophonePermission();
    }, [checkMicrophonePermission]);

    // 清理定时器
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return (
        <div className="voice-recorder">
            {/* 直接渲染内容，无.recorder-content包裹层 */}
            {hasPermission === false && (
                <div className="permission-error">
                    <div className="error-icon">🎤</div>
                    <p>Microphone access is required for voice recording</p>
                    <button
                        onClick={checkMicrophonePermission}
                        className="retry-button"
                    >
                        Retry Permission
                    </button>
                </div>
            )}

            {hasPermission === true && (
                <>
                    {/* Recording status display */}
                    <div className="recording-status">
                        {!isRecording && !recordedBlob && (
                            <div className="idle-state">
                                <div className="mic-icon">🎤</div>
                                <p>Tap to start recording</p>
                                <p className="hint">Maximum duration: {formatTime(maxDuration)}</p>
                            </div>
                        )}

                        {isRecording && (
                            <div className="recording-state">
                                <div className={`mic-icon recording ${isPaused ? 'paused' : ''}`}>
                                    🎤
                                </div>
                                <p className="recording-text">
                                    {isPaused ? 'Recording Paused' : 'Recording...'}
                                </p>
                                <div className="recording-time">
                                    {formatTime(recordingTime)} / {formatTime(maxDuration)}
                                </div>
                                <div className="recording-controls">
                                    {!isPaused ? (
                                        <button onClick={pauseRecording} className="control-button pause">
                                            ⏸️ Pause
                                        </button>
                                    ) : (
                                        <button onClick={resumeRecording} className="control-button resume">
                                            ▶️ Resume
                                        </button>
                                    )}
                                    <button onClick={stopRecording} className="control-button stop">
                                        ⏹️ Stop
                                    </button>
                                </div>
                            </div>
                        )}

                        {recordedBlob && (
                            <div className="playback-state">
                                <div className="recorded-info">
                                    <div className="audio-icon">🎵</div>
                                    <div className="audio-details">
                                        <p>Voice message recorded</p>
                                        <p className="duration">Duration: {formatTime(recordingTime)}</p>
                                    </div>
                                </div>

                                <div className="playback-controls">
                                    {!isPlaying ? (
                                        <button onClick={playRecording} className="control-button play">
                                            ▶️ Play
                                        </button>
                                    ) : (
                                        <button onClick={stopPlayback} className="control-button pause">
                                            ⏸️ Stop
                                        </button>
                                    )}
                                    <span className="playback-time">
                                        {formatTime(playbackTime)}
                                    </span>
                                </div>

                                <div className="action-buttons">
                                    <button onClick={resetRecording} className="control-button secondary">
                                        🗑️ Delete
                                    </button>
                                    <button onClick={sendRecording} className="control-button primary">
                                        ➤ Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main record button */}
                    {!isRecording && !recordedBlob && (
                        <div className="main-record-button">
                            <button
                                onClick={startRecording}
                                className="record-button"
                                disabled={hasPermission !== true}
                            >
                                <span className="record-icon">🎤</span>
                                Start Recording
                            </button>
                        </div>
                    )}
                </>
            )}
            {/* Hidden audio element for playback */}
            <audio ref={audioRef} style={{ display: 'none' }} />
        </div>
    );
};

export default VoiceRecorder; 