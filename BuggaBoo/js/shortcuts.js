// Keyboard Shortcuts
// Handles all keyboard shortcuts and hotkeys

// Clipboard for copy/paste
let objectClipboard = null;

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    // Warn before leaving page
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges || canvas.getObjects().length > 0 || frames.length > 0) {
            e.preventDefault();
            e.returnValue = ''; // Chrome requires returnValue to be set
            return ''; // Some browsers show this message
        }
    });

    // Handle paste from system clipboard (images from Windows clipboard)
    document.addEventListener('paste', function(e) {
        // Only handle if not typing in input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const items = e.clipboardData?.items;
        if (!items) {
            // No clipboard data, try internal object paste
            pasteObjects();
            return;
        }
        
        // Look for image in clipboard
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                pasteImageFromSystemClipboard(blob);
                return;
            }
        }
        
        // No image found, use internal object paste
        pasteObjects();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ignore if typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            undo();
            return;
        }
        
        // Ctrl/Cmd + Shift + Z for redo
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            redo();
            return;
        }
        
        // Ctrl/Cmd + Y for redo (alternative)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo();
            return;
        }
        // Ctrl/Cmd + A for select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            selectAllObjects();
        }
        // Ctrl/Cmd + S for save project
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProject();
        }
        // S key for select tool
        if (e.key === 's' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setTool('select');
        }
        // D key for draw tool
        if (e.key === 'd' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setTool('draw');
        }
        // F key for fill tool
        if (e.key === 'f' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setTool('fill');
        }
        // L key for layers panel
        if (e.key === 'l' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            toggleLayersPanel();
        }
        // Spacebar for play/pause animation
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            togglePlayback();
        }
        // Ctrl/Cmd + C for copy selected objects
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            copySelectedObjects();
        }
        // Ctrl/Cmd + V for paste - handled by paste event listener
        // (removed from here to allow system clipboard paste to work)
        
        // N key for new frame
        if (e.key === 'n' && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            addNewFrame();
        }
        // Shift + N for duplicate frame
        if (e.key === 'N' && e.shiftKey && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            duplicateCurrentFrame();
        }
        // Delete key to delete selected objects
        if (e.key === 'Delete' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            deleteSelectedObjects();
        }
        // Ctrl/Cmd + L to lock/unlock selected object
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            toggleSelectedObjectLock();
        }
        // Arrow Left - Previous frame
        if (e.key === 'ArrowLeft' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            navigateToPreviousFrame();
        }
        // Arrow Right - Next frame
        if (e.key === 'ArrowRight' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            navigateToNextFrame();
        }
    });
}

// Navigate to previous frame
function navigateToPreviousFrame() {
    if (currentFrame > 0) {
        loadFrame(currentFrame - 1);
    } else if (frames.length > 0) {
        // Wrap around to last frame
        loadFrame(frames.length - 1);
    }
}

// Navigate to next frame
function navigateToNextFrame() {
    if (currentFrame < frames.length - 1) {
        loadFrame(currentFrame + 1);
    } else if (frames.length > 0) {
        // Wrap around to first frame
        loadFrame(0);
    }
}

// Copy selected objects to clipboard
function copySelectedObjects() {
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject) {
        showInfoModal('Nothing Selected', '⚠️ Please select an object to copy.', '⚠️');
        return;
    }
    
    // Handle single object
    if (activeObject.type !== 'activeSelection') {
        objectClipboard = {
            isSingleObject: true,
            data: JSON.stringify(activeObject.toJSON())
        };
        return;
    }
    
    // Handle multiple objects (activeSelection)
    const objects = activeObject.getObjects ? activeObject.getObjects() : [activeObject];
    const objectsData = objects.map(obj => JSON.stringify(obj.toJSON()));
    
    objectClipboard = {
        isSingleObject: false,
        data: objectsData
    };
}

// Paste objects from clipboard
function pasteObjects() {
    if (!objectClipboard) {
        showInfoModal('Empty Clipboard', '⚠️ Nothing to paste! Copy objects first with Ctrl+C.', '⚠️');
        return;
    }
    
    // Switch to select tool so pasted objects are immediately moveable
    setTool('select');
    
    // Deselect current selection
    canvas.discardActiveObject();
    
    try {
        if (objectClipboard.isSingleObject) {
            // Single object paste
            const objData = JSON.parse(objectClipboard.data);
            
            // Offset the pasted object slightly so it's visible
            objData.left += 20;
            objData.top += 20;
            
            fabric.util.enlivenObjects([objData], (objects) => {
                objects.forEach(obj => {
                    canvas.add(obj);
                });
                
                // Select the pasted object so user can move it immediately
                if (objects.length === 1) {
                    canvas.setActiveObject(objects[0]);
                }
                
                canvas.renderAll();
                saveCanvasState();
                markAsChanged();
                updatePreview();
            });
        } else {
            // Multiple objects paste
            const allObjData = objectClipboard.data.map(dataStr => JSON.parse(dataStr));
            
            // Offset all objects
            allObjData.forEach(objData => {
                objData.left += 20;
                objData.top += 20;
            });
            
            fabric.util.enlivenObjects(allObjData, (objects) => {
                objects.forEach(obj => {
                    canvas.add(obj);
                });
                
                // Create active selection with all pasted objects
                if (objects.length > 1) {
                    const selection = new fabric.ActiveSelection(objects, {
                        canvas: canvas
                    });
                    canvas.setActiveObject(selection);
                } else if (objects.length === 1) {
                    canvas.setActiveObject(objects[0]);
                }
                
                canvas.renderAll();
                saveCanvasState();
                markAsChanged();
                updatePreview();
            });
        }
        
    } catch (error) {
        console.error('Paste error:', error);
        showInfoModal('Paste Error', '❌ Could not paste object: ' + error.message, '❌');
    }
}

// Delete selected objects
function deleteSelectedObjects() {
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject) {
        return; // Nothing selected, silently return
    }
    
    // Handle multiple objects (activeSelection)
    if (activeObject.type === 'activeSelection') {
        const objects = activeObject.getObjects ? activeObject.getObjects() : [];
        objects.forEach(obj => {
            canvas.remove(obj);
        });
    } else {
        // Single object
        canvas.remove(activeObject);
    }
    
    canvas.discardActiveObject();
    canvas.renderAll();
    saveCanvasState();
    markAsChanged();
    updatePreview();
}

// Paste image from system clipboard (Windows clipboard, screenshots, etc.)
function pasteImageFromSystemClipboard(blob) {
    if (!blob) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        fabric.Image.fromURL(event.target.result, function(img) {
            // Scale if image is too large for canvas
            const maxWidth = canvas.width * 0.8;
            const maxHeight = canvas.height * 0.8;
            
            if (img.width > maxWidth || img.height > maxHeight) {
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                img.scale(scale);
            }
            
            // Center the image on canvas
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            
            // Switch to select tool so user can move/resize immediately
            setTool('select');
            
            saveCanvasState();
            markAsChanged();
            updatePreview();
        });
    };
    reader.readAsDataURL(blob);
}

// Toggle lock on selected object
function toggleSelectedObjectLock() {
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject) {
        showInfoModal('Nothing Selected', '⚠️ Please select an object to lock/unlock.', '⚠️');
        return;
    }
    
    // Handle multiple objects (activeSelection)
    if (activeObject.type === 'activeSelection') {
        const objects = activeObject.getObjects ? activeObject.getObjects() : [];
        const newLockState = !objects[0].selectable; // Toggle based on first object's state
        
        objects.forEach(obj => {
            obj.selectable = newLockState;
            obj.evented = newLockState;
            obj.hasControls = newLockState;
            obj.hasBorders = newLockState;
            obj.lockMovementX = !newLockState;
            obj.lockMovementY = !newLockState;
            obj.lockRotation = !newLockState;
            obj.lockScalingX = !newLockState;
            obj.lockScalingY = !newLockState;
        });
        
        // Deselect after locking
        if (!newLockState) {
            canvas.discardActiveObject();
        }
    } else {
        // Single object
        const newLockState = !activeObject.selectable;
        
        activeObject.selectable = newLockState;
        activeObject.evented = newLockState;
        activeObject.hasControls = newLockState;
        activeObject.hasBorders = newLockState;
        activeObject.lockMovementX = !newLockState;
        activeObject.lockMovementY = !newLockState;
        activeObject.lockRotation = !newLockState;
        activeObject.lockScalingX = !newLockState;
        activeObject.lockScalingY = !newLockState;
        
        // Deselect after locking
        if (!newLockState) {
            canvas.discardActiveObject();
        }
    }
    
    canvas.renderAll();
    updateLayersList();
    // Don't call saveCanvasState() - lock states are managed separately
    markAsChanged();
}
