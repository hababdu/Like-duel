// ==================== SOCKET MANAGER ====================

// socket.js
const SocketManager = {
    connectToServer: function() {
        console.log('🔗 Serverga ulanmoqda...');

        try {
            const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            const socketUrl = isLocalhost 
                ? 'http://localhost:3000' 
                : 'https://like-duel.onrender.com';

            if (window.gameState.socket) {
                window.gameState.socket.disconnect();
            }

            window.gameState.socket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                forceNew: true
            });

            this.setupEventListeners();
            return true;
        } catch (error) {
            console.error('❌ Socket ulanish xatosi:', error);
            window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
            return false;
        }
    },

    setupEventListeners: function() {
        const socket = window.gameState.socket;
        if (!socket) return;

        socket.on('connect', () => {
            console.log('✅ Serverga ulandi:', socket.id);
            window.gameState.isConnected = true;
            window.updateQueueStatus?.('Serverga ulandi...');
        });

        socket.on('auth_ok', (data) => {
            console.log('✅ Auth muvaffaqiyatli');
            Object.assign(window.userState, data);
            window.updateUIFromUserState?.();
            window.showScreen?.('welcome');
        });

        socket.on('duel_started', (data) => {
            if (window.gameState.isWaitingForMatchAction) return;
            window.gameLogic?.handleDuelStarted?.(data);
        });

        socket.on('match', (data) => {
            window.gameLogic?.handleMatch?.(data);
        });

        socket.on('liked_only', (data) => {
            window.gameLogic?.handleLikedOnly?.(data);
        });

        socket.on('no_match', (data) => {
            window.gameLogic?.handleNoMatch?.(data);
        });

        socket.on('timeout', (data) => {
            window.gameLogic?.handleTimeout?.(data);
        });

        socket.on('opponent_left', () => {
            window.gameLogic?.handleOpponentLeft?.();
        });

        socket.on('chat_invite', (data) => {
            window.gameLogic?.handleChatInvite?.(data);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Ulanish xatosi:', err);
            window.gameState.isConnected = false;
            window.utils?.showNotification('Xato', 'Server bilan aloqa uzildi');
        });

        socket.on('disconnect', () => {
            console.log('🔌 Serverdan uzildi');
            window.gameState.isConnected = false;
            window.showScreen?.('welcome');
        });
    },

    sendVote: function(duelId, choice) {
        if (!window.gameState.isConnected || !window.gameState.socket) return false;
        window.gameState.socket.emit('vote', { duelId, choice });
        return true;
    },

    enterQueue: function() {
        if (!window.gameState.isConnected || !window.gameState.socket) return false;
        window.gameState.socket.emit('enter_queue');
        return true;
    },

    leaveQueue: function() {
        if (!window.gameState.isConnected || !window.gameState.socket) return false;
        window.gameState.socket.emit('leave_queue');
        return true;
    },

    acceptChatInvite: function(requestId) {
        if (!window.gameState.isConnected || !window.gameState.socket) return false;
        window.gameState.socket.emit('accept_chat_invite', { requestId });
        return true;
    },

    rejectChatInvite: function(requestId) {
        if (!window.gameState.isConnected || !window.gameState.socket) return false;
        window.gameState.socket.emit('reject_chat_invite', { requestId });
        return true;
    }
};

setTimeout(() => SocketManager.connectToServer(), 1000);
window.socketManager = SocketManager;
console.log('✅ socket.js yuklandi');

// Auto initialize
setTimeout(() => {
    SocketManager.init();
}, 1000);

// Global export
window.socketManager = SocketManager;

console.log('✅ Socket.js yuklandi - Socket Manager tayyor');