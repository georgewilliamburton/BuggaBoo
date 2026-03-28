// Application Initialization
// Initializes the application when the page loads

// ============================================
// Phase 1: Global Services (Architecture Foundation)
// ============================================
let serviceContainer = null;
let eventBus = null;
let stateManager = null;

/**
 * Initialize Phase 1 architecture services
 * Must be called before application initialization
 */
function initializeServices() {
    // Create service container
    serviceContainer = new ServiceContainer();
    
    // Create and register event bus
    eventBus = new EventBus(false); // Set to true for debug mode
    serviceContainer.register('eventBus', eventBus, true);
    window.eventBus = eventBus; // expose on window so all modules can reach it

    // Create and register state manager
    stateManager = new StateManager(eventBus);
    serviceContainer.register('stateManager', stateManager, true);
    window.stateManager = stateManager;
    
    // Initialize application state
    stateManager.set('app.initialized', false);
    stateManager.set('app.hasUnsavedChanges', false);
    stateManager.set('canvas.width', 512);
    stateManager.set('canvas.height', 512);
    stateManager.set('tool.current', 'draw');
    stateManager.set('tool.color', '#000000');
    stateManager.set('tool.brushSize', 4);
    stateManager.set('animation.playing', false);
    stateManager.set('animation.fps', 12);
    stateManager.set('animation.currentFrame', 0);
    stateManager.set('frames.count', 1);
    stateManager.set('frames.selected', []);
    
    console.log('Phase 1 Architecture initialized:', {
        serviceContainer: !!serviceContainer,
        eventBus: !!eventBus,
        stateManager: !!stateManager
    });
}

/**
 * Register canvas adapter after canvas is created
 * This should be called after Fabric.js canvas initialization
 * @param {fabric.Canvas} fabricCanvas - The Fabric.js canvas instance
 */
function registerCanvasAdapter(fabricCanvas) {
    if (!serviceContainer) {
        console.error('ServiceContainer not initialized! Call initializeServices() first.');
        return;
    }
    
    // Create and register canvas adapter
    const canvasAdapter = new FabricCanvasAdapter(fabricCanvas);
    serviceContainer.register('canvas', canvasAdapter, true);
    
    console.log('Canvas adapter registered');
    
    // Emit canvas ready event
    if (eventBus) {
        eventBus.emit('canvas:ready', { width: fabricCanvas.width, height: fabricCanvas.height });
    }
}

function initializeApp() {
    // Initialize Phase 1 services first
    initializeServices();
    
    // Set initial brush size colors to black
    updateBrushSizeColors();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize assets system
    initializeAssets();

    // Initialize audio tracks panel
    if (typeof initAudioTracks === 'function') {
        initAudioTracks();
    }

    // Start auto-save system
    startAutoSave();
    
    // Check for previous session to restore
    const hasAutoSave = loadAutoSavedProject();
    
    // If no auto-save, show canvas size selection modal
    if (!hasAutoSave) {
        showCanvasSizeModal();
    }
    
    // Mark app as initialized
    if (stateManager) {
        stateManager.set('app.initialized', true);
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

