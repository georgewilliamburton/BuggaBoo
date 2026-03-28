// Frame Management
// Handles creating, saving, loading, and exporting frames

// ============================================
// Phase 2: Architecture Integration
// ============================================

// Internal state (private)
let _frames = [];
let _currentFrame = -1;
let globalIdCounter = 1; // Counter for generating unique global IDs
let _selectedFrames = new Set(); // Track multi-selected frames

// Get services from global scope (initialized in init.js)
function getEventBus() {
    return window.eventBus;
}

function getStateManager() {
    return window.stateManager;
}

function getCanvasAdapter() {
    try {
        return window.serviceContainer ? window.serviceContainer.get('canvas') : null;
    } catch (e) {
        return null;
    }
}

// Backwards-compatible getters/setters that sync with StateManager
Object.defineProperty(window, 'frames', {
    get: function() { return _frames; },
    set: function(value) {
        _frames = value;
        if (getStateManager()) {
            getStateManager().set('frames.count', value.length, true);
        }
    }
});

Object.defineProperty(window, 'currentFrame', {
    get: function() { return _currentFrame; },
    set: function(value) {
        const oldFrame = _currentFrame;
        _currentFrame = value;
        if (getStateManager()) {
            getStateManager().set('animation.currentFrame', value, true);
        }
        if (getEventBus() && oldFrame !== value) {
            getEventBus().emit('frame:changed', { 
                oldFrame: oldFrame, 
                newFrame: value,
                totalFrames: _frames.length
            });
        }
    }
});

Object.defineProperty(window, 'selectedFrames', {
    get: function() { return _selectedFrames; },
    set: function(value) {
        _selectedFrames = value;
        if (getStateManager()) {
            getStateManager().set('frames.selected', Array.from(value), true);
        }
    }
});

// Initialize frames state
window.frames = [];
window.currentFrame = -1;
window.selectedFrames = new Set();

// Generate a unique global ID
function generateGlobalId() {
    return `global_${Date.now()}_${globalIdCounter++}`;
}

// Get the global layer data for an object by index
function getObjectGlobalData(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    if (!obj) return null;
    
    return {
        globalId: obj.globalId || null,
        isGlobalLayer: obj.isGlobalLayer || false
    };
}

// Check if the current frame is excluded for a global object
function isFrameExcludedForGlobal(globalId, frameIndex) {
    if (frameIndex < 0 || frameIndex >= frames.length) return false;
    const frame = frames[frameIndex];
    if (!frame.globalExclusions) return false;
    return frame.globalExclusions.includes(globalId);
}

// Add current frame to exclusion list for a global object
function excludeFrameFromGlobal(globalId) {
    if (currentFrame < 0 || currentFrame >= frames.length) return;
    const frame = frames[currentFrame];
    if (!frame.globalExclusions) {
        frame.globalExclusions = [];
    }
    if (!frame.globalExclusions.includes(globalId)) {
        frame.globalExclusions.push(globalId);
    }
}

// Update just the preview canvas (called during drawing)
function updatePreview() {
    const previewCanvas = document.getElementById('preview-canvas');
    if (previewCanvas && canvas) {
        const previewCtx = previewCanvas.getContext('2d');
        const scale = Math.min(90 / canvas.width, 90 / canvas.height);
        const scaledWidth = canvas.width * scale;
        const scaledHeight = canvas.height * scale;
        const offsetX = (90 - scaledWidth) / 2;
        const offsetY = (90 - scaledHeight) / 2;
        
        previewCtx.fillStyle = '#ffffff';
        previewCtx.fillRect(0, 0, 90, 90);
        previewCtx.drawImage(canvas.getElement(), offsetX, offsetY, scaledWidth, scaledHeight);
    }
}

// Save current canvas as a frame (with JSON and thumbnail)
function saveFrame() {
    // Force canvas to render before capturing thumbnail
    canvas.renderAll();
    
    // Capture lock states and global layer data
    const lockStates = {};
    canvas.getObjects().forEach((obj, index) => {
        if (obj.selectable === false) {
            lockStates[index] = true;
        }
    });
    
    const frameData = {
        json: canvas.toJSON(['globalId', 'isGlobalLayer']), // Include global properties
        thumbnail: canvas.toDataURL('image/jpeg', 0.7), // JPEG at 70% quality saves memory
        lockStates: lockStates,
        globalExclusions: [] // Track which global objects are excluded from this frame
    };
    
    // Preserve existing global exclusions if frame already exists
    if (currentFrame >= 0 && currentFrame < frames.length && frames[currentFrame].globalExclusions) {
        frameData.globalExclusions = frames[currentFrame].globalExclusions;
    }
    
    const isNewFrame = !(currentFrame >= 0 && currentFrame < frames.length);
    
    if (currentFrame >= 0 && currentFrame < frames.length) {
        // Update existing frame
        frames[currentFrame] = frameData;
        if (getEventBus()) {
            getEventBus().emit('frame:updated', { 
                frameIndex: currentFrame,
                frameCount: frames.length
            });
        }
    } else {
        // Add new frame
        frames.push(frameData);
        currentFrame = frames.length - 1;
        if (getEventBus()) {
            getEventBus().emit('frame:added', { 
                frameIndex: currentFrame,
                frameCount: frames.length
            });
        }
    }
    
    updateFramesDisplay();
}

// Add new frame
function addNewFrame() {
    // Save current work if canvas has content
    const objects = canvas.getObjects();
    if (objects.length > 0 || canvas.backgroundImage) {
        saveFrame();
    }

    // Preserve global layers (locked layers that appear on all frames)
    const globalLayers = objects.filter(obj => obj.isGlobalLayer === true);
    
    // Clear canvas for new frame
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    
    // Re-add global layers to the new frame
    globalLayers.forEach(obj => {
        canvas.add(obj);
    });
    
    currentFrame = frames.length;
    
    if (getEventBus()) {
        getEventBus().emit('frame:created', { 
            frameIndex: currentFrame,
            frameCount: frames.length,
            hasGlobalLayers: globalLayers.length > 0
        });
    }
    
    // Update onion skin for the new frame (after clear settles)
    setTimeout(() => {
        updateOnionSkin();
        canvas.renderAll();
    }, 0);
    
    // Update the display to show the new blank frame
    updateFramesDisplay();
}

// Helper function to load frame from JSON (preserves individual objects)
function loadFrameFromJSON(frameData, callback) {
    canvas.loadFromJSON(frameData.json, function() {
        // Reapply lock states if they exist
        if (frameData.lockStates) {
            canvas.getObjects().forEach((obj, index) => {
                if (frameData.lockStates[index]) {
                    obj.selectable = false;
                    obj.evented = false;
                    obj.hasControls = false;
                    obj.hasBorders = false;
                    obj.lockMovementX = true;
                    obj.lockMovementY = true;
                    obj.lockRotation = true;
                    obj.lockScalingX = true;
                    obj.lockScalingY = true;
                }
            });
        }
        
        canvas.renderAll();
        
        // Update layers panel if open to show lock states
        if (document.getElementById('layers-panel').classList.contains('open')) {
            updateLayersList();
        }
        
        // Wait a tick for canvas to fully render, then update onion skin
        requestAnimationFrame(() => {
            updateOnionSkin(); // Refresh onion skin for the new frame
            if (callback) callback();
        });
    });
}

// Update frames display
function updateFramesDisplay() {
    const container = document.getElementById('frames-container');
    
    // Keep the add button, clear other frames
    const addBtn = container.querySelector('.add-frame-btn');
    container.innerHTML = '';

    frames.forEach((frame, index) => {
        const frameDiv = document.createElement('div');
        frameDiv.className = 'frame' + (index === currentFrame ? ' active' : '') + (selectedFrames.has(index) ? ' selected' : '');
        frameDiv.onclick = (e) => handleFrameClick(index, e);

        const img = document.createElement('img');
        if (frame.thumbnail) img.src = frame.thumbnail;

        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = index + 1;

        // Selection checkbox
        const checkbox = document.createElement('div');
        checkbox.className = 'frame-checkbox';
        checkbox.innerHTML = selectedFrames.has(index) ? '✓' : '';
        checkbox.onclick = (e) => {
            e.stopPropagation();
            toggleFrameSelection(index);
        };

        // Action buttons for each frame
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'frame-actions';

        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'frame-btn duplicate';
        duplicateBtn.innerHTML = '📋';
        duplicateBtn.title = 'Duplicate Frame';
        duplicateBtn.onclick = (e) => {
            e.stopPropagation();
            duplicateFrame(index);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'frame-btn delete';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete Frame';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (selectedFrames.size > 0 && selectedFrames.has(index)) {
                deleteSelectedFrames();
            } else {
                deleteFrame(index);
            }
        };

        actionsDiv.appendChild(duplicateBtn);
        actionsDiv.appendChild(deleteBtn);

        frameDiv.appendChild(checkbox);
        frameDiv.appendChild(img);
        frameDiv.appendChild(frameNumber);
        frameDiv.appendChild(actionsDiv);
        container.appendChild(frameDiv);
    });

    // Add current frame preview (always show what's on canvas)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'current-frame-preview';

    // Preview frame
    const previewFrame = document.createElement('div');
    previewFrame.className = 'preview-frame';

    // Create a preview canvas instead of an image
    const previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'preview-canvas';
    previewCanvas.width = 90;
    previewCanvas.height = 90;
    
    // Draw the main canvas onto the preview canvas (scaled down)
    const previewCtx = previewCanvas.getContext('2d');
    const scale = Math.min(90 / canvas.width, 90 / canvas.height);
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const offsetX = (90 - scaledWidth) / 2;
    const offsetY = (90 - scaledHeight) / 2;
    
    previewCtx.fillStyle = '#ffffff';
    previewCtx.fillRect(0, 0, 90, 90);
    previewCtx.drawImage(canvas.getElement(), offsetX, offsetY, scaledWidth, scaledHeight);

    const previewNumber = document.createElement('div');
    previewNumber.className = 'frame-number';
    // Show the frame number this will become when saved (next frame number)
    previewNumber.textContent = frames.length + 1;

    previewFrame.appendChild(previewCanvas);
    previewFrame.appendChild(previewNumber);

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'preview-actions';

    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'preview-btn duplicate';
    duplicateBtn.innerHTML = '📋';
    duplicateBtn.title = 'Duplicate Frame';
    duplicateBtn.onclick = (e) => {
        e.stopPropagation();
        duplicateCurrentFrame();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'preview-btn delete';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete Frame';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteCurrentFrame();
    };

    actionsDiv.appendChild(deleteBtn);
    actionsDiv.appendChild(duplicateBtn);

    previewContainer.appendChild(previewFrame);
    previewContainer.appendChild(actionsDiv);
    container.appendChild(previewContainer);

    // Re-add the add button at the end
    if (addBtn) {
        container.appendChild(addBtn);
    }

    // Scroll only enough to keep the active frame in view — don't force-jump to the end
    const framesStrip = container.parentElement;
    const activeEl = container.querySelector('.frame.active');
    if (activeEl) {
        const stripLeft  = framesStrip.scrollLeft;
        const stripRight = stripLeft + framesStrip.clientWidth;
        const frameLeft  = activeEl.offsetLeft;
        const frameRight = frameLeft + activeEl.offsetWidth;
        if (frameRight > stripRight) {
            framesStrip.scrollLeft = frameRight - framesStrip.clientWidth + 8;
        } else if (frameLeft < stripLeft) {
            framesStrip.scrollLeft = frameLeft - 8;
        }
    } else {
        // No active frame yet (e.g. first load) — scroll to end to show the + button
        framesStrip.scrollLeft = framesStrip.scrollWidth;
    }
}

// Duplicate current frame
function duplicateCurrentFrame() {
    // Force canvas to render before capturing current state
    canvas.renderAll();
    
    // Capture lock states before duplicating
    const lockStates = {};
    canvas.getObjects().forEach((obj, index) => {
        if (obj.selectable === false) {
            lockStates[index] = true;
        }
    });
    
    // IMPORTANT: If we're on an existing frame, save it first to the frames array
    // This ensures the frames array is up to date before we duplicate
    if (currentFrame >= 0 && currentFrame < frames.length) {
        frames[currentFrame] = {
            json: canvas.toJSON(['globalId', 'isGlobalLayer']),
            thumbnail: canvas.toDataURL('image/jpeg', 0.7),
            lockStates: lockStates,
            globalExclusions: frames[currentFrame].globalExclusions || []
        };
    }
    
    // Save current canvas state as the new duplicated frame (with JSON and thumbnail)
    const frameData = {
        json: canvas.toJSON(['globalId', 'isGlobalLayer']),
        thumbnail: canvas.toDataURL('image/jpeg', 0.7),
        lockStates: lockStates,  // Preserve lock states in duplicate
        globalExclusions: [] // New frame starts with no exclusions
    };
    
    // Add it as a new frame (don't overwrite the existing one)
    frames.push(frameData);
    
    // Move to the new duplicated frame
    currentFrame = frames.length - 1;
    
    // Load the duplicated frame from JSON (preserves individual objects and lock states)
    loadFrameFromJSON(frameData, updateFramesDisplay);
}

// Delete current frame
function deleteCurrentFrame() {
    if (frames.length === 0) return;
    
    showDeleteModal(currentFrame + 1, () => {
        frames.splice(currentFrame, 1);
        
        // Adjust current frame index
        if (frames.length === 0) {
            currentFrame = -1;
            canvas.clear();
            canvas.backgroundColor = '#ffffff';
            canvas.renderAll();
        } else {
            if (currentFrame >= frames.length) {
                currentFrame = frames.length - 1;
            }
            
            // Load the new current frame from JSON
            if (currentFrame >= 0) {
                loadFrameFromJSON(frames[currentFrame], updateFramesDisplay);
            }
        }
        
        updateFramesDisplay();
    });
}

// Delete a specific frame by index
function deleteFrame(index) {
    if (index < 0 || index >= frames.length) return;
    
    showDeleteModal(index + 1, () => {
        frames.splice(index, 1);
        
        if (getEventBus()) {
            getEventBus().emit('frame:deleted', { 
                frameIndex: index,
                frameCount: frames.length
            });
        }
        
        // Adjust current frame index if needed
        if (frames.length === 0) {
            currentFrame = -1;
            canvas.clear();
            canvas.backgroundColor = '#ffffff';
            canvas.renderAll();
        } else {
            // If we deleted a frame before the current one, adjust index
            if (index < currentFrame) {
                currentFrame--;
            } 
            // If we deleted the current frame, load the same index (which is now the next frame)
            else if (index === currentFrame) {
                if (currentFrame >= frames.length) {
                    currentFrame = frames.length - 1;
                }
                if (currentFrame >= 0) {
                    loadFrameFromJSON(frames[currentFrame]);
                }
            }
            // If we deleted after current frame, no need to change anything
        }
        
        updateFramesDisplay();
    });
}

// Duplicate a specific frame by index
function duplicateFrame(index) {
    if (index < 0 || index >= frames.length) return;
    
    const frameToDuplicate = frames[index];
    
    // Create a deep copy of the frame
    const duplicatedFrame = {
        json: JSON.parse(JSON.stringify(frameToDuplicate.json)),
        thumbnail: frameToDuplicate.thumbnail,
        lockStates: JSON.parse(JSON.stringify(frameToDuplicate.lockStates || {})),
        globalExclusions: []
    };
    
    // Insert the duplicate right after the original
    frames.splice(index + 1, 0, duplicatedFrame);
    
    if (getEventBus()) {
        getEventBus().emit('frame:duplicated', { 
            originalIndex: index,
            newIndex: index + 1,
            frameCount: frames.length
        });
    }
    
    // Move to the duplicated frame
    currentFrame = index + 1;
    loadFrameFromJSON(duplicatedFrame, updateFramesDisplay);
}

// Handle frame click with multi-select support
function handleFrameClick(index, event) {
    if (event.ctrlKey || event.metaKey) {
        // Ctrl+Click: Toggle selection
        toggleFrameSelection(index);
    } else if (event.shiftKey && selectedFrames.size > 0) {
        // Shift+Click: Select range
        const indices = Array.from(selectedFrames);
        const lastSelected = Math.max(...indices);
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        
        selectedFrames.clear();
        for (let i = start; i <= end; i++) {
            selectedFrames.add(i);
        }
        updateFramesDisplay();
    } else {
        // Normal click: Load frame and clear selection
        selectedFrames.clear();
        loadFrame(index);
    }
}

// Toggle selection of a single frame
function toggleFrameSelection(index) {
    if (selectedFrames.has(index)) {
        selectedFrames.delete(index);
    } else {
        selectedFrames.add(index);
    }
    
    if (getEventBus()) {
        getEventBus().emit('frame:selection:changed', { 
            selectedFrames: Array.from(selectedFrames),
            selectedCount: selectedFrames.size
        });
    }
    
    updateFramesDisplay();
}

// Delete all selected frames
function deleteSelectedFrames() {
    if (selectedFrames.size === 0) return;
    
    const count = selectedFrames.size;
    const frameNumbers = Array.from(selectedFrames).sort((a, b) => a - b).map(i => i + 1).join(', ');
    
    showDeleteModal(`frames ${frameNumbers}`, () => {
        // Convert to array and sort in reverse order to delete from end to start
        const indicesToDelete = Array.from(selectedFrames).sort((a, b) => b - a);
        
        indicesToDelete.forEach(index => {
            frames.splice(index, 1);
        });
        
        if (getEventBus()) {
            getEventBus().emit('frames:bulk:deleted', { 
                deletedCount: count,
                frameCount: frames.length
            });
        }
        
        selectedFrames.clear();
        
        // Adjust current frame
        if (frames.length === 0) {
            currentFrame = -1;
            canvas.clear();
            canvas.backgroundColor = '#ffffff';
            canvas.renderAll();
        } else {
            // Move to a valid frame
            if (currentFrame >= frames.length) {
                currentFrame = frames.length - 1;
            }
            if (currentFrame >= 0) {
                loadFrameFromJSON(frames[currentFrame]);
            }
        }
        
        updateFramesDisplay();
    });
}

// Load a specific frame
function loadFrame(index, isAutoPlayback = false) {
    if (index >= 0 && index < frames.length) {
        // Stop playback if playing (user is manually selecting frames)
        // But don't stop if this is an automatic playback frame change
        if (!isAutoPlayback && typeof stopPlaybackIfPlaying === 'function') {
            stopPlaybackIfPlaying();
        }
        
        // Save current frame first (but not during playback)
        // Always save if we're on a valid frame, regardless of whether it has objects
        if (!isAutoPlayback && currentFrame >= 0 && currentFrame < frames.length) {
            // Force canvas to render before capturing thumbnail
            canvas.renderAll();
            
            // Capture lock states
            const lockStates = {};
            canvas.getObjects().forEach((obj, index) => {
                if (obj.selectable === false) {
                    lockStates[index] = true;
                }
            });
            
            const frameData = {
                json: canvas.toJSON(['globalId', 'isGlobalLayer']),
                thumbnail: canvas.toDataURL('image/jpeg', 0.7),
                lockStates: lockStates,
                globalExclusions: frames[currentFrame].globalExclusions || []
            };
            frames[currentFrame] = frameData;
        }

        // Load selected frame from JSON (preserves individual objects)
        currentFrame = index;
        
        if (getEventBus()) {
            getEventBus().emit('frame:loading', { 
                frameIndex: index,
                frameCount: frames.length
            });
        }
        
        loadFrameFromJSON(frames[index], () => {
            if (getEventBus()) {
                getEventBus().emit('frame:loaded', { 
                    frameIndex: index,
                    frameCount: frames.length
                });
            }
            updateFramesDisplay();
        });
    }
}

// Export animation as video using MediaRecorder
function exportAnimation() {
    if (frames.length === 0) {
        showInfoModal('Nothing to Export', '❌ No frames to export! Draw something and save frames first.', '❌');
        return;
    }

    // Save current work
    if (canvas.getObjects().length > 0 || canvas.backgroundImage) {
        saveFrame();
    }

    // Get the playback speed (default to 5 FPS if not set)
    const speed = typeof playbackSpeed !== 'undefined' ? playbackSpeed : 5;

    // Show info modal
    showInfoModal('Creating Video', 
        `🎬 Recording your animation at ${speed} FPS...\n\nThis will take ${Math.ceil(frames.length / speed)} seconds.`, 
        '🎥');
    
    // Small delay to ensure modal shows, then start recording
    setTimeout(() => {
        recordAnimation(speed);
    }, 1000);
}

function recordAnimation(speed) {
    // Close the modal so it doesn't appear in the recording
    document.getElementById('info-modal').style.display = 'none';
    
    // Get the canvas stream
    const stream = canvas.getElement().captureStream(speed);
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
    });
    
    const chunks = [];
    
    mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    
    mediaRecorder.onstop = function() {
        // Create blob and download
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `buggaboo-animation-${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showInfoModal('Video Created!', 
            `✅ Your animation video has been saved!\n📊 ${frames.length} frames at ${speed} FPS`, 
            '🎉');
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Play through the animation once
    let recordFrameIndex = 0;
    const recordInterval = setInterval(() => {
        if (recordFrameIndex >= frames.length) {
            clearInterval(recordInterval);
            mediaRecorder.stop();
            return;
        }
        
        // Load and display the frame
        loadFrameFromJSON(frames[recordFrameIndex], () => {});
        recordFrameIndex++;
    }, 1000 / speed);
}

// Regenerate thumbnails for all frames (used after loading project)
function regenerateAllThumbnails() {
    if (frames.length === 0) return;
    
    const originalFrame = currentFrame;
    let regeneratedCount = 0;
    
    // Process each frame
    frames.forEach((frame, index) => {
        // Skip if thumbnail already exists
        if (frame.thumbnail && frame.thumbnail !== null) {
            return;
        }
        
        // Load frame temporarily to generate thumbnail
        canvas.loadFromJSON(frame.json, function() {
            canvas.renderAll();
            // Generate thumbnail at reduced quality to save memory
            frame.thumbnail = canvas.toDataURL('image/jpeg', 0.7);
            regeneratedCount++;
            
            // After processing all frames, restore original frame
            if (regeneratedCount + frames.filter(f => f.thumbnail).length >= frames.length) {
                if (originalFrame >= 0 && originalFrame < frames.length) {
                    loadFrame(originalFrame);
                }
                updateFramesDisplay();
            }
        });
    });
}

