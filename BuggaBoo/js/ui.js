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

// Info/Success modal functions
function showInfoModal(title, message, icon = '✅') {
    document.getElementById('info-modal-icon').textContent = icon;
    document.getElementById('info-modal-title').textContent = title;
    document.getElementById('info-modal-message').textContent = message;
    document.getElementById('info-modal').classList.add('show');
}

function closeInfoModal() {
    document.getElementById('info-modal').classList.remove('show');
}

// Confirmation modal (Yes/No)
let confirmCallback = null;

function showConfirmModal(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', icon = '❓') {
    document.getElementById('confirm-modal-icon').textContent = icon;
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;
    
    // Update button texts
    const confirmBtn = document.querySelector('#confirm-modal .modal-btn-save');
    const cancelBtn = document.querySelector('#confirm-modal .modal-btn-cancel');
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    
    confirmCallback = onConfirm;
    document.getElementById('confirm-modal').classList.add('show');
}

function closeConfirmModal(confirmed) {
    document.getElementById('confirm-modal').classList.remove('show');
    if (confirmed && confirmCallback) {
        confirmCallback();
    }
    confirmCallback = null;
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

function selectCanvasSize(width, height, label) {
    closeCanvasSizeModal();
    
    // Handle fullscreen sizing
    if (width === 'fullscreen') {
        // Calculate based on window size and known element heights
        // This is more reliable than measuring DOM elements that may not be fully laid out
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Fixed widths for toolbars (from CSS)
        const leftToolbarWidth = 70;  // .left-toolbar width
        const rightPaletteWidth = 90; // .right-palette width
        
        // Measure the actual heights of top and bottom elements
        const topMenu = document.querySelector('.top-menu');
        const framesStrip = document.querySelector('.frames-strip');
        const topMenuHeight = topMenu.offsetHeight;
        const framesStripHeight = framesStrip.offsetHeight;
        
        // Calculate available space
        // Subtract: toolbars + canvas area padding (20px each side = 40px total)
        const availableWidth = windowWidth - leftToolbarWidth - rightPaletteWidth - 40;
        const availableHeight = windowHeight - topMenuHeight - framesStripHeight - 40;
        
        // Set the label
        currentCanvasSize = 'Fullscreen';
        
        // Create canvas with these dimensions
        createNewCanvas(Math.floor(availableWidth), Math.floor(availableHeight));
    } else {
        // Set the label (if provided, otherwise generate from dimensions)
        currentCanvasSize = label || `${width}×${height}`;
        createNewCanvas(width, height);
    }
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

// Shortcuts modal
function showShortcutsModal() {
    document.getElementById('shortcuts-modal').classList.add('show');
    // Close dropdown menu
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
}

function closeShortcutsModal() {
    document.getElementById('shortcuts-modal').classList.remove('show');
}
