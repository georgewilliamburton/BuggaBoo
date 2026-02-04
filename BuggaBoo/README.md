# BuggaBoo Animation Maker

A child-friendly web-based frame-by-frame animation tool built with modern architecture patterns. Simply open `index.html` in your browser to start creating animations!

## Features

- **Drawing Tools**: Brush, select, eraser, fill bucket, and more
- **5 Brush Sizes**: 2px, 4px, 8px, 16px, 32px with live preview
- **Color Palette**: 13 preset colors + custom color picker
- **Frame Management**: Timeline with thumbnail previews, drag-and-drop reordering
- **Layer System**: Drag-and-drop layer panel with lock/visibility controls
- **Global Layers**: Synchronize objects across multiple frames
- **Onion Skinning**: See previous/next frames while drawing
- **Asset Library**: Save and reuse drawing objects across frames
- **Media Import**: Import GIF and video files as frame sequences
- **Animation Playback**: Variable speed playback (1-60 FPS)
- **Export**: GIF export with quality/speed settings, frame export as PNGs
- **Undo/Redo**: 50-state history system
- **Canvas Presets**: Square, Cinema, Portrait, Wide, Large, YouTube, Fullscreen
- **No Installation Required**: Pure HTML/CSS/JavaScript web app

## Quick Start

**Simply double-click `index.html`** or open it in any modern web browser. No installation, server, or build step required!

## Architecture

BuggaBoo follows SOLID principles with a modular, event-driven architecture. See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

### Project Structure

```
BuggaBoo/
├── index.html                          # Main application
├── ARCHITECTURE.md                     # Architecture documentation
├── README.md                           # This file
├── css/
│   ├── variables.css                   # Design tokens (180+ CSS variables)
│   ├── styles.css                      # Main application styles
│   └── modal.css                       # Modal dialogs
├── js/
│   ├── core/                           # Core architecture
│   │   ├── ServiceContainer.js         # Dependency injection
│   │   ├── EventBus.js                 # Pub/sub event system
│   │   └── StateManager.js             # Observable state management
│   ├── config/
│   │   └── constants.js                # Configuration constants
│   ├── interfaces/                     # Interface definitions
│   │   ├── ICanvasRenderer.js
│   │   ├── ICanvasSerializer.js
│   │   └── ICanvasObjectManager.js
│   ├── adapters/
│   │   └── FabricCanvasAdapter.js      # Fabric.js adapter
│   ├── layers/                         # Layer system (3 modules)
│   │   ├── layers-panel.js             # UI and drag-and-drop
│   │   ├── layer-operations.js         # Business logic
│   │   └── global-layers.js            # Cross-frame sync
│   ├── media/                          # Import system (5 modules)
│   │   ├── gif-decoder.js              # GIF parsing
│   │   ├── video-decoder.js            # Video frame extraction
│   │   ├── gif-import.js               # GIF import UI
│   │   ├── video-import.js             # Video import UI
│   │   └── import-controller.js        # Import orchestration
│   ├── canvas.js                       # Canvas management
│   ├── tools.js                        # Drawing tools
│   ├── frames.js                       # Frame/timeline management
│   ├── playback.js                     # Animation playback
│   ├── onionskin.js                    # Onion skinning
│   ├── assets.js                       # Asset library
│   ├── project.js                      # Project save/load
│   ├── ui.js                           # UI management
│   ├── shortcuts.js                    # Keyboard shortcuts
│   ├── logger.js                       # Logging utility
│   └── init.js                         # Application initialization
└── lib/
    ├── fabric.min.js                   # Fabric.js 5.3.0
    ├── gif.js                          # GIF encoding
    ├── gif.worker.js                   # GIF worker thread
    └── omggif.js                       # GIF decoding

125+ files, ~6,000 lines of code
```

### Core Architecture

**Dependency Injection** - `ServiceContainer` manages all services with singleton/transient lifetimes

**Event-Driven** - `EventBus` provides pub/sub communication with 20+ event types

**Observable State** - `StateManager` enables reactive state updates with watchers

**Adapter Pattern** - `FabricCanvasAdapter` wraps Fabric.js for potential library swapping

**Module Pattern** - Single-responsibility modules under 500 lines each

## Keyboard Shortcuts

- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Ctrl/Cmd + S**: Save current frame
- **Spacebar**: Add new frame
- **Delete/Backspace**: Delete selected object
- **Arrow Keys**: Move selected object
- **Ctrl/Cmd + C/V**: Copy/paste objects
- **L**: Toggle layers panel
- **O**: Toggle onion skin
- **P**: Play/pause animation

## Development

### Getting Started

1. Clone the repository
2. Open `index.html` in a browser - no build step required!
3. Enable debug mode: Open browser console and run `eventBus.debugMode = true`

### Modifying Features

- **Styling**: Edit `css/variables.css` for design tokens, `css/styles.css` for layout
- **Tools**: Edit `js/tools.js` for tool behavior
- **Canvas**: Edit `js/canvas.js` for canvas operations
- **Frames**: Edit `js/frames.js` for timeline logic
- **Layers**: Edit modules in `js/layers/` directory
- **Import**: Edit modules in `js/media/` directory
- **Core Architecture**: Edit modules in `js/core/` directory

### Adding New Features

1. Create module in appropriate directory
2. Define event types in comments
3. Add script tag to `index.html` in correct load order
4. Register with `ServiceContainer` if needed
5. Emit events for integration points
6. Add JSDoc documentation
7. Update this README and ARCHITECTURE.md

### Architecture Documentation

See [ARCHITECTURE.md](ARCHITECTURE.md) for:
- Design patterns (DI, Observer, Adapter, Module)
- Core systems (EventBus, StateManager, ServiceContainer)
- Data flow diagrams
- Event system catalog
- Module organization
- SOLID principles implementation

## Browser Compatibility

Requires a modern browser with:
- HTML5 Canvas API
- ES6+ JavaScript (classes, arrow functions, modules)
- CSS Grid & Flexbox
- CSS Custom Properties (variables)

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technical Details

**Frontend Framework**: Vanilla JavaScript (no framework dependencies)
**Canvas Library**: Fabric.js 5.3.0
**GIF Export**: gif.js with web workers
**GIF Import**: omggif.js
**Architecture**: Event-driven with dependency injection
**Code Style**: ES6+ with JSDoc documentation
**CSS**: Custom properties with semantic design tokens

## Performance

- **Frame Limit**: Tested with 100+ frames
- **Canvas Size**: Up to 1920x1080 (Full HD)
- **Undo History**: 50 states
- **GIF Export**: Web worker for non-blocking encoding
- **Lazy Loading**: Services created on-demand

## License

MIT License - Free to use, modify, and distribute.

## Contributing

Contributions welcome! Please:
1. Follow existing code style and architecture patterns
2. Add JSDoc documentation to new code
3. Test thoroughly in multiple browsers
4. Update ARCHITECTURE.md if adding new patterns
5. Keep modules under 500 lines following SRP

## Roadmap

### Phase 6: Testing Framework (Planned)
- Unit tests for core architecture
- Integration tests for workflows
- E2E tests for user journeys

### Future Enhancements
- TypeScript migration for type safety
- Web Workers for GIF/video processing
- IndexedDB for persistent storage
- Plugin system for extensions
- Collaborative editing support

## Credits

**Built with:**
- [Fabric.js](http://fabricjs.com/) - Canvas manipulation library
- [gif.js](https://jnordberg.github.io/gif.js/) - GIF encoding
- [omggif](https://github.com/deanm/omggif) - GIF decoding

**Designed for:**
- Child-friendly interface
- Educational use
- Frame-by-frame animation learning
- Creative expression

---

**Version**: 1.0.0 (Phase 5 Complete)  
**Last Updated**: February 4, 2026  
**Maintainer**: BuggaBoo Team
