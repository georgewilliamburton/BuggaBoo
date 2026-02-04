// Video Decoder Module
// Handles video file frame extraction

// ============================================
// Phase 3: Module Split from media-import.js
// ============================================

/**
 * Extract frames from video at specified FPS
 * @param {string} videoUrl - Blob URL of the video
 * @param {File} file - Original video file
 * @returns {Promise<Array>} Array of frame objects with dataUrl and time
 */
async function extractVideoFrames(videoUrl, file) {
    Logger.debug('VideoDecoder', 'extractVideoFrames starting');
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
            const duration = video.duration;
            const fps = 12; // Default extraction rate
            const frameCount = Math.floor(duration * fps);
            const interval = 1 / fps;
            
            Logger.info('VideoDecoder', 'Video metadata loaded', { 
                duration: duration.toFixed(2), 
                fps, 
                estimatedFrames: frameCount,
                width: video.videoWidth,
                height: video.videoHeight
            });
            
            const frames = [];
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            let extractedCount = 0;
            
            video.onseeked = () => {
                const currentTime = video.currentTime;
                const frameIndex = Math.floor(currentTime / interval);
                
                if (frameIndex < frameCount) {
                    // Set canvas size to video dimensions
                    tempCanvas.width = video.videoWidth;
                    tempCanvas.height = video.videoHeight;
                    
                    // Draw current video frame
                    tempCtx.drawImage(video, 0, 0);
                    
                    // Store frame data
                    frames.push({
                        dataUrl: tempCanvas.toDataURL('image/png'),
                        time: currentTime
                    });
                    
                    extractedCount++;
                    if (extractedCount % 10 === 0) {
                        Logger.debug('VideoDecoder', `Extracted ${extractedCount}/${frameCount} frames`);
                    }
                    
                    // Move to next frame
                    const nextTime = (frameIndex + 1) * interval;
                    if (nextTime < duration) {
                        video.currentTime = nextTime;
                    } else {
                        Logger.success('VideoDecoder', 'Video extraction complete', { totalFrames: frames.length });
                        
                        // Emit event
                        if (window.eventBus) {
                            window.eventBus.emit('media:video:decoded', {
                                frameCount: frames.length,
                                duration: duration
                            });
                        }
                        
                        resolve(frames);
                    }
                } else {
                    Logger.success('VideoDecoder', 'Video extraction complete', { totalFrames: frames.length });
                    
                    // Emit event
                    if (window.eventBus) {
                        window.eventBus.emit('media:video:decoded', {
                            frameCount: frames.length,
                            duration: duration
                        });
                    }
                    
                    resolve(frames);
                }
            };
            
            video.onerror = (error) => {
                Logger.error('VideoDecoder', 'Video error during extraction', error);
                reject(new Error('Failed to extract video frames'));
            };
            
            // Start extraction
            Logger.debug('VideoDecoder', 'Starting video frame extraction');
            video.currentTime = 0;
        };
        
        video.onerror = (error) => {
            Logger.error('VideoDecoder', 'Failed to load video metadata', error);
            reject(new Error('Failed to load video'));
        };
        
        video.src = videoUrl;
    });
}
