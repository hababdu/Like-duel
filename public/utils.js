// ==================== UTILITY FUNCTIONS ====================

/**
 * Format date to readable string
 */
function formatDate(date) {
    if (!date) return 'noma\'lum';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'hozir';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' daqiqa oldin';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' soat oldin';
    if (diff < 604800000) return Math.floor(diff / 86400000) + ' kun oldin';
    return d.toLocaleDateString('uz-UZ');
}

/**
 * Show notification
 */
function showNotification(title, message) {
    if (!window.elements?.notification) return;
    
    window.elements.notificationTitle.textContent = title;
    window.elements.notificationMessage.textContent = message;
    window.elements.notification.classList.add('active');
    
    setTimeout(() => {
        window.elements.notification.classList.remove('active');
    }, 3000);
}

/**
 * Generate random number between min and max
 */
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Calculate win rate
 */
function calculateWinRate(wins, total) {
    if (!total) return 0;
    return Math.round((wins / total) * 100);
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Check if object is empty
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Get URL parameter
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set URL parameter
 */
function setUrlParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

/**
 * Remove URL parameter
 */
function removeUrlParam(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
}

/**
 * Validate email
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate username
 */
function isValidUsername(username) {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Nusxa olindi', 'Matn nusxalandi');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

/**
 * Sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Safe JSON parse
 */
function safeJsonParse(str, defaultValue = {}) {
    try {
        return JSON.parse(str);
    } catch {
        return defaultValue;
    }
}

/**
 * Safe JSON stringify
 */
function safeJsonStringify(obj) {
    try {
        return JSON.stringify(obj);
    } catch {
        return '{}';
    }
}

// Export functions to global scope
window.utils = {
    formatDate,
    showNotification,
    getRandomNumber,
    debounce,
    calculateWinRate,
    formatNumber,
    isEmpty,
    deepClone,
    getUrlParam,
    setUrlParam,
    removeUrlParam,
    isValidEmail,
    isValidUsername,
    capitalize,
    truncateText,
    copyToClipboard,
    sleep,
    generateUniqueId,
    formatTime,
    safeJsonParse,
    safeJsonStringify
};