// Logging Utility
// Centralized logging for debugging new features

const DEBUG_MODE = true; // Set to false to disable logs in production

const Logger = {
    // Log levels
    info: (module, message, ...args) => {
        if (DEBUG_MODE) {
            console.log(`[${module}] ℹ️ ${message}`, ...args);
        }
    },
    
    success: (module, message, ...args) => {
        if (DEBUG_MODE) {
            console.log(`[${module}] ✅ ${message}`, ...args);
        }
    },
    
    warn: (module, message, ...args) => {
        if (DEBUG_MODE) {
            console.warn(`[${module}] ⚠️ ${message}`, ...args);
        }
    },
    
    error: (module, message, error, ...args) => {
        if (DEBUG_MODE) {
            console.error(`[${module}] ❌ ${message}`, error, ...args);
        }
    },
    
    debug: (module, message, ...args) => {
        if (DEBUG_MODE) {
            console.debug(`[${module}] 🔍 ${message}`, ...args);
        }
    },
    
    group: (module, title) => {
        if (DEBUG_MODE) {
            console.group(`[${module}] ${title}`);
        }
    },
    
    groupEnd: () => {
        if (DEBUG_MODE) {
            console.groupEnd();
        }
    },
    
    time: (label) => {
        if (DEBUG_MODE) {
            console.time(label);
        }
    },
    
    timeEnd: (label) => {
        if (DEBUG_MODE) {
            console.timeEnd(label);
        }
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}
