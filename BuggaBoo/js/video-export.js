// Video Export System
// Handles exporting animation to video format using MediaRecorder API

let videoExportSettings = {
    fps: 12,
    format: 'webm',
    quality: 0.95,
    width: null,  // Will use canvas dimensions
    height: null
};

// Show video export settings modal
function showVideoExportModal() {
    // Check browser support
    if (!window.MediaRecorder) {
        showInfoModal('Browser Not Supported', 
            '❌ Video export requires a modern browser.\n\nPlease use Chrome, Edge, Firefox, or Opera.', 
            '⚠️');
        return;
    }
    
    const modal = document.getElementById('video-export-modal');
    if (!modal) {
        createVideoExportModal();
    }
    
    // Update form with current settings
    document.getElementById('video-fps').value = videoExportSettings.fps;
    document.getElementById('video-format').value = videoExportSettings.format;
    
    // Show frame count
    document.getElementById('video-frame-count').textContent = frames.length;
    
    // Calculate estimated duration
    const duration = (frames.length / videoExportSettings.fps).toFixed(2);
    document.getElementById('video-duration').textContent = duration;
    
    // Check for audio tracks
    checkAudioAvailability();
    
    document.getElementById('video-export-modal').style.display = 'flex';
}

// Create video export modal HTML
function createVideoExportModal() {
    const modalHTML = `
        <div id="video-export-modal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <h2>📹 Export to Video</h2>
                
                <div class="video-export-form">
                    <div class="form-group">
                        <label for="video-fps">Frame Rate (FPS):</label>
                        <select id="video-fps" onchange="updateVideoDuration()">
                            <option value="6">6 FPS - Slow</option>
                            <option value="12" selected>12 FPS - Standard</option>
                            <option value="15">15 FPS - Anime</option>
                            <option value="24">24 FPS - Film</option>
                            <option value="30">30 FPS - Video</option>
                            <option value="48">48 FPS - High Frame Rate</option>
                            <option value="60">60 FPS - Smooth</option>
                            <option value="120">120 FPS - Ultra Smooth</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="video-format">Format:</label>
                        <select id="video-format">
                            <option value="webm">WebM (Recommended)</option>
                            <option value="webm;codecs=vp9">WebM VP9 (Better Quality)</option>
                        </select>
                    </div>
                    
                    <div class="video-info">
                        <p><strong>Frames:</strong> <span id="video-frame-count">0</span></p>
                        <p><strong>Duration:</strong> <span id="video-duration">0</span> seconds</p>
                        <p><strong>Resolution:</strong> ${canvas ? canvas.width + '×' + canvas.height : 'N/A'}</p>
                    </div>
                    
                    <div class="audio-section" id="video-audio-section">
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="include-audio" onchange="toggleAudioOptions()">
                                Include Audio Tracks
                            </label>
                        </div>
                        <div id="audio-tracks-info" style="display: none;">
                            <p class="audio-info-text">🎵 <span id="audio-track-count">0</span> audio track(s) will be mixed into the video</p>
                        </div>
                    </div>
                    
                    <div class="video-export-actions">
                        <button class="modal-button confirm" onclick="startVideoExport()">
                            🎬 Start Export
                        </button>
                        <button class="modal-button cancel" onclick="closeVideoExportModal()">
                            Cancel
                        </button>
                    </div>
                </div>
                
                <!-- Progress section (hidden initially) -->
                <div id="video-progress-section" style="display: none;">
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div id="video-progress-fill" class="progress-fill"></div>
                        </div>
                        <p id="video-progress-text">Rendering frame 1 of 10...</p>
                    </div>
                    <button class="modal-button cancel" onclick="cancelVideoExport()">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Update duration display when FPS changes
function updateVideoDuration() {
    const fps = parseInt(document.getElementById('video-fps').value);
    const duration = (frames.length / fps).toFixed(2);
    document.getElementById('video-duration').textContent = duration;
}

// Check if audio tracks are available
function checkAudioAvailability() {
    const audioData = localStorage.getItem('buggaboo_audio_data');
    const audioSection = document.getElementById('video-audio-section');
    const includeAudioCheckbox = document.getElementById('include-audio');
    const trackCountSpan = document.getElementById('audio-track-count');
    
    if (audioData) {
        try {
            const audio = JSON.parse(audioData);
            const nonEmptyTracks = audio.tracks ? audio.tracks.filter(t => t.type !== 'empty' && t.audioData) : [];
            
            if (nonEmptyTracks.length > 0) {
                audioSection.style.display = 'block';
                trackCountSpan.textContent = nonEmptyTracks.length;
                includeAudioCheckbox.checked = true;
                toggleAudioOptions();
                return;
            }
        } catch (e) {
            console.error('Error parsing audio data:', e);
        }
    }
    
    // No audio available
    audioSection.style.display = 'none';
}

// Toggle audio options display
function toggleAudioOptions() {
    const includeAudio = document.getElementById('include-audio').checked;
    const audioInfo = document.getElementById('audio-tracks-info');
    audioInfo.style.display = includeAudio ? 'block' : 'none';
}

// Close video export modal
function closeVideoExportModal() {
    document.getElementById('video-export-modal').style.display = 'none';
    // Reset progress section
    document.querySelector('.video-export-form').style.display = 'block';
    document.getElementById('video-progress-section').style.display = 'none';
}

// Start video export process
let videoExportCancelled = false;

async function startVideoExport() {
    if (frames.length === 0) {
        showInfoModal('No Frames', '❌ Please create some frames before exporting to video.', '⚠️');
        return;
    }
    
    // Get settings from form
    videoExportSettings.fps = parseInt(document.getElementById('video-fps').value);
    videoExportSettings.format = document.getElementById('video-format').value;
    videoExportSettings.width = canvas.width;
    videoExportSettings.height = canvas.height;
    
    // Show progress section
    document.querySelector('.video-export-form').style.display = 'none';
    document.getElementById('video-progress-section').style.display = 'block';
    
    videoExportCancelled = false;
    
    // Check if audio should be included
    const includeAudio = document.getElementById('include-audio').checked;
    
    try {
        if (includeAudio) {
            await renderVideoWithAudio();
        } else {
            await renderVideoFromFrames();
        }
    } catch (error) {
        console.error('Video export error:', error);
        showInfoModal('Export Error', '❌ Video export failed: ' + error.message, '⚠️');
        closeVideoExportModal();
    }
}

// Cancel video export
function cancelVideoExport() {
    videoExportCancelled = true;
    closeVideoExportModal();
    showInfoModal('Export Cancelled', 'Video export was cancelled.', 'ℹ️');
}

// Main video rendering function
async function renderVideoFromFrames() {
    const fps = videoExportSettings.fps;
    const frameDuration = 1000 / fps; // milliseconds per frame
    
    // Create a temporary canvas for rendering
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Set up MediaRecorder
    const stream = exportCanvas.captureStream(fps);
    const mimeType = `video/${videoExportSettings.format}`;
    
    // Check if format is supported
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error(`Format ${mimeType} is not supported in this browser`);
    }
    
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps
    });
    
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        if (videoExportCancelled) return;
        
        // Create blob and download
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `buggaboo-animation-${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        closeVideoExportModal();
        
        const fileSize = (blob.size / 1024 / 1024).toFixed(2);
        showInfoModal('Video Created!', 
            `✅ Your animation video has been saved!\n📊 ${frames.length} frames at ${fps} FPS\n💾 File size: ${fileSize} MB`, 
            '🎉');
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Render each frame
    for (let i = 0; i < frames.length; i++) {
        if (videoExportCancelled) {
            mediaRecorder.stop();
            return;
        }
        
        // Update progress
        const progress = ((i + 1) / frames.length) * 100;
        document.getElementById('video-progress-fill').style.width = progress + '%';
        document.getElementById('video-progress-text').textContent = 
            `Rendering frame ${i + 1} of ${frames.length}...`;
        
        // Load and render frame
        await renderFrameToCanvas(exportCtx, frames[i], exportCanvas.width, exportCanvas.height);
        
        // Wait for frame duration
        await new Promise(resolve => setTimeout(resolve, frameDuration));
    }
    
    // Stop recording
    mediaRecorder.stop();
}

// Helper function to render a frame to a canvas context
function renderFrameToCanvas(ctx, frameData, width, height) {
    return new Promise((resolve) => {
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Create temporary fabric canvas for rendering
        const tempCanvas = new fabric.StaticCanvas(null, {
            width: width,
            height: height,
            backgroundColor: '#ffffff'
        });
        
        tempCanvas.loadFromJSON(frameData.json, () => {
            tempCanvas.renderAll();
            
            // Draw to export canvas
            ctx.drawImage(tempCanvas.lowerCanvasEl, 0, 0);
            
            // Clean up
            tempCanvas.dispose();
            
            resolve();
        });
    });
}

// Render video with audio mixing
async function renderVideoWithAudio() {
    const fps = videoExportSettings.fps;
    const frameDuration = 1000 / fps;
    
    // Load audio data
    const audioData = localStorage.getItem('buggaboo_audio_data');
    if (!audioData) {
        throw new Error('No audio data found');
    }
    
    const audio = JSON.parse(audioData);
    const audioTracks = audio.tracks.filter(t => t.type !== 'empty' && t.audioData);
    
    if (audioTracks.length === 0) {
        throw new Error('No audio tracks to export');
    }
    
    // Create temporary canvas for rendering
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Set up video stream
    const videoStream = exportCanvas.captureStream(fps);
    
    // Create audio context and mixer
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioDestination = audioContext.createMediaStreamDestination();
    
    // Load and mix audio tracks
    const audioElements = await Promise.all(
        audioTracks.map(track => loadAudioTrack(track, audioContext, audioDestination))
    );
    
    // Combine video and audio streams
    const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
    ]);
    
    const mimeType = `video/${videoExportSettings.format}`;
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error(`Format ${mimeType} is not supported in this browser`);
    }
    
    const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 5000000,
        audioBitsPerSecond: 128000
    });
    
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        if (videoExportCancelled) {
            // Clean up audio
            audioElements.forEach(el => el.pause());
            audioContext.close();
            return;
        }
        
        // Create blob and download
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `buggaboo-animation-${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Clean up audio
        audioElements.forEach(el => el.pause());
        audioContext.close();
        
        closeVideoExportModal();
        
        const fileSize = (blob.size / 1024 / 1024).toFixed(2);
        showInfoModal('Video Created!', 
            `✅ Your animation video with audio has been saved!\n🎬 ${frames.length} frames at ${fps} FPS\n🎵 ${audioTracks.length} audio track(s)\n💾 File size: ${fileSize} MB`, 
            '🎉');
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Start audio playback in sync
    audioElements.forEach(({ audio, track }) => {
        audio.currentTime = track.startTime || 0;
        audio.play().catch(e => console.error('Audio play error:', e));
    });
    
    // Render each frame
    for (let i = 0; i < frames.length; i++) {
        if (videoExportCancelled) {
            mediaRecorder.stop();
            audioElements.forEach(el => el.pause());
            audioContext.close();
            return;
        }
        
        // Update progress
        const progress = ((i + 1) / frames.length) * 100;
        document.getElementById('video-progress-fill').style.width = progress + '%';
        document.getElementById('video-progress-text').textContent = 
            `Rendering frame ${i + 1} of ${frames.length} with audio...`;
        
        // Load and render frame
        await renderFrameToCanvas(exportCtx, frames[i], exportCanvas.width, exportCanvas.height);
        
        // Wait for frame duration
        await new Promise(resolve => setTimeout(resolve, frameDuration));
    }
    
    // Stop recording
    mediaRecorder.stop();
}

// Load audio track and connect to mixer
async function loadAudioTrack(track, audioContext, destination) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = track.audioData;
        
        audio.addEventListener('canplaythrough', () => {
            try {
                const source = audioContext.createMediaElementSource(audio);
                const gainNode = audioContext.createGain();
                
                // Set volume (0-1 range)
                const volume = (track.volume || 100) / 100;
                gainNode.gain.value = track.muted ? 0 : volume;
                
                // Connect: source -> gain -> destination
                source.connect(gainNode);
                gainNode.connect(destination);
                
                resolve({ source, audio, track });
            } catch (e) {
                console.error('Error creating audio source:', e);
                reject(e);
            }
        }, { once: true });
        
        audio.addEventListener('error', (e) => {
            console.error('Error loading audio track:', e);
            reject(new Error(`Failed to load audio track: ${track.name}`));
        });
        
        audio.load();
    });
}
