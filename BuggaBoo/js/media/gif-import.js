// GIF Import UI and Execution
// Handles GIF import modal and frame import execution

// ============================================
// Phase 3: Module Split from media-import.js
// ============================================

/**
 * Show GIF import modal with options
 * @param {Array} gifFrames - Array of extracted GIF frames
 */
function showGIFImportModal(gifFrames) {
    Logger.debug('GIFImport', 'Showing GIF import modal', { frameCount: gifFrames.length });
    
    // Verify data is stored
    if (!window._tempGIFImportData) {
        Logger.warn('GIFImport', 'GIF data not in global storage, storing now');
        window._tempGIFImportData = { gifFrames };
    }
    
    const modal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('info-modal-title');
    const modalMessage = document.getElementById('info-modal-message');
    const modalIcon = document.getElementById('info-modal-icon');
    
    if (!modal || !modalTitle || !modalMessage || !modalIcon) {
        Logger.error('GIFImport', 'Modal elements not found');
        alert('Modal not found. Please reload the page.');
        return;
    }
    
    const isAnimated = gifFrames.length > 1;
    
    modalTitle.textContent = 'Import GIF';
    modalIcon.textContent = '🎞️';
    
    // Calculate recommended frame limit (cap at 100 for performance)
    const suggestedMax = gifFrames.length > 100 ? Math.min(gifFrames.length, 70) : gifFrames.length;
    
    // Create custom content for import options
    if (isAnimated) {
        modalMessage.innerHTML = `
            <div style="text-align: left;">
                <p><strong>Animated GIF detected:</strong> ${gifFrames.length} frames</p>
                ${gifFrames.length > 100 ? '<p style="color: #ff9800;"><strong>⚠️ High frame count!</strong> Consider limiting frames for better performance.</p>' : ''}
                <p>Each GIF frame will become an animation frame you can edit!</p>
                <p>Frames will be scaled to canvas size: ${canvas.width}×${canvas.height}</p>
                <br>
                <div style="margin-top: 10px;">
                    <label style="display: block; margin-bottom: 10px;">
                        <strong>Frame Limit:</strong>
                        <span id="gif-limit-display" style="margin-left: 10px; color: #666;">${suggestedMax} frames (sampled)</span>
                    </label>
                    <div style="margin-bottom: 15px;">
                        <input type="range" id="gif-frame-limit" 
                               min="10" 
                               max="${gifFrames.length}" 
                               value="${suggestedMax}" 
                               style="width: 100%;"
                               oninput="updateGifFrameLimit()">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888;">
                            <span>10</span>
                            <span>${gifFrames.length > 100 ? 'Recommended: 30-70 frames' : 'All frames'}</span>
                            <span>${gifFrames.length}</span>
                        </div>
                    </div>
                    <label style="display: block; margin-bottom: 15px;">
                        <strong>Sampling Method:</strong>
                    </label>
                    <div style="margin-bottom: 15px; margin-left: 10px;">
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="radio" name="gif-sampling-mode" value="sampled" checked> 
                            <strong>Smart Sampling</strong> (recommended)
                            <br><span style="margin-left: 24px; font-size: 12px; color: #aaa;">Evenly distribute frames across entire animation</span>
                        </label>
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="radio" name="gif-sampling-mode" value="sequential"> 
                            <strong>Sequential</strong>
                            <br><span style="margin-left: 24px; font-size: 12px; color: #aaa;">Import first N frames only</span>
                        </label>
                    </div>
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="radio" name="gif-import-mode" value="new" checked> <strong>Add all frames to timeline</strong> (recommended)
                        <br><span style="margin-left: 24px; font-size: 12px; color: #aaa;">Play the full GIF animation when you hit play</span>
                    </label>
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="radio" name="gif-import-mode" value="insert"> Insert frames after current position
                        <br><span style="margin-left: 24px; font-size: 12px; color: #aaa;">Insert GIF into middle of your animation</span>
                    </label>
                    <label style="display: block; margin-bottom: 20px;">
                        <input type="radio" name="gif-import-mode" value="first-background"> Use first frame as reference only
                        <br><span style="margin-left: 24px; font-size: 12px; color: #aaa;">Add background image to current frame</span>
                    </label>
                    <script>
                        function updateGifFrameLimit() {
                            const limit = document.getElementById('gif-frame-limit').value;
                            const samplingMode = document.querySelector('input[name="gif-sampling-mode"]:checked')?.value || 'sampled';
                            const displayText = samplingMode === 'sampled' ? limit + ' frames (sampled)' : limit + ' frames (sequential)';
                            document.getElementById('gif-limit-display').textContent = displayText;
                        }
                        
                        // Add listeners to sampling mode radios
                        document.querySelectorAll('input[name="gif-sampling-mode"]').forEach(radio => {
                            radio.addEventListener('change', updateGifFrameLimit);
                        });
                    </script>
                </div>
            </div>
        `;
    } else {
        modalMessage.innerHTML = `
            <div style="text-align: left;">
                <p><strong>Static GIF:</strong> 1 frame</p>
                <p>Frame will be imported at canvas size: ${canvas.width}×${canvas.height}</p>
                <br>
                <div style="margin-top: 10px;">
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="radio" name="gif-import-mode" value="new" checked> Create as new frame
                    </label>
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="radio" name="gif-import-mode" value="replace"> Replace current frame
                    </label>
                    <label style="display: block; margin-bottom: 20px;">
                        <input type="radio" name="gif-import-mode" value="background"> Add as background layer
                    </label>
                </div>
            </div>
        `;
    }
    
    // Update the OK button to execute import
    const okButton = modal.querySelector('.modal-btn');
    if (okButton) {
        // Function to update button text based on selected range
        const updateButtonText = () => {
            if (isAnimated) {
                const limitInput = document.getElementById('gif-frame-limit');
                if (limitInput) {
                    const count = parseInt(limitInput.value) || gifFrames.length;
                    okButton.textContent = `Import ${count} Frame${count !== 1 ? 's' : ''}`;
                } else {
                    okButton.textContent = `Import ${gifFrames.length} Frames`;
                }
            } else {
                okButton.textContent = 'Import GIF Frame';
            }
        };
        
        // Initial button text
        updateButtonText();
        
        // Add listener to update button text when frame limit changes
        if (isAnimated) {
            const limitInput = document.getElementById('gif-frame-limit');
            if (limitInput) limitInput.addEventListener('input', updateButtonText);
        }
        
        // Remove any existing onclick to avoid duplicates
        okButton.onclick = null;
        
        // Store the onclick handler with direct access to gifFrames
        okButton.onclick = () => {
            Logger.info('GIFImport', '🔘 Import button clicked!');
            
            // Use local gifFrames if global data is missing
            if (!window._tempGIFImportData && gifFrames) {
                Logger.warn('GIFImport', 'Global data missing, restoring from local closure');
                window._tempGIFImportData = { gifFrames };
            }
            
            executeGIFImport();
        };
        
        Logger.debug('GIFImport', 'OK button handler attached successfully');
    } else {
        Logger.error('GIFImport', '❌ OK button not found in modal!');
    }
    
    modal.classList.add('show');
    
    // Final verification
    Logger.success('GIFImport', '✅ Modal shown and ready', {
        modalVisible: modal.classList.contains('show'),
        dataStored: !!window._tempGIFImportData,
        frameCount: window._tempGIFImportData?.gifFrames?.length
    });
}

/**
 * Execute GIF import based on user selection
 */
async function executeGIFImport() {
    Logger.info('GIFImport', 'Executing GIF import');
    
    if (!window._tempGIFImportData) {
        Logger.error('GIFImport', 'No GIF data available in window._tempGIFImportData');
        showInfoModal('Error', '⚠️ GIF data not found. Please try importing again.', 'ℹ️');
        return;
    }
    
    const { gifFrames } = window._tempGIFImportData;
    
    if (!gifFrames || !Array.isArray(gifFrames) || gifFrames.length === 0) {
        Logger.error('GIFImport', 'Invalid GIF frames data', { gifFrames });
        showInfoModal('Error', '⚠️ Invalid GIF data. Please try importing again.', 'ℹ️');
        return;
    }
    
    Logger.debug('GIFImport', 'GIF frames validated', { count: gifFrames.length });
    
    const isAnimated = gifFrames.length > 1;
    
    let mode, selectedFrames, samplingMode, frameLimit;
    
    if (isAnimated) {
        mode = document.querySelector('input[name="gif-import-mode"]:checked')?.value || 'new';
        samplingMode = document.querySelector('input[name="gif-sampling-mode"]:checked')?.value || 'sampled';
        frameLimit = parseInt(document.getElementById('gif-frame-limit')?.value || gifFrames.length);
        
        // Apply sampling based on mode
        if (samplingMode === 'sampled') {
            // Smart sampling: evenly distribute frames across the animation
            if (frameLimit >= gifFrames.length) {
                selectedFrames = gifFrames;
            } else {
                selectedFrames = [];
                const step = gifFrames.length / frameLimit;
                for (let i = 0; i < frameLimit; i++) {
                    const index = Math.floor(i * step);
                    selectedFrames.push(gifFrames[index]);
                }
            }
        } else {
            // Sequential: take first N frames
            selectedFrames = gifFrames.slice(0, frameLimit);
        }
        
        if (selectedFrames.length === 0) {
            Logger.warn('GIFImport', 'Invalid frame selection');
            showInfoModal('Invalid Selection', '⚠️ Please select a valid frame range.', 'ℹ️');
            return;
        }
    } else {
        mode = document.querySelector('input[name="gif-import-mode"]:checked')?.value || 'new';
        selectedFrames = gifFrames;
    }
    
    Logger.time('GIF-Execute-Import');
    
    try {
        if (isAnimated && (mode === 'new' || mode === 'insert')) {
            // Import multiple frames
            showInfoModal('Importing', `⏳ Importing ${selectedFrames.length} frames...`, 'ℹ️');
            
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
            
            Logger.success('GIFImport', 'GIF frames imported', { count: selectedFrames.length });
            Logger.timeEnd('GIF-Execute-Import');
            
            // Emit event
            if (window.eventBus) {
                window.eventBus.emit('media:gif:imported', {
                    frameCount: selectedFrames.length,
                    mode: mode
                });
            }
            
            closeInfoModal();
            
        } else if (mode === 'first-background') {
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
            
            Logger.success('GIFImport', 'First GIF frame added as background');
            Logger.timeEnd('GIF-Execute-Import');
            
            closeInfoModal();
            
        } else {
            // Single frame import (static GIF or single frame modes)
            const frameData = selectedFrames[0];
            
            const img = await loadImageFromDataUrl(frameData.dataUrl);
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
            
            if (mode === 'new') {
                const newFrameIndex = frames.length;
                canvas.clear();
                canvas.backgroundColor = '#ffffff';
                canvas.add(fabricImg);
                canvas.renderAll();
                
                frames.push({
                    json: canvas.toJSON(['globalId', 'isGlobalLayer']),
                    thumbnail: canvas.toDataURL('image/png'),
                    lockStates: {},
                    globalExclusions: []
                });
                
                currentFrame = newFrameIndex;
                updateFramesDisplay();
                Logger.success('GIFImport', 'GIF imported as new frame');
                Logger.timeEnd('GIF-Execute-Import');
                
                closeInfoModal();
                
            } else if (mode === 'replace') {
                canvas.clear();
                canvas.backgroundColor = '#ffffff';
                canvas.add(fabricImg);
                canvas.renderAll();
                
                frames[currentFrame] = {
                    json: canvas.toJSON(['globalId', 'isGlobalLayer']),
                    thumbnail: canvas.toDataURL('image/png'),
                    lockStates: frames[currentFrame].lockStates || {},
                    globalExclusions: frames[currentFrame].globalExclusions || []
                };
                
                updateFramesDisplay();
                Logger.success('GIFImport', 'Current frame replaced with GIF');
                Logger.timeEnd('GIF-Execute-Import');
                
                closeInfoModal();
                
            } else if (mode === 'background') {
                canvas.add(fabricImg);
                fabricImg.sendToBack();
                canvas.renderAll();
                Logger.success('GIFImport', 'GIF added as background');
                Logger.timeEnd('GIF-Execute-Import');
                
                closeInfoModal();
            }
        }
        
    } catch (error) {
        Logger.error('GIFImport', 'Failed to execute GIF import', error);
        Logger.timeEnd('GIF-Execute-Import');
        showInfoModal('Import Error', '⚠️ Failed to import GIF.', 'ℹ️');
    } finally {
        // Cleanup
        delete window._tempGIFImportData;
        Logger.debug('GIFImport', 'Cleaned up GIF import data');
    }
}
