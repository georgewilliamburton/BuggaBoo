// Canvas Serializer Interface
// Defines the contract for canvas serialization operations

class ICanvasSerializer {
    /**
     * Serialize canvas to JSON
     * @param {string[]} propertiesToInclude - Additional properties to include
     * @returns {Object}
     */
    toJSON(propertiesToInclude) {
        throw new Error('ICanvasSerializer.toJSON() must be implemented');
    }

    /**
     * Load canvas from JSON
     * @param {Object} json - JSON representation
     * @param {Function} callback - Callback after loading
     */
    loadFromJSON(json, callback) {
        throw new Error('ICanvasSerializer.loadFromJSON() must be implemented');
    }

    /**
     * Serialize canvas to SVG
     * @returns {string}
     */
    toSVG() {
        throw new Error('ICanvasSerializer.toSVG() must be implemented');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ICanvasSerializer = ICanvasSerializer;
}
