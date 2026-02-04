/**
 * @fileoverview Layer Operations Module
 * 
 * @description
 * Handles individual layer actions including selection, locking, visibility toggling,
 * and deletion. This module contains the business logic for layer manipulation,
 * separated from UI concerns.
 * 
 * Key Features:
 * - Layer selection and highlighting
 * - Lock/unlock functionality
 * - Visibility toggling
 * - Safe deletion with global layer handling
 * - Canvas state management integration
 * 
 * @example
 * // Select a layer
 * selectLayer(2);
 * 
 * // Toggle lock state
 * toggleLayerLock(2);
 * 
 * // Delete layer (prompts for global layers)
 * deleteLayer(2);
 * 
 * @module layers/layer-operations
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 3 - File Splitting
 * @requires canvas - Global Fabric.js canvas instance
 * @requires saveCanvasState - Undo/redo functionality
 * @requires markAsChanged - Project change tracking
 */

// ============================================
// Phase 3: Module Split from layers.js
// ============================================

/**
 * Select a specific layer
 * @function
 * @param {number} index - Layer index to select
 * @emits layer:selected - When layer is selected
 */
function selectLayer(index) {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    canvas.setActiveObject(obj);
    canvas.renderAll();
    updateLayersList();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:selected', {
            index: index,
            objectType: obj.type
        });
    }
}

/**
 * Toggle layer lock/unlock
 * @param {number} index - Layer index
 */
function toggleLayerLock(index) {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    saveCanvasState();
    
    obj.selectable = obj.selectable === false;
    obj.evented = obj.selectable;
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:lock:toggled', {
            index: index,
            locked: !obj.selectable
        });
    }
}

/**
 * Toggle layer visibility
 * @param {number} index - Layer index
 */
function toggleLayerVisibility(index) {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    saveCanvasState();
    
    obj.visible = obj.visible === false ? true : false;
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    updatePreview();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:visibility:toggled', {
            index: index,
            visible: obj.visible
        });
    }
}

/**
 * Delete a layer
 * @param {number} index - Layer index
 */
function deleteLayer(index) {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    // Check if this is a global layer
    if (obj.isGlobalLayer) {
        showGlobalDeleteModal(obj, index);
        return;
    }
    
    // Simple delete
    saveCanvasState();
    canvas.remove(obj);
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    updatePreview();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:deleted', {
            index: index,
            isGlobal: false
        });
    }
}

/**
 * Show modal for deleting global layers
 * @param {Object} obj - Fabric.js object
 * @param {number} index - Object index
 */
function showGlobalDeleteModal(obj, index) {
    const modalId = 'global-delete-modal';
    let modal = document.getElementById(modalId);
    
    // Remove existing modal if present
    if (modal) {
        modal.remove();
    }
    
    // Create modal
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-header">
                <h2>Delete Global Layer</h2>
                <button class="close-btn" onclick="document.getElementById('${modalId}').remove()">×</button>
            </div>
            <div class="modal-body">
                <p><strong>This is a global layer</strong> that appears across multiple frames.</p>
                <p>How would you like to delete it?</p>
                
                <div style="margin-top: 20px;">
                    <button class="btn" id="delete-current-only" style="width: 100%; margin-bottom: 10px;">
                        🗑️ Delete from Current Frame Only
                    </button>
                    <button class="btn btn-danger" id="delete-all-frames" style="width: 100%;">
                        ⚠️ Delete from ALL Frames
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Delete current only
    document.getElementById('delete-current-only').onclick = () => {
        saveCanvasState();
        canvas.remove(obj);
        canvas.renderAll();
        updateLayersList();
        markAsChanged();
        updatePreview();
        modal.remove();
        
        // Emit event
        if (window.eventBus) {
            window.eventBus.emit('layer:deleted', {
                index: index,
                isGlobal: true,
                deleteScope: 'current'
            });
        }
    };
    
    // Delete all frames
    document.getElementById('delete-all-frames').onclick = () => {
        deleteGlobalFromAllFrames(obj);
        modal.remove();
    };
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

/**
 * Delete a global layer from all frames
 * @param {Object} globalObj - The global object to delete
 */
function deleteGlobalFromAllFrames(globalObj) {
    if (!globalObj || !globalObj.globalId) return;
    
    const globalId = globalObj.globalId;
    
    saveCanvasState();
    
    // Delete from all frames
    frames.forEach((frame, frameIndex) => {
        if (!frame.canvasData) return;
        
        try {
            const tempCanvas = new fabric.Canvas(document.createElement('canvas'));
            tempCanvas.loadFromJSON(frame.canvasData, () => {
                const objects = tempCanvas.getObjects();
                const toRemove = objects.filter(obj => obj.globalId === globalId);
                
                toRemove.forEach(obj => {
                    tempCanvas.remove(obj);
                });
                
                frame.canvasData = JSON.stringify(tempCanvas);
                tempCanvas.dispose();
            });
        } catch (err) {
            console.error(`Error removing global object from frame ${frameIndex}:`, err);
        }
    });
    
    // Delete from current canvas
    canvas.remove(globalObj);
    canvas.renderAll();
    
    updateLayersList();
    markAsChanged();
    updatePreview();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:deleted', {
            globalId: globalId,
            isGlobal: true,
            deleteScope: 'all'
        });
    }
}
