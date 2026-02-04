// Media Import Controller
// Main entry points for GIF and video import workflows

// ============================================
// Phase 3: Module Split from media-import.js
// Coordinates decoders and UI modules
// ============================================

/**
 * Import GIF file and extract frames
 * Entry point for GIF import workflow
 */
async function importGIF() {
    Logger.info('MediaImport', 'importGIF called');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/gif';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        Logger.info('MediaImport', 'File selected:', { name: file?.name, size: file?.size, type: file?.type });
        if (!file) return;
        
        // Validate it's actually a GIF
        if (!file.type.match(/image\/gif/i)) {
            Logger.warn('MediaImport', 'Not a GIF file:', file.type);
            showInfoModal('Invalid File', '⚠️ Please select a GIF file (.gif)', 'ℹ️');
            return;
        }
        
        Logger.info('MediaImport', 'Starting GIF processing...');
        Logger.time('GIF-Import');
        showInfoModal('Processing GIF', '⏳ Extracting frames from GIF...', 'ℹ️');
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            Logger.debug('MediaImport', 'ArrayBuffer loaded:', { bytes: arrayBuffer.byteLength });
            
            // Use GIF decoder module
            const gifFrames = await extractGIFFrames(arrayBuffer);
            Logger.success('MediaImport', 'Frames extracted:', gifFrames.length);
            Logger.timeEnd('GIF-Import');
            
            if (gifFrames.length === 0) {
                Logger.warn('MediaImport', 'No frames extracted from GIF');
                showInfoModal('No Frames', '⚠️ Could not extract frames from GIF.', 'ℹ️');
                return;
            }
            
            // Store GIF data globally FIRST
            window._tempGIFImportData = { gifFrames };
            Logger.success('MediaImport', 'GIF data stored globally', { 
                frameCount: gifFrames.length,
                verified: !!window._tempGIFImportData
            });
            
            // Show import modal directly (will replace processing modal content)
            showGIFImportModal(gifFrames);
            
        } catch (error) {
            Logger.error('MediaImport', 'Failed to import GIF', error);
            Logger.timeEnd('GIF-Import');
            showInfoModal('Import Error', `⚠️ Failed to import GIF file.\\n\\nError: ${error.message}\\n\\nTip: Try a different GIF file or use Import Video instead.`, 'ℹ️');
        }
    };
    
    input.click();
}

/**
 * Import video file and extract frames
 * Entry point for video import workflow
 */
async function importVideo() {
    Logger.info('MediaImport', 'importVideo called');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/webm,video/ogg';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        Logger.info('MediaImport', 'Video file selected:', { name: file?.name, size: file?.size, type: file?.type });
        if (!file) return;
        
        Logger.time('Video-Import');
        showInfoModal('Processing Video', '⏳ Loading video...', 'ℹ️');
        
        try {
            const videoUrl = URL.createObjectURL(file);
            Logger.debug('MediaImport', 'Video URL created');
            
            // Use video decoder module
            const videoFrames = await extractVideoFrames(videoUrl, file);
            Logger.success('MediaImport', 'Video frames extracted:', videoFrames.length);
            Logger.timeEnd('Video-Import');
            
            if (videoFrames.length === 0) {
                Logger.warn('MediaImport', 'No frames extracted from video');
                showInfoModal('No Frames', '⚠️ Could not extract frames from video.', 'ℹ️');
                URL.revokeObjectURL(videoUrl);
                return;
            }
            
            // Show import modal to let user choose options
            showVideoImportModal(videoFrames, videoUrl);
            
        } catch (error) {
            Logger.error('MediaImport', 'Failed to import video', error);
            Logger.timeEnd('Video-Import');
            showInfoModal('Import Error', `⚠️ Failed to import video file.\\n\\nError: ${error.message}`, 'ℹ️');
        }
    };
    
    input.click();
}

/**
 * Helper: Load image from data URL
 * @param {string} dataUrl - Data URL of the image
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}
