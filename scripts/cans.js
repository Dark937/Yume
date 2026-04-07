class ProductSlider {
    constructor() {
        this.track = document.querySelector('.slider-track');
        this.items = document.querySelectorAll('.slider-item');
        this.dotsContainer = document.querySelector('.slider-dots');
        this.prevBtn = document.querySelector('.prev-arrow');
        this.nextBtn = document.querySelector('.next-arrow');
        
        this.currentIndex = 0;
        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.animationID = 0;
        
        this.wheelCooldown = false;
        
        this.init();
    }

    init() {
        if (!this.track) return;

        // Create dots
        this.items.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(i));
            this.dotsContainer.appendChild(dot);
        });

        this.dots = document.querySelectorAll('.dot');

        // Nav Events
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());

        // Touch Events
        this.track.addEventListener('touchstart', (e) => this.touchStart(e));
        this.track.addEventListener('touchend', () => this.touchEnd());
        this.track.addEventListener('touchmove', (e) => this.touchMove(e));

        // Mouse Drag Events
        this.track.addEventListener('mousedown', (e) => this.touchStart(e));
        this.track.addEventListener('mouseup', () => this.touchEnd());
        this.track.addEventListener('mouseleave', () => this.touchEnd());
        this.track.addEventListener('mousemove', (e) => this.touchMove(e));

        // Wheel Events
        this.track.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Prevent context menu on long press
        this.track.oncontextmenu = (e) => {
            if (e.pointerType === 'mouse') return;
            e.preventDefault();
            e.stopPropagation();
        };

        window.addEventListener('resize', () => this.updatePosition());
    }

    handleWheel(e) {
        if (this.wheelCooldown) return;
        e.preventDefault();
        
        if (Math.abs(e.deltaY) > 30) {
            if (e.deltaY > 0) this.nextSlide();
            else this.prevSlide();
            
            this.wheelCooldown = true;
            setTimeout(() => this.wheelCooldown = false, 800);
        }
    }

    touchStart(e) {
        this.startX = this.getPositionX(e);
        this.isDragging = true;
        this.animationID = requestAnimationFrame(this.animation.bind(this));
        this.track.style.transition = 'none';
    }

    touchEnd() {
        this.isDragging = false;
        cancelAnimationFrame(this.animationID);
        this.track.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

        const movedBy = this.currentTranslate - this.prevTranslate;

        if (movedBy < -100) this.nextSlide();
        else if (movedBy > 100) this.prevSlide();
        else this.goToSlide(this.currentIndex);
    }

    touchMove(e) {
        if (this.isDragging) {
            const currentX = this.getPositionX(e);
            this.currentTranslate = this.prevTranslate + currentX - this.startX;
        }
    }

    getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    animation() {
        this.setTransformX(this.currentTranslate);
        if (this.isDragging) requestAnimationFrame(this.animation.bind(this));
    }

    setTransformX(x) {
        this.track.style.transform = `translateX(${x}px)`;
    }

    goToSlide(index) {
        this.currentIndex = (index + this.items.length) % this.items.length;
        this.updatePosition();
        this.updateDots();
    }

    nextSlide() {
        this.goToSlide(this.currentIndex + 1);
    }

    prevSlide() {
        this.goToSlide(this.currentIndex - 1);
    }

    updatePosition() {
        this.currentTranslate = this.currentIndex * -this.track.clientWidth;
        this.prevTranslate = this.currentTranslate;
        this.setTransformX(this.currentTranslate);
    }

    updateDots() {
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Init Slider
    new ProductSlider();

    // Acquire the dynamic theme color
    const themeColor = getComputedStyle(document.body).getPropertyValue('--theme-color').trim() || 'var(--color-mint)';

    // Bundle Selection Logic
    const bundleOptions = document.querySelectorAll('.bundle-option');
    const mainPriceDisplay = document.querySelector('.product-price');
    let selectedBundle = 'single';
    let currentPrice = mainPriceDisplay ? parseFloat(mainPriceDisplay.getAttribute('data-base-price')) : 0;

    // Initialize active color for bundle
    document.documentElement.style.setProperty('--active-color', themeColor);
    document.documentElement.style.setProperty('--theme-color', themeColor);

    bundleOptions.forEach(option => {
        option.addEventListener('click', () => {
            bundleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            selectedBundle = option.getAttribute('data-bundle');
            const price = option.getAttribute('data-price');
            if (mainPriceDisplay) mainPriceDisplay.textContent = `${price}€`;
            currentPrice = parseFloat(price);
        });
    });

    // Add to Cart Logic
    const buyBtn = document.querySelector('.buy-btn');
    if(buyBtn) {
        buyBtn.addEventListener('click', () => {
            const titleEl = document.querySelector('.product-title');
            const imgEl = document.querySelector('.slider-item img');
            
            const product = {
                id: document.body.className.replace('flavor-', ''),
                name: titleEl ? titleEl.textContent : 'Yume Drink',
                price: parseFloat(currentPrice) || 0,
                image: imgEl ? imgEl.src : '',
                link: window.location.pathname,
                type: 'drink'
            };
            
            console.log('Adding to cart:', product, selectedBundle);
            window.CartManager.addItem(product, 1, selectedBundle);

            // Visual Feedback
            const originalText = buyBtn.textContent;
            const addedText = window.I18nManager ? window.I18nManager.get('product.added_msg') : 'ADDED TO CART ✓';
            buyBtn.textContent = addedText; 
            buyBtn.classList.add('added-success');
            
            setTimeout(() => { 
                buyBtn.textContent = window.I18nManager ? window.I18nManager.get('product.add_to_cart') : originalText; 
                buyBtn.classList.remove('added-success');
            }, 2000);
        });
    }

    // Back Button Logic - Removed as we now use static history.back() with icon-only design
});
