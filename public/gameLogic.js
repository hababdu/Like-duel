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
        duelContainer: document.getElementById('duelContainer'),
        
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
        passBtn: document.getElementById('passBtn')
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
    
    // Chat uchun event listener'lar
    if (window.gameState.elements.chatSendBtn) {
        window.gameState.elements.chatSendBtn.addEventListener('click', () => window.sendChatMessage());
    }
    
    if (window.gameState.elements.chatInput) {
        window.gameState.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.sendChatMessage();
        });
    }
    
    if (window.gameState.elements.backToDuelsBtn) {
        window.gameState.elements.backToDuelsBtn.addEventListener('click', () => window.proceedToNextDuel());
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
        case 'superLike': return '💖 SUPER LIKE';
        case 'pass': return '✖ PASS';
        default: return choice;
    }
};

// ==================== MATCH HANDLING ====================

window.handleMatch = function(data) {
    console.log('🎉🎉🎉 MATCH DETECTED! Data:', data);
    
    // 1. O'yin holatini yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    window.gameState.isWaitingForMatchAction = true; // ✅ ENG MUHIM QISMI
    
    // 2. Taymerlarni to'xtatish
    this.stopAllTimers();
    
    // 3. UI elementlarini yashirish
    this.hideDuelUI();
    
    // 4. Chat taklifi tugmalarini KO'RSATISH (ASOSIY QISMI)
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
    }
};

window.showChatInviteButtons = function(data) {
    console.log('💬 Chat taklifi tugmalari ko\'rsatilmoqda...');
    
    if (!window.gameState.elements.duelContainer) {
        console.error('❌ Duel container topilmadi');
        return;
    }
    
    // 1. Avvalgi chat taklifi elementlarini o'chirish
    const existingChatInvite = document.getElementById('chatInviteContainer');
    if (existingChatInvite) {
        existingChatInvite.remove();
    }
    
    // 2. Yangi chat taklifi container yaratish
    const chatInviteContainer = document.createElement('div');
    chatInviteContainer.id = 'chatInviteContainer';
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
    const partnerName = data.partnerName || 'Foydalanuvchi';
    const partnerUsername = data.partnerUsername || '';
    const partnerPhoto = data.partnerPhoto || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff`;
    
    // 4. HTML yaratish
    chatInviteContainer.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 25px;
            padding: 30px;
            color: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border: 3px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        ">
            <!-- Background decoration -->
            <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; 
                        background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; 
                        background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            
            <!-- Match celebration -->
            <div style="margin-bottom: 25px;">
                <div style="font-size: 70px; margin-bottom: 15px; animation: bounce 1s infinite;">🎉</div>
                <h3 style="margin: 0 0 10px 0; font-size: 32px; font-weight: bold;">MATCH!</h3>
                <p style="margin: 0 0 25px 0; font-size: 18px; opacity: 0.9;">
                    ${partnerName} bilan o'zaro like bosdingiz!
                </p>
            </div>
            
            <!-- Partner info -->
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-bottom: 30px;
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
            ">
                <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; 
                            border: 4px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                    <img src="${partnerPhoto}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=667eea&color=fff'">
                </div>
                <div style="text-align: left;">
                    <div style="font-weight: bold; font-size: 22px; margin-bottom: 5px;">${partnerName}</div>
                    <div style="font-size: 16px; opacity: 0.8;">@${partnerUsername || 'foydalanuvchi'}</div>
                    <div style="font-size: 14px; opacity: 0.7; margin-top: 5px;">
                        <span>⭐ ${data.partnerRating || 1500}</span>
                        <span style="margin-left: 15px;">🏆 ${data.partnerWins || 0}</span>
                    </div>
                </div>
            </div>
            
            <!-- Action buttons -->
            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 30px;">
                <button id="acceptChatBtn" 
                        style="
                            padding: 18px;
                            background: linear-gradient(to right, #2ecc71, #27ae60);
                            color: white;
                            border: none;
                            border-radius: 15px;
                            font-size: 20px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                            box-shadow: 0 8px 20px rgba(46, 204, 113, 0.4);
                        "
                        onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 25px rgba(46, 204, 113, 0.6)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(46, 204, 113, 0.4)';">
                    <span style="font-size: 24px;">💬</span>
                    CHAT QILISH
                </button>
                
                <button id="rejectChatBtn" 
                        style="
                            padding: 18px;
                            background: linear-gradient(to right, #e74c3c, #c0392b);
                            color: white;
                            border: none;
                            border-radius: 15px;
                            font-size: 20px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.3s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                            box-shadow: 0 8px 20px rgba(231, 76, 60, 0.4);
                        "
                        onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 25px rgba(231, 76, 60, 0.6)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(231, 76, 60, 0.4)';">
                    <span style="font-size: 24px;">⏭️</span>
                    KEYINGI DUEL
                </button>
            </div>
            
            <!-- Timer -->
            <div style="margin-top: 25px;">
                <div style="
                    width: 100%;
                    height: 8px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 10px;
                ">
                    <div id="matchActionTimerBar" 
                         style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(to right, #2ecc71, #f39c12, #e74c3c);
                            border-radius: 4px;
                            transition: width 1s linear;
                         "></div>
                </div>
                <div style="font-size: 16px; opacity: 0.8;">
                    Qaror qabul qilish uchun: <span id="matchActionTime" style="font-weight: bold;">30</span> soniya
                </div>
            </div>
            
            <!-- Stats info -->
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="display: flex; justify-content: space-around; font-size: 14px; opacity: 0.7;">
                    <div>
                        <div style="font-weight: bold;">🏆 G'alaba</div>
                        <div>+${data.ratingChange || 15} rating</div>
                    </div>
                    <div>
                        <div style="font-weight: bold;">💰 Mukofot</div>
                        <div>+${data.coinsEarned || 25} tanga</div>
                    </div>
                    <div>
                        <div style="font-weight: bold;">🤝 Match</div>
                        <div>#${window.userState.matches + 1}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 5. Container'ni qo'shish
    window.gameState.elements.duelContainer.appendChild(chatInviteContainer);
    
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
    
    // 4. Chat boshlash
    this.startChatWithPartner(data);
    
    // 5. Notification
    window.showNotification?.('🎉 Chat', `${data.partnerName} bilan chat boshlanmoqda...`);
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

// ==================== CHAT FUNCTIONS ====================

window.startChatWithPartner = function(data) {
    console.log('💬 Chat boshlanmoqda:', data);
    
    // Chat ekraniga o'tish
    window.showScreen?.('chat');
    
    // Partner ma'lumotlarini ko'rsatish
    if (window.gameState.elements.chatPartnerName) {
        window.gameState.elements.chatPartnerName.textContent = data.partnerName;
    }
    
    if (window.gameState.elements.chatPartnerAvatar) {
        window.gameState.elements.chatPartnerAvatar.src = data.partnerPhoto || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(data.partnerName)}&background=667eea&color=fff`;
    }
    
    if (window.gameState.elements.chatPartnerUsername) {
        window.gameState.elements.chatPartnerUsername.textContent = `@${data.partnerUsername || 'foydalanuvchi'}`;
    }
    
    // Chat xabarlarini tozalash
    if (window.gameState.elements.chatMessages) {
        window.gameState.elements.chatMessages.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">💬</div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">Chat boshlandi</div>
                <div style="font-size: 16px; opacity: 0.8;">
                    ${data.partnerName} bilan suhbat boshlang!<br>
                    Bir-biringizni tanishing
                </div>
            </div>
        `;
    }
    
    // Chat inputni faollashtirish
    if (window.gameState.elements.chatInput) {
        window.gameState.elements.chatInput.disabled = false;
        window.gameState.elements.chatInput.placeholder = "Xabar yozing...";
        window.gameState.elements.chatInput.focus();
    }
    
    if (window.gameState.elements.chatSendBtn) {
        window.gameState.elements.chatSendBtn.disabled = false;
    }
    
    // Socket orqali chat link yaratish
    if (window.socketManager && window.socketManager.createChatLink) {
        window.socketManager.createChatLink({
            partnerId: data.partnerId,
            partnerName: data.partnerName
        });
    }
};

window.sendChatMessage = function() {
    const chatInput = window.gameState.elements.chatInput;
    if (!chatInput || !chatInput.value.trim()) return;
    
    const message = chatInput.value.trim();
    console.log('📤 Chat xabari:', message);
    
    // Xabarni chatga qo'shish
    if (window.gameState.elements.chatMessages) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            background: #667eea;
            color: white;
            padding: 10px 15px;
            border-radius: 15px 15px 5px 15px;
            margin: 10px 0 10px auto;
            max-width: 70%;
            text-align: right;
        `;
        messageDiv.textContent = message;
        window.gameState.elements.chatMessages.appendChild(messageDiv);
        
        // Scroll pastga
        window.gameState.elements.chatMessages.scrollTop = window.gameState.elements.chatMessages.scrollHeight;
    }
    
    // Inputni tozalash
    chatInput.value = '';
    chatInput.focus();
};

// ==================== STATS FUNCTIONS ====================

window.updateMatchStats = function(data) {
    console.log('📊 Match stats yangilanmoqda');
    
    // User stats yangilash
    if (data.coins !== undefined) {
        window.userState.coins = (window.userState.coins || 0) + (data.coins || 25);
    }
    
    if (data.rating !== undefined) {
        window.userState.rating = (window.userState.rating || 1500) + (data.rating || 15);
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
    showChatInviteButtons: window.showChatInviteButtons
};