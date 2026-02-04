# BuggaBoo Architecture Documentation

## Overview

BuggaBoo is a frame-by-frame animation tool built with HTML5, CSS3, and vanilla JavaScript, using Fabric.js for canvas manipulation. The architecture follows SOLID principles with a focus on modularity, testability, and maintainability.

## Table of Contents

1. [Architecture Patterns](#architecture-patterns)
2. [Core Systems](#core-systems)
3. [Module Structure](#module-structure)
4. [Data Flow](#data-flow)
5. [Event System](#event-system)
6. [State Management](#state-management)
7. [Design Patterns](#design-patterns)

---

## Architecture Patterns

### 1. Dependency Injection (DI)

**Purpose**: Decouple service creation from usage, making code more testable and flexible.

**Implementation**: `ServiceContainer` class manages all application services.

```javascript
// Register services
container.register('eventBus', new EventBus());
container.register('stateManager', (c) => new StateManager(c.get('eventBus')));

// Get services
const eventBus = container.get('eventBus');
```

### 2. Observer Pattern (Pub/Sub)

**Purpose**: Enable loose coupling between components through event-driven communication.

**Implementation**: `EventBus` class provides publish/subscribe functionality.

```javascript
// Subscribe
eventBus.on('frame:created', (data) => {
  console.log('New frame:', data.frameIndex);
});

// Publish
eventBus.emit('frame:created', { frameIndex: 5 });
```

### 3. Adapter Pattern

**Purpose**: Wrap external libraries (Fabric.js) with our own interfaces to allow potential library swaps.

**Implementation**: `FabricCanvasAdapter` wraps Fabric.js Canvas.

```javascript
// Adapter provides unified interface
const adapter = new FabricCanvasAdapter(fabricCanvas);
adapter.addObject(obj);      // ICanvasObjectManager
adapter.toJSON();             // ICanvasSerializer
adapter.renderAll();          // ICanvasRenderer
```

### 4. Module Pattern

**Purpose**: Organize code into focused, single-responsibility modules.

**Implementation**: ES6 modules with clear separation of concerns.

```
js/
├── core/          # Architecture foundation
├── config/        # Constants and configuration
├── adapters/      # External library adapters
├── interfaces/    # Interface definitions
├── layers/        # Layer management (split into 3 modules)
└── media/         # Import functionality (split into 5 modules)
```

---

## Core Systems

### ServiceContainer

**File**: `js/core/ServiceContainer.js`

**Purpose**: Manages application services using dependency injection.

**Key Features**:
- Singleton and transient service lifetimes
- Factory functions for lazy initialization
- Service registration and retrieval
- Dependency resolution

**Example**:
```javascript
const container = new ServiceContainer();

// Register singleton
container.register('logger', new Logger(), true);

// Register factory (lazy)
container.register('canvas', (c) => {
  return new CanvasService(c.get('logger'));
}, true);

// Retrieve
const canvas = container.get('canvas');
```

---

### EventBus

**File**: `js/core/EventBus.js`

**Purpose**: Decouples components through event-driven communication.

**Key Features**:
- Subscribe to events with `on()`
- One-time subscriptions with `once()`
- Emit events with `emit()`
- Automatic unsubscribe functions
- Debug mode for tracing

**Event Types**:
```javascript
// Frame events
'frame:created', 'frame:deleted', 'frame:selected', 'frame:updated'

// Layer events
'layer:selected', 'layer:locked', 'layer:visibility:toggled', 'layer:deleted'

// Global layer events
'layer:global:enabled', 'layer:global:linked', 'layer:global:unlinked'

// Tool events
'tool:changed', 'tool:brush:size:changed', 'tool:color:changed'

// Media events
'media:gif:decoded', 'media:video:decoded', 'media:gif:imported'

// Playback events
'playback:started', 'playback:stopped', 'playback:speed:changed'
```

---

### StateManager

**File**: `js/core/StateManager.js`

**Purpose**: Centralized, observable state management.

**Key Features**:
- Nested state access with dot notation
- Watchers for reactive updates
- Bulk update operations
- Integration with EventBus
- Change tracking

**Example**:
```javascript
const state = new StateManager(eventBus);

// Set state
state.set('frames.current', 0);
state.set('tools.active', 'draw');

// Get state
const tool = state.get('tools.active');

// Watch for changes
state.watch('tools.active', (newTool, oldTool) => {
  console.log(`Tool changed from ${oldTool} to ${newTool}`);
});

// Bulk update
state.update({
  'frames.current': 1,
  'frames.total': 10
});
```

---

## Module Structure

### Phase 3: File Splitting

Large monolithic files were split into focused modules following the Single Responsibility Principle.

#### Layers Modules

**Original**: `layers.js` (767 lines)  
**Split into**:

1. **`layers/layers-panel.js`** (458 lines)
   - UI and display logic
   - Layer list rendering
   - Drag-and-drop functionality
   - Visual updates

2. **`layers/layer-operations.js`** (247 lines)
   - Select, lock, visibility, delete operations
   - Business logic for layer manipulation
   - Canvas state integration

3. **`layers/global-layers.js`** (220 lines)
   - Cross-frame synchronization
   - Global layer management
   - Frame exclusion system

#### Media Import Modules

**Original**: `media-import.js` (948 lines)  
**Split into**:

1. **`media/gif-decoder.js`** (135 lines)
   - GIF parsing with omggif
   - Frame extraction and composition

2. **`media/video-decoder.js`** (111 lines)
   - Video frame extraction
   - Canvas-based frame capture

3. **`media/gif-import.js`** (422 lines)
   - GIF import UI and modal
   - Import execution logic

4. **`media/video-import.js`** (213 lines)
   - Video import UI and modal
   - Frame range selection

5. **`media/import-controller.js`** (129 lines)
   - Main entry points
   - Workflow coordination

---

## Data Flow

### Frame Management Flow

```
User Action (UI)
  ↓
Event Handler
  ↓
Business Logic (frames.js)
  ↓
Canvas Update (FabricCanvasAdapter)
  ↓
EventBus.emit('frame:updated')
  ↓
UI Update (updateFramesList())
```

### Global Layer Synchronization Flow

```
User: "Enable on All Frames"
  ↓
enableGlobalOnAllFrames(index)
  ↓
1. Assign globalId to object
2. Mark as global layer
  ↓
syncObjectToAllFrames()
  ↓
For each frame:
  - Load frame canvas data
  - Clone global object
  - Insert or replace in frame
  - Save frame canvas data
  ↓
EventBus.emit('layer:global:enabled')
  ↓
updateLayersList() (UI update)
```

### Media Import Flow

```
User selects file
  ↓
importGIF() / importVideo()
  ↓
File validation
  ↓
Decoder (gif-decoder.js / video-decoder.js)
  ↓
EventBus.emit('media:*:decoded')
  ↓
Import modal (gif-import.js / video-import.js)
  ↓
User selects options
  ↓
Execute import
  ↓
Create frames from images
  ↓
EventBus.emit('media:*:imported')
  ↓
UI update
```

---

## Event System

### Event Naming Convention

Format: `<domain>:<action>[:<detail>]`

Examples:
- `frame:created` - Frame was created
- `layer:visibility:toggled` - Layer visibility changed
- `tool:brush:size:changed` - Brush size changed

### Event Lifecycle

1. **Subscribe**: Component registers interest in event
2. **Emit**: Action triggers event with data payload
3. **Notify**: All subscribers receive event
4. **Handle**: Subscribers execute their callbacks

### Best Practices

- **Descriptive names**: Use clear, action-oriented names
- **Data payload**: Include relevant context in event data
- **Error handling**: Wrap callbacks in try-catch
- **Unsubscribe**: Clean up listeners when components unmount
- **Debug mode**: Enable EventBus debug for tracing

---

## State Management

### State Structure

```javascript
{
  frames: {
    current: 0,
    total: 5,
    selected: []
  },
  tools: {
    active: 'draw',
    brush: {
      size: 4,
      color: '#000000'
    }
  },
  ui: {
    layersPanelOpen: false,
    onionSkinEnabled: false
  }
}
```

### Reactive Updates

State changes automatically trigger:
1. **Watchers**: Direct callbacks on specific keys
2. **Events**: EventBus notifications (state:changed)
3. **UI**: Automatic re-renders

### State vs. Events

**Use State for**:
- Current application values
- Configuration settings
- User preferences

**Use Events for**:
- Actions and commands
- Workflow coordination
- Cross-component communication

---

## Design Patterns

### 1. Single Responsibility Principle (SRP)

Each module has one clear purpose:
- `layers-panel.js`: Only UI concerns
- `layer-operations.js`: Only business logic
- `global-layers.js`: Only synchronization

### 2. Open/Closed Principle (OCP)

System is open for extension, closed for modification:
- New tools can be added without modifying existing code
- Interfaces allow library swapping
- Event system enables plugin architecture

### 3. Dependency Inversion Principle (DIP)

High-level modules depend on abstractions:
- Code depends on `ICanvasRenderer`, not Fabric.js directly
- Services injected through `ServiceContainer`
- Loose coupling via `EventBus`

### 4. Interface Segregation Principle (ISP)

Interfaces are focused and specific:
- `ICanvasRenderer`: Rendering only
- `ICanvasSerializer`: Serialization only
- `ICanvasObjectManager`: Object management only

### 5. Liskov Substitution Principle (LSP)

Adapters can replace implementations:
- `FabricCanvasAdapter` can be swapped with other canvas libraries
- As long as interfaces are implemented, code continues to work

---

## CSS Architecture (Phase 4)

### Variable System

All design tokens centralized in `css/variables.css`:

```css
:root {
  /* Colors */
  --color-primary-blue: #31A2F2;
  --color-dark-900: #2c3e50;
  
  /* Spacing */
  --spacing-md: 10px;
  --spacing-lg: 15px;
  
  /* Shadows */
  --shadow-md: 0 2px 5px rgba(0,0,0,0.2);
  
  /* Transitions */
  --transition-normal: 0.2s ease;
}
```

### Benefits

- **Single source of truth**: Change once, apply everywhere
- **Consistency**: Semantic naming ensures uniform design
- **Theming**: Easy to implement light/dark modes
- **Maintainability**: No magic numbers scattered in CSS

---

## Testing Strategy

### Unit Testing (Planned)

- Test core classes in isolation
- Mock dependencies via ServiceContainer
- Test event emissions and subscriptions

### Integration Testing (Planned)

- Test module interactions
- Verify event flows
- Test state synchronization

### E2E Testing (Planned)

- Test complete workflows
- Frame creation/deletion
- Global layer synchronization
- Import workflows

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Services created on-demand via factories
2. **Event Batching**: Multiple state changes emit single event
3. **Canvas Caching**: Frame thumbnails cached as data URLs
4. **Debouncing**: Expensive operations throttled
5. **Module Splitting**: Code split for faster initial load

### Limits

Defined in `js/config/constants.js`:
- Max undo stack: 50
- Max brush size: 100
- Recommended GIF frames: 100
- Playback FPS range: 1-60

---

## Future Enhancements

### Planned Improvements

1. **TypeScript Migration**: Add type safety
2. **Web Workers**: Offload GIF/video processing
3. **IndexedDB**: Persistent project storage
4. **Plugin System**: Allow community extensions
5. **Undo/Redo Enhancement**: Operation-specific undo
6. **Collaborative Editing**: Real-time multi-user support

---

## Getting Started

### Development Setup

1. Clone repository
2. Open `index.html` in browser (no build step required)
3. Enable debug mode: `eventBus.debugMode = true`

### File Loading Order

Critical that files load in this order (see `index.html`):

1. External libraries (`fabric.min.js`, `omggif.js`)
2. Core architecture (`ServiceContainer`, `EventBus`, `StateManager`)
3. Interfaces and adapters
4. Application modules
5. Initialization (`init.js`)

### Adding New Features

1. Create module in appropriate directory
2. Define event types if needed
3. Add to `index.html` in correct order
4. Document with JSDoc
5. Emit events for integration
6. Update ARCHITECTURE.md

---

## Conclusion

BuggaBoo's architecture emphasizes:
- **Modularity**: Small, focused files
- **Testability**: Dependency injection and loose coupling
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Event-driven, plugin-ready design
- **Performance**: Efficient rendering and state management

The refactoring from Phases 1-4 transformed a monolithic codebase into a modern, maintainable architecture ready for future growth.

---

**Last Updated**: Phase 5 - Documentation  
**Version**: 1.0.0  
**Contributors**: BuggaBoo Team
