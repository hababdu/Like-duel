// GameLogic.js - To'liq ishlaydigan o'yin logikasi

// ==================== GLOBAL STATE ====================
window.gameState = window.gameState || {
    socket: null,
    isConnected: false,
    isInQueue: false,
    isInDuel: false,
    waitingForOpponent: false,
    matchCompleted: false,
    currentDuelId: null,
    timeLeft: 20,
    timerInterval: null,
    duelTimeout: null,
    
    // Chat taklifi holati
    pendingChatInvite: null,
    waitingForChatResponse: false,
    chatResponseTimer: null,
    
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
    this.initializeSocket();
    this.setupChatSocketListeners();
    
    console.log('✅ Game Logic to\'liq ishga tushdi');
};

window.initializeElements = function() {
    console.log('🔍 UI elementlari topilmoqda...');
    
    window.gameState.elements = {
        timer: document.getElementById('timer'),
        duelStatus: document.getElementById('duelStatus'),
        voteButtons: document.getElementById('voteButtons'),
        opponentInfo: document.getElementById('opponentInfo'),
        duelContainer: document.getElementById('duelContainer') || document.querySelector('.duel-container'),
        
        opponentAvatar: document.getElementById('opponentAvatar'),
        opponentName: document.getElementById('opponentName'),
        opponentUsername: document.getElementById('opponentUsername'),
        opponentRating: document.getElementById('opponentRating'),
        opponentMatches: document.getElementById('opponentMatches'),
        opponentLevel: document.getElementById('opponentLevel'),
        
        likeBtn: document.getElementById('likeBtn'),
        superLikeBtn: document.getElementById('superLikeBtn'),
        passBtn: document.getElementById('passBtn') || document.getElementById('noBtn'),
        
        waitingCount: document.getElementById('waitingCount'),
        position: document.getElementById('position'),
        queueStatus: document.getElementById('queueStatus')
    };
    
    console.log('✅ UI elementlari topildi');
};

window.setupEventListeners = function() {
    console.log('🎯 Event listenerlar o\'rnatilmoqda...');
    
    if (window.gameState.elements.likeBtn) {
        window.gameState.elements.likeBtn.addEventListener('click', () => this.handleVote('like'));
    }
    
    if (window.gameState.elements.superLikeBtn) {
        window.gameState.elements.superLikeBtn.addEventListener('click', () => this.handleVote('superLike'));
    }
    
    if (window.gameState.elements.passBtn) {
        window.gameState.elements.passBtn.addEventListener('click', () => this.handleVote('pass'));
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
    
    this.disableVoteButtons();
    
    const choiceText = this.getChoiceText(choice);
    window.updateDuelStatus?.(`Siz ${choiceText} berdingiz. Kutish...`);
    
    const voteData = {
        duelId: window.gameState.currentDuelId,
        choice: choice
    };
    
    if (window.socketManager && window.socketManager.sendVote) {
        const success = window.socketManager.sendVote(window.gameState.currentDuelId, choice);
        
        if (!success) {
            console.error('❌ Ovoz yuborib bo\'lmadi');
            this.enableVoteButtons();
        }
    }
    
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
        default: return choice;
    }
};

// ==================== MATCH HANDLING (YANGILANGAN) ====================

window.handleMatch = function(data) {
    console.log('🎉 MATCH DETECTED! Data:', data);
    
    // 1. O'yin holatini yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    window.gameState.currentPartner = {
        id: data.partner?.id || data.opponent?.id,
        name: data.partner?.name || data.opponent?.name,
        username: data.partner?.username || data.opponent?.username,
        photo: data.partner?.photo || data.opponent?.photo,
        rating: data.partner?.rating || data.opponent?.rating
    };
    
    // 2. Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // 3. UI elementlarini yashirish
    this.hideDuelUI();
    
    // 4. MATCH EKRANINI KO'RSATISH (chat taklifi tugmalari bilan)
    this.showMatchScreenWithOptions(data);
    
    // 5. Status yangilash
    window.updateDuelStatus?.('🎉 MATCH! Ikkalangiz ham like bosdingiz!');
    
    // 6. Statistikani yangilash
    this.updateMatchStats(data);
    
    console.log('✅ Match handling tugallandi');
};

window.showMatchScreenWithOptions = function(data) {
    console.log('🎮 Match ekrani ko\'rsatilmoqda (chat taklifi bilan)');
    
    let duelContainer = window.gameState.elements.duelContainer;
    if (!duelContainer) {
        duelContainer = document.querySelector('.duel-container');
        if (!duelContainer) {
            console.error('❌ Duel container topilmadi');
            return;
        }
    }
    
    // 1. Avvalgi ekranlarni o'chirish
    const existingScreens = document.getElementById('matchScreenContainer');
    if (existingScreens) {
        existingScreens.remove();
    }
    
    // 2. Match ekranini yaratish
    const matchScreen = document.createElement('div');
    matchScreen.id = 'matchScreenContainer';
    matchScreen.className = 'match-screen-container';
    matchScreen.style.cssText = `
        position: relative;
        text-align: center;
        margin: 30px auto;
        padding: 0 20px;
        max-width: 500px;
        animation: fadeIn 0.8s ease-out;
        z-index: 1000;
    `;
    
    // Partner ma'lumotlarini tayyorlash
    const partnerName = data.partner?.name || data.opponent?.name || data.partnerName || 'Foydalanuvchi';
    const partnerUsername = data.partner?.username || data.opponent?.username || data.partnerUsername || '';
    const partnerPhoto = data.partner?.photo || data.opponent?.photo || data.partnerPhoto || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff`;
    const partnerRating = data.partner?.rating || data.opponent?.rating || 1500;
    const partnerWins = data.partner?.wins || data.opponent?.wins || 0;
    
    // 3. HTML yaratish
    matchScreen.innerHTML = `
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
                    Endi siz do'st bo'ldingiz.
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
            
            <!-- Rewards -->
            <div class="match-rewards">
                <div class="reward-item">
                    <div class="reward-icon">💰</div>
                    <div class="reward-info">
                        <div class="reward-value">+${data.coinsEarned || 25}</div>
                        <div class="reward-label">Tanga</div>
                    </div>
                </div>
                <div class="reward-item">
                    <div class="reward-icon">🏆</div>
                    <div class="reward-info">
                        <div class="reward-value">+${data.ratingChange || 15}</div>
                        <div class="reward-label">Reyting</div>
                    </div>
                </div>
                <div class="reward-item">
                    <div class="reward-icon">🤝</div>
                    <div class="reward-info">
                        <div class="reward-value">1</div>
                        <div class="reward-label">Do'st</div>
                    </div>
                </div>
            </div>
            
            <!-- Action buttons (CHAT TAKLIFI BOSHLASH VA KEYINGI DUEL) -->
            <div class="match-action-buttons">
                <button id="startChatBtn" class="match-action-btn chat-btn">
                    <span class="btn-icon">💬</span>
                    <span class="btn-text">CHAT QILISH</span>
                    <span class="btn-subtext">Taklif yuborish</span>
                </button>
                
                <button id="skipToNextBtn" class="match-action-btn skip-btn">
                    <span class="btn-icon">⏭️</span>
                    <span class="btn-text">KEYINGI DUEL</span>
                    <span class="btn-subtext">Chat qilmasdan</span>
                </button>
            </div>
            
            <!-- Info message -->
            <div class="match-info-message">
                <p>
                    <i class="fas fa-info-circle"></i>
                    Chatni boshlash uchun "CHAT QILISH" tugmasini bosing.
                    Ikkalangiz ham rozilik bersangiz, chat ochiladi.
                </p>
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
                        <div class="stat-label">🤝 Do'st</div>
                        <div class="stat-value">${window.userState.friendsCount + 1} ta</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 4. Container'ni qo'shish
    duelContainer.appendChild(matchScreen);
    
    // 5. Event listener'larni qo'shish
    document.getElementById('startChatBtn').addEventListener('click', () => {
        console.log('💬 Chat taklifi boshlanmoqda');
        this.startChatInvite(data);
    });
    
    document.getElementById('skipToNextBtn').addEventListener('click', () => {
        console.log('⏭️ Chat taklifisiz keyingi duelga o\'tilmoqda');
        this.proceedToNextDuel();
    });
    
    console.log('✅ Match ekrani ko\'rsatildi');
};

// ==================== CHAT TAKLIFI BOSHLASH ====================

window.startChatInvite = function(data) {
    console.log('💬 Chat taklifi boshlanmoqda');
    
    const partnerId = data.partner?.id || data.opponent?.id;
    const partnerName = data.partner?.name || data.opponent?.name || 'Foydalanuvchi';
    
    if (!partnerId) {
        console.error('❌ Partner ID topilmadi');
        window.showNotification?.('Xato', 'Chat taklifi yuborib bo\'lmadi');
        return;
    }
    
    // 1. Serverga chat taklifi yuborish
    if (window.socketManager && window.socketManager.sendChatInvite) {
        const success = window.socketManager.sendChatInvite(partnerId);
        
        if (success) {
            // 2. Kutish ekranini ko'rsatish
            this.showWaitingForResponseScreen(data);
            
            // 3. 30 soniya timeout
            this.startChatInviteTimeout();
        } else {
            window.showNotification?.('Xato', 'Chat taklifi yuborib bo\'lmadi');
        }
    } else {
        console.error('❌ Socket manager topilmadi');
        window.showNotification?.('Xato', 'Serverga ulanib bo\'lmadi');
    }
};

window.showWaitingForResponseScreen = function(data) {
    console.log('⏳ Raqib javobini kutish ekrani ko\'rsatilmoqda');
    
    const partnerName = data.partner?.name || data.opponent?.name || 'Foydalanuvchi';
    
    // 1. Match ekranini yashirish
    const matchScreen = document.getElementById('matchScreenContainer');
    if (matchScreen) {
        matchScreen.style.display = 'none';
    }
    
    // 2. Kutish ekranini yaratish
    const waitingScreen = document.createElement('div');
    waitingScreen.id = 'waitingForResponseScreen';
    waitingScreen.className = 'waiting-for-response-screen';
    waitingScreen.style.cssText = `
        position: relative;
        text-align: center;
        margin: 30px auto;
        padding: 30px 20px;
        max-width: 500px;
        animation: fadeIn 0.8s ease-out;
        z-index: 1000;
    `;
    
    waitingScreen.innerHTML = `
        <div class="waiting-card">
            <div class="waiting-emoji">⏳</div>
            <h3 class="waiting-title">Kutish...</h3>
            <p class="waiting-message">
                ${partnerName} ga chat taklifi yuborildi.
                Ikkalangiz ham rozilik bersangiz, chat ochiladi.
            </p>
            
            <div class="waiting-loader">
                <div class="loader"></div>
            </div>
            
            <div class="waiting-options">
                <button id="cancelChatInviteBtn" class="waiting-btn cancel-btn">
                    <span class="btn-icon">❌</span>
                    <span class="btn-text">Taklifni Bekor Qilish</span>
                </button>
            </div>
            
            <div class="waiting-timer">
                <div class="timer-text">
                    Javob kutish: <span id="responseTimer">30</span> soniya
                </div>
                <div class="timer-bar-bg">
                    <div id="responseTimerBar" class="timer-bar-fill"></div>
                </div>
            </div>
            
            <div class="waiting-info">
                <p>
                    <i class="fas fa-info-circle"></i>
                    Agar ${partnerName} 30 soniya ichida javob bermasa,
                    taklif avtomatik bekor bo'ladi.
                </p>
            </div>
        </div>
    `;
    
    // 3. Qo'shish
    const duelContainer = window.gameState.elements.duelContainer;
    if (duelContainer) {
        duelContainer.appendChild(waitingScreen);
    }
    
    // 4. Event listener
    document.getElementById('cancelChatInviteBtn').addEventListener('click', () => {
        console.log('❌ Chat taklifi bekor qilinmoqda');
        this.cancelChatInvite();
    });
    
    // 5. Timer boshlash
    this.startResponseTimer();
    
    window.gameState.waitingForChatResponse = true;
};

window.startChatInviteTimeout = function() {
    // Avvalgi timeoutni tozalash
    if (window.gameState.chatResponseTimer) {
        clearTimeout(window.gameState.chatResponseTimer);
    }
    
    // 30 soniya timeout
    window.gameState.chatResponseTimer = setTimeout(() => {
        if (window.gameState.waitingForChatResponse) {
            console.log('⏰ Chat taklifiga javob berilmadi (timeout)');
            this.handleChatInviteTimeout();
        }
    }, 30000);
};

window.startResponseTimer = function() {
    let timeLeft = 30;
    const timerBar = document.getElementById('responseTimerBar');
    const timerText = document.getElementById('responseTimer');
    
    if (!timerBar || !timerText) return;
    
    // Avvalgi intervalni tozalash
    if (window.gameState.responseTimerInterval) {
        clearInterval(window.gameState.responseTimerInterval);
    }
    
    window.gameState.responseTimerInterval = setInterval(() => {
        timeLeft--;
        
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
            clearInterval(window.gameState.responseTimerInterval);
        }
    }, 1000);
};

// ==================== CHAT TAKLIFI QABUL QILINDI ====================

window.handleChatInvite = function(data) {
    console.log('💬 Chat taklifi olindi:', data);
    
    // 1. Agar duel davomida bo'lsa, duelni to'xtatish
    if (window.gameState.isInDuel) {
        window.gameState.isInDuel = false;
        window.gameState.matchCompleted = true;
        this.stopAllTimers();
        this.hideDuelUI();
    }
    
    // 2. Chat taklifi modalini ko'rsatish
    this.showChatInviteModal(data);
};

window.showChatInviteModal = function(data) {
    console.log('💬 Chat taklifi modal ko\'rsatilmoqda');
    
    const fromUserName = data.fromUserName || 'Foydalanuvchi';
    const fromUserPhoto = data.fromUserPhoto || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fromUserName)}&background=667eea&color=fff`;
    const requestId = data.requestId;
    
    // Modal yaratish
    const modalHTML = `
        <div class="modal active" id="chatInviteModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">💬 Chat Taklifi</h3>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${fromUserPhoto}" 
                             alt="${fromUserName}" 
                             style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #667eea; margin-bottom: 15px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #fff; margin-bottom: 5px;">
                            ${fromUserName}
                        </div>
                        <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 20px;">
                            Siz bilan chat qilishni taklif qildi
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                        <p style="color: #ccc; font-size: 0.9rem; margin: 0;">
                            <i class="fas fa-info-circle"></i> 
                            Ikkalangiz ham rozilik bersangiz, chat ochiladi va do'stlar ro'yxatingizga qo'shilasiz.
                        </p>
                    </div>
                    
                    <div class="chat-timer" style="margin: 20px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: #ccc; font-size: 0.9rem;">Javob vaqti:</span>
                            <span style="color: #fff; font-weight: bold;" id="chatInviteTimer">30</span>
                        </div>
                        <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                            <div id="chatInviteTimerBar" style="height: 100%; width: 100%; background: linear-gradient(90deg, #2ecc71, #27ae60); border-radius: 3px;"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn reject-btn" onclick="window.gameLogic?.rejectChatInvite?.('${requestId}')" 
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        <i class="fas fa-times"></i> Rad Etish
                    </button>
                    <button class="modal-btn accept-btn" onclick="window.gameLogic?.acceptChatInvite?.('${requestId}')" 
                            style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);">
                        <i class="fas fa-check"></i> Qabul Qilish
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Modalni ko'rsatish
    this.showModal(modalHTML);
    
    // Timer boshlash
    this.startChatInviteTimer();
};

window.startChatInviteTimer = function() {
    let timeLeft = 30;
    const timerBar = document.getElementById('chatInviteTimerBar');
    const timerText = document.getElementById('chatInviteTimer');
    
    if (!timerBar || !timerText) return;
    
    // Avvalgi intervalni tozalash
    if (window.gameState.chatInviteTimerInterval) {
        clearInterval(window.gameState.chatInviteTimerInterval);
    }
    
    window.gameState.chatInviteTimerInterval = setInterval(() => {
        timeLeft--;
        
        timerText.textContent = timeLeft;
        
        // Timer bar yangilash
        const percent = (timeLeft / 30) * 100;
        timerBar.style.width = percent + '%';
        
        // Rang o'zgartirish
        if (timeLeft <= 10) {
            timerBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (timeLeft <= 20) {
            timerBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        }
        
        // Vaqt tugaganda
        if (timeLeft <= 0) {
            clearInterval(window.gameState.chatInviteTimerInterval);
            this.closeChatInviteModal();
            this.proceedToNextDuel();
        }
    }, 1000);
};

window.acceptChatInvite = function(requestId) {
    console.log('✅ Chat taklifi qabul qilinmoqda:', requestId);
    
    // Serverga yuborish
    if (window.socketManager && window.socketManager.acceptChatInvite) {
        window.socketManager.acceptChatInvite(requestId);
    }
    
    // Modalni yopish
    this.closeChatInviteModal();
    
    // Timerlarni tozalash
    if (window.gameState.chatInviteTimerInterval) {
        clearInterval(window.gameState.chatInviteTimerInterval);
    }
};

window.rejectChatInvite = function(requestId) {
    console.log('❌ Chat taklifi rad etilmoqda:', requestId);
    
    // Serverga yuborish
    if (window.socketManager && window.socketManager.rejectChatInvite) {
        window.socketManager.rejectChatInvite(requestId);
    }
    
    // Modalni yopish
    this.closeChatInviteModal();
    
    // Timerlarni tozalash
    if (window.gameState.chatInviteTimerInterval) {
        clearInterval(window.gameState.chatInviteTimerInterval);
    }
    
    // Keyingi duelga o'tish
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 1000);
};

window.closeChatInviteModal = function() {
    const modal = document.getElementById('chatInviteModal');
    if (modal) {
        modal.remove();
    }
};

// ==================== CHAT ACCEPTED HANDLING ====================

window.handleChatAccepted = function(data) {
    console.log('✅ Chat qabul qilindi:', data);
    
    // 1. Kutish ekranini yopish (agar bor bo'lsa)
    this.hideWaitingForResponseScreen();
    
    // 2. Chat taklifi modalini yopish (agar ochiq bo'lsa)
    this.closeChatInviteModal();
    
    // 3. Partner ma'lumotlarini saqlash
    window.gameState.currentPartner = {
        id: data.partnerId,
        name: data.partnerName,
        username: data.partnerUsername,
        photo: data.partnerPhoto
    };
    
    // 4. Chat muvaffaqiyat modalini ko'rsatish
    this.showChatSuccessModal(data);
    
    // 5. Do'stlar ro'yxatini yangilash
    if (window.uiManager && window.uiManager.loadFriendsList) {
        setTimeout(() => {
            window.uiManager.loadFriendsList();
        }, 1000);
    }
};

window.hideWaitingForResponseScreen = function() {
    const waitingScreen = document.getElementById('waitingForResponseScreen');
    if (waitingScreen) {
        waitingScreen.remove();
    }
    
    window.gameState.waitingForChatResponse = false;
    
    // Timerlarni tozalash
    if (window.gameState.chatResponseTimer) {
        clearTimeout(window.gameState.chatResponseTimer);
        window.gameState.chatResponseTimer = null;
    }
    
    if (window.gameState.responseTimerInterval) {
        clearInterval(window.gameState.responseTimerInterval);
        window.gameState.responseTimerInterval = null;
    }
};

window.showChatSuccessModal = function(data) {
    console.log('💬 Chat muvaffaqiyat modal ko\'rsatilmoqda');
    
    const partnerName = data.partnerName || 'Foydalanuvchi';
    const partnerUsername = data.partnerUsername || '';
    const partnerPhoto = data.partnerPhoto || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff`;
    
    const modalHTML = `
        <div class="modal active" id="chatSuccessModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">🎉 Chat Ochildi!</h3>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${partnerPhoto}" 
                             alt="${partnerName}" 
                             style="width: 100px; height: 100px; border-radius: 50%; border: 4px solid #2ecc71; margin-bottom: 15px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #fff; margin-bottom: 5px;">
                            ${partnerName}
                        </div>
                        <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 20px;">
                            @${partnerUsername || 'foydalanuvchi'}
                        </div>
                    </div>
                    
                    <div style="background: rgba(46, 204, 113, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(46, 204, 113, 0.2);">
                        <p style="color: #2ecc71; font-size: 0.9rem; margin: 0;">
                            <i class="fas fa-check-circle"></i> 
                            Endi siz ${partnerName} bilan bemalol suhbatlashingiz mumkin!
                        </p>
                    </div>
                    
                    <div style="color: #ccc; font-size: 0.9rem; text-align: center; margin-bottom: 20px;">
                        <i class="fas fa-users"></i> 
                        ${partnerName} endi do'stlaringiz ro'yxatiga qo'shildi
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn chat-btn" onclick="window.gameLogic?.openChatWithPartner?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); width: 100%;">
                        <i class="fas fa-comments"></i> Chat Qilish
                    </button>
                </div>
            </div>
        </div>
    `;
    
    this.showModal(modalHTML);
};

// ==================== CHAT REJECTED/CANCELLED HANDLING ====================

window.handleChatRejected = function(data) {
    console.log('❌ Chat taklifi rad etildi:', data);
    
    // 1. Kutish ekranini yopish
    this.hideWaitingForResponseScreen();
    
    // 2. Xabar ko'rsatish
    const partnerName = data.partnerName || 'Foydalanuvchi';
    window.showNotification?.('Chat rad etildi', 
        `${partnerName} sizning chat taklifingizni rad etdi.`);
    
    // 3. Keyingi duelga o'tish
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 2000);
};

window.cancelChatInvite = function() {
    console.log('❌ Chat taklifi bekor qilinmoqda');
    
    // 1. Kutish ekranini yopish
    this.hideWaitingForResponseScreen();
    
    // 2. Serverga bekor qilish haqida xabar yuborish
    if (window.socketManager && window.socketManager.cancelChatInvite) {
        window.socketManager.cancelChatInvite();
    }
    
    // 3. Match ekranini qayta ko'rsatish
    const matchScreen = document.getElementById('matchScreenContainer');
    if (matchScreen) {
        matchScreen.style.display = 'block';
    }
};

window.handleChatInviteTimeout = function() {
    console.log('⏰ Chat taklifiga javob berilmadi');
    
    // 1. Kutish ekranini yopish
    this.hideWaitingForResponseScreen();
    
    // 2. Xabar ko'rsatish
    window.showNotification?.('Vaqt tugadi', 
        'Chat taklifiga javob berilmadi. Taklif bekor qilindi.');
    
    // 3. Match ekranini qayta ko'rsatish
    const matchScreen = document.getElementById('matchScreenContainer');
    if (matchScreen) {
        matchScreen.style.display = 'block';
    }
};

// ==================== OTHER MATCH TYPES ====================

window.handleLikedOnly = function(data) {
    console.log('❤️ Faqat siz like berdidingiz');
    
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    this.stopAllTimers();
    this.hideDuelUI();
    window.updateDuelStatus?.('Siz like berdidingiz, lekin raqib bermadi 😔');
    
    setTimeout(() => {
        this.proceedToNextDuel();
    }, 3000);
    
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
    this.hideWaitingForResponseScreen();
    
    // 2. Holatlarni reset qilish
    window.gameState.isInDuel = false;
    window.gameState.waitingForChatResponse = false;
    window.gameState.matchCompleted = false;
    window.gameState.currentDuelId = null;
    window.gameState.currentPartner = null;
    
    // 3. UI ni tozalash
    this.resetDuelUI();
    
    // 4. Ekranlarni o'chirish
    const screens = [
        'matchScreenContainer',
        'waitingForResponseScreen',
        'chatInviteModal',
        'chatSuccessModal'
    ];
    
    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    });
    
    // 5. Queue ekraniga qaytish
    window.gameState.isInQueue = true;
    window.showScreen?.('queue');
    
    // 6. Navbatga qaytish
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

window.hideDuelUI = function() {
    if (window.gameState.elements.timer) {
        window.gameState.elements.timer.style.display = 'none';
    }
    
    if (window.gameState.elements.voteButtons) {
        window.gameState.elements.voteButtons.style.display = 'none';
    }
    
    if (window.gameState.elements.opponentInfo) {
        window.gameState.elements.opponentInfo.style.display = 'none';
    }
    
    if (window.gameState.elements.duelStatus) {
        window.gameState.elements.duelStatus.textContent = '🎉 MATCH!';
        window.gameState.elements.duelStatus.style.color = '#2ecc71';
        window.gameState.elements.duelStatus.style.fontWeight = 'bold';
    }
};

// ==================== TIMER FUNCTIONS ====================

window.startTimer = function() {
    console.log('⏰ Taymer boshlanmoqda');
    
    clearInterval(window.gameState.timerInterval);
    clearTimeout(window.gameState.duelTimeout);
    
    window.gameState.timeLeft = 20;
    
    if (window.gameState.elements.timer) {
        window.gameState.elements.timer.textContent = '20';
        window.gameState.elements.timer.style.color = '#2ecc71';
        window.gameState.elements.timer.style.display = 'block';
    }
    
    window.gameState.timerInterval = setInterval(() => {
        window.gameState.timeLeft--;
        
        if (window.gameState.elements.timer) {
            window.gameState.elements.timer.textContent = window.gameState.timeLeft;
            
            if (window.gameState.timeLeft <= 5) {
                window.gameState.elements.timer.style.color = '#e74c3c';
            } else if (window.gameState.timeLeft <= 10) {
                window.gameState.elements.timer.style.color = '#f39c12';
            }
        }
        
        if (window.gameState.timeLeft <= 0) {
            clearInterval(window.gameState.timerInterval);
            this.handleTimeout();
        }
    }, 1000);
    
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
    clearTimeout(window.gameState.chatResponseTimer);
    clearInterval(window.gameState.responseTimerInterval);
    clearInterval(window.gameState.chatInviteTimerInterval);
    
    window.gameState.timerInterval = null;
    window.gameState.duelTimeout = null;
    window.gameState.chatResponseTimer = null;
    window.gameState.responseTimerInterval = null;
    window.gameState.chatInviteTimerInterval = null;
};

// ==================== CHAT SOCKET LISTENERS ====================

window.setupChatSocketListeners = function() {
    if (!window.socketManager || !window.gameState.socket) {
        console.error('❌ Socket manager mavjud emas');
        return;
    }
    
    const socket = window.gameState.socket;
    
    // Chat taklifi olganda
    socket.on('chat_invite', (data) => {
        console.log('💬 Chat taklifi olindi:', data);
        this.handleChatInvite(data);
    });
    
    // Chat taklifi qabul qilinganda
    socket.on('chat_accepted', (data) => {
        console.log('✅ Chat taklifi qabul qilindi:', data);
        this.handleChatAccepted(data);
    });
    
    // Chat taklifi rad etilganda
    socket.on('chat_rejected', (data) => {
        console.log('❌ Chat taklifi rad etildi:', data);
        this.handleChatRejected(data);
    });
    
    // Chat taklifi yuborilganda
    socket.on('chat_invite_sent', (data) => {
        console.log('✅ Chat taklifi yuborildi:', data);
        window.showNotification?.('Taklif yuborildi', data.message);
    });
    
    // Chat link yaratilganda
    socket.on('chat_link_created', (data) => {
        console.log('🔗 Chat link yaratildi:', data);
        this.handleChatLinkCreated(data);
    });
    
    console.log('✅ Chat socket listenerlar o\'rnatildi');
};

// ==================== UTILITY FUNCTIONS ====================

window.openChatWithPartner = function() {
    if (!window.gameState.currentPartner) {
        console.error('❌ Partner ma\'lumotlari yo\'q');
        return;
    }
    
    console.log('💬 Chat ochilmoqda:', window.gameState.currentPartner);
    
    // Chat modalini yopish
    const successModal = document.getElementById('chatSuccessModal');
    if (successModal) {
        successModal.remove();
    }
    
    // Standart chat modalini ochish
    if (window.modalManager && window.modalManager.showChatModal) {
        window.modalManager.showChatModal(window.gameState.currentPartner);
    }
};

window.handleChatLinkCreated = function(data) {
    if (data.chatLink) {
        // Telegramda chat linkini ochish
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.openLink(data.chatLink);
        } else if (window.open) {
            window.open(data.chatLink, '_blank');
        }
        
        window.showNotification?.('💬 Chat ochildi', 'Chat yangi oynada ochildi!');
    }
};

window.showModal = function(html) {
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.zIndex = '2000';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.backgroundColor = 'rgba(0,0,0,0.8)';
        container.style.backdropFilter = 'blur(10px)';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = html;
};

window.showNotification = function(title, message) {
    console.log(`📢 ${title}: ${message}`);
    
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(message);
    } else {
        alert(`${title}\n${message}`);
    }
};

window.updateMatchStats = function(data) {
    console.log('📊 Match stats yangilanmoqda');
    
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
    window.userState.friendsCount = (window.userState.friendsCount || 0) + 1;
    
    window.gameState.gameStats.matches++;
    window.gameState.gameStats.wins++;
    window.gameState.gameStats.totalDuels++;
    
    window.updateUIFromUserState?.();
    
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
    
    window.updateUIFromUserState?.();
    
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
    handleMatch: window.handleMatch,
    handleLikedOnly: window.handleLikedOnly,
    handleNoMatch: window.handleNoMatch,
    handleTimeout: window.handleTimeout,
    handleVote: window.handleVote,
    startTimer: window.startTimer,
    stopAllTimers: window.stopAllTimers,
    proceedToNextDuel: window.proceedToNextDuel
};