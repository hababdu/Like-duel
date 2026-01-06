// public/socket.js - SOCKET MANAGER WITH QUEUE FIX
window.socketManager = {
    socket: null,
    isConnected: false,
    
    connectToServer: function() {
        const serverUrl = 'http://localhost:3000'; // Local server
        console.log(`🔌 Connecting to server: ${serverUrl}`);
        
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });
        
        // Connection events
        this.socket.on('connect', () => {
            console.log('✅ Connected to server, socket ID:', this.socket.id);
            this.isConnected = true;
            window.gameState.isConnected = true;
            
            // Send authentication
            this.authenticate();
            
            window.utils?.showNotification('Ulandi', 'Serverga muvaffaqiyatli ulandi');
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
            this.isConnected = false;
            window.gameState.isConnected = false;
            
            if (reason === 'io server disconnect') {
                // Server disconnect qilgan, qayta ulanamiz
                this.socket.connect();
            }
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            window.utils?.showNotification('Ulanish xatosi', 'Serverga ulanib boʻlmadi');
        });
        
        // Queue events
        this.socket.on('queue_joined', (data) => {
            console.log('📝 Queue joined:', data);
            window.gameState.isInQueue = true;
            
            // Update UI
            const queueStatus = document.getElementById('queueStatus');
            if (queueStatus) {
                queueStatus.textContent = `Navbatda: ${data.position}/${data.total}`;
            }
            
            const waitingCount = document.getElementById('waitingCount');
            if (waitingCount) waitingCount.textContent = data.total;
        });
        
        this.socket.on('waiting_count', (data) => {
            console.log('👥 Waiting count:', data);
            
            const queueStatus = document.getElementById('queueStatus');
            if (queueStatus) {
                queueStatus.textContent = `Navbatda: ${data.position}/${data.total}`;
            }
        });
        
        // Duel events
        this.socket.on('duel_started', (data) => {
            console.log('⚔️ Duel started:', data);
            this.handleDuelStart(data);
        });
        
        // Auth success
        this.socket.on('auth_ok', (data) => {
            console.log('✅ Auth successful:', data.firstName);
            
            // Update user state
            Object.assign(window.userState, data);
            window.storage?.saveUserState();
            
            // Update UI
            window.uiManager?.updateUIFromUserState();
            window.uiManager?.updateUserProfile();
        });
        
        // Gender selected
        this.socket.on('gender_selected', (data) => {
            console.log('🎯 Gender selected:', data);
            window.utils?.showNotification('Gender tanlandi', data.message);
        });
    },
    
    authenticate: function() {
        if (!this.socket || !this.socket.connected) {
            console.warn('❌ Cannot authenticate, socket not connected');
            return;
        }
        
        let userData = {
            userId: 'test_user_' + Date.now(), // Fallback ID
            firstName: 'Test User',
            username: 'testuser',
            photoUrl: '',
            gender: window.userState.currentGender,
            hasSelectedGender: window.userState.hasSelectedGender,
            filter: window.userState.filter,
            rating: window.userState.rating,
            coins: window.userState.coins,
            matches: window.userState.matches,
            duels: window.userState.duels,
            wins: window.userState.wins
        };
        
        // Use Telegram data if available
        if (window.tgUser) {
            userData = {
                userId: window.tgUser.id.toString(),
                firstName: window.tgUser.first_name || 'User',
                username: window.tgUser.username || '',
                photoUrl: window.tgUser.photo_url || '',
                gender: window.userState.currentGender,
                hasSelectedGender: window.userState.hasSelectedGender,
                filter: window.userState.filter,
                rating: window.userState.rating,
                coins: window.userState.coins,
                matches: window.userState.matches,
                duels: window.userState.duels,
                wins: window.userState.wins
            };
        }
        
        console.log('🔐 Authenticating:', userData.userId);
        this.socket.emit('auth', userData);
    },
    
    handleDuelStart: function(data) {
        window.gameState.currentDuelId = data.duelId;
        window.gameState.currentOpponent = data.opponent;
        window.gameState.isInDuel = true;
        window.gameState.isInQueue = false;
        
        // Show duel screen
        window.uiManager?.showScreen('duel');
        window.uiManager?.updateOpponentInfo(data.opponent);
        
        // Start timer
        window.gameLogic?.startTimer?.();
        window.gameLogic?.enableVoteButtons?.();
    },
    
    // Queue functions
    enterQueue: function() {
        if (this.socket && this.socket.connected) {
            console.log('📝 Entering queue...');
            this.socket.emit('enter_queue');
            return true;
        }
        console.warn('❌ Cannot enter queue, socket not connected');
        return false;
    },
    
    leaveQueue: function() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('leave_queue');
        }
    },
    
    sendVote: function(duelId, choice) {
        if (this.socket && this.socket.connected && duelId) {
            this.socket.emit('vote', { duelId, choice });
            return true;
        }
        return false;
    }
};

// Auto connect
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔌 Socket manager loading...');
    
    setTimeout(function() {
        if (!window.socketManager.socket || !window.socketManager.isConnected) {
            console.log('🔄 Auto-connecting socket...');
            window.socketManager.connectToServer();
        }
    }, 1500);
});