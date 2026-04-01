/**
 * Yume Project Utilities
 * Security and performance helpers.
 */

const Utils = {
    /**
     * ESCAPE HTML
     * Prevents XSS by converting special characters to HTML entities.
     * Use this whenever you inject user-provided or external text into innerHTML.
     */
    escapeHTML(str) {
        if (!str) return '';
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    },

    /**
     * DEBOUNCE
     * Limits the rate at which a function can fire.
     * Great for scroll and resize events.
     */
    debounce(func, wait = 100) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
};

// Export to window
window.Utils = Utils;
