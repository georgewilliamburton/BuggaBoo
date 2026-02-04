/**
 * @fileoverview Layers Panel UI Module
 * 
 * @description
 * Manages the layers panel user interface, including display, list rendering,
 * and drag-and-drop reordering functionality. This module handles all UI-related
 * operations for the layers system, keeping presentation logic separate from
 * business logic.
 * 
 * Key Features:
 * - Layer list display with thumbnails
 * - Drag-and-drop reordering
 * - Global layer visual indicators
 * - Real-time canvas synchronization
 * - Event-driven updates
 * 
 * @example
 * // Toggle panel visibility
 * toggleLayersPanel();
 * 
 * // Update display (called automatically by canvas events)
 * updateLayersList();
 * 
 * // Initialize event listeners
 * initializeLayersPanelListeners();
 * 
 * @module layers/layers-panel
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 3 - File Splitting
 * @requires canvas - Global Fabric.js canvas instance
 * @requires frames - Global frames array
 * @requires currentFrame - Global current frame index
 */

// ============================================
// Phase 3: Module Split from layers.js
// ============================================

/**
 * Toggle layers panel visibility
 * @function
 * @emits layers:panel:toggled - When panel is opened/closed
 */
function toggleLayersPanel() {
    const panel = document.getElementById('layers-panel');
    const toggleBtn = document.getElementById('layers-toggle');
    
    panel.classList.toggle('open');
    toggleBtn.classList.toggle('active');
    
    if (panel.classList.contains('open')) {
        updateLayersList();
    }
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layers:panel:toggled', {
            isOpen: panel.classList.contains('open')
        });
    }
}

/**
 * Update the layers list display
 */
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

/**
 * Create a layer item element
 * @param {Object} obj - Fabric.js object
 * @param {number} index - Object index in canvas
 * @returns {HTMLElement} Layer item div
 */
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
        setTimeout(() => { div.style.opacity = '0.5'; }, 0);
    });
    
    div.addEventListener('dragend', (e) => {
        div.classList.remove('dragging');
        div.style.opacity = '1';
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
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 40;
    tempCanvas.height = 40;
    const ctx = tempCanvas.getContext('2d');
    
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
    const actions = createLayerActions(obj, index);
    
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

/**
 * Create layer action buttons
 * @param {Object} obj - Fabric.js object
 * @param {number} index - Object index
 * @returns {HTMLElement} Actions container
 */
function createLayerActions(obj, index) {
    const actions = document.createElement('div');
    actions.className = 'layer-actions';
    
    // Global layer dropdown container
    const globalContainer = document.createElement('div');
    globalContainer.className = 'global-dropdown-container';
    
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
    
    const globalDropdown = createGlobalDropdown(obj, index);
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
    
    return actions;
}

/**
 * Create global layer dropdown menu
 * @param {Object} obj - Fabric.js object
 * @param {number} index - Object index
 * @returns {HTMLElement} Dropdown menu
 */
function createGlobalDropdown(obj, index) {
    const globalDropdown = document.createElement('div');
    globalDropdown.className = 'global-dropdown';
    
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
    
    return globalDropdown;
}

/**
 * Get friendly name for object type
 * @param {Object} obj - Fabric.js object
 * @returns {string} Type name with emoji
 */
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

/**
 * Reorder layers via drag and drop
 * @param {number} fromIndex - Source index
 * @param {number} toIndex - Target index
 */
function reorderLayers(fromIndex, toIndex) {
    const objects = canvas.getObjects();
    const obj = objects[fromIndex];
    
    if (!obj) return;
    
    saveCanvasState();
    
    canvas.remove(obj);
    canvas.insertAt(obj, toIndex);
    canvas.renderAll();
    
    setTimeout(() => {
        updateLayersList();
        markAsChanged();
        updatePreview();
    }, 50);
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:reordered', {
            fromIndex: fromIndex,
            toIndex: toIndex
        });
    }
}

/**
 * Initialize layers panel event listeners
 */
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

// Close global dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-dropdown-container')) {
        document.querySelectorAll('.global-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

/**
 * Toggle global layer dropdown for a specific layer
 * @param {number} index - Layer index
 * @param {Event} event - Click event
 */
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
        
        if (!isShowing) {
            const btnRect = event.currentTarget.getBoundingClientRect();
            dropdown.style.left = `${btnRect.right + 5}px`;
            dropdown.style.top = `${btnRect.top}px`;
        }
    }
}
