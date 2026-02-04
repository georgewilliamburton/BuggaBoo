// Video Import UI and Execution
// Handles video import modal and frame import execution

// ============================================
// Phase 3: Module Split from media-import.js
// ============================================

/**
 * Show video import modal with options
 * @param {Array} videoFrames - Array of extracted video frames
 * @param {string} videoUrl - Blob URL of the video
 */
function showVideoImportModal(videoFrames, videoUrl) {
    Logger.debug('VideoImport', 'Showing video import modal');
    const modal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('info-modal-title');
    const modalMessage = document.getElementById('info-modal-message');
    const modalIcon = document.getElementById('info-modal-icon');
    
    if (!modal || !modalTitle || !modalMessage || !modalIcon) {
        Logger.error('VideoImport', 'Modal elements not found');
        URL.revokeObjectURL(videoUrl);
        alert('Modal not found. Please reload the page.');
        return;
    }
    
    modalTitle.textContent = 'Import Video';
    modalIcon.textContent = '🎬';
    
    const totalFrames = videoFrames.length;
    const videoDuration = videoFrames.length > 0 ? videoFrames[videoFrames.length - 1].time.toFixed(2) : 0;
    
    // Store video data globally for the import button
    window._tempVideoImportData = { videoFrames, videoUrl };
    
    // Create custom content for import options
    modalMessage.innerHTML = `
        <div style="text-align: left;">
            <p><strong>Extracted:</strong> ${totalFrames} frames (${videoDuration}s at ~12 FPS)</p>
            <p>Frames will be scaled to canvas size: ${canvas.width}×${canvas.height}</p>
            <br>
            <div style="margin-top: 10px;">
                <label style="display: block; margin-bottom: 10px;">
                    <strong>Import Range:</strong>
                </label>
                <div style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center;">
                    <label style="flex: 1;">
                        From: <input type="number" id="video-import-start" min="1" max="${totalFrames}" value="1" 
                                   style="width: 60px; padding: 3px;">
                    </label>
                    <label style="flex: 1;">
                        To: <input type="number" id="video-import-end" min="1" max="${totalFrames}" value="${Math.min(totalFrames, 24)}" 
                                 style="width: 60px; padding: 3px;">
                    </label>
                </div>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="radio" name="video-import-mode" value="new" checked> Create new frames
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="radio" name="video-import-mode" value="insert"> Insert after current frame
                </label>
                <label style="display: block; margin-bottom: 20px;">
                    <input type="radio" name="video-import-mode" value="background"> Add first frame as background
                </label>
            </div>
        </div>
    `;
    
    // Update the OK button to execute import
    const okButton = modal.querySelector('.modal-btn');
    if (okButton) {
        okButton.textContent = 'Import Video Frames';
        okButton.onclick = () => {
            Logger.debug('VideoImport', 'Video import button clicked');
            executeVideoImport();
        };
    }
    
    modal.classList.add('show');
    Logger.debug('VideoImport', 'Video modal shown');
}

/**
 * Execute video import based on user selection
 */
async function executeVideoImport() {
    Logger.info('VideoImport', 'Executing video import');
    
    if (!window._tempVideoImportData) {
        Logger.error('VideoImport', 'No video data available');
        showInfoModal('Error', '⚠️ Video data not found. Please try importing again.', 'ℹ️');
        return;
    }
    
    const { videoFrames, videoUrl } = window._tempVideoImportData;
    const mode = document.querySelector('input[name="video-import-mode"]:checked')?.value || 'new';
    const startFrame = parseInt(document.getElementById('video-import-start')?.value || '1') - 1;
    const endFrame = parseInt(document.getElementById('video-import-end')?.value || videoFrames.length);
    
    Logger.debug('VideoImport', 'Video import settings', { mode, startFrame, endFrame });
    
    const selectedFrames = videoFrames.slice(startFrame, endFrame);
    
    if (selectedFrames.length === 0) {
        Logger.warn('VideoImport', 'Invalid frame range selected');
        showInfoModal('Invalid Range', '⚠️ Please select a valid frame range.', 'ℹ️');
        return;
    }
    
    try {
        Logger.time('Video-Execute-Import');
        showInfoModal('Importing', `⏳ Importing ${selectedFrames.length} frames...`, 'ℹ️');
        
        if (mode === 'background') {
            // Import first frame as background
            const img = await loadImageFromDataUrl(selectedFrames[0].dataUrl);
            const fabricImg = new fabric.Image(img, {
                left: 0,
                top: 0,
                selectable: true,
                evented: true
            });
            
            const scaleX = canvas.width / fabricImg.width;
            const scaleY = canvas.height / fabricImg.height;
            const scale = Math.min(scaleX, scaleY);
            
            fabricImg.scale(scale);
            fabricImg.center();
            canvas.add(fabricImg);
            fabricImg.sendToBack();
            canvas.renderAll();
            
            Logger.success('VideoImport', 'First frame added as background');
            showInfoModal('Video Imported', '✅ First frame added as background.', '✅');
            
        } else {
            // Import multiple frames
            const startIndex = mode === 'insert' ? currentFrame + 1 : frames.length;
            const newFrames = [];
            
            for (let i = 0; i < selectedFrames.length; i++) {
                const img = await loadImageFromDataUrl(selectedFrames[i].dataUrl);
                
                // Create temporary canvas for this frame
                const tempCanvas = new fabric.Canvas(document.createElement('canvas'));
                tempCanvas.setWidth(canvas.width);
                tempCanvas.setHeight(canvas.height);
                tempCanvas.backgroundColor = '#ffffff';
                
                const fabricImg = new fabric.Image(img, {
                    left: 0,
                    top: 0,
                    selectable: true,
                    evented: true
                });
                
                const scaleX = canvas.width / fabricImg.width;
                const scaleY = canvas.height / fabricImg.height;
                const scale = Math.min(scaleX, scaleY);
                
                fabricImg.scale(scale);
                fabricImg.center();
                
                tempCanvas.add(fabricImg);
                tempCanvas.renderAll();
                
                newFrames.push({
                    json: tempCanvas.toJSON(['globalId', 'isGlobalLayer']),
                    thumbnail: tempCanvas.toDataURL('image/png'),
                    lockStates: {},
                    globalExclusions: []
                });
                
                tempCanvas.dispose();
            }
            
            // Insert frames
            if (mode === 'insert') {
                frames.splice(startIndex, 0, ...newFrames);
            } else {
                frames.push(...newFrames);
            }
            
            currentFrame = startIndex;
            loadFrame(currentFrame);
            updateFramesDisplay();
            
            Logger.success('VideoImport', 'Video import complete', { framesImported: selectedFrames.length });
            Logger.timeEnd('Video-Execute-Import');
            
            // Emit event
            if (window.eventBus) {
                window.eventBus.emit('media:video:imported', {
                    frameCount: selectedFrames.length,
                    mode: mode
                });
            }
            
            showInfoModal('Video Imported', `✅ Imported ${selectedFrames.length} frames.`, '✅');
        }
        
    } catch (error) {
        Logger.error('VideoImport', 'Failed to execute video import', error);
        Logger.timeEnd('Video-Execute-Import');
        showInfoModal('Import Error', '⚠️ Failed to import video frames.', 'ℹ️');
    } finally {
        // Cleanup
        URL.revokeObjectURL(videoUrl);
        delete window._tempVideoImportData;
        Logger.debug('VideoImport', 'Cleaned up video import data');
    }
}
