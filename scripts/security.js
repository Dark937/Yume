/**
 * Yume Security Layer
 * Basic protection against casual inspection (Right-click, F12, shortcuts)
 * Keeps the source code readable for the developer while deterring others.
 */

(function() {
    'use strict';

    // Check for debug mode in URL (e.g., index.html?debug=true) or LocalStorage
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    // Manage persistence
    if (debugParam === 'true') {
        localStorage.setItem('yume_debug', 'true');
        console.warn('🛠️ Yume Debug Mode PERSISTED');
    } else if (debugParam === 'false') {
        localStorage.removeItem('yume_debug');
        console.warn('🛡️ Yume Debug Mode REMOVED');
    }

    const isDebug = localStorage.getItem('yume_debug') === 'true' || debugParam === 'true';

    if (isDebug) {
        console.warn('🛠️ Yume Security Layer BYPASSED (Debug Mode Active)');
        // Ensure ALL pages have debug=true in console
        if (!window.location.search.includes('debug=true')) {
            console.info('%c To persist debug mode, use ?debug=true in the URL once. ', 'background: #222; color: #bada55');
        }
        return; // Exit and don't bind any listeners
    }

    // 1. DISABLE RIGHT CLICK
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // 2. DISABLE KEYBOARD SHORTCUTS
    document.addEventListener('keydown', (e) => {
        // Disable F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });

    // 3. DETECT DEV TOOLS (Simple check)
    // This trick detects if the window dimensions change abruptly (often due to DevTools opening)
    let devToolsOpen = false;
    const threshold = 160;

    const checkDevTools = () => {
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;
        
        if (widthDiff || heightDiff) {
            if (!devToolsOpen) {
                console.log('%c STOP! %c Yume Security Layer is active. Authorized developers only. ', 
                    'background: #8A2BE2; color: #fff; font-size: 30px; font-weight: bold; padding: 10px;', 
                    'color: #8A2BE2; font-size: 14px;');
                devToolsOpen = true;
            }
        } else {
            devToolsOpen = false;
        }
    };

    window.addEventListener('resize', checkDevTools);
    checkDevTools();

})();
