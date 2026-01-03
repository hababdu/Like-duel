// GameLogic.js - O'yin logikasi

// ==================== GAME STATE ====================
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
    
    // ✅ Yangi: Match action holati
    isWaitingForMatchAction: false,
    matchActionTimeout: null,
    
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

// ==================== TIMER FUNCTIONS ====================

/**
 * Start duel timer
 */
window.startTimer = function() {
    console.log('⏰ Taymer boshlanmoqda...');
    
    // Avvalgi taymerlarni to'xtatish
    clearInterval(window.gameState.timerInterval);
    clearTimeout(window.gameState.duelTimeout);
    
    // Taymerni qayta boshlash
    window.gameState.timeLeft = 20;
    
    if (window.elements?.timer) {
        window.elements.timer.textContent = window.gameState.timeLeft;
        window.elements.timer.style.color = '#2ecc71';
        window.elements.timer.style.display = 'block';
    }
    
    // Taymer interval
    window.gameState.timerInterval = setInterval(() => {
        window.gameState.timeLeft--;
        
        if (window.elements?.timer) {
            window.elements.timer.textContent = window.gameState.timeLeft;
            
            // Rangni o'zgartirish
            if (window.gameState.timeLeft <= 5) {
                window.elements.timer.style.color = '#e74c3c';
                window.elements.timer.style.animation = 'pulse 0.5s infinite';
            } else if (window.gameState.timeLeft <= 10) {
                window.elements.timer.style.color = '#f39c12';
            }
        }
        
        // Vaqt tugaganda
        if (window.gameState.timeLeft <= 0) {
            clearInterval(window.gameState.timerInterval);
            window.handleTimeout?.();
        }
    }, 1000);
    
    // Duel timeout (25 soniya - 5 soniya buffer)
    window.gameState.duelTimeout = setTimeout(() => {
        if (!window.gameState.matchCompleted) {
            console.log('⏰ Duel vaqti tugadi (timeout)');
            window.handleTimeout?.();
        }
    }, 25000);
};

/**
 * Stop all timers
 */
window.stopAllTimers = function() {
    console.log('⏹️ Barcha taymerlar to\'xtatildi');
    clearInterval(window.gameState.timerInterval);
    clearTimeout(window.gameState.duelTimeout);
    clearTimeout(window.gameState.matchActionTimeout);
};

// ==================== DUEL UI FUNCTIONS ====================

/**
 * Reset duel UI
 */
window.resetDuelUI = function() {
    console.log('🔄 Duel UI reset qilinmoqda...');
    
    // Taymerlarni to'xtatish
    window.stopAllTimers();
    
    // UI elementlarini reset qilish
    if (window.elements?.timer) {
        window.elements.timer.textContent = '20';
        window.elements.timer.style.color = '#2ecc71';
        window.elements.timer.style.display = 'block';
        window.elements.timer.style.animation = 'none';
    }
    
    // Chat taklifi containerini yashirish
    const chatInviteContainer = document.getElementById('chatInviteContainer');
    if (chatInviteContainer) {
        chatInviteContainer.style.display = 'none';
    }
    
    // Status yangilash
    window.updateDuelStatus?.('Raqibingizni baholang...');
    
    // Match action holatini reset qilish
    window.gameState.isWaitingForMatchAction = false;
    clearTimeout(window.gameState.matchActionTimeout);
};

/**
 * Reset vote buttons
 */
window.resetVoteButtons = function() {
    console.log('🔄 Vote tugmalari reset qilinmoqda');
    
    const buttons = ['likeBtn', 'superLikeBtn', 'passBtn'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });
    
    // Agar vote buttons container mavjud bo'lsa, ko'rsatish
    if (window.elements?.voteButtons) {
        window.elements.voteButtons.style.display = 'flex';
    }
    
    // Agar opponent info mavjud bo'lsa, ko'rsatish
    if (window.elements?.opponentInfo) {
        window.elements.opponentInfo.style.display = 'block';
    }
};

/**
 * Update duel status
 */
window.updateDuelStatus = function(message) {
    console.log('📝 Duel status:', message);
    
    if (window.elements?.duelStatus) {
        window.elements.duelStatus.textContent = message;
        window.elements.duelStatus.style.animation = 'fadeIn 0.5s';
        
        // Animation reset
        setTimeout(() => {
            window.elements.duelStatus.style.animation = 'none';
        }, 500);
    }
};

// ==================== MATCH HANDLING ====================

/**
 * Handle match - ikkala o'yinchi like bosganda
 */
window.handleMatch = function(data) {
    console.log('🎉 MATCH! Ikkalangiz ham like bosdingiz!', data);
    
    // O'yin holatini yangilash
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = true;
    window.gameState.isWaitingForMatchAction = true; // ✅ Match action kutish holatiga o'tamiz
    
    // Oldingi taymerlarni to'xtatish
    window.stopAllTimers();
    
    // Timer UI ni o'chirish
    if (window.elements?.timer) {
        window.elements.timer.style.display = 'none';
    }
    
    // Tugmalarni yashirish
    if (window.elements?.voteButtons) {
        window.elements.voteButtons.style.display = 'none';
    }
    
    // Opponent info yashirish
    if (window.elements?.opponentInfo) {
        window.elements.opponentInfo.style.display = 'none';
    }
    
    // Chat taklifi tugmalarini ko'rsatish
    window.showChatInviteButtons?.(data);
    
    // Status yangilash
    window.updateDuelStatus?.('🎉 MATCH! Ikkalangiz ham like bosdingiz! Chat qilishni hohlaysizmi?');
    
    // ✅ Match action uchun timeout o'rnatamiz (30 soniya)
    window.gameState.matchActionTimeout = setTimeout(() => {
        if (window.gameState.isWaitingForMatchAction) {
            console.log('⏰ Chat taklifi vaqti tugadi, keyingi duellarga o\'tamiz');
            window.gameState.isWaitingForMatchAction = false;
            window.proceedToNextDuel?.();
        }
    }, 300000); // 30 soniya
    
    // Stats yangilash
    window.updateStats?.(data);
};

/**
 * Chat taklifi tugmalarini ko'rsatish
 */
window.showChatInviteButtons = function(data) {
    console.log('💬 Chat taklifi tugmalari ko\'rsatilmoqda');
    
    if (!window.elements?.duelContainer) return;
    
    // Avvalgi chat taklifi containerini o'chirish
    const oldContainer = document.getElementById('chatInviteContainer');
    if (oldContainer) {
        oldContainer.remove();
    }
    
    // Yangi chat taklifi container yaratish
    const chatInviteContainer = document.createElement('div');
    chatInviteContainer.id = 'chatInviteContainer';
    chatInviteContainer.style.cssText = `
        text-align: center;
        margin: 20px 0;
        animation: fadeIn 0.5s;
    `;
    
    chatInviteContainer.innerHTML = `
        <div class="match-celebration" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 25px; 
                    border-radius: 20px;
                    color: white;
                    margin-bottom: 25px;
                    box-shadow: 0 15px 30px rgba(0,0,0,0.25);
                    border: 3px solid rgba(255,255,255,0.2);">
            
            <!-- Match tasviri -->
            <div style="margin-bottom: 20px;">
                <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
                <h3 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">MATCH!</h3>
                <p style="margin: 0 0 20px 0; font-size: 18px; opacity: 0.9;">
                    ${data.partnerName} bilan o'zaro like bosdingiz!
                </p>
            </div>
            
            <!-- Partner ma'lumotlari -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 25px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 3px solid white;">
                    <img src="${data.partnerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.partnerName || 'U')}&background=667eea&color=fff`}" 
                         style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="text-align: left;">
                    <div style="font-weight: bold; font-size: 18px;">${data.partnerName}</div>
                    <div style="font-size: 14px; opacity: 0.8;">@${data.partnerUsername || 'foydalanuvchi'}</div>
                </div>
            </div>
            
            <!-- Qaror tugmalari -->
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
                <button id="acceptChatBtn" 
                        class="chat-action-btn"
                        style="padding: 15px 35px; 
                               background: #2ecc71; 
                               color: white; 
                               border: none; 
                               border-radius: 30px; 
                               font-size: 18px; 
                               font-weight: bold;
                               cursor: pointer;
                               transition: all 0.3s;
                               flex: 1;
                               max-width: 220px;
                               box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);">
                    💬 Chat qilish
                </button>
                
                <button id="rejectChatBtn" 
                        class="chat-action-btn"
                        style="padding: 15px 35px; 
                               background: #e74c3c; 
                               color: white; 
                               border: none; 
                               border-radius: 30px; 
                               font-size: 18px; 
                               font-weight: bold;
                               cursor: pointer;
                               transition: all 0.3s;
                               flex: 1;
                               max-width: 220px;
                               box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);">
                    ❌ Keyingisi
                </button>
            </div>
            
            <!-- Vaqt qoldiq ko'rsatkichi -->
            <div style="margin-top: 20px; margin-bottom: 10px;">
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                    <div id="matchActionTimerBar" style="width: 100%; height: 100%; background: white; border-radius: 3px; transition: width 1s linear;"></div>
                </div>
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.7;">
                    Qaror qabul qilish uchun <span id="matchActionTime">30</span> soniya
                </div>
            </div>
            
        </div>
    `;
    
    window.elements.duelContainer.appendChild(chatInviteContainer);
    
    // Tugmalarga event listener qo'shish
    document.getElementById('acceptChatBtn').addEventListener('click', function() {
        window.acceptChatInvite?.(data);
    });
    
    document.getElementById('rejectChatBtn').addEventListener('click', function() {
        window.rejectChatInvite?.();
    });
    
    // Match action timer UI
    window.startMatchActionTimer?.();
    
    chatInviteContainer.style.display = 'block';
};

/**
 * Start match action timer (UI uchun)
 */
window.startMatchActionTimer = function() {
    let timeLeft = 30;
    const timerBar = document.getElementById('matchActionTimerBar');
    const timerText = document.getElementById('matchActionTime');
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        
        if (timerText) {
            timerText.textContent = timeLeft;
        }
        
        if (timerBar) {
            const percent = (timeLeft / 30) * 100;
            timerBar.style.width = percent + '%';
            
            // Rangni o'zgartirish
            if (timeLeft <= 10) {
                timerBar.style.background = '#e74c3c';
            } else if (timeLeft <= 20) {
                timerBar.style.background = '#f39c12';
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
};

/**
 * Chat taklifini qabul qilish
 */
window.acceptChatInvite = function(data) {
    console.log('💬 Chat taklifi qabul qilindi:', data);
    
    // Match action holatini tugatish
    window.gameState.isWaitingForMatchAction = false;
    clearTimeout(window.gameState.matchActionTimeout);
    
    // Chat taklifi containerini yashirish
    const chatInviteContainer = document.getElementById('chatInviteContainer');
    if (chatInviteContainer) {
        chatInviteContainer.style.display = 'none';
    }
    
    // UI elementlarini tozalash
    window.resetDuelUI?.();
    
    // Chatga yo'naltirish yoki chat oynasini ko'rsatish
    window.startChatWithPartner?.(data);
    
    // Telegram bot orqali chat link yuborish
    window.sendChatInvitation?.(data);
    
    // Notification
    window.utils?.showNotification('🎉 Chat taklifi qabul qilindi', 
        `${data.partnerName} bilan chat boshlanmoqda...`);
};

/**
 * Chat taklifini rad etish
 */
window.rejectChatInvite = function() {
    console.log('❌ Chat taklifi rad etildi');
    
    // Match action holatini tugatish
    window.gameState.isWaitingForMatchAction = false;
    clearTimeout(window.gameState.matchActionTimeout);
    
    // Chat taklifi containerini yashirish
    const chatInviteContainer = document.getElementById('chatInviteContainer');
    if (chatInviteContainer) {
        chatInviteContainer.style.display = 'none';
    }
    
    // Notification
    window.utils?.showNotification('⏭️ Keyingisi', 'Keyingi duelga o\'tilmoqda...');
    
    // Keyingi duelga o'tish
    window.proceedToNextDuel?.();
};

/**
 * Keyingi duelga o'tish
 */
window.proceedToNextDuel = function() {
    console.log('🔄 Keyingi duelga o\'tilmoqda...');
    
    // Match action holatini tozalash
    window.gameState.isWaitingForMatchAction = false;
    clearTimeout(window.gameState.matchActionTimeout);
    
    // Duel UI ni tozalash
    window.resetDuelUI?.();
    
    // Navbatga qaytish
    window.gameState.isInQueue = true;
    window.gameState.isInDuel = false;
    window.gameState.matchCompleted = false;
    window.gameState.currentDuelId = null;
    
    // Ekranni o'zgartirish
    window.showScreen?.('queue');
    
    // Navbatga qaytish
    if (window.gameState.socket && window.gameState.isConnected) {
        window.gameState.socket.emit('enter_queue');
        window.updateQueueStatus?.('Yangi duel izlanmoqda...');
    }
};

// ==================== OTHER MATCH HANDLERS ====================

/**
 * Handle liked only - faqat siz like bosdingiz
 */
window.handleLikedOnly = function(data) {
    console.log('❤️ Faqat siz like berdidingiz:', data);
    
    window.gameState.matchCompleted = true;
    window.gameState.isInDuel = false;
    
    // Oldingi taymerlarni to'xtatish
    window.stopAllTimers();
    
    // UI elementlarini yangilash
    if (window.elements?.timer) {
        window.elements.timer.style.display = 'none';
    }
    
    if (window.elements?.voteButtons) {
        window.elements.voteButtons.style.display = 'none';
    }
    
    window.updateDuelStatus?.('Siz like berdidingiz, lekin raqib bermadi 😔');
    
    // 3 soniya kutib, keyin keyingi duelga o'tish
    setTimeout(() => {
        window.proceedToNextDuel?.();
    }, 3000);
    
    // Stats yangilash
    window.updateStats?.(data);
};

/**
 * Handle no match - hech kim like bermadi
 */
window.handleNoMatch = function(data) {
    console.log('❌ Match bo\'lmadi');
    
    window.gameState.matchCompleted = true;
    window.gameState.isInDuel = false;
    
    // Oldingi taymerlarni to'xtatish
    window.stopAllTimers();
    
    // UI elementlarini yangilash
    if (window.elements?.timer) {
        window.elements.timer.style.display = 'none';
    }
    
    if (window.elements?.voteButtons) {
        window.elements.voteButtons.style.display = 'none';
    }
    
    window.updateDuelStatus?.('Match bo\'lmadi 😔');
    
    // 3 soniya kutib, keyin keyingi duelga o'tish
    setTimeout(() => {
        window.proceedToNextDuel?.();
    }, 3000);
    
    // Stats yangilash
    window.updateStats?.(data);
};

/**
 * Handle timeout - vaqt tugadi
 */
window.handleTimeout = function(data) {
    console.log('⏰ Vaqt tugadi');
    
    window.gameState.matchCompleted = true;
    window.gameState.isInDuel = false;
    
    // Oldingi taymerlarni to'xtatish
    window.stopAllTimers();
    
    // UI elementlarini yangilash
    if (window.elements?.timer) {
        window.elements.timer.style.display = 'none';
    }
    
    if (window.elements?.voteButtons) {
        window.elements.voteButtons.style.display = 'none';
    }
    
    window.updateDuelStatus?.('Vaqt tugadi ⌛');
    
    // 3 soniya kutib, keyin keyingi duelga o'tish
    setTimeout(() => {
        window.proceedToNextDuel?.();
    }, 3000);
    
    // Stats yangilash (agar data mavjud bo'lsa)
    if (data) {
        window.updateStats?.(data);
    }
};

// ==================== CHAT FUNCTIONS ====================

/**
 * Start chat with partner
 */
window.startChatWithPartner = function(data) {
    console.log('💬 Chat boshlanmoqda:', data);
    
    // Chat oynasini ko'rsatish
    window.showScreen?.('chat');
    
    // Chat UI ni o'rnatish
    window.setupChatUI?.(data);
    
    // Telegram bot orqali chat link yaratish
    if (window.gameState.socket && window.gameState.isConnected) {
        window.gameState.socket.emit('create_chat_link', {
            partnerId: data.partnerId,
            partnerName: data.partnerName,
            partnerPhoto: data.partnerPhoto,
            partnerUsername: data.partnerUsername
        });
    }
};

/**
 * Setup chat UI
 */
window.setupChatUI = function(data) {
    console.log('💬 Chat UI o\'rnatilmoqda');
    
    // Partner ma'lumotlarini ko'rsatish
    if (window.elements?.chatPartnerName) {
        window.elements.chatPartnerName.textContent = data.partnerName;
    }
    
    if (window.elements?.chatPartnerAvatar) {
        window.elements.chatPartnerAvatar.src = data.partnerPhoto || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(data.partnerName || 'U')}&background=667eea&color=fff`;
    }
    
    if (window.elements?.chatPartnerUsername) {
        window.elements.chatPartnerUsername.textContent = `@${data.partnerUsername || 'foydalanuvchi'}`;
    }
    
    // Chat xabarlarini tozalash
    if (window.elements?.chatMessages) {
        window.elements.chatMessages.innerHTML = `
            <div class="system-message" style="text-align: center; color: #666; padding: 20px;">
                <div style="font-size: 24px; margin-bottom: 10px;">💬</div>
                <div style="font-weight: bold; margin-bottom: 5px;">${data.partnerName} bilan chat boshlandi</div>
                <div style="font-size: 14px;">Xush kelibsiz! Bir-biringizni tanishing</div>
            </div>
        `;
    }
    
    // Chat inputni yoqish
    if (window.elements?.chatInput) {
        window.elements.chatInput.disabled = false;
        window.elements.chatInput.placeholder = "Xabar yozing...";
        window.elements.chatInput.focus();
    }
    
    if (window.elements?.chatSendBtn) {
        window.elements.chatSendBtn.disabled = false;
    }
    
    // Back to duels tugmasini ko'rsatish
    if (window.elements?.backToDuelsBtn) {
        window.elements.backToDuelsBtn.style.display = 'block';
    }
};

/**
 * Send chat invitation via Telegram bot
 */
window.sendChatInvitation = function(data) {
    console.log('🤖 Chat taklifi Telegram orqali yuborilmoqda');
    
    // Bu yerda Telegram bot orqali chat link yuborish logikasi bo'ladi
    // Hozircha faqat log qilamiz
    console.log('Chat link yaratildi (simulyatsiya)');
    
    // Agar Web App orqali bo'lsa, Telegram interfeysidan foydalanish mumkin
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/${data.partnerUsername}`);
    }
};

// ==================== STATS FUNCTIONS ====================

/**
 * Update stats
 */
window.updateStats = function(data) {
    console.log('📊 Stats yangilanmoqda:', data);
    
    // User state yangilash
    if (data.coins !== undefined) {
        window.userState.coins = data.coins;
    }
    if (data.rating !== undefined) {
        window.userState.rating = data.rating;
    }
    if (data.matches !== undefined) {
        window.userState.matches = data.matches;
    }
    if (data.duels !== undefined) {
        window.userState.duels = data.duels;
    }
    if (data.wins !== undefined) {
        window.userState.wins = data.wins;
    }
    if (data.totalLikes !== undefined) {
        window.userState.totalLikes = data.totalLikes;
    }
    
    // Game stats yangilash
    if (window.gameState.gameStats) {
        if (data.isMatch) {
            window.gameState.gameStats.matches++;
            window.gameState.gameStats.wins++;
        } else if (data.isLikedOnly) {
            window.gameState.gameStats.wins++;
        } else {
            window.gameState.gameStats.losses++;
        }
        
        window.gameState.gameStats.totalDuels++;
    }
    
    // UI yangilash
    window.updateUIFromUserState?.();
    
    // Saqlash
    window.storage?.saveUserState?.();
};

// ==================== INITIALIZATION ====================

/**
 * Initialize game logic
 */
window.initGameLogic = function() {
    console.log('🎮 Game logic initialized');
    
    // UI elementlarini topish
    this.initializeElements();
    
    // Event listener'larni o'rnatish
    this.setupEventListeners();
};

/**
 * Initialize UI elements
 */
window.initializeElements = function() {
    console.log('🔍 UI elementlari topilmoqda...');
    
    // Asosiy elementlar
    window.gameState.elements = {
        timer: document.getElementById('timer'),
        duelStatus: document.getElementById('duelStatus'),
        voteButtons: document.getElementById('voteButtons'),
        opponentInfo: document.getElementById('opponentInfo'),
        duelContainer: document.getElementById('duelContainer'),
        
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
        superLikeCount: document.getElementById('superLikeCount')
    };
    
    console.log('✅ UI elementlari topildi:', window.gameState.elements);
};

/**
 * Setup event listeners
 */
window.setupEventListeners = function() {
    console.log('🎯 Event listenerlar o\'rnatilmoqda...');
    
    // Vote tugmalari
    const voteButtons = ['likeBtn', 'superLikeBtn', 'passBtn'];
    
    voteButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function() {
                window.handleVote?.(btnId.replace('Btn', ''));
            });
        }
    });
    
    // Chat xabar yuborish
    const chatSendBtn = document.getElementById('chatSendBtn');
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', function() {
            window.sendChatMessage?.();
        });
    }
    
    // Chat input enter bosganda
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.sendChatMessage?.();
            }
        });
    }
    
    // Duelga qaytish
    const backToDuelsBtn = document.getElementById('backToDuelsBtn');
    if (backToDuelsBtn) {
        backToDuelsBtn.addEventListener('click', function() {
            window.proceedToNextDuel?.();
        });
    }
    
    console.log('✅ Event listenerlar o\'rnatildi');
};

/**
 * Handle vote
 */
window.handleVote = function(choice) {
    console.log('🗳️ Ovoz berildi:', choice);
    
    if (!window.gameState.isInDuel || !window.gameState.currentDuelId) {
        window.utils?.showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }
    
    // Tugmalarni disable qilish
    const buttons = ['likeBtn', 'superLikeBtn', 'passBtn'];
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });
    
    // Status yangilash
    let choiceText = '';
    switch(choice) {
        case 'like': choiceText = '❤️ LIKE'; break;
        case 'superLike': choiceText = '💖 SUPER LIKE'; break;
        case 'pass': choiceText = '✖ PASS'; break;
    }
    
    window.updateDuelStatus?.(`Siz ${choiceText} berdingiz. Kutish...`);
    
    // Serverga yuborish
    const success = window.socketManager?.sendVote?.(window.gameState.currentDuelId, choice);
    
    if (!success) {
        window.utils?.showNotification('Xato', 'Ovoz yuborib bo\'lmadi');
        window.resetVoteButtons?.();
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    window.initGameLogic?.();
});