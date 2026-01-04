// ==================== GAME LOGIC ====================
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
    currentOpponent: null,
    timeLeft: 20,
    timerInterval: null,
    duelTimeout: null,
    
    // Match action holati
    isWaitingForMatchAction: false,
    matchActionTimeout: null,
    matchActionTimerInterval: null,
    currentPartner: null,
    
    // Chat holati
    pendingChatInvite: null,
    chatInviteRequestId: null,
    hasRespondedToChat: false,
    
    // UI elementlari
    elements: {},
    
    // O'yin statistikasi
    gameStats: {
        totalDuels: 0,
        wins: 0,
        losses: 0,
        matches: 0,
        superLikesGiven: 0
    }
};

// ==================== INITIALIZATION ====================
window.initGameLogic = function() {
    console.log('🎮 Game Logic initialized');
    this.initializeElements();
    this.setupEventListeners();
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
        duelContainer: document.getElementById('duelScreen') || document.querySelector('.duel-container'),
        
        // Opponent ma'lumotlari
        opponentAvatar: document.getElementById('opponentAvatar'),
        opponentName: document.getElementById('opponentName'),
        opponentUsername: document.getElementById('opponentUsername'),
        opponentRating: document.getElementById('opponentRating'),
        opponentMatches: document.getElementById('opponentMatches'),
        opponentLevel: document.getElementById('opponentLevel'),
        
        // Super like counter
        superLikeCount: document.getElementById('superLikeCount'),
        
        // Vote tugmalari
        likeBtn: document.getElementById('likeBtn'),
        superLikeBtn: document.getElementById('superLikeBtn'),
        passBtn: document.getElementById('noBtn')
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
    
    console.log('✅ Event listenerlar o\'rnatildi');
};

window.initializeSocket = function() {
    if (window.socketManager) {
        window.socketManager.connectToServer();
    } else {
        console.error('❌ Socket manager topilmadi');
    }
};

// ==================== DUEL START ====================
window.startDuelFlow = function() {
    console.log('🎮 Duel boshlash funksiyasi');
    
    // Gender tekshirish
    if (!window.userState.hasSelectedGender) {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        window.modalManager?.showGenderModal?.(true);
        window.utils?.showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return false;
    }
    
    // Socket tekshirish
    if (!window.gameState.socket || !window.gameState.isConnected) {
        console.log('🔄 Socket ulanmagan, ulanish...');
        if (window.socketManager?.connectToServer) {
            window.socketManager.connectToServer();
        }
        return false;
    }
    
    // Navbatga kirish
    console.log('✅ Serverga ulandi, navbatga kirilmoqda...');
    window.gameState.isInQueue = true;
    window.showScreen?.('queue');
    window.updateQueueStatus?.('Raqib izlanmoqda...');
    
    setTimeout(() => {
        window.socketManager?.enterQueue?.();
    }, 500);
    
    return true;
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
    
    // Super like hisobini yangilash
    if (choice === 'super_like' && window.userState.dailySuperLikes > 0) {
        window.userState.dailySuperLikes--;
        window.updateUIFromUserState?.();
    } else if (choice === 'super_like' && window.userState.dailySuperLikes <= 0) {
        this.enableVoteButtons();
        window.utils?.showNotification('Xato', 'Kunlik SUPER LIKE tugadi!');
        return;
    }
    
    // Serverga yuborish
    if (window.socketManager && window.socketManager.sendVote) {
        const success = window.socketManager.sendVote(window.gameState.currentDuelId, choice);
        
        if (!success) {
            console.error('❌ Ovoz yuborib bo\'lmadi');
            this.enableVoteButtons();
        }
    }
};

window.disableVoteButtons = function() {
    ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });
};

window.enableVoteButtons = function() {
    ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(btnId => {
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
        case 'pass': return '✖ PASS';
        case 'skip': return '✖ SKIP';
        default: return choice;
    }
};

// ==================== MATCH HANDLING ====================
window.handleMatch = function(data) {
    console.log('🎉🎉🎉 MATCH DETECTED! Data:', data);
    
    // Holatlarni yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    window.gameState.currentPartner = data.partner || data.opponent;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI elementlarini yashirish
    this.hideDuelUI();
    
    // Raqib onlinemi tekshirish
    if (!data.partner.online) {
        window.utils?.showNotification('Diqqat', 'Raqib offline, keyingi duelga o\'tish');
        this.skipChatInvite();
        return;
    }
    
    // Chat taklifi tugmalarini ko'rsatish (ikki tomonda ham)
    this.showMatchOptions(data);
    
    // 30 soniya timeout o'rnatish
    this.startMatchActionTimeout();
    
    // Statistikani yangilash
    this.updateMatchStats(data);
    
    console.log('✅ Match handling tugallandi');
};

window.showMatchOptions = function(data) {
    console.log('💬 Match options ko\'rsatilmoqda...');
    
    // Partner ma'lumotlari
    const partner = data.partner || data.opponent || {};
    const partnerName = partner.name || 'Foydalanuvchi';
    const partnerUsername = partner.username || '';
    const partnerPhoto = partner.photo || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff`;
    
    // Duel container
    let duelContainer = window.gameState.elements.duelContainer;
    if (!duelContainer) {
        duelContainer = document.getElementById('duelScreen');
    }
    
    if (!duelContainer) {
        console.error('❌ Duel container topilmadi');
        return;
    }
    
    // Avvalgi elementlarni o'chirish
    const existingMatchUI = document.getElementById('matchOptionsContainer');
    if (existingMatchUI) existingMatchUI.remove();
    
    // Yangi UI yaratish
    const matchContainer = document.createElement('div');
    matchContainer.id = 'matchOptionsContainer';
    matchContainer.className = 'match-options-container';
    
    matchContainer.innerHTML = `
        <div class="match-celebration-card">
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
                <img src="${partnerPhoto}" class="partner-avatar" 
                    onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff'">
                <div class="partner-details">
                    <div class="partner-name">${partnerName}</div>
                    <div class="partner-username">@${partnerUsername || 'foydalanuvchi'}</div>
                </div>
            </div>
            
            <!-- Action buttons -->
            <div class="match-action-buttons">
                <button id="acceptChatBtn" class="match-action-btn accept-btn">
                    <span class="btn-icon">💬</span>
                    <span class="btn-text">CHAT QILISH</span>
                </button>
                
                <button id="skipChatBtn" class="match-action-btn skip-btn">
                    <span class="btn-icon">⏭️</span>
                    <span class="btn-text">KEYINGI DUEL</span>
                </button>
            </div>
            
            <!-- Timer -->
            <div class="match-timer-container">
                <div class="timer-text">
                    Qaror qabul qilish uchun: <span id="matchActionTime">30</span> soniya
                </div>
                <div class="timer-bar-bg">
                    <div id="matchActionTimerBar" class="timer-bar-fill"></div>
                </div>
            </div>
            
            <!-- Stats info -->
            <div class="match-stats-info">
                <p><i class="fas fa-coins"></i> +${data.coinsEarned || 25} tanga</p>
                <p><i class="fas fa-star"></i> +${data.ratingChange || 15} reyting</p>
                <p><i class="fas fa-users"></i> Do'stlar ro'yxatiga qo'shilish mumkin</p>
            </div>
        </div>
    `;
    
    duelContainer.appendChild(matchContainer);
    
    // Event listener'larni qo'shish
    document.getElementById('acceptChatBtn').addEventListener('click', () => {
        console.log('💬 Chat taklifi qabul qilindi');
        this.acceptChatInvite(data);
    });
    
    document.getElementById('skipChatBtn').addEventListener('click', () => {
        console.log('⏭️ Chat taklifi rad etildi');
        this.skipChatInvite();
    });
    
    // Timer boshlash
    this.startMatchActionTimer();
    
    // Confetti
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

window.startMatchActionTimeout = function() {
    // Avvalgi timeout'larni tozalash
    if (window.gameState.matchActionTimeout) {
        clearTimeout(window.gameState.matchActionTimeout);
    }
    
    // 30 soniya timeout o'rnatish
    window.gameState.matchActionTimeout = setTimeout(() => {
        if (window.gameState.matchCompleted && !window.gameState.hasRespondedToChat) {
            console.log('⏰ Match action vaqti tugadi, keyingi duelga o\'tish');
            this.skipChatInvite();
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
    
    // Confirm dialog qo'shish
    if (!confirm(`${data.partner.name} bilan chat qilishni xohlaysizmi? Chat qabul qilingandan keyin do'stlar ro'yxatiga qo'shilasiz.`)) {
        return;
    }
    
    // Holatlarni yangilash
    window.gameState.hasRespondedToChat = true;
    window.gameState.isWaitingForMatchAction = false;
    
    // Timerlarni tozalash
    this.clearMatchActionTimers();
    
    // UI ni yashirish
    const matchContainer = document.getElementById('matchOptionsContainer');
    if (matchContainer) matchContainer.remove();
    
    // Partner ma'lumotlarini saqlash
    const partnerData = {
        id: data.partner?.id || data.opponent?.id,
        name: data.partner?.name || data.opponent?.name || 'Foydalanuvchi',
        username: data.partner?.username || data.opponent?.username || '',
        photo: data.partner?.photo || data.opponent?.photo,
        rating: data.partner?.rating || data.opponent?.rating || 1500,
        matches: data.partner?.matches || data.opponent?.matches || 0
    };
    
    // Do'st qo'shish (mutual match)
    this.addToFriendsList(partnerData);
    
    // Chat modalini ochish
    if (window.modalManager?.showChatModal) {
        window.modalManager.showChatModal(partnerData);
    }
    
    // Serverga chat qabul qilinganligini bildirish
    if (window.socketManager && data.requestId) {
        window.socketManager.acceptChatInvite(data.requestId);
    }
    
    // Confetti
    if (window.confetti) {
        window.confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 }
        });
    }
};

window.skipChatInvite = function() {
    console.log('⏭️ Chat taklifi rad etildi/vaqti tugadi');
    
    // Holatlarni yangilash
    window.gameState.hasRespondedToChat = true;
    window.gameState.isWaitingForMatchAction = false;
    
    // Timerlarni tozalash
    this.clearMatchActionTimers();
    
    // UI ni yashirish
    const matchContainer = document.getElementById('matchOptionsContainer');
    if (matchContainer) matchContainer.remove();
    
    // Keyingi duelga o'tish
    this.proceedToNextDuel();
    
    // Serverga chat rad etilganligini bildirish
    if (window.gameState.chatInviteRequestId) {
        window.socketManager?.rejectChatInvite?.(window.gameState.chatInviteRequestId);
        window.gameState.chatInviteRequestId = null;
    }
};

// ==================== SUPER LIKE HANDLING ====================
window.handleSuperLikeGiven = function(data) {
    console.log('💖 Super like berildi:', data);
    
    // Agar raqib ham super like bergan bo'lsa
    if (data.isMutualSuperLike) {
        console.log('🤝 O\'zaro SUPER LIKE! Do\'st qo\'shilmoqda...');
        this.addToFriendsList(data.opponent);
        window.utils?.showNotification('💖 O\'zaro SUPER LIKE!', 
            `${data.opponent.name} bilan do'st bo'ldingiz!`);
        
        // Confetti
        if (window.confetti) {
            window.confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
            });
        }
    }
};

// ==================== OPPONENT LEFT HANDLING ====================
window.handleOpponentLeft = function() {
    console.log('🚪 Raqib chiqib ketdi');
    
    // Holatlarni yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI yangilash
    this.hideDuelUI();
    window.updateDuelStatus?.('Raqib chiqib ketdi ⌛');
    
    // Yangi duel boshlash taklifi
    this.showNewDuelInvite();
};

window.showNewDuelInvite = function() {
    console.log('🔄 Yangi duel taklifi ko\'rsatilmoqda');
    
    let duelContainer = window.gameState.elements.duelContainer;
    if (!duelContainer) {
        duelContainer = document.getElementById('duelScreen');
    }
    
    if (!duelContainer) return;
    
    const newDuelContainer = document.createElement('div');
    newDuelContainer.id = 'newDuelInviteContainer';
    newDuelContainer.className = 'new-duel-invite-container';
    
    newDuelContainer.innerHTML = `
        <div class="new-duel-card">
            <div class="new-duel-header">
                <div class="new-duel-emoji">⚔️</div>
                <h3 class="new-duel-title">Raqib chiqib ketdi</h3>
                <p class="new-duel-message">
                    Raqibingiz duel davomida chiqib ketdi. Yangi duel boshlaysizmi?
                </p>
            </div>
            
            <div class="new-duel-buttons">
                <button id="startNewDuelBtn" class="new-duel-btn accept-btn">
                    <span class="btn-icon">🎮</span>
                    <span class="btn-text">YANGI DUEL</span>
                </button>
                
                <button id="returnToMenuBtn" class="new-duel-btn reject-btn">
                    <span class="btn-icon">🏠</span>
                    <span class="btn-text">BOSH MENYU</span>
                </button>
            </div>
        </div>
    `;
    
    duelContainer.appendChild(newDuelContainer);
    
    // Event listener'larni qo'shish
    document.getElementById('startNewDuelBtn').addEventListener('click', () => {
        console.log('🎮 Yangi duel boshlash');
        this.proceedToNextDuel();
        newDuelContainer.remove();
    });
    
    document.getElementById('returnToMenuBtn').addEventListener('click', () => {
        console.log('🏠 Bosh menyuga qaytish');
        this.returnToMenu();
        newDuelContainer.remove();
    });
};

// ==================== OTHER MATCH TYPES ====================
window.handleLikedOnly = function(data) {
    console.log('❤️ Faqat siz like berdidingiz');
    
    // Holatlarni yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI yangilash
    this.hideDuelUI();
    window.updateDuelStatus?.('Siz like berdidingiz, lekin raqib bermadi 😔');
    
    // 3 soniya kutish, keyin yangi duel
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
    // Stats yangilash
    this.updateStats(data);
};

window.handleNoMatch = function(data) {
    console.log('❌ Hech kim like bermadi');
    
    // Holatlarni yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI yangilash
    this.hideDuelUI();
    window.updateDuelStatus?.('Match bo\'lmadi 😔');
    
    // 3 soniya kutish, keyin yangi duel
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
    // Stats yangilash
    this.updateStats(data);
};

window.handleTimeout = function(data) {
    console.log('⏰ Vaqt tugadi');
    
    // Holatlarni yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    
    // Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // UI yangilash
    this.hideDuelUI();
    window.updateDuelStatus?.('Vaqt tugadi ⌛');
    
    // Yangi duel taklifi
    this.showNewDuelInvite();
    
    // Stats yangilash
    if (data) this.updateStats(data);
};

// ==================== CHAT INVITE HANDLING ====================
window.handleChatInvite = function(data) {
    console.log('💬 Chat taklifi kelib tushdi:', data);
    
    // Chat taklifi ma'lumotlarini saqlash
    window.gameState.pendingChatInvite = data;
    window.gameState.chatInviteRequestId = data.requestId;
    window.gameState.isWaitingForMatchAction = true;
    
    // Chat taklifi modalini ko'rsatish
    this.showChatInviteModal(data);
};

window.showChatInviteModal = function(data) {
    console.log('💬 Chat taklifi modali ko\'rsatilmoqda');
    
    const fromUser = data.fromUserName || 'Foydalanuvchi';
    const message = data.message || `${fromUser} siz bilan chat qilishni taklif qildi!`;
    
    const modalHTML = `
        <div class="modal active" id="chatInviteModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">💬 Chat Taklifi</h3>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin: 20px 0;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">💬</div>
                        <p style="color: #ccc; font-size: 1.1rem; margin-bottom: 20px;">
                            ${message}
                        </p>
                        <p style="color: #f1c40f; font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i> 
                            Chatni qabul qilsangiz, do'stlar ro'yxatingizga qo'shilasiz
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn accept-btn" onclick="window.gameLogic?.acceptChatInviteFromModal?.()" 
                        style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);">
                        <i class="fas fa-check"></i> Qabul qilish
                    </button>
                    <button class="modal-btn reject-btn" onclick="window.gameLogic?.rejectChatInviteFromModal?.()" 
                        style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        <i class="fas fa-times"></i> Rad etish
                    </button>
                </div>
                <div class="modal-timer" style="margin-top: 15px; text-align: center;">
                    <p style="color: #ccc; font-size: 0.8rem;">
                        Avtomatik rad etish: <span id="chatInviteTimer">30</span> soniya
                    </p>
                </div>
            </div>
        </div>
    `;
    
    // Modalni ko'rsatish
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.zIndex = '2000';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = modalHTML;
    
    // Timer boshlash
    let timeLeft = 30;
    const timerElement = document.getElementById('chatInviteTimer');
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timerElement) timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            this.rejectChatInviteFromModal();
        }
    }, 1000);
    
    // Saqlash
    window.gameState.chatInviteTimerInterval = timerInterval;
};

window.acceptChatInviteFromModal = function() {
    console.log('💬 Chat taklifi modaldan qabul qilindi');
    
    // Timerni to'xtatish
    if (window.gameState.chatInviteTimerInterval) {
        clearInterval(window.gameState.chatInviteTimerInterval);
        window.gameState.chatInviteTimerInterval = null;
    }
    
    // Modalni yopish
    const modal = document.getElementById('chatInviteModal');
    if (modal) modal.remove();
    
    // Chat taklifini qabul qilish
    if (window.gameState.pendingChatInvite) {
        if (window.socketManager?.acceptChatInvite) {
            window.socketManager.acceptChatInvite(window.gameState.chatInviteRequestId);
        }
        
        // Partner ma'lumotlarini tayyorlash
        const partnerData = {
            id: window.gameState.pendingChatInvite.fromUserId,
            name: window.gameState.pendingChatInvite.fromUserName,
            username: '',
            photo: window.gameState.pendingChatInvite.fromUserPhoto,
            isSuperLikeMatch: true
        };
        
        // Do'st qo'shish
        this.addToFriendsList(partnerData);
        
        // Chat modalini ochish
        if (window.modalManager?.showChatModal) {
            window.modalManager.showChatModal(partnerData);
        }
        
        // Holatlarni tozalash
        window.gameState.pendingChatInvite = null;
        window.gameState.chatInviteRequestId = null;
        window.gameState.isWaitingForMatchAction = false;
    }
};

window.rejectChatInviteFromModal = function() {
    console.log('❌ Chat taklifi modaldan rad etildi');
    
    // Timerni to'xtatish
    if (window.gameState.chatInviteTimerInterval) {
        clearInterval(window.gameState.chatInviteTimerInterval);
        window.gameState.chatInviteTimerInterval = null;
    }
    
    // Modalni yopish
    const modal = document.getElementById('chatInviteModal');
    if (modal) modal.remove();
    
    // Chat taklifini rad etish
    if (window.gameState.chatInviteRequestId) {
        if (window.socketManager?.rejectChatInvite) {
            window.socketManager.rejectChatInvite(window.gameState.chatInviteRequestId);
        }
        
        // Holatlarni tozalash
        window.gameState.pendingChatInvite = null;
        window.gameState.chatInviteRequestId = null;
        window.gameState.isWaitingForMatchAction = false;
    }
    
    // Keyingi duelga o'tish
    this.proceedToNextDuel();
};

// ==================== FRIENDS MANAGEMENT ====================
window.addToFriendsList = function(friendData) {
    console.log('👥 Do\'st qo\'shilmoqda:', friendData);
    
    if (!friendData || !friendData.id) {
        console.error('❌ Do\'st ma\'lumotlari yetarli emas');
        return;
    }
    
    // Local storage'dan do'stlar ro'yxatini olish
    const currentFriends = window.storage?.loadFriendsList?.() || [];
    
    // Do'st mavjudligini tekshirish
    const existingIndex = currentFriends.findIndex(f => f.id === friendData.id);
    if (existingIndex === -1) {
        currentFriends.push({
            id: friendData.id,
            name: friendData.name || 'Foydalanuvchi',
            username: friendData.username || '',
            photo: friendData.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(friendData.name || 'User')}&background=3498db&color=fff`,
            gender: friendData.gender || 'not_specified',
            rating: friendData.rating || 1500,
            matches: friendData.matches || 0,
            online: friendData.online || false,
            lastActive: new Date(),
            isMutual: true,
            mutualMatchDate: new Date(),
            isSuperLikeMatch: friendData.isSuperLikeMatch || false
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

// ==================== DUEL FLOW MANAGEMENT ====================
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
    window.gameState.currentOpponent = null;
    window.gameState.hasRespondedToChat = false;
    window.gameState.chatInviteRequestId = null;
    window.gameState.pendingChatInvite = null;
    
    // 3. UI ni tozalash
    this.resetDuelUI();
    
    // 4. Queue ekraniga qaytish
    window.gameState.isInQueue = true;
    window.showScreen?.('queue');
    
    // 5. Navbatga qaytish
    setTimeout(() => {
        if (window.gameState.socket && window.gameState.isConnected) {
            window.gameState.socket.emit('enter_queue');
            window.updateQueueStatus?.('Yangi duel izlanmoqda...');
        } else {
            // Agar socket ulanmagan bo'lsa, welcome screen ga qaytish
            window.showScreen?.('welcome');
        }
    }, 1000);
};

window.returnToMenu = function() {
    console.log('🏠 Bosh menyuga qaytish');
    
    // Barcha timerlarni tozalash
    this.stopAllTimers();
    this.clearMatchActionTimers();
    
    // Holatlarni reset qilish
    window.gameState.isInQueue = false;
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = false;
    window.gameState.currentDuelId = null;
    window.gameState.currentPartner = null;
    window.gameState.currentOpponent = null;
    window.gameState.hasRespondedToChat = false;
    window.gameState.chatInviteRequestId = null;
    window.gameState.pendingChatInvite = null;
    
    // UI ni tozalash
    this.resetDuelUI();
    
    // Welcome screen ga qaytish
    window.showScreen?.('welcome');
};

// ==================== UTILITY FUNCTIONS ====================
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

window.clearMatchActionTimers = function() {
    if (window.gameState.matchActionTimeout) {
        clearTimeout(window.gameState.matchActionTimeout);
        window.gameState.matchActionTimeout = null;
    }
    
    if (window.gameState.matchActionTimerInterval) {
        clearInterval(window.gameState.matchActionTimerInterval);
        window.gameState.matchActionTimerInterval = null;
    }
    
    if (window.gameState.chatInviteTimerInterval) {
        clearInterval(window.gameState.chatInviteTimerInterval);
        window.gameState.chatInviteTimerInterval = null;
    }
};

window.resetDuelUI = function() {
    console.log('🔄 Duel UI reset qilinmoqda');
    
    // Avvalgi UI elementlarini o'chirish
    const elementsToRemove = [
        'matchOptionsContainer',
        'newDuelInviteContainer',
        'chatInviteModal'
    ];
    
    elementsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.remove();
    });
    
    // Asosiy UI elementlarini reset qilish
    if (window.gameState.elements.timer) {
        window.gameState.elements.timer.textContent = '20';
        window.gameState.elements.timer.style.color = '#2ecc71';
        window.gameState.elements.timer.style.display = 'block';
    }
    
    // Vote tugmalarini reset qilish
    this.enableVoteButtons();
    
    // Status yangilash
    window.updateDuelStatus?.('Raqibingizni baholang...');
    
    // UI elementlarini ko'rsatish
    if (window.gameState.elements.voteButtons) {
        window.gameState.elements.voteButtons.style.display = 'flex';
    }
    
    if (window.gameState.elements.opponentInfo) {
        window.gameState.elements.opponentInfo.style.display = 'block';
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
    
    if (data) {
        if (data.coins !== undefined) window.userState.coins = data.coins;
        if (data.rating !== undefined) window.userState.rating = data.rating;
        if (data.matches !== undefined) window.userState.matches = data.matches;
        if (data.duels !== undefined) window.userState.duels = data.duels;
        if (data.wins !== undefined) window.userState.wins = data.wins;
        if (data.totalLikes !== undefined) window.userState.totalLikes = data.totalLikes;
        if (data.mutualMatchesCount !== undefined) window.userState.mutualMatchesCount = data.mutualMatchesCount;
    }
    
    // UI yangilash
    window.updateUIFromUserState?.();
    
    // Saqlash
    if (window.storage && window.storage.saveUserState) {
        window.storage.saveUserState();
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
    startDuelFlow: window.startDuelFlow,
    handleVote: window.handleVote,
    handleMatch: window.handleMatch,
    handleLikedOnly: window.handleLikedOnly,
    handleNoMatch: window.handleNoMatch,
    handleTimeout: window.handleTimeout,
    handleOpponentLeft: window.handleOpponentLeft,
    handleChatInvite: window.handleChatInvite,
    handleSuperLikeGiven: window.handleSuperLikeGiven,
    proceedToNextDuel: window.proceedToNextDuel,
    returnToMenu: window.returnToMenu,
    acceptChatInvite: window.acceptChatInvite,
    skipChatInvite: window.skipChatInvite,
    addToFriendsList: window.addToFriendsList,
    showNewDuelInvite: window.showNewDuelInvite,
    acceptChatInviteFromModal: window.acceptChatInviteFromModal,
    rejectChatInviteFromModal: window.rejectChatInviteFromModal,
    showMatchOptions: window.showMatchOptions,
    showChatInviteModal: window.showChatInviteModal
};