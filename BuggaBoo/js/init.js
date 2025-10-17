// Application Initialization
// Initializes the application when the page loads

function initializeApp() {
    // Initialize with default canvas
    createNewCanvas(512, 512);
    
    // Set initial brush size colors to black
    updateBrushSizeColors();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    console.log('Animation Maker initialized!');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
