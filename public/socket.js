// ==================== SOCKET MANAGER ====================

const SocketManager = {
    
    // ==================== CONNECTION ====================
    
    connectToServer: function() {
        console.log('🔗 Serverga ulanmoqda...');
        
        try {
            // Server URL ni aniqlash
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';
            
            const socketUrl = isLocalhost 
                ? 'http://localhost:3000' 
                : 'https://like-duel.onrender.com';
            
            console.log('🌐 Socket URL:', socketUrl);
            
            // Avvalgi socketni yopish
            if (window.gameState.socket) {
                window.gameState.socket.disconnect();
                window.gameState.socket = null;
            }
            
            // Yangi socket yaratish
            window.gameState.socket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                forceNew: true
            });
            
            // Event listener'larni o'rnatish
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('❌ Socket ulanishida xatolik:', error);
            window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
            return false;
        }
    },
    
    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners: function() {
        const socket = window.gameState.socket;
        if (!socket) {
            console.error('❌ Socket mavjud emas');
            return;
        }
        
        console.log('🎯 Socket event listenerlar o\'rnatilmoqda...');
        
        // ============ CONNECTION EVENTS ============
        
        socket.on('connect', () => {
            console.log('✅ Serverga ulandi, Socket ID:', socket.id);
            window.gameState.isConnected = true;
            
            // Auth ma'lumotlarini tayyorlash
            const tgUser = window.tgUserGlobal || {};
            const authData = {
                userId: tgUser.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                firstName: tgUser.first_name || 'Foydalanuvchi',
                lastName: tgUser.last_name || '',
                username: tgUser.username || `user_${Date.now()}`,
                photoUrl: tgUser.photo_url || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`,
                language: tgUser.language_code || 'uz',
                gender: window.userState.currentGender,
                hasSelectedGender: window.userState.hasSelectedGender,
                bio: window.userState.bio || '',
                filter: window.userState.filter || 'not_specified',
                rating: window.userState.rating || 1500,
                coins: window.userState.coins || 100,
                matches: window.userState.matches || 0,
                duels: window.userState.duels || 0,
                wins: window.userState.wins || 0,
                totalLikes: window.userState.totalLikes || 0,
                mutualMatchesCount: window.userState.mutualMatchesCount || 0,
                friendsCount: window.userState.friendsCount || 0,
                dailySuperLikes: window.userState.dailySuperLikes || 3
            };
            
            console.log('🔐 Auth ma\'lumotlari yuborilmoqda:', authData);
            socket.emit('auth', authData);
            
            // UI yangilash
            window.updateQueueStatus?.('Serverga ulandi...');
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Ulanish xatosi:', error);
            window.gameState.isConnected = false;
            
            window.utils?.showNotification('Ulanish xatosi', 'Serverga ulanib bo\'lmadi');
            window.showScreen?.('welcome');
        });
        
        socket.on('disconnect', (reason) => {
            console.log('🔌 Uzildi, sabab:', reason);
            window.gameState.isConnected = false;
            window.gameState.isInQueue = false;
            window.gameState.isInDuel = false;
            
            // Welcome screen ga qaytish
            window.showScreen?.('welcome');
            
            // Notification
            window.utils?.showNotification('Uzildi', 'Server bilan aloqa uzildi');
        });
        
        // ============ AUTH EVENTS ============
        
        socket.on('auth_ok', (data) => {
            console.log('✅ Auth muvaffaqiyatli:', data);
            this.handleAuthOk(data);
        });
        
        // ============ GENDER EVENTS ============
        
        socket.on('show_gender_selection', (data) => {
            console.log('⚠️ Gender tanlash kerak:', data);
            window.showGenderModal?.(true);
            
            if (data.message) {
                window.utils?.showNotification('Diqqat', data.message);
            }
        });
        
        socket.on('gender_selected', (data) => {
            console.log('✅ Gender tanlandi:', data);
            this.handleGenderSelected(data);
        });
        
        // ============ QUEUE EVENTS ============
        
        socket.on('queue_joined', (data) => {
            console.log('✅ Navbatga kirdingiz:', data);
            this.handleQueueJoined(data);
        });
        
        socket.on('waiting_count', (data) => {
            console.log('📊 Navbat ma\'lumotlari:', data);
            this.handleWaitingCount(data);
        });
        
        // ============ DUEL EVENTS ============
        
        socket.on('duel_started', (data) => {
            console.log('⚔️ Duel boshlandi:', data);
            
            // Match action kutayotgan bo'lsak, yangi duel boshlanmasin
            if (window.gameState.isWaitingForMatchAction) {
                console.log('⚠️ Match action kutilyapti, yangi duel e\'tiborga olinmaydi');
                return;
            }
            
            this.handleDuelStarted(data);
        });
        
        // ============ MATCH EVENTS ============
        
        socket.on('match', (data) => {
            console.log('🎉🎉🎉 SERVERDAN MATCH KELDI:', data);
            
            // GameLogic ga yuborish
            if (window.gameLogic && window.gameLogic.handleMatch) {
                window.gameLogic.handleMatch(data);
            }
        });
        
        socket.on('liked_only', (data) => {
            console.log('❤️ Liked only:', data);
            if (window.gameLogic && window.gameLogic.handleLikedOnly) {
                window.gameLogic.handleLikedOnly(data);
            }
        });
        
        socket.on('no_match', (data) => {
            console.log('❌ No match:', data);
            if (window.gameLogic && window.gameLogic.handleNoMatch) {
                window.gameLogic.handleNoMatch(data);
            }
        });
        
        socket.on('timeout', (data) => {
            console.log('⏰ Timeout:', data);
            if (window.gameLogic && window.gameLogic.handleTimeout) {
                window.gameLogic.handleTimeout(data);
            }
        });
        
        socket.on('mutual_super_like', (data) => {
            console.log('💖💖 O\'zaro SUPER LIKE:', data);
            if (window.gameLogic && window.gameLogic.handleSuperLikeGiven) {
                window.gameLogic.handleSuperLikeGiven(data);
            }
        });
        
        // ============ CHAT EVENTS ============
        
        socket.on('chat_invite', (data) => {
            console.log('💬 Chat taklifi:', data);
            if (window.gameLogic && window.gameLogic.handleChatInvite) {
                window.gameLogic.handleChatInvite(data);
            }
        });
        
        socket.on('chat_invite_sent', (data) => {
            console.log('✅ Chat taklifi yuborildi:', data);
            window.utils?.showNotification('Chat taklifi', data.message || 'Chat taklifi yuborildi');
        });
        
        socket.on('chat_accepted', (data) => {
            console.log('✅ Chat taklifi qabul qilindi:', data);
            this.handleChatAccepted(data);
        });
        
        socket.on('chat_rejected', (data) => {
            console.log('❌ Chat taklifi rad etildi:', data);
            window.utils?.showNotification('Chat rad etildi', data.message || 'Chat taklifi rad etildi');
        });
        
        socket.on('chat_link_created', (data) => {
            console.log('🔗 Chat link yaratildi:', data);
            if (window.gameLogic && window.gameLogic.handleChatLinkCreated) {
                window.gameLogic.handleChatLinkCreated(data);
            }
        });
        
        // ============ PROFILE EVENTS ============
        
        socket.on('profile_updated', (data) => {
            console.log('📊 Profil yangilandi:', data);
            this.handleProfileUpdated(data);
        });
        
        // ============ FRIENDS EVENTS ============
        
        socket.on('friends_list', (data) => {
            console.log('👥 Do\'stlar ro\'yxati:', data);
            this.handleFriendsList(data);
        });
        
        // ============ OPPONENT EVENTS ============
        
        socket.on('opponent_left', (data) => {
            console.log('🚪 Raqib chiqib ketdi:', data);
            this.handleOpponentLeft();
        });
        
        // ============ ERROR EVENTS ============
        
        socket.on('error', (data) => {
            console.error('❌ Server xatosi:', data);
            this.handleError(data);
        });
        
        console.log('✅ Barcha socket event listenerlar o\'rnatildi');
    },
    
    // ==================== EVENT HANDLERS ====================
    
    handleAuthOk: function(data) {
        console.log('🔑 Auth OK:', data);
        
        // User state yangilash
        Object.assign(window.userState, {
            currentGender: data.gender || window.userState.currentGender,
            hasSelectedGender: data.hasSelectedGender !== undefined ? data.hasSelectedGender : window.userState.hasSelectedGender,
            coins: data.coins !== undefined ? data.coins : window.userState.coins,
            level: data.level || window.userState.level,
            rating: data.rating || window.userState.rating,
            matches: data.matches || window.userState.matches,
            duels: data.duels || window.userState.duels,
            wins: data.wins || window.userState.wins,
            totalLikes: data.totalLikes || window.userState.totalLikes,
            dailySuperLikes: data.dailySuperLikes !== undefined ? data.dailySuperLikes : window.userState.dailySuperLikes,
            bio: data.bio || window.userState.bio,
            filter: data.filter || window.userState.filter,
            mutualMatchesCount: data.mutualMatchesCount || window.userState.mutualMatchesCount,
            friendsCount: data.friendsCount || window.userState.friendsCount
        });
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        // Welcome screen ga o'tish
        window.showScreen?.('welcome');
        
        // Notification
        window.utils?.showNotification('Serverga ulandi', 'Endi "O\'yinni Boshlash" tugmasini bosing!');
        
        // Agar gender tanlanmagan bo'lsa, eslatma
        if (!window.userState.hasSelectedGender) {
            setTimeout(() => {
                window.utils?.showNotification('Gender tanlash', 'O\'yinni boshlash uchun gender tanlashingiz kerak!');
            }, 1000);
        }
    },
    
    handleGenderSelected: function(data) {
        console.log('✅ Gender tanlandi:', data);
        
        // User state yangilash
        if (data.gender) {
            window.userState.currentGender = data.gender;
        }
        
        if (data.hasSelectedGender !== undefined) {
            window.userState.hasSelectedGender = data.hasSelectedGender;
        }
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        // Start tugmasini faollashtirish
        if (window.elements?.startBtn) {
            window.elements.startBtn.disabled = false;
            window.elements.startBtn.style.opacity = '1';
            window.elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
        }
        
        // Notification
        if (data.message) {
            window.utils?.showNotification('Gender tanlandi', data.message);
        }
        
        // Welcome screen ga qaytish
        window.showScreen?.('welcome');
    },
    
    handleQueueJoined: function(data) {
        console.log('✅ Navbatga kirdingiz:', data);
        
        // Game state yangilash
        window.gameState.isInQueue = true;
        
        // UI yangilash
        if (window.updateQueueStatus) {
            window.updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
        }
        
        // Position va waiting count yangilash
        if (window.elements?.position) {
            window.elements.position.textContent = data.position || '-';
        }
        
        if (window.elements?.waitingCount) {
            window.elements.waitingCount.textContent = data.total || '0';
        }
    },
    
    handleWaitingCount: function(data) {
        console.log('📊 Navbat yangilandi:', data);
        
        // UI elementlarini yangilash
        if (window.elements?.waitingCount && data.count !== undefined) {
            window.elements.waitingCount.textContent = data.count;
        }
        
        if (window.elements?.position && data.position !== undefined) {
            window.elements.position.textContent = data.position;
        }
        
        // Position info yangilash
        if (window.elements?.positionInfo && data.position !== undefined && data.count !== undefined) {
            window.elements.positionInfo.innerHTML = 
                `Sizning o'rningiz: <span style="font-weight:bold;color:#fff">${data.position}</span> / ${data.count}`;
        }
        
        // Queue status yangilash
        if (data.count > 0) {
            window.updateQueueStatus?.(`Raqib izlanmoqda... ${data.position ? `(O'rningiz: ${data.position})` : ''}`);
        } else {
            window.updateQueueStatus?.('Raqib izlanmoqda...');
        }
    },
    
    handleDuelStarted: function(data) {
        console.log('⚔️ Duel boshlanmoqda:', data);
        
        // Game state yangilash
        window.gameState.currentDuelId = data.duelId;
        window.gameState.isInDuel = true;
        window.gameState.matchCompleted = false;
        window.gameState.waitingForChatResponse = false;
        
        // Duel screen ga o'tish
        window.showScreen?.('duel');
        
        // Opponent ma'lumotlarini yangilash
        if (data.opponent) {
            this.updateOpponentInfo(data.opponent);
        }
        
        // Timer boshlash
        if (window.gameLogic && window.gameLogic.startTimer) {
            window.gameLogic.startTimer();
        }
        
        // Duel status yangilash
        window.updateDuelStatus?.('Raqibingizni baholang...');
        
        // Vote tugmalarini faollashtirish
        if (window.gameLogic && window.gameLogic.enableVoteButtons) {
            window.gameLogic.enableVoteButtons();
        }
    },
    
    updateOpponentInfo: function(opponent) {
        console.log('👤 Opponent ma\'lumotlari:', opponent);
        
        // Avatar yangilash
        if (window.elements?.opponentAvatar) {
            window.elements.opponentAvatar.src = opponent.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name || 'O')}&background=${opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
            window.elements.opponentAvatar.style.borderColor = opponent.gender === 'female' ? '#f5576c' : '#667eea';
        }
        
        // Ism yangilash
        if (window.elements?.opponentName) {
            window.elements.opponentName.innerHTML = opponent.name || 'Foydalanuvchi';
            if (window.addGenderBadge && opponent.gender) {
                window.addGenderBadge(window.elements.opponentName, opponent.gender);
            }
        }
        
        // Username yangilash
        if (window.elements?.opponentUsername) {
            window.elements.opponentUsername.textContent = opponent.username ? '@' + opponent.username : '';
        }
        
        // Rating yangilash
        if (window.elements?.opponentRating) {
            window.elements.opponentRating.textContent = opponent.rating || 1500;
        }
        
        // Matchlar soni
        if (window.elements?.opponentMatches) {
            window.elements.opponentMatches.textContent = opponent.matches || 0;
        }
        
        // Level yangilash
        if (window.elements?.opponentLevel) {
            window.elements.opponentLevel.textContent = opponent.level || 1;
        }
    },
    
    handleChatAccepted: function(data) {
        console.log('✅ Chat taklifi qabul qilindi:', data);
        
        // GameLogic ga yuborish
        if (window.gameLogic && window.gameLogic.handleChatAccepted) {
            window.gameLogic.handleChatAccepted(data);
        }
    },
    
    handleProfileUpdated: function(data) {
        console.log('📊 Profil yangilandi:', data);
        
        // User state yangilash
        Object.assign(window.userState, {
            bio: data.bio !== undefined ? data.bio : window.userState.bio,
            gender: data.gender !== undefined ? data.gender : window.userState.currentGender,
            filter: data.filter !== undefined ? data.filter : window.userState.filter,
            hasSelectedGender: data.hasSelectedGender !== undefined ? data.hasSelectedGender : window.userState.hasSelectedGender,
            mutualMatchesCount: data.mutualMatchesCount !== undefined ? data.mutualMatchesCount : window.userState.mutualMatchesCount,
            friendsCount: data.friendsCount !== undefined ? data.friendsCount : window.userState.friendsCount
        });
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        // Notification
        window.utils?.showNotification('✅ Profil yangilandi', 'O\'zgarishlar saqlandi');
    },
    
    handleFriendsList: function(data) {
        console.log('👥 Do\'stlar ro\'yxati:', data);
        
        // Friends list yangilash
        window.gameState.friendsList = data.friends || [];
        
        // UI yangilash
        if (window.uiManager && window.uiManager.updateFriendsListUI) {
            window.uiManager.updateFriendsListUI(data);
        }
        
        // Friends count yangilash
        if (data.total !== undefined) {
            window.userState.friendsCount = data.total;
            window.updateUIFromUserState?.();
        }
    },
    
    handleOpponentLeft: function() {
        console.log('🚪 Raqib chiqib ketdi');
        
        // Game state yangilash
        window.gameState.isInDuel = false;
        window.gameState.matchCompleted = true;
        
        // Notification
        window.utils?.showNotification('🚪 Raqib chiqib ketdi', 'Keyingi duelga o\'tilmoqda...');
        
        // Keyingi duelga o'tish
        setTimeout(() => {
            if (window.gameLogic && window.gameLogic.proceedToNextDuel) {
                window.gameLogic.proceedToNextDuel();
            }
        }, 2000);
    },
    
    handleError: function(data) {
        console.error('❌ Server xatosi:', data);
        
        // Notification
        if (data.message) {
            window.utils?.showNotification('Xato', data.message);
        }
        
        // Agar gender kerak bo'lsa, modal ochish
        if (data.code === 'GENDER_REQUIRED') {
            window.showGenderModal?.(true);
        }
    },
    
    // ==================== EMIT METHODS ====================
    
    sendVote: function(duelId, choice) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
            return false;
        }
        
        if (!duelId) {
            console.error('❌ Duel ID mavjud emas');
            return false;
        }
        
        console.log('🗳️ Ovoz yuborilmoqda:', { duelId, choice });
        
        try {
            window.gameState.socket.emit('vote', {
                duelId: duelId,
                choice: choice
            });
            
            return true;
        } catch (error) {
            console.error('❌ Ovoz yuborishda xatolik:', error);
            return false;
        }
    },
    
    enterQueue: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
            return false;
        }
        
        if (!window.userState.hasSelectedGender) {
            console.error('❌ Gender tanlanmagan');
            window.utils?.showNotification('Xato', 'Avval gender tanlashingiz kerak!');
            window.showGenderModal?.(true);
            return false;
        }
        
        console.log('🚀 Navbatga kirilmoqda...');
        
        try {
            window.gameState.socket.emit('enter_queue');
            return true;
        } catch (error) {
            console.error('❌ Navbatga kirishda xatolik:', error);
            return false;
        }
    },
    
    leaveQueue: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('🚪 Navbatdan chiqilmoqda...');
        
        try {
            window.gameState.socket.emit('leave_queue');
            window.gameState.isInQueue = false;
            return true;
        } catch (error) {
            console.error('❌ Navbatdan chiqishda xatolik:', error);
            return false;
        }
    },
    
    updateProfile: function(data) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('📝 Profil yangilanmoqda:', data);
        
        try {
            window.gameState.socket.emit('update_profile', data);
            return true;
        } catch (error) {
            console.error('❌ Profil yangilashda xatolik:', error);
            return false;
        }
    },
    
    // ==================== CHAT METHODS ====================
    
    sendChatInvite: function(partnerId) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
            return false;
        }
        
        console.log('💬 Chat taklifi yuborilmoqda:', partnerId);
        
        try {
            window.gameState.socket.emit('send_chat_invite', {
                partnerId: partnerId
            });
            return true;
        } catch (error) {
            console.error('❌ Chat taklifi yuborishda xatolik:', error);
            return false;
        }
    },
    
    acceptChatInvite: function(requestId) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('✅ Chat taklifi qabul qilinmoqda:', requestId);
        
        try {
            window.gameState.socket.emit('accept_chat_invite', {
                requestId: requestId
            });
            return true;
        } catch (error) {
            console.error('❌ Chat taklifini qabul qilishda xatolik:', error);
            return false;
        }
    },
    
    rejectChatInvite: function(requestId) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('❌ Chat taklifi rad etilmoqda:', requestId);
        
        try {
            window.gameState.socket.emit('reject_chat_invite', {
                requestId: requestId
            });
            return true;
        } catch (error) {
            console.error('❌ Chat taklifini rad etishda xatolik:', error);
            return false;
        }
    },
    
    cancelChatInvite: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('❌ Chat taklifi bekor qilinmoqda');
        
        try {
            window.gameState.socket.emit('cancel_chat_invite', {});
            return true;
        } catch (error) {
            console.error('❌ Chat taklifini bekor qilishda xatolik:', error);
            return false;
        }
    },
    
    getFriendsList: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('👥 Do\'stlar royxati so\'ralmoqda...');
        
        try {
            window.gameState.socket.emit('get_friends_list');
            return true;
        } catch (error) {
            console.error('❌ Do\'stlar ro\'yxatini olishda xatolik:', error);
            return false;
        }
    },
    
    // ==================== UTILITY METHODS ====================
    
    disconnect: function() {
        console.log('🔌 Socket uzilmoqda...');
        
        if (window.gameState.socket) {
            window.gameState.socket.disconnect();
            window.gameState.socket = null;
            window.gameState.isConnected = false;
            window.gameState.isInQueue = false;
            window.gameState.isInDuel = false;
        }
    },
    
    reconnect: function() {
        console.log('🔄 Qayta ulanmoqda...');
        this.disconnect();
        this.connectToServer();
    },
    
    isConnected: function() {
        return window.gameState.socket && window.gameState.socket.connected;
    },
    
    getSocketId: function() {
        return window.gameState.socket?.id || null;
    },
    
    // ==================== INITIALIZATION ====================
    
    init: function() {
        console.log('🔌 Socket Manager initializing...');
        
        // Socket.IO library mavjudligini tekshirish
        if (typeof io === 'undefined') {
            console.error('❌ Socket.IO library topilmadi!');
            window.utils?.showNotification('Xato', 'Socket.IO library yuklanmadi');
            return false;
        }
        
        // GameState mavjudligini tekshirish
        if (!window.gameState) {
            console.warn('⚠️ GameState mavjud emas, yaratilmoqda...');
            window.gameState = {
                socket: null,
                isConnected: false,
                isInQueue: false,
                isInDuel: false,
                currentDuelId: null,
                matchCompleted: false,
                isWaitingForMatchAction: false,
                waitingForChatResponse: false,
                friendsList: []
            };
        }
        
        // UserState mavjudligini tekshirish
        if (!window.userState) {
            console.warn('⚠️ UserState mavjud emas, yaratilmoqda...');
            window.userState = {
                currentGender: 'not_specified',
                hasSelectedGender: false,
                coins: 100,
                rating: 1500,
                matches: 0,
                duels: 0,
                wins: 0,
                totalLikes: 0,
                mutualMatchesCount: 0,
                friendsCount: 0,
                dailySuperLikes: 3
            };
        }
        
        console.log('✅ Socket Manager initialized');
        return true;
    }
};

// Auto initialize
setTimeout(() => {
    SocketManager.init();
}, 1000);

// Global export
window.socketManager = SocketManager;

console.log('✅ Socket.js yuklandi - Socket Manager tayyor');