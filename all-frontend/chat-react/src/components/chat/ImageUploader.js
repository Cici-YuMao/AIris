import React, { useState, useCallback, useRef } from 'react';
import FileUploader from './FileUploader';
import '../../styles/chat/ImageUploader.css';
import apiService from '../../services/chat/api';

const ImageUploader = ({
    onImageSelect,
    maxSize = 10 * 1024 * 1024, // 10MB for images
    multiple = false,
    showPreview = true,
    userId,
    receiverId
}) => {
    const [imagePreviews, setImagePreviews] = useState([]);
    const canvasRef = useRef(null);

        const uploadImageToServer = async (file, onProgress) => {
        try {
            const response = await apiService.uploadMedia(
                file, 
                userId, 
                receiverId, 
                (progress) => {
                    onProgress(60 + (progress * 0.4)); // 60% to 100%
                }
            );
            
            return response.url;
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    };

    const compressImage = useCallback((file, maxWidth = 1920, quality = 0.8) => {
        return new Promise((resolve) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                const originalWidth = width;
                const originalHeight = height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                // Set canvas size
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    // Create new file with compressed data
                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });

                    // Include dimensions in the resolved data
                    resolve({
                        file: compressedFile,
                        dimensions: {
                            width: Math.round(width),
                            height: Math.round(height),
                            originalWidth: originalWidth,
                            originalHeight: originalHeight
                        }
                    });
                }, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }, []);

    const handleFileSelect = useCallback(async (file, fileId, onProgress, onComplete) => {
        // Validate image type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            onComplete(false);
            return;
        }

        try {
            // Create preview
            const previewUrl = URL.createObjectURL(file);
            const preview = {
                id: fileId,
                url: previewUrl,
                name: file.name,
                size: file.size,
                original: file
            };

            setImagePreviews(prev => [...prev, preview]);
            onProgress(30);

            // Get image dimensions for uncompressed image
            let imageDimensions = null;
            if (file.size <= 2 * 1024 * 1024) {
                // For smaller files, get dimensions directly
                const img = new Image();
                img.src = previewUrl;
                await new Promise((resolve) => {
                    img.onload = () => {
                        imageDimensions = {
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                            originalWidth: img.naturalWidth,
                            originalHeight: img.naturalHeight
                        };
                        resolve();
                    };
                });
            }

            // Compress image if needed
            let processedFile = file;
            if (file.size > 2 * 1024 * 1024) { // Compress if larger than 2MB
                const compressionResult = await compressImage(file);
                processedFile = compressionResult.file;
                imageDimensions = compressionResult.dimensions;
                console.log(`Compressed ${file.name} from ${file.size} to ${processedFile.size} bytes`);
                console.log(`Image dimensions: ${imageDimensions.width}x${imageDimensions.height}`);
            }
            onProgress(60);

            // Upload to media service
            const uploadedUrl = await uploadImageToServer(processedFile, onProgress);

            onProgress(100);
            onComplete(true, uploadedUrl);

            // Call parent callback with processed image info
            if (onImageSelect) {
                onImageSelect({
                    file: processedFile,
                    originalFile: file,
                    url: uploadedUrl,
                    preview: previewUrl,
                    fileId: fileId,
                    metadata: {
                        fileName: file.name,
                        fileSize: processedFile.size,
                        width: imageDimensions ? imageDimensions.width : 0,
                        height: imageDimensions ? imageDimensions.height : 0
                    }
                });
            }

        } catch (error) {
            console.error('Error processing image:', error);
            onComplete(false);
            alert('Image processing failed, please try again');
        }
    }, [compressImage, onImageSelect]);

    const removePreview = useCallback((previewId) => {
        setImagePreviews(prev => {
            const preview = prev.find(p => p.id === previewId);
            if (preview) {
                URL.revokeObjectURL(preview.url);
            }
            return prev.filter(p => p.id !== previewId);
        });
    }, []);

    const clearAllPreviews = useCallback(() => {
        imagePreviews.forEach(preview => {
            URL.revokeObjectURL(preview.url);
        });
        setImagePreviews([]);
    }, [imagePreviews]);

    return (
        <div className="image-uploader">
            <FileUploader
                onFileSelect={handleFileSelect}
                accept="image/*"
                maxSize={maxSize}
                multiple={multiple}
                userId={userId}
                receiverId={receiverId}
            >
                <div className="image-upload-content">
                    <div className="upload-icon">🖼️</div>
                    <p>Click to select images or drag images here</p>
                    <p className="upload-hint">
                        Supports JPG, PNG, GIF formats, max {formatFileSize(maxSize)}
                    </p>
                </div>
            </FileUploader>

            {/* Image Previews */}
            {showPreview && imagePreviews.length > 0 && (
                <div className="image-previews">
                    <div className="preview-header">
                        <span>Image Preview</span>
                        <button
                            onClick={clearAllPreviews}
                            className="clear-button"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="preview-grid">
                        {imagePreviews.map(preview => (
                            <div key={preview.id} className="preview-item">
                                <div className="preview-image-container">
                                    <img
                                        src={preview.url}
                                        alt={preview.name}
                                        className="preview-image"
                                    />
                                    <button
                                        onClick={() => removePreview(preview.id)}
                                        className="remove-preview"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="preview-info">
                                    <span className="preview-name">{preview.name}</span>
                                    <span className="preview-size">{formatFileSize(preview.size)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hidden canvas for image compression */}
            <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
            />
        </div>
    );
};

// Helper function
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default ImageUploader; 