document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const sections = Array.from(document.querySelectorAll('[data-theme]'));
    if (!navbar) return;

    const updateNavbar = () => {
        let theme = 'dark';
        const scroll = window.scrollY + 50;

        sections.forEach(sec => {
            if (scroll >= sec.offsetTop && scroll < sec.offsetTop + sec.offsetHeight) {
                theme = sec.getAttribute('data-theme');
            }
        });

        navbar.classList.toggle('nav-dark', theme === 'light');
    };

    window.addEventListener('scroll', updateNavbar);
    updateNavbar();
});
