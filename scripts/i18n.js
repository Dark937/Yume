/**
 * Yume i18n Manager
 * Handles language detection, persistence, and DOM updates.
 */

const I18nManager = {
    currentLang: 'it',
    supportedLangs: ['it', 'en', 'ja'],

    init() {
        console.log('🌐 i18n Manager Initializing...');
        this.detectLanguage();
        this.updateDOM();
        this.setupToggle();
    },

    /**
     * DETECT LANGUAGE
     * 1. Check LocalStorage
     * 2. Check Browser Language
     * 3. Default to Italian
     */
    detectLanguage() {
        const savedLang = localStorage.getItem('yume-language');
        if (savedLang && this.supportedLangs.includes(savedLang)) {
            this.currentLang = savedLang;
            console.log(`📍 Language loaded from storage: ${this.currentLang}`);
        } else {
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLangs.includes(browserLang)) {
                this.currentLang = browserLang;
                console.log(`🌍 Browser language detected: ${this.currentLang}`);
            } else {
                this.currentLang = 'it';
                console.log(`🏳️ Defaulting to Italian: ${this.currentLang}`);
            }
            localStorage.setItem('yume-language', this.currentLang);
        }
        document.documentElement.setAttribute('lang', this.currentLang);
    },

    /**
     * TOGGLE LANGUAGE
     * Cycles through: it -> en -> ja -> it
     */
    toggleLanguage() {
        const currentIndex = this.supportedLangs.indexOf(this.currentLang);
        const nextIndex = (currentIndex + 1) % this.supportedLangs.length;
        this.setLanguage(this.supportedLangs[nextIndex]);
    },

    /**
     * SET LANGUAGE
     */
    setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) return;
        this.currentLang = lang;
        localStorage.setItem('yume-language', lang);
        document.documentElement.setAttribute('lang', lang);
        this.updateDOM();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('yume:lang:changed', { detail: { lang } }));
        console.log(`🌐 Language switched to: ${lang.toUpperCase()}`);
    },

    /**
     * GET TRANSLATION
     * Returns a translated string with @parameter replacement.
     */
    get(key, params = {}) {
        const translations = window.Translations[this.currentLang];
        if (!translations || !translations[key]) return key;

        let translation = translations[key];
        Object.keys(params).forEach(param => {
            translation = translation.replace(`@${param}`, params[param]);
        });
        return translation;
    },

    /**
     * UPDATE DOM
     * Scans for [data-i18n] and updates text/placeholder.
     */
    updateDOM() {
        const translations = window.Translations[this.currentLang];
        if (!translations) return;

        // Update elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            let params = {};
            const paramsStr = el.getAttribute('data-i18n-params');
            if (paramsStr) {
                try { params = JSON.parse(paramsStr.replace(/'/g, '"')); } catch(e) { console.error('i18n params parse error', e); }
            }
            
            const translation = this.get(key, params);

            if (translation !== key) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.placeholder) el.placeholder = translation;
                } else {
                    const textSpan = el.querySelector('.i18n-text');
                    if (textSpan) {
                        if (translation.includes('<')) textSpan.innerHTML = translation;
                        else textSpan.textContent = translation;
                    } else {
                        if (translation.includes('<')) el.innerHTML = translation;
                        else el.textContent = translation;
                    }
                }
            }
        });

        // Update Language Toggle Button Text
        const toggleBtn = document.getElementById('lang-toggle-text');
        if (toggleBtn) {
            toggleBtn.textContent = this.currentLang.toUpperCase();
        }
    },

    /**
     * SETUP TOGGLE
     */
    setupToggle() {
        const toggleBtns = document.querySelectorAll('.lang-toggle');
        toggleBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.toggleLanguage();
            };
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    I18nManager.init();
});

window.I18nManager = I18nManager;
