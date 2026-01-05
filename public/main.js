// public/main.js - Barcha modullarni birlashtiruvchi asosiy fayl

// ==================== GLOBAL STATE (agar boshqa fayllarda yo'q bo'lsa) ====================
window.gameState = window.gameState || {
    isConnected: false,
    isInQueue: false,
    isInDuel: false,
    currentDuelId: null,
    currentOpponent: null,
    currentPartner: null,
    timeLeft: 20,
    timerInterval: null,
    matchActionTimer: null,
    matchActionTimeout: null,
    pendingChatInvite: null,
    currentTab: 'duel'
};

window.userState = window.userState || {
    coins: 100,
    level: 1,
    rating: 1500,
    matches: 0,
    duels: 0,
    wins: 0,
    totalLikes: 0,
    dailySuperLikes: 3,
    bio: '',
    currentGender: null,
    filter: 'not_specified',
    hasSelectedGender: false,
    mutualMatchesCount: 0,
    friendsCount: 0
};

// ==================== MAIN APPLICATION ====================
function initApplication() {
    console.log('🚀 Like Duel ilovasi ishga tushmoqda...');

    // 1. Storage yuklash
    if (window.storage) {
        window.storage.loadUserState();
        console.log('📦 User state yuklandi');
    }

    // 2. Utils tayyor
    if (!window.utils) {
        console.warn('⚠️ utils.js yuklanmagan');
    } else {
        console.log('✅ utils.js tayyor');
    }

    // 3. Socket ulanish
    if (window.socketManager) {
        window.socketManager.connectToServer();
        console.log('🔌 Socket ulanmoqda...');
    } else {
        console.error('❌ socket.js yuklanmagan');
    }

    // 4. UI Manager
    if (window.uiManager) {
        window.uiManager.initUserProfile();
        window.uiManager.initTabNavigation();
        window.uiManager.updateUIFromUserState();
        console.log('✅ UI Manager ishga tushdi');
    } else {
        console.error('❌ ui.js yuklanmagan');
    }

    // 5. Modal Manager
    if (window.modalManager) {
        window.modalManager.initAllModals();
        console.log('✅ Modal Manager ishga tushdi');
    } else {
        console.error('❌ modal.js yuklanmagan');
    }

    // 6. Game Logic
    if (window.gameLogic) {
        window.gameLogic.initGameLogic();
        console.log('✅ Game Logic ishga tushdi');
    } else {
        console.error('❌ gameLogic.js yuklanmagan');
    }

    // 7. Avtomatik gender modal (agar tanlanmagan bo'lsa)
    setTimeout(() => {
        if (!window.userState.hasSelectedGender) {
            console.log('⚠️ Gender tanlanmagan — modal koʻrsatilmoqda');
            window.modalManager?.showGenderModal(true);
            window.utils?.showNotification('Gender tanlang', 'Oʻyin boshlash uchun gender tanlashingiz kerak');
        }
    }, 2000);

    // 8. Telegram WebApp tayyorlash (agar mavjud bo'lsa)
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        console.log('📱 Telegram WebApp tayyor');
    }

    console.log('🎉 Like Duel ilovasi toʻliq ishga tushdi!');
    window.utils?.showNotification('Xush kelibsiz!', 'Like Duel oʻyini tayyor');
}
// main.js da, initApplication oxiriga:
setInterval(() => {
    if (window.socketManager?.socket && !window.socketManager.socket.connected) {
        console.log('🔄 Socket uzilgan, qayta ulanmoqda...');
        window.socketManager.connectToServer();
    }
}, 10000); // Har 10 soniyada tekshirish

// ==================== DOM READY ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplication);
} else {
    initApplication();
}

// ==================== ERROR HANDLING ====================
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise xatosi:', event.reason);
    window.utils?.showNotification('Xatolik', 'Tizimda xatolik yuz berdi');
});

window.addEventListener('error', (event) => {
    console.error('❌ JS xatosi:', event.error);
});

// ==================== SERVICE WORKER (ixtiyoriy PWA uchun) ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker roʻyxatdan oʻtdi', reg))
        .catch(err => console.error('❌ Service Worker xatosi:', err));
}

console.log('main.js yuklandi va ishga tushirildi');