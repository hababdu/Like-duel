// ==================== UTILITY FUNCTIONS ====================

const Utils = {
    /**
     * Format date to readable string
     */
    formatDate: function(date) {
        if (!date) return 'noma\'lum';
        
        try {
            const d = new Date(date);
            const now = new Date();
            const diff = now - d;
            
            if (isNaN(diff)) return 'noma\'lum';
            
            if (diff < 60000) return 'hozir';
            if (diff < 3600000) return Math.floor(diff / 60000) + ' daqiqa oldin';
            if (diff < 86400000) return Math.floor(diff / 3600000) + ' soat oldin';
            if (diff < 604800000) return Math.floor(diff / 86400000) + ' kun oldin';
            
            return d.toLocaleDateString('uz-UZ', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'noma\'lum';
        }
    },
    
    /**
     * Show notification
     */
    showNotification: function(title, message) {
        console.log(`📢 Notification: ${title} - ${message}`);
        
        if (!window.elements?.notification) {
            console.warn('Notification element not found');
            return;
        }
        
        try {
            window.elements.notificationTitle.textContent = title || '';
            window.elements.notificationMessage.textContent = message || '';
            
            window.elements.notification.classList.add('active');
            
            setTimeout(() => {
                if (window.elements?.notification) {
                    window.elements.notification.classList.remove('active');
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    },
    
    /**
     * Generate random number between min and max
     */
    getRandomNumber: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * Debounce function
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Calculate win rate
     */
    calculateWinRate: function(wins, total) {
        if (!total || total === 0) return 0;
        return Math.round((wins / total) * 100);
    },
    
    /**
     * Format number with commas
     */
    formatNumber: function(num) {
        if (!num && num !== 0) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    /**
     * Check if object is empty
     */
    isEmpty: function(obj) {
        if (!obj) return true;
        return Object.keys(obj).length === 0;
    },
    
    /**
     * Deep clone object
     */
    deepClone: function(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('Error cloning object:', error);
            return {};
        }
    },
    
    /**
     * Get URL parameter
     */
    getUrlParam: function(param) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        } catch {
            return null;
        }
    },
    
    /**
     * Set URL parameter
     */
    setUrlParam: function(param, value) {
        try {
            const url = new URL(window.location);
            url.searchParams.set(param, value);
            window.history.pushState({}, '', url);
        } catch (error) {
            console.error('Error setting URL param:', error);
        }
    },
    
    /**
     * Remove URL parameter
     */
    removeUrlParam: function(param) {
        try {
            const url = new URL(window.location);
            url.searchParams.delete(param);
            window.history.pushState({}, '', url);
        } catch (error) {
            console.error('Error removing URL param:', error);
        }
    },
    
    /**
     * Validate email
     */
    isValidEmail: function(email) {
        if (!email) return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Validate username
     */
    isValidUsername: function(username) {
        if (!username) return false;
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    },
    
    /**
     * Capitalize first letter
     */
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    /**
     * Truncate text
     */
    truncateText: function(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    /**
     * Copy to clipboard
     */
    copyToClipboard: function(text) {
        if (!text) return;
        
        try {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('Nusxa olindi', 'Matn nusxalandi');
            }).catch(err => {
                console.error('Copy failed:', err);
                // Fallback method
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showNotification('Nusxa olindi', 'Matn nusxalandi');
            });
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    },
    
    /**
     * Sleep function
     */
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Generate unique ID
     */
    generateUniqueId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * Format seconds to MM:SS
     */
    formatTime: function(seconds) {
        if (!seconds && seconds !== 0) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Safe JSON parse
     */
    safeJsonParse: function(str, defaultValue = {}) {
        try {
            if (!str) return defaultValue;
            return JSON.parse(str);
        } catch {
            return defaultValue;
        }
    },
    
    /**
     * Safe JSON stringify
     */
    safeJsonStringify: function(obj) {
        try {
            return JSON.stringify(obj);
        } catch {
            return '{}';
        }
    },
    
    /**
     * Get random color
     */
    getRandomColor: function() {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#a8edea', '#fed6e3'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    /**
     * Format file size
     */
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Check if mobile device
     */
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    /**
     * Check if Telegram Web App
     */
    isTelegramWebApp: function() {
        return typeof Telegram !== 'undefined' && Telegram.WebApp;
    },
    
    /**
     * Vibrate device (if supported)
     */
    vibrate: function(pattern = 200) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },
    
    /**
     * Play sound
     */
    playSound: function(soundName) {
        // Simple sound implementation
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(soundName) {
            case 'click':
                oscillator.frequency.value = 800;
                gainNode.gain.value = 0.1;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 100);
                break;
                
            case 'match':
                oscillator.frequency.value = 1200;
                gainNode.gain.value = 0.2;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 300);
                break;
                
            case 'error':
                oscillator.frequency.value = 400;
                gainNode.gain.value = 0.2;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 200);
                break;
        }
    },
    
    /**
     * Get browser language
     */
    getBrowserLanguage: function() {
        const lang = navigator.language || navigator.userLanguage || 'en';
        return lang.split('-')[0];
    },
    
    /**
     * Sanitize HTML
     */
    sanitizeHTML: function(str) {
        if (!str) return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    /**
     * Create element with attributes
     */
    createElement: function(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on')) {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    /**
     * Remove all children from element
     */
    removeAllChildren: function(element) {
        if (!element) return;
        
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    /**
     * Add class to element
     */
    addClass: function(element, className) {
        if (!element) return;
        
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += ' ' + className;
        }
    },
    
    /**
     * Remove class from element
     */
    removeClass: function(element, className) {
        if (!element) return;
        
        if (element.classList) {
            element.classList.remove(className);
        } else {
            element.className = element.className.replace(
                new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' '
            ).trim();
        }
    },
    
    /**
     * Toggle class on element
     */
    toggleClass: function(element, className) {
        if (!element) return;
        
        if (element.classList) {
            element.classList.toggle(className);
        } else {
            const classes = element.className.split(' ');
            const existingIndex = classes.indexOf(className);
            
            if (existingIndex >= 0) {
                classes.splice(existingIndex, 1);
            } else {
                classes.push(className);
            }
            
            element.className = classes.join(' ');
        }
    },
    
    /**
     * Check if element has class
     */
    hasClass: function(element, className) {
        if (!element) return false;
        
        if (element.classList) {
            return element.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
        }
    },
    
    /**
     * Get cookie value
     */
    getCookie: function(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },
    
    /**
     * Set cookie
     */
    setCookie: function(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    },
    
    /**
     * Delete cookie
     */
    deleteCookie: function(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
};

// Export to global scope
window.utils = Utils;