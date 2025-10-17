// Keyboard Shortcuts
// Handles all keyboard shortcuts and hotkeys

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    // Warn before leaving page
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges || canvas.getObjects().length > 0 || frames.length > 0) {
            e.preventDefault();
            e.returnValue = ''; // Chrome requires returnValue to be set
            return ''; // Some browsers show this message
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        // Ctrl/Cmd + S for save frame
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveFrame();
        }
        // Spacebar for add new frame
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            addNewFrame();
        }
    });
}
