// Onion Skin Feature
// Shows previous frame(s) as semi-transparent overlay for animation reference

let onionSkinEnabled = false;
let onionSkinOpacity = 0.3; // 30% opacity for ghost frames

// Toggle onion skin on/off
function toggleOnionSkin() {
    onionSkinEnabled = !onionSkinEnabled;
    
    const button = document.getElementById('onion-skin-toggle');
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
    if (!canvas || currentFrame <= 0 || frames.length === 0) {
        return; // No previous frame to show
    }
    
    // Get the previous frame
    const previousFrameIndex = currentFrame - 1;
    if (previousFrameIndex >= 0 && frames[previousFrameIndex]) {
        const previousFrame = frames[previousFrameIndex];
        
        // Load the previous frame's thumbnail as a background overlay
        fabric.Image.fromURL(previousFrame.thumbnail, function(img) {
            // Set opacity for ghost effect
            img.set({
                opacity: onionSkinOpacity,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            
            // Add as overlay (behind all objects but visible)
            canvas.setOverlayImage(img, canvas.renderAll.bind(canvas), {
                opacity: onionSkinOpacity
            });
        });
    }
}

// Hide the onion skin overlay
function hideOnionSkin() {
    if (canvas) {
        canvas.setOverlayImage(null, canvas.renderAll.bind(canvas));
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

// Adjust onion skin opacity (for future settings)
function setOnionSkinOpacity(opacity) {
    onionSkinOpacity = opacity;
    if (onionSkinEnabled) {
        showOnionSkin(); // Refresh with new opacity
    }
}
