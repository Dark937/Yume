/**
 * Cart Manager for Yume Store
 * Handles localStorage persistence and cart operations across all pages.
 */

const CartManager = {
    STORAGE_KEY: 'yume_cart',

    // Get current cart from localStorage
    getCart() {
        const cartData = localStorage.getItem(this.STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : [];
    },

    // Save cart to localStorage
    saveCart(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        // Dispatch custom event to notify other parts of the app
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    },

    /**
     * Add item to cart
     * @param {Object} product - { id, name, price, image, link, type }
     * @param {Number} quantity - number of items to add
     * @param {String} bundleType - 'single', 'pack6', 'pack12'
     */
    addItem(product, quantity = 1, bundleType = 'single') {
        const cart = this.getCart();
        
        // Ensure inputs are numeric
        const numericQty = parseInt(quantity) || 1;
        // Clean price string (remove €, whitespace) and parse
        let rawPrice = product.price;
        if (typeof rawPrice === 'string') {
            rawPrice = rawPrice.replace(/[^\d.,]/g, '').replace(',', '.');
        }
        const numericPrice = parseFloat(rawPrice) || 0;
        
        const existingItemIndex = cart.findIndex(item => item.id === product.id && item.bundleType === bundleType);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += numericQty;
            // Update price in case it changed or was corrected
            cart[existingItemIndex].price = numericPrice;
        } else {
            cart.push({
                ...product,
                price: numericPrice,
                quantity: numericQty,
                bundleType,
                addedAt: new Date().getTime()
            });
        }

        this.saveCart(cart);
    },

    // Remove item from cart
    removeItem(productId, bundleType) {
        let cart = this.getCart();
        cart = cart.filter(item => !(item.id === productId && item.bundleType === bundleType));
        this.saveCart(cart);
    },

    // Update quantity of an item
    updateQuantity(productId, bundleType, newQuantity) {
        if (newQuantity < 1) return this.removeItem(productId, bundleType);
        
        const cart = this.getCart();
        const itemIndex = cart.findIndex(item => item.id === productId && item.bundleType === bundleType);
        
        if (itemIndex > -1) {
            cart[itemIndex].quantity = newQuantity;
            this.saveCart(cart);
        }
    },

    // Clear the cart
    clearCart() {
        this.saveCart([]);
    },

    // Get total price of the cart
    getCartTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // Get total number of items in the cart
    getCartCount() {
        const cart = this.getCart();
        return cart.reduce((count, item) => count + item.quantity, 0);
    },

    // Initialize cart UI components (e.g., counters)
    initUI() {
        const updateCounters = () => {
            const count = this.getCartCount();
            const counters = document.querySelectorAll('.cart-count');
            counters.forEach(counter => {
                counter.textContent = count;
                counter.style.display = count > 0 ? 'flex' : 'none';
            });
        };

        window.addEventListener('cartUpdated', updateCounters);
        updateCounters();
    }
};

// Auto-initialize UI on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    CartManager.initUI();
});

// Export for global use
window.CartManager = CartManager;
