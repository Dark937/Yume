(() => {
    'use strict';
    const params = new URLSearchParams(window.location.search);
    const debug = params.get('debug');
    
    if (debug === 'true') {
        localStorage.setItem('yume_debug', 'true');
        console.warn('🛠️ Debug ON (Persisted)');
    } else if (debug === 'false') {
        localStorage.removeItem('yume_debug');
        console.warn('🛡️ Debug OFF');
    }

    if (localStorage.getItem('yume_debug') === 'true') return;

    // input lock
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        const keys = [123, 73, 74, 67, 85, 83]; // f12, i, j, c, u, s
        if (keys.includes(e.keyCode) && (e.ctrlKey || e.shiftKey || e.keyCode === 123)) {
            e.preventDefault();
        }
    });

    // dev check
    let open = false;
    const check = () => {
        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
            if (!open) {
                console.log('%c STOP! %c Yume Secure. ', 'color: #8A2BE2; font-size: 30px; font-weight: 800;', 'font-size: 14px;');
                open = true;
            }
        } else open = false;
    };
    window.addEventListener('resize', check);
    check();
})();
