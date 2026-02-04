/**
 * @fileoverview State Manager - Observable State Management
 * 
 * @description
 * Centralized state management with change tracking and reactive updates.
 * Provides observable state that automatically notifies watchers when values change.
 * Supports nested state access using dot notation and integrates with EventBus
 * for cross-component state synchronization.
 * 
 * @example
 * // Create state manager
 * const state = new StateManager(eventBus);
 * 
 * // Set state
 * state.set('frames.current', 0);
 * state.set('tools.active', 'draw');
 * 
 * // Get state (supports dot notation)
 * const current = state.get('frames.current'); // 0
 * 
 * // Watch for changes
 * const unwatch = state.watch('tools.active', (newTool, oldTool) => {
 *   console.log(`Tool changed from ${oldTool} to ${newTool}`);
 * });
 * 
 * // Bulk update
 * state.update({
 *   'frames.current': 1,
 *   'frames.total': 10
 * });
 * 
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 1 - Architecture Foundation
 */

/**
 * State Manager class for observable state
 * @class
 */
class StateManager {
    constructor(eventBus) {
        this.state = {};
        this.eventBus = eventBus;
        this.watchers = new Map();
        this.debugMode = false;
    }

    /**
     * Get a state value
     * @param {string} key - State key (supports dot notation)
     * @returns {*} State value
     */
    get(key) {
        const keys = key.split('.');
        let value = this.state;

        for (const k of keys) {
            if (value === undefined || value === null) {
                return undefined;
            }
            value = value[k];
        }

        return value;
    }

    /**
     * Set a state value
     * @param {string} key - State key (supports dot notation)
     * @param {*} value - New value
     * @param {boolean} silent - If true, don't emit change events
     */
    set(key, value, silent = false) {
        const oldValue = this.get(key);

        // Set the value
        const keys = key.split('.');
        let obj = this.state;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj) || typeof obj[k] !== 'object') {
                obj[k] = {};
            }
            obj = obj[k];
        }

        obj[keys[keys.length - 1]] = value;

        if (this.debugMode) {
            console.log(`[StateManager] Set '${key}':`, value);
        }

        // Emit change events
        if (!silent && this.eventBus) {
            this.eventBus.emit('state:changed', { key, value, oldValue });
            this.eventBus.emit(`state:changed:${key}`, { value, oldValue });
        }

        // Call watchers
        if (!silent) {
            this.notifyWatchers(key, value, oldValue);
        }
    }

    /**
     * Update multiple state values at once
     * @param {Object} updates - Key-value pairs to update
     * @param {boolean} silent - If true, don't emit change events
     */
    update(updates, silent = false) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value, true);
        });

        if (!silent && this.eventBus) {
            this.eventBus.emit('state:updated', updates);
        }
    }

    /**
     * Watch for changes to a state key
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback(newValue, oldValue)
     * @returns {Function} Unwatch function
     */
    watch(key, callback) {
        if (!this.watchers.has(key)) {
            this.watchers.set(key, []);
        }

        this.watchers.get(key).push(callback);

        if (this.debugMode) {
            console.log(`[StateManager] Watching '${key}'`);
        }

        // Return unwatch function
        return () => {
            const watchers = this.watchers.get(key);
            if (watchers) {
                const index = watchers.indexOf(callback);
                if (index > -1) {
                    watchers.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify watchers of a state change
     * @private
     */
    notifyWatchers(key, newValue, oldValue) {
        const watchers = this.watchers.get(key);
        if (watchers) {
            watchers.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`[StateManager] Error in watcher for '${key}':`, error);
                }
            });
        }
    }

    /**
     * Remove all watchers for a key
     * @param {string} key - State key
     */
    unwatch(key) {
        this.watchers.delete(key);
    }

    /**
     * Check if a state key exists
     * @param {string} key - State key
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== undefined;
    }

    /**
     * Delete a state key
     * @param {string} key - State key
     */
    delete(key) {
        const keys = key.split('.');
        let obj = this.state;

        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj)) {
                return;
            }
            obj = obj[k];
        }

        delete obj[keys[keys.length - 1]];

        if (this.eventBus) {
            this.eventBus.emit('state:deleted', { key });
        }
    }

    /**
     * Get a snapshot of the entire state
     * @returns {Object}
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Replace the entire state
     * @param {Object} newState - New state object
     * @param {boolean} silent - If true, don't emit change events
     */
    setState(newState, silent = false) {
        const oldState = this.state;
        this.state = JSON.parse(JSON.stringify(newState));

        if (this.debugMode) {
            console.log(`[StateManager] State replaced`);
        }

        if (!silent && this.eventBus) {
            this.eventBus.emit('state:replaced', { oldState, newState });
        }
    }

    /**
     * Clear all state
     */
    clear() {
        this.state = {};
        this.watchers.clear();

        if (this.eventBus) {
            this.eventBus.emit('state:cleared');
        }
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
    window.StateManager = StateManager;
}
