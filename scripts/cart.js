/**
 * Cart Page Logic for Yume Store (Image 2 style)
 */

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsList = document.getElementById('cartItemsList');
    const subtotalDisplay = document.getElementById('subtotal');
    const totalDisplay = document.getElementById('total');
    const cartCountTitle = document.getElementById('cartCountTitle');
    const discountRow = document.getElementById('discountRow');
    const discountValue = document.getElementById('discountValue');
    const promoInput = document.getElementById('promoInput');
    const applyPromoBtn = document.getElementById('applyPromoBtn');

    let currentDiscount = 0; // percentage

    function renderCart() {
        const cart = window.CartManager.getCart();
        const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
        
        if (cartCountTitle) {
            cartCountTitle.textContent = `[ ${itemCount} ITEMS ]`;
        }

        if (cart.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fa-solid fa-box-open"></i>
                    <p>Your haul is empty. Time to dream bigger.</p>
                    <a href="products.html" class="btn-primary">Go to Store</a>
                </div>
            `;
            updateSummary(0);
            updateShippingProgress(0);
            return;
        }

        cartItemsList.innerHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            // New Parallel Layout
            itemElement.innerHTML = `
                <div class="item-img-wrapper">
                    <img src="${item.image}" alt="${item.name}" class="item-img">
                </div>
                <div class="item-info">
                    <div class="item-header">
                        <h3>${item.name}</h3>
                        <span class="item-price">${item.price.toFixed(2)}€</span>
                    </div>
                    <p class="item-bundle">${formatBundleName(item.bundleType)}</p>
                    
                    <div class="item-actions">
                        <div class="qty-control-wrapper">
                            <div class="qty-control">
                                <button class="qty-btn minus" data-id="${item.id}" data-bundle="${item.bundleType}">-</button>
                                <span class="qty-val">${item.quantity}</span>
                                <button class="qty-btn plus" data-id="${item.id}" data-bundle="${item.bundleType}">+</button>
                            </div>
                        </div>
                        <div class="item-secondary-actions">
                            <button class="action-icon-btn remove-btn" data-id="${item.id}" data-bundle="${item.bundleType}">
                                <i class="fa-solid fa-trash-can"></i> REMOVE
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartItemsList.appendChild(itemElement);
        });

        updateSummary(subtotal);
        updateShippingProgress(subtotal);
        setupEventListeners();
    }

    function updateShippingProgress(subtotal) {
        const threshold = 20;
        const progressFill = document.getElementById('progressFill');
        const shippingMsg = document.getElementById('shippingMsg');
        
        if (!progressFill || !shippingMsg) return;

        const percentage = Math.min((subtotal / threshold) * 100, 100);
        progressFill.style.width = `${percentage}%`;

        if (subtotal >= threshold) {
            shippingMsg.textContent = "YOU'VE UNLOCKED FREE SHIPPING!";
            shippingMsg.style.color = 'var(--color-purple)';
        } else {
            const remaining = (threshold - subtotal).toFixed(2);
            shippingMsg.textContent = `Only ${remaining}€ away from FREE shipping!`;
            shippingMsg.style.color = 'var(--bg-dark)';
        }
    }

    function formatBundleName(type) {
        switch(type) {
            case 'pack6': return 'Pack of 6';
            case 'pack12': return 'Pack of 12';
            default: return 'Single Can';
        }
    }

    function updateSummary(subtotal) {
        let finalTotal = subtotal;
        
        if (currentDiscount > 0) {
            const savings = subtotal * currentDiscount;
            finalTotal = subtotal - savings;
            
            discountRow.style.display = 'flex';
            discountValue.textContent = `-${savings.toFixed(2)}€`;
        } else {
            discountRow.style.display = 'none';
        }

        subtotalDisplay.textContent = `${subtotal.toFixed(2)}€`;
        totalDisplay.textContent = `${finalTotal.toFixed(2)}€`;
    }

    function setupEventListeners() {
        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const bundle = btn.getAttribute('data-bundle');
                const cart = window.CartManager.getCart();
                const item = cart.find(i => i.id === id && i.bundleType === bundle);
                window.CartManager.updateQuantity(id, bundle, item.quantity + 1);
            });
        });

        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const bundle = btn.getAttribute('data-bundle');
                const cart = window.CartManager.getCart();
                const item = cart.find(i => i.id === id && i.bundleType === bundle);
                window.CartManager.updateQuantity(id, bundle, item.quantity - 1);
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const bundle = btn.getAttribute('data-bundle');
                window.CartManager.removeItem(id, bundle);
            });
        });
    }

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoInput.value.toUpperCase();
            if (code === 'YUME10') {
                currentDiscount = 0.10;
                alert('Promo applied! 10% off your haul.');
                renderCart();
            } else {
                alert('Invalid promo code.');
            }
        });
    }

    // Listen for cart updates
    window.addEventListener('cartUpdated', renderCart);

    // Initial render
    renderCart();

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = window.CartManager.getCart();
            if (cart.length === 0) return alert('Your cart is empty!');
            alert('Redirecting to checkout...');
        });
    }
});
