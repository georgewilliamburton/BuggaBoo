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
        // Ctrl/Cmd + V for paste objects
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            pasteObjects();
        }
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
    });
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
