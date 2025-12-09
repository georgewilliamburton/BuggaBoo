// Layers Panel Management
// Handles layer visibility, selection, reordering, and deletion

// Toggle layers panel
function toggleLayersPanel() {
    const panel = document.getElementById('layers-panel');
    const toggleBtn = document.getElementById('layers-toggle');
    
    panel.classList.toggle('open');
    toggleBtn.classList.toggle('active');
    
    if (panel.classList.contains('open')) {
        updateLayersList();
    }
}

// Update the layers list display
function updateLayersList() {
    const layersList = document.getElementById('layers-list');
    
    if (!canvas) {
        layersList.innerHTML = '<div class="layers-empty">No canvas loaded</div>';
        return;
    }
    
    const objects = canvas.getObjects();
    
    if (objects.length === 0) {
        layersList.innerHTML = '<div class="layers-empty">No objects yet. Start drawing!</div>';
        return;
    }
    
    // Clear current list
    layersList.innerHTML = '';
    
    // Add layers in reverse order (top layer first)
    objects.slice().reverse().forEach((obj, index) => {
        const actualIndex = objects.length - 1 - index;
        const layerItem = createLayerItem(obj, actualIndex);
        layersList.appendChild(layerItem);
    });
}

// Create a layer item element
function createLayerItem(obj, index) {
    const div = document.createElement('div');
    div.className = 'layer-item';
    div.setAttribute('data-index', index);
    
    // Check if this object is selected
    const activeObject = canvas.getActiveObject();
    if (activeObject === obj) {
        div.classList.add('selected');
    }
    
    // Make entire item draggable
    div.setAttribute('draggable', 'true');
    
    // Drag handle (visual indicator only)
    const dragHandle = document.createElement('div');
    dragHandle.className = 'layer-drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Drag to reorder';
    
    // Drag and drop handlers on the entire item
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        div.classList.add('dragging');
        // Delay to allow drag image to be set
        setTimeout(() => {
            div.style.opacity = '0.5';
        }, 0);
    });
    
    div.addEventListener('dragend', (e) => {
        div.classList.remove('dragging');
        div.style.opacity = '1';
        // Remove drag-over from all items
        document.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    });
    
    div.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const draggingItem = document.querySelector('.layer-item.dragging');
        if (draggingItem && draggingItem !== div) {
            div.classList.add('drag-over');
        }
    });
    
    div.addEventListener('dragenter', (e) => {
        e.preventDefault();
    });
    
    div.addEventListener('dragleave', (e) => {
        // Only remove if we're actually leaving the div (not entering a child)
        if (e.currentTarget === div && !div.contains(e.relatedTarget)) {
            div.classList.remove('drag-over');
        }
    });
    
    div.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        div.classList.remove('drag-over');
        
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(div.getAttribute('data-index'));
        
        if (fromIndex !== toIndex && !isNaN(fromIndex) && !isNaN(toIndex)) {
            reorderLayers(fromIndex, toIndex);
        }
    });
    
    // Thumbnail
    const thumbnail = document.createElement('div');
    thumbnail.className = 'layer-thumbnail';
    
    // Create mini preview
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 40;
    tempCanvas.height = 40;
    const ctx = tempCanvas.getContext('2d');
    
    // Draw simplified version of object
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 40, 40);
    
    if (obj.type === 'path') {
        ctx.strokeStyle = obj.stroke || '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, 20);
        ctx.lineTo(35, 20);
        ctx.stroke();
    } else if (obj.type === 'image') {
        ctx.fillStyle = '#3498db';
        ctx.fillRect(5, 5, 30, 30);
    } else {
        ctx.fillStyle = obj.fill || obj.stroke || '#000';
        ctx.fillRect(10, 10, 20, 20);
    }
    
    thumbnail.appendChild(tempCanvas);
    
    // Info section
    const info = document.createElement('div');
    info.className = 'layer-info';
    
    const type = document.createElement('div');
    type.className = 'layer-type';
    type.textContent = getObjectTypeName(obj);
    
    const details = document.createElement('div');
    details.className = 'layer-details';
    details.textContent = `Layer ${index + 1}`;
    
    info.appendChild(type);
    info.appendChild(details);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'layer-actions';
    
    // Lock toggle
    const lockBtn = document.createElement('button');
    lockBtn.className = 'layer-action-btn ' + (obj.selectable === false ? 'locked' : 'unlocked');
    lockBtn.innerHTML = obj.selectable === false ? '🔒' : '🔓';
    lockBtn.title = obj.selectable === false ? 'Unlock Layer' : 'Lock Layer';
    lockBtn.onclick = (e) => {
        e.stopPropagation();
        toggleLayerLock(index);
    };
    
    // Visibility toggle
    const visibilityBtn = document.createElement('button');
    visibilityBtn.className = 'layer-action-btn ' + (obj.visible !== false ? 'visible' : 'hidden');
    visibilityBtn.innerHTML = obj.visible !== false ? '👁️' : '🚫';
    visibilityBtn.title = 'Toggle Visibility';
    visibilityBtn.onclick = (e) => {
        e.stopPropagation();
        toggleLayerVisibility(index);
    };
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'layer-action-btn';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete Layer';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteLayer(index);
    };
    
    actions.appendChild(lockBtn);
    actions.appendChild(visibilityBtn);
    actions.appendChild(deleteBtn);
    
    // Prevent action buttons from triggering drag
    actions.setAttribute('draggable', 'false');
    actions.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    
    // Click to select (but not if we just finished dragging)
    let wasDragging = false;
    div.addEventListener('dragstart', () => { wasDragging = true; });
    div.addEventListener('dragend', () => { 
        setTimeout(() => { wasDragging = false; }, 100);
    });
    
    div.onclick = (e) => {
        if (!wasDragging && !e.target.closest('.layer-actions')) {
            selectLayer(index);
        }
    };
    
    div.appendChild(dragHandle);
    div.appendChild(thumbnail);
    div.appendChild(info);
    div.appendChild(actions);
    
    return div;
}

// Get friendly name for object type
function getObjectTypeName(obj) {
    if (obj.type === 'path') return '✏️ Drawing';
    if (obj.type === 'image') return '🖼️ Image';
    if (obj.type === 'circle') return '⭕ Circle';
    if (obj.type === 'rect') return '⬜ Rectangle';
    if (obj.type === 'triangle') return '🔺 Triangle';
    if (obj.type === 'line') return '📏 Line';
    if (obj.type === 'group') return '📦 Group';
    return '🔷 Object';
}

// Select a layer
function selectLayer(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (obj) {
        canvas.setActiveObject(obj);
        canvas.renderAll();
        updateLayersList();
    }
}

// Toggle layer lock
function toggleLayerLock(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (obj) {
        const newLockState = !obj.selectable;
        
        obj.selectable = newLockState;
        obj.evented = newLockState;
        obj.hasControls = newLockState;
        obj.hasBorders = newLockState;
        obj.lockMovementX = !newLockState;
        obj.lockMovementY = !newLockState;
        obj.lockRotation = !newLockState;
        obj.lockScalingX = !newLockState;
        obj.lockScalingY = !newLockState;
        
        // If we're locking the currently selected object, deselect it
        if (!newLockState) {
            const activeObject = canvas.getActiveObject();
            if (activeObject === obj) {
                canvas.discardActiveObject();
            }
        }
        
        canvas.renderAll();
        updateLayersList();
        // Don't call saveCanvasState() - lock states are managed separately
        markAsChanged();
    }
}

// Toggle layer visibility
function toggleLayerVisibility(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (obj) {
        obj.visible = !obj.visible;
        canvas.renderAll();
        updateLayersList();
        markAsChanged();
        updatePreview();
    }
}

// Delete a layer
function deleteLayer(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (obj) {
        // Save state BEFORE deletion so undo can restore it
        saveCanvasState();
        
        canvas.remove(obj);
        canvas.renderAll();
        updateLayersList();
        markAsChanged();
        updatePreview();
    }
}

// Reorder layers via drag and drop
function reorderLayers(fromIndex, toIndex) {
    const objects = canvas.getObjects();
    const obj = objects[fromIndex];
    
    if (!obj) return;
    
    // Save state before reordering
    saveCanvasState();
    
    // Remove object from canvas
    canvas.remove(obj);
    
    // Insert at new position
    canvas.insertAt(obj, toIndex);
    
    canvas.renderAll();
    
    // Update display after a short delay to ensure canvas has updated
    setTimeout(() => {
        updateLayersList();
        markAsChanged();
        updatePreview();
    }, 50);
}

// Auto-update layers when objects change
function initializeLayersPanelListeners() {
    if (!canvas) return;
    
    canvas.on('object:added', () => {
        if (document.getElementById('layers-panel').classList.contains('open')) {
            updateLayersList();
        }
    });
    
    canvas.on('object:removed', () => {
        if (document.getElementById('layers-panel').classList.contains('open')) {
            updateLayersList();
        }
    });
    
    canvas.on('object:modified', () => {
        if (document.getElementById('layers-panel').classList.contains('open')) {
            updateLayersList();
        }
    });
    
    canvas.on('selection:created', () => {
        if (document.getElementById('layers-panel').classList.contains('open')) {
            updateLayersList();
        }
    });
    
    canvas.on('selection:updated', () => {
        if (document.getElementById('layers-panel').classList.contains('open')) {
            updateLayersList();
        }
    });
    
    canvas.on('selection:cleared', () => {
        if (document.getElementById('layers-panel').classList.contains('open')) {
            updateLayersList();
        }
    });
}
