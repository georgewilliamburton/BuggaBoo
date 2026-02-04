/**
 * @fileoverview Fabric.js Canvas Adapter
 * 
 * @description
 * Adapter pattern implementation that wraps Fabric.js Canvas to conform to our
 * internal interfaces (ICanvasRenderer, ICanvasSerializer, ICanvasObjectManager).
 * This abstraction allows us to potentially swap rendering libraries in the future
 * without rewriting the entire application.
 * 
 * Implements:
 * - ICanvasRenderer: Rendering and display operations
 * - ICanvasSerializer: Serialization/deserialization (JSON, images)
 * - ICanvasObjectManager: Object manipulation and management
 * 
 * @example
 * // Create Fabric canvas
 * const fabricCanvas = new fabric.Canvas('canvas-id');
 * 
 * // Wrap with adapter
 * const adapter = new FabricCanvasAdapter(fabricCanvas);
 * 
 * // Use through interface
 * adapter.renderAll();
 * adapter.addObject(fabricObject);
 * const json = adapter.toJSON();
 * 
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 1 - Architecture Foundation
 * @see {@link ICanvasRenderer}
 * @see {@link ICanvasSerializer}
 * @see {@link ICanvasObjectManager}
 */

/**
 * Adapter for Fabric.js Canvas
 * @class
 * @implements {ICanvasRenderer}
 * @implements {ICanvasSerializer}
 * @implements {ICanvasObjectManager}
 */
class FabricCanvasAdapter {
    /**
     * @param {fabric.Canvas} fabricCanvas - The Fabric.js canvas instance
     */
    constructor(fabricCanvas) {
        if (!fabricCanvas) {
            throw new Error('FabricCanvasAdapter requires a Fabric.js canvas instance');
        }
        this._canvas = fabricCanvas;
    }

    // ============================================
    // ICanvasRenderer Implementation
    // ============================================

    renderAll() {
        return this._canvas.renderAll();
    }

    clear() {
        return this._canvas.clear();
    }

    getElement() {
        return this._canvas.getElement();
    }

    setBackgroundColor(color) {
        this._canvas.backgroundColor = color;
    }

    getBackgroundColor() {
        return this._canvas.backgroundColor;
    }

    getDimensions() {
        return {
            width: this._canvas.width,
            height: this._canvas.height
        };
    }

    setDimensions(width, height) {
        this._canvas.setWidth(width);
        this._canvas.setHeight(height);
    }

    toDataURL(format = 'png', quality = 1) {
        return this._canvas.toDataURL({
            format: format,
            quality: quality
        });
    }

    // ============================================
    // ICanvasSerializer Implementation
    // ============================================

    toJSON(propertiesToInclude = []) {
        return this._canvas.toJSON(propertiesToInclude);
    }

    loadFromJSON(json, callback) {
        return this._canvas.loadFromJSON(json, callback);
    }

    toSVG() {
        return this._canvas.toSVG();
    }

    // ============================================
    // ICanvasObjectManager Implementation
    // ============================================

    getObjects() {
        return this._canvas.getObjects();
    }

    add(object) {
        return this._canvas.add(object);
    }

    remove(object) {
        return this._canvas.remove(object);
    }

    getActiveObject() {
        return this._canvas.getActiveObject();
    }

    setActiveObject(object) {
        return this._canvas.setActiveObject(object);
    }

    discardActiveObject() {
        return this._canvas.discardActiveObject();
    }

    bringToFront(object) {
        return this._canvas.bringToFront(object);
    }

    sendToBack(object) {
        return this._canvas.sendToBack(object);
    }

    // ============================================
    // Additional Fabric.js Specific Methods
    // ============================================

    /**
     * Get the underlying Fabric.js canvas
     * Use this only when you absolutely need Fabric-specific features
     * @returns {fabric.Canvas}
     */
    getFabricCanvas() {
        return this._canvas;
    }

    /**
     * Check if drawing mode is enabled
     * @returns {boolean}
     */
    isDrawingMode() {
        return this._canvas.isDrawingMode;
    }

    /**
     * Set drawing mode
     * @param {boolean} enabled
     */
    setDrawingMode(enabled) {
        this._canvas.isDrawingMode = enabled;
    }

    /**
     * Get the free drawing brush
     * @returns {*}
     */
    getFreeDrawingBrush() {
        return this._canvas.freeDrawingBrush;
    }

    /**
     * Listen to canvas events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        return this._canvas.on(event, handler);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(event, handler) {
        return this._canvas.off(event, handler);
    }

    /**
     * Request canvas render (non-immediate)
     */
    requestRenderAll() {
        return this._canvas.requestRenderAll();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.FabricCanvasAdapter = FabricCanvasAdapter;
}
