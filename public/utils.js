// utils.js
window.utils = {
    showNotification: function(title, message) {
        const notif = document.getElementById('notification');
        const titleEl = document.getElementById('notificationTitle');
        const msgEl = document.getElementById('notificationMessage');

        if (!notif) return;

        titleEl.textContent = title;
        msgEl.textContent = message;
        notif.classList.add('active');

        setTimeout(() => notif.classList.remove('active'), 3000);
    }
};