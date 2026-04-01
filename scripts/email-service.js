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
            to_email: orderData.customer.email
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
                    <strong style="display: block; font-size: 14px;">${item.name}</strong>
                    <span style="color: #888; font-size: 12px;">x${item.quantity}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-family: sans-serif;">
                    ${(item.price * item.quantity).toFixed(2)}€
                </td>
            </tr>
        `; }).join('');
    },

    /**
     * GENERATES THE HTML TEMPLATE
     * Matching the Yume brand aesthetic with modern, responsive styling.
     */
    generateEmailHTML(orderData) {
        const itemsList = orderData.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <img src="${window.location.origin}/${item.image}" alt="${item.name}" width="50" style="vertical-align: middle;">
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: sans-serif;">
                    <strong style="display: block; font-size: 14px;">${item.name}</strong>
                    <span style="color: #888; font-size: 12px;">x${item.quantity}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-family: sans-serif;">
                    ${(item.price * item.quantity).toFixed(2)}€
                </td>
            </tr>
        `).join('');

        const trackingUrl = `${window.location.origin}/tracking.html?token=${orderData.token}`;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; -webkit-text-size-adjust: none;">
    <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#f4f4f4" style="padding: 40px 10px;">
        <tr>
            <td>
                <table align="center" cellpadding="0" cellspacing="0" width="600" bgcolor="#ffffff" style="border: 2px solid #000; box-shadow: 10px 10px 0px #000; border-radius: 4px;">
                    <!-- HEADER -->
                    <tr>
                        <td align="center" bgcolor="#111427" style="padding: 30px;">
                            <img src="${window.location.origin}/assets/yume-light-sakura.png" alt="YUME LOGO" width="120" style="display: block;">
                        </td>
                    </tr>

                    <!-- CONTENT -->
                    <tr>
                        <td style="padding: 40px; font-family: 'Nunito', Arial, sans-serif; color: #111427;">
                            <h1 style="font-size: 28px; margin: 0 0 10px; line-height: 1;">DREAM CONFIRMED!</h1>
                            <p style="font-size: 16px; margin: 0 0 20px; color: #666;">Hi ${orderData.customer.name.split(' ')[0]}, your haul is being prepared for brewing. Excitement levels are high! 🌸</p>
                            
                            <table width="100%" bgcolor="#E6DDFE" style="padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0; font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #8A2BE2;">YOUR TRACKING TOKEN</p>
                                        <p style="margin: 5px 0 15px; font-size: 22px; font-weight: 900; letter-spacing: 1px;">${orderData.token}</p>
                                        <a href="${trackingUrl}" style="background-color: #111427; color: #ffffff; padding: 12px 25px; text-decoration: none; font-weight: 900; font-size: 14px; border-radius: 4px; display: inline-block;">TRACK MY ORDER</a>
                                    </td>
                                </tr>
                            </table>

                            <h3 style="font-size: 13px; font-weight: 900; border-bottom: 2px solid #eee; padding-bottom: 10px; margin: 0 0 15px;">ORDER SUMMARY</h3>
                            <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                ${itemsList}
                                <tr>
                                    <td colspan="2" style="padding: 15px 0; font-weight: 900; font-size: 18px; text-align: right;">TOTAL</td>
                                    <td style="padding: 15px 10px; font-weight: 900; font-size: 22px; text-align: right;">${orderData.total}</td>
                                </tr>
                            </table>

                            <table width="100%" bgcolor="#f9f9f9" style="padding: 20px; border-radius: 8px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0; font-size: 11px; font-weight: 900; color: #999;">DELIVERING TO</p>
                                        <p style="margin: 5px 0; font-size: 14px; font-weight: 700;">${orderData.customer.address}</p>
                                        <p style="margin: 15px 0 0; font-size: 14px; color: #8A2BE2; font-weight: 900;">Estimated Arrival: ${orderData.arrival}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #fdfdfd; border-top: 1px solid #eee;">
                            <p style="font-size: 12px; color: #999; margin: 0;">&copy; 2026 Yume Drinks. Anime-Inspired Energy.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
}

// Export for use in cart.js
window.EmailService = EmailService;
