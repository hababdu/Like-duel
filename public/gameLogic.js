// GameLogic.js - To'liq ishlaydigan o'yin logikasi

// ==================== GLOBAL STATE ====================
window.gameState = window.gameState || {
    // Socket holati
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    
    // O'yin holati
    isInQueue: false,
    isInDuel: false,
    waitingForOpponent: false,
    matchCompleted: false,
    currentDuelId: null,
    timeLeft: 20,
    timerInterval: null,
    duelTimeout: null,
    
    // Match action holati (MUHIM!)
    isWaitingForMatchAction: false,
    matchActionTimeout: null,
    matchActionTimerInterval: null,
    
    // UI elementlari
    elements: {},
    
    // Do'stlar ro'yxati
    friendsList: [],
    
    // O'yin statistikasi
    gameStats: {
        totalDuels: 0,
        wins: 0,
        losses: 0,
        matches: 0
    }
};

window.userState = window.userState || {
    // User ma'lumotlari
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
    
    // 1. UI elementlarini topish
    this.initializeElements();
    
    // 2. Event listener'larni o'rnatish
    this.setupEventListeners();
    
    // 3. Socket manager ni ishga tushirish
    this.initializeSocket();
    
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
        duelContainer: document.getElementById('duelContainer') || document.querySelector('.duel-container'),
        
        // Opponent ma'lumotlari
        opponentAvatar: document.getElementById('opponentAvatar'),
        opponentName: document.getElementById('opponentName'),
        opponentUsername: document.getElementById('opponentUsername'),
        opponentRating: document.getElementById('opponentRating'),
        opponentMatches: document.getElementById('opponentMatches'),
        opponentLevel: document.getElementById('opponentLevel'),
        
        // Chat elementlari
        chatPartnerName: document.getElementById('chatPartnerName'),
        chatPartnerAvatar: document.getElementById('chatPartnerAvatar'),
        chatPartnerUsername: document.getElementById('chatPartnerUsername'),
        chatMessages: document.getElementById('chatMessages'),
        chatInput: document.getElementById('chatInput'),
        chatSendBtn: document.getElementById('chatSendBtn'),
        backToDuelsBtn: document.getElementById('backToDuelsBtn'),
        
        // Queue elementlari
        waitingCount: document.getElementById('waitingCount'),
        position: document.getElementById('position'),
        positionInfo: document.getElementById('positionInfo'),
        queueStatus: document.getElementById('queueStatus'),
        
        // Profile elementlari
        superLikeCount: document.getElementById('superLikeCount'),
        
        // Vote tugmalari
        likeBtn: document.getElementById('likeBtn'),
        superLikeBtn: document.getElementById('superLikeBtn'),
        passBtn: document.getElementById('passBtn') || document.getElementById('noBtn')
    };
    
    console.log('✅ UI elementlari topildi');
};

window.setupEventListeners = function() {
    console.log('🎯 Event listenerlar o\'rnatilmoqda...');
    
    // Vote tugmalari uchun event listener'lar
    if (window.gameState.elements.likeBtn) {
        window.gameState.elements.likeBtn.addEventListener('click', () => window.handleVote('like'));
    }
    
    if (window.gameState.elements.superLikeBtn) {
        window.gameState.elements.superLikeBtn.addEventListener('click', () => window.handleVote('superLike'));
    }
    
    if (window.gameState.elements.passBtn) {
        window.gameState.elements.passBtn.addEventListener('click', () => window.handleVote('pass'));
    }
    
    console.log('✅ Event listenerlar o\'rnatildi');
};

window.initializeSocket = function() {
    if (window.socketManager) {
        window.socketManager.connectToServer();
    } else {
        console.error('❌ Socket manager topilmadi');
    }
};

// ==================== VOTE HANDLING ====================

window.handleVote = function(choice) {
    console.log('🗳️ Ovoz berildi:', choice);
    
    if (!window.gameState.isInDuel || !window.gameState.currentDuelId) {
        console.error('❌ Siz duelda emassiz!');
        window.showNotification?.('Xato', 'Siz duelda emassiz');
        return;
    }
    
    // 1. Tugmalarni disable qilish
    this.disableVoteButtons();
    
    // 2. Status yangilash
    const choiceText = this.getChoiceText(choice);
    window.updateDuelStatus?.(`Siz ${choiceText} berdingiz. Kutish...`);
    
    // 3. Ovoz ma'lumotlarini tayyorlash
    const voteData = {
        duelId: window.gameState.currentDuelId,
        choice: choice
    };
    
    // 4. Serverga yuborish
    if (window.socketManager && window.socketManager.sendVote) {
        const success = window.socketManager.sendVote(window.gameState.currentDuelId, choice);
        
        if (!success) {
            console.error('❌ Ovoz yuborib bo\'lmadi');
            this.enableVoteButtons();
        }
    } else {
        console.error('❌ Socket manager topilmadi');
        this.enableVoteButtons();
    }
    
    // 5. Super like hisobini yangilash
    if (choice === 'superLike' && window.userState.dailySuperLikes > 0) {
        window.userState.dailySuperLikes--;
        window.updateUIFromUserState?.();
    }
};

window.disableVoteButtons = function() {
    ['likeBtn', 'superLikeBtn', 'passBtn', 'noBtn'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });
};

window.enableVoteButtons = function() {
    ['likeBtn', 'superLikeBtn', 'passBtn', 'noBtn'].forEach(btnId => {
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
        case 'superLike': return '💖 SUPER LIKE';
        case 'pass': return '✖ PASS';
        case 'skip': return '✖ SKIP';
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
    
    // 4. Chat taklifi tugmalarini KO'RSATISH
    this.showChatInviteButtons(data);
    
    // 5. Status yangilash
    window.updateDuelStatus?.('🎉 MATCH! Ikkalangiz ham like bosdingiz!');
    
    // 6. 30 soniya timeout o'rnatish
    this.startMatchActionTimeout();
    
    // 7. Statistikani yangilash
    this.updateMatchStats(data);
    
    console.log('✅ Match handling tugallandi');
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
    
    // Duel statusni yangilash
    if (window.gameState.elements.duelStatus) {
        window.gameState.elements.duelStatus.textContent = '🎉 MATCH!';
        window.gameState.elements.duelStatus.style.color = '#2ecc71';
        window.gameState.elements.duelStatus.style.fontWeight = 'bold';
        window.gameState.elements.duelStatus.style.fontSize = '1.5rem';
    }
};

window.showChatInviteButtons = function(data) {
    console.log('💬 Chat taklifi tugmalari ko\'rsatilmoqda...');
    
    let duelContainer = window.gameState.elements.duelContainer;
    if (!duelContainer) {
        duelContainer = document.querySelector('.duel-container');
        if (!duelContainer) {
            console.error('❌ Duel container topilmadi');
            return;
        }
    }
    
    // 1. Avvalgi chat taklifi elementlarini o'chirish
    const existingChatInvite = document.getElementById('chatInviteContainer');
    if (existingChatInvite) {
        existingChatInvite.remove();
    }
    
    // 2. Yangi chat taklifi container yaratish
    const chatInviteContainer = document.createElement('div');
    chatInviteContainer.id = 'chatInviteContainer';
    chatInviteContainer.className = 'chat-invite-container';
    chatInviteContainer.style.cssText = `
        position: relative;
        text-align: center;
        margin: 30px auto;
        padding: 0 20px;
        max-width: 500px;
        animation: fadeIn 0.8s ease-out;
        z-index: 1000;
    `;
    
    // 3. Partner ma'lumotlarini tayyorlash
    const partnerName = data.partner?.name || data.opponent?.name || data.partnerName || 'Foydalanuvchi';
    const partnerUsername = data.partner?.username || data.opponent?.username || data.partnerUsername || '';
    const partnerPhoto = data.partner?.photo || data.opponent?.photo || data.partnerPhoto || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff`;
    const partnerRating = data.partner?.rating || data.opponent?.rating || 1500;
    const partnerWins = data.partner?.wins || data.opponent?.wins || 0;
    
    // 4. HTML yaratish
    chatInviteContainer.innerHTML = `
        <div class="match-celebration-card">
            <!-- Background decoration -->
            <div class="match-bg-circle top-right"></div>
            <div class="match-bg-circle bottom-left"></div>
            
            <!-- Match celebration -->
            <div class="match-celebration-header">
                <div class="match-emoji">🎉</div>
                <h3 class="match-title">MATCH!</h3>
                <p class="match-message">
                    ${partnerName} bilan o'zaro like bosdingiz!
                </p>
            </div>
            
            <!-- Partner info -->
            <div class="partner-info-card">
                <div class="partner-avatar-container">
                    <img src="${partnerPhoto}" 
                         class="partner-avatar"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff'">
                </div>
                <div class="partner-details">
                    <div class="partner-name">${partnerName}</div>
                    <div class="partner-username">@${partnerUsername || 'foydalanuvchi'}</div>
                    <div class="partner-stats">
                        <span class="partner-stat"><i class="fas fa-trophy"></i> ${partnerRating}</span>
                        <span class="partner-stat"><i class="fas fa-crown"></i> ${partnerWins}</span>
                    </div>
                </div>
            </div>
            
            <!-- Action buttons -->
            <div class="match-action-buttons">
                <button id="acceptChatBtn" class="match-action-btn accept-btn">
                    <span class="btn-icon">💬</span>
                    <span class="btn-text">CHAT QILISH</span>
                </button>
                
                <button id="rejectChatBtn" class="match-action-btn reject-btn">
                    <span class="btn-icon">⏭️</span>
                    <span class="btn-text">KEYINGI DUEL</span>
                </button>
            </div>
            
            <!-- Timer -->
            <div class="match-timer-container">
                <div class="timer-bar-bg">
                    <div id="matchActionTimerBar" class="timer-bar-fill"></div>
                </div>
                <div class="timer-text">
                    Qaror qabul qilish uchun: <span id="matchActionTime" class="timer-count">30</span> soniya
                </div>
            </div>
            
            <!-- Stats info -->
            <div class="match-stats-info">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">🏆 G'alaba</div>
                        <div class="stat-value">+${data.ratingChange || 15} rating</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">💰 Mukofot</div>
                        <div class="stat-value">+${data.coinsEarned || 25} tanga</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">🤝 Match</div>
                        <div class="stat-value">#${window.userState.matches + 1}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 5. Container'ni qo'shish
    duelContainer.appendChild(chatInviteContainer);
    
    // 6. Event listener'larni qo'shish
    document.getElementById('acceptChatBtn').addEventListener('click', () => {
        console.log('💬 Chat taklifi qabul qilindi');
        this.acceptChatInvite(data);
    });
    
    document.getElementById('rejectChatBtn').addEventListener('click', () => {
        console.log('❌ Chat taklifi rad etildi');
        this.rejectChatInvite();
    });
    
    // 7. Timer boshlash
    this.startMatchActionTimer();
    
    console.log('✅ Chat taklifi tugmalari ko\'rsatildi');
};

window.startMatchActionTimeout = function() {
    // Avvalgi timeout'larni tozalash
    if (window.gameState.matchActionTimeout) {
        clearTimeout(window.gameState.matchActionTimeout);
    }
    
    // 30 soniya timeout o'rnatish
    window.gameState.matchActionTimeout = setTimeout(() => {
        if (window.gameState.isWaitingForMatchAction) {
            console.log('⏰ Match action vaqti tugadi, keyingi duelga o\'tish');
            this.proceedToNextDuel();
        }
    }, 30000);
};

window.startMatchActionTimer = function() {
    // Avvalgi intervalni tozalash
    if (window.gameState.matchActionTimerInterval) {
        clearInterval(window.gameState.matchActionTimerInterval);
    }
    
    let timeLeft = 30;
    const timerBar = document.getElementById('matchActionTimerBar');
    const timerText = document.getElementById('matchActionTime');
    
    if (!timerBar || !timerText) return;
    
    window.gameState.matchActionTimerInterval = setInterval(() => {
        timeLeft--;
        
        // Timer text yangilash
        timerText.textContent = timeLeft;
        
        // Timer bar yangilash
        const percent = (timeLeft / 30) * 100;
        timerBar.style.width = percent + '%';
        
        // Rang o'zgartirish
        if (timeLeft <= 10) {
            timerBar.style.background = 'linear-gradient(to right, #e74c3c, #c0392b)';
        } else if (timeLeft <= 20) {
            timerBar.style.background = 'linear-gradient(to right, #f39c12, #e67e22)';
        }
        
        // Vaqt tugaganda
        if (timeLeft <= 0) {
            clearInterval(window.gameState.matchActionTimerInterval);
        }
    }, 1000);
};

window.acceptChatInvite = function(data) {
    console.log('💬 Chat taklifi qabul qilindi:', data);
    
    // 1. Match action holatini tugatish
    window.gameState.isWaitingForMatchAction = false;
    
    // 2. Timerlarni tozalash
    this.clearMatchActionTimers();
    
    // 3. Chat taklifi UI ni yashirish
    const chatInviteContainer = document.getElementById('chatInviteContainer');
    if (chatInviteContainer) {
        chatInviteContainer.style.display = 'none';
    }
    
    // 4. Partner ma'lumotlarini saqlash
    const partnerData = {
        id: data.partner?.id || data.opponent?.id || data.partnerId,
        name: data.partner?.name || data.opponent?.name || data.partnerName || 'Foydalanuvchi',
        username: data.partner?.username || data.opponent?.username || data.partnerUsername || '',
        photo: data.partner?.photo || data.opponent?.photo || data.partnerPhoto,
        isMutual: true
    };
    
    // 5. Chat modalini ochish
    if (window.openChat) {
        window.openChat(partnerData);
    } else if (window.modalManager?.showChatModal) {
        window.modalManager.showChatModal(partnerData);
    }
    
    // 6. Socket orqali chat link yaratish
    if (window.socketManager && window.socketManager.createChatLink) {
        window.socketManager.createChatLink({
            partnerId: partnerData.id,
            partnerName: partnerData.name
        });
    }
};

window.rejectChatInvite = function() {
    console.log('❌ Chat taklifi rad etildi');
    
    // 1. Match action holatini tugatish
    window.gameState.isWaitingForMatchAction = false;
    
    // 2. Timerlarni tozalash
    this.clearMatchActionTimers();
    
    // 3. Chat taklifi UI ni yashirish
    const chatInviteContainer = document.getElementById('chatInviteContainer');
    if (chatInviteContainer) {
        chatInviteContainer.style.display = 'none';
    }
    
    // 4. Keyingi duelga o'tish
    this.proceedToNextDuel();
    
    // 5. Notification
    window.showNotification?.('⏭️ Keyingisi', 'Keyingi duelga o\'tilmoqda...');
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

// ==================== OTHER MATCH TYPES ====================

window.handleLikedOnly = function(data) {
    console.log('❤️ Faqat siz like berdidingiz');
    
    // O'yin holatini yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI yangilash
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
    
    // O'yin holatini yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI yangilash
    this.hideDuelUI();
    window.updateDuelStatus?.('Match bo\'lmadi 😔');
    
    // 3 soniya kutish
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
    // Stats yangilash
    this.updateStats(data);
};

window.handleTimeout = function(data) {
    console.log('⏰ Vaqt tugadi');
    
    // O'yin holatini yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI yangilash
    this.hideDuelUI();
    window.updateDuelStatus?.('Vaqt tugadi ⌛');
    
    // 3 soniya kutish
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
    // Stats yangilash
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
    window.gameState.currentPartner = null;
    
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
        window.gameState.elements.timer.style.animation = 'none';
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
    
    // Chat taklifi containerini o'chirish
    const chatInviteContainer = document.getElementById('chatInviteContainer');
    if (chatInviteContainer) {
        chatInviteContainer.remove();
    }
};

// ==================== TIMER FUNCTIONS ====================

window.startTimer = function() {
    console.log('⏰ Taymer boshlanmoqda');
    
    // Avvalgi timerlarni tozalash
    clearInterval(window.gameState.timerInterval);
    clearTimeout(window.gameState.duelTimeout);
    
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
                window.gameState.elements.timer.style.animation = 'pulse 0.5s infinite';
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
    
    // Duel timeout (25 soniya)
    window.gameState.duelTimeout = setTimeout(() => {
        if (!window.gameState.matchCompleted) {
            this.handleTimeout();
        }
    }, 25000);
};

window.stopAllTimers = function() {
    console.log('⏹️ Barcha taymerlar to\'xtatildi');
    
    clearInterval(window.gameState.timerInterval);
    clearTimeout(window.gameState.duelTimeout);
    clearTimeout(window.gameState.matchActionTimeout);
    clearInterval(window.gameState.matchActionTimerInterval);
    
    window.gameState.timerInterval = null;
    window.gameState.duelTimeout = null;
    window.gameState.matchActionTimeout = null;
    window.gameState.matchActionTimerInterval = null;
};

// ==================== DUEL STATE MANAGEMENT ====================

window.startDuelFlow = function() {
    console.log('🎮 Duel boshlash funksiyasi ishga tushdi');
    
    // 1. Gender tekshirish
    if (!window.userState.hasSelectedGender) {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        window.modalManager?.showGenderModal?.(true);
        window.utils?.showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return false;
    }
    
    // 2. Socket manager ishlayotganligini tekshirish
    if (!window.socketManager || !window.gameState.socket) {
        console.log('🔄 Socket manager ishga tushmoqda...');
        window.socketManager?.connectToServer?.();
        return false;
    }
    
    // 3. Navbatga kirish
    if (window.gameState.socket && window.gameState.isConnected) {
        console.log('✅ Serverga ulandi, navbatga kirilmoqda...');
        window.gameState.isInQueue = true;
        window.showScreen?.('queue');
        window.updateQueueStatus?.('Raqib izlanmoqda...');
        
        // Navbatga kirishni kechiktirish
        setTimeout(() => {
            window.socketManager?.enterQueue?.();
        }, 500);
        
        return true;
    } else {
        console.error('❌ Socket ulanmagan');
        window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
        return false;
    }
};

window.showMatchScreen = function(data) {
    console.log('🎉 Match screen ko\'rsatilmoqda:', data);
    
    // Match ekraniga o'tish
    window.showScreen?.('match');
    
    // Partner ma'lumotlarini ko'rsatish
    if (window.elements?.partnerName) {
        window.elements.partnerName.textContent = data.partnerName || 'Foydalanuvchi';
    }
    
    if (window.elements?.matchText) {
        window.elements.matchText.innerHTML = 
            `<span style="color: #fff; font-weight: bold;">${data.partnerName}</span> bilan suhbatlashish`;
    }
    
    if (window.elements?.rewardCoins) {
        window.elements.rewardCoins.textContent = data.coinsEarned || 25;
    }
    
    if (window.elements?.rewardXP) {
        window.elements.rewardXP.textContent = data.ratingChange || 15;
    }
    
    // Match tugmalarini yaratish
    if (window.elements?.matchOptions) {
        window.elements.matchOptions.innerHTML = `
            <div class="match-buttons-container">
                <button class="match-option-btn accept-btn" id="acceptChatBtn" 
                        style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);">
                    <i class="fas fa-comments"></i> Chat Qilish
                </button>
                <button class="match-option-btn skip-btn" id="skipChatBtn" 
                        style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                    <i class="fas fa-forward"></i> Keyingisi
                </button>
            </div>
            <div class="match-info">
                <p style="color: #ccc; font-size: 0.9rem; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i> Chatni qabul qilsangiz, do'stlar ro'yxatingizga qo'shilasiz
                </p>
            </div>
        `;
        
        // Event listener'larni qo'shish
        setTimeout(() => {
            const acceptBtn = document.getElementById('acceptChatBtn');
            const skipBtn = document.getElementById('skipChatBtn');
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    console.log('💬 Chat qabul qilindi');
                    window.acceptChatInvite(data);
                });
            }
            
            if (skipBtn) {
                skipBtn.addEventListener('click', () => {
                    console.log('⏭️ Keyingi duelga o\'tilmoqda');
                    window.proceedToNextDuel();
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

// ==================== FRIENDS MANAGEMENT ====================

window.addFriend = function(friendData) {
    console.log('👥 Do\'st qo\'shilmoqda:', friendData);
    
    // Do'stlarni local storage ga saqlash
    const currentFriends = window.storage?.loadFriendsList?.() || [];
    
    // Do'st mavjudligini tekshirish
    const existingIndex = currentFriends.findIndex(f => f.id === friendData.id);
    if (existingIndex === -1) {
        currentFriends.push({
            id: friendData.id,
            name: friendData.name,
            username: friendData.username,
            photo: friendData.photo,
            gender: friendData.gender,
            rating: friendData.rating || 1500,
            matches: friendData.matches || 0,
            online: friendData.online || false,
            lastActive: new Date(),
            isMutual: true,
            mutualMatchDate: new Date()
        });
        
        // Saqlash
        window.storage?.saveFriendsList?.(currentFriends);
        
        // User state yangilash
        window.userState.mutualMatchesCount = currentFriends.length;
        window.userState.friendsCount = currentFriends.length;
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        // Notification
        window.utils?.showNotification('🎉 Do\'st qo\'shildi', 
            `${friendData.name} do'stlaringiz ro'yxatiga qo'shildi!`);
        
        console.log('✅ Do\'st qo\'shildi');
        return true;
    }
    
    console.log('ℹ️ Do\'st allaqachon mavjud');
    return false;
};

// ==================== STATS FUNCTIONS ====================

window.updateMatchStats = function(data) {
    console.log('📊 Match stats yangilanmoqda');
    
    // User stats yangilash
    if (data.coinsEarned !== undefined) {
        window.userState.coins = (window.userState.coins || 0) + (data.coinsEarned || 25);
    }
    
    if (data.ratingChange !== undefined) {
        window.userState.rating = (window.userState.rating || 1500) + (data.ratingChange || 15);
    }
    
    window.userState.matches = (window.userState.matches || 0) + 1;
    window.userState.duels = (window.userState.duels || 0) + 1;
    window.userState.wins = (window.userState.wins || 0) + 1;
    window.userState.totalLikes = (window.userState.totalLikes || 0) + 1;
    window.userState.mutualMatchesCount = (window.userState.mutualMatchesCount || 0) + 1;
    
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
        if (data.mutualMatchesCount !== undefined) window.userState.mutualMatchesCount = data.mutualMatchesCount;
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
        window.gameState.elements.duelStatus.style.animation = 'fadeIn 0.5s';
        
        setTimeout(() => {
            window.gameState.elements.duelStatus.style.animation = 'none';
        }, 500);
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
    
    // Sodd notification
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
        if (window.initGameLogic) {
            window.initGameLogic();
        }
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
    showChatInviteButtons: window.showChatInviteButtons
};