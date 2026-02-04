/**
 * @fileoverview Global Layers Management Module
 * 
 * @description
 * Manages global layer functionality, allowing objects to be synchronized across
 * all animation frames. Global layers are objects that appear in multiple frames
 * and maintain synchronization - changes to one instance propagate to all frames.
 * 
 * Key Concepts:
 * - **Global Layer**: An object synced across multiple frames
 * - **globalId**: Unique identifier linking objects across frames
 * - **Exclusions**: Frames that opt-out of a specific global layer
 * 
 * Workflows:
 * - **Enable on All**: Creates/updates object in all frames
 * - **Link Existing**: Links similar objects already present in frames
 * - **Unlink Frame**: Removes global link for current frame only
 * 
 * @example
 * // Make object global across all frames
 * enableGlobalOnAllFrames(layerIndex);
 * 
 * // Link existing similar objects
 * linkCurrentFramesOnly(layerIndex);
 * 
 * // Unlink from current frame only
 * unlinkThisFrame(layerIndex);
 * 
 * @module layers/global-layers
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 3 - File Splitting
 * @requires canvas - Global Fabric.js canvas instance
 * @requires frames - Global frames array
 * @requires currentFrame - Global current frame index
 * @requires fabric - Fabric.js library
 */

// ============================================
// Phase 3: Module Split from layers.js
// ============================================

/**
 * Enable global layer on all frames
 * Marks object as global and syncs it to all frames
 * @function
 * @param {number} index - Layer index
 * @emits layer:global:enabled - When layer is marked as global
 */
function enableGlobalOnAllFrames(index) {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    saveCanvasState();
    
    // Mark as global layer
    if (!obj.globalId) {
        obj.globalId = `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    obj.isGlobalLayer = true;
    
    // Remove from current frame's exclusions if present
    if (currentFrame >= 0 && frames[currentFrame]) {
        if (!frames[currentFrame].globalExclusions) {
            frames[currentFrame].globalExclusions = [];
        }
        frames[currentFrame].globalExclusions = frames[currentFrame].globalExclusions.filter(
            id => id !== obj.globalId
        );
    }
    
    // Sync to all other frames
    syncObjectToAllFrames(obj, currentFrame);
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:global:enabled', {
            index: index,
            globalId: obj.globalId,
            frameCount: frames.length
        });
    }
}

/**
 * Link existing objects across frames only
 * Links similar objects at the same position without creating new ones
 * @param {number} index - Layer index
 */
function linkCurrentFramesOnly(index) {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj) return;
    
    saveCanvasState();
    
    // Mark as global
    if (!obj.globalId) {
        obj.globalId = `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    obj.isGlobalLayer = true;
    
    // Link existing objects
    linkExistingObjects(obj, index);
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:global:linked', {
            index: index,
            globalId: obj.globalId
        });
    }
}

/**
 * Unlink this frame from a global layer
 * @param {number} index - Layer index
 */
function unlinkThisFrame(index) {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const obj = objects[index];
    
    if (!obj || !obj.isGlobalLayer) return;
    
    saveCanvasState();
    
    // Add to current frame's exclusions
    if (currentFrame >= 0 && frames[currentFrame]) {
        if (!frames[currentFrame].globalExclusions) {
            frames[currentFrame].globalExclusions = [];
        }
        
        if (!frames[currentFrame].globalExclusions.includes(obj.globalId)) {
            frames[currentFrame].globalExclusions.push(obj.globalId);
        }
    }
    
    // Unmark as global in this frame
    obj.isGlobalLayer = false;
    obj.globalId = undefined;
    
    canvas.renderAll();
    updateLayersList();
    markAsChanged();
    
    // Emit event
    if (window.eventBus) {
        window.eventBus.emit('layer:global:unlinked', {
            index: index,
            frameIndex: currentFrame
        });
    }
}

/**
 * Sync an object to all frames (except excluded ones)
 * @param {Object} sourceObj - Source object to sync
 * @param {number} sourceFrameIndex - Source frame index
 */
function syncObjectToAllFrames(sourceObj, sourceFrameIndex) {
    if (!sourceObj || !sourceObj.globalId) return;
    
    const globalId = sourceObj.globalId;
    
    frames.forEach((frame, frameIndex) => {
        // Skip source frame
        if (frameIndex === sourceFrameIndex) return;
        
        // Skip if frame has excluded this global layer
        if (frame.globalExclusions && frame.globalExclusions.includes(globalId)) {
            return;
        }
        
        if (!frame.canvasData) return;
        
        try {
            const tempCanvas = new fabric.Canvas(document.createElement('canvas'));
            tempCanvas.loadFromJSON(frame.canvasData, () => {
                // Find existing global object
                const objects = tempCanvas.getObjects();
                const existingIndex = objects.findIndex(obj => obj.globalId === globalId);
                
                // Clone the source object
                sourceObj.clone((cloned) => {
                    cloned.globalId = globalId;
                    cloned.isGlobalLayer = true;
                    
                    if (existingIndex >= 0) {
                        // Replace existing
                        tempCanvas.remove(objects[existingIndex]);
                        tempCanvas.insertAt(cloned, existingIndex);
                    } else {
                        // Add new
                        tempCanvas.add(cloned);
                    }
                    
                    frame.canvasData = JSON.stringify(tempCanvas);
                    tempCanvas.dispose();
                });
            });
        } catch (err) {
            console.error(`Error syncing to frame ${frameIndex}:`, err);
        }
    });
}

/**
 * Link existing similar objects across frames
 * @param {Object} sourceObj - Source object
 * @param {number} sourceIndex - Source object index
 */
function linkExistingObjects(sourceObj, sourceIndex) {
    if (!sourceObj || !sourceObj.globalId) return;
    
    const globalId = sourceObj.globalId;
    
    frames.forEach((frame, frameIndex) => {
        if (frameIndex === currentFrame) return;
        
        if (!frame.canvasData) return;
        
        try {
            const tempCanvas = new fabric.Canvas(document.createElement('canvas'));
            tempCanvas.loadFromJSON(frame.canvasData, () => {
                const objects = tempCanvas.getObjects();
                
                // Find object at same index
                if (objects[sourceIndex]) {
                    const targetObj = objects[sourceIndex];
                    
                    // Check if similar type
                    if (targetObj.type === sourceObj.type) {
                        targetObj.globalId = globalId;
                        targetObj.isGlobalLayer = true;
                        
                        frame.canvasData = JSON.stringify(tempCanvas);
                    }
                }
                
                tempCanvas.dispose();
            });
        } catch (err) {
            console.error(`Error linking object in frame ${frameIndex}:`, err);
        }
    });
}
