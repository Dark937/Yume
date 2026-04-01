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
                        <div class="name">${Utils.escapeHTML(item.name)}</div>
                        <div class="qty">x${item.quantity}</div>
                    </div>
                    <div class="mini-price">${(item.price * item.quantity).toFixed(2)}€</div>
                `;
                this.summaryItemsList.appendChild(div);
            });

            const country = document.getElementById('country').value;
            const rates = this.getContinentalRates(country);

            // Free Shipping check (Threshold 20€)
            if (subtotal >= 20) {
                rates.shipping = 0;
            }

            const discount = subtotal * currentDiscount;
            const taxed = subtotal - discount;
            const customs = (taxed * rates.taxRate) + rates.handling;
            const total = taxed + rates.shipping + customs;

            subtotalDisplay.textContent = `${subtotal.toFixed(2)}€`;
            this.shippingCostDisplay.textContent = `${rates.shipping.toFixed(2)}€`;
            this.customsRow.style.display = (customs > 0) ? 'flex' : 'none';
            this.customsCostDisplay.textContent = `${customs.toFixed(2)}€`;

            if (currentDiscount > 0) {
                discountRow.style.display = 'flex';
                discountValue.textContent = `-${discount.toFixed(2)}€`;
            } else {
                discountRow.style.display = 'none';
            }

            totalDisplay.textContent = `${total.toFixed(2)}€`;
            this.finalNote.style.display = 'none'; // Replaced by sidebar box in success
        }

        getContinentalRates(country) {
            // Default rates (RoW - Rest of World)
            let rates = { shipping: 18.00, taxRate: 0.10, handling: 5.00, days: 12 };

            if (!country) return { shipping: 0, taxRate: 0, handling: 0, days: 0 };

            // EUROPE
            const europe = ['IT', 'FR', 'DE', 'ES', 'UK', 'NL', 'BE', 'PT', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'MT', 'CY', 'IS', 'LI', 'MC', 'AD', 'SM', 'VA'];
            // ASIA
            const asia = ['CN', 'KR', 'SG', 'TH', 'VN', 'PH', 'MY', 'ID', 'IN', 'PK', 'BD', 'RU', 'TR', 'IL', 'SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'JO', 'LB', 'TW', 'HK', 'MO'];
            // NORTH AMERICA
            const northAmerica = ['US', 'CA', 'MX', 'PR', 'CU', 'DO', 'GT', 'CR', 'PA'];
            // OCEANIA
            const oceania = ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'WS', 'TO', 'KI', 'MH', 'FM', 'PW', 'NR', 'TV'];
            // SOUTH AMERICA
            const southAmerica = ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR'];

            if (country === 'JP') {
                rates = { shipping: 2.50, taxRate: 0.10, handling: 0.00, days: 2 };
            } else if (europe.includes(country)) {
                rates = { shipping: 11.50, taxRate: 0.22, handling: 2.50, days: 5 };
            } else if (northAmerica.includes(country)) {
                rates = { shipping: 12.50, taxRate: 0.10, handling: 3.50, days: 7 };
            } else if (asia.includes(country)) {
                rates = { shipping: 8.00, taxRate: 0.15, handling: 1.50, days: 4 };
            } else if (oceania.includes(country)) {
                rates = { shipping: 14.00, taxRate: 0.15, handling: 2.00, days: 8 };
            } else if (southAmerica.includes(country)) {
                rates = { shipping: 22.00, taxRate: 0.10, handling: 6.00, days: 14 };
            }

            return rates;
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
            const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
            
            if (paymentType === 'card') {
                if (!this.validateCardForm()) return;
            }

            this.goToStep(3);
            await new Promise(r => setTimeout(r, 4500));
            this.completeOrder();
        }

        validateCardForm() {
            let isValid = true;
            const cardName = document.getElementById('cardName');
            const cardNumber = document.getElementById('cardNumber');
            const expiry = document.getElementById('expiry');
            const cvv = document.getElementById('cvv');

            // Name: At least 3 characters
            if (cardName.value.trim().length < 3) {
                this.setValidationError(cardName, "Enter full name (min 3 chars)");
                isValid = false;
            } else {
                this.clearValidationError(cardName);
            }

            // Number: 13-19 digits
            const cleanNum = cardNumber.value.replace(/\s+/g, '');
            if (!/^\d{13,19}$/.test(cleanNum)) {
                this.setValidationError(cardNumber, "Invalid card number (13-19 digits)");
                isValid = false;
            } else {
                this.clearValidationError(cardNumber);
                cardNumber.value = cleanNum.replace(/(.{4})/g, '$1 ').trim(); // Reformat
            }

            // Expiry: MM/YY
            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.value.trim())) {
                this.setValidationError(expiry, "Format MM/YY");
                isValid = false;
            } else {
                this.clearValidationError(expiry);
            }

            // CVV: 3-4 digits
            if (!/^\d{3,4}$/.test(cvv.value.trim())) {
                this.setValidationError(cvv, "3 or 4 digits");
                isValid = false;
            } else {
                this.clearValidationError(cvv);
            }

            return isValid;
        }

        completeOrder() {
            const token = `YME-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            document.getElementById('orderToken').textContent = token;

            const country = document.getElementById('country').value;
            const rates = this.getContinentalRates(country);
            const arrivalDate = new Date();
            arrivalDate.setDate(arrivalDate.getDate() + rates.days);
            const arrivalStr = arrivalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

            if (this.deliveryDateDisplay) {
                this.deliveryDateDisplay.textContent = arrivalStr;
            }

            // Gather Order Data for Email
            const orderData = {
                token: token,
                subtotal: document.getElementById('subtotal').textContent,
                shipping: document.getElementById('shippingCost').textContent,
                customs: document.getElementById('customsCost').textContent,
                total: document.getElementById('total').textContent,
                arrival: arrivalStr,
                items: window.CartManager.getCart(),
                customer: {
                    name: Utils.escapeHTML(document.getElementById('fullName').value),
                    email: document.getElementById('email').value,
                    address: Utils.escapeHTML(`${document.getElementById('streetAddress').value}, ${document.getElementById('city').value}, ${document.getElementById('country').value}`)
                }
            };

            // Send Confirmation Email
            if (window.EmailService) {
                window.EmailService.sendOrderConfirmation(orderData);
            }

            // Show sidebar arrival box
            const sidebarBox = document.getElementById('sidebarArrivalBox');
            if (sidebarBox) sidebarBox.style.display = 'flex';

            document.getElementById('processingStatus').style.display = 'none';
            document.getElementById('successStatus').style.display = 'block';
            
            window.CartManager.clearCart();
        }
    }

    new CheckoutController();
});
