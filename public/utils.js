// public/utils.js - To'liq funksionallik bilan yordamchi funksiyalar

window.utils = {
    // ==================== NOTIFICATION ====================
    /**
     * Ko'rsatiladigan notification (pastki o'ng burchakda)
     */
    showNotification: function(title, message = '', duration = 4000) {
        console.log(`📢 Notification: ${title} - ${message}`);

        // Notification elementlarini topish
        const notification = document.getElementById('notification');
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');

        if (!notification || !titleEl) {
            console.warn('Notification elementlari topilmadi');
            return;
        }

        // Matnlar
        titleEl.textContent = title;
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.display = message ? 'block' : 'none';
        }

        // Ko'rsatish
        notification.classList.remove('active');
        void notification.offsetWidth; // reflow
        notification.classList.add('active');

        // Avto yopish
        clearTimeout(window.utils.notificationTimeout);
        window.utils.notificationTimeout = setTimeout(() => {
            notification.classList.remove('active');
        }, duration);
    },

    // ==================== DATE & TIME ====================
    /**
     * Sana formatlash (masalan: "hozir", "5 daqiqa oldin")
     */
    formatDate: function(date) {
        if (!date) return 'nomaʼlum';

        const d = new Date(date);
        if (isNaN(d)) return 'nomaʼlum';

        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'hozir';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' daqiqa oldin';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' soat oldin';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' kun oldin';

        return d.toLocaleDateString('uz-UZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    /**
     * Vaqtni MM:SS formatida ko'rsatish
     */
    formatTime: function(seconds) {
        if (seconds === undefined || seconds === null) return '0:00';
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.abs(seconds) % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // ==================== NUMBER FORMATTING ====================
    /**
     * Raqamni minglik bilan ajratish (1,234,567)
     */
    formatNumber: function(num) {
        if (num === undefined || num === null) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * G'alaba foizini hisoblash
     */
    calculateWinRate: function(wins, duels) {
        if (!duels || duels === 0) return 0;
        return Math.round((wins / duels) * 100);
    },

    // ==================== RANDOM ====================
    /**
     * Random raqam (min ≤ x ≤ max)
     */
    getRandomNumber: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Random rang (hex)
     */
    getRandomColor: function() {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#a8edea', '#fed6e3'
        ];
        return colors[this.getRandomNumber(0, colors.length - 1)];
    },

    // ==================== STRING & TEXT ====================
    /**
     * Matnni qisqartirish (uzun bo'lsa ... qo'shish)
     */
    truncateText: function(text, maxLength = 30) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Birinchi harfni katta qilish
     */
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // ==================== VALIDATION ====================
    /**
     * Email tekshirish
     */
    isValidEmail: function(email) {
        if (!email) return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Username tekshirish (3-20 belgi, harf, raqam, _)
     */
    isValidUsername: function(username) {
        if (!username) return false;
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    },

    // ==================== ARRAY & OBJECT ====================
    /**
     * Ob'ekt bo'shmi?
     */
    isEmpty: function(obj) {
        if (!obj) return true;
        return Object.keys(obj).length === 0;
    },

    /**
     * Deep clone (JSON orqali)
     */
    deepClone: function(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error('Deep clone xatosi:', e);
            return {};
        }
    },

    // ==================== DOM HELPERS ====================
    /**
     * Elementga class qo'shish
     */
    addClass: function(el, className) {
        if (!el) return;
        if (el.classList) {
            el.classList.add(className);
        } else {
            el.className += ' ' + className;
        }
    },

    /**
     * Elementdan class o'chirish
     */
    removeClass: function(el, className) {
        if (!el) return;
        if (el.classList) {
            el.classList.remove(className);
        } else {
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    },

    /**
     * Class toggle
     */
    toggleClass: function(el, className) {
        if (!el) return;
        if (el.classList) {
            el.classList.toggle(className);
        } else {
            if (this.hasClass(el, className)) {
                this.removeClass(el, className);
            } else {
                this.addClass(el, className);
            }
        }
    },

    /**
     * Elementda class bormi?
     */
    hasClass: function(el, className) {
        if (!el) return false;
        if (el.classList) {
            return el.classList.contains(className);
        }
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    },

    /**
     * Element yaratish (tag, attributes, children)
     */
    createElement: function(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);

        Object.keys(attrs).forEach(key => {
            if (key === 'className') {
                el.className = attrs[key];
            } else if (key === 'textContent') {
                el.textContent = attrs[key];
            } else if (key === 'innerHTML') {
                el.innerHTML = attrs[key];
            } else if (key.startsWith('on')) {
                const event = key.toLowerCase().substring(2);
                el.addEventListener(event, attrs[key]);
            } else {
                el.setAttribute(key, attrs[key]);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });

        return el;
    },

    // ==================== OTHER ====================
    /**
     * Debounce funksiyasi (tez-tez chaqirilganda kechiktirish)
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    /**
     * Sleep (await utils.sleep(1000))
     */
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Vibratsiya (agar qo'llab-quvvatlansa)
     */
    vibrate: function(pattern = 100) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },

    /**
     * Ovoz chiqarish (simple beep)
     */
    playSound: function(type = 'click') {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        switch(type) {
            case 'match':
                oscillator.frequency.value = 1200;
                gainNode.gain.value = 0.3;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 300);
                break;
            case 'like':
                oscillator.frequency.value = 800;
                gainNode.gain.value = 0.2;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 150);
                break;
            case 'error':
                oscillator.frequency.value = 300;
                gainNode.gain.value = 0.3;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 400);
                break;
            default: // click
                oscillator.frequency.value = 1000;
                gainNode.gain.value = 0.1;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 100);
        }
    }
};

// Notification timeout saqlash uchun
window.utils.notificationTimeout = null;

console.log('✅ utils.js toʻliq yuklandi');