/**
 * @fileoverview Service Container - Dependency Injection Container
 * 
 * @description
 * Manages application services and their dependencies using the Dependency Injection pattern.
 * Supports both singleton and transient service lifetimes, and allows services to be registered
 * as instances or factory functions.
 * 
 * @example
 * // Create container
 * const container = new ServiceContainer();
 * 
 * // Register singleton service
 * container.register('logger', new Logger(), true);
 * 
 * // Register factory (lazy initialization)
 * container.register('canvas', (c) => {
 *   const logger = c.get('logger');
 *   return new CanvasService(logger);
 * }, true);
 * 
 * // Get service
 * const canvas = container.get('canvas');
 * 
 * @author BuggaBoo Team
 * @version 1.0.0
 * @since Phase 1 - Architecture Foundation
 */

/**
 * Service Container class for managing application dependencies
 * @class
 */
class ServiceContainer {
    constructor() {
        this.services = new Map();
        this.factories = new Map();
        this.singletons = new Set();
    }

    /**
     * Register a service instance
     * @param {string} name - Service name
     * @param {*} instance - Service instance or factory function
     * @param {boolean} singleton - Whether to reuse the same instance
     */
    register(name, instance, singleton = true) {
        if (typeof instance === 'function') {
            this.factories.set(name, instance);
            if (singleton) {
                this.singletons.add(name);
            }
        } else {
            this.services.set(name, instance);
            this.singletons.add(name);
        }
    }

    /**
     * Get a service instance
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        // Check if already instantiated
        if (this.services.has(name)) {
            return this.services.get(name);
        }

        // Check if it's a factory
        if (this.factories.has(name)) {
            const factory = this.factories.get(name);
            const instance = factory(this);

            // Cache if singleton
            if (this.singletons.has(name)) {
                this.services.set(name, instance);
            }

            return instance;
        }

        throw new Error(`Service '${name}' not registered`);
    }

    /**
     * Check if service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name) || this.factories.has(name);
    }

    /**
     * Remove a service
     * @param {string} name - Service name
     */
    unregister(name) {
        this.services.delete(name);
        this.factories.delete(name);
        this.singletons.delete(name);
    }

    /**
     * Clear all services
     */
    clear() {
        this.services.clear();
        this.factories.clear();
        this.singletons.clear();
    }

    /**
     * Get all registered service names
     * @returns {string[]}
     */
    getServiceNames() {
        return [
            ...Array.from(this.services.keys()),
            ...Array.from(this.factories.keys())
        ];
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ServiceContainer = ServiceContainer;
}
