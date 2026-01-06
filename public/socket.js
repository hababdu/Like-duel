// public/socket.js - FULL WORKING SOCKET MANAGER
window.socketManager = {
    socket: null,
    isConnected: false,
    connectionAttempts: 0,
    maxConnectionAttempts: 5,
    
    // ==================== CONNECTION ====================
    connectToServer: function() {
        console.log('🔌 Connecting to server...');
        
        // Agar allaqachon ulangan bo'lsa
        if (this.socket && this.socket.connected) {
            console.log('✅ Already connected');
            return true;
        }
        
        // Server URL - LOCAL uchun
        const serverUrl = 'http://localhost:3000';
        
        console.log(`📡 Connecting to: ${serverUrl}`);
        
        try {
            // Socket.IO connection
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxConnectionAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                forceNew: true,
                query: {
                    clientType: 'web',
                    version: '1.0.0'
                }
            });
            
            console.log('✅ Socket created successfully');
            this.setupSocketEvents();
            
        } catch (error) {
            console.error('❌ Socket creation failed:', error);
            return false;
        }
        
        return true;
    },
    
    // ==================== SOCKET EVENT HANDLERS ====================
    setupSocketEvents: function() {
        if (!this.socket) {
            console.error('❌ Cannot setup events, socket is null');
            return;
        }
        
        console.log('🔧 Setting up socket events...');
        
        // ===== CONNECTION EVENTS =====
        this.socket.on('connect', () => {
            console.log('✅✅✅ SOCKET CONNECTED! ID:', this.socket.id);
            this.isConnected = true;
            window.gameState.isConnected = true;
            this.connectionAttempts = 0;
            
            // Auto authenticate
            this.authenticate();
            
            // Show notification
            window.utils?.showNotification('Ulandi', 'Serverga muvaffaqiyatli ulandi');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            this.isConnected = false;
            window.gameState.isConnected = false;
            
            this.connectionAttempts++;
            console.log(`Connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
            
            if (this.connectionAttempts >= this.maxConnectionAttempts) {
                console.error('❌ Max connection attempts reached');
                window.utils?.showNotification('Xato', 'Serverga ulanib boʻlmadi. Internetni tekshiring.');
            }
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected. Reason:', reason);
            this.isConnected = false;
            window.gameState.isConnected = false;
            
            if (reason === 'io server disconnect') {
                // Server tomonidan uzilgan, qayta ulanish
                console.log('🔄 Server disconnected, reconnecting...');
                this.socket.connect();
            }
        });
        
        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
            this.isConnected = true;
            window.gameState.isConnected = true;
            
            // Re-authenticate
            this.authenticate();
        });
        
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`🔄 Reconnection attempt ${attemptNumber}`);
        });
        
        this.socket.on('reconnect_failed', () => {
            console.error('❌ Reconnection failed');
            window.utils?.showNotification('Xato', 'Serverga qayta ulanib boʻlmadi');
        });
        
        // ===== AUTHENTICATION EVENTS =====
        this.socket.on('auth_ok', (data) => {
            console.log('✅ Authentication successful:', data);
            
            // Update user state
            Object.assign(window.userState, data);
            
            // Save to storage
            window.storage?.saveUserState();
            
            // Update UI
            window.uiManager?.updateUIFromUserState();
            window.uiManager?.updateUserProfile();
            
            console.log(`👤 Welcome ${data.firstName || data.name}!`);
        });
        
        this.socket.on('gender_selected', (data) => {
            console.log('🎯 Gender selected:', data);
            window.utils?.showNotification('Gender tanlandi', data.message);
        });
        
        // ===== QUEUE EVENTS =====
        this.socket.on('queue_joined', (data) => {
            console.log('📝 Queue joined:', data);
            window.gameState.isInQueue = true;
            window.gameState.isInDuel = false;
            
            // Update UI
            const queueStatus = document.getElementById('queueStatus');
            if (queueStatus) {
                queueStatus.textContent = `Navbatda: ${data.position}/${data.total}`;
                queueStatus.style.color = '#fff';
            }
            
            const waitingCount = document.getElementById('waitingCount');
            if (waitingCount) waitingCount.textContent = data.total;
        });
        
        this.socket.on('waiting_count', (data) => {
            console.log('👥 Waiting count update:', data);
            
            const queueStatus = document.getElementById('queueStatus');
            if (queueStatus) {
                queueStatus.textContent = `Navbatda: ${data.position || 1}/${data.total || 1}`;
            }
        });
        
        // ===== DUEL EVENTS =====
        this.socket.on('duel_started', (data) => {
            console.log('⚔️ Duel started:', data);
            
            // Update game state
            window.gameState.currentDuelId = data.duelId;
            window.gameState.currentOpponent = data.opponent;
            window.gameState.isInDuel = true;
            window.gameState.isInQueue = false;
            
            // Show duel screen
            window.uiManager?.showScreen?.('duel');
            window.uiManager?.updateOpponentInfo?.(data.opponent);
            
            // Start timer and enable buttons
            window.gameLogic?.startTimer?.();
            window.gameLogic?.enableVoteButtons?.();
        });
        
        this.socket.on('match_result', (data) => {
            console.log('🎉 MATCH RESULT:', data);
            window.gameLogic?.handleMatch?.(data);
        });
        
        this.socket.on('liked_only', (data) => {
            console.log('❤️ Liked only:', data);
            window.gameLogic?.handleLikedOnly?.(data);
        });
        
        this.socket.on('no_match', () => {
            console.log('❌ No match');
            window.gameLogic?.handleNoMatch?.();
        });
        
        this.socket.on('timeout', () => {
            console.log('⏰ Timeout');
            window.gameLogic?.handleTimeout?.();
        });
        
        this.socket.on('opponent_left', () => {
            console.log('🚪 Opponent left');
            window.utils?.showNotification('Raqib chiqib ketdi', 'Yangi duel boshlanadi');
            window.gameLogic?.proceedToNextDuel?.();
        });
        
        // ===== CHAT EVENTS =====
        this.socket.on('chat_invite', (data) => {
            console.log('💬 Chat invite:', data);
            window.gameLogic?.handleChatInvite?.(data);
        });
        
        this.socket.on('chat_accepted', (data) => {
            console.log('✅ Chat accepted:', data);
            window.utils?.showNotification('Chat', data.message || 'Chat qabul qilindi');
        });
        
        this.socket.on('chat_rejected', (data) => {
            console.log('❌ Chat rejected:', data);
            window.utils?.showNotification('Chat', data.message || 'Chat rad etildi');
        });
        
        // ===== FRIENDS EVENTS =====
        this.socket.on('friends_list', (data) => {
            console.log('👥 Friends list:', data);
            
            // Save friends to storage
            if (data.friends && Array.isArray(data.friends)) {
                window.storage?.saveFriendsList?.(data.friends);
                window.userState.friendsCount = data.count || 0;
                window.uiManager?.updateUIFromUserState?.();
                
                // Update friends list UI
                window.uiManager?.loadFriendsList?.();
            }
        });
        
        this.socket.on('friends_updated', (data) => {
            console.log('🔄 Friends updated:', data);
            
            // Update UI
            window.userState.friendsCount = data.count || 0;
            window.uiManager?.updateUIFromUserState?.();
            window.uiManager?.loadFriendsList?.();
        });
        
        // ===== ERROR HANDLING =====
        this.socket.on('error', (data) => {
            console.error('❌ Server error:', data);
            window.utils?.showNotification('Xato', data.message || 'Nomaʼlum xatolik');
        });
        
        this.socket.on('show_gender_selection', (data) => {
            console.log('🎯 Show gender selection:', data);
            window.modalManager?.showGenderModal?.(data.mandatory || false);
        });
        
        console.log('✅ Socket events setup complete');
    },
    
    // ==================== AUTHENTICATION ====================
    authenticate: function() {
        if (!this.socket || !this.socket.connected) {
            console.warn('⚠️ Cannot authenticate, socket not connected');
            return false;
        }
        
        console.log('🔐 Starting authentication...');
        
        // User data yaratish
        let userData = {
            userId: 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            firstName: 'User',
            username: 'user' + Math.floor(Math.random() * 1000),
            photoUrl: '',
            gender: window.userState.currentGender,
            hasSelectedGender: window.userState.hasSelectedGender,
            filter: window.userState.filter || 'all',
            rating: window.userState.rating || 1500,
            coins: window.userState.coins || 100,
            level: window.userState.level || 1,
            matches: window.userState.matches || 0,
            duels: window.userState.duels || 0,
            wins: window.userState.wins || 0,
            totalLikes: window.userState.totalLikes || 0
        };
        
        // Telegram ma'lumotlaridan foydalanish
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            console.log('📱 Telegram user found:', tgUser.first_name);
            
            userData = {
                userId: tgUser.id.toString(),
                firstName: tgUser.first_name || 'User',
                username: tgUser.username || ('user' + tgUser.id.toString().slice(-4)),
                photoUrl: tgUser.photo_url || '',
                gender: window.userState.currentGender,
                hasSelectedGender: window.userState.hasSelectedGender,
                filter: window.userState.filter || 'all',
                rating: window.userState.rating || 1500,
                coins: window.userState.coins || 100,
                level: window.userState.level || 1,
                matches: window.userState.matches || 0,
                duels: window.userState.duels || 0,
                wins: window.userState.wins || 0,
                totalLikes: window.userState.totalLikes || 0
            };
        }
        
        // Local storage dan ma'lumotlarni qo'shish
        const savedState = window.storage?.loadUserState?.();
        if (savedState) {
            Object.assign(userData, {
                coins: window.userState.coins,
                rating: window.userState.rating,
                matches: window.userState.matches,
                duels: window.userState.duels,
                wins: window.userState.wins,
                totalLikes: window.userState.totalLikes
            });
        }
        
        console.log('🔐 Sending auth data:', {
            userId: userData.userId,
            name: userData.firstName,
            gender: userData.gender
        });
        
        // Serverga auth yuborish
        this.socket.emit('auth', userData);
        
        return true;
    },
    
    // ==================== GAME ACTIONS ====================
    enterQueue: function() {
        if (!this.checkConnection()) return false;
        
        console.log('📝 Entering queue...');
        this.socket.emit('enter_queue');
        return true;
    },
    
    leaveQueue: function() {
        if (this.socket && this.socket.connected) {
            console.log('🚪 Leaving queue...');
            this.socket.emit('leave_queue');
            return true;
        }
        return false;
    },
    
    sendVote: function(duelId, choice) {
        if (!this.checkConnection() || !duelId) return false;
        
        console.log(`🗳️ Sending vote: ${choice} for duel ${duelId}`);
        this.socket.emit('vote', { duelId, choice });
        return true;
    },
    
    selectGender: function(gender) {
        if (!this.checkConnection()) return false;
        
        console.log(`🎯 Selecting gender: ${gender}`);
        this.socket.emit('select_gender', { gender });
        return true;
    },
    
    sendChatInvite: function(partnerId) {
        if (!this.checkConnection() || !partnerId) return false;
        
        console.log(`💬 Sending chat invite to: ${partnerId}`);
        this.socket.emit('send_chat_invite', { partnerId });
        return true;
    },
    
    acceptChatInvite: function(requestId) {
        if (!this.checkConnection() || !requestId) return false;
        
        console.log(`✅ Accepting chat invite: ${requestId}`);
        this.socket.emit('accept_chat_invite', { requestId });
        return true;
    },
    
    rejectChatInvite: function(requestId) {
        if (!this.checkConnection() || !requestId) return false;
        
        console.log(`❌ Rejecting chat invite: ${requestId}`);
        this.socket.emit('reject_chat_invite', { requestId });
        return true;
    },
    
    getFriendsList: function() {
        if (!this.checkConnection()) return false;
        
        console.log('👥 Requesting friends list...');
        this.socket.emit('get_friends_list');
        return true;
    },
    
    updateProfile: function(profileData) {
        if (!this.checkConnection()) return false;
        
        console.log('📝 Updating profile:', profileData);
        this.socket.emit('update_profile', profileData);
        return true;
    },
    
    // ==================== UTILITY FUNCTIONS ====================
    checkConnection: function() {
        if (!this.socket || !this.socket.connected) {
            console.warn('⚠️ Socket not connected');
            window.utils?.showNotification('Xato', 'Serverga ulanmagan');
            
            // Try to reconnect
            this.connectToServer();
            return false;
        }
        return true;
    },
    
    getConnectionStatus: function() {
        return {
            connected: this.isConnected,
            socketId: this.socket?.id,
            connectionAttempts: this.connectionAttempts
        };
    },
    
    disconnect: function() {
        if (this.socket) {
            console.log('🔌 Disconnecting socket...');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    },
    
    reconnect: function() {
        console.log('🔄 Manual reconnection...');
        this.disconnect();
        setTimeout(() => this.connectToServer(), 1000);
    }
};

// ==================== AUTO INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 socket.js loaded');
    
    // Wait a bit for other scripts
    setTimeout(function() {
        console.log('🔄 Auto-connecting socket...');
        
        // Check if socket already connected
        if (!window.socketManager?.socket?.connected) {
            window.socketManager.connectToServer();
        }
        
        // Setup debug commands
        window.debugSocket = function() {
            console.log('=== SOCKET DEBUG ===');
            console.log('Manager:', window.socketManager);
            console.log('Socket:', window.socketManager?.socket);
            console.log('Connected:', window.socketManager?.socket?.connected);
            console.log('Socket ID:', window.socketManager?.socket?.id);
            console.log('Game State:', window.gameState);
            console.log('===================');
        };
        
        window.testConnection = function() {
            console.log('🔍 Testing connection...');
            if (window.socketManager.socket) {
                window.socketManager.socket.emit('ping', { test: 'ping' });
                console.log('Ping sent');
            } else {
                console.log('No socket available');
            }
        };
        
        window.forceReconnect = function() {
            console.log('🔄 Force reconnecting...');
            window.socketManager.reconnect();
        };
        
        console.log('✅ Socket manager ready. Debug commands:');
        console.log('- debugSocket() - Socket holatini ko\'rish');
        console.log('- testConnection() - Connection test');
        console.log('- forceReconnect() - Qayta ulanish');
        
    }, 1500);
});

// ==================== GLOBAL ERROR HANDLING ====================
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

console.log('🔌 socket.js - FULL WORKING VERSION LOADED');