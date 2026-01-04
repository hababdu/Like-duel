// public/socket.js
window.socketManager = {
    socket: null,
    isConnected: false,

    connectToServer: function() {
        if (this.socket && this.socket.connected) {
            console.log('✅ Socket allaqachon ulangan');
            window.gameState.isConnected = true;
            return true;
        }

        // Server URL (Render yoki localhost)
        const serverUrl = window.location.origin.includes('render.com') 
            ? 'wss://like-duel.onrender.com' 
            : 'ws://localhost:3000';

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 20000
        });

        this.socket.on('connect', () => {
            console.log('✅ Serverga ulandi:', this.socket.id);
            window.gameState.isConnected = true;
            window.gameState.socket = this.socket;
            window.utils?.showNotification('Ulandi', 'Serverga muvaffaqiyatli ulandingiz');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Serverdan uzildi');
            window.gameState.isConnected = false;
            window.utils?.showNotification('Uzildi', 'Server bilan aloqa uzildi');
        });

        this.socket.on('connect_error', (err) => {
            console.error('❌ Ulanish xatosi:', err.message);
        });

        // Asosiy event listenerlar
        this.setupEventListeners();
        return true;
    },

    setupEventListeners: function() {
        if (!this.socket) return;

        // Auth muvaffaqiyatli
        this.socket.on('auth_ok', (data) => {
            console.log('✅ Auth muvaffaqiyatli:', data);
            window.userState = { ...window.userState, ...data };
            window.updateUIFromUserState?.();
        });

        // Gender tanlash
        this.socket.on('gender_selected', (data) => {
            console.log('✅ Gender tanlandi:', data);
            window.userState.hasSelectedGender = true;
            window.utils?.showNotification('Gender tanlandi', data.message);
            window.modalManager?.hideGenderModal?.();
        });

        // Queue joined
        this.socket.on('queue_joined', (data) => {
            console.log('📝 Queue ga qo\'shildi:', data);
            window.updateQueueStatus?.(`Navbatda: ${data.position}/${data.total}`);
        });

        // Duel started
        this.socket.on('duel_started', (data) => {
            console.log('⚔️ Duel boshlandi:', data);
            window.gameState.currentDuelId = data.duelId;
            window.gameState.currentOpponent = data.opponent;
            window.gameState.isInDuel = true;
            window.showScreen?.('duel');
            window.uiManager?.updateOpponentInfo?.(data.opponent);
            window.gameLogic?.startTimer?.();
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
            window.utils?.showNotification('Chat qabul qilindi', data.message);
        });

        // Super like used
        this.socket.on('super_like_used', (data) => {
            window.userState.dailySuperLikes = data.remaining;
            window.updateUIFromUserState?.();
        });
    },

    // Serverga yuborish funksiyalari
    enterQueue: function() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('enter_queue');
        }
    },

    sendVote: function(duelId, choice) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('vote', { duelId, choice });
            return true;
        }
        return false;
    },

    sendChatInvite: function(partnerId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('send_chat_invite', { partnerId });
        }
    },

    acceptChatInvite: function(requestId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('accept_chat_invite', { requestId });
        }
    },

    rejectChatInvite: function(requestId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('reject_chat_invite', { requestId });
        }
    }
};

// Avtomatik ulanish
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.socketManager?.connectToServer();
    }, 1000);
});