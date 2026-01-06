// public/main.js - MAIN APPLICATION STARTER
console.log('🚀 Like Duel Application Starting...');

// Global state
window.gameState = {
    isConnected: false,
    isInQueue: false,
    isInDuel: false,
    currentDuelId: null,
    currentOpponent: null,
    currentPartner: null,
    timeLeft: 20,
    timerInterval: null,
    matchActionTimer: null,
    currentTab: 'duel',
    pendingChatInvite: null
};

window.userState = {
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
    friendsCount: 0
};

// Telegram WebApp init
if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    
    console.log('📱 Telegram WebApp initialized');
    
    // Auto login with Telegram data
    if (tg.initDataUnsafe?.user) {
        window.tgUser = tg.initDataUnsafe.user;
        console.log('👤 Telegram user:', window.tgUser.first_name);
    }
}

// Initialize application
function initApplication() {
    console.log('🚀 Initializing application...');
    
    // 1. Load storage
    if (window.storage) {
        window.storage.loadUserState();
        console.log('✅ Storage loaded');
    }
    
    // 2. Setup UI
    if (window.uiManager) {
        window.uiManager.initUserProfile();
        window.uiManager.initTabNavigation();
        window.uiManager.updateUIFromUserState();
        console.log('✅ UI Manager initialized');
    }
    
    // 3. Connect to server
    if (window.socketManager) {
        window.socketManager.connectToServer();
        console.log('✅ Socket connection started');
    }
    
    // 4. Setup modals
    if (window.modalManager) {
        window.modalManager.initAllModals();
        console.log('✅ Modal Manager initialized');
    }
    
    // 5. Setup game logic
    if (window.gameLogic) {
        window.gameLogic.initGameLogic();
        console.log('✅ Game Logic initialized');
    }
    
    // 6. Auto show gender modal if not selected
    setTimeout(() => {
        if (!window.userState.hasSelectedGender) {
            console.log('⚠️ Gender not selected, showing modal');
            window.modalManager?.showGenderModal?.(true);
            window.utils?.showNotification('Gender tanlang', 'Oʻyin boshlash uchun gender tanlashingiz kerak');
        }
    }, 2000);
    
    // 7. Setup start button directly (emergency fix)
    setupStartButton();
    
    console.log('🎉 Application fully initialized!');
}

// Emergency fix for start button
function setupStartButton() {
    const startBtn = document.getElementById('startBtn');
    if (!startBtn) {
        console.error('❌ startBtn not found!');
        return;
    }
    
    console.log('🔧 Setting up start button...');
    
    // Remove existing listeners
    const newStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);
    
    // Add click listener
    newStartBtn.addEventListener('click', function() {
        console.log('🎮 Start button clicked!');
        startDuelGame();
    });
    
    console.log('✅ Start button setup complete');
}

// Start duel game function
function startDuelGame() {
    console.log('🎮 Starting duel game...');
    
    // Check gender
    if (!window.userState.hasSelectedGender) {
        console.log('⚠️ Gender not selected');
        window.modalManager?.showGenderModal?.(true);
        window.utils?.showNotification('Diqqat', 'Avval gender tanlang!');
        return;
    }
    
    // Check connection
    if (!window.socketManager?.socket?.connected) {
        console.log('⚠️ Not connected to server');
        window.utils?.showNotification('Xato', 'Serverga ulanib boʻlmadi');
        // Try to reconnect
        window.socketManager?.connectToServer();
        return;
    }
    
    console.log('✅ All checks passed, entering queue...');
    
    // Show queue screen
    const queueScreen = document.getElementById('queueScreen');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const duelScreen = document.getElementById('duelScreen');
    
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (duelScreen) duelScreen.classList.add('hidden');
    if (queueScreen) queueScreen.classList.remove('hidden');
    
    // Update queue status
    const queueStatus = document.getElementById('queueStatus');
    if (queueStatus) queueStatus.textContent = 'Raqib izlanmoqda...';
    
    // Enter queue
    if (window.socketManager?.socket) {
        window.socketManager.socket.emit('enter_queue');
        console.log('📝 Enter queue signal sent');
    } else {
        console.error('❌ Socket not available');
    }
}

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplication);
} else {
    initApplication();
}

// Auto reconnect
setInterval(() => {
    if (window.socketManager?.socket && !window.socketManager.socket.connected) {
        console.log('🔄 Reconnecting socket...');
        window.socketManager.connectToServer();
    }
}, 10000);

// Export for debugging
window.startGame = startDuelGame;
window.debugGameState = () => console.log('Game State:', window.gameState);
window.debugUserState = () => console.log('User State:', window.userState);

console.log('📄 main.js loaded and ready');