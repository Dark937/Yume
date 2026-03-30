document.addEventListener('DOMContentLoaded', () => {
    // Acquire the dynamic theme color from the body's CSS interpretation based on class
    const themeColor = getComputedStyle(document.body).getPropertyValue('--theme-color').trim() || 'var(--color-mint)';

    const mainImage = document.getElementById('mainImage');
    const secondaryImage = document.getElementById('secondaryImage');
    const buttons = document.querySelectorAll('.gallery-controls button');
    let currentImageIndex = 0;

    window.switchImage = function(index) {
        currentImageIndex = index;
        if(index === 0) {
            mainImage.style.display = 'block'; secondaryImage.style.display = 'none';
            buttons[0].style.background = themeColor; buttons[1].style.background = 'rgba(255,255,255,0.3)';
        } else {
            mainImage.style.display = 'none'; secondaryImage.style.display = 'block';
            buttons[0].style.background = 'rgba(255,255,255,0.3)'; buttons[1].style.background = themeColor;
        }
    }

    const gallery = document.querySelector('.product-gallery');
    if(gallery) {
        let scrollTimeout;
        gallery.addEventListener('wheel', (e) => {
            if (scrollTimeout) return;
            if (e.deltaY > 0) switchImage(1);
            else if (e.deltaY < 0) switchImage(0);
            scrollTimeout = setTimeout(() => { scrollTimeout = null; }, 500);
        });
    }

    const buyBtn = document.querySelector('.buy-btn');
    if(buyBtn) {
        buyBtn.addEventListener('click', () => {
            buyBtn.textContent = 'ADDED TO CART ✓'; buyBtn.style.color = 'var(--text-light)';
            setTimeout(() => { buyBtn.textContent = 'Add to Cart'; buyBtn.style.color = 'var(--bg-dark)'; }, 2000);
        });
    }

    const backBtn = document.getElementById('dynamicBackBtn');
    if (backBtn && document.referrer) {
        if (document.referrer.includes('products.html')) { 
            backBtn.href = '../products.html'; backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> BACK TO STORE'; 
        } else { 
            backBtn.href = '../index.html'; backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> BACK TO HOME'; 
        }
    }
});
