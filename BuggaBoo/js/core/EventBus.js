/**
 * @fileoverview Event Bus - Pub/Sub Event System
 * 
 * @description
 * Decouples components through event-driven communication using the Observer pattern.
 * Allows components to communicate without direct dependencies, enabling loose coupling
 * and easier testing. Supports both regular and one-time subscriptions.
 * 
 * @example
 * // Create event bus
 * const eventBus = new EventBus();
 * 
 * // Subscribe to event
 * const unsubscribe = eventBus.on('frame:created', (data) => {
 *   console.log('New frame:', data.frameIndex);
 * });
 * 
 * // Subscribe once (auto-unsubscribes after first call)
 * eventBus.once('app:initialized', () => {
 *   console.log('App ready!');
 * });
 * 
 * // Emit event
 * eventBus.emit('frame:created', { frameIndex: 5 });
 * 
 * // Unsubscribe
 * unsubscribe();
 * 
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 1 - Architecture Foundation
 */

/**
 * Event Bus class for pub/sub communication
 * @class
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.debugMode = false;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event).push(callback);

        if (this.debugMode) {
            console.log(`[EventBus] Subscribed to '${event}'`);
        }

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once (auto-unsubscribe after first call)
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }

        this.onceListeners.get(event).push(callback);

        if (this.debugMode) {
            console.log(`[EventBus] Subscribed once to '${event}'`);
        }

        return () => {
            const listeners = this.onceListeners.get(event);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
                if (this.debugMode) {
                    console.log(`[EventBus] Unsubscribed from '${event}'`);
                }
            }
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to callbacks
     */
    emit(event, data) {
        if (this.debugMode) {
            console.log(`[EventBus] Emitting '${event}'`, data);
        }

        // Call regular listeners
        const listeners = this.listeners.get(event);
        if (listeners) {
            // Clone array to avoid issues if listener unsubscribes during emit
            [...listeners].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error in listener for '${event}':`, error);
                }
            });
        }

        // Call once listeners
        const onceListeners = this.onceListeners.get(event);
        if (onceListeners && onceListeners.length > 0) {
            // Clone and clear once listeners before calling them
            const callbacks = [...onceListeners];
            this.onceListeners.delete(event);

            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[EventBus] Error in once listener for '${event}':`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] Cleared all listeners for '${event}'`);
            }
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
            if (this.debugMode) {
                console.log(`[EventBus] Cleared all listeners`);
            }
        }
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number}
     */
    listenerCount(event) {
        const regular = this.listeners.get(event)?.length || 0;
        const once = this.onceListeners.get(event)?.length || 0;
        return regular + once;
    }

    /**
     * Get all event names
     * @returns {string[]}
     */
    getEventNames() {
        return [
            ...Array.from(this.listeners.keys()),
            ...Array.from(this.onceListeners.keys())
        ].filter((name, index, self) => self.indexOf(name) === index);
    }

    /**
     * Enable debug mode
     * @param {boolean} enabled
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
}
