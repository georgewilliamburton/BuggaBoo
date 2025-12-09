// Onion Skin Feature
// Shows previous frame(s) as semi-transparent overlay for animation reference

let onionSkinEnabled = false;
let onionSkinOpacity = 0.3; // 30% opacity for ghost frames

// Toggle onion skin on/off
function toggleOnionSkin() {
    const button = document.getElementById('onion-skin-toggle');
    
    // Check if we're on first frame or have no frames - don't allow enabling
    if (!onionSkinEnabled && (currentFrame <= 0 || frames.length <= 1)) {
        // Keep it disabled, don't toggle
        button.classList.remove('active');
        return;
    }
    
    onionSkinEnabled = !onionSkinEnabled;
    
    if (onionSkinEnabled) {
        button.classList.add('active');
        showOnionSkin();
    } else {
        button.classList.remove('active');
        hideOnionSkin();
    }
}

// Show the onion skin overlay
function showOnionSkin() {
    if (!canvas || frames.length === 0) {
        hideOnionSkin(); // Clear any existing overlay
        return; // No frames to show
    }
    
    // Determine the previous frame index
    // If currentFrame is beyond frames array (new unsaved frame), show last saved frame
    // Otherwise show the frame before current
    let previousFrameIndex;
    if (currentFrame >= frames.length) {
        // New unsaved frame - show the last saved frame
        previousFrameIndex = frames.length - 1;
    } else if (currentFrame > 0) {
        // Regular case - show previous frame
        previousFrameIndex = currentFrame - 1;
    } else {
        // First frame - no previous frame to show
        hideOnionSkin(); // Clear any existing overlay
        return;
    }
    
    if (previousFrameIndex >= 0 && frames[previousFrameIndex]) {
        const previousFrame = frames[previousFrameIndex];
        
        // Load the previous frame's thumbnail as a background overlay
        fabric.Image.fromURL(previousFrame.thumbnail, function(img) {
            if (!img) {
                console.error('Failed to load onion skin image for frame', previousFrameIndex);
                return;
            }
            
            // Scale image to match canvas size
            img.scaleToWidth(canvas.width);
            img.scaleToHeight(canvas.height);
            
            // Set opacity for ghost effect
            img.set({
                opacity: onionSkinOpacity,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            
            // Use backgroundImage to render BEHIND current objects
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                opacity: onionSkinOpacity
            });
        });
    } else {
        hideOnionSkin(); // No valid previous frame
    }
}

// Hide the onion skin overlay
function hideOnionSkin() {
    if (canvas) {
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        canvas.backgroundColor = '#ffffff'; // Restore white background
        canvas.renderAll();
    }
}

// Update onion skin when frame changes
function updateOnionSkin() {
    if (onionSkinEnabled) {
        showOnionSkin();
    } else {
        hideOnionSkin();
    }
}
