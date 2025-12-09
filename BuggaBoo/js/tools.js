// Drawing Tools
// Handles draw, select, and eraser tools

let currentColor = '#000000';
let currentBrushSize = 4;
let eraserBrushSize = 25; // Default eraser to largest size
let currentTool = 'draw';

// Set tool
function setTool(tool) {
    currentTool = tool;
    
    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tool + '-tool').classList.add('active');

    if (tool === 'draw') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = currentColor;
        canvas.freeDrawingBrush.width = currentBrushSize;
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        // Deselect any selected objects
        canvas.discardActiveObject();
        // Make sure unlocked objects stay unlocked
        canvas.forEachObject(obj => {
            if (obj.lockMovementX !== true) {
                obj.selectable = false;
                obj.evented = true;
            }
        });
        canvas.renderAll();
    } else if (tool === 'eraser') {
        canvas.isDrawingMode = true;
        // Create a custom eraser brush that actually erases
        const eraserBrush = new fabric.PencilBrush(canvas);
        eraserBrush.width = eraserBrushSize;
        eraserBrush.color = 'rgba(0,0,0,1)'; // Use black with full opacity
        
        // Override the brush to use destination-out composition (eraser mode)
        const originalOnMouseDown = eraserBrush.onMouseDown.bind(eraserBrush);
        const originalOnMouseUp = eraserBrush.onMouseUp.bind(eraserBrush);
        
        eraserBrush.onMouseDown = function(pointer, options) {
            // Set eraser mode before drawing
            canvas.contextTop.globalCompositeOperation = 'destination-out';
            originalOnMouseDown(pointer, options);
        };
        
        eraserBrush.onMouseUp = function(options) {
            originalOnMouseUp(options);
            // Reset composition mode after drawing
            canvas.contextTop.globalCompositeOperation = 'source-over';
            
            // Apply erasing to the actual canvas objects
            if (this._finalizeAndAddPath) {
                const path = this._finalizeAndAddPath();
                if (path) {
                    // Set the path to erase mode
                    path.globalCompositeOperation = 'destination-out';
                    path.absolutePositioned = true;
                }
            }
        };
        
        canvas.freeDrawingBrush = eraserBrush;
        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        // Deselect any selected objects
        canvas.discardActiveObject();
        // Make sure unlocked objects stay unlocked
        canvas.forEachObject(obj => {
            if (obj.lockMovementX !== true) {
                obj.selectable = false;
                obj.evented = true;
            }
        });
        canvas.renderAll();
    } else if (tool === 'select') {
        canvas.isDrawingMode = false;
        canvas.defaultCursor = 'default';
        canvas.selection = true;
        // Enable object selection (but respect locked objects)
        canvas.forEachObject(obj => {
            // Only make selectable if not locked (lockMovementX is our lock indicator)
            if (obj.lockMovementX !== true) {
                obj.selectable = true;
                obj.evented = true;
                // Ensure other properties are not in locked state
                obj.hasControls = true;
                obj.hasBorders = true;
            }
        });
    } else if (tool === 'fill') {
        canvas.isDrawingMode = false;
        canvas.defaultCursor = 'pointer';
        canvas.selection = false;
        // Deselect any selected objects
        canvas.discardActiveObject();
        // Enable object detection for fill tool (but not selection)
        canvas.forEachObject(obj => {
            // Don't override locked state
            if (obj.lockMovementX !== true) {
                obj.selectable = false;
            }
            obj.evented = true; // Keep evented=true so we can click on objects (even locked ones for fill)
        });
        canvas.renderAll();
    }
}

// Set color
function setColor(color) {
    currentColor = color;
    
    // Update button states
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update brush size indicators to show new color
    updateBrushSizeColors();

    if (currentTool === 'draw') {
        canvas.freeDrawingBrush.color = color;
    }
}

// Set custom color from color picker
function setCustomColor(color) {
    currentColor = color;
    
    // Update button states - mark the rainbow button as active
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.color-picker-btn').classList.add('active');

    // Update brush size indicators to show new color
    updateBrushSizeColors();

    if (currentTool === 'draw') {
        canvas.freeDrawingBrush.color = color;
    }
}

// Update brush size button colors
function updateBrushSizeColors() {
    document.querySelectorAll('.brush-size-btn .dot').forEach(dot => {
        dot.style.background = currentColor;
    });
}

// Set brush size
function setBrushSize(size, event) {
    if (currentTool === 'eraser') {
        eraserBrushSize = size;
    } else {
        currentBrushSize = size;
    }
    
    // Update button states
    document.querySelectorAll('.brush-size-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback if event not provided (called from onclick)
        document.querySelector(`.brush-size-btn[onclick*="${size}"]`)?.classList.add('active');
    }

    canvas.freeDrawingBrush.width = size;
}

// Select all objects on canvas
function selectAllObjects() {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    if (objects.length === 0) return;
    
    // Switch to select mode if not already
    if (currentTool !== 'select') {
        setTool('select');
    }
    
    // Filter out locked objects
    const selectableObjects = objects.filter(obj => obj.lockMovementX !== true);
    
    if (selectableObjects.length === 0) return;
    
    // Create active selection with only unlocked objects
    const selection = new fabric.ActiveSelection(selectableObjects, {
        canvas: canvas
    });
    
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
}

// Add shape to canvas
function addShape(shapeType) {
    if (!canvas) return;
    
    let shape;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const defaultSize = 100;
    
    switch(shapeType) {
        case 'rectangle':
            shape = new fabric.Rect({
                left: centerX - defaultSize / 2,
                top: centerY - defaultSize / 2,
                fill: currentColor,
                width: defaultSize,
                height: defaultSize,
                stroke: null
            });
            break;
        case 'circle':
            shape = new fabric.Circle({
                left: centerX - defaultSize / 2,
                top: centerY - defaultSize / 2,
                fill: currentColor,
                radius: defaultSize / 2,
                stroke: null
            });
            break;
        case 'triangle':
            shape = new fabric.Triangle({
                left: centerX - defaultSize / 2,
                top: centerY - defaultSize / 2,
                fill: currentColor,
                width: defaultSize,
                height: defaultSize,
                stroke: null
            });
            break;
    }
    
    if (shape) {
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.renderAll();
        
        // Switch to select tool so user can immediately move/resize
        setTool('select');
    }
}

// Toggle shadow on selected object(s)
function toggleShadow() {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
        // Show info if nothing selected
        showInfoModal('No Selection', '⚠️ Please select an object to add or remove shadow.', '⚠️');
        return;
    }
    
    // Check if object has shadow
    const hasShadow = activeObject.shadow !== null && activeObject.shadow !== undefined;
    
    if (hasShadow) {
        // Remove shadow
        activeObject.set('shadow', null);
    } else {
        // Add shadow
        activeObject.set('shadow', new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.5)',
            blur: 10,
            offsetX: 5,
            offsetY: 5
        }));
    }
    
    canvas.renderAll();
    saveCanvasState();
    markAsChanged();
}

// Toggle shapes menu
function toggleShapesMenu() {
    const shapesMenu = document.getElementById('shapes-menu');
    if (shapesMenu) {
        shapesMenu.classList.toggle('active');
    }
}

// Close shapes menu when clicking outside
document.addEventListener('click', function(event) {
    const shapesContainer = document.querySelector('.shapes-menu-container');
    const shapesMenu = document.getElementById('shapes-menu');
    
    if (shapesContainer && !shapesContainer.contains(event.target)) {
        if (shapesMenu) {
            shapesMenu.classList.remove('active');
        }
    }
});

// Flood fill algorithm (simplified for drawn pixels)
function performFloodFill(x, y) {
    if (!canvas) {
        console.warn('Canvas not initialized');
        return;
    }

    // Get the canvas element
    const canvasElement = document.getElementById('canvas-container');
    if (!canvasElement) {
        console.warn('Canvas element not found');
        return;
    }
    
    // Bounds check
    if (x < 0 || y < 0 || x >= canvasElement.width || y >= canvasElement.height) {
        console.log('Click outside canvas bounds');
        return;
    }
    
    try {
        // Get 2D context
        const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            console.warn('Could not get canvas context');
            return;
        }
        
        // Get the image data
        const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const data = imageData.data;
        
        // Get the color at the clicked pixel (RGBA format: each pixel is 4 bytes)
        const pixelIndex = (Math.floor(y) * canvasElement.width + Math.floor(x)) * 4;
        const targetColor = [
            data[pixelIndex],      // R
            data[pixelIndex + 1],  // G
            data[pixelIndex + 2],  // B
            data[pixelIndex + 3]   // A
        ];
        
        console.log('Target color at click:', targetColor);
        
        // Convert current color from hex to RGB
        const fillColor = hexToRgb(currentColor);
        const fillRGB = [fillColor.r, fillColor.g, fillColor.b, 255];
        
        console.log('Fill color:', fillRGB);
        
        // Check if target color is transparent (clicking on empty area)
        if (targetColor[3] < 50) {
            console.log('Clicked on transparent area');
            return;
        }
        
        // Check if colors are already the same
        if (colorsEqual(targetColor, fillRGB, 10)) {
            console.log('Target and fill colors are the same');
            return;
        }
        
        // Perform flood fill using BFS
        const queue = [[x, y]];
        const visited = new Set();
        const tolerance = 30;
        let fillCount = 0;
        
        while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            const key = `${cx},${cy}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Check bounds
            if (cx < 0 || cy < 0 || cx >= canvasElement.width || cy >= canvasElement.height) {
                continue;
            }
            
            // Get pixel color
            const pIndex = (Math.floor(cy) * canvasElement.width + Math.floor(cx)) * 4;
            const pixelColor = [
                data[pIndex],
                data[pIndex + 1],
                data[pIndex + 2],
                data[pIndex + 3]
            ];
            
            // Check if pixel matches target color
            if (!colorsMatch(pixelColor, targetColor, tolerance)) {
                continue;
            }
            
            // Fill this pixel
            data[pIndex] = fillRGB[0];
            data[pIndex + 1] = fillRGB[1];
            data[pIndex + 2] = fillRGB[2];
            data[pIndex + 3] = 255;
            fillCount++;
            
            // Add neighbors to queue
            queue.push([cx + 1, cy]);
            queue.push([cx - 1, cy]);
            queue.push([cx, cy + 1]);
            queue.push([cx, cy - 1]);
        }
        
        console.log(`Filled ${fillCount} pixels`);
        
        // Put the modified image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Force Fabric.js to re-render
        canvas.renderAll();
        
        // Save state for undo
        saveCanvasState();
        markAsChanged();
        updatePreview();
        
    } catch (error) {
        console.error('Flood fill error:', error);
    }
}

// Helper: Convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Helper: Check if two colors are approximately equal
function colorsMatch(color1, color2, tolerance) {
    return Math.abs(color1[0] - color2[0]) <= tolerance &&
           Math.abs(color1[1] - color2[1]) <= tolerance &&
           Math.abs(color1[2] - color2[2]) <= tolerance &&
           color2[3] > 50; // Target color must not be transparent
}

// Helper: Check if two colors are exactly equal
function colorsEqual(color1, color2, tolerance) {
    return Math.abs(color1[0] - color2[0]) <= tolerance &&
           Math.abs(color1[1] - color2[1]) <= tolerance &&
           Math.abs(color1[2] - color2[2]) <= tolerance;
}