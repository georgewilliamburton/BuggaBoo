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

// Export animation as GIF
function exportAnimation() {
    if (frames.length === 0) {
        showInfoModal('Nothing to Export', '❌ No frames to export! Draw something and save frames first.', '❌');
        return;
    }

    // Save current work
    if (canvas.getObjects().length > 0 || canvas.backgroundImage) {
        saveFrame();
    }

    // Show progress modal (without OK button yet)
    const infoModal = document.getElementById('info-modal');
    const infoTitle = document.getElementById('info-modal-title');
    const infoMessage = document.getElementById('info-modal-message');
    const infoIcon = document.getElementById('info-modal-icon');
    const infoOkBtn = infoModal.querySelector('.modal-btn');
    
    infoTitle.textContent = 'Creating GIF';
    infoMessage.textContent = '⏳ Loading frames...';
    infoIcon.textContent = '🎨';
    infoOkBtn.style.display = 'none'; // Hide OK button during processing
    infoModal.style.display = 'flex';

    // Small delay to ensure modal shows
    setTimeout(() => {
        createAnimatedGIF();
    }, 100);
}

function createAnimatedGIF() {
    try {
        // Get modal elements for progress updates
        const infoMessage = document.getElementById('info-modal-message');
        
        // Create GIF encoder
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: canvas.width,
            height: canvas.height,
            workerScript: 'lib/gif.worker.js'
        });

        let loadedFrames = 0;
        const totalFrames = frames.length;

        // Add each frame to the GIF
        frames.forEach((frame, index) => {
            const img = new Image();
            img.src = frame.thumbnail;
            
            img.onload = function() {
                // Create a temporary canvas to draw the image
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const ctx = tempCanvas.getContext('2d');
                
                // Draw white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Draw the frame
                ctx.drawImage(img, 0, 0);
                
                // Add frame to GIF with delay (200ms = 5 FPS by default)
                gif.addFrame(tempCanvas, {delay: 200, copy: true});
                
                // Increment counter and update progress
                loadedFrames++;
                infoMessage.textContent = `⏳ Loading frames... ${loadedFrames}/${totalFrames}`;
                console.log(`Loaded frame ${loadedFrames}/${totalFrames}`);
                
                // If all frames are loaded, render the GIF
                if (loadedFrames === totalFrames) {
                    infoMessage.textContent = '🎨 Rendering GIF...\nThis may take a few moments.';
                    console.log('All frames loaded, rendering GIF...');
                    renderGIF(gif);
                }
            };
            
            img.onerror = function() {
                console.error(`Failed to load frame ${index}`);
                loadedFrames++;
                infoMessage.textContent = `⏳ Loading frames... ${loadedFrames}/${totalFrames}`;
                
                // Still try to render if this was the last frame
                if (loadedFrames === totalFrames) {
                    infoMessage.textContent = '🎨 Rendering GIF...';
                    renderGIF(gif);
                }
            };
        });

    } catch (error) {
        console.error('Error creating GIF:', error);
        showInfoModal('Export Error', '❌ Could not create GIF. Please try again.', '❌');
    }
}

function renderGIF(gif) {
    const infoMessage = document.getElementById('info-modal-message');
    
    gif.on('progress', function(progress) {
        const percent = Math.round(progress * 100);
        infoMessage.textContent = `🎨 Rendering GIF... ${percent}%`;
        console.log('GIF creation progress:', percent + '%');
    });

    gif.on('finished', function(blob) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `buggaboo-animation-${timestamp}.gif`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message with OK button
        showInfoModal('GIF Created!', `✅ Your animated GIF has been saved!\n📊 ${frames.length} frames at 5 FPS`, '🎉');
    });

    // Start rendering
    gif.render();
}

