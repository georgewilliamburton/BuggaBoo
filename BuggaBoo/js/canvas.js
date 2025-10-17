// Canvas Management
// Handles canvas creation, initialization, and Fabric.js setup

let canvas;
let hasUnsavedChanges = false;

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
            markAsChanged();
            updatePreview();
        });
        canvas.on('object:modified', () => {
            markAsChanged();
            updatePreview();
        });
        canvas.on('object:removed', () => {
            markAsChanged();
            updatePreview();
        });
        canvas.on('path:created', () => {
            markAsChanged();
            updatePreview();
        });
        canvas.on('after:render', () => {
            updatePreview();
        });
        
        // Handle fill tool clicks
        canvas.on('mouse:down', (options) => {
            if (currentTool === 'fill') {
                if (options.target) {
                    // Fill the clicked object
                    options.target.set('fill', currentColor);
                    canvas.renderAll();
                    markAsChanged();
                    updatePreview();
                }
            }
        });

        updateFramesDisplay();
        console.log(`Canvas created: ${width}×${height}`);
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
    console.log(`Fullscreen canvas created: ${width}×${height}`);
}

// Clear canvas
function clearCanvas() {
    if (confirm('Clear the canvas?')) {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
    }
}

// Undo
function undo() {
    const objects = canvas.getObjects();
    if (objects.length > 0) {
        canvas.remove(objects[objects.length - 1]);
        canvas.renderAll();
    }
}
