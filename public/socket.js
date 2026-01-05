// public/socket.js - To'liq, to'g'ri va xavfsiz Socket.io boshqaruvi

window.socketManager = {
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,

    /**
     * Serverga ulanish
     */
    connectToServer: function() {
        // Agar allaqachon ulangan bo'lsa
        if (this.socket && this.socket.connected) {
            console.log('✅ Socket allaqachon ulangan');
            this.setConnected(true);
            return true;
        }

        // Server URL (Render yoki localhost)
        const isProduction = window.location.hostname.includes('render.com') || 
                             window.location.hostname.includes('yourdomain.com'); // o'zingizning domeningiz

        const serverUrl = isProduction 
            ? 'wss://like-duel.onrender.com'  // Render uchun
            : 'ws://localhost:3000';          // Local development

        console.log(`🔌 Socket ulanmoqda: ${serverUrl}`);
// public/socket.js da, connectToServer ichiga yoki DOMContentLoaded da

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔌 socket.js yuklandi');

    setTimeout(() => {
        window.socketManager?.connectToServer();

        // Telegram WebApp dan user ma'lumotlarini olish va auth yuborish
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;

            const authData = {
                userId: tgUser.id.toString(),
                firstName: tgUser.first_name || 'User',
                last_name: tgUser.last_name || '',
                username: tgUser.username || '',
                photoUrl: tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`,
                // Local state dan qo'shimcha ma'lumotlar (agar bor bo'lsa)
                gender: window.userState.currentGender || null,
                hasSelectedGender: window.userState.hasSelectedGender || false,
                bio: window.userState.bio || '',
                filter: window.userState.filter || 'not_specified',
                rating: window.userState.rating || 1500,
                coins: window.userState.coins || 100
            };

            // Socket ulangandan keyin auth yuborish
            const sendAuth = () => {
                if (window.socketManager?.socket?.connected) {
                    window.socketManager.authenticate(authData);
                    console.log('🔐 Auth muvaffaqiyatli yuborildi:', authData.userId);
                } else {
                    setTimeout(sendAuth, 500); // Qayta urinish
                }
            };

            setTimeout(sendAuth, 1500);
        } else {
            console.warn('⚠️ Telegram WebApp user maʼlumotlari topilmadi');
            window.utils?.showNotification('Xato', 'Telegram orqali kirish kerak');
        }
    }, 1000);
});
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            forceNew: true,
            query: {
                version: '1.0.0',
                platform: 'webapp'
            }
        });

        // ==================== SOCKET EVENTS ====================
        this.socket.on('connect', () => {
            console.log('✅ Serverga muvaffaqiyatli ulandi:', this.socket.id);
            this.setConnected(true);
            this.reconnectAttempts = 0;

            window.utils?.showNotification('Ulandi', 'Server bilan aloqa oʻrnatildi');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Serverdan uzildi:', reason);
            this.setConnected(false);

            if (reason === 'io server disconnect') {
                // Server tomonidan uzilgan — qayta ulanish
                this.socket.connect();
            }

            window.utils?.showNotification('Uzildi', 'Server bilan aloqa uzildi');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Ulanish xatosi:', error.message);
            this.setConnected(false);

            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                window.utils?.showNotification('Xato', 'Serverga ulanib boʻlmadi. Internetni tekshiring');
            }
        });

        this.socket.on('reconnect', (attempt) => {
            console.log(`🔄 Qayta ulanish muvaffaqiyatli: ${attempt} urinish`);
            this.setConnected(true);
            window.utils?.showNotification('Qayta ulandi', 'Server bilan aloqa tiklandi');
        });

        this.socket.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 Qayta ulanish urinish: ${attempt}`);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ Qayta ulanish muvaffaqiyatsiz');
            window.utils?.showNotification('Xato', 'Serverga ulanib boʻlmadi');
        });

        // ==================== ASOSIY GAME EVENTS ====================
        this.setupGameEventListeners();

        return true;
    },

    /**
     * Ulangan holatni to'g'ri boshqarish
     */
    setConnected: function(status) {
        this.isConnected = status;
        window.gameState.isConnected = status;

        if (status && this.socket) {
            window.gameState.socket = this.socket;
        }
    },

    /**
     * Asosiy o'yin eventlarini o'rnatish
     */
    setupGameEventListeners: function() {
        if (!this.socket) return;

        // Auth muvaffaqiyatli
        this.socket.on('auth_ok', (data) => {
            console.log('✅ Auth muvaffaqiyatli:', data);
            Object.assign(window.userState, data);
            window.storage?.saveUserState();
            window.uiManager?.updateUIFromUserState();
        });

        // Gender tanlandi
        this.socket.on('gender_selected', (data) => {
            console.log('✅ Gender tanlandi:', data);
            window.utils?.showNotification('Gender', data.message);
        });

        // Queue joined
        this.socket.on('queue_joined', (data) => {
            console.log('📝 Queue ga qoʻshildi:', data);
            window.uiManager?.updateQueueStatus?.(`Navbatda: ${data.position}/${data.total}`);
        });

        // Waiting count
        this.socket.on('waiting_count', (data) => {
            window.uiManager?.updateQueueStatus?.(`Navbatda: ${data.position}/${data.total}`);
        });

        // Duel started
        this.socket.on('duel_started', (data) => {
            console.log('⚔️ Duel boshlandi:', data);
            window.gameState.currentDuelId = data.duelId;
            window.gameState.currentOpponent = data.opponent;
            window.gameState.isInDuel = true;
            window.gameState.isInQueue = false;

            window.uiManager?.showScreen('duel');
            window.uiManager?.updateOpponentInfo(data.opponent);
            window.uiManager?.updateDuelStatus('Raqibingizni baholang...');
            window.gameLogic?.startTimer();
            window.gameLogic?.enableVoteButtons();
        });

        // Match result
        this.socket.on('match_result', (data) => {
            console.log('🎯 Match natijasi:', data);
            window.gameLogic?.handleMatch?.(data);
        });

        // Liked only
        this.socket.on('liked_only', (data) => {
            console.log('❤️ Liked only:', data);
            window.gameLogic?.handleLikedOnly?.(data);
        });

        // No match
        this.socket.on('no_match', () => {
            console.log('❌ No match');
            window.gameLogic?.handleNoMatch?.();
        });

        // Timeout
        this.socket.on('timeout', () => {
            console.log('⏰ Timeout');
            window.gameLogic?.handleTimeout?.();
        });

        // Opponent left
        this.socket.on('opponent_left', () => {
            console.log('🚪 Raqib chiqib ketdi');
            window.gameLogic?.handleOpponentLeft?.();
        });

        // Chat invite
        this.socket.on('chat_invite', (data) => {
            console.log('💬 Chat taklifi keldi:', data);
            window.gameLogic?.handleChatInvite?.(data);
        });

        // Chat accepted
        this.socket.on('chat_accepted', (data) => {
            console.log('✅ Chat qabul qilindi:', data);
            window.utils?.showNotification('Chat', data.message);
        });

        // Chat rejected
        this.socket.on('chat_rejected', (data) => {
            window.utils?.showNotification('Rad etildi', data.message);
        });

        // Super like used
        this.socket.on('super_like_used', (data) => {
            window.userState.dailySuperLikes = data.remaining;
            window.uiManager?.updateUIFromUserState();
        });

        // Coins updated (to'lovdan keyin)
        this.socket.on('update_coins', (data) => {
            window.userState.coins = data.coins;
            window.uiManager?.updateUIFromUserState();
            window.utils?.showNotification('Tanga qoʻshildi', `${data.coins} tanga balansingizda`);
        });

        // Error from server
        this.socket.on('error', (data) => {
            window.utils?.showNotification('Xato', data.message || 'Nomaʼlum xatolik');
        });
    },

    // ==================== YUBORISH FUNKSIYALARI ====================
    enterQueue: function() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('enter_queue');
            console.log('📝 enter_queue yuborildi');
            return true;
        }
        console.warn('❌ enter_queue yuborilmadi — socket ulanmagan');
        return false;
    },

    leaveQueue: function() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('leave_queue');
        }
    },

    sendVote: function(duelId, choice) {
        if (this.socket && this.socket.connected && duelId && choice) {
            this.socket.emit('vote', { duelId, choice });
            console.log(`🗳️ Ovoz yuborildi: ${choice}`);
            return true;
        }
        return false;
    },

    sendChatInvite: function(partnerId) {
        if (this.socket && this.socket.connected && partnerId) {
            this.socket.emit('send_chat_invite', { partnerId });
            return true;
        }
        return false;
    },

    acceptChatInvite: function(requestId) {
        if (this.socket && this.socket.connected && requestId) {
            this.socket.emit('accept_chat_invite', { requestId });
            return true;
        }
        return false;
    },

    rejectChatInvite: function(requestId) {
        if (this.socket && this.socket.connected && requestId) {
            this.socket.emit('reject_chat_invite', { requestId });
            return true;
        }
        return false;
    },

    // Auth yuborish (Telegram user ma'lumotlari bilan)
   // socketManager ichiga qo'shing
authenticate: function(userData) {
    if (this.socket && this.socket.connected) {
        this.socket.emit('auth', userData);
        console.log('🔐 Auth emit qilindi');
        return true;
    }
    console.warn('❌ Auth yuborilmadi — socket ulanmagan');
    return false;
}
};

// ==================== AVTO ULANISH ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔌 socket.js yuklandi');

    setTimeout(() => {
        window.socketManager?.connectToServer();

        // Telegram WebApp bo'lsa — auth yuborish
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;

            const authData = {
                userId: tgUser.id.toString(),
                firstName: tgUser.first_name || 'User',
                username: tgUser.username || '',
                photoUrl: tgUser.photo_url || '',
                // Local state dan qolgan ma'lumotlar
                ...window.userState
            };

            setTimeout(() => {
                window.socketManager?.authenticate(authData);
            }, 1500);
        }
    }, 1000);
});

console.log('🔌 socket.js toʻliq ishga tushdi');