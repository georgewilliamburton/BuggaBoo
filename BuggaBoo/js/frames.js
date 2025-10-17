// Frame Management
// Handles creating, saving, loading, and exporting frames

let frames = [];
let currentFrame = -1;

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
    
    const frameData = {
        json: canvas.toJSON(),                    // Fabric.js objects (for editing)
        thumbnail: canvas.toDataURL('image/png')  // PNG image (for display)
    };
    
    if (currentFrame >= 0 && currentFrame < frames.length) {
        // Update existing frame
        frames[currentFrame] = frameData;
    } else {
        // Add new frame
        frames.push(frameData);
        currentFrame = frames.length - 1;
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

    // Clear canvas for new frame
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    
    currentFrame = frames.length;
    
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
        canvas.renderAll();
        
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
        frameDiv.className = 'frame' + (index === currentFrame ? ' active' : '');
        frameDiv.onclick = () => loadFrame(index);

        const img = document.createElement('img');
        img.src = frame.thumbnail;  // Use thumbnail for display

        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = index + 1;

        frameDiv.appendChild(img);
        frameDiv.appendChild(frameNumber);
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

    // TODO: Button display order - change the order of these two lines to swap button positions
    actionsDiv.appendChild(deleteBtn);
    actionsDiv.appendChild(duplicateBtn);

    previewContainer.appendChild(previewFrame);
    previewContainer.appendChild(actionsDiv);
    container.appendChild(previewContainer);

    // Re-add the add button at the end
    if (addBtn) {
        container.appendChild(addBtn);
    }

    // Auto-scroll to show the newest frame and add button
    const framesStrip = container.parentElement;
    framesStrip.scrollLeft = framesStrip.scrollWidth;
}

// Duplicate current frame
function duplicateCurrentFrame() {
    // Force canvas to render before capturing current state
    canvas.renderAll();
    
    // IMPORTANT: If we're on an existing frame, save it first to the frames array
    // This ensures the frames array is up to date before we duplicate
    if (currentFrame >= 0 && currentFrame < frames.length) {
        frames[currentFrame] = {
            json: canvas.toJSON(),
            thumbnail: canvas.toDataURL('image/png')
        };
    }
    
    // Save current canvas state as the new duplicated frame (with JSON and thumbnail)
    const frameData = {
        json: canvas.toJSON(),
        thumbnail: canvas.toDataURL('image/png')
    };
    
    // Add it as a new frame (don't overwrite the existing one)
    frames.push(frameData);
    
    // Move to the new duplicated frame
    currentFrame = frames.length - 1;
    
    // Load the duplicated frame from JSON (preserves individual objects)
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
            
            const frameData = {
                json: canvas.toJSON(),
                thumbnail: canvas.toDataURL('image/png')
            };
            frames[currentFrame] = frameData;
        }

        // Load selected frame from JSON (preserves individual objects)
        currentFrame = index;
        loadFrameFromJSON(frames[index], updateFramesDisplay);
    }
}

// Export animation as GIF using canvas-to-blob approach
function exportAnimation() {
    if (frames.length === 0) {
        showInfoModal('Nothing to Export', '❌ No frames to export! Draw something and save frames first.', '❌');
        return;
    }

    // Save current work
    if (canvas.getObjects().length > 0 || canvas.backgroundImage) {
        saveFrame();
    }

    // For now, let's create a simple multi-frame export
    // Since GIF encoding is complex without workers, we'll create a sprite sheet or individual PNGs
    showInfoModal('Export Animation', 
        `📦 Your animation has ${frames.length} frames.\n\nChoose export type:\n\n🎬 Download as ZIP of PNG frames\n🖼️ Download as sprite sheet`, 
        '📤');
    
    // For simplicity, let's just export as a sprite sheet for now
    setTimeout(() => {
        createSpriteSheet();
    }, 500);
}

function createSpriteSheet() {
    // Create a sprite sheet with all frames in a row
    const frameWidth = canvas.width;
    const frameHeight = canvas.height;
    const totalFrames = frames.length;
    
    // Create a canvas that fits all frames horizontally
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = frameWidth * totalFrames;
    spriteCanvas.height = frameHeight;
    const ctx = spriteCanvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, spriteCanvas.width, spriteCanvas.height);
    
    // Draw each frame
    let loadedCount = 0;
    frames.forEach((frame, index) => {
        const img = new Image();
        img.src = frame.thumbnail;
        
        img.onload = function() {
            ctx.drawImage(img, frameWidth * index, 0, frameWidth, frameHeight);
            loadedCount++;
            
            // When all frames are drawn, export
            if (loadedCount === totalFrames) {
                spriteCanvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    a.download = `buggaboo-spritesheet-${timestamp}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showInfoModal('Sprite Sheet Created!', 
                        `✅ Your animation has been saved as a sprite sheet!\n📊 ${frames.length} frames (${frameWidth}×${frameHeight} each)`, 
                        '🎉');
                }, 'image/png');
            }
        };
    });
}

