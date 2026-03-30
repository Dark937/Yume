// Cascade setup for Grid Product Cards revealing
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.product-card');
    
    // Sequential entrance animation
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible');
        }, 150 * (index + 1));
    });
});
