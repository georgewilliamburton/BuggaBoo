/**
 * @fileoverview BuggaBoo Configuration Constants
 * 
 * @description
 * Centralizes all magic numbers, configuration values, and application constants.
 * Following the DRY principle, all hardcoded values should be defined here and
 * referenced throughout the application. This makes the codebase more maintainable
 * and easier to configure.
 * 
 * @example
 * // Import constants
 * const maxBrush = LIMITS.MAX_BRUSH_SIZE;
 * const toolbarWidth = UI_SIZES.LEFT_TOOLBAR_WIDTH;
 * const activeColor = COLORS.BRAND_ACCENT;
 * 
 * // Use in functions
 * function setBrushSize(size) {
 *   return Math.min(Math.max(size, LIMITS.MIN_BRUSH_SIZE), LIMITS.MAX_BRUSH_SIZE);
 * }
 * 
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 1 - Architecture Foundation
 */

/**
 * UI component dimensions in pixels
 * @const {Object}
 */
const UI_SIZES = {
    LEFT_TOOLBAR_WIDTH: 70,
    RIGHT_PALETTE_WIDTH: 90,
    LAYERS_PANEL_WIDTH: 280,
    CANVAS_PADDING: 40,
    FRAME_PREVIEW_SIZE: 90,
    LAYER_THUMBNAIL_SIZE: 40,
    ASSET_THUMBNAIL_SIZE: 150,
    TOP_MENU_HEIGHT: 50,
    BOTTOM_BAR_HEIGHT: 50,
    FRAMES_STRIP_HEIGHT: 50
};

// Performance Limits
const LIMITS = {
    UNDO_STACK_MAX: 50,
    MAX_BRUSH_SIZE: 100,
    MIN_BRUSH_SIZE: 1,
    PLAYBACK_FPS_MIN: 1,
    PLAYBACK_FPS_MAX: 60,
    PLAYBACK_FPS_DEFAULT: 12,
    VIDEO_EXPORT_FPS_MAX: 120,
    MAX_GIF_FRAMES_RECOMMENDED: 100,
    ERASER_DEFAULT_SIZE: 25,
    BRUSH_DEFAULT_SIZE: 4
};

// Color Constants
const COLORS = {
    // Brand Colors
    BRAND_ACCENT: '#E06F8B',
    BRAND_PRIMARY: '#31A2F2',
    BRAND_SUCCESS: '#A3CE27',
    
    // UI Colors
    UI_DARK: '#2c3e50',
    UI_DARK_MEDIUM: '#34495e',
    UI_DARK_HOVER: '#3d566e',
    UI_GRAY: '#95a5a6',
    UI_LIGHT_GRAY: '#ecf0f1',
    
    // Status Colors
    STATUS_INFO: '#3498db',
    STATUS_ERROR: '#e74c3c',
    STATUS_WARNING: '#f39c12',
    STATUS_SUCCESS: '#2ecc71',
    
    // Default Colors
    DEFAULT_CANVAS_BG: '#ffffff',
    DEFAULT_BRUSH_COLOR: '#000000'
};

// Storage Keys
const STORAGE_KEYS = {
    ASSETS: 'buggaboo_assets',
    AUTO_SAVE: 'buggaboo_autosave',
    AUDIO_PROJECT: 'buggaboo_audio_project',
    LAST_CANVAS_SIZE: 'buggaboo_canvas_size'
};

// Canvas Presets
const CANVAS_PRESETS = {
    SQUARE_512: { width: 512, height: 512, label: '512x512' },
    SQUARE_1024: { width: 1024, height: 1024, label: '1024x1024' },
    HD_720: { width: 1280, height: 720, label: '720p HD' },
    HD_1080: { width: 1920, height: 1080, label: '1080p Full HD' },
    PORTRAIT: { width: 1080, height: 1920, label: 'Portrait' },
    LANDSCAPE: { width: 1920, height: 1080, label: 'Landscape' }
};

// Animation Settings
const ANIMATION = {
    ONION_SKIN_OPACITY: 0.3,
    FRAME_THUMBNAIL_QUALITY: 0.7,
    GIF_FRAME_DELAY_DEFAULT: 100, // milliseconds
    VIDEO_EXPORT_QUALITY_DEFAULT: 0.95
};

// Tool Settings
const TOOLS = {
    FILL_TOLERANCE: 32,
    SHAPE_DEFAULT_STROKE_WIDTH: 2,
    SHAPE_DEFAULT_FILL: '#ffffff',
    SHADOW_BLUR: 15,
    SHADOW_COLOR: 'rgba(0, 0, 0, 0.5)'
};

// Export all constants
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UI_SIZES,
        LIMITS,
        COLORS,
        STORAGE_KEYS,
        CANVAS_PRESETS,
        ANIMATION,
        TOOLS
    };
}
