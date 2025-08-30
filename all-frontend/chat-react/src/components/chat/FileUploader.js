import React, { useState, useCallback, useRef } from 'react';
import '../../styles/chat/FileUploader.css';
import apiService from '../../services/chat/api';

const FileUploader = ({
    onFileSelect,
    accept = "*/*",
    maxSize = 50 * 1024 * 1024, // 50MB default
    multiple = false,
    children,
    userId,
    receiverId
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const fileInputRef = useRef(null);

    const uploadFileToServer = async (file, fileId) => {
        try {
            const response = await apiService.uploadMedia(
                file,
                userId,
                receiverId,
                (progress) => {
                    setUploadProgress(prev => ({
                        ...prev,
                        [fileId]: { ...prev[fileId], progress, status: 'uploading' }
                    }));
                }
            );

            return response;
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    };

    const handleFileSelect = useCallback((files) => {
        const fileList = Array.from(files);

        // Validate files
        const validFiles = fileList.filter(file => {
            if (file.size > maxSize) {
                alert(`File "${file.name}" exceeds size limit (${formatFileSize(maxSize)})`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            validFiles.forEach(async (file) => {
                const fileId = generateFileId();
                setUploadProgress(prev => ({
                    ...prev,
                    [fileId]: { progress: 0, file, status: 'preparing' }
                }));

                try {
                    // Upload file to server
                    const response = await uploadFileToServer(file, fileId);

                    // Update progress to completed
                    setUploadProgress(prev => ({
                        ...prev,
                        [fileId]: {
                            ...prev[fileId],
                            progress: 100,
                            status: 'completed',
                            url: response.url
                        }
                    }));

                    // Call parent callback with upload result
                    if (onFileSelect) {
                        onFileSelect(file, fileId,
                            (progress) => { }, // Progress callback not needed anymore
                            (success, url) => { }, // Complete callback not needed anymore
                            {
                                url: response.url,
                                fileName: response.fileName,
                                fileSize: response.fileSize,
                                contentType: response.contentType
                            }
                        );
                    }

                    // Clean up completed uploads after 3 seconds
                    setTimeout(() => {
                        setUploadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[fileId];
                            return newProgress;
                        });
                    }, 3000);

                } catch (error) {
                    console.error('File upload failed:', error);
                    setUploadProgress(prev => ({
                        ...prev,
                        [fileId]: {
                            ...prev[fileId],
                            progress: 0,
                            status: 'failed'
                        }
                    }));

                    alert(`Upload failed: ${error.message}`);
                }
            });
        }
    }, [maxSize, onFileSelect, userId, receiverId]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files);
        }
    }, [handleFileSelect]);

    const handleInputChange = useCallback((e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileSelect(files);
        }
        // Reset input to allow selecting the same file again
        e.target.value = '';
    }, [handleFileSelect]);

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="file-uploader">
            <div
                className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                />

                {children || (
                    <div className="upload-content">
                        <div className="upload-icon">📎</div>
                        <p>Click to select files or drag files here</p>
                        <p className="upload-hint">
                            Supported file size: {formatFileSize(maxSize)}
                        </p>
                    </div>
                )}
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="upload-progress-list">
                    {Object.entries(uploadProgress).map(([fileId, info]) => (
                        <div key={fileId} className="upload-progress-item">
                            <div className="file-info">
                                <span className="file-name">{info.file.name}</span>
                                <span className="file-size">{formatFileSize(info.file.size)}</span>
                            </div>
                            <div className="progress-container">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${info.progress}%` }}
                                />
                                <span className="progress-text">
                                    {info.status === 'preparing' && 'Preparing...'}
                                    {info.status === 'uploading' && `${info.progress}%`}
                                    {info.status === 'completed' && '✓ Complete'}
                                    {info.status === 'failed' && '✗ Failed'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper functions
const generateFileId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default FileUploader; 