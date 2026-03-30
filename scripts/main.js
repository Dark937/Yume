document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       0. Preloader Logic
       ========================================= */
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        if(preloader) {
            setTimeout(() => {
                preloader.classList.add('fade-out');
            }, 800); // Artificial minimum delay for aesthetic transition
        }
    });

    /* =========================================
       0.5. Mobile Hamburger Menu
       ========================================= */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    /* =========================================
       1. Adaptive Navbar Color (Precise Scroll)
       ========================================= */
    const navbar = document.querySelector('.navbar');
    const sections = Array.from(document.querySelectorAll('section[data-theme]'));

    window.addEventListener('scroll', () => {
        let currentTheme = 'dark'; // Default
        const scrollPosition = window.scrollY + 60; // Offset for navbar height

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
    });

    /* =========================================
       2. Universal Parallax Effect
       ========================================= */
    const layers = document.querySelectorAll('.parallax-layer'); // Hero backgrounds
    const parallaxElements = document.querySelectorAll('.parallax-element'); // All punk elements

    // Cache initial transforms
    parallaxElements.forEach(el => {
        const comp = window.getComputedStyle(el).transform;
        el.dataset.origTransform = comp !== 'none' ? comp : '';
    });

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        // Background Hero Layers (only if near top)
        if (scrollY < window.innerHeight * 1.5) {
            layers.forEach(layer => {
                const speed = layer.getAttribute('data-speed');
                layer.style.transform = `translateY(${-(scrollY * speed)}px)`;
            });
        }

        // Punk Elements (floating cans, badges, shapes)
        parallaxElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            // Move based on distance from center of screen
            if(rect.top < window.innerHeight && rect.bottom > 0) {
                const speed = parseFloat(el.getAttribute('data-speed'));
                // Offset is 0 when item is dead center
                const distanceFromCenter = (window.innerHeight / 2) - (rect.top + rect.height / 2);
                const offset = distanceFromCenter * speed * -1; // inverted for natural scroll direction
                
                // Keep its existing transform and add Y translate
                const orig = el.dataset.origTransform || '';
                el.style.transform = `${orig} translateY(${offset}px)`;
            }
        });
    });

    /* =========================================
       3. Precision Flavor Carousel Logic (Absolute Array)
       ========================================= */
    const container = document.querySelector('.carousel-container');
    const items = Array.from(document.querySelectorAll('.carousel-item'));
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    
    // Default start at Yume Original (Index 2)
    let currentIndex = 2; 
    
    const updateCarousel = () => {
        items.forEach((item, index) => {
            // Calculate wrapped difference for infinite scrolling
            const totalItems = items.length;
            let diff = index - currentIndex;
            
            // Wrap the difference so it stays within [-half, +half]
            const half = Math.floor(totalItems / 2);
            if (diff > half) diff -= totalItems;
            else if (diff < -half + (totalItems % 2 === 0 ? 1 : 0)) diff += totalItems;

            item.classList.remove('active', 'prev', 'next');
            
            // Assign active classes
            if (diff === 0) item.classList.add('active');
            else if (diff === -1) item.classList.add('prev');
            else if (diff === 1) item.classList.add('next');

            // Visual Mathematics
            const gap = 200; // Evenly balanced pixel distance
            let xOffset = diff * gap;
            
            let scale = 1;
            let opacity = 1;
            let zIndex = 10 - Math.abs(diff);

            if (diff === 0) {
                scale = 1.1;
                opacity = 1;
            } else if (Math.abs(diff) === 1) {
                scale = 0.8;
                opacity = 0.8;
            } else {
                scale = 0.6;
                opacity = 0.3;
            }

            // Hide the item crossing over behind the scenes
            if (Math.abs(diff) >= half && totalItems % 2 === 0) {
                opacity = 0;
            }

            item.style.transform = `translateX(${xOffset}px) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = zIndex;
            
            // Hide items too far away from interactions
            if (Math.abs(diff) > 2 || opacity === 0) {
                item.style.pointerEvents = 'none';
            } else if (Math.abs(diff) === 0) {
                item.style.pointerEvents = 'auto';
            } else {
                item.style.pointerEvents = 'auto'; // allow clicking neighbors
            }
        });
    };

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % items.length;
        updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateCarousel();
    });

    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            // Check if it's visually a neighbor (diff is 1 or -1)
            let diff = index - currentIndex;
            const half = Math.floor(items.length / 2);
            if (diff > half) diff -= items.length;
            else if (diff < -half + (items.length % 2 === 0 ? 1 : 0)) diff += items.length;
            
            if(Math.abs(diff) === 1) {
                currentIndex = index;
                updateCarousel();
            }
        });
    });

    // Initialize carousel layout on load
    setTimeout(updateCarousel, 100); // Give layout time to paint
    window.addEventListener('resize', updateCarousel);

    /* =========================================
       4. Moonlight Canvas Star Animation
       ========================================= */
    const canvas = document.getElementById('starsCanvas');
    const ctx = canvas.getContext('2d');
    
    let w, h;
    let stars = [];

    const resizeCanvas = () => {
        const section = document.getElementById('moonlight');
        if(!section) return;
        w = canvas.width = section.offsetWidth;
        h = canvas.height = section.offsetHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Star {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = Math.random() * -0.5 - 0.1;
            this.glow = Math.random() * 1;
            this.sign = Math.random() > 0.5 ? 1 : -1;
        }

        update() {
            this.y += this.speedY;
            this.glow += 0.02 * this.sign;
            if(this.glow >= 1 || this.glow <= 0) this.sign *= -1;

            if (this.y < -10) {
                this.y = h + 10;
                this.x = Math.random() * w;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(184, 130, 255, ${this.glow})`; // Pastel purple
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, 1)`;
            ctx.fill();
        }
    }

    const initStars = () => {
        stars = [];
        const numStars = window.innerWidth > 768 ? 80 : 40;
        for (let i = 0; i < numStars; i++) {
            stars.push(new Star());
        }
    };
    initStars();

    const animateStars = () => {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(animateStars);
    };
    
    let animationRunning = false;
    const moonlightSection = document.getElementById('moonlight');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if(!animationRunning) {
                    animationRunning = true;
                    animateStars();
                }
            } else {
                animationRunning = false;
            }
        });
    });
    
    if(moonlightSection) observer.observe(moonlightSection);

    /* =========================================
       5. Sakura Petals Injection (Hero Effect)
       ========================================= */
    const petalsContainer = document.getElementById('petals-container');
    if(petalsContainer) {
        const petalCount = 20;
        for(let i=0; i<petalCount; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            
            // Randomize position, size, and animation duration/delay
            const left = Math.random() * 100;
            const size = Math.random() * 10 + 8; // 8px to 18px
            const duration = Math.random() * 5 + 4; // 4s to 9s fall speed
            const delay = Math.random() * 5;

            petal.style.left = `${left}%`;
            petal.style.width = `${size}px`;
            petal.style.height = `${size}px`;
            petal.style.animationDuration = `${duration}s`;
            petal.style.animationDelay = `-${delay}s`;

            petalsContainer.appendChild(petal);
        }
    }

    /* =========================================
       6. Scroll Reveal Animations
       ========================================= */
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -100px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));

});
