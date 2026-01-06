// public/gameLogic.js - To'liq funksionallik bilan o'yin logikasi

window.gameLogic = {
    // ==================== INITIALIZATION ====================
    initGameLogic: function() {
        console.log('🎮 Game Logic ishga tushmoqda...');

        this.setupEventListeners();
        this.setupSocketEvents();

        console.log('✅ Game Logic toʻliq ishga tushdi');
    },

    // ==================== EVENT LISTENERS (UI) ====================
    setupEventListeners: function() {
        // Start duel tugmasi
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startDuelFlow();
            });
        }

        // Vote tugmalari
        ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    const choice = id === 'noBtn' ? 'skip' : 
                                  id === 'likeBtn' ? 'like' : 'super_like';
                    this.handleVote(choice);
                });
            }
        });

        // Leave queue
        const leaveBtn = document.getElementById('leaveQueueBtn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                window.socketManager?.socket?.emit('leave_queue');
                window.uiManager?.showScreen('welcome');
            });
        }
    },

    // ==================== SOCKET EVENTS ====================
    setupSocketEvents: function() {
        const socket = window.socketManager?.socket;
        if (!socket) return;

        socket.on('duel_started', (data) => {
            console.log('⚔️ Duel boshlandi:', data);
            window.gameState.currentDuelId = data.duelId;
            window.gameState.currentOpponent = data.opponent;
            window.gameState.isInDuel = true;
            window.gameState.isInQueue = false;

            window.uiManager?.showScreen('duel');
            window.uiManager?.updateOpponentInfo(data.opponent);
            window.uiManager?.updateDuelStatus('Raqibingizni baholang...');
            this.startTimer();
            this.enableVoteButtons();
        });

        socket.on('match_result', (data) => {
            console.log('🎯 Match natijasi:', data);
            this.stopAllTimers();

            if (data.result === 'match') {
                this.handleMatch(data);
            }
        });

        socket.on('liked_only', (data) => {
            this.handleLikedOnly(data);
        });

        socket.on('no_match', () => {
            this.handleNoMatch();
        });

        socket.on('timeout', () => {
            this.handleTimeout();
        });

        socket.on('opponent_left', () => {
            this.handleOpponentLeft();
        });

        socket.on('chat_invite', (data) => {
            this.handleChatInvite(data);
        });
// Socket eventlar qatoriga qo'shing
socket.on('update_friends_list', () => {
    console.log('🔄 Friends list yangilash so\'rovi');
    window.uiManager?.loadFriendsList?.();
});
        socket.on('super_like_used', (data) => {
            window.userState.dailySuperLikes = data.remaining;
            window.uiManager?.updateUIFromUserState();
        });
    },

    // ==================== DUEL FLOW ====================
    startDuelFlow: function() {
        console.log('🎮 O‘yin boshlash bosildi');
    
        if (!window.userState.hasSelectedGender) {
            window.utils?.showNotification('Diqqat', 'Avval gender tanlang!');
            window.modalManager?.showGenderModal(true);
            return;
        }
    
        if (!window.socketManager?.socket?.connected) {
            window.utils?.showNotification('Xato', 'Serverga ulanib boʻlmadi');
            return;
        }
    
        // QUEUE EKRANINI DARHOL OCHISH
        const queueScreen = document.getElementById('queueScreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        const duelScreen = document.getElementById('duelScreen');
    
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (duelScreen) duelScreen.classList.add('hidden');
        if (queueScreen) {
            queueScreen.classList.remove('hidden');
            // Loader va statusni faollashtirish
            document.getElementById('queueStatus')?.textContent = 'Raqib izlanmoqda...';
            document.querySelector('.loader')?.style.display = 'block';
        }
    
        window.uiManager?.updateQueueStatus?.('Raqib izlanmoqda...');
    
        // Serverga enter_queue yuborish
        const success = window.socketManager?.enterQueue();
        if (success) {
            console.log('✅ enter_queue muvaffaqiyatli yuborildi');
        } else {
            window.utils?.showNotification('Xato', 'Navbatga kirib boʻlmadi');
        }
    },

    // ==================== VOTE ====================
    handleVote: function(choice) {
        if (!window.gameState.isInDuel || !window.gameState.currentDuelId) {
            window.utils?.showNotification('Xato', 'Duelda emassiz');
            return;
        }

        // Super like cheklovi
        if (choice === 'super_like' && window.userState.dailySuperLikes <= 0) {
            window.utils?.showNotification('SUPER LIKE tugadi', 'Kunlik limitdan oshdingiz');
            return;
        }

        this.disableVoteButtons();
        window.uiManager?.updateDuelStatus(`Siz ${this.getChoiceText(choice)} berdingiz. Kutish...`);

        const success = window.socketManager?.sendVote(window.gameState.currentDuelId, choice);
        if (!success) {
            this.enableVoteButtons();
            window.utils?.showNotification('Xato', 'Ovoz yuborilmadi');
        }
    },

    disableVoteButtons: function() {
        ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            }
        });
    },

    enableVoteButtons: function() {
        ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });
    },

    getChoiceText: function(choice) {
        switch(choice) {
            case 'like': return '❤️ LIKE';
            case 'super_like': return '💖 SUPER LIKE';
            case 'skip': return '✖ SKIP';
            default: return choice;
        }
    },

    // ==================== TIMER ====================
    startTimer: function() {
        this.stopAllTimers();
        window.gameState.timeLeft = 20;

        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = '20';
            timerEl.style.color = '#2ecc71';
        }

        window.gameState.timerInterval = setInterval(() => {
            window.gameState.timeLeft--;

            if (timerEl) {
                timerEl.textContent = window.gameState.timeLeft;

                if (window.gameState.timeLeft <= 10) {
                    timerEl.style.color = '#e74c3c';
                } else if (window.gameState.timeLeft <= 15) {
                    timerEl.style.color = '#f39c12';
                }
            }

            if (window.gameState.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    },

    stopAllTimers: function() {
        if (window.gameState.timerInterval) clearInterval(window.gameState.timerInterval);
        if (window.gameState.matchActionTimer) clearInterval(window.gameState.matchActionTimer);
        if (window.gameState.matchActionTimeout) clearTimeout(window.gameState.matchActionTimeout);
    },

    // ==================== MATCH HANDLING ====================
    handleMatch: function(data) {
        console.log('🎉 MUTUAL MATCH!', data);
    
        window.gameState.matchCompleted = true;
        window.gameState.currentPartner = data.partner || data.opponent;
    
        this.stopAllTimers();
        this.hideDuelUI();
    
        // ✅ DO'ST QO'SHISH
        this.addToFriendsList(data.partner || data.opponent);
    
        // Match UI ko'rsatish (confetti + chat taklifi)
        this.showMatchScreen(data);
    },
    
    // ==================== FRIENDS ====================
    addToFriendsList: function(friendData) {
        if (!friendData || !friendData.id) {
            console.warn('⚠️ Do\'st ma\'lumotlari yetarli emas');
            return;
        }
    
        let friends = window.storage?.loadFriendsList() || [];
    
        // Takrorlanmasin
        if (friends.some(f => f.id === friendData.id)) {
            console.log('ℹ️ Bu do\'st allaqachon ro\'yxatda');
            return;
        }
    
        // To'liq ma'lumotlarni saqlash
        const newFriend = {
            id: friendData.id,
            name: friendData.name || 'Foydalanuvchi',
            username: friendData.username || '',
            photo: friendData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendData.name || 'User')}&background=667eea&color=fff`,
            gender: friendData.gender || null,
            rating: friendData.rating || 1500,
            matches: friendData.matches || 0,
            level: friendData.level || 1,
            online: friendData.online || true,
            isMutual: true,
            addedAt: new Date().toISOString()
        };
    
        friends.push(newFriend);
    
        window.storage?.saveFriendsList(friends);
        window.userState.mutualMatchesCount = friends.length;
        window.userState.friendsCount = friends.length;
        window.uiManager?.updateUIFromUserState();
    
        console.log(`✅ Do'st qo'shildi: ${newFriend.name} (${friends.length} ta)`);
        window.utils?.showNotification('Doʻst qoʻshildi', `${newFriend.name} doʻstlar roʻyxatiga qoʻshildi!`);
        
        // UI yangilash
        window.uiManager?.loadFriendsList?.();
    },

    showMatchScreen: function(data) {
        const partner = data.partner || data.opponent;
        const duelContainer = document.getElementById('duelScreen');

        const matchHTML = `
            <div class="match-celebration" id="matchCelebration">
                <div class="match-emoji">🎉</div>
                <h2>MATCH!</h2>
                <p>${partner.name} bilan o'zaro like!</p>
                <img src="${partner.photo || '/default-avatar.png'}" class="partner-avatar">
                <div class="rewards">
                    <p>💰 +${data.coinsEarned || 50} tanga</p>
                    <p>⭐ +${data.ratingChange || 25} reyting</p>
                </div>
                <div class="match-actions">
                    <button id="sendChatInviteBtn" class="btn-primary">
                        💬 CHAT TAKLIF QILISH
                    </button>
                    <button id="nextDuelBtn" class="btn-secondary">
                        ⏭️ KEYINGI DUEL
                    </button>
                </div>
                <div class="match-timer">Qaror uchun: <span id="matchTimer">30</span> soniya</div>
            </div>
        `;

        duelContainer.innerHTML = matchHTML;

        // Confetti
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Tugmalar
        document.getElementById('sendChatInviteBtn')?.addEventListener('click', () => {
            window.socketManager?.sendChatInvite(partner.id);
            window.utils?.showNotification('Taklif yuborildi', `${partner.name} ga chat taklifi yuborildi`);
        });

        document.getElementById('nextDuelBtn')?.addEventListener('click', () => {
            this.proceedToNextDuel();
        });

        // 30 soniya timer
        let time = 30;
        const timerEl = document.getElementById('matchTimer');
        window.gameState.matchActionTimer = setInterval(() => {
            time--;
            if (timerEl) timerEl.textContent = time;
            if (time <= 0) {
                this.proceedToNextDuel();
            }
        }, 1000);
    },

    // ==================== OTHER RESULTS ====================
    handleLikedOnly: function(data) {
        this.stopAllTimers();
        this.hideDuelUI();
        window.utils?.showNotification('Faqat siz like berdingiz', data.opponentName + ' like bermadi 😔');
        setTimeout(() => this.proceedToNextDuel(), 3000);
    },

    handleNoMatch: function() {
        this.stopAllTimers();
        this.hideDuelUI();
        window.utils?.showNotification('Match boʻlmadi', 'Hech kim like bermadi');
        setTimeout(() => this.proceedToNextDuel(), 3000);
    },

    handleTimeout: function() {
        this.stopAllTimers();
        this.hideDuelUI();
        window.utils?.showNotification('Vaqt tugadi', 'Javob berish vaqti oʻtdi');
        this.showNewDuelInvite();
    },

    handleOpponentLeft: function() {
        this.stopAllTimers();
        this.hideDuelUI();
        window.utils?.showNotification('Raqib chiqib ketdi', 'Yangi duel boshlanadi');
        this.showNewDuelInvite();
    },

    showNewDuelInvite: function() {
        const container = document.getElementById('duelScreen');
        container.innerHTML = `
            <div class="new-duel-invite">
                <h3>Raqib chiqib ketdi yoki vaqt tugadi</h3>
                <p>Yangi duel boshlaysizmi?</p>
                <button id="newDuelYes" class="btn-primary">Yangi Duel</button>
                <button id="newDuelNo" class="btn-secondary">Menyuga qaytish</button>
            </div>
        `;

        document.getElementById('newDuelYes')?.addEventListener('click', () => {
            this.proceedToNextDuel();
        });

        document.getElementById('newDuelNo')?.addEventListener('click', () => {
            window.uiManager?.showScreen('welcome');
        });
    },

    // ==================== CHAT INVITE ====================
    handleChatInvite: function(data) {
        window.gameState.pendingChatInvite = data;
        this.showChatInviteModal(data);
    },

    showChatInviteModal: function(data) {
        const fromName = data.fromUserName || 'Foydalanuvchi';

        const modalHTML = `
            <div class="modal active" id="chatInviteModal">
                <div class="modal-content">
                    <h3>💬 Chat Taklifi</h3>
                    <p>${fromName} siz bilan chat qilishni xohlaydi!</p>
                    <p><small>Chat qabul qilinsa do'stlar ro'yxatiga qo'shilasiz</small></p>
                    <div class="modal-actions">
                        <button id="acceptChatBtn" class="btn-primary">Qabul qilish</button>
                        <button id="rejectChatBtn" class="btn-secondary">Rad etish</button>
                    </div>
                    <p class="timer">Avto rad: <span id="chatTimer">30</span> soniya</p>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = modalHTML;

        let time = 30;
        const timerEl = document.getElementById('chatTimer');
        const interval = setInterval(() => {
            time--;
            if (timerEl) timerEl.textContent = time;
            if (time <= 0) {
                clearInterval(interval);
                this.rejectChatInvite();
            }
        }, 1000);

        document.getElementById('acceptChatBtn')?.addEventListener('click', () => {
            clearInterval(interval);
            this.acceptChatInvite(data.requestId);
        });

        document.getElementById('rejectChatBtn')?.addEventListener('click', () => {
            clearInterval(interval);
            this.rejectChatInvite();
        });
    },

    acceptChatInvite: function(requestId) {
        window.socketManager?.acceptChatInvite(requestId);

        const partner = {
            id: window.gameState.pendingChatInvite.fromUserId,
            name: window.gameState.pendingChatInvite.fromUserName,
            photo: window.gameState.pendingChatInvite.fromUserPhoto,
            username: '',
            online: true
        };

        // Do'st qo'shish
        this.addToFriendsList(partner);

        // Chat modal ochish
        window.modalManager?.showChatModal(partner);

        document.getElementById('chatInviteModal')?.remove();
    },

    rejectChatInvite: function() {
        if (window.gameState.pendingChatInvite?.requestId) {
            window.socketManager?.rejectChatInvite(window.gameState.pendingChatInvite.requestId);
        }
        document.getElementById('chatInviteModal')?.remove();
        this.proceedToNextDuel();
    },

    // ==================== FRIENDS ====================
    addToFriendsList: function(friendData) {
        let friends = window.storage?.loadFriendsList() || [];

        // Takrorlanmasin
        if (friends.some(f => f.id === friendData.id)) return;

        friends.push({
            ...friendData,
            isMutual: true,
            addedAt: new Date().toISOString()
        });

        window.storage?.saveFriendsList(friends);
        window.userState.mutualMatchesCount = friends.length;
        window.userState.friendsCount = friends.length;
        window.uiManager?.updateUIFromUserState();

        window.utils?.showNotification('Doʻst qoʻshildi', `${friendData.name} doʻstlar roʻyxatiga qoʻshildi!`);
    },

    // ==================== UI HELPERS ====================
    hideDuelUI: function() {
        document.getElementById('voteButtons')?.style.setProperty('display', 'none', 'important');
        document.getElementById('timer')?.style.setProperty('display', 'none', 'important');
    },

    proceedToNextDuel: function() {
        this.stopAllTimers();
        window.gameState.isInDuel = false;
        window.gameState.matchCompleted = false;
        window.gameState.currentDuelId = null;
        window.gameState.currentPartner = null;

        // UI tozalash
        const duelScreen = document.getElementById('duelScreen');
        if (duelScreen) duelScreen.innerHTML = document.querySelector('#duelScreen').innerHTML; // original holat

        window.uiManager?.showScreen('queue');
        window.socketManager?.enterQueue();
    }
};

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 gameLogic.js yuklandi');
    setTimeout(() => {
        window.gameLogic?.initGameLogic();
    }, 1000);
});

console.log('🎮 gameLogic.js toʻliq ishga tushdi');