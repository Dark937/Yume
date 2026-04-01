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

    let currentDiscount = 0; // percentage

    // INITIALIZE CART
    renderCart();

    function renderCart() {
        const cart = window.CartManager.getCart();
        const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

        if (cartCountTitle) {
            cartCountTitle.textContent = `[ ${itemCount} ITEMS ]`;
        }

        if (cart.length === 0) {
            cartItemsList.style.display = 'block'; // Ensure block for message
            cartItemsList.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fa-solid fa-box-open"></i>
                    <p>Your haul is empty. Time to dream bigger.</p>
                    <a href="products.html" class="btn-primary">Go to Store</a>
                </div>
            `;
            const checkoutFlow = document.getElementById('checkoutFlow');
            if (checkoutFlow) checkoutFlow.style.display = 'none';
            
            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) checkoutBtn.style.display = 'none';

            const summaryColumn = document.querySelector('.cart-summary-column');
            if (summaryColumn) summaryColumn.style.display = 'none';

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

    function formatBundleName(type) {
        if (type === 'pack6') return '6-Pack Discovery';
        if (type === 'pack12') return '12-Pack Collector';
        return 'Standard Can';
    }

    function setupEventListeners() {
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.onclick = () => {
                window.CartManager.updateQuantity(btn.dataset.id, btn.dataset.bundle, -1);
                renderCart();
            };
        });

        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.onclick = () => {
                window.CartManager.updateQuantity(btn.dataset.id, btn.dataset.bundle, 1);
                renderCart();
            };
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => {
                window.CartManager.removeItem(btn.dataset.id, btn.dataset.bundle);
                renderCart();
            };
        });
    }

    function updateSummary(subtotal) {
        const discount = subtotal * currentDiscount;
        const total = subtotal - discount;

        subtotalDisplay.textContent = `${subtotal.toFixed(2)}€`;
        totalDisplay.textContent = `${total.toFixed(2)}€`;

        if (currentDiscount > 0) {
            discountRow.style.display = 'flex';
            discountValue.textContent = `-${discount.toFixed(2)}€`;
        } else {
            discountRow.style.display = 'none';
        }
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

    // --- Checkout Logic (Final Precision) ---
    class CheckoutController {
        constructor() {
            this.currentStep = 0;
            this.checkoutFlow = document.getElementById('checkoutFlow');
            this.cartItemsList = document.getElementById('cartItemsList');
            this.checkoutBtn = document.getElementById('checkoutBtn');
            this.promoSection = document.getElementById('promoSection');
            this.summaryItemsList = document.getElementById('summaryItemsList');
            this.shippingCostDisplay = document.getElementById('shippingCost');
            this.customsRow = document.getElementById('customsRow');
            this.customsCostDisplay = document.getElementById('customsCost');
            this.deliveryDateDisplay = document.getElementById('deliveryDate');
            this.finalNote = document.getElementById('finalNote');

            this.apiBase = 'https://countriesnow.space/api/v0.1/countries';
            this.italyDataUrl = 'https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json';
            this.italyData = null;
            this.codes = {
                'WVVNRTEw': 0.10
            };

            this.init();
        }

        async init() {
            if (this.checkoutBtn) {
                this.checkoutBtn.onclick = () => this.startCheckout();
            }

            const shippingForm = document.getElementById('shippingForm');
            if (shippingForm) {
                shippingForm.onsubmit = (e) => {
                    e.preventDefault();
                    if (this.validateForm()) {
                        this.goToStep(2);
                    }
                };
            }

            const countrySelect = document.getElementById('country');
            const stateSelect = document.getElementById('province');
            const citySelect = document.getElementById('city');
            const zipInput = document.getElementById('zip');

            if (countrySelect) {
                this.loadCountries();
                countrySelect.onchange = () => {
                    const countryName = countrySelect.selectedOptions[0].text;
                    this.loadStates(countryName, countrySelect.value);
                    this.renderSummaryPreview();
                    this.clearValidationError(countrySelect);
                };
            }

            if (stateSelect) {
                stateSelect.onchange = () => {
                    const countryName = countrySelect.selectedOptions[0].text;
                    this.loadCities(countryName, stateSelect.value);
                    this.clearValidationError(stateSelect);
                };
            }

            if (citySelect) {
                citySelect.onchange = () => this.clearValidationError(citySelect);
            }

            if (zipInput) {
                zipInput.oninput = () => this.clearValidationError(zipInput);
            }

            document.getElementById('backToInfo').onclick = () => this.goToStep(1);
            document.getElementById('processPayment').onclick = () => this.handlePayment();

            // Payment Logic
            document.querySelectorAll('.payment-option input').forEach(input => {
                input.onchange = (e) => {
                    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
                    e.target.closest('.payment-option').classList.add('active');
                    document.getElementById('cardDetails').style.display = (e.target.value === 'card') ? 'block' : 'none';
                };
            });

            // Promo Logic
            const applyBtn = document.getElementById('applyPromoBtn');
            if (applyBtn) {
                applyBtn.onclick = () => {
                    const input = document.getElementById('promoInput');
                    const code = input.value.trim().toUpperCase();
                    if (!code) return;
                    const encoded = btoa(code);
                    if (this.codes[encoded]) {
                        currentDiscount = this.codes[encoded];
                        document.getElementById('promoBox').classList.remove('error');
                        document.getElementById('promoError').style.display = 'none';
                        this.showToast(`COUPON ${code} APPLIED!`);
                        renderCart();
                        if (this.currentStep > 0) this.renderSummaryPreview();
                    } else {
                        document.getElementById('promoBox').classList.add('error');
                        document.getElementById('promoError').style.display = 'block';
                    }
                };
            }
        }

        async loadCountries() {
            const select = document.getElementById('country');
            try {
                const res = await fetch(this.apiBase);
                const data = await res.json();
                const list = data.data.sort((a, b) => a.country.localeCompare(b.country));
                select.innerHTML = '<option value="">Select Country</option>';
                list.forEach(c => select.innerHTML += `<option value="${c.iso2}">${c.country}</option>`);
            } catch (e) {
                select.innerHTML = '<option value="">Error loading</option>';
            }
        }

        async loadStates(countryName, countryIso) {
            const stateSelect = document.getElementById('province');
            const citySelect = document.getElementById('city');
            stateSelect.disabled = false;
            stateSelect.innerHTML = '<option value="">Loading...</option>';
            citySelect.disabled = true;

            if (countryIso === 'IT') {
                if (!this.italyData) {
                    try {
                        const res = await fetch(this.italyDataUrl);
                        this.italyData = await res.json();
                    } catch (e) {
                        stateSelect.innerHTML = '<option value="">Error loading</option>';
                        return;
                    }
                }
                // Get unique province names
                const provinces = [...new Set(this.italyData.map(c => c.provincia.nome))].sort();
                stateSelect.innerHTML = '<option value="">Select Province</option>';
                provinces.forEach(p => {
                    stateSelect.innerHTML += `<option value="${p}">${p}</option>`;
                });
            } else {
                try {
                    const res = await fetch(`${this.apiBase}/states`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ country: countryName })
                    });
                    const data = await res.json();
                    if (data.data && data.data.states && data.data.states.length > 0) {
                        stateSelect.innerHTML = '<option value="">Select Region</option>';
                        data.data.states.sort((a, b) => a.name.localeCompare(b.name)).forEach(s => {
                            stateSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
                        });
                    } else {
                        stateSelect.innerHTML = '<option value="Default">Main Region</option>';
                        this.loadCities(countryName, "Default");
                    }
                } catch (e) {
                    stateSelect.innerHTML = '<option value="">N/A</option>';
                }
            }
        }

        async loadCities(countryName, stateName) {
            const citySelect = document.getElementById('city');
            const countryIso = document.getElementById('country').value;
            citySelect.disabled = false;
            citySelect.innerHTML = '<option value="">Loading...</option>';

            if (countryIso === 'IT' && this.italyData) {
                const cities = this.italyData.filter(c => c.provincia.nome === stateName).map(c => c.nome).sort();
                citySelect.innerHTML = '<option value="">Select Municipality</option>';
                cities.forEach(c => citySelect.innerHTML += `<option value="${c}">${c}</option>`);
            } else {
                try {
                    const res = await fetch(`${this.apiBase}/state/cities`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ country: countryName, state: stateName })
                    });
                    const data = await res.json();
                    if (data.data && data.data.length > 0) {
                        citySelect.innerHTML = '<option value="">Select City</option>';
                        data.data.sort().forEach(c => citySelect.innerHTML += `<option value="${c}">${c}</option>`);
                    } else {
                        citySelect.innerHTML = '<option value="Central">Central District</option>';
                    }
                } catch (e) {
                    citySelect.innerHTML = '<option value="">N/A</option>';
                }
            }
        }

        showToast(message) {
            const t = document.createElement('div');
            t.className = 'yume-toast';
            t.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 4000);
        }

        startCheckout() {
            const cart = window.CartManager.getCart();
            if (cart.length === 0) return;
            this.goToStep(1);
        }

        goToStep(n) {
            this.currentStep = n;
            if (n > 0) {
                this.cartItemsList.style.display = 'none';
                this.checkoutFlow.style.display = 'block';
                this.promoSection.style.display = 'none';
                this.checkoutBtn.style.display = 'none';
                this.renderSummaryPreview();
                this.updateStepUI();
            } else {
                this.cartItemsList.style.display = 'flex';
                this.checkoutFlow.style.display = 'none';
                this.promoSection.style.display = 'block';
                this.checkoutBtn.style.display = 'block';
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        updateStepUI() {
            document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
            document.getElementById(`step${this.currentStep}`).classList.add('active');
            document.querySelectorAll('.step').forEach(s => {
                const i = parseInt(s.dataset.step);
                s.classList.toggle('active', i === this.currentStep);
                s.classList.toggle('complete', i < this.currentStep);
            });
            if (this.currentStep === 2) {
                document.getElementById('finalPaymentTotal').textContent = totalDisplay.textContent;
            }
        }

        renderSummaryPreview() {
            const cart = window.CartManager.getCart();
            const subtotal = window.CartManager.getCartTotal();
            this.summaryItemsList.innerHTML = '';
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'summary-item-mini';
                div.innerHTML = `
                    <div class="mini-img"><img src="${item.image}"></div>
                    <div class="mini-info">
                        <div class="name">${item.name}</div>
                        <div class="qty">x${item.quantity}</div>
                    </div>
                    <div class="mini-price">${(item.price * item.quantity).toFixed(2)}€</div>
                `;
                this.summaryItemsList.appendChild(div);
            });

            const country = document.getElementById('country').value;

            let shipping = 11.50; // Eur/Am
            let taxRate = 0.22;
            let handling = 2.50;

            if (country === 'JP') {
                shipping = 2.50;
                taxRate = 0.10;
                handling = 0;
            } else if (['AU', 'NZ', 'CN', 'KR', 'SG', 'TH', 'VN', 'PH'].includes(country)) {
                shipping = 8.00; // Asia
                taxRate = 0.15;
                handling = 1.50;
            } else if (country && !['IT', 'US', 'UK', 'CA', 'FR', 'DE', 'JP'].includes(country)) {
                shipping = 15.00; // RoW
                taxRate = 0.10;
                handling = 3.00;
            }

            const discount = subtotal * currentDiscount;
            const taxed = subtotal - discount;
            const customs = (taxed * taxRate) + handling;
            const total = taxed + shipping + customs;

            subtotalDisplay.textContent = `${subtotal.toFixed(2)}€`;
            this.shippingCostDisplay.textContent = `${shipping.toFixed(2)}€`;
            this.customsRow.style.display = (customs > 0) ? 'flex' : 'none';
            this.customsCostDisplay.textContent = `${customs.toFixed(2)}€`;

            if (currentDiscount > 0) {
                discountRow.style.display = 'flex';
                discountValue.textContent = `-${discount.toFixed(2)}€`;
            } else {
                discountRow.style.display = 'none';
            }

            totalDisplay.textContent = `${total.toFixed(2)}€`;
            
            // Calculate Arrival Date
            const arrival = new Date();
            let days = 8;
            if (country === 'IT') days = 2;
            if (country === 'JP') days = 2;
            arrival.setDate(arrival.getDate() + days);
            
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateStr = arrival.toLocaleDateString('en-US', options);
            
            this.finalNote.textContent = country ? `ESTIMATED ARRIVAL: ${dateStr}` : "Taxes & shipping added";
        }

        validateForm() {
            let isValid = true;
            const step1 = document.getElementById('step1');
            const required = step1.querySelectorAll('[required]');

            required.forEach(el => {
                const val = el.value.trim();
                if (!val) {
                    this.setValidationError(el, "Required field");
                    isValid = false;
                } else if (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
                    this.setValidationError(el, "Invalid email format");
                    isValid = false;
                } else {
                    this.clearValidationError(el);
                }
            });

            // ZIP Checks
            const zipInput = document.getElementById('zip');
            const country = document.getElementById('country').value;
            const province = document.getElementById('province').value;
            const city = document.getElementById('city').value;
            const zip = zipInput.value.trim();

            if (country === 'IT' && this.italyData) {
                const entry = this.italyData.find(c => c.nome === city && c.provincia.nome === province);
                if (entry) {
                    // Check if zip is in entry.cap array (can be one or more)
                    const caps = Array.isArray(entry.cap) ? entry.cap : [entry.cap];
                    if (!caps.includes(zip)) {
                        this.setValidationError(zipInput, `ZIP must match ${city}`);
                        isValid = false;
                    }
                }
            } else if (country === 'JP' && !/^\d{3}-?\d{4}$/.test(zip)) {
                this.setValidationError(zipInput, "Invalid Japan ZIP format");
                isValid = false;
            }

            return isValid;
        }

        setValidationError(el, message) {
            el.classList.add('is-invalid');
            const err = el.parentNode.querySelector('.error-msg');
            if (err) {
                err.textContent = message;
                err.style.display = 'block';
            }
        }

        clearValidationError(el) {
            el.classList.remove('is-invalid');
            const err = el.parentNode.querySelector('.error-msg');
            if (err) err.style.display = 'none';
        }

        async handlePayment() {
            this.goToStep(3);
            await new Promise(r => setTimeout(r, 4500));
            this.completeOrder();
        }

        completeOrder() {
            const token = `YME-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            document.getElementById('orderToken').textContent = token;

            const country = document.getElementById('country').value;
            const days = (country === 'JP') ? 2 : 8;
            const arrival = new Date();
            arrival.setDate(arrival.getDate() + days);

            if (this.deliveryDateDisplay) {
                this.deliveryDateDisplay.textContent = arrival.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            }

            // Hide summary arrival note
            if (this.finalNote) this.finalNote.style.display = 'none';

            document.getElementById('processingStatus').style.display = 'none';
            document.getElementById('successStatus').style.display = 'block';
            window.CartManager.clearCart();
        }
    }

    new CheckoutController();
});
