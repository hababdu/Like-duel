// Socket.js - To'liq ishlaydigan Socket.IO manager

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
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                forceNew: true,
                withCredentials: true
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
            window.gameState.reconnectAttempts = 0;
            
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
            window.gameState.reconnectAttempts++;
            
            // Reconnect qilish
            if (window.gameState.reconnectAttempts <= 5) {
                setTimeout(() => {
                    console.log(`🔄 Qayta ulanish urinishi ${window.gameState.reconnectAttempts}/5`);
                    this.connectToServer();
                }, 2000 * window.gameState.reconnectAttempts);
            } else {
                window.utils?.showNotification('Ulanish xatosi', 'Serverga ulanib bo\'lmadi. Qayta urinib ko\'ring.');
            }
        });
        
        socket.on('disconnect', (reason) => {
            console.log('🔌 Uzildi, sabab:', reason);
            window.gameState.isConnected = false;
            
            if (reason === 'io server disconnect') {
                // Server tomonidan uzilgan, qayta ulanamiz
                socket.connect();
            }
            
            // UI yangilash
            window.updateQueueStatus?.('Server bilan aloqa uzildi...');
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
        
        // ============ MATCH EVENTS (ASOSIY) ============
        
        socket.on('match', (data) => {
            console.log('🎉🎉🎉 SERVERDAN MATCH KELDI:', data);
            
            // Match ma'lumotlarini to'ldirish
            const matchData = {
                ...data,
                partnerName: data.partner?.name || data.opponent?.name || 'Foydalanuvchi',
                partnerUsername: data.partner?.username || data.opponent?.username || '',
                partnerPhoto: data.partner?.photo || data.opponent?.photo || '',
                partnerId: data.partner?.id || data.opponent?.userId,
                partnerRating: data.partner?.rating || data.opponent?.rating || 1500,
                partnerWins: data.partner?.wins || data.opponent?.wins || 0,
                partnerGender: data.partner?.gender || data.opponent?.gender || 'not_specified',
                coinsEarned: data.rewards?.coins || data.coinsEarned || 25,
                ratingChange: data.newRating || data.ratingChange || 15,
                isMatch: true,
                isMutual: true, // O'zaro match
                chatInviteEnabled: data.chatInviteEnabled || true
            };
            
            // Do'st qo'shish (agar mutual bo'lsa)
            if (matchData.isMutual && window.addFriend && matchData.partnerId) {
                window.addFriend({
                    id: matchData.partnerId,
                    name: matchData.partnerName,
                    username: matchData.partnerUsername,
                    photo: matchData.partnerPhoto,
                    gender: matchData.partnerGender,
                    rating: matchData.partnerRating,
                    matches: matchData.partnerWins,
                    online: true,
                    isMutual: true
                });
            }
            
            // GameLogic ga yuborish
            if (window.gameLogic && window.gameLogic.handleMatch) {
                window.gameLogic.handleMatch(matchData);
            } else {
                console.error('❌ GameLogic handleMatch topilmadi!');
                // Emergency fallback
                this.showEmergencyMatchUI(matchData);
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
        
        socket.on('waiting_response', (data) => {
            console.log('⏳ Raqib javobini kutyapsiz...');
            window.updateDuelStatus?.('Raqib javobini kutyapsiz...');
        });
        
        // ============ MUTUAL MATCH EVENTS ============
        
        socket.on('mutual_match', (data) => {
            console.log('🤝 Mutual match:', data);
            this.handleMutualMatch(data);
        });
        
        // ============ CHAT EVENTS ============
        
        socket.on('chat_invite', (data) => {
            console.log('💬 Chat taklifi:', data);
            this.handleChatInvite(data);
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
            this.handleChatLinkCreated(data);
        });
        
        // ============ PROFILE EVENTS ============
        
        socket.on('profile_updated', (data) => {
            console.log('📊 Profil yangilandi:', data);
            this.handleProfileUpdated(data);
        });
        
        socket.on('super_like_used', (data) => {
            console.log('💎 Super like ishlatildi:', data);
            this.handleSuperLikeUsed(data);
        });
        
        socket.on('daily_reset', (data) => {
            console.log('🔄 Kunlik reset:', data);
            this.handleDailyReset(data);
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
        
        // Stats yangilash
        if (window.updateStats) {
            window.updateStats(data);
        }
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        // Ekran ko'rsatish
        if (window.userState.hasSelectedGender) {
            window.showScreen?.('queue');
            window.gameState.isInQueue = true;
            
            // Navbatga avtomatik kirish
            setTimeout(() => {
                this.enterQueue();
            }, 500);
        } else {
            window.showScreen?.('queue');
            window.showGenderModal?.(true);
        }
        
        window.utils?.showNotification('Serverga ulandi', 'Tayyor!');
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
        
        // Notification
        if (data.message) {
            window.utils?.showNotification('Gender tanlandi', data.message);
        }
        
        // Navbatga kirish
        if (window.userState.hasSelectedGender) {
            window.gameState.isInQueue = true;
            this.enterQueue();
        }
    },
    
    handleQueueJoined: function(data) {
        console.log('✅ Navbatga kirdingiz:', data);
        
        window.gameState.isInQueue = true;
        
        // UI yangilash
        if (window.updateQueueStatus) {
            window.updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
        }
        
        // Navbat ma'lumotlarini ko'rsatish
        if (window.elements?.position) {
            window.elements.position.textContent = data.position || '-';
        }
        
        if (window.elements?.waitingCount) {
            window.elements.waitingCount.textContent = data.total || '0';
        }
    },
    
    handleWaitingCount: function(data) {
        console.log('📊 Navbat yangilandi:', data);
        
        // Navbat ma'lumotlarini yangilash
        if (window.elements?.waitingCount && data.count !== undefined) {
            window.elements.waitingCount.textContent = data.count;
        }
        
        if (window.elements?.position && data.position !== undefined) {
            window.elements.position.textContent = data.position;
        }
        
        if (window.elements?.positionInfo && data.position !== undefined && data.count !== undefined) {
            window.elements.positionInfo.innerHTML = 
                `Sizning o'rningiz: <span style="font-weight:bold;color:#fff">${data.position}</span> / ${data.count}`;
        }
        
        // Navbat statusini yangilash
        if (data.count > 0) {
            window.updateQueueStatus?.(`Raqib izlanmoqda... ${data.position ? `(O'rningiz: ${data.position})` : ''}`);
        } else {
            window.updateQueueStatus?.('Raqib izlanmoqda...');
        }
    },
    
    handleDuelStarted: function(data) {
        console.log('⚔️ Duel boshlanmoqda:', data);
        
        // Duel ID ni saqlash
        window.gameState.currentDuelId = data.duelId;
        window.gameState.isInDuel = true;
        window.gameState.matchCompleted = false;
        window.gameState.isWaitingForMatchAction = false;
        
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
        
        // Vote tugmalarini yoqish
        if (window.gameLogic && window.gameLogic.enableVoteButtons) {
            window.gameLogic.enableVoteButtons();
        }
    },
    
    updateOpponentInfo: function(opponent) {
        console.log('👤 Opponent ma\'lumotlari:', opponent);
        
        // Avatar
        if (window.elements?.opponentAvatar) {
            window.elements.opponentAvatar.src = opponent.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name || 'O')}&background=${opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
            window.elements.opponentAvatar.style.borderColor = opponent.gender === 'female' ? '#f5576c' : '#667eea';
        }
        
        // Ism
        if (window.elements?.opponentName) {
            window.elements.opponentName.innerHTML = opponent.name || 'Foydalanuvchi';
            // Gender badge qo'shish
            if (window.addGenderBadge && opponent.gender) {
                window.addGenderBadge(window.elements.opponentName, opponent.gender);
            }
        }
        
        // Username
        if (window.elements?.opponentUsername) {
            window.elements.opponentUsername.textContent = opponent.username ? '@' + opponent.username : '';
        }
        
        // Rating
        if (window.elements?.opponentRating) {
            window.elements.opponentRating.textContent = opponent.rating || 1500;
        }
        
        // Matchlar
        if (window.elements?.opponentMatches) {
            window.elements.opponentMatches.textContent = opponent.matches || 0;
        }
        
        // Level
        if (window.elements?.opponentLevel) {
            window.elements.opponentLevel.textContent = opponent.level || 1;
        }
    },
    
    handleMutualMatch: function(data) {
        console.log('🤝 O\'zaro match qo\'shildi:', data);
        
        // User state yangilash
        if (data.mutualMatchesCount !== undefined) {
            window.userState.mutualMatchesCount = data.mutualMatchesCount;
        }
        
        if (data.friendsCount !== undefined) {
            window.userState.friendsCount = data.friendsCount;
        }
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        // Notification
        if (data.message) {
            window.utils?.showNotification('🎉 O\'zaro Match!', data.message);
        }
        
        // Do'stlar ro'yxatini yangilash
        if (window.uiManager && window.uiManager.loadFriendsList) {
            setTimeout(() => {
                window.uiManager.loadFriendsList();
            }, 1000);
        }
    },
    
    handleChatInvite: function(data) {
        console.log('💬 Chat taklifi:', data);
        
        // Chat taklifi modalini ko'rsatish
        if (window.modalManager && window.modalManager.showChatInviteModal) {
            window.modalManager.showChatInviteModal(data);
        } else {
            // Emergency chat taklifi
            const confirmChat = confirm(`${data.fromUserName} siz bilan chat qilishni taklif qildi. Qabul qilasizmi?`);
            
            if (confirmChat) {
                // Chatni qabul qilish
                if (data.requestId) {
                    window.gameState.socket.emit('accept_chat_invite', {
                        requestId: data.requestId
                    });
                }
                
                // Do'st qo'shish
                if (data.fromUserId && data.fromUserName) {
                    window.addFriend?.({
                        id: data.fromUserId,
                        name: data.fromUserName,
                        username: data.fromUserName,
                        photo: data.fromUserPhoto,
                        online: true,
                        isMutual: true
                    });
                }
            } else {
                // Chatni rad etish
                if (data.requestId) {
                    window.gameState.socket.emit('reject_chat_invite', {
                        requestId: data.requestId
                    });
                }
            }
        }
    },
    
    handleChatAccepted: function(data) {
        console.log('✅ Chat qabul qilindi:', data);
        
        // Partner ma'lumotlarini saqlash
        window.gameState.currentPartner = {
            id: data.partnerId,
            name: data.partnerName,
            username: data.partnerUsername,
            photo: data.partnerPhoto
        };
        
        // Chat modalini ko'rsatish
        if (window.modalManager && window.modalManager.showChatModal) {
            window.modalManager.showChatModal(window.gameState.currentPartner);
        }
        
        // Notification
        if (data.message) {
            window.utils?.showNotification('✅ Chat qabul qilindi', data.message);
        }
        
        // Do'st qo'shish
        if (window.addFriend && data.partnerId) {
            window.addFriend({
                id: data.partnerId,
                name: data.partnerName,
                username: data.partnerUsername,
                photo: data.partnerPhoto,
                online: true,
                isMutual: true
            });
        }
    },
    
    handleChatLinkCreated: function(data) {
        console.log('🔗 Chat link yaratildi:', data);
        
        if (data.chatLink) {
            // Telegramda chat linkini ochish
            if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
                Telegram.WebApp.openLink(data.chatLink);
            } else if (window.open) {
                // Browserda ochish
                window.open(data.chatLink, '_blank');
            }
            
            // Notification
            window.utils?.showNotification('💬 Chat ochildi', 'Chat yangi oynada ochildi!');
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
    
    handleSuperLikeUsed: function(data) {
        console.log('💎 Super like ishlatildi:', data);
        
        if (data.remaining !== undefined) {
            window.userState.dailySuperLikes = data.remaining;
            window.updateUIFromUserState?.();
            
            // Notification
            if (data.remaining <= 1) {
                window.utils?.showNotification('💎 Super Like', 
                    `Kunlik SUPER LIKE laringiz tugadi! ${data.remaining} ta qoldi`);
            }
        }
    },
    
    handleDailyReset: function(data) {
        console.log('🔄 Kunlik reset:', data);
        
        if (data.superLikes !== undefined) {
            window.userState.dailySuperLikes = data.superLikes;
            window.updateUIFromUserState?.();
            
            // Notification
            window.utils?.showNotification('🔄 Kun yangilandi', 
                `Kunlik SUPER LIKE lar tiklandi! ${data.superLikes} ta SUPER LIKE`);
        }
    },
    
    handleFriendsList: function(data) {
        console.log('👥 Do\'stlar ro\'yxati:', data);
        
        // Friends list ni saqlash
        window.gameState.friendsList = data.friends || [];
        
        // UI yangilash
        if (window.uiManager && window.uiManager.updateFriendsListUI) {
            window.uiManager.updateFriendsListUI(data);
        }
        
        // User state yangilash
        if (data.total !== undefined) {
            window.userState.friendsCount = data.total;
            window.updateUIFromUserState?.();
        }
    },
    
    handleOpponentLeft: function() {
        console.log('🚪 Raqib chiqib ketdi');
        
        // Duelni yakunlash
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
        
        if (data.message) {
            window.utils?.showNotification('Xato', data.message);
        }
        
        // Agar gender tanlash kerak bo'lsa
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
    
    sendChatInvite: function(partnerId) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
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
    
    getFriendsList: function() {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('👥 Do\'stlar ro\'yxati so\'ralmoqda...');
        
        try {
            window.gameState.socket.emit('get_friends_list');
            return true;
        } catch (error) {
            console.error('❌ Do\'stlar ro\'yxatini olishda xatolik:', error);
            return false;
        }
    },
    
    requestRematch: function(opponentId) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('🔄 Rematch so\'ralmoqda:', opponentId);
        
        try {
            window.gameState.socket.emit('request_rematch', {
                opponentId: opponentId
            });
            return true;
        } catch (error) {
            console.error('❌ Rematch so\'rashda xatolik:', error);
            return false;
        }
    },
    
    acceptRematch: function(opponentId) {
        if (!window.gameState.socket || !window.gameState.isConnected) {
            console.error('❌ Socket ulanmagan');
            return false;
        }
        
        console.log('✅ Rematch qabul qilinmoqda:', opponentId);
        
        try {
            window.gameState.socket.emit('accept_rematch', {
                opponentId: opponentId
            });
            return true;
        } catch (error) {
            console.error('❌ Rematch qabul qilishda xatolik:', error);
            return false;
        }
    },
    
    // ==================== UTILITY METHODS ====================
    
    showEmergencyMatchUI: function(data) {
        console.log('🚨 Emergency match UI ko\'rsatilmoqda');
        
        const html = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: 20px;
            ">
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 30px;
                    border-radius: 20px;
                    max-width: 400px;
                    text-align: center;
                    color: white;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    border: 3px solid rgba(255,255,255,0.2);
                ">
                    <div style="font-size: 70px; margin-bottom: 20px;">🎉</div>
                    <h2 style="margin: 0 0 10px 0; color: #fff;">MATCH!</h2>
                    <p style="color: rgba(255,255,255,0.9); margin-bottom: 20px;">
                        ${data.partnerName} bilan o'zaro like bosdingiz!
                    </p>
                    
                    <div style="margin: 20px 0;">
                        <button onclick="window.socketManager?.sendChatInvite?.('${data.partnerId}')" 
                                style="
                                    background: #2ecc71;
                                    color: white;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 25px;
                                    font-size: 16px;
                                    cursor: pointer;
                                    margin-bottom: 10px;
                                    width: 100%;
                                ">
                            💬 Chat Qilish
                        </button>
                        
                        <button onclick="window.gameLogic?.proceedToNextDuel?.()" 
                                style="
                                    background: #3498db;
                                    color: white;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 25px;
                                    font-size: 16px;
                                    cursor: pointer;
                                    width: 100%;
                                ">
                            ⏭️ Keyingi Duel
                        </button>
                    </div>
                    
                    <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 15px;">
                        Chatni qabul qilsangiz, do'stlar ro'yxatingizga qo'shilasiz
                    </p>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = html;
        div.id = 'emergencyMatchModal';
        document.body.appendChild(div);
    },
    
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
        console.log('🔄 Socket qayta ulanmoqda...');
        this.disconnect();
        return this.connectToServer();
    },
    
    // ==================== PING/PONG ====================
    
    startPing: function() {
        // Serverga ping yuborish (online status uchun)
        setInterval(() => {
            if (window.gameState.socket && window.gameState.isConnected) {
                window.gameState.socket.emit('ping', {
                    timestamp: Date.now()
                });
            }
        }, 30000); // Har 30 soniyada
    },
    
    // ==================== INITIALIZATION ====================
    
    init: function() {
        console.log('🔌 Socket Manager initializing...');
        
        // Socket mavjudligini tekshirish
        if (typeof io === 'undefined') {
            console.error('❌ Socket.IO library topilmadi!');
            window.utils?.showNotification('Xato', 'Socket.IO library yuklanmadi');
            return false;
        }
        
        // Auto connect (agar kerak bo'lsa)
        setTimeout(() => {
            if (!window.gameState.socket && window.userState.hasSelectedGender) {
                console.log('🔄 Avtomatik socket ulanishi...');
                this.connectToServer();
            }
        }, 2000);
        
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