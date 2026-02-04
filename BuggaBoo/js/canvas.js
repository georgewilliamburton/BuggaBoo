// Canvas Management
// Handles canvas creation, initialization, and Fabric.js setup

let canvas;
let hasUnsavedChanges = false;
let currentCanvasSize = 'Custom'; // Track canvas size label for project save/load

// Track changes
function markAsChanged() {
    hasUnsavedChanges = true;
}

// Initialize canvas
function createNewCanvas(width = 512, height = 512) {
    const doCreate = () => {
        if (canvas) {
            canvas.dispose();
        }

        frames = [];
        currentFrame = -1;
        hasUnsavedChanges = false;

        canvas = new fabric.Canvas('canvas-container', {
            width: width,
            height: height,
            backgroundColor: '#ffffff',
            isDrawingMode: true
        });

        // Register canvas with Phase 1 architecture (if available)
        if (typeof registerCanvasAdapter === 'function') {
            registerCanvasAdapter(canvas);
        }

        // Set initial brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = currentColor;
        canvas.freeDrawingBrush.width = currentBrushSize;

        // Enable rotation and scaling for all objects
        fabric.Object.prototype.set({
            borderColor: '#E06F8B',
            cornerColor: '#E06F8B',
            cornerSize: 12,
            transparentCorners: false,
            cornerStyle: 'circle',
            rotatingPointOffset: 40
        });

        // Custom rotation cursor icon
        function renderRotationIcon(ctx, left, top, styleOverride, fabricObject) {
            const size = this.cornerSize;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            
            // Draw circular background
            ctx.fillStyle = '#E06F8B';
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw rotation arrows
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            // Draw curved arrow (rotation symbol)
            ctx.beginPath();
            ctx.arc(0, 0, size / 3, -Math.PI / 4, Math.PI * 1.25, false);
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(size / 4, -size / 6);
            ctx.lineTo(size / 3.5, size / 8);
            ctx.lineTo(size / 6, 0);
            ctx.fill();
            
            ctx.restore();
        }

        // Apply custom rotation control
        fabric.Object.prototype.controls.mtr = new fabric.Control({
            x: 0,
            y: -0.5,
            offsetY: -40,
            cursorStyle: 'crosshair',
            actionHandler: fabric.controlsUtils.rotationWithSnapping,
            actionName: 'rotate',
            render: renderRotationIcon,
            cornerSize: 24,
            withConnection: true
        });

        // Track changes and update preview
        canvas.on('object:added', () => {
            saveCanvasState();
            markAsChanged();
            updatePreview();
        });
        canvas.on('object:modified', (e) => {
            saveCanvasState();
            markAsChanged();
            updatePreview();
            
            // Sync global layers after modification is complete
            if (e.target && e.target.isGlobalLayer && e.target.globalId) {
                syncGlobalLayer(e.target);
            }
        });
        canvas.on('object:removed', () => {
            // Don't save state here - we save before deletion in deleteLayer()
            markAsChanged();
            updatePreview();
        });
        canvas.on('path:created', () => {
            saveCanvasState();
            markAsChanged();
            updatePreview();
        });
        canvas.on('after:render', () => {
            updatePreview();
        });
        
        // Sync global layers on mouse:up (after drag complete)
        canvas.on('mouse:up', () => {
            const activeObject = canvas.getActiveObject();
            if (activeObject && activeObject.isGlobalLayer && activeObject.globalId) {
                syncGlobalLayer(activeObject);
            }
        });
        
        // Handle fill tool clicks
        canvas.on('mouse:down', (options) => {
            if (currentTool === 'fill') {
                // Prevent default Fabric.js selection behavior
                options.e.preventDefault();
                
                // Check if clicking on an object with fill property (shapes, paths)
                if (options.target) {
                    // Fill the clicked object
                    options.target.set('fill', currentColor);
                    if (options.target.stroke) {
                        options.target.set('stroke', currentColor);
                    }
                    canvas.renderAll();
                    saveCanvasState();
                    markAsChanged();
                    updatePreview();
                } else {
                    // If not clicking on an object, try flood fill on canvas
                    const pointer = canvas.getPointer(options.e);
                    performFloodFill(Math.floor(pointer.x), Math.floor(pointer.y));
                }
            }
        });
        
        // Initialize layers panel listeners
        initializeLayersPanelListeners();

        updateFramesDisplay();
    };

    if (canvas && (hasUnsavedChanges || frames.length > 0 || canvas.getObjects().length > 0)) {
        checkUnsavedChanges(doCreate, 'Creating a new canvas will clear all your work. Save before continuing?');
    } else {
        doCreate();
    }
}

// Create fullscreen canvas
function createFullscreenCanvas() {
    // Calculate available space
    const canvasArea = document.querySelector('.canvas-area');
    const areaRect = canvasArea.getBoundingClientRect();
    
    // Account for padding (20px on each side)
    const maxWidth = areaRect.width - 40;
    const maxHeight = areaRect.height - 40;
    
    // Use the available space
    const width = Math.floor(maxWidth);
    const height = Math.floor(maxHeight);
    
    createNewCanvas(width, height);
}

// Clear canvas
function clearCanvas() {
    if (confirm('Clear the canvas?')) {
        saveCanvasState(); // Save state before clearing
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
    }
}

// Undo/Redo state management
let undoStack = [];
let redoStack = [];
let isUndoRedoing = false;
let lockedObjects = new Map(); // Track locked objects by their ID

// Save canvas state for undo
function saveCanvasState() {
    if (isUndoRedoing) return;
    
    const state = JSON.stringify(canvas.toJSON(['globalId', 'isGlobalLayer']));
    
    // Don't save if it's the same as the last state
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === state) {
        return;
    }
    
    undoStack.push(state);
    
    // Limit undo stack to 50 states
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    
    // Clear redo stack when new action is made
    redoStack = [];
}

// Get lock states of all objects
function getLockStates() {
    const lockStates = {};
    canvas.getObjects().forEach((obj, index) => {
        if (obj.selectable === false) {
            lockStates[index] = true;
        }
    });
    return lockStates;
}

// Apply lock states to objects
function applyLockStates(lockStates) {
    canvas.getObjects().forEach((obj, index) => {
        if (lockStates[index]) {
            obj.selectable = false;
            obj.evented = false;
            obj.hasControls = false;
            obj.hasBorders = false;
            obj.lockMovementX = true;
            obj.lockMovementY = true;
            obj.lockRotation = true;
            obj.lockScalingX = true;
            obj.lockScalingY = true;
            obj.erasable = false; // Locked objects can't be erased
        }
    });
}

// Undo
function undo() {
    if (undoStack.length > 0) {
        isUndoRedoing = true;
        
        // Save lock states before undo
        const lockStates = getLockStates();
        
        // Get current state
        const currentState = JSON.stringify(canvas.toJSON(['globalId', 'isGlobalLayer']));
        
        // Get previous state
        let state = undoStack.pop();
        
        // If current state matches the last undo state, pop again to get the actual previous state
        if (state === currentState && undoStack.length > 0) {
            state = undoStack.pop();
        }
        
        // Save current state to redo stack
        redoStack.push(currentState);
        
        // Restore state
        canvas.loadFromJSON(state, () => {
            // Reapply lock states after restore
            applyLockStates(lockStates);
            
            canvas.renderAll();
            isUndoRedoing = false;
            markAsChanged();
            updatePreview();
            if (document.getElementById('layers-panel').classList.contains('open')) {
                updateLayersList();
            }
        });
    }
}

// Redo
function redo() {
    if (redoStack.length > 0) {
        isUndoRedoing = true;
        
        // Save lock states before redo
        const lockStates = getLockStates();
        
        // Save current state to undo stack
        undoStack.push(JSON.stringify(canvas.toJSON(['globalId', 'isGlobalLayer'])));
        
        // Get next state
        const state = redoStack.pop();
        
        // Restore state
        canvas.loadFromJSON(state, () => {
            // Reapply lock states after restore
            applyLockStates(lockStates);
            
            canvas.renderAll();
            isUndoRedoing = false;
            markAsChanged();
            updatePreview();
            if (document.getElementById('layers-panel').classList.contains('open')) {
                updateLayersList();
            }
        });
    }
}

// Sync a global layer object to all frames
function syncGlobalLayer(sourceObj) {
    if (!sourceObj.globalId || !sourceObj.isGlobalLayer) return;
    if (currentFrame < 0) return;
    
    const currentFrameIndex = currentFrame;
    const sourceJson = sourceObj.toJSON(['globalId', 'isGlobalLayer']);
    
    // Loop through all frames and update matching global objects
    frames.forEach((frame, frameIndex) => {
        if (frameIndex === currentFrameIndex) return; // Skip current frame
        
        // Check if frame is excluded from this global object
        if (frame.globalExclusions && frame.globalExclusions.includes(sourceObj.globalId)) {
            return; // Skip excluded frames
        }
        
        // Load frame temporarily
        const tempJson = JSON.parse(JSON.stringify(frame.json));
        
        // Find object with matching globalId
        if (tempJson.objects) {
            const objIndex = tempJson.objects.findIndex(o => o.globalId === sourceObj.globalId);
            
            if (objIndex >= 0) {
                // Update the object with new properties
                tempJson.objects[objIndex] = sourceJson;
                
                // Update the frame data
                frame.json = tempJson;
            }
        }
    });
}
