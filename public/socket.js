// GameLogic.js - To'liq tuzatilgan versiya

// ==================== GLOBAL STATE ====================
window.gameState = window.gameState || {
    // Socket holati
    socket: null,
    isConnected: false,
    
    // O'yin holati
    isInQueue: false,
    isInDuel: false,
    currentDuelId: null,
    timeLeft: 20,
    timerInterval: null,
    
    // Match action holati
    isWaitingForMatchAction: false,
    matchActionTimeout: null,
    matchActionTimerInterval: null,
    
    // UI elementlari
    elements: {},
    
    // O'yin statistikasi
    gameStats: {
        totalDuels: 0,
        wins: 0,
        losses: 0,
        matches: 0
    }
};

window.userState = window.userState || {
    currentGender: null,
    hasSelectedGender: false,
    coins: 100,
    level: 1,
    rating: 1500,
    matches: 0,
    duels: 0,
    wins: 0,
    totalLikes: 0,
    dailySuperLikes: 5,
    bio: '',
    filter: 'both',
    mutualMatchesCount: 0,
    friendsCount: 0
};

// ==================== INITIALIZATION ====================

window.initGameLogic = function() {
    console.log('🎮 Game Logic initialized');
    
    this.initializeElements();
    this.setupEventListeners();
    
    console.log('✅ Game Logic to\'liq ishga tushdi');
};

window.initializeElements = function() {
    console.log('🔍 UI elementlari topilmoqda...');
    
    window.gameState.elements = {
        // Duel ekrani elementlari
        timer: document.getElementById('timer'),
        duelStatus: document.getElementById('duelStatus'),
        voteButtons: document.getElementById('voteButtons'),
        opponentInfo: document.getElementById('opponentInfo'),
        duelContainer: document.getElementById('duelContainer'),
        
        // Opponent ma'lumotlari
        opponentAvatar: document.getElementById('opponentAvatar'),
        opponentName: document.getElementById('opponentName'),
        opponentUsername: document.getElementById('opponentUsername'),
        opponentRating: document.getElementById('opponentRating'),
        opponentMatches: document.getElementById('opponentMatches'),
        opponentLevel: document.getElementById('opponentLevel'),
        
        // Match elements
        matchScreen: document.getElementById('matchScreen'),
        partnerName: document.getElementById('partnerName'),
        matchText: document.getElementById('matchText'),
        matchRewards: document.getElementById('matchRewards'),
        matchOptions: document.getElementById('matchOptions'),
        
        // Vote tugmalari
        likeBtn: document.getElementById('likeBtn'),
        superLikeBtn: document.getElementById('superLikeBtn'),
        passBtn: document.getElementById('passBtn'),
        
        // Super like counter
        superLikeCount: document.getElementById('superLikeCount')
    };
    
    console.log('✅ UI elementlari topildi');
};

window.setupEventListeners = function() {
    console.log('🎯 Event listenerlar o\'rnatilmoqda...');
    
    // Vote tugmalari uchun event listener'lar
    if (window.gameState.elements.likeBtn) {
        window.gameState.elements.likeBtn.addEventListener('click', () => this.handleVote('like'));
    }
    
    if (window.gameState.elements.superLikeBtn) {
        window.gameState.elements.superLikeBtn.addEventListener('click', () => this.handleVote('super_like'));
    }
    
    if (window.gameState.elements.passBtn) {
        window.gameState.elements.passBtn.addEventListener('click', () => this.handleVote('skip'));
    }
    
    console.log('✅ Event listenerlar ornatildi');
};

// ==================== VOTE HANDLING ====================

window.handleVote = function(choice) {
    console.log('🗳️ Ovoz berildi:', choice);
    
    if (!window.gameState.isInDuel || !window.gameState.currentDuelId) {
        console.error('❌ Siz duelda emassiz!');
        window.showNotification?.('Xato', 'Siz duelda emassiz');
        return;
    }
    
    // Tugmalarni disable qilish
    this.disableVoteButtons();
    
    // Status yangilash
    const choiceText = this.getChoiceText(choice);
    window.updateDuelStatus?.(`Siz ${choiceText} berdingiz. Kutish...`);
    
    // Ovoz ma'lumotlarini yuborish
    if (window.socketManager && window.socketManager.sendVote) {
        const success = window.socketManager.sendVote(window.gameState.currentDuelId, choice);
        
        if (!success) {
            this.enableVoteButtons();
        }
    }
    
    // Super like hisobini yangilash
    if (choice === 'super_like' && window.userState.dailySuperLikes > 0) {
        window.userState.dailySuperLikes--;
        window.updateUIFromUserState?.();
    }
};

window.disableVoteButtons = function() {
    ['likeBtn', 'superLikeBtn', 'passBtn'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });
};

window.enableVoteButtons = function() {
    ['likeBtn', 'superLikeBtn', 'passBtn'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });
};

window.getChoiceText = function(choice) {
    switch(choice) {
        case 'like': return '❤️ LIKE';
        case 'super_like': return '💖 SUPER LIKE';
        case 'skip': return '✖ PASS';
        default: return choice;
    }
};

// ==================== MATCH HANDLING ====================

window.handleMatch = function(data) {
    console.log('🎉🎉🎉 MATCH DETECTED! Data:', data);
    
    // 1. O'yin holatini yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    window.gameState.isWaitingForMatchAction = true;
    
    // 2. Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // 3. UI elementlarini yashirish
    this.hideDuelUI();
    
    // 4. Match ekranini ko'rsatish
    this.showMatchScreen(data);
    
    // 5. Statistikani yangilash
    this.updateMatchStats(data);
    
    console.log('✅ Match handling tugallandi');
};

window.showMatchScreen = function(data) {
    console.log('🎉 Match screen ko\'rsatilmoqda');
    
    // Match ekraniga o'tish
    window.showScreen?.('match');
    
    // Partner ma'lumotlarini ko'rsatish
    if (window.gameState.elements.partnerName) {
        window.gameState.elements.partnerName.textContent = data.partnerName;
    }
    
    if (window.gameState.elements.matchText) {
        window.gameState.elements.matchText.innerHTML = 
            `<span style="color:#2ecc71; font-weight:bold">${data.partnerName}</span> bilan o'zaro like bosdingiz!`;
    }
    
    // Match options yaratish
    if (window.gameState.elements.matchOptions) {
        window.gameState.elements.matchOptions.innerHTML = `
            <div class="match-buttons-container">
                <button class="match-option-btn accept-btn" id="acceptChatBtnMatch" 
                        style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);">
                    <i class="fas fa-comments"></i> 💬 Chat Qilish
                </button>
                <button class="match-option-btn skip-btn" id="skipChatBtnMatch" 
                        style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                    <i class="fas fa-forward"></i> ⏭️ Keyingi Duel
                </button>
            </div>
            <div class="match-info">
                <p style="color: #ccc; font-size: 0.9rem; margin-top: 10px; text-align: center;">
                    <i class="fas fa-info-circle"></i> Chatni qabul qilsangiz, do'stlar ro'yxatingizga qo'shilasiz
                </p>
            </div>
        `;
        
        // Event listener'larni qo'shish
        setTimeout(() => {
            const acceptBtn = document.getElementById('acceptChatBtnMatch');
            const skipBtn = document.getElementById('skipChatBtnMatch');
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    console.log('💬 Chat qabul qilindi');
                    this.acceptChatInvite(data);
                });
            }
            
            if (skipBtn) {
                skipBtn.addEventListener('click', () => {
                    console.log('⏭️ Keyingi duelga o\'tilmoqda');
                    this.proceedToNextDuel();
                });
            }
        }, 100);
    }
    
    // Confetti chiqarish
    if (window.confetti) {
        setTimeout(() => {
            window.confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }, 500);
    }
};

window.hideDuelUI = function() {
    // Timer yashirish
    if (window.gameState.elements.timer) {
        window.gameState.elements.timer.style.display = 'none';
    }
    
    // Vote tugmalarini yashirish
    if (window.gameState.elements.voteButtons) {
        window.gameState.elements.voteButtons.style.display = 'none';
    }
    
    // Opponent info yashirish
    if (window.gameState.elements.opponentInfo) {
        window.gameState.elements.opponentInfo.style.display = 'none';
    }
};

// ==================== CHAT HANDLING ====================

window.acceptChatInvite = function(data) {
    console.log('💬 Chat taklifi qabul qilindi:', data);
    
    // 1. Match action holatini tugatish
    window.gameState.isWaitingForMatchAction = false;
    
    // 2. Timerlarni tozalash
    this.clearMatchActionTimers();
    
    // 3. Chat taklifi yuborish
    if (data.partnerId && window.socketManager && window.socketManager.sendChatInvite) {
        window.socketManager.sendChatInvite(data.partnerId);
    }
    
    // 4. Chat modalini ko'rsatish
    if (window.modalManager && window.modalManager.showChatModal) {
        window.modalManager.showChatModal({
            id: data.partnerId,
            name: data.partnerName,
            username: data.partnerUsername,
            photo: data.partnerPhoto
        });
    }
    
    // 5. Notification
    window.showNotification?.('🎉 Chat', `${data.partnerName} bilan chat boshlanmoqda...`);
};

// ==================== OTHER MATCH TYPES ====================

window.handleLikedOnly = function(data) {
    console.log('❤️ Faqat siz like berdidingiz');
    
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    this.stopAllTimers();
    this.hideDuelUI();
    
    window.updateDuelStatus?.('Siz like berdidingiz, lekin raqib bermadi 😔');
    
    // 3 soniya kutish
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
    // Stats yangilash
    this.updateStats(data);
};

window.handleNoMatch = function(data) {
    console.log('❌ Hech kim like bermadi');
    
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    this.stopAllTimers();
    this.hideDuelUI();
    window.updateDuelStatus?.('Match bo\'lmadi 😔');
    
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
    this.updateStats(data);
};

window.handleTimeout = function(data) {
    console.log('⏰ Vaqt tugadi');
    
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    this.stopAllTimers();
    this.hideDuelUI();
    window.updateDuelStatus?.('Vaqt tugadi ⌛');
    
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
    if (data) {
        this.updateStats(data);
    }
};

// ==================== DUEL FLOW ====================

window.proceedToNextDuel = function() {
    console.log('🔄 Keyingi duelga o\'tilmoqda...');
    
    // 1. Barcha timerlarni tozalash
    this.stopAllTimers();
    this.clearMatchActionTimers();
    
    // 2. Holatlarni reset qilish
    window.gameState.isInDuel = false;
    window.gameState.isWaitingForMatchAction = false;
    window.gameState.matchCompleted = false;
    window.gameState.currentDuelId = null;
    
    // 3. UI ni tozalash
    this.resetDuelUI();
    
    // 4. Queue ekraniga qaytish
    window.gameState.isInQueue = true;
    window.showScreen?.('queue');
    
    // 5. Navbatga qaytish
    if (window.gameState.socket && window.gameState.isConnected) {
        setTimeout(() => {
            window.gameState.socket.emit('enter_queue');
            window.updateQueueStatus?.('Yangi duel izlanmoqda...');
        }, 1000);
    }
};

window.resetDuelUI = function() {
    console.log('🔄 Duel UI reset qilinmoqda');
    
    // Timer reset
    if (window.gameState.elements.timer) {
        window.gameState.elements.timer.textContent = '20';
        window.gameState.elements.timer.style.color = '#2ecc71';
        window.gameState.elements.timer.style.display = 'block';
    }
    
    // Vote tugmalarini reset qilish
    this.enableVoteButtons();
    
    // UI elementlarini ko'rsatish
    if (window.gameState.elements.voteButtons) {
        window.gameState.elements.voteButtons.style.display = 'flex';
    }
    
    if (window.gameState.elements.opponentInfo) {
        window.gameState.elements.opponentInfo.style.display = 'block';
    }
    
    // Status yangilash
    window.updateDuelStatus?.('Raqibingizni baholang...');
};

// ==================== TIMER FUNCTIONS ====================

window.startTimer = function() {
    console.log('⏰ Taymer boshlanmoqda');
    
    // Avvalgi timerlarni tozalash
    clearInterval(window.gameState.timerInterval);
    
    // Taymerni reset qilish
    window.gameState.timeLeft = 20;
    
    // UI yangilash
    if (window.gameState.elements.timer) {
        window.gameState.elements.timer.textContent = '20';
        window.gameState.elements.timer.style.color = '#2ecc71';
        window.gameState.elements.timer.style.display = 'block';
    }
    
    // Taymer interval
    window.gameState.timerInterval = setInterval(() => {
        window.gameState.timeLeft--;
        
        if (window.gameState.elements.timer) {
            window.gameState.elements.timer.textContent = window.gameState.timeLeft;
            
            // Rang o'zgartirish
            if (window.gameState.timeLeft <= 5) {
                window.gameState.elements.timer.style.color = '#e74c3c';
            } else if (window.gameState.timeLeft <= 10) {
                window.gameState.elements.timer.style.color = '#f39c12';
            }
        }
        
        // Vaqt tugaganda
        if (window.gameState.timeLeft <= 0) {
            clearInterval(window.gameState.timerInterval);
            this.handleTimeout();
        }
    }, 1000);
};

window.stopAllTimers = function() {
    console.log('⏹️ Barcha taymerlar to\'xtatildi');
    
    clearInterval(window.gameState.timerInterval);
    clearTimeout(window.gameState.matchActionTimeout);
    clearInterval(window.gameState.matchActionTimerInterval);
    
    window.gameState.timerInterval = null;
    window.gameState.matchActionTimeout = null;
    window.gameState.matchActionTimerInterval = null;
};

window.clearMatchActionTimers = function() {
    if (window.gameState.matchActionTimeout) {
        clearTimeout(window.gameState.matchActionTimeout);
        window.gameState.matchActionTimeout = null;
    }
    
    if (window.gameState.matchActionTimerInterval) {
        clearInterval(window.gameState.matchActionTimerInterval);
        window.gameState.matchActionTimerInterval = null;
    }
};

// ==================== STATS FUNCTIONS ====================

window.updateMatchStats = function(data) {
    console.log('📊 Match stats yangilanmoqda');
    
    // User stats yangilash
    if (data.coinsEarned !== undefined) {
        window.userState.coins = (window.userState.coins || 0) + data.coinsEarned;
    }
    
    if (data.ratingChange !== undefined) {
        window.userState.rating = (window.userState.rating || 1500) + data.ratingChange;
    }
    
    window.userState.matches = (window.userState.matches || 0) + 1;
    window.userState.duels = (window.userState.duels || 0) + 1;
    window.userState.wins = (window.userState.wins || 0) + 1;
    window.userState.totalLikes = (window.userState.totalLikes || 0) + 1;
    
    // Game stats yangilash
    window.gameState.gameStats.matches++;
    window.gameState.gameStats.wins++;
    window.gameState.gameStats.totalDuels++;
    
    // UI yangilash
    window.updateUIFromUserState?.();
    
    // Saqlash
    if (window.storage && window.storage.saveUserState) {
        window.storage.saveUserState();
    }
};

window.updateStats = function(data) {
    console.log('📊 Stats yangilanmoqda:', data);
    
    // Data bor bo'lsa, yangilash
    if (data) {
        if (data.coins !== undefined) window.userState.coins = data.coins;
        if (data.rating !== undefined) window.userState.rating = data.rating;
        if (data.matches !== undefined) window.userState.matches = data.matches;
        if (data.duels !== undefined) window.userState.duels = data.duels;
        if (data.wins !== undefined) window.userState.wins = data.wins;
        if (data.totalLikes !== undefined) window.userState.totalLikes = data.totalLikes;
    }
    
    // Game stats yangilash
    if (data && data.isMatch) {
        window.gameState.gameStats.matches++;
        window.gameState.gameStats.wins++;
    } else if (data && data.isLikedOnly) {
        window.gameState.gameStats.wins++;
    } else {
        window.gameState.gameStats.losses++;
    }
    
    if (!data || !data.isMatch) {
        window.gameState.gameStats.totalDuels++;
    }
    
    // UI yangilash
    window.updateUIFromUserState?.();
    
    // Saqlash
    if (window.storage && window.storage.saveUserState) {
        window.storage.saveUserState();
    }
};

// ==================== UTILITIES ====================

window.updateDuelStatus = function(message) {
    console.log('📝 Duel status:', message);
    
    if (window.gameState.elements.duelStatus) {
        window.gameState.elements.duelStatus.textContent = message;
    }
};

window.updateQueueStatus = function(message) {
    console.log('📝 Queue status:', message);
    
    if (window.gameState.elements.queueStatus) {
        window.gameState.elements.queueStatus.textContent = message;
    }
};

window.showNotification = function(title, message) {
    console.log(`📢 ${title}: ${message}`);
    
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(message);
    } else {
        alert(`${title}\n${message}`);
    }
};

// ==================== AUTO INITIALIZE ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM yuklandi, Game Logic ishga tushmoqda...');
    setTimeout(() => {
        window.initGameLogic?.();
    }, 1000);
});

// Global export
window.gameLogic = {
    initGameLogic: window.initGameLogic,
    handleMatch: window.handleMatch,
    handleLikedOnly: window.handleLikedOnly,
    handleNoMatch: window.handleNoMatch,
    handleTimeout: window.handleTimeout,
    handleVote: window.handleVote,
    startTimer: window.startTimer,
    stopAllTimers: window.stopAllTimers,
    proceedToNextDuel: window.proceedToNextDuel,
    resetDuelUI: window.resetDuelUI,
    showMatchScreen: window.showMatchScreen,
    acceptChatInvite: window.acceptChatInvite
};