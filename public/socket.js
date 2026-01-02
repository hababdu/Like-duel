// Socket.js - Socket.IO boshqaruv moduli

// ==================== SOCKET.IO MANAGEMENT ====================

const SocketManager = {
    // ==================== CONNECTION ====================
    
    /**
     * Connect to server
     */
    connectToServer: function() {
        if (!window.tgUserGlobal) {
            window.utils?.showNotification('Xato', 'Foydalanuvchi ma\'lumotlari topilmadi');
            return;
        }
        
        if (window.gameState.socket && window.gameState.isConnected) {
            console.log('ℹ️ Allaqachon serverga ulanilgan');
            
            // Agar ulangan bo'lsa, faqat navbatga kirish
            if (window.userState.hasSelectedGender) {
                window.gameState.isInQueue = true;
                window.gameState.socket.emit('enter_queue');
                window.showScreen('queue');
                return;
            }
            return;
        }
        
        console.log('🔗 Serverga ulanmoqda...');
        window.updateQueueStatus?.('Serverga ulanmoqda...');
        
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        let socketUrl;
        
        if (isLocalhost) {
            socketUrl = 'http://localhost:3000';
            console.log('📍 Local development rejimi');
        } else {
            socketUrl = 'https://like-duel.onrender.com';
            console.log('📍 Production (Render.com) rejimi');
        }
        
        console.log('🔌 Socket URL:', socketUrl);
        
        window.gameState.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            forceNew: true
        });
        
        this.setupEventListeners();
    },
    
    // ==================== EVENT LISTENERS ====================
    
    /**
     * Setup socket event listeners
     */
    setupEventListeners: function() {
        const socket = window.gameState.socket;
        if (!socket) return;
        
        socket.on('connect', () => {
            console.log('✅ Serverga ulandi');
            window.gameState.isConnected = true;
            window.gameState.reconnectAttempts = 0;
            window.updateQueueStatus?.('Serverga ulandi...');
            
            socket.emit('auth', {
                userId: window.tgUserGlobal.id,
                firstName: window.tgUserGlobal.first_name,
                lastName: window.tgUserGlobal.last_name || '',
                username: window.tgUserGlobal.username,
                photoUrl: window.tgUserGlobal.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(window.tgUserGlobal.first_name || 'User')}&background=667eea&color=fff`,
                language: window.tgUserGlobal.language_code || 'uz',
                gender: window.userState.currentGender,
                hasSelectedGender: window.userState.hasSelectedGender,
                bio: window.userState.bio,
                filter: window.userState.filter
            });
            
            window.utils?.showNotification('✅ Ulanish', 'Serverga muvaffaqiyatli ulandik');
        });
        
        socket.on('auth_ok', (data) => {
            this.handleAuthOk(data);
        });
        
        socket.on('show_gender_selection', (data) => {
            console.log('⚠️ Serverdan gender tanlash so\'rovi:', data);
            window.showGenderModal?.(true);
            window.updateQueueStatus?.('Gender tanlash kerak...');
        });
        
        socket.on('gender_selected', (data) => {
            this.handleGenderSelected(data);
        });
        
        socket.on('queue_joined', (data) => {
            this.handleQueueJoined(data);
        });
        
        socket.on('waiting_count', (data) => {
            this.handleWaitingCount(data);
        });
        
        socket.on('duel_started', (data) => {
            this.handleDuelStarted(data);
        });
        
        socket.on('match', (data) => {
            this.handleMatch(data);
        });
        
        socket.on('mutual_match', (data) => {
            this.handleMutualMatch(data);
        });
        
        socket.on('liked_only', (data) => {
            this.handleLikedOnly(data);
        });
        
        socket.on('no_match', (data) => {
            this.handleNoMatch(data);
        });
        
        socket.on('timeout', (data) => {
            this.handleTimeout(data);
        });
        
        socket.on('waiting_response', (data) => {
            this.handleWaitingResponse(data);
        });
        
        socket.on('friends_list', (data) => {
            this.handleFriendsList(data);
        });
        
        socket.on('profile_updated', (data) => {
            this.handleProfileUpdated(data);
        });
        
        socket.on('super_like_used', (data) => {
            this.handleSuperLikeUsed(data);
        });
        
        socket.on('daily_reset', (data) => {
            this.handleDailyReset(data);
        });
        
        socket.on('opponent_left', () => {
            this.handleOpponentLeft();
        });
        
        socket.on('error', (data) => {
            this.handleError(data);
        });
        
        socket.on('connect_error', (error) => {
            this.handleConnectError(error);
        });
        
        socket.on('disconnect', (reason) => {
            this.handleDisconnect(reason);
        });
    },
    
    // ==================== EVENT HANDLERS ====================
    
    /**
     * Handle authentication successful
     */
    handleAuthOk: function(data) {
        console.log('✅ Autentifikatsiya muvaffaqiyatli:', data);
        
        // Update user state from server
        Object.assign(window.userState, {
            currentGender: data.gender || window.userState.currentGender,
            hasSelectedGender: data.hasSelectedGender !== undefined ? data.hasSelectedGender : window.userState.hasSelectedGender,
            coins: data.coins || window.userState.coins,
            level: data.level || window.userState.level,
            rating: data.rating || window.userState.rating,
            matches: data.matches || window.userState.matches,
            duels: data.duels || window.userState.duels,
            wins: data.wins || window.userState.wins,
            totalLikes: data.totalLikes || window.userState.totalLikes,
            dailySuperLikes: data.dailySuperLikes || window.userState.dailySuperLikes,
            bio: data.bio || window.userState.bio,
            filter: data.filter || window.userState.filter,
            mutualMatchesCount: data.mutualMatchesCount || window.userState.mutualMatchesCount,
            friendsCount: data.friendsCount || window.userState.friendsCount
        });
        
        window.storage?.saveUserState?.();
        window.updateUIFromUserState?.();
        
        window.showScreen?.('queue');
        
        if (window.userState.hasSelectedGender) {
            console.log('🚀 Gender tanlangan, navbatga kirilmoqda...');
            window.gameState.isInQueue = true;
            window.gameState.socket.emit('enter_queue');
        } else {
            console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
            window.updateQueueStatus?.('Gender tanlash kerak...');
            window.showGenderModal?.(true);
        }
    },
    
    /**
     * Handle gender selected
     */
    handleGenderSelected: function(data) {
        console.log('✅ Gender tanlandi:', data);
        
        window.userState.currentGender = data.gender;
        window.userState.hasSelectedGender = true;
        
        window.storage?.saveUserState?.();
        window.updateUIFromUserState?.();
        
        window.hideGenderModal?.();
        
        if (window.gameState.socket && window.gameState.isConnected) {
            window.gameState.isInQueue = true;
            window.gameState.socket.emit('enter_queue');
        }
        
        window.utils?.showNotification('🎉 Jins tanlandi', 
            data.message || 'Endi duel o\'ynashingiz mumkin!');
    },
    
    /**
     * Handle queue joined
     */
    handleQueueJoined: function(data) {
        console.log('✅ Navbatga kirdingiz:', data);
        window.gameState.isInQueue = true;
        window.showScreen?.('queue');
        window.updateQueueStatus?.(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
    },
    
    /**
     * Handle waiting count update
     */
    handleWaitingCount: function(data) {
        if (window.elements?.waitingCount) {
            window.elements.waitingCount.textContent = data.count;
        }
        if (window.elements?.position) {
            if (data.position > 0) {
                window.elements.position.textContent = data.position;
                if (window.elements.positionInfo) {
                    window.elements.positionInfo.style.display = 'block';
                }
                window.updateQueueStatus?.(`Navbatdasiz. O'rningiz: ${data.position}/${data.count}`);
            } else {
                if (window.elements.positionInfo) {
                    window.elements.positionInfo.style.display = 'none';
                }
                window.updateQueueStatus?.('Navbatda...');
            }
        }
    },
    
    /**
     * Handle waiting response - bunday event serverdan kelmasligi kerak!
     * server faqat duel_started, match, liked_only, no_match, timeout event'larini yuboradi
     */
    handleWaitingResponse: function(data) {
        console.log('⏳ Server: waiting_response (BU NOTO\'G\'RI ISHLATILMASI KERAK!)');
        
        // Bu event faqat biz ovoz berganimizdan keyin kelishi kerak
        // Serverda boshqa o'yinchi ovoz berganda, bizga "waiting_response" yuborilmasligi kerak
        // Buning o'rniga, biz duel_started qayta kelishi kerak yoki hech narsa kelmasligi kerak
        
        // Agar bu event kelgan bo'lsa, demak server noto'g'ri konfiguratsiya
        console.warn('⚠️ Server noto\'g\'ri konfiguratsiya: waiting_response event');
        
        // Faqat log qilamiz, ammo hech qanday UI o'zgartirmaymiz
        // UI faqat bizning o'zimiz ovoz berganimizda o'zgaradi
    },
    
    /**
     * Handle duel started - serverdan raqib ovoz berganda
     */
    handleDuelStarted: function(data) {
        console.log('⚔️ Duel boshlandi yoki davom etmoqda:', data);
        
        // Agar duel allaqachon boshlandi bo'lsa, bu raqib ovoz bergani degani
        if (window.gameState.isInDuel && window.gameState.currentDuelId === data.duelId) {
            console.log('⚠️ Duel davom etmoqda, raqib ovoz berdi');
            
            // Raqib ovoz bergani uchun "keyingisi" tugmasi CHIQMAYDI!
            // Buning o'rniga, bizga ovoz berish imkoniyati beriladi
            
            // Faqat UI yangilash, tugmalarni o'zgartirmaslik
            if (window.elements?.timer) {
                window.elements.timer.textContent = window.gameState.timeLeft || 20;
                window.elements.timer.style.color = '#2ecc71';
            }
            
            window.updateDuelStatus?.('Raqib ovoz berdi. Siz ovoz bering...');
            return;
        }
        
        // Yangi duel boshlandi
        console.log('🎮 Yangi duel boshlandi');
        
        window.gameState.isInDuel = true;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = false;
        window.gameState.currentDuelId = data.duelId;
        window.showScreen?.('duel');
        
        // Oldingi taymerlarni to'xtatamiz
        window.gameLogic?.stopAllTimers?.();
        
        // Tugmalarni reset qilamiz
        window.resetVoteButtons?.();
        
        // Update opponent info
        if (window.elements?.opponentAvatar) {
            window.elements.opponentAvatar.src = data.opponent.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(data.opponent.name || 'O')}&background=${data.opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
            window.elements.opponentAvatar.style.borderColor = data.opponent.gender === 'female' ? '#f5576c' : '#667eea';
        }
        
        if (window.elements?.opponentName) {
            window.elements.opponentName.innerHTML = data.opponent.name;
            window.addGenderBadge?.(window.elements.opponentName, data.opponent.gender);
        }
        
        if (window.elements?.opponentUsername) {
            window.elements.opponentUsername.textContent = data.opponent.username || '';
        }
        
        if (window.elements?.opponentRating) {
            window.elements.opponentRating.textContent = data.opponent.rating || 1500;
        }
        
        if (window.elements?.opponentMatches) {
            window.elements.opponentMatches.textContent = data.opponent.matches || 0;
        }
        
        if (window.elements?.opponentLevel) {
            window.elements.opponentLevel.textContent = data.opponent.level || 1;
        }
        
        // Start timer
        window.startTimer?.();
        window.updateDuelStatus?.('Raqibingizni baholang...');
    },
    
    /**
     * Handle match
     */
    handleMatch: function(data) {
        console.log('🎉 MATCH!', data);
        window.gameState.matchCompleted = true;
        window.handleMatch?.(data);
    },
    
    /**
     * Handle mutual match
     */
    handleMutualMatch: function(data) {
        console.log('🤝 O\'zaro Match qo\'shildi:', data);
        
        window.userState.mutualMatchesCount = data.mutualMatchesCount;
        window.userState.friendsCount = data.friendsCount;
        
        window.storage?.saveUserState?.();
        window.updateUIFromUserState?.();
        
        window.utils?.showNotification('🎉 DO\'ST BO\'LDINGIZ!', 
            `${data.partnerName} bilan o'zaro match! Endi siz bir-biringizning do'stlaringiz ro'yxatidasiz.`);
    },
    
    /**
     * Handle liked only
     */
    handleLikedOnly: function(data) {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        window.gameState.matchCompleted = true;
        window.handleLikedOnly?.(data);
    },
    
    /**
     * Handle no match
     */
    handleNoMatch: function(data) {
        console.log('❌ Match bo\'lmadi');
        window.gameState.matchCompleted = true;
        window.handleNoMatch?.(data);
    },
    
    /**
     * Handle timeout
     */
    handleTimeout: function(data) {
        console.log('⏰ Vaqt tugadi');
        window.gameState.matchCompleted = true;
        window.handleTimeout?.(data);
    },
    
    /**
     * Handle friends list
     */
    handleFriendsList: function(data) {
        console.log('👥 Dostlar royxati:', data);
        window.gameState.friendsList = data.friends;
        window.updateFriendsListUI?.(data);
    },
    
    /**
     * Handle profile updated
     */
    handleProfileUpdated: function(data) {
        console.log('📊 Profil yangilandi:', data);
        window.updateStats?.(data);
    },
    
    /**
     * Handle super like used
     */
    handleSuperLikeUsed: function(data) {
        console.log('💖 Super like ishlatildi:', data);
        if (window.elements?.superLikeCount) {
            window.elements.superLikeCount.textContent = data.remaining;
        }
        window.userState.dailySuperLikes = data.remaining;
        window.storage?.saveUserState?.();
    },
    
    /**
     * Handle daily reset
     */
    handleDailyReset: function(data) {
        console.log('🔄 Kunlik limitlar yangilandi:', data);
        if (window.elements?.superLikeCount) {
            window.elements.superLikeCount.textContent = data.superLikes;
        }
        window.userState.dailySuperLikes = data.superLikes;
        window.storage?.saveUserState?.();
        window.utils?.showNotification('Kun yangilandi', 'Kunlik SUPER LIKE lar qayta tiklandi!');
    },
    
    /**
     * Handle opponent left
     */
    handleOpponentLeft: function() {
        console.log('🚪 Raqib chiqib ketdi');
        clearInterval(window.gameState.timerInterval);
        window.updateDuelStatus?.('Raqib chiqib ketdi. Keyingi duelga tayyormisiz?');
        
        window.showOpponentLeftModal?.();
    },
    
    /**
     * Handle error
     */
    handleError: function(data) {
        console.error('❌ Xato:', data);
        window.utils?.showNotification('Xato', data.message || 'Noma\'lum xato');
    },
    
    /**
     * Handle connect error
     */
    handleConnectError: function(error) {
        console.error('❌ Ulanish xatosi:', error);
        window.gameState.reconnectAttempts++;
        
        if (window.gameState.reconnectAttempts > window.gameState.maxReconnectAttempts) {
            window.utils?.showNotification('Ulanish xatosi', 'Serverga ulanib bo\'lmadi. Iltimos, qayta urinib ko\'ring.');
            window.gameState.socket?.disconnect();
        } else {
            window.updateQueueStatus?.(`Qayta ulanmoqda... (${window.gameState.reconnectAttempts}/${window.gameState.maxReconnectAttempts})`);
        }
    },
    
    /**
     * Handle disconnect
     */
    handleDisconnect: function(reason) {
        console.log('❌ Serverdan uzildi:', reason);
        window.gameState.isConnected = false;
        window.gameState.isInQueue = false;
        window.gameState.isInDuel = false;
        
        if (reason === 'io server disconnect') {
            window.updateQueueStatus?.('Server tomonidan uzildi. Qayta ulanmoqda...');
        } else {
            window.updateQueueStatus?.('Ulanish uzildi. Qayta ulanmoqda...');
        }
        
        setTimeout(() => {
            if (!window.gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                this.connectToServer();
            }
        }, 5000);
    },
    
    // ==================== SOCKET EMIT METHODS ====================
    
    /**
     * Send vote to server
     */
    sendVote: function(duelId, choice) {
        if (!window.gameState.socket || !window.gameState.isInDuel) {
            window.utils?.showNotification('Xato', 'Siz hozir duelda emassiz');
            return false;
        }
        
        window.gameState.socket.emit('vote', { 
            duelId: duelId, 
            choice: choice 
        });
        
        return true;
    },
    
    /**
     * Enter queue
     */
    enterQueue: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            window.utils?.showNotification('Xato', 'Serverga ulanilmagan');
            return false;
        }
        
        window.gameState.socket.emit('enter_queue');
        return true;
    },
    
    /**
     * Leave queue
     */
    leaveQueue: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            return false;
        }
        
        window.gameState.socket.emit('leave_queue');
        return true;
    },
    
    /**
     * Update profile
     */
    updateProfile: function(data) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            return false;
        }
        
        window.gameState.socket.emit('update_profile', data);
        return true;
    },
    
    /**
     * Get friends list
     */
    getFriendsList: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            return false;
        }
        
        window.gameState.socket.emit('get_friends_list');
        return true;
    },
    
    /**
     * Disconnect socket
     */
    disconnect: function() {
        if (window.gameState.socket) {
            window.gameState.socket.disconnect();
            window.gameState.socket = null;
            window.gameState.isConnected = false;
            console.log('🔌 Socket uzildi');
        }
    }
};

// Export to global scope
window.socketManager = SocketManager;