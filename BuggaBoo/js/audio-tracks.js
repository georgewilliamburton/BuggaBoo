// Audio Track System
// Multi-track audio panel that syncs playback with the animation timeline.
// Supports: import from file, drag-and-drop, microphone recording.
// Clips are draggable on the timeline to set their start offset (in seconds).

let audioTracks = [];
let _activeAudioElements = []; // { audio: HTMLAudioElement, trackId }
let _audioContext = null;
let _mediaRecorder = null;
let _recordingChunks = [];
let _recordingTrackId = null;
let _isRecording = false;
let _audioPanelOpen = true;
let _colorIndex = 0;

const TRACK_COLORS = [
    '#31A2F2', '#E06F8B', '#4ECDC4', '#A3CE27',
    '#f39c12', '#9b59b6', '#e74c3c', '#2ecc71'
];

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function _audioCtx() {
    if (!_audioContext) {
        _audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _audioContext;
}

function _newTrackId() {
    return 'trk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function _nextColor() {
    return TRACK_COLORS[(_colorIndex++) % TRACK_COLORS.length];
}

function _animDuration() {
    const fps = (typeof playbackSpeed !== 'undefined' ? playbackSpeed : 12) || 12;
    const count = (typeof frames !== 'undefined' ? frames.length : 0) || 1;
    return count / fps;
}

function _escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _dataURLtoArrayBuffer(dataURL) {
    const base64 = dataURL.split(',')[1];
    const binary = atob(base64);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return buf.buffer;
}

function _extractWaveform(audioBuffer, samples) {
    const ch = audioBuffer.getChannelData(0);
    const block = Math.floor(ch.length / samples);
    const out = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        let peak = 0;
        for (let j = 0; j < block; j++) {
            const v = Math.abs(ch[i * block + j] || 0);
            if (v > peak) peak = v;
        }
        out[i] = peak;
    }
    return out;
}

// Get duration via Audio element — works for every format the browser can play
function _getAudioDuration(dataURL) {
    return new Promise(resolve => {
        const tmp = new Audio(dataURL);
        tmp.addEventListener('loadedmetadata', () => resolve(tmp.duration || 0), { once: true });
        tmp.addEventListener('error', () => resolve(0), { once: true });
        tmp.load();
    });
}

// Decode waveform via Web Audio API (best-effort — may fail for some formats)
async function _decodeWaveform(audioData) {
    try {
        const ctx = _audioCtx();
        // Resume suspended context (required after page load in some browsers)
        if (ctx.state === 'suspended') await ctx.resume();
        const buf = _dataURLtoArrayBuffer(audioData);
        const decoded = await ctx.decodeAudioData(buf);
        return _extractWaveform(decoded, 300);
    } catch (e) {
        console.warn('[AudioTracks] Waveform decode failed (audio will still play):', e);
        return null;
    }
}

// ─────────────────────────────────────────
// Track Management
// ─────────────────────────────────────────

function addEmptyAudioTrack() {
    const track = {
        id: _newTrackId(),
        name: 'Track ' + (audioTracks.length + 1),
        color: _nextColor(),
        muted: false,
        volume: 1.0,
        audioData: null,
        mimeType: 'audio/mpeg',
        startOffset: 0,
        duration: 0,
        waveformData: null
    };
    audioTracks.push(track);
    _renderTracks();
    _renderRuler();
    return track;
}

function deleteAudioTrack(trackId) {
    audioTracks = audioTracks.filter(t => t.id !== trackId);
    _renderTracks();
    _renderRuler();
    _audioAutoSave();
}

function toggleTrackMute(trackId) {
    const t = audioTracks.find(t => t.id === trackId);
    if (!t) return;
    t.muted = !t.muted;
    // Apply to live audio element if playing
    const active = _activeAudioElements.find(a => a.trackId === trackId);
    if (active) active.audio.volume = t.muted ? 0 : t.volume;
    _renderTracks();
}

function setTrackVolume(trackId, value) {
    const t = audioTracks.find(t => t.id === trackId);
    if (!t) return;
    t.volume = parseInt(value, 10) / 100;
    const active = _activeAudioElements.find(a => a.trackId === trackId);
    if (active && !t.muted) active.audio.volume = t.volume;
}

function _renameTrack(trackId, name) {
    const t = audioTracks.find(t => t.id === trackId);
    if (t) t.name = name.trim() || t.name;
}

function _setOffset(trackId, seconds) {
    const t = audioTracks.find(t => t.id === trackId);
    if (t) t.startOffset = Math.max(0, seconds);
    _renderTracks();
}

// ─────────────────────────────────────────
// File Import
// ─────────────────────────────────────────

function importAudioFile(trackId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) await _loadFileIntoTrack(file, trackId);
    };
    input.click();
}

async function _loadFileIntoTrack(file, trackId) {
    // Create new track if none specified
    let track;
    if (!trackId) {
        track = addEmptyAudioTrack();
    } else {
        track = audioTracks.find(t => t.id === trackId);
        if (!track) return;
    }

    // Name from filename (strip extension)
    track.name = file.name.replace(/\.[^.]+$/, '') || track.name;
    track.mimeType = file.type || 'audio/mpeg';

    // Read as base64 data URL
    const dataURL = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
    track.audioData = dataURL;

    // Duration from Audio element — reliable across all formats
    track.duration = await _getAudioDuration(dataURL);

    // Waveform from Web Audio API — best-effort, doesn't affect playback
    track.waveformData = await _decodeWaveform(dataURL);

    _renderTracks();
    _renderRuler();
    _audioAutoSave();
}

// ─────────────────────────────────────────
// Recording
// ─────────────────────────────────────────

async function startRecordingToTrack(trackId) {
    if (_isRecording) { stopRecording(); return; }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        _recordingChunks = [];
        _recordingTrackId = trackId;
        _isRecording = true;

        _mediaRecorder = new MediaRecorder(stream);
        _mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) _recordingChunks.push(e.data);
        };
        _mediaRecorder.onstop = async () => {
            const mime = _mediaRecorder.mimeType || 'audio/webm';
            const blob = new Blob(_recordingChunks, { type: mime });
            const file = new File([blob], 'recording', { type: mime });
            stream.getTracks().forEach(t => t.stop());
            _isRecording = false;
            await _loadFileIntoTrack(file, _recordingTrackId);
            _recordingTrackId = null;
            _renderTracks();
        };

        _mediaRecorder.start();
        _renderTracks(); // show recording state
    } catch (err) {
        _isRecording = false;
        console.error('[AudioTracks] Mic error:', err);
        if (typeof showInfoModal === 'function') {
            showInfoModal('Microphone Error',
                '❌ Could not access microphone.\nPlease allow microphone access in your browser settings.', '❌');
        }
    }
}

function stopRecording() {
    if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
        _mediaRecorder.stop();
    }
}

// ─────────────────────────────────────────
// Playback Sync
// ─────────────────────────────────────────

function _onPlaybackStarted(data) {
    _stopAllAudio();
    if (audioTracks.length === 0) return;

    const fps = data?.fps || (typeof playbackSpeed !== 'undefined' ? playbackSpeed : 12) || 12;
    const frameCount = typeof frames !== 'undefined' ? frames.length : 0;
    const cf = typeof currentFrame !== 'undefined' ? currentFrame : 0;
    const startFrame = (cf >= frameCount - 1) ? 0 : cf;
    const animTime = startFrame / fps;

    audioTracks.forEach(track => {
        if (!track.audioData) return;

        const audioStartTime = animTime - track.startOffset;
        if (track.duration > 0 && audioStartTime >= track.duration) return;

        const audio = new Audio(track.audioData);
        audio.volume = track.muted ? 0 : track.volume;

        const ref = { audio, trackId: track.id };
        _activeAudioElements.push(ref);

        const delayMs = audioStartTime < 0 ? (-audioStartTime * 1000) : 0;

        const doPlay = () => {
            // Seek first (only valid after loadedmetadata), then play after optional delay
            if (audioStartTime > 0) audio.currentTime = audioStartTime;
            if (delayMs > 0) {
                ref._timeout = setTimeout(
                    () => audio.play().catch(err => console.error('[AudioTracks] play() failed:', err)),
                    delayMs
                );
            } else {
                audio.play().catch(err => console.error('[AudioTracks] play() failed:', err));
            }
        };

        // currentTime can only be set reliably once the browser knows the media duration.
        // For data URLs this fires almost immediately, but we must wait for it.
        if (audioStartTime > 0) {
            audio.addEventListener('loadedmetadata', doPlay, { once: true });
        } else {
            // No seeking needed — safe to play straight away
            doPlay();
        }
    });
}

function _onPlaybackStopped() {
    _stopAllAudio();
}

function _stopAllAudio() {
    _activeAudioElements.forEach(({ audio, _timeout }) => {
        if (_timeout) clearTimeout(_timeout);
        audio.pause();
        audio.src = ''; // release resource
    });
    _activeAudioElements = [];
}

// ─────────────────────────────────────────
// Waveform Drawing
// ─────────────────────────────────────────

function _drawWaveform(canvasEl, waveformData) {
    if (!canvasEl || !waveformData) return;
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width;
    const h = canvasEl.height;
    ctx.clearRect(0, 0, w, h);
    const barW = w / waveformData.length;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < waveformData.length; i++) {
        const bh = Math.max(1, waveformData[i] * h);
        ctx.fillRect(i * barW, (h - bh) / 2, Math.max(1, barW - 0.5), bh);
    }
}

// ─────────────────────────────────────────
// Timeline Ruler
// ─────────────────────────────────────────

function _renderRuler() {
    const ruler = document.getElementById('audio-timeline-ruler');
    if (!ruler) return;
    const fps = (typeof playbackSpeed !== 'undefined' ? playbackSpeed : 12) || 12;
    const count = (typeof frames !== 'undefined' ? frames.length : 0);
    if (count === 0) { ruler.innerHTML = ''; return; }

    const tickEvery = Math.max(1, Math.round(count / 8));
    let html = '';
    for (let f = 0; f <= count; f += tickEvery) {
        const pct = (f / count) * 100;
        const sec = (f / fps).toFixed(1);
        html += `<div class="at-ruler-tick" style="left:${pct}%">
            <div class="at-ruler-line"></div>
            <span class="at-ruler-label">${sec}s</span>
        </div>`;
    }
    ruler.innerHTML = html;
}

// ─────────────────────────────────────────
// Clip Drag (reposition on timeline)
// ─────────────────────────────────────────

function _initClipDrag(clipEl, trackId) {
    let dragging = false;
    let startX = 0;
    let origOffset = 0;

    clipEl.addEventListener('mousedown', (e) => {
        dragging = true;
        startX = e.clientX;
        const t = audioTracks.find(t => t.id === trackId);
        origOffset = t ? t.startOffset : 0;
        e.preventDefault();
    });

    const onMove = (e) => {
        if (!dragging) return;
        const tl = clipEl.closest('.at-track-timeline');
        if (!tl) return;
        const tlW = tl.getBoundingClientRect().width;
        const dur = _animDuration();
        const deltaS = ((e.clientX - startX) / tlW) * dur;
        _setOffset(trackId, origOffset + deltaS);
    };

    const onUp = () => { dragging = false; };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    // Store cleanup refs on element
    clipEl._dragCleanup = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    };
}

// ─────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────

function toggleAudioPanel() {
    _audioPanelOpen = !_audioPanelOpen;
    const body = document.getElementById('audio-panel-body');
    const btn  = document.getElementById('audio-toggle-btn');
    if (body) body.style.display = _audioPanelOpen ? '' : 'none';
    if (btn)  btn.textContent = _audioPanelOpen ? '▲' : '▼';
}

let _audioSectionVisible = true;

function openAudioStudio() {
    _audioSectionVisible = !_audioSectionVisible;
    const section = document.getElementById('audio-section');
    if (section) section.style.display = _audioSectionVisible ? '' : 'none';

    // Update the menu item label to reflect current state
    const menuItem = document.querySelector('[onclick="openAudioStudio()"]');
    if (menuItem) menuItem.textContent = _audioSectionVisible ? '🎵 Audio Studio' : '🎵 Audio Studio (hidden)';

    // Close the file dropdown
    if (typeof toggleFileDropdown === 'function') toggleFileDropdown();
}

function _renderTracks() {
    const list = document.getElementById('audio-tracks-list');
    const hint = document.getElementById('audio-drop-hint');
    if (!list) return;

    // Clean up old drag listeners
    list.querySelectorAll('.at-clip[data-has-drag]').forEach(el => {
        if (el._dragCleanup) el._dragCleanup();
    });

    if (audioTracks.length === 0) {
        list.innerHTML = '';
        if (hint) hint.style.display = '';
        return;
    }
    if (hint) hint.style.display = 'none';

    const dur = _animDuration();
    list.innerHTML = '';

    audioTracks.forEach(track => {
        const isRecThis = _isRecording && _recordingTrackId === track.id;
        const hasAudio = !!(track.audioData && track.duration > 0);
        const clipLeft  = hasAudio ? Math.min((track.startOffset / dur) * 100, 98) : 0;
        const clipWidth = hasAudio ? Math.max(0.5, Math.min((track.duration / dur) * 100, 100 - clipLeft)) : 0;

        const row = document.createElement('div');
        row.className = 'at-track-row';
        row.dataset.trackId = track.id;

        row.innerHTML = `
            <div class="at-track-controls">
                <div class="at-color-swatch" style="background:${track.color}"></div>
                <div class="at-track-name" contenteditable="true" spellcheck="false">${_escHtml(track.name)}</div>
                <button class="at-btn at-mute-btn${track.muted ? ' muted' : ''}"
                    title="${track.muted ? 'Unmute' : 'Mute'}"
                    onclick="toggleTrackMute('${track.id}')">
                    ${track.muted ? '🔇' : '🔊'}
                </button>
                <input type="range" class="at-vol-slider" min="0" max="100"
                    value="${Math.round(track.volume * 100)}" title="Volume"
                    oninput="setTrackVolume('${track.id}', this.value)">
                <button class="at-btn at-rec-btn${isRecThis ? ' recording' : ''}"
                    title="${isRecThis ? 'Stop Recording' : 'Record from mic'}"
                    onclick="${isRecThis ? 'stopRecording()' : `startRecordingToTrack('${track.id}')`}">
                    ${isRecThis ? '⏹' : '⏺'}
                </button>
                <button class="at-btn at-import-btn" title="Import audio file"
                    onclick="importAudioFile('${track.id}')">📁</button>
                <button class="at-btn at-del-btn" title="Delete track"
                    onclick="deleteAudioTrack('${track.id}')">×</button>
            </div>
            <div class="at-track-timeline" id="at-tl-${track.id}">
                ${hasAudio ? `
                <div class="at-clip" data-has-drag="1"
                    style="left:${clipLeft}%;width:${clipWidth}%;background:${track.color};"
                    title="Drag to reposition · ${track.name}">
                    <canvas class="at-waveform"></canvas>
                </div>` : `
                <div class="at-empty-hint">Drop audio here, or use ⏺ / 📁</div>`}
            </div>`;

        list.appendChild(row);

        // Name editing
        const nameEl = row.querySelector('.at-track-name');
        nameEl.addEventListener('blur', () => _renameTrack(track.id, nameEl.textContent));
        nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });

        // Waveform + clip drag
        if (hasAudio) {
            const clipEl = row.querySelector('.at-clip');
            _initClipDrag(clipEl, track.id);

            if (track.waveformData) {
                requestAnimationFrame(() => {
                    const wc = clipEl?.querySelector('.at-waveform');
                    if (!wc) return;
                    wc.width  = clipEl.offsetWidth  || 200;
                    wc.height = clipEl.offsetHeight || 38;
                    _drawWaveform(wc, track.waveformData);
                });
            }
        }

        // Drop audio onto individual track timeline
        const tlEl = row.querySelector('.at-track-timeline');
        if (tlEl) {
            tlEl.addEventListener('dragover',  (e) => { e.preventDefault(); tlEl.classList.add('drag-over'); });
            tlEl.addEventListener('dragleave', ()  => tlEl.classList.remove('drag-over'));
            tlEl.addEventListener('drop', async (e) => {
                e.preventDefault(); e.stopPropagation();
                tlEl.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
                if (files.length) await _loadFileIntoTrack(files[0], track.id);
            });
        }
    });
}

// ─────────────────────────────────────────
// Panel-level drop zone
// ─────────────────────────────────────────

function _initDropZone() {
    const panel = document.getElementById('audio-panel-body');
    if (!panel) return;

    panel.addEventListener('dragover', (e) => {
        if ([...e.dataTransfer.items].some(i => i.type.startsWith('audio/'))) {
            e.preventDefault();
            panel.classList.add('drag-over');
        }
    });
    panel.addEventListener('dragleave', () => panel.classList.remove('drag-over'));
    panel.addEventListener('drop', async (e) => {
        e.preventDefault();
        panel.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
        for (const file of files) await _loadFileIntoTrack(file, null);
    });
}

// ─────────────────────────────────────────
// Audio Auto-Save (separate localStorage key)
// Kept completely separate from buggaboo_autosave so frame quota is unaffected.
// ─────────────────────────────────────────

function _audioAutoSave() {
    try {
        const data = JSON.stringify(getAudioTracksForSave());
        localStorage.setItem('buggaboo_audio', data);
    } catch (e) {
        // Audio data may exceed quota for very large files — silently ignore.
        // Use File → Save Project to persist audio reliably.
        console.warn('[AudioTracks] Audio auto-save skipped (storage full):', e.message);
    }
}

function _audioAutoLoad() {
    try {
        const saved = localStorage.getItem('buggaboo_audio');
        if (saved) loadAudioTracksFromSave(JSON.parse(saved));
    } catch (e) {
        console.warn('[AudioTracks] Could not restore audio tracks:', e);
    }
}

// ─────────────────────────────────────────
// Save / Load (project file)
// ─────────────────────────────────────────

function getAudioTracksForSave() {
    return audioTracks.map(t => ({
        id:          t.id,
        name:        t.name,
        color:       t.color,
        muted:       t.muted,
        volume:      t.volume,
        audioData:   t.audioData,   // base64 data URL (may be large)
        mimeType:    t.mimeType,
        startOffset: t.startOffset,
        duration:    t.duration
        // waveformData omitted — regenerated on load
    }));
}

async function loadAudioTracksFromSave(tracksData) {
    if (!Array.isArray(tracksData) || tracksData.length === 0) return;
    audioTracks = [];

    for (const t of tracksData) {
        const track = {
            id:          t.id || _newTrackId(),
            name:        t.name || 'Track',
            color:       t.color || _nextColor(),
            muted:       !!t.muted,
            volume:      t.volume != null ? t.volume : 1.0,
            audioData:   t.audioData || null,
            mimeType:    t.mimeType  || 'audio/mpeg',
            startOffset: t.startOffset || 0,
            duration:    t.duration    || 0,
            waveformData: null
        };
        // Regenerate duration + waveform from saved audio data
        if (track.audioData) {
            if (!track.duration) track.duration = await _getAudioDuration(track.audioData);
            track.waveformData = await _decodeWaveform(track.audioData);
        }
        audioTracks.push(track);
    }

    _renderTracks();
    _renderRuler();
}

// ─────────────────────────────────────────
// Init
// ─────────────────────────────────────────

function initAudioTracks() {
    // eventBus is declared with `let` in init.js — it's a global variable but NOT a window property.
    // Try the bare name first, fall back to window.eventBus for safety.
    const bus = (typeof eventBus !== 'undefined' ? eventBus : null) || window.eventBus || null;

    if (bus) {
        bus.on('playback:started',       _onPlaybackStarted);
        bus.on('playback:stopped',       _onPlaybackStopped);
        bus.on('frame:added',   () => { _renderRuler(); _renderTracks(); });
        bus.on('frame:deleted', () => { _renderRuler(); _renderTracks(); });
        bus.on('playback:speed:changed', () => { _renderRuler(); _renderTracks(); });
    }

    _initDropZone();
    _renderTracks();
    _renderRuler();
    _audioAutoLoad();
}
