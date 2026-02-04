// Animation Playback System
// Play through frames with adjustable speed

// ============================================
// Phase 2: Architecture Integration
// ============================================

let isPlaying = false;
let playbackInterval = null;
let playbackSpeed = 12; // frames per second (FPS)
let currentPlaybackFrame = 0;

// Get services
function getEventBus() {
    return window.eventBus;
}

function getStateManager() {
    return window.stateManager;
}

// Toggle playback on/off
function togglePlayback() {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
}

// Start playing animation
function startPlayback() {
    if (frames.length === 0) {
        alert('No frames to play! Create some frames first.');
        return;
    }
    
    isPlaying = true;
    
    // Update state manager
    if (getStateManager()) {
        getStateManager().set('animation.playing', true, true);
    }
    
    // Emit event
    if (getEventBus()) {
        getEventBus().emit('playback:started', {
            fps: playbackSpeed,
            frameCount: frames.length
        });
    }
    
    // Update button appearance
    const playBtn = document.getElementById('play-btn');
    playBtn.textContent = '⏸️';
    playBtn.classList.add('playing');
    playBtn.title = 'Pause Animation';
    
    // Start from beginning if at end
    if (currentFrame >= frames.length - 1) {
        currentPlaybackFrame = 0;
    } else {
        currentPlaybackFrame = currentFrame;
    }
    
    // Calculate interval based on FPS
    const intervalMs = 1000 / playbackSpeed;
    
    // Play frames in sequence
    playbackInterval = setInterval(() => {
        // Load the current playback frame (pass true to indicate it's auto-playback)
        loadFrame(currentPlaybackFrame, true);
        
        // Move to next frame
        currentPlaybackFrame++;
        
        // Stop at end or loop
        if (currentPlaybackFrame >= frames.length) {
            currentPlaybackFrame = 0; // Loop back to start
            // Optionally: stopPlayback(); // Stop at end instead of loop
        }
    }, intervalMs);
}

// Stop playing animation
function stopPlayback() {
    isPlaying = false;
    
    // Update state manager
    if (getStateManager()) {
        getStateManager().set('animation.playing', false, true);
    }
    
    // Emit event
    if (getEventBus()) {
        getEventBus().emit('playback:stopped', {
            currentFrame: currentPlaybackFrame
        });
    }
    
    // Clear interval
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
    
    // Update button appearance
    const playBtn = document.getElementById('play-btn');
    playBtn.textContent = '▶️';
    playBtn.classList.remove('playing');
    playBtn.title = 'Play Animation';
}

// Update playback speed from slider
function updatePlaybackSpeed(value) {
    playbackSpeed = parseInt(value);
    
    // Update state manager
    if (getStateManager()) {
        getStateManager().set('animation.fps', playbackSpeed, true);
    }
    
    // Emit event
    if (getEventBus()) {
        getEventBus().emit('playback:speed:changed', {
            fps: playbackSpeed
        });
    }
    
    // Update display
    document.getElementById('speed-value').textContent = playbackSpeed + ' FPS';
    
    // If playing, restart with new speed
    if (isPlaying) {
        stopPlayback();
        startPlayback();
    }
}

// Stop playback when switching to draw mode (so user can edit)
function stopPlaybackIfPlaying() {
    if (isPlaying) {
        stopPlayback();
    }
}
