// Canvas Object Manager Interface
// Defines the contract for managing canvas objects

class ICanvasObjectManager {
    /**
     * Get all objects on the canvas
     * @returns {Array}
     */
    getObjects() {
        throw new Error('ICanvasObjectManager.getObjects() must be implemented');
    }

    /**
     * Add an object to the canvas
     * @param {*} object
     */
    add(object) {
        throw new Error('ICanvasObjectManager.add() must be implemented');
    }

    /**
     * Remove an object from the canvas
     * @param {*} object
     */
    remove(object) {
        throw new Error('ICanvasObjectManager.remove() must be implemented');
    }

    /**
     * Get the active object
     * @returns {*}
     */
    getActiveObject() {
        throw new Error('ICanvasObjectManager.getActiveObject() must be implemented');
    }

    /**
     * Set the active object
     * @param {*} object
     */
    setActiveObject(object) {
        throw new Error('ICanvasObjectManager.setActiveObject() must be implemented');
    }

    /**
     * Discard the active object selection
     */
    discardActiveObject() {
        throw new Error('ICanvasObjectManager.discardActiveObject() must be implemented');
    }

    /**
     * Bring object to front
     * @param {*} object
     */
    bringToFront(object) {
        throw new Error('ICanvasObjectManager.bringToFront() must be implemented');
    }

    /**
     * Send object to back
     * @param {*} object
     */
    sendToBack(object) {
        throw new Error('ICanvasObjectManager.sendToBack() must be implemented');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ICanvasObjectManager = ICanvasObjectManager;
}
