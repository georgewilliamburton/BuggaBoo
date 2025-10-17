// Animation Playback System
// Play through frames with adjustable speed

let isPlaying = false;
let playbackInterval = null;
let playbackSpeed = 5; // frames per second (FPS)
let currentPlaybackFrame = 0;

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
        // Load the current playback frame
        loadFrame(currentPlaybackFrame);
        
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
