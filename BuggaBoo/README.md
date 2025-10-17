# BuggaBoo Animation Maker

A child-friendly animation maker with separated, organized code structure.

## Project Structure

```
BuggaBoo/
├── index.html              # Main HTML file
├── css/
│   ├── styles.css          # Main application styles
│   └── modal.css           # Warning modal styles
└── js/
    ├── canvas.js           # Canvas creation & management
    ├── tools.js            # Drawing tools (draw, select, eraser)
    ├── frames.js           # Frame management & export
    ├── ui.js               # Modal and UI management
    ├── shortcuts.js        # Keyboard shortcuts
    └── init.js             # Application initialization
```

## File Responsibilities

### CSS Files

**styles.css** - Main application styling
- Layout (grid, flexbox)
- Top menu bar
- Canvas size selector
- Left toolbar (tools)
- Canvas area
- Right palette (brushes & colors)
- Bottom frames strip
- Scrollbars

**modal.css** - Warning modal styling
- Modal overlay
- Modal dialog
- Modal buttons
- Modal animations

### JavaScript Files

**canvas.js** - Canvas Management
- `createNewCanvas(width, height)` - Initialize new canvas
- `createFullscreenCanvas()` - Create canvas to fit viewport
- `clearCanvas()` - Clear current canvas
- `undo()` - Undo last action
- Fabric.js configuration
- Custom rotation controls

**tools.js** - Drawing Tools
- `setTool(tool)` - Switch between draw/select/eraser
- `setColor(color)` - Set drawing color
- `setCustomColor(color)` - Set custom color from picker
- `setBrushSize(size)` - Change brush size
- `updateBrushSizeColors()` - Update brush preview colors

**frames.js** - Frame Management
- `saveFrame()` - Save current canvas as frame
- `addNewFrame()` - Create new blank frame
- `loadFrame(index)` - Load a specific frame
- `updateFramesDisplay()` - Refresh frames strip
- `exportAnimation()` - Download all frames as PNGs

**ui.js** - UI & Modal Management
- `showWarningModal(message, action)` - Display warning
- `closeWarningModal()` - Hide warning modal
- `confirmAction(shouldSave)` - Handle modal confirmation
- `checkUnsavedChanges(action, message)` - Check before destructive actions

**shortcuts.js** - Keyboard Shortcuts
- Ctrl/Cmd + Z: Undo
- Ctrl/Cmd + S: Save frame
- Spacebar: Add new frame
- Page unload warning

**init.js** - Application Initialization
- Initialize canvas on page load
- Set up keyboard shortcuts
- Initial UI state

## Features

- **5 Brush Sizes**: 2px, 4px, 8px, 16px, 32px
- **14 Colors**: 13 preset + custom color picker
- **3 Tools**: Draw, Select, Eraser
- **Rotation Controls**: Rotate selected objects with custom icon
- **6 Canvas Presets**: Square, Cinema, Portrait, Wide, Large, YouTube
- **Frame Management**: Save, load, export frames
- **Keyboard Shortcuts**: Quick access to common actions
- **Unsaved Changes Warning**: Modal to prevent data loss

## Usage

Open `index.html` in a web browser to start the application.

## Development

To modify specific features:
- **Styling**: Edit CSS files in `css/`
- **Tools**: Edit `js/tools.js`
- **Canvas behavior**: Edit `js/canvas.js`
- **Frame system**: Edit `js/frames.js`
- **Keyboard shortcuts**: Edit `js/shortcuts.js`

## Browser Compatibility

Requires a modern browser that supports:
- HTML5 Canvas
- ES6 JavaScript
- Fabric.js 5.3.0
- CSS Grid & Flexbox

## Credits

Built with Fabric.js for canvas manipulation.
Designed for accessibility and child-friendly use.
