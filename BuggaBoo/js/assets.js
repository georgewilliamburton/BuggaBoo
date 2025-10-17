// Assets Management System
// Save and reuse groups of objects across frames

let assets = [];
const ASSETS_STORAGE_KEY = 'buggaboo_assets';

// Load assets from localStorage on startup
function loadAssetsFromStorage() {
    try {
        const stored = localStorage.getItem(ASSETS_STORAGE_KEY);
        if (stored) {
            assets = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading assets:', error);
        assets = [];
    }
}

// Save assets to localStorage
function saveAssetsToStorage() {
    try {
        localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
    } catch (error) {
        console.error('Error saving assets:', error);
    }
}

// Toggle assets dropdown
function toggleAssetsDropdown() {
    const dropdown = document.getElementById('assets-dropdown');
    const isOpen = dropdown.classList.contains('show');
    
    // Close all dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
    
    if (!isOpen) {
        dropdown.classList.add('show');
        
        // Update Save Selection button state
        updateSaveSelectionButton();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown-container')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Update the Save Selection button (enable/disable based on selection)
function updateSaveSelectionButton() {
    const dropdown = document.getElementById('assets-dropdown');
    const saveButton = dropdown.querySelector('.dropdown-item:first-child');
    
    if (canvas) {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            saveButton.disabled = false;
        } else {
            saveButton.disabled = true;
        }
    }
}

// Save selected object(s) as an asset
function saveAsset() {
    if (!canvas) return;
    
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) {
        alert('Please select one or more objects to save as an asset.');
        return;
    }
    
    // Prompt for asset name
    const assetName = prompt('Name your asset:', 'My Asset');
    if (!assetName) return; // User cancelled
    
    // Create a group from selected objects
    let assetData;
    if (activeObjects.length === 1) {
        assetData = activeObjects[0].toJSON();
    } else {
        // Multiple objects - create a group
        const group = new fabric.Group(activeObjects);
        assetData = group.toJSON();
        canvas.remove(group); // Remove temporary group
        // Re-add original objects
        activeObjects.forEach(obj => canvas.add(obj));
    }
    
    // Generate thumbnail
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 150;
    tempCanvas.height = 150;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Create temporary Fabric canvas for thumbnail
    const thumbCanvas = new fabric.StaticCanvas(tempCanvas);
    thumbCanvas.backgroundColor = '#ffffff';
    
    fabric.util.enlivenObjects([assetData], function(objects) {
        const obj = objects[0];
        
        // Center and scale to fit thumbnail
        const scale = Math.min(140 / obj.width, 140 / obj.height);
        obj.scale(scale);
        obj.set({
            left: 75,
            top: 75,
            originX: 'center',
            originY: 'center'
        });
        
        thumbCanvas.add(obj);
        thumbCanvas.renderAll();
        
        // Save asset
        const asset = {
            id: Date.now(),
            name: assetName,
            json: assetData,
            thumbnail: tempCanvas.toDataURL('image/png'),
            created: new Date().toISOString()
        };
        
        assets.push(asset);
        saveAssetsToStorage();
        
        // Close dropdown and show success message
        toggleAssetsDropdown();
        
        // Show brief confirmation
        const saveButton = document.querySelector('.dropdown-item');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '✓ Saved!';
        setTimeout(() => {
            saveButton.innerHTML = originalText;
        }, 1500);
    });
}

// Show assets library modal
function showAssetsLibrary() {
    // Close dropdown
    toggleAssetsDropdown();
    
    // Show modal
    const modal = document.getElementById('assets-modal');
    modal.classList.add('show');
    
    // Render assets
    renderAssetsGrid();
}

// Close assets library modal
function closeAssetsLibrary() {
    const modal = document.getElementById('assets-modal');
    modal.classList.remove('show');
}

// Render the assets grid
function renderAssetsGrid() {
    const grid = document.getElementById('assets-grid');
    
    if (assets.length === 0) {
        grid.innerHTML = '<div class="assets-empty">No assets saved yet. Select objects and use "Save Selection" to create assets!</div>';
        return;
    }
    
    grid.innerHTML = '';
    
    assets.forEach(asset => {
        const item = document.createElement('div');
        item.className = 'asset-item';
        item.onclick = () => addAssetToCanvas(asset);
        
        item.innerHTML = `
            <div class="asset-thumbnail">
                <img src="${asset.thumbnail}" alt="${asset.name}">
            </div>
            <div class="asset-name" title="${asset.name}">${asset.name}</div>
            <button class="asset-delete" onclick="deleteAsset(${asset.id}, event)" title="Delete Asset">×</button>
        `;
        
        grid.appendChild(item);
    });
}

// Add asset to canvas
function addAssetToCanvas(asset) {
    if (!canvas) return;
    
    fabric.util.enlivenObjects([asset.json], function(objects) {
        const obj = objects[0];
        
        // Position in center of canvas
        obj.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center'
        });
        
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
        
        // Save state for undo
        saveCanvasState();
        markAsChanged();
    });
    
    // Close modal
    closeAssetsLibrary();
}

// Delete an asset
function deleteAsset(assetId, event) {
    event.stopPropagation(); // Prevent adding asset when clicking delete
    
    if (!confirm('Delete this asset?')) return;
    
    assets = assets.filter(a => a.id !== assetId);
    saveAssetsToStorage();
    renderAssetsGrid();
}

// Export assets to JSON file
function exportAssets() {
    if (assets.length === 0) {
        alert('No assets to export!');
        return;
    }
    
    // Create JSON data
    const dataStr = JSON.stringify(assets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buggaboo-assets-${Date.now()}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show confirmation
    alert(`Exported ${assets.length} asset(s) successfully!`);
}

// Import assets from JSON file
function importAssets(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedAssets = JSON.parse(e.target.result);
            
            // Validate structure
            if (!Array.isArray(importedAssets)) {
                throw new Error('Invalid file format');
            }
            
            // Ask user if they want to merge or replace
            let shouldReplace = false;
            if (assets.length > 0) {
                shouldReplace = confirm(
                    `You have ${assets.length} existing asset(s). ` +
                    `Do you want to REPLACE them?\n\n` +
                    `Click OK to REPLACE (delete existing)\n` +
                    `Click Cancel to MERGE (keep existing + add new)`
                );
            }
            
            if (shouldReplace) {
                assets = importedAssets;
            } else {
                // Merge: update IDs to avoid conflicts
                const maxId = assets.length > 0 ? Math.max(...assets.map(a => a.id)) : 0;
                importedAssets.forEach((asset, index) => {
                    asset.id = maxId + index + 1;
                    assets.push(asset);
                });
            }
            
            // Save and refresh
            saveAssetsToStorage();
            renderAssetsGrid();
            
            alert(`Successfully imported ${importedAssets.length} asset(s)!`);
        } catch (error) {
            alert('Error importing assets: ' + error.message);
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    
    // Reset input so same file can be imported again
    event.target.value = '';
}

// Initialize assets on page load
function initializeAssets() {
    loadAssetsFromStorage();
}
