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
        // Ctrl/Cmd + Shift + Z for redo
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
            e.preventDefault();
            redo();
        }
        // Ctrl/Cmd + Z for undo
        else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        // Ctrl/Cmd + Y for redo (alternative)
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        // Ctrl/Cmd + A for select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selectAllObjects();
        }
        // Ctrl/Cmd + S for save project
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProject();
        }
        // S key for select tool
        if (e.key === 's' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setTool('select');
        }
        // D key for draw tool
        if (e.key === 'd' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setTool('draw');
        }
        // F key for fill tool
        if (e.key === 'f' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setTool('fill');
        }
        // L key for layers panel
        if (e.key === 'l' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            toggleLayersPanel();
        }
        // Shift + Spacebar for duplicate frame
        if (e.shiftKey && e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            duplicateCurrentFrame();
        }
        // Spacebar for add new frame (only if not shift)
        else if (e.code === 'Space' && !e.shiftKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            addNewFrame();
        }
    });
}
