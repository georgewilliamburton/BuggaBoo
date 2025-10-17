# BuggaBoo Studio - Project History & Documentation

## Project Origin
**Created:** October 17, 2025  
**Purpose:** Animation maker for a 7-year-old autistic daughter who found Brush Ninja calming  
**Goal:** Create a fully local, standalone version with exact UI emulation and enhanced features

## Development Journey

### Phase 1: Initial Setup
- Started from scraped Brush Ninja page with broken functionality
- Fixed image paths and canvas initialization issues
- Created standalone version with full UI clone
- Initialized git repository (first commit: bc9dba4)

### Phase 2: Frame Management
- Added scrollable frames strip at bottom
- Created preview panel with live canvas updates
- Implemented duplicate frame functionality
- Added delete frame with confirmation modal
- Fixed bugs with frame numbering and duplicate overwriting wrong frames

### Phase 3: Keyboard Shortcuts
- D key: Draw tool
- S key: Select tool
- F key: Fill tool
- Shift+Spacebar: Duplicate frame
- Space: New frame
- Ctrl+Z: Undo
- Ctrl+Shift+Z / Ctrl+Y: Redo
- L key: Toggle layers panel

### Phase 4: Canvas Size Selection
- Added modal on startup for canvas size selection
- 6 canvas sizes: Square, Cinema, Portrait, Wide, Large, YouTube
- Color-coded buttons matching existing design
- Fixed critical bug: Drawing coordinate offset on certain canvas sizes
  - **Solution:** Removed CSS max-width/max-height scaling that caused mouse coordinate mismatch

### Phase 5: Frame Storage Architecture
- **Major refactor:** Changed from PNG-only to JSON+thumbnail format
- **Reason:** Preserve individual drawing objects when duplicating frames
- **Implementation:**
  - Frames stored as: `{json: canvas.toJSON(), thumbnail: canvas.toDataURL()}`
  - Uses Fabric.js JSON serialization
  - Allows selecting/editing individual shapes on duplicated frames
- Updated 8 functions: saveFrame, loadFrameFromJSON, updateFramesDisplay, duplicateCurrentFrame, deleteCurrentFrame, loadFrame, addNewFrame, exportAnimation

### Phase 6: UI Refinements
- Removed redundant canvas size bar (kept modal-only selection)
- Changed fill tool icon from SVG to 🎨 emoji for consistency
- Changed eraser icon to 🧼 soap emoji
- All tools now use emoji icons: 👆 Select, ✏️ Draw, 🎨 Fill, 🧼 Eraser

### Phase 7: Layers Panel (Major Feature)
- Expandable sidebar (280px) with 📚 button
- Shows all canvas objects with thumbnails
- **Drag-and-drop reordering:**
  - Initially tried making just drag handle draggable (didn't work)
  - **Solution:** Make entire item draggable, use visual handle
  - Use `canvas.remove()` + `canvas.insertAt()` instead of `moveTo()`
- Layer visibility toggle with 👁️ icon
- Layer deletion with undo support
- Click layer to select object on canvas
- Layer type icons: ✏️ Drawing, 🖼️ Image, ⭕ Circle, ⬜ Rectangle, etc.
- Real-time updates on object changes

### Phase 8: Undo/Redo System
- Full undo/redo with 50-state history
- **Critical fix for layer deletion:**
  - Initially saved state AFTER deletion (wrong)
  - **Solution:** Save state BEFORE deletion in `deleteLayer()`
  - Don't save on `object:removed` event (would double-save)
- Redo button added to top menu
- Prevents duplicate states
- Works with all operations: draw, modify, delete, clear

### Phase 9: Branding
- Added "BuggaBoo Studio" logo to top menu
- Colorful design: "Bugga" (pink), "Boo" (blue), "Studio" (green)
- Comic Sans font for playful, child-friendly feel
- Text shadows for depth

### Phase 10: Fullscreen Canvas
- Added fullscreen canvas size option
- Calculates maximum available space automatically
- Uses deterministic calculation (window size - toolbars - padding)
- Consistent behavior on every load
- Perfect for tablet drawing with maximum space

### Phase 11: Onion Skinning
- Added onion skin toggle button (🧅) in left toolbar
- Shows previous frame as 30% opacity ghost overlay
- Persists across frame changes when enabled
- Essential animation tool for maintaining consistency
- Handles unsaved frames intelligently

### Phase 12: Asset Library System
- Assets dropdown menu in top menu bar
- Save Selection: Save selected object(s) as reusable asset
- View Library: Modal with grid of saved assets
- localStorage persistence - survives page refresh
- Click asset to add to canvas (centered and editable)
- Delete assets with confirmation
- Custom naming for each asset
- Thumbnail generation for preview

### Phase 13: Additional Features
- Ctrl+A: Select all objects on canvas
- Automatically switches to select tool
- Perfect for bulk operations and asset creation

## Technical Architecture

### File Structure
```
BuggaBoo/
├── index.html (230+ lines) - Main HTML structure
├── css/
│   ├── styles.css (705+ lines) - Main styling, dropdown menus
│   └── modal.css (270+ lines) - Modal dialogs, assets grid
└── js/
    ├── canvas.js (245 lines) - Canvas setup, undo/redo
    ├── tools.js (110 lines) - Drawing tools, select all
    ├── frames.js (264 lines) - Frame management
    ├── onionskin.js (95 lines) - Onion skin feature
    ├── assets.js (240 lines) - Asset library system
    ├── layers.js (360 lines) - Layers panel
    ├── ui.js (103 lines) - UI interactions, modals
    ├── shortcuts.js (75 lines) - Keyboard shortcuts
    └── init.js (27 lines) - App initialization
```

### Key Technologies
- **Fabric.js 5.3.0** - Canvas manipulation library
- **HTML5 Canvas API** - Drawing and rendering
- **HTML5 Drag-and-Drop API** - Layer reordering
- **localStorage** - Asset persistence
- **Git** - Version control (17+ commits total)

### Data Structures

#### Frame Storage
```javascript
frames = [
  {
    json: {...},        // Full Fabric.js canvas state
    thumbnail: 'data:image/png...'  // Preview image
  }
]
```

#### Asset Storage
```javascript
assets = [
  {
    id: 1234567890,     // Timestamp ID
    name: 'My Asset',   // User-defined name
    json: {...},        // Fabric.js object JSON
    thumbnail: 'data:image/png...',  // 150x150 preview
    created: '2025-10-17T...'  // ISO timestamp
  }
]
```
#### Undo Stack
```javascript
undoStack = ['json1', 'json2', ...];  // Canvas states as JSON strings
redoStack = ['json1', 'json2', ...];  // Redo states
```

## Critical Bugs & Solutions

### 1. Drawing Coordinate Offset
**Problem:** Mouse clicks didn't match drawing position on Portrait/Large/YouTube canvases  
**Cause:** CSS `max-width`/`max-height` scaled canvas visually but not coordinate system  
**Solution:** Removed CSS scaling, use native canvas dimensions only

### 2. Duplicate Frame Overwrites Previous
**Problem:** Duplicating frame modified the previous frame's content  
**Cause:** Used `frames[currentFrame] = frameData` instead of pushing new  
**Solution:** `frames.push(frameData)` to add new frame

### 3. Undo Deletes Wrong Layer
**Problem:** Pressing undo after deletion removed wrong layer  
**Cause:** Saved state AFTER deletion (state with layer already gone)  
**Solution:** Save state BEFORE deletion in `deleteLayer()`, don't save on `object:removed` event

### 4. Layers Don't Reorder on Drag
**Problem:** Drag events fired but layers stayed in same order  
**Cause:** `canvas.moveTo()` didn't work reliably  
**Solution:** Use `canvas.remove(obj)` then `canvas.insertAt(obj, index)` pattern

### 5. Layers Panel Shows on Startup
**Problem:** Panel visible by default instead of hidden  
**Cause:** Missing `position: relative` on parent, `left: -280px` initial position  
**Solution:** Set `.main-area { position: relative }` and start panel at `left: -280px`

### 6. Fullscreen Canvas Inconsistent Size
**Problem:** Fullscreen sometimes small/misaligned, inconsistent on first load  
**Cause:** Measuring DOM elements before layout fully settled  
**Solution:** Use deterministic calculation with fixed toolbar widths + measured heights

### 7. Onion Skin Disappears on New Frame
**Problem:** Onion skin turned off when adding new frame  
**Cause:** canvas.clear() removed overlay, timing of updateOnionSkin()  
**Solution:** Added setTimeout delay and improved frame index logic for unsaved frames

## Design Decisions

### Why JSON + Thumbnail?
- **Thumbnail:** Fast preview rendering in frames strip
- **JSON:** Preserves individual objects for editing after duplication
- **Trade-off:** Larger memory footprint, but worth it for functionality

### Why Remove Canvas Size Bar?
- Redundant with modal on startup
- Cleaner UI with more vertical space
- Modal provides better UX for intentional choice

### Why Emoji Icons?
- Consistent visual style across all tools
- No need for custom SVG files
- Fun, accessible, universally understood
- Easy to change (just text)

### Why Comic Sans for Logo?
- Playful, child-friendly font
- Matches target audience (7-year-old)
- Creates welcoming, non-intimidating feel

## Canvas Sizes
- **Square:** 512×512 (Blue) - Default, balanced
- **Cinema:** 768×432 (Red) - Widescreen ratio
- **Portrait:** 432×768 (Purple) - Vertical format
- **Wide:** 768×384 (Orange) - Ultra-wide
- **Large:** 640×640 (Teal) - Bigger square
- **YouTube:** 1280×720 (Pink) - HD video format
- **Fullscreen:** Auto-calculated (Dark Gray) - Maximum available space

## Keyboard Shortcuts
- **D** - Draw tool
- **S** - Select tool
- **F** - Fill tool
- **L** - Toggle layers panel
- **Space** - Add new frame
- **Shift+Space** - Duplicate current frame
- **Ctrl+Z** - Undo
- **Ctrl+Shift+Z / Ctrl+Y** - Redo
- **Ctrl+S** - Save frame
- **Ctrl+A** - Select all objects

## Color Palette
**Interface Colors:**
- Background: #31A2F2 (Blue)
- Dark panels: #2c3e50
- Buttons: #34495e
- Hover: #3d566e
- Accent: #E06F8B (Pink)

**Logo Colors:**
- Bugga: #E06F8B (Pink)
- Boo: #31A2F2 (Blue)
- Studio: #A3CE27 (Lime green)

## Known Limitations
1. **Fill Undo:** Filling an object right after creation treats it as one undo action (considered acceptable)
2. **Export Format:** Individual PNG files only (requires external tool for GIF creation)

## Future Enhancements (Completed!)
1. ✅ **Assets Library:** Save/reuse groups of objects - IMPLEMENTED Phase 12
2. ✅ **Onion Skinning:** See previous/next frames while drawing - IMPLEMENTED Phase 11
3. ✅ **Fullscreen Canvas:** Maximum drawing space - IMPLEMENTED Phase 10

## Future Enhancements (Potential)
1. **Property-Level Undo:** More granular undo for individual property changes
2. **Shape Tools:** Built-in rectangle, circle, line tools
3. **Text Tool:** Add text to animations
4. **GIF Export:** Built-in GIF creation from frames
5. **Audio Sync:** Add sound effects or music to animations
6. **Brush Customization:** Custom brush shapes and patterns
7. **Import Images:** Add photos/images to canvas
8. **Onion Skin Next Frame:** Show next frame too (forward and backward)

## Git Commit History (Latest)
1. `bc9dba4` - Initial commit with basic canvas
2. `3d42c8a` - Add frame management features
3. `f0a5a01` - Fix duplicate/delete bugs
4. `4f893f5` - Add keyboard shortcuts
5. `810e12e` - Add canvas size modal, fix coordinate offset
6. `20250ce` - Implement JSON frame storage
7. `0a860b8` - Center canvas vertically
8. `4ef1033` - Remove canvas size bar
9. `69ae33c` - Replace fill icon with emoji
10. `9627be9` - Add fill tool
11. `23086cb` - Add complete layers panel with drag-and-drop
12. `856366a` - Add BuggaBoo Studio logo
13. `33643d2` - Add comprehensive project history documentation
14. `260575c` - Add reliable fullscreen canvas size option
15. `ed05ae9` - Add onion skin feature for animation reference
16. `dbf4ac7` - Fix onion skin persistence when adding new frames
17. `ffcf706` - Add asset library system for reusable objects
18. `c48c3c0` - Add Ctrl+A shortcut to select all objects

**Total Commits:** 18+
8. `4ef1033` - Remove canvas size bar
9. `69ae33c` - Replace fill icon with emoji
10. `9627be9` - Add fill tool
11. `23086cb` - Add complete layers panel with drag-and-drop
12. `856366a` - Add BuggaBoo Studio logo

## Development Notes

### For Future Sessions
- All features fully functional as of commit `c48c3c0`
- Code is modular and well-organized
- CSS uses BEM-like naming conventions
- JavaScript files are purpose-separated
- Git history preserves all major changes
- localStorage used for assets (persistent across sessions)

### Testing Checklist
- [x] Draw on all canvas sizes - coordinates align
- [x] Duplicate frame preserves individual objects
- [x] Undo/redo works for all operations
- [x] Layers drag-and-drop reorders correctly
- [x] Delete layer can be undone
- [x] Fill tool colors objects
- [x] Keyboard shortcuts work
- [x] Export creates PNG files
- [x] Fullscreen canvas sizes correctly
- [x] Onion skin persists across frames
- [x] Assets save and load properly
- [x] Ctrl+A selects all objects

## Contact & Context
- **User:** Father creating tool for 7-year-old autistic daughter
- **Motivation:** Daughter found Brush Ninja calming, wanted local version with enhancements
- **Primary User:** Child with autism - UI must be simple, intuitive, fun
- **Success Criteria:** Calming, creative tool that works offline

## Technical Learnings

### Fabric.js Insights
- `toJSON()` / `loadFromJSON()` for state serialization
- `insertAt()` more reliable than `moveTo()` for reordering
- Event system: `object:added`, `object:modified`, `object:removed`
- Canvas coordinates must match pixel dimensions (no CSS scaling)
- `ActiveSelection` for multi-object selection
- `setOverlayImage()` for non-interactive background layers (onion skin)
- `fabric.util.enlivenObjects()` to restore objects from JSON

### localStorage Usage
- Assets stored with key: `buggaboo_assets`
- JSON.stringify/parse for serialization
- Survives page refresh and browser restart
- Try-catch for error handling
- Canvas coordinates must match pixel dimensions (no CSS scaling)

### HTML5 Drag-and-Drop
- Set `draggable="true"` on draggable element
- Use `dataTransfer.setData()` / `getData()` for data passing
- Must call `e.preventDefault()` in `dragover` to allow drop
- Visual feedback with CSS classes during drag

### Browser Caching
- Hard refresh required after CSS/HTML changes: Ctrl+Shift+R
- Incognito mode useful for testing fresh state
- Service workers can cause persistent caching issues

---

**Last Updated:** October 17, 2025  
**Current Version:** All features complete and tested  
**Status:** Production-ready for child user
