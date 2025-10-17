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

// Save current canvas as a frame
function saveFrame() {
    const dataURL = canvas.toDataURL('image/png');
    
    if (currentFrame >= 0 && currentFrame < frames.length) {
        // Update existing frame
        frames[currentFrame] = dataURL;
    } else {
        // Add new frame
        frames.push(dataURL);
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
    canvas.renderAll();
    
    currentFrame = frames.length;
}

// Helper function to load frame as editable image
function loadFrameAsEditableImage(imageDataUrl, callback) {
    fabric.Image.fromURL(imageDataUrl, function(img) {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        
        // Center the image and make it selectable
        img.set({
            left: 0,
            top: 0,
            selectable: true,
            evented: true
        });
        
        canvas.add(img);
        canvas.renderAll();
        
        if (callback) callback();
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
        img.src = frame;

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
    // Save current canvas state as the new duplicated frame
    const currentCanvasData = canvas.toDataURL('image/png');
    
    // Add it as a new frame (don't overwrite the existing one)
    frames.push(currentCanvasData);
    
    // Move to the new duplicated frame
    currentFrame = frames.length - 1;
    
    // Load the duplicated frame as an editable image (so user can select/modify it)
    loadFrameAsEditableImage(currentCanvasData, updateFramesDisplay);
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
            
            // Load the new current frame as editable
            if (currentFrame >= 0) {
                loadFrameAsEditableImage(frames[currentFrame], updateFramesDisplay);
            }
        }
        
        updateFramesDisplay();
    });
}

// Load a specific frame
function loadFrame(index) {
    if (index >= 0 && index < frames.length) {
        // Save current frame first if it has changes
        if (currentFrame >= 0 && canvas.getObjects().length > 0) {
            const dataURL = canvas.toDataURL('image/png');
            frames[currentFrame] = dataURL;
        }

        // Load selected frame as editable image
        currentFrame = index;
        loadFrameAsEditableImage(frames[index], updateFramesDisplay);
    }
}

// Export animation
function exportAnimation() {
    if (frames.length === 0) {
        alert('No frames to export! Draw something and click "Save Frame" first.');
        return;
    }

    // Save current work
    if (canvas.getObjects().length > 0 || canvas.backgroundImage) {
        saveFrame();
    }

    const message = `Exporting ${frames.length} frame${frames.length > 1 ? 's' : ''}...\n\nFrames will download as PNG images.\nUse ezgif.com or similar to create a GIF!`;
    
    if (!confirm(message)) return;

    frames.forEach((frame, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `frame-${String(index + 1).padStart(3, '0')}.png`;
            link.href = frame;
            link.click();
        }, index * 100);
    });
}
