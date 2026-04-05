/**
 * Navbar Theme Adaptivity
 * Handles navbar color switching based on the current background theme.
 */
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const sections = Array.from(document.querySelectorAll('[data-theme]'));

    if (!navbar) return;

    const handleNavbarTheme = () => {
        let currentTheme = 'dark'; // Default starting theme
        const scrollPosition = window.scrollY + 100; // Offset for detection

        sections.forEach(sec => {
            const top = sec.offsetTop;
            const bottom = top + sec.offsetHeight;
            
            if (scrollPosition >= top && scrollPosition < bottom) {
                currentTheme = sec.getAttribute('data-theme');
            }
        });

        if (currentTheme === 'light') {
            navbar.classList.add('nav-dark');
        } else {
            navbar.classList.remove('nav-dark');
        }
    };

    // Listen for scroll
    window.addEventListener('scroll', handleNavbarTheme);

    // Initial check on load
    handleNavbarTheme();
});
