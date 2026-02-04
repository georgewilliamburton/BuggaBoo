// Canvas Renderer Interface
// Defines the contract for canvas rendering operations

class ICanvasRenderer {
    /**
     * Render all objects on the canvas
     */
    renderAll() {
        throw new Error('ICanvasRenderer.renderAll() must be implemented');
    }

    /**
     * Clear the canvas
     */
    clear() {
        throw new Error('ICanvasRenderer.clear() must be implemented');
    }

    /**
     * Get the canvas element
     * @returns {HTMLCanvasElement}
     */
    getElement() {
        throw new Error('ICanvasRenderer.getElement() must be implemented');
    }

    /**
     * Set canvas background color
     * @param {string} color
     */
    setBackgroundColor(color) {
        throw new Error('ICanvasRenderer.setBackgroundColor() must be implemented');
    }

    /**
     * Get canvas dimensions
     * @returns {{width: number, height: number}}
     */
    getDimensions() {
        throw new Error('ICanvasRenderer.getDimensions() must be implemented');
    }

    /**
     * Set canvas dimensions
     * @param {number} width
     * @param {number} height
     */
    setDimensions(width, height) {
        throw new Error('ICanvasRenderer.setDimensions() must be implemented');
    }

    /**
     * Convert canvas to data URL
     * @param {string} format - Image format (png, jpeg, etc.)
     * @param {number} quality - Quality (0-1)
     * @returns {string}
     */
    toDataURL(format, quality) {
        throw new Error('ICanvasRenderer.toDataURL() must be implemented');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ICanvasRenderer = ICanvasRenderer;
}
