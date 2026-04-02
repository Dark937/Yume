/**
 * Yume Order Tracking Logic
 * Foundation for future database integration.
 */

document.addEventListener('DOMContentLoaded', () => {
    const trackingForm = document.getElementById('trackingForm');
    const tokenInput = document.getElementById('tokenInput');
    const trackingError = document.getElementById('trackingError');
    const trackingResults = document.getElementById('trackingResults');
    const trackingLoader = document.getElementById('trackingLoader');

    // UI Elements for updates
    const displayToken = document.getElementById('displayToken');
    const orderStatusLabel = document.getElementById('orderStatusLabel');
    const trackName = document.getElementById('trackName');
    const trackAddress = document.getElementById('trackAddress');
    const trackArrival = document.getElementById('trackArrival');
    const trackTotal = document.getElementById('trackTotal');
    const trackItemsList = document.getElementById('trackItemsList');

    // Decoration Logic
    const cans = [
        'assets/blue-nobg.png', 'assets/calpis-nobg.png', 'assets/grape-nobg.png',
        'assets/lychee-nobg.png', 'assets/melon-nobg.png', 'assets/moonlight-nobg.png',
        'assets/naruto-nobg.png', 'assets/onepiece-nobg.png', 'assets/original-nobg.png',
        'assets/strawberry-nobg.png', 'assets/yuzu-nobg.png'
    ];

    function setupDecorations() {
        const leftCan = document.getElementById('leftCan');
        const rightCan = document.getElementById('rightCan');
        
        const randomLeft = cans[Math.floor(Math.random() * cans.length)];
        let randomRight = cans[Math.floor(Math.random() * cans.length)];
        
        // Ensure they are different
        while (randomRight === randomLeft) {
            randomRight = cans[Math.floor(Math.random() * cans.length)];
        }

        leftCan.src = randomLeft;
        rightCan.src = randomRight;
        leftCan.style.display = 'block';
        rightCan.style.display = 'block';
    }

    setupDecorations();
    
    // Auto-load token if present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
        const cleanToken = tokenFromUrl.trim().toUpperCase();
        console.log(`🔍 Auto-tracking token: ${cleanToken}`);
        
        // Hide hero IMMEDIATELY to avoid blink
        if (trackingHero) trackingHero.style.display = 'none';
        
        // Ensure input is filled
        if (tokenInput) tokenInput.value = cleanToken;
        
        // Use a small delay to ensure other services (i18n) are ready
        setTimeout(() => triggerTracking(cleanToken), 300);
    }

    if (trackingForm) {
        trackingForm.onsubmit = async (e) => {
            e.preventDefault();
            const token = tokenInput.value.trim().toUpperCase();
            triggerTracking(token);
        };
    }

    async function triggerTracking(token) {
        if (!token) {
            showError(window.I18nManager ? window.I18nManager.get('tracking.error_no_token') : "Please enter a token.");
            return;
        }

        token = token.trim().toUpperCase();

        // 1. Format Check (YME-XXXX-XXXX-XXXX)
        const formatRegex = /^YME-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!formatRegex.test(token)) {
            showError(window.I18nManager ? window.I18nManager.get('tracking.error_invalid_format') : "Invalid format. Use YME-XXXX-XXXX-XXXX");
            return;
        }

        // Reset UI & Hide Hero early for a cleaner transition
        if (trackingHero) trackingHero.style.display = 'none';
        trackingError.style.display = 'none';
        trackingResults.style.display = 'none';
        tokenInput.classList.remove('is-invalid');
        
        // Show Loader
        trackingLoader.style.display = 'block';

        // 2. Fetch from Database API
        try {
            const order = await fetchOrderFromDatabase(token);
            trackingLoader.style.display = 'none';

            if (order) {
                showOrderDetails(order, token);
                
                // 3. Handle Arrival Email Trigger
                if (order.trigger_arrival_email && window.EmailService) {
                    console.log('📦 Order delivered! Triggering arrival notification...');
                    window.EmailService.sendArrivalNotice(order, token);
                }
            } else {
                // If not found, show hero again so user can fix token
                if (trackingHero) trackingHero.style.display = 'block';
                showError(window.I18nManager ? window.I18nManager.get('tracking.error') : "Order Not Found. Please check your token.");
            }
        } catch (e) {
            trackingLoader.style.display = 'none';
            if (trackingHero) trackingHero.style.display = 'block';
            
            const isDebug = localStorage.getItem('yume_debug') === 'true';
            let message = window.I18nManager ? window.I18nManager.get('tracking.error_server') : "Server Connection Error. Try again later.";
            
            if (isDebug) {
                message = `Debug Error: ${e.message}`;
            }
            
            showError(message);
            console.error('🔍 FETCH ERROR:', e);
        }
    }

    async function fetchOrderFromDatabase(token) {
        // Ensure we handle potential errors better
        const response = await fetch(`api/get_order.php?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        const result = await response.json();
        return result.success ? result.order : null;
    }

    function showOrderDetails(order, token) {
        // Ensure Result Section is visible
        trackingResults.style.display = 'block';
        
        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const statusKey = `tracking.${order.status}`;
        orderStatusLabel.textContent = window.I18nManager ? window.I18nManager.get(statusKey) : order.status.toUpperCase();
        
        trackName.textContent = order.customer.name;
        trackAddress.textContent = order.customer.address;
        trackArrival.textContent = order.arrival;
        trackTotal.textContent = order.total;

        // Render Items
        trackItemsList.innerHTML = '';
        order.items.forEach(item => {
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
            trackItemsList.appendChild(div);
        });

        // Render Journey Logs (Realistic History)
        const historyList = document.getElementById('trackHistoryList');
        if (historyList) {
            historyList.innerHTML = '';
            if (order.history && order.history.length > 0) {
                order.history.forEach(event => {
                    const date = new Date(event.time);
                    const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.innerHTML = `
                        <div class="history-dot"></div>
                        <span class="history-time">${timeStr}</span>
                        <div class="history-msg">${event.msg}</div>
                    `;
                    historyList.appendChild(item);
                });
            } else {
                historyList.innerHTML = '<p class="history-placeholder">No logs available yet.</p>';
            }
        }

        // Update Stepper
        updateStepper(order.status);

        // Scroll to results
        trackingResults.scrollIntoView({ behavior: 'smooth' });
    }

    function updateStepper(status) {
        const statuses = ['placed', 'processing', 'shipped', 'delivered'];
        const currentIndex = statuses.indexOf(status);

        document.querySelectorAll('.status-step').forEach((step, index) => {
            step.classList.remove('active', 'complete');
            const stepStatus = step.dataset.status;
            const stepIndex = statuses.indexOf(stepStatus);

            if (stepIndex < currentIndex) {
                step.classList.add('complete');
            } else if (stepIndex === currentIndex) {
                step.classList.add('active');
            }
        });
    }

    function showError(message) {
        trackingResults.style.display = 'none';
        const hero = document.getElementById('trackingHero');
        if (hero) hero.style.display = 'block';

        trackingError.textContent = message;
        trackingError.style.display = 'block';
        tokenInput.classList.add('is-invalid');
        tokenInput.focus();
    }
});

