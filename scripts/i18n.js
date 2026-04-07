const I18nManager = {
    lang: 'it',
    supported: ['it', 'en', 'ja'],

    init() {
        this.detect();
        this.update();
        this.bind();
    },

    detect() {
        const saved = localStorage.getItem('yume-language');
        const browser = navigator.language.split('-')[0];
        this.lang = (saved && this.supported.includes(saved)) ? saved : 
                    (this.supported.includes(browser) ? browser : 'it');
        
        if (!saved) localStorage.setItem('yume-language', this.lang);
        document.documentElement.lang = this.lang;
    },

    set(lang) {
        if (!this.supported.includes(lang)) return;
        this.lang = lang;
        localStorage.setItem('yume-language', lang);
        document.documentElement.lang = lang;
        this.update();
        window.dispatchEvent(new CustomEvent('yume:lang:changed', { detail: { lang } }));
    },

    toggle() {
        let idx = (this.supported.indexOf(this.lang) + 1) % this.supported.length;
        this.set(this.supported[idx]);
    },

    get(key, params = {}) {
        let val = window.Translations?.[this.lang]?.[key] || key;
        Object.entries(params).forEach(([k, v]) => val = val.replace(`@${k}`, v));
        return val;
    },

    update() {
        const dict = window.Translations?.[this.lang];
        if (!dict) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            let params = {};
            const pStr = el.getAttribute('data-i18n-params');
            if (pStr) {
                try { params = JSON.parse(pStr.replace(/'/g, '"')); } catch(e) {}
            }
            
            const txt = this.get(key, params);
            if (txt === key) return;

            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.placeholder) el.placeholder = txt;
            } else {
                const target = el.querySelector('.i18n-text') || el;
                if (txt.includes('<')) target.innerHTML = txt;
                else target.textContent = txt;
            }
        });

        document.querySelectorAll('.lang-toggle-text').forEach(s => s.textContent = this.lang.toUpperCase());
    },

    bind() {
        document.querySelectorAll('.lang-toggle').forEach(btn => {
            btn.onclick = (e) => (e.preventDefault(), this.toggle());
        });
    }
};

document.addEventListener('DOMContentLoaded', () => I18nManager.init());
window.I18nManager = I18nManager;
