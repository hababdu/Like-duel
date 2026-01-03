// Socket.js - To'liq ishlaydigan Socket.IO manager

const SocketManager = {
    
    connectToServer: function() {
        console.log('🔗 Serverga ulanmoqda...');
        
        // Server URL
        const socketUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://like-duel.onrender.com';
        
        console.log('🌐 Socket URL:', socketUrl);
        
        // Socket yaratish
        window.gameState.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000
        });
        
        // Event listener'larni o'rnatish
        this.setupEventListeners();
        
        return true;
    },
    
    setupEventListeners: function() {
        const socket = window.gameState.socket;
        if (!socket) return;
        
        // CONNECT
        socket.on('connect', () => {
            console.log('✅ Serverga ulandi, Socket ID:', socket.id);
            window.gameState.isConnected = true;
            window.gameState.reconnectAttempts = 0;
            
            // Auth ma'lumotlarini yuborish
            const authData = {
                userId: window.tgUserGlobal?.id || Date.now(),
                firstName: window.tgUserGlobal?.first_name || 'User',
                lastName: window.tgUserGlobal?.last_name || '',
                username: window.tgUserGlobal?.username || 'user_' + Date.now(),
                photoUrl: window.tgUserGlobal?.photo_url || 
                    `https://ui-avatars.com/api/?name=User&background=667eea&color=fff`,
                language: window.tgUserGlobal?.language_code || 'uz',
                gender: window.userState.currentGender,
                hasSelectedGender: window.userState.hasSelectedGender,
                bio: window.userState.bio || '',
                filter: window.userState.filter || 'both'
            };
            
            socket.emit('auth', authData);
            console.log('🔐 Auth ma\'lumotlari yuborildi:', authData);
        });
        
        // AUTH OK
        socket.on('auth_ok', (data) => {
            console.log('✅ Auth muvaffaqiyatli:', data);
            this.handleAuthOk(data);
        });
        
        // DUEL STARTED
        socket.on('duel_started', (data) => {
            console.log('⚔️ Duel boshlandi:', data);
            
            // ✅ Match action kutayotgan bo'lsak, yangi duel boshlanmasin
            if (window.gameState.isWaitingForMatchAction) {
                console.log('⚠️ Match action kutilyapti, yangi duel e\'tiborga olinmaydi');
                return;
            }
            
            this.handleDuelStarted(data);
        });
        
        // MATCH - BU ASOSIY EVENT!
        socket.on('match', (data) => {
            console.log('🎉🎉🎉 SERVERDAN MATCH KELDI:', data);
            
            // Match ma'lumotlarini to'ldirish
            const matchData = {
                ...data,
                partnerName: data.opponent?.name || 'Foydalanuvchi',
                partnerUsername: data.opponent?.username || '',
                partnerPhoto: data.opponent?.photo || '',
                partnerId: data.opponent?.userId,
                partnerRating: data.opponent?.rating || 1500,
                partnerWins: data.opponent?.wins || 0,
                coinsEarned: data.coinsEarned || 25,
                ratingChange: data.ratingChange || 15,
                isMatch: true
            };
            
            // GameLogic ga yuborish
            if (window.gameLogic && window.gameLogic.handleMatch) {
                window.gameLogic.handleMatch(matchData);
            } else if (window.handleMatch) {
                window.handleMatch(matchData);
            } else {
                console.error('❌ Match handler topilmadi!');
                // Emergency fallback
                this.showEmergencyMatchUI(matchData);
            }
        });
        
        // LIKED ONLY
        socket.on('liked_only', (data) => {
            console.log('❤️ Liked only:', data);
            if (window.gameLogic && window.gameLogic.handleLikedOnly) {
                window.gameLogic.handleLikedOnly(data);
            }
        });
        
        // NO MATCH
        socket.on('no_match', (data) => {
            console.log('❌ No match:', data);
            if (window.gameLogic && window.gameLogic.handleNoMatch) {
                window.gameLogic.handleNoMatch(data);
            }
        });
        
        // TIMEOUT
        socket.on('timeout', (data) => {
            console.log('⏰ Timeout:', data);
            if (window.gameLogic && window.gameLogic.handleTimeout) {
                window.gameLogic.handleTimeout(data);
            }
        });
        
        // MUTUAL MATCH
        socket.on('mutual_match', (data) => {
            console.log('🤝 Mutual match:', data);
            this.handleMutualMatch(data);
        });
        
        // CHAT LINK CREATED
        socket.on('chat_link_created', (data) => {
            console.log('🔗 Chat link yaratildi:', data);
            this.handleChatLinkCreated(data);
        });
        
        // OPPONENT LEFT
        socket.on('opponent_left', () => {
            console.log('🚪 Raqib chiqib ketdi');
            this.handleOpponentLeft();
        });
        
        // QUEUE EVENTS
        socket.on('queue_joined', (data) => {
            console.log('✅ Navbatga kirdingiz:', data);
            this.handleQueueJoined(data);
        });
        
        socket.on('waiting_count', (data) => {
            this.handleWaitingCount(data);
        });
        
        // PROFILE EVENTS
        socket.on('profile_updated', (data) => {
            console.log('📊 Profil yangilandi:', data);
            this.handleProfileUpdated(data);
        });
        
        socket.on('super_like_used', (data) => {
            this.handleSuperLikeUsed(data);
        });
        
        socket.on('daily_reset', (data) => {
            this.handleDailyReset(data);
        });
        
        // GENDER EVENTS
        socket.on('show_gender_selection', () => {
            console.log('⚠️ Gender tanlash kerak');
            window.showGenderModal?.(true);
        });
        
        socket.on('gender_selected', (data) => {
            this.handleGenderSelected(data);
        });
        
        // FRIENDS
        socket.on('friends_list', (data) => {
            this.handleFriendsList(data);
        });
        
        // ERROR HANDLING
        socket.on('error', (data) => {
            console.error('❌ Server xatosi:', data);
            this.handleError(data);
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Ulanish xatosi:', error);
            this.handleConnectError(error);
        });
        
        socket.on('disconnect', (reason) => {
            console.log('🔌 Uzildi, sabab:', reason);
            this.handleDisconnect(reason);
        });
    },
    
    // ==================== EVENT HANDLERS ====================
    
    handleAuthOk: function(data) {
        console.log('🔑 Auth OK:', data);
        
        // User state yangilash
        Object.assign(window.userState, {
            currentGender: data.gender,
            hasSelectedGender: data.hasSelectedGender,
            coins: data.coins || 100,
            level: data.level || 1,
            rating: data.rating || 1500,
            matches: data.matches || 0,
            duels: data.duels || 0,
            wins: data.wins || 0,
            totalLikes: data.totalLikes || 0,
            dailySuperLikes: data.dailySuperLikes || 5,
            bio: data.bio || '',
            filter: data.filter || 'both',
            mutualMatchesCount: data.mutualMatchesCount || 0,
            friendsCount: data.friendsCount || 0
        });
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        // Ekran ko'rsatish
        if (window.userState.hasSelectedGender) {
            window.showScreen?.('queue');
            window.gameState.isInQueue = true;
            this.enterQueue();
        } else {
            window.showScreen?.('queue');
            window.showGenderModal?.(true);
        }
    },
    
    handleDuelStarted: function(data) {
        // Duel ID ni saqlash
        window.gameState.currentDuelId = data.duelId;
        window.gameState.isInDuel = true;
        window.gameState.matchCompleted = false;
        
        // Ekran o'zgartirish
        window.showScreen?.('duel');
        
        // Opponent ma'lumotlarini ko'rsatish
        if (data.opponent) {
            this.updateOpponentInfo(data.opponent);
        }
        
        // Timer boshlash
        if (window.gameLogic && window.gameLogic.startTimer) {
            window.gameLogic.startTimer();
        }
        
        // Status yangilash
        window.updateDuelStatus?.('Raqibingizni baholang...');
    },
    
    updateOpponentInfo: function(opponent) {
        const elements = window.gameState.elements;
        
        if (!elements) return;
        
        // Avatar
        if (elements.opponentAvatar) {
            elements.opponentAvatar.src = opponent.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name || 'O')}&background=${opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
            elements.opponentAvatar.style.borderColor = opponent.gender === 'female' ? '#f5576c' : '#667eea';
        }
        
        // Ism
        if (elements.opponentName) {
            elements.opponentName.innerHTML = opponent.name || 'Foydalanuvchi';
            // Gender badge qo'shish
            if (window.addGenderBadge) {
                window.addGenderBadge(elements.opponentName, opponent.gender);
            }
        }
        
        // Username
        if (elements.opponentUsername) {
            elements.opponentUsername.textContent = opponent.username ? '@' + opponent.username : '';
        }
        
        // Rating
        if (elements.opponentRating) {
            elements.opponentRating.textContent = opponent.rating || 1500;
        }
        
        // Matchlar
        if (elements.opponentMatches) {
            elements.opponentMatches.textContent = opponent.matches || 0;
        }
        
        // Level
        if (elements.opponentLevel) {
            elements.opponentLevel.textContent = opponent.level || 1;
        }
    },
    
    handleMutualMatch: function(data) {
        console.log('🤝 O\'zaro match:', data);
        
        // User state yangilash
        window.userState.mutualMatchesCount = data.mutualMatchesCount || 0;
        window.userState.friendsCount = data.friendsCount || 0;
        
        // Notification
        window.showNotification?.('🎉 DO\'ST BO\'LDINGIZ!', 
            `${data.partnerName} bilan o'zaro match!`);
        
        // UI yangilash
        window.updateUIFromUserState?.();
    },
    
    handleChatLinkCreated: function(data) {
        if (data.chatLink && window.Telegram?.WebApp) {
            // Telegramda chat linkini ochish
            window.Telegram.WebApp.openLink(data.chatLink);
        }
    },
    
    handleOpponentLeft: function() {
        // Duelni yakunlash
        window.gameState.isInDuel = false;
        window.gameState.matchCompleted = true;
        
        // Notification
        window.showNotification?.('🚪 Raqib chiqib ketdi', 'Keyingi duelga o\'tilmoqda...');
        
        // Keyingi duelga o'tish
        setTimeout(() => {
            if (window.gameLogic && window.gameLogic.proceedToNextDuel) {
                window.gameLogic.proceedToNextDuel();
            }
        }, 2000);
    },
    
    handleQueueJoined: function(data) {
        window.gameState.isInQueue = true;
        window.updateQueueStatus?.(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
    },
    
    handleWaitingCount: function(data) {
        const elements = window.gameState.elements;
        if (elements && elements.waitingCount) {
            elements.waitingCount.textContent = data.count || 0;
        }
        if (elements && elements.position) {
            elements.position.textContent = data.position || 0;
        }
    },
    
    handleGenderSelected: function(data) {
        window.userState.currentGender = data.gender;
        window.userState.hasSelectedGender = true;
        
        // Navbatga kirish
        window.gameState.isInQueue = true;
        this.enterQueue();
    },
    
    handleProfileUpdated: function(data) {
        if (window.updateStats) {
            window.updateStats(data);
        }
    },
    
    handleSuperLikeUsed: function(data) {
        if (data.remaining !== undefined) {
            window.userState.dailySuperLikes = data.remaining;
            window.updateUIFromUserState?.();
        }
    },
    
    handleDailyReset: function(data) {
        if (data.superLikes !== undefined) {
            window.userState.dailySuperLikes = data.superLikes;
            window.updateUIFromUserState?.();
            window.showNotification?.('🔄 Kun yangilandi', 'Kunlik SUPER LIKE lar tiklandi!');
        }
    },
    
    handleFriendsList: function(data) {
        window.gameState.friendsList = data.friends || [];
        window.updateFriendsListUI?.(data);
    },
    
    handleError: function(data) {
        console.error('❌ Xato:', data);
        window.showNotification?.('Xato', data.message || 'Noma\'lum xato');
    },
    
    handleConnectError: function(error) {
        console.error('❌ Ulanish xatosi:', error);
        window.gameState.reconnectAttempts++;
        
        if (window.gameState.reconnectAttempts > 5) {
            window.showNotification?.('Ulanish xatosi', 'Serverga ulanib bo\'lmadi. Qayta urinib ko\'ring.');
        }
    },
    
    handleDisconnect: function(reason) {
        console.log('🔌 Uzildi:', reason);
        window.gameState.isConnected = false;
        window.gameState.isInQueue = false;
        window.gameState.isInDuel = false;
        window.gameState.isWaitingForMatchAction = false;
        
        // 5 soniyadan keyin qayta ulanish
        setTimeout(() => {
            if (!window.gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                this.connectToServer();
            }
        }, 5000);
    },
    
    // ==================== EMIT METHODS ====================
    
    sendVote: function(duelId, choice) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('🗳️ Ovoz yuborilmoqda:', { duelId, choice });
        
        window.gameState.socket.emit('vote', {
            duelId: duelId,
            choice: choice
        });
        
        return true;
    },
    
    enterQueue: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('🚀 Navbatga kirilmoqda...');
        window.gameState.socket.emit('enter_queue');
        return true;
    },
    
    leaveQueue: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            return false;
        }
        
        window.gameState.socket.emit('leave_queue');
        return true;
    },
    
    updateProfile: function(data) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            return false;
        }
        
        window.gameState.socket.emit('update_profile', data);
        return true;
    },
    
    createChatLink: function(data) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            return false;
        }
        
        console.log('🔗 Chat link yaratilmoqda:', data);
        window.gameState.socket.emit('create_chat_link', data);
        return true;
    },
    
    // ==================== UTILITY METHODS ====================
    
    showEmergencyMatchUI: function(data) {
        // Emergency fallback UI
        console.log('🚨 Emergency match UI ko\'rsatilmoqda');
        
        const html = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            ">
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    max-width: 400px;
                    text-align: center;
                ">
                    <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                    <h2 style="margin: 0 0 10px 0; color: #333;">MATCH!</h2>
                    <p style="color: #666; margin-bottom: 20px;">
                        ${data.partnerName} bilan o'zaro like bosdingiz!
                    </p>
                    <button onclick="location.reload()" 
                            style="
                                background: #667eea;
                                color: white;
                                border: none;
                                padding: 12px 30px;
                                border-radius: 25px;
                                font-size: 16px;
                                cursor: pointer;
                            ">
                        OK
                    </button>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
    }
};

// Global export
window.socketManager = SocketManager;