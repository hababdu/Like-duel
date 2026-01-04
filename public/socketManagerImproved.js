// socketManagerImproved.js faylini yarating
class ImprovedSocketManager {
    constructor() {
        this.socket = null;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.heartbeatInterval = 30000; // 30 seconds
        this.lastHeartbeat = Date.now();
        this.connectionTimeout = 10000; // 10 seconds
        this.pendingMessages = [];
        this.connectionId = null;
        this.userId = null;
    }
    
    async connectToServer() {
        console.log('🔌 Improved socket connection attempt');
        
        // Prevent multiple connections
        if (this.isConnecting) {
            console.log('⚠️ Already connecting, skipping');
            return false;
        }
        
        if (this.socket?.connected) {
            console.log('✅ Already connected');
            return true;
        }
        
        this.isConnecting = true;
        
        try {
            // Connection timeout
            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, this.connectionTimeout);
                
                // Create socket connection
                const serverUrl = 'wss://your-socket-server.com';
                this.socket = io(serverUrl, {
                    transports: ['websocket'],
                    reconnection: false,
                    timeout: this.connectionTimeout,
                    query: {
                        userId: window.userState?.id || window.tgUserGlobal?.id,
                        gender: window.userState?.currentGender,
                        filter: window.userState?.filter,
                        version: '1.0.0'
                    }
                });
                
                // Setup event listeners
                this.setupEventListeners();
                
                // On connect
                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    console.log('✅ Socket connected successfully');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.connectionId = this.socket.id;
                    
                    // Send auth
                    this.sendAuth();
                    
                    // Start heartbeat
                    this.startHeartbeat();
                    
                    resolve(true);
                });
                
                // On connect error
                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error('❌ Socket connection error:', error);
                    this.isConnecting = false;
                    reject(error);
                });
            });
            
            const connected = await connectionPromise;
            
            // Update game state
            if (window.gameStateManager) {
                window.gameStateManager.setSocket(this.socket);
                window.gameStateManager.setIsConnected(true);
            }
            
            // Process pending messages
            this.processPendingMessages();
            
            return connected;
            
        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.isConnecting = false;
            this.reconnectAttempts++;
            
            // Attempt reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                console.log(`🔄 Reconnecting attempt ${this.reconnectAttempts}...`);
                
                setTimeout(() => {
                    this.connectToServer();
                }, this.reconnectDelay * this.reconnectAttempts);
            } else {
                console.error('❌ Max reconnection attempts reached');
                window.showNotification?.('Xato', 'Serverga ulanib bo\'lmadi');
            }
            
            return false;
        }
    }
    
    setupEventListeners() {
        if (!this.socket) return;
        
        // Connection events
        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            
            if (window.gameStateManager) {
                window.gameStateManager.setIsConnected(false);
            }
            
            // Stop heartbeat
            this.stopHeartbeat();
            
            // Attempt reconnect if not explicitly disconnected
            if (reason !== 'io client disconnect') {
                this.attemptReconnect();
            }
        });
        
        this.socket.on('reconnect', (attempt) => {
            console.log(`🔄 Reconnected after ${attempt} attempts`);
            
            if (window.gameStateManager) {
                window.gameStateManager.setIsConnected(true);
            }
            
            // Resend auth
            this.sendAuth();
            
            // Re-enter queue if was in queue
            if (window.gameStateManager?.getState().isInQueue) {
                this.enterQueue();
            }
        });
        
        // Game events
        this.socket.on('duel_start', (data) => {
            console.log('⚔️ Duel started:', data);
            
            if (window.improvedGameLogic) {
                window.improvedGameLogic.initializeDuel(data);
            } else if (window.gameLogic) {
                window.gameLogic.initializeDuel?.(data);
            }
        });
        
        this.socket.on('match', (data) => {
            console.log('🎉 Match event:', data);
            
            if (window.improvedGameLogic) {
                window.improvedGameLogic.handleMatch(data);
            } else if (window.gameLogic) {
                window.gameLogic.handleMatch?.(data);
            }
        });
        
        this.socket.on('liked_only', (data) => {
            console.log('❤️ Liked only:', data);
            
            if (window.improvedGameLogic) {
                window.improvedGameLogic.handleLikedOnly?.(data);
            } else if (window.gameLogic) {
                window.gameLogic.handleLikedOnly?.(data);
            }
        });
        
        this.socket.on('no_match', (data) => {
            console.log('❌ No match:', data);
            
            if (window.improvedGameLogic) {
                window.improvedGameLogic.handleNoMatch?.(data);
            } else if (window.gameLogic) {
                window.gameLogic.handleNoMatch?.(data);
            }
        });
        
        this.socket.on('timeout', (data) => {
            console.log('⏰ Timeout:', data);
            
            if (window.improvedGameLogic) {
                window.improvedGameLogic.handleTimeout?.(data);
            } else if (window.gameLogic) {
                window.gameLogic.handleTimeout?.(data);
            }
        });
        
        // Queue events
        this.socket.on('queue_update', (data) => {
            console.log('📊 Queue update:', data);
            this.handleQueueUpdate(data);
        });
        
        this.socket.on('queue_position', (data) => {
            console.log('🎯 Queue position:', data);
            this.handleQueuePosition(data);
        });
        
        // Chat events
        this.socket.on('chat_invite', (data) => {
            console.log('💬 Chat invite received:', data);
            
            if (window.gameLogic) {
                window.gameLogic.handleChatInvite?.(data);
            }
        });
        
        this.socket.on('chat_accepted', (data) => {
            console.log('✅ Chat accepted:', data);
            
            if (window.gameLogic) {
                window.gameLogic.handleChatAccepted?.(data);
            }
        });
        
        this.socket.on('chat_rejected', (data) => {
            console.log('❌ Chat rejected:', data);
            
            if (window.gameLogic) {
                window.gameLogic.handleChatRejected?.(data);
            }
        });
        
        // Voice chat events
        this.socket.on('voice_chat_invite', (data) => {
            console.log('🎤 Voice chat invite:', data);
            this.handleVoiceChatInvite(data);
        });
        
        this.socket.on('voice_chat_accepted', (data) => {
            console.log('✅ Voice chat accepted:', data);
            this.handleVoiceChatAccepted(data);
        });
        
        // Error events
        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            this.handleSocketError(error);
        });
        
        this.socket.on('auth_error', (error) => {
            console.error('❌ Auth error:', error);
            this.handleAuthError(error);
        });
    }
    
    // Queue management
    async enterQueue() {
        if (!this.isConnected()) {
            console.error('❌ Not connected, cannot enter queue');
            return false;
        }
        
        try {
            console.log('🎮 Entering queue...');
            
            // Update game state
            if (window.gameStateManager) {
                window.gameStateManager.transitionToQueue();
            }
            
            // Send queue request
            this.socket.emit('enter_queue', {
                userId: this.userId,
                gender: window.userState.currentGender,
                filter: window.userState.filter,
                rating: window.userState.rating
            });
            
            // Show queue screen
            window.showScreen?.('queue');
            window.updateQueueStatus?.('Duel sherigi izlanmoqda...');
            
            return true;
            
        } catch (error) {
            console.error('❌ Enter queue error:', error);
            return false;
        }
    }
    
    async leaveQueue() {
        if (!this.isConnected()) {
            return false;
        }
        
        try {
            console.log('🚪 Leaving queue...');
            
            this.socket.emit('leave_queue');
            
            // Update game state
            if (window.gameStateManager) {
                window.gameStateManager.reset();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Leave queue error:', error);
            return false;
        }
    }
    
    // Vote handling
    async sendVote(duelId, choice) {
        if (!this.isConnected()) {
            console.error('❌ Not connected, queueing vote');
            this.queueMessage('sendVote', { duelId, choice });
            return false;
        }
        
        try {
            console.log(`🗳️ Sending vote: ${choice} for duel ${duelId}`);
            
            const voteData = {
                duelId,
                choice,
                timestamp: Date.now(),
                userId: this.userId
            };
            
            this.socket.emit('vote', voteData);
            
            return true;
            
        } catch (error) {
            console.error('❌ Send vote error:', error);
            return false;
        }
    }
    
    // Chat management
    async sendChatInvite(partnerId) {
        if (!this.isConnected()) {
            return false;
        }
        
        try {
            console.log(`💬 Sending chat invite to ${partnerId}`);
            
            this.socket.emit('chat_invite', {
                partnerId,
                userId: this.userId,
                timestamp: Date.now()
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Send chat invite error:', error);
            return false;
        }
    }
    
    async acceptChatInvite(requestId) {
        if (!this.isConnected()) {
            return false;
        }
        
        try {
            console.log(`✅ Accepting chat invite ${requestId}`);
            
            this.socket.emit('accept_chat_invite', {
                requestId,
                userId: this.userId
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Accept chat invite error:', error);
            return false;
        }
    }
    
    async rejectChatInvite(requestId) {
        if (!this.isConnected()) {
            return false;
        }
        
        try {
            console.log(`❌ Rejecting chat invite ${requestId}`);
            
            this.socket.emit('reject_chat_invite', {
                requestId,
                userId: this.userId
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Reject chat invite error:', error);
            return false;
        }
    }
    
    // Voice chat
    async sendVoiceChatInvite(partnerId) {
        if (!this.isConnected()) {
            return false;
        }
        
        try {
            console.log(`🎤 Sending voice chat invite to ${partnerId}`);
            
            this.socket.emit('voice_chat_invite', {
                partnerId,
                userId: this.userId,
                timestamp: Date.now()
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Send voice chat invite error:', error);
            return false;
        }
    }
    
    // Utility methods
    isConnected() {
        return this.socket?.connected || false;
    }
    
    sendAuth() {
        if (!this.socket) return;
        
        const authData = {
            userId: window.userState?.id || window.tgUserGlobal?.id,
            username: window.tgUserGlobal?.username,
            name: window.tgUserGlobal?.first_name,
            photo: window.tgUserGlobal?.photo_url,
            gender: window.userState.currentGender,
            filter: window.userState.filter,
            rating: window.userState.rating,
            level: window.userState.level
        };
        
        this.socket.emit('authenticate', authData);
        this.userId = authData.userId;
    }
    
    startHeartbeat() {
        this.heartbeatIntervalId = setInterval(() => {
            if (this.isConnected()) {
                this.socket.emit('heartbeat', {
                    timestamp: Date.now(),
                    userId: this.userId
                });
                this.lastHeartbeat = Date.now();
            }
        }, this.heartbeatInterval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatIntervalId) {
            clearInterval(this.heartbeatIntervalId);
            this.heartbeatIntervalId = null;
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
            
            console.log(`🔄 Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                this.connectToServer();
            }, delay);
        }
    }
    
    queueMessage(method, data) {
        this.pendingMessages.push({ method, data, timestamp: Date.now() });
        
        // Clean old messages (older than 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        this.pendingMessages = this.pendingMessages.filter(
            msg => msg.timestamp > fiveMinutesAgo
        );
    }
    
    processPendingMessages() {
        if (this.pendingMessages.length === 0) return;
        
        console.log(`🔄 Processing ${this.pendingMessages.length} pending messages`);
        
        this.pendingMessages.forEach(msg => {
            if (this[msg.method]) {
                this[msg.method](...Object.values(msg.data));
            }
        });
        
        this.pendingMessages = [];
    }
    
    // Event handlers
    handleQueueUpdate(data) {
        if (window.elements?.waitingCount) {
            window.elements.waitingCount.textContent = data.waiting || 0;
        }
    }
    
    handleQueuePosition(data) {
        if (window.elements?.position) {
            window.elements.position.textContent = data.position || '-';
        }
        
        if (window.elements?.positionInfo) {
            window.elements.positionInfo.style.display = 'block';
        }
    }
    
    handleVoiceChatInvite(data) {
        if (window.enhancedChatSystem) {
            window.enhancedChatSystem.showVoiceChatInviteModal(data);
        }
    }
    
    handleVoiceChatAccepted(data) {
        if (window.enhancedChatSystem) {
            window.enhancedChatSystem.initVoiceChat(false);
        }
    }
    
    handleSocketError(error) {
        console.error('Socket error:', error);
        
        // Show user-friendly error
        const errorMessages = {
            'duplicate_session': 'Siz allaqachon boshqa qurilmadan ulangansiz',
            'invalid_auth': 'Autentifikatsiya xatosi',
            'server_error': 'Server xatosi',
            'rate_limit': 'Ko\'p urinishlar, biroz kuting'
        };
        
        const message = errorMessages[error.code] || 'Server bilan aloqa xatosi';
        window.showNotification?.('Xato', message);
    }
    
    handleAuthError(error) {
        console.error('Auth error:', error);
        
        // Clear invalid auth data
        localStorage.removeItem('userState');
        
        // Reload or redirect to auth
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    // Cleanup
    disconnect() {
        console.log('🔌 Disconnecting socket');
        
        this.stopHeartbeat();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        if (window.gameStateManager) {
            window.gameStateManager.setIsConnected(false);
        }
    }
}

window.improvedSocketManager = new ImprovedSocketManager();