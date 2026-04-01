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

    if (trackingForm) {
        trackingForm.onsubmit = async (e) => {
            e.preventDefault();
            const token = tokenInput.value.trim().toUpperCase();
            triggerTracking(token);
        };
    }

    // CHECK FOR URL PARAMETERS
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
            tokenInput.value = tokenFromUrl;
            triggerTracking(tokenFromUrl);
        }
    }

    async function triggerTracking(token) {
        if (!token) {
            showError("Please enter a token.");
            return;
        }

        // Reset UI
        trackingError.style.display = 'none';
        trackingResults.style.display = 'none';
        tokenInput.classList.remove('is-invalid');
        
        // Show Loader
        trackingLoader.style.display = 'block';

        // 2. Format Check (YME-XXXX-XXXX-XXXX)
        const formatRegex = /^YME-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!formatRegex.test(token)) {
            await new Promise(r => setTimeout(r, 1000)); // Short delay for feel
            trackingLoader.style.display = 'none';
            showError("Invalid format. Use YME-XXXX-XXXX-XXXX");
            return;
        }

        // 3. Database Check (Simulated Delay)
        const order = await fetchOrderFromDatabase(token);
        
        // Simulate network delay
        await new Promise(r => setTimeout(r, 2500));
        trackingLoader.style.display = 'none';

        if (order) {
            showOrderDetails(order, token);
        } else {
            showError("Order Not Found. Please check your token.");
        }
    }

    checkUrlParams();

    /**
     * MOCK DATABASE FETCH
     * Currently returns null for all tokens as requested.
     * Replace null with order data object to test UI.
     */
    async function fetchOrderFromDatabase(token) {
        // Return null to simulate "No orders saved yet"
        return null;

        /* 
        EXAMPLE SUCCESS DATA:
        return {
            status: 'processing',
            customer: {
                name: 'Zoro Roronoa',
                address: '123 Sakura Way, Kyoto, Japan'
            },
            arrival: 'Friday, April 3',
            total: '24.77€',
            items: [
                { name: 'CHAKRA BURST', qty: 1, price: '19.00€', image: 'assets/can-naruto.png' },
                { name: 'GOMU GOMU FIZZ', qty: 1, price: '3.50€', image: 'assets/can-onepiece.png' }
            ]
        };
        */
    }

    function showOrderDetails(order, token) {
        trackingResults.style.display = 'block';
        displayToken.textContent = token;
        orderStatusLabel.textContent = order.status.toUpperCase();
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
                    <div class="qty">x${item.qty}</div>
                </div>
                <div class="mini-price">${item.price}</div>
            `;
            trackItemsList.appendChild(div);
        });

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
            if (index < currentIndex) {
                step.classList.add('complete');
            } else if (index === currentIndex) {
                step.classList.add('active');
            }
        });
    }

    function showError(message) {
        trackingResults.style.display = 'none';
        trackingError.textContent = message;
        trackingError.style.display = 'block';
        tokenInput.classList.add('is-invalid');
        tokenInput.focus();
    }
});
