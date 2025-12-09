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
    
    // Add global layer class if applicable
    if (obj.isGlobalLayer) {
        div.classList.add('global-layer');
    }
    
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
    
    // Global layer dropdown container
    const globalContainer = document.createElement('div');
    globalContainer.className = 'global-dropdown-container';
    
    // Global layer button
    const globalBtn = document.createElement('button');
    globalBtn.className = 'layer-action-btn global-btn';
    if (obj.isGlobalLayer) {
        globalBtn.classList.add('active');
        globalBtn.innerHTML = '🌐';
        globalBtn.title = 'Global Layer (synced across frames)';
    } else {
        globalBtn.innerHTML = '⭕';
        globalBtn.title = 'Make Global Layer';
    }
    globalBtn.onclick = (e) => toggleGlobalDropdown(index, e);
    
    // Global dropdown menu
    const globalDropdown = document.createElement('div');
    globalDropdown.className = 'global-dropdown';
    
    // Determine current state for this object
    const isGlobalLayer = obj.isGlobalLayer;
    const isExcludedFromCurrent = currentFrame >= 0 && frames[currentFrame] && 
                                   frames[currentFrame].globalExclusions && 
                                   frames[currentFrame].globalExclusions.includes(obj.globalId);
    
    const option1 = document.createElement('button');
    option1.className = 'global-option';
    if (isGlobalLayer && !isExcludedFromCurrent) {
        option1.classList.add('active');
    }
    option1.innerHTML = '🌐 Enable on All Frames';
    option1.title = 'Add this object to all frames and keep synced';
    option1.onclick = (e) => {
        e.stopPropagation();
        enableGlobalOnAllFrames(index);
    };
    
    const option2 = document.createElement('button');
    option2.className = 'global-option';
    option2.innerHTML = '🔗 Link Current Frames';
    option2.title = 'Link similar objects that already exist in other frames';
    option2.onclick = (e) => {
        e.stopPropagation();
        linkCurrentFramesOnly(index);
    };
    
    const option3 = document.createElement('button');
    option3.className = 'global-option';
    if (!isGlobalLayer) {
        option3.classList.add('disabled');
        option3.title = 'Object is not a global layer';
    } else if (isExcludedFromCurrent) {
        option3.classList.add('active');
        option3.title = 'This frame is unlinked from the global layer';
    } else {
        option3.title = 'Remove global link from this frame only';
    }
    option3.innerHTML = '⛓️‍💥 Unlink This Frame';
    option3.onclick = (e) => {
        e.stopPropagation();
        if (!option3.classList.contains('disabled')) {
            unlinkThisFrame(index);
        }
    };
    
    globalDropdown.appendChild(option1);
    globalDropdown.appendChild(option2);
    globalDropdown.appendChild(option3);
    
    globalContainer.appendChild(globalBtn);
    globalContainer.appendChild(globalDropdown);
    
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
    actions.appendChild(globalContainer);
    
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
        obj.erasable = newLockState; // Locked objects can't be erased
        
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
        // If it's a global layer, ask user what to do
        if (obj.isGlobalLayer && obj.globalId) {
            showGlobalDeleteModal(index, obj);
        } else {
            // Normal deletion
            // Save state BEFORE deletion so undo can restore it
            saveCanvasState();
            
            canvas.remove(obj);
            canvas.renderAll();
            updateLayersList();
            markAsChanged();
            updatePreview();
        }
    }
}

// Show modal for deleting global layer
function showGlobalDeleteModal(index, obj) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: #2c3e50; padding: 30px; border-radius: 10px; max-width: 400px; text-align: center; color: white;';
    
    const title = document.createElement('h2');
    title.textContent = '🗑️ Delete Global Layer?';
    title.style.cssText = 'margin: 0 0 20px 0; color: #e74c3c;';
    
    const message = document.createElement('p');
    message.textContent = 'This is a global layer synced across multiple frames.';
    message.style.cssText = 'margin: 0 0 25px 0; line-height: 1.6;';
    
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 10px; flex-direction: column;';
    
    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.textContent = '🌐 Delete from All Frames';
    deleteAllBtn.style.cssText = 'padding: 12px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;';
    deleteAllBtn.onclick = () => {
        deleteGlobalFromAllFrames(obj.globalId);
        canvas.remove(obj);
        canvas.renderAll();
        updateLayersList();
        markAsChanged();
        updatePreview();
        document.body.removeChild(modal);
    };
    
    const unlinkBtn = document.createElement('button');
    unlinkBtn.textContent = '⛓️‍💥 Unlink and Delete from This Frame Only';
    unlinkBtn.style.cssText = 'padding: 12px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
    unlinkBtn.onclick = () => {
        saveCanvasState();
        unlinkThisFrame(index);
        canvas.remove(obj);
        canvas.renderAll();
        updateLayersList();
        markAsChanged();
        updatePreview();
        document.body.removeChild(modal);
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding: 12px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
    cancelBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    btnContainer.appendChild(deleteAllBtn);
    btnContainer.appendChild(unlinkBtn);
    btnContainer.appendChild(cancelBtn);
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(btnContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// Delete global object from all frames
function deleteGlobalFromAllFrames(globalId) {
    if (!globalId) return;
    
    const currentFrameIndex = currentFrame;
    
    // Save current frame first
    saveFrame();
    
    // Loop through all frames and remove objects with matching globalId
    frames.forEach((frame, frameIndex) => {
        const tempJson = JSON.parse(JSON.stringify(frame.json));
        
        if (tempJson.objects) {
            // Filter out objects with matching globalId
            tempJson.objects = tempJson.objects.filter(o => o.globalId !== globalId);
            frame.json = tempJson;
        }
        
        // Remove from global exclusions if present
        if (frame.globalExclusions) {
            frame.globalExclusions = frame.globalExclusions.filter(id => id !== globalId);
        }
    });
    
    // Reload current frame
    if (currentFrameIndex >= 0 && currentFrameIndex < frames.length) {
        loadFrame(currentFrameIndex);
    }
}

// Close global dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-dropdown-container')) {
        document.querySelectorAll('.global-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

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

// Toggle global layer dropdown for a specific layer
function toggleGlobalDropdown(index, event) {
    event.stopPropagation();
    
    // Close any open dropdowns first
    document.querySelectorAll('.global-dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
    
    // Toggle this dropdown
    const dropdown = event.currentTarget.nextElementSibling;
    if (dropdown && dropdown.classList.contains('global-dropdown')) {
        const isShowing = dropdown.classList.contains('show');
        dropdown.classList.toggle('show');
        
        // Position dropdown relative to button if showing
        if (!isShowing) {
            const btnRect = event.currentTarget.getBoundingClientRect();
            dropdown.style.left = `${btnRect.right + 5}px`;
            dropdown.style.top = `${btnRect.top}px`;
        }
    }
}

// Enable global layer on all frames
function enableGlobalOnAllFrames(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    // Generate a unique global ID if it doesn't have one
    if (!obj.globalId) {
        obj.globalId = generateGlobalId();
    }
    
    // Mark as global layer
    obj.isGlobalLayer = true;
    
    // Add this object to all other frames
    syncObjectToAllFrames(obj, index);
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    
    // Close dropdown
    document.querySelectorAll('.global-dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Link current frames only (enable global but only on frames that already have this object)
function linkCurrentFramesOnly(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    // Generate a unique global ID if it doesn't have one
    if (!obj.globalId) {
        obj.globalId = generateGlobalId();
    }
    
    // Mark as global layer
    obj.isGlobalLayer = true;
    
    // Apply global ID to matching objects in other frames (but don't add to new frames)
    linkExistingObjects(obj, index);
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    
    // Close dropdown
    document.querySelectorAll('.global-dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Unlink this frame from global object
function unlinkThisFrame(index) {
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj || !obj.isGlobalLayer || !obj.globalId) return;
    
    // Remove global properties from this object
    obj.isGlobalLayer = false;
    const globalId = obj.globalId;
    delete obj.globalId;
    
    // Add current frame to exclusion list
    excludeFrameFromGlobal(globalId);
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    
    // Close dropdown
    document.querySelectorAll('.global-dropdown.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Sync an object to all frames
function syncObjectToAllFrames(sourceObj, sourceIndex) {
    if (!sourceObj.globalId) return;
    
    const currentFrameIndex = currentFrame;
    
    // Save current frame first
    saveFrame();
    
    // Loop through all frames
    frames.forEach((frame, frameIndex) => {
        if (frameIndex === currentFrameIndex) return; // Skip current frame
        
        // Check if frame is excluded
        if (frame.globalExclusions && frame.globalExclusions.includes(sourceObj.globalId)) {
            return; // Skip excluded frames
        }
        
        // Load frame temporarily
        const tempJson = JSON.parse(JSON.stringify(frame.json));
        
        // Check if object with this globalId already exists
        let existingIndex = -1;
        if (tempJson.objects) {
            existingIndex = tempJson.objects.findIndex(o => o.globalId === sourceObj.globalId);
        }
        
        // Get source object JSON
        const sourceJson = sourceObj.toJSON(['globalId', 'isGlobalLayer']);
        
        if (existingIndex >= 0) {
            // Update existing object
            tempJson.objects[existingIndex] = sourceJson;
        } else {
            // Add new object
            if (!tempJson.objects) tempJson.objects = [];
            tempJson.objects.push(sourceJson);
        }
        
        // Save back to frame
        frame.json = tempJson;
    });
    
    // Reload current frame
    loadFrame(currentFrameIndex);
}

// Link existing objects across frames (doesn't add to new frames)
function linkExistingObjects(sourceObj, sourceIndex) {
    if (!sourceObj.globalId) return;
    
    const currentFrameIndex = currentFrame;
    
    // Save current frame first
    saveFrame();
    
    // Loop through all frames
    frames.forEach((frame, frameIndex) => {
        if (frameIndex === currentFrameIndex) return; // Skip current frame
        
        // Load frame temporarily
        const tempJson = JSON.parse(JSON.stringify(frame.json));
        
        // Find matching object at the same index (simple heuristic)
        if (tempJson.objects && tempJson.objects[sourceIndex]) {
            const targetObj = tempJson.objects[sourceIndex];
            
            // Only link if objects seem similar (same type)
            if (targetObj.type === sourceObj.type) {
                targetObj.globalId = sourceObj.globalId;
                targetObj.isGlobalLayer = true;
                
                // Copy properties from source
                const sourceJson = sourceObj.toJSON(['globalId', 'isGlobalLayer']);
                Object.assign(targetObj, sourceJson);
            }
        }
        
        // Save back to frame
        frame.json = tempJson;
    });
    
    // Reload current frame
    loadFrame(currentFrameIndex);
}
