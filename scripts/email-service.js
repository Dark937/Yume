/**
 * Yume Order Confirmation Email Service
 * 
 * Provides an HTML email generator and a placeholder for sending emails
 * to customers after a successful purchase.
 */

const BASE_URL = 'http://yume.altervista.org';

const EmailService = {
    config: {
        serviceId: null,
        templateId: null,
        publicKey: null
    },

    /**
     * LOADS ENVIRONMENT VARIABLES FROM .env
     * Since this is a static site, we fetch the .env file directly for local dev.
     */
    async loadEnv() {
        if (this.config.serviceId && this.config.publicKey) return; // Already loaded

        try {
            console.log('🔄 Fetching config.env file...');
            const response = await fetch('config.env');
            if (!response.ok) throw new Error('Could not find config.env file');
            
            const data = await response.text();
            const lines = data.split('\n');

            lines.forEach(line => {
                const trimmed = line.trim();
                // Skip comments and empty lines
                if (!trimmed || trimmed.startsWith('#')) return;

                const firstEqual = trimmed.indexOf('=');
                if (firstEqual === -1) return;

                const key = trimmed.slice(0, firstEqual).trim();
                let value = trimmed.slice(firstEqual + 1).trim();

                // Strip quotes (single or double) if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                const logMask = val => val.length > 4 ? `${val.slice(0, 2)}...${val.slice(-2)}` : '***';

                if (key === 'EMAIL_SERVICE_ID') {
                    this.config.serviceId = value;
                    console.log(`✅ Loaded SERVICE_ID (${logMask(value)})`);
                }
                if (key === 'EMAIL_TEMPLATE_ID') {
                    this.config.templateId = value;
                    console.log(`✅ Loaded TEMPLATE_ID (${logMask(value)})`);
                }
                if (key === 'EMAIL_PUBLIC_KEY') {
                    this.config.publicKey = value;
                    console.log(`✅ Loaded PUBLIC_KEY (${logMask(value)})`);
                }
            });

            if (this.config.publicKey) {
                if (typeof emailjs !== 'undefined') {
                    emailjs.init(this.config.publicKey);
                    console.log('🚀 EmailJS Initialized Successfully');
                } else {
                    console.error('❌ emailjs library not found. Check cart.html script tags.');
                }
            }
        } catch (e) {
            console.error('❌ .env Error:', e.message);
        }
    },

    /**
     * SENDS THE CONFIRMATION EMAIL
     * 
     * You will need to integrate your preferred service here (EmailJS, Nodemailer, etc.).
     * This function currently logs the email payload for your review.
     */
    async sendOrderConfirmation(orderData) {
        console.group('📧 SENDING ORDER CONFIRMATION EMAIL');
        console.log('To:', orderData.customer.email);
        
        // Prepare Template Parameters (Mapping to EmailJS tags)
        const templateParams = {
            customer_name: orderData.customer.name,
            order_token: orderData.token, // Original token
            order_id: orderData.token,    // Matching your template tag!
            subtotal: orderData.subtotal,
            shipping: orderData.shipping,
            customs: orderData.customs,
            total_price: orderData.total,
            tracking_url: `${window.location.origin}/tracking.html?token=${orderData.token}`,
            items_list_html: this.generateItemsHTML(orderData.items),
            delivery_address: orderData.customer.address,
            delivery_date: orderData.arrival,
            to_email: orderData.customer.email,
            from_name: 'Yume'
        };

        try {
            // Ensure Env is loaded before sending
            await this.loadEnv();

            if (!this.config.serviceId || !this.config.templateId) {
                throw new Error("Missing EmailJS credentials in .env");
            }

            const res = await emailjs.send(
                this.config.serviceId,
                this.config.templateId,
                templateParams
            );
            console.log('SUCCESS!', res.status, res.text);
            return true;
        } catch (error) {
            console.error('FAILED...', error);
            return false;
        } finally {
            console.groupEnd();
        }
    },

    /**
     * GENERATES THE ITEMS LIST HTML
     * For the {{items_list_html}} variable in EmailJS.
     */
    generateItemsHTML(items) {
        return items.map(item => {
            // Fix images to use your live domain assets
            let imagePath = item.image;
            if (imagePath.startsWith('assets/')) {
                imagePath = imagePath.replace('assets/', '');
            }
            const imgSrc = `${BASE_URL}/assets/${imagePath}`;

            return `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <img src="${imgSrc}" alt="${item.name}" width="50" style="vertical-align: middle; border-radius: 4px;">
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: sans-serif;">
                    <strong style="display: block; font-size: 14px;">${Utils.escapeHTML(item.name)}</strong>
                    <span style="color: #888; font-size: 12px;">x${item.quantity}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-family: sans-serif;">
                    ${(item.price * item.quantity).toFixed(2)}€
                </td>
            </tr>
        `; }).join('');
    }
};

// Export for use in cart.js
window.EmailService = EmailService;
