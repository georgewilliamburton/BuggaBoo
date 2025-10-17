// Application Initialization
// Initializes the application when the page loads

function initializeApp() {
    // Set initial brush size colors to black
    updateBrushSizeColors();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize assets system
    initializeAssets();
    
    // Start auto-save system
    startAutoSave();
    
    // Check for previous session to restore
    const hasAutoSave = loadAutoSavedProject();
    
    // If no auto-save, show canvas size selection modal
    if (!hasAutoSave) {
        showCanvasSizeModal();
    }
    
    console.log('Animation Maker initialized!');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
