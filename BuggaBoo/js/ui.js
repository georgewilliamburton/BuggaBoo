// UI and Modal Management
// Handles warning modals and unsaved changes

let pendingAction = null;
let pendingDeleteAction = null;

// Warning modal functions
function showWarningModal(message, action) {
    document.getElementById('modal-message').textContent = message;
    document.getElementById('warning-modal').classList.add('show');
    pendingAction = action;
}

function closeWarningModal() {
    document.getElementById('warning-modal').classList.remove('show');
    pendingAction = null;
}

// Delete confirmation modal
function showDeleteModal(frameNumber, onConfirm) {
    document.getElementById('delete-modal-message').textContent = `Delete frame ${frameNumber}?`;
    document.getElementById('delete-modal').classList.add('show');
    pendingDeleteAction = onConfirm;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('show');
    pendingDeleteAction = null;
}

function confirmDelete() {
    if (pendingDeleteAction) {
        pendingDeleteAction();
    }
    closeDeleteModal();
}

// Canvas size selection modal
function showCanvasSizeModal() {
    document.getElementById('canvas-size-modal').classList.add('show');
}

function closeCanvasSizeModal() {
    document.getElementById('canvas-size-modal').classList.remove('show');
}

function selectCanvasSize(width, height) {
    closeCanvasSizeModal();
    createNewCanvas(width, height);
}

function confirmAction(shouldSave) {
    if (shouldSave) {
        // Save current work
        if (canvas.getObjects().length > 0 || canvas.backgroundImage) {
            saveFrame();
        }
        exportAnimation();
    }
    
    // Execute the pending action
    if (pendingAction) {
        pendingAction();
    }
    
    hasUnsavedChanges = false;
    closeWarningModal();
}

// Check for unsaved changes before action
function checkUnsavedChanges(action, message = 'You have unsaved work. Would you like to save your animation before continuing?') {
    if (hasUnsavedChanges || canvas.getObjects().length > 0 || frames.length > 0) {
        showWarningModal(message, action);
        return false;
    }
    action();
    return true;
}
