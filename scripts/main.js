/* Setup and Initialization */
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const isReload = performance.getEntriesByType("navigation")[0]?.type === "reload";
        const hasPlayed = sessionStorage.getItem('yume_preloader_played');

        const preventScroll = (e) => e.preventDefault();
        const preventKeyScroll = (e) => ['ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown'].includes(e.key) && e.preventDefault();

        const toggleLock = (lock) => {
            document.documentElement.style.overflow = lock ? 'hidden' : '';
            if (lock) {
                window.addEventListener('wheel', preventScroll, { passive: false });
                window.addEventListener('touchmove', preventScroll, { passive: false });
                window.addEventListener('keydown', preventKeyScroll, { passive: false });
            } else {
                window.removeEventListener('wheel', preventScroll, { passive: false });
                window.removeEventListener('touchmove', preventScroll, { passive: false });
                window.removeEventListener('keydown', preventKeyScroll, { passive: false });
            }
        };

        if (!hasPlayed || isReload) {
            toggleLock(true);
            const hidePreloader = () => {
                setTimeout(() => {
                    preloader.classList.add('fade-out');
                    sessionStorage.setItem('yume_preloader_played', 'true');
                    setTimeout(() => {
                        preloader.style.display = 'none';
                        toggleLock(false);
                    }, 800);
                }, 800);
            };

            if (document.readyState === 'complete') {
                hidePreloader();
            } else {
                window.addEventListener('load', hidePreloader);
            }
        } else {
            preloader.style.display = 'none';
        }
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    const navbar = document.querySelector('.navbar');

    if (mobileMenuBtn && navLinks) {
        const toggleMenu = () => {
            const active = navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
            navbar.classList.toggle('menu-open');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.replace(active ? 'fa-bars' : 'fa-xmark', active ? 'fa-xmark' : 'fa-bars');
        };

        mobileMenuBtn.onclick = toggleMenu;
        navLinks.querySelectorAll('a').forEach(a => a.onclick = toggleMenu);
    }

    // Initial Navbar Theme check
    window.dispatchEvent(new Event('scroll'));

    // Parallax Effects
    const layers = document.querySelectorAll('.parallax-layer'); 
    const parallaxElements = document.querySelectorAll('.parallax-element');

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
            if (rect.top < window.innerHeight && rect.bottom > 0) {
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

    // Product Carousel
    const container = document.querySelector('.carousel-container');
    const items = Array.from(document.querySelectorAll('.carousel-item'));
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');

    // Default start at Yume Original (Index 2)
    let currentIndex = 2;

    const updateCarousel = () => {
        items.forEach((item, index) => {
            const total = items.length;
            let diff = index - currentIndex;
            const half = Math.floor(total / 2);
            
            if (diff > half) diff -= total;
            else if (diff < -half + (total % 2 === 0 ? 1 : 0)) diff += total;

            const config = {
                0: { scale: 1.1, opacity: 1, z: 10 },
                1: { scale: 0.8, opacity: 0.8, z: 9 },
                2: { scale: 0.6, opacity: 0.3, z: 8 }
            };

            const { scale, opacity, z } = config[Math.abs(diff)] || { scale: 0.4, opacity: 0, z: 5 };
            const xOffset = diff * 200;

            const oldDiff = parseInt(item.dataset.prevDiff || diff);
            item.dataset.prevDiff = diff;

            const isSnap = Math.abs(oldDiff - diff) > 1;
            item.style.transition = isSnap ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.8s ease-out';
            item.style.transform = `translateX(${xOffset}px) scale(${scale})`;
            item.style.opacity = opacity;
            item.style.zIndex = z;
            item.style.pointerEvents = (Math.abs(diff) > 2 || opacity === 0) ? 'none' : 'auto';

            if (isSnap) void item.offsetWidth;
        });
    };

    const flushStaggerDelays = () => items.forEach(item => { item.style.transitionDelay = '0s'; });

    nextBtn.addEventListener('click', () => {
        flushStaggerDelays();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
        flushStaggerDelays();
        currentIndex = (currentIndex + 1) % items.length;
        updateCarousel();
    });

    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            flushStaggerDelays();
            // Check if it's visually a neighbor (diff is 1 or -1)
            let diff = index - currentIndex;
            const half = Math.floor(items.length / 2);
            if (diff > half) diff -= items.length;
            else if (diff < -half + (items.length % 2 === 0 ? 1 : 0)) diff += items.length;

            if (Math.abs(diff) === 1) {
                currentIndex = index;
                updateCarousel();
            }
        });
    });

    // Freeze layout state initially for custom parallax entrance
    container.classList.add('unrevealed');
    setTimeout(updateCarousel, 100); // Give layout time to paint its matrix in background

    const lineupObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Apply a staggered popup delay radiating from left to right
                items.forEach((item, idx) => {
                    item.style.transitionDelay = `${idx * 0.15}s`;
                });

                // Unleash CSS transforms
                container.classList.remove('unrevealed');

                // Scrub the delays after completion so user manual skipping doesn't lag
                setTimeout(() => {
                    items.forEach(item => { item.style.transitionDelay = '0s'; });
                }, 1200 + (items.length * 150));

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the carousel comes into view

    if (container) lineupObserver.observe(container);

    window.addEventListener('resize', () => {
        if (!container.classList.contains('unrevealed')) updateCarousel();
    });

    // Moonlight Background Effects
    const canvas = document.getElementById('starsCanvas');
    const ctx = canvas.getContext('2d');

    let w, h;
    let stars = [];

    const resizeCanvas = () => {
        const section = document.getElementById('moonlight');
        if (!section) return;
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
            if (this.glow >= 1 || this.glow <= 0) this.sign *= -1;

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
                if (!animationRunning) {
                    animationRunning = true;
                    animateStars();
                }
            } else {
                animationRunning = false;
            }
        });
    });

    if (moonlightSection) observer.observe(moonlightSection);

    // Visual Effects
    const petalsContainer = document.getElementById('petals-container');
    if (petalsContainer) {
        const petalCount = 20;
        for (let i = 0; i < petalCount; i++) {
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

    // Intersection Observers for Scroll Reveal
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

    // Forms and Newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    const newsletterInput = document.getElementById('newsletterEmail');
    const eggOverlay = document.getElementById('egg67-overlay');

    if (newsletterForm && newsletterInput) {

        // Easter Egg Trigger (on typing '67')
        newsletterInput.addEventListener('input', () => {
            if (newsletterInput.value.includes('67')) {
                if (eggOverlay) eggOverlay.classList.add('active');
                newsletterInput.value = '';
            }
        });

        // Functional Newsletter Submit
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = newsletterForm.querySelector('button');
            const email = newsletterInput.value;

            // 🛡️ HONEY-POT CHECK: If this field is filled, it's a bot!
            const honeypot = newsletterForm.querySelector('input[name="b_67_honeypot"]');
            if (honeypot && honeypot.value !== "") {
                newsletterForm.reset();
                return;
            }

            // Simple validation
            if (!email || !email.includes('@')) return;

            // Loading State
            btn.disabled = true;
            newsletterInput.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> JOINING...';

            // Simulate Network Delay (1.5s)
            // Note: For a real backend or EmailJS notification, you'd add the call here.
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success State
            btn.innerHTML = 'THANK YOU! 🌸';
            btn.style.backgroundColor = 'var(--color-pink)';
            btn.style.color = 'white';
        });
    }

    if (eggOverlay) {
        eggOverlay.addEventListener('click', () => {
            eggOverlay.classList.remove('active');
        });
    }

});
