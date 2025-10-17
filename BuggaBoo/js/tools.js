// Drawing Tools
// Handles draw, select, and eraser tools

let currentColor = '#000000';
let currentBrushSize = 8;
let currentTool = 'draw';

// Set tool
function setTool(tool) {
    currentTool = tool;
    
    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tool + '-tool').classList.add('active');

    if (tool === 'draw') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = currentColor;
    } else if (tool === 'eraser') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = '#ffffff';
    } else if (tool === 'select') {
        canvas.isDrawingMode = false;
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
function setBrushSize(size) {
    currentBrushSize = size;
    
    // Update button states
    document.querySelectorAll('.brush-size-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    canvas.freeDrawingBrush.width = size;
}
