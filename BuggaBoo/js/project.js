// Project Save/Load System
// Handles saving and loading entire animation projects

function saveProject() {
    // Ensure current frame is saved before exporting
    if (currentFrame >= 0 && currentFrame < frames.length) {
        frames[currentFrame] = {
            json: canvas.toJSON(),
            thumbnail: canvas.toDataURL('image/png')
        };
    }
    
    // Create project data
    const projectData = {
        version: "1.0",
        created: new Date().toISOString(),
        canvasSize: {
            width: canvas.width,
            height: canvas.height,
            label: currentCanvasSize || 'Custom'
        },
        frames: frames,
        currentFrameIndex: currentFrame,
        // Include settings
        settings: {
            onionSkinEnabled: onionSkinEnabled || false,
            backgroundColor: canvas.backgroundColor || '#ffffff'
        }
    };
    
    // Convert to JSON and create download
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `buggaboo-project-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showInfoModal('Project Saved', '✅ Your project has been saved successfully!');
}

function loadProjectFromStartup() {
    // Close the canvas size modal first
    closeCanvasSizeModal();
    
    // Small delay to ensure modal closes smoothly before file picker opens
    setTimeout(() => {
        loadProject();
    }, 100);
}

function loadProject() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                
                // Validate project structure
                if (!projectData.version || !projectData.frames || !projectData.canvasSize) {
                    showInfoModal('Invalid Project', '❌ This file is not a valid BuggaBoo project.', '❌');
                    return;
                }
                
                // Show confirmation modal
                showLoadProjectConfirmation(projectData);
                
            } catch (error) {
                console.error('Error loading project:', error);
                showInfoModal('Load Error', '❌ Could not load project file. File may be corrupted.', '❌');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function showLoadProjectConfirmation(projectData) {
    // Calculate project info
    const frameCount = projectData.frames.length;
    const createdDate = new Date(projectData.created).toLocaleString();
    const size = `${projectData.canvasSize.width}×${projectData.canvasSize.height}`;
    
    const message = `📊 Frames: ${frameCount}\n📐 Canvas: ${size}\n📅 Created: ${createdDate}\n\n⚠️ This will replace your current project!`;
    
    showConfirmModal(
        'Load Project?',
        message,
        () => applyLoadedProject(projectData),
        'Load Project',
        'Cancel',
        '📂'
    );
}

function applyLoadedProject(projectData) {
    try {
        // Stop any playback
        if (typeof stopPlayback === 'function') {
            stopPlayback();
        }
        
        // Clear current state
        frames = [];
        currentFrame = -1;
        
        // Set canvas size
        const { width, height, label } = projectData.canvasSize;
        currentCanvasSize = label;
        
        // Create or resize canvas
        if (!canvas) {
            // Canvas doesn't exist yet - create it
            createNewCanvas(width, height);
        } else {
            // Canvas exists - resize it
            canvas.setWidth(width);
            canvas.setHeight(height);
            canvas.backgroundColor = projectData.settings?.backgroundColor || '#ffffff';
            canvas.clear();
            canvas.renderAll();
        }
        
        // Load frames
        frames = projectData.frames;
        
        // Load first frame or specified frame
        const frameToLoad = projectData.currentFrameIndex >= 0 && 
                           projectData.currentFrameIndex < frames.length 
                           ? projectData.currentFrameIndex 
                           : 0;
        
        if (frames.length > 0) {
            loadFrame(frameToLoad);
        }
        
        // Restore settings
        if (projectData.settings?.onionSkinEnabled && typeof toggleOnionSkin === 'function') {
            if (!onionSkinEnabled) {
                toggleOnionSkin();
            }
        }
        
        // Update UI
        updateFramesDisplay();
        
        // Reset undo/redo stacks (clear history for fresh start)
        if (typeof undoStack !== 'undefined') {
            undoStack = [];
            redoStack = [];
        }
        
        showInfoModal('Project Loaded', `✅ Project loaded successfully!\n📊 ${frames.length} frames restored`);
        
    } catch (error) {
        console.error('Error applying project:', error);
        showInfoModal('Load Error', '❌ Could not apply project. Starting fresh.', '❌');
        
        // Reset to safe state
        frames = [];
        currentFrame = -1;
        if (canvas) {
            canvas.clear();
            canvas.backgroundColor = '#ffffff';
            canvas.renderAll();
        }
        updateFramesDisplay();
        
        // Show canvas size modal if no canvas exists
        if (!canvas) {
            showCanvasSizeModal();
        }
    }
}

// Export current project to localStorage (auto-save)
function autoSaveProject() {
    try {
        // Ensure current frame is saved
        if (currentFrame >= 0 && currentFrame < frames.length) {
            frames[currentFrame] = {
                json: canvas.toJSON(),
                thumbnail: canvas.toDataURL('image/png')
            };
        }
        
        const projectData = {
            version: "1.0",
            saved: new Date().toISOString(),
            canvasSize: {
                width: canvas.width,
                height: canvas.height,
                label: currentCanvasSize || 'Custom'
            },
            frames: frames,
            currentFrameIndex: currentFrame,
            settings: {
                onionSkinEnabled: onionSkinEnabled || false,
                backgroundColor: canvas.backgroundColor || '#ffffff'
            }
        };
        
        localStorage.setItem('buggaboo_autosave', JSON.stringify(projectData));
        
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
}

// Load project from localStorage (on startup)
function loadAutoSavedProject() {
    try {
        const saved = localStorage.getItem('buggaboo_autosave');
        if (!saved) return false;
        
        const projectData = JSON.parse(saved);
        
        // Check if it's recent (within 7 days)
        const savedDate = new Date(projectData.saved);
        const daysSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSince > 7) {
            localStorage.removeItem('buggaboo_autosave');
            return false;
        }
        
        // Ask user if they want to restore
        showRestoreAutoSaveConfirmation(projectData);
        return true;
        
    } catch (error) {
        console.error('Could not load auto-save:', error);
        return false;
    }
}

function showRestoreAutoSaveConfirmation(projectData) {
    const frameCount = projectData.frames.length;
    const savedDate = new Date(projectData.saved).toLocaleString();
    
    const message = `📊 Frames: ${frameCount}\n💾 Last saved: ${savedDate}\n\nWould you like to continue where you left off?`;
    
    // Create a custom confirmation that handles both actions
    showConfirmModal(
        'Restore Previous Session?',
        message,
        () => applyLoadedProject(projectData),
        'Restore',
        'Start Fresh',
        '💾'
    );
    
    // Override the cancel action to also remove auto-save
    const originalClose = closeConfirmModal;
    window.closeConfirmModal = function(confirmed) {
        if (!confirmed) {
            localStorage.removeItem('buggaboo_autosave');
            showCanvasSizeModal(); // Show canvas selection if starting fresh
        }
        originalClose(confirmed);
        window.closeConfirmModal = originalClose; // Restore original
    };
}

// Auto-save every 30 seconds
let autoSaveInterval;
function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(autoSaveProject, 30000); // 30 seconds
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    autoSaveProject();
});
