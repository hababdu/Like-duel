// public/gameLogic.js - FULL WORKING GAME LOGIC
window.gameLogic = {
    
    // ==================== INITIALIZATION ====================
    initGameLogic: function() {
        console.log('🎮 Game Logic initializing...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup socket events
        this.setupSocketEvents();
        
        // Initialize game state
        this.initGameState();
        
        console.log('✅ Game Logic initialized');
    },
    
    initGameState: function() {
        if (!window.gameState) {
            window.gameState = {
                isConnected: false,
                isInQueue: false,
                isInDuel: false,
                currentDuelId: null,
                currentOpponent: null,
                currentPartner: null,
                timeLeft: 20,
                timerInterval: null,
                matchActionTimer: null,
                pendingChatInvite: null
            };
        }
    },
    
    // ==================== EVENT LISTENERS ====================
    setupEventListeners: function() {
        console.log('🔧 Setting up event listeners...');
        
        // Start button - DIRECT FIX
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            console.log('✅ Found start button');
            
            // Remove existing listeners
            const newBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newBtn, startBtn);
            
            // Add new listener
            document.getElementById('startBtn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎮 Start button CLICKED!');
                this.startDuelFlow();
            });
        } else {
            console.error('❌ Start button NOT FOUND!');
        }
        
        // Vote buttons
        this.setupVoteButtons();
        
        // Leave queue button
        const leaveBtn = document.getElementById('leaveQueueBtn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                console.log('🚪 Leaving queue...');
                window.socketManager?.socket?.emit('leave_queue');
                window.uiManager?.showScreen('welcome');
            });
        }
        
        console.log('✅ Event listeners setup complete');
    },
    
    setupVoteButtons: function() {
        const buttons = {
            'noBtn': 'skip',
            'likeBtn': 'like', 
            'superLikeBtn': 'super_like'
        };
        
        Object.entries(buttons).forEach(([btnId, choice]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    console.log(`🗳️ Vote: ${choice}`);
                    this.handleVote(choice);
                });
            }
        });
    },
    
    // ==================== SOCKET EVENTS ====================
    setupSocketEvents: function() {
        const socket = window.socketManager?.socket;
        if (!socket) {
            console.warn('⚠️ Socket not available, will setup later');
            return;
        }
        
        console.log('🔌 Setting up socket events...');
        
        // CONNECTION
        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            window.gameState.isConnected = true;
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            window.gameState.isConnected = false;
        });
        
        // AUTH
        socket.on('auth_ok', (data) => {
            console.log('✅ Auth successful:', data.name);
            
            // Update user state
            Object.assign(window.userState, data);
            window.storage?.saveUserState();
            
            // Update UI
            window.uiManager?.updateUIFromUserState();
        });
        
        // GENDER
        socket.on('gender_selected', (data) => {
            console.log('🎯 Gender selected:', data);
            window.utils?.showNotification('Gender tanlandi', data.message);
        });
        
        // QUEUE
        socket.on('queue_joined', (data) => {
            console.log('📝 Queue joined:', data);
            window.gameState.isInQueue = true;
            
            // Update queue UI
            const queueStatus = document.getElementById('queueStatus');
            if (queueStatus) {
                queueStatus.textContent = `Navbatda: ${data.position}/${data.total}`;
            }
        });
        
        // DUEL STARTED
        socket.on('duel_started', (data) => {
            console.log('⚔️ Duel started:', data);
            this.handleDuelStart(data);
        });
        
        // MATCH RESULT
        socket.on('match_result', (data) => {
            console.log('🎉 Match result:', data);
            this.handleMatch(data);
        });
        
        // LIKED ONLY
        socket.on('liked_only', (data) => {
            console.log('❤️ Liked only:', data);
            this.handleLikedOnly(data);
        });
        
        // NO MATCH
        socket.on('no_match', () => {
            console.log('❌ No match');
            this.handleNoMatch();
        });
        
        // TIMEOUT
        socket.on('timeout', () => {
            console.log('⏰ Timeout');
            this.handleTimeout();
        });
        
        console.log('✅ Socket events setup complete');
    },
    
    // ==================== DUEL FLOW ====================
    startDuelFlow: function() {
        console.log('🚀 Starting duel flow...');
        
        // Check gender
        if (!window.userState.hasSelectedGender) {
            console.log('⚠️ Gender not selected');
            window.utils?.showNotification('Diqqat', 'Avval gender tanlang!');
            window.modalManager?.showGenderModal(true);
            return;
        }
        
        // Check socket connection
        if (!window.socketManager?.socket?.connected) {
            console.log('⚠️ Socket not connected, trying to connect...');
            window.socketManager?.connectToServer();
            
            // Wait for connection
            setTimeout(() => {
                if (window.socketManager?.socket?.connected) {
                    this.startDuelFlow(); // Retry
                } else {
                    window.utils?.showNotification('Xato', 'Serverga ulanib boʻlmadi');
                }
            }, 1000);
            return;
        }
        
        console.log('✅ All checks passed, starting duel...');
        
        // Show queue screen
        this.showQueueScreen();
        
        // Enter queue
        window.socketManager.socket.emit('enter_queue');
    },
    
    showQueueScreen: function() {
        const queueScreen = document.getElementById('queueScreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        const duelScreen = document.getElementById('duelScreen');
        
        // Hide other screens
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (duelScreen) duelScreen.classList.add('hidden');
        
        // Show queue screen
        if (queueScreen) {
            queueScreen.classList.remove('hidden');
            queueScreen.style.display = 'block';
            
            // Update status
            const queueStatus = document.getElementById('queueStatus');
            if (queueStatus) {
                queueStatus.textContent = 'Raqib izlanmoqda...';
                queueStatus.style.color = '#fff';
            }
        }
    },
    
    handleDuelStart: function(data) {
        console.log('⚔️ Handling duel start...');
        
        // Update game state
        window.gameState.currentDuelId = data.duelId;
        window.gameState.currentOpponent = data.opponent;
        window.gameState.isInDuel = true;
        window.gameState.isInQueue = false;
        
        // Show duel screen
        window.uiManager?.showScreen('duel');
        window.uiManager?.updateOpponentInfo(data.opponent);
        
        // Start timer
        this.startTimer();
        this.enableVoteButtons();
        
        // Update status
        window.uiManager?.updateDuelStatus?.('Raqibingizni baholang...');
    },
    
    // ==================== VOTE HANDLING ====================
    handleVote: function(choice) {
        console.log(`🗳️ Handling vote: ${choice}`);
        
        if (!window.gameState.currentDuelId) {
            window.utils?.showNotification('Xato', 'Duel mavjud emas');
            return;
        }
        
        // Disable buttons
        this.disableVoteButtons();
        
        // Update status
        window.uiManager?.updateDuelStatus?.(`Siz ${this.getChoiceText(choice)} berdingiz...`);
        
        // Send vote to server
        if (window.socketManager?.socket?.connected) {
            window.socketManager.socket.emit('vote', {
                duelId: window.gameState.currentDuelId,
                choice: choice
            });
            console.log(`✅ Vote sent: ${choice}`);
        } else {
            console.error('❌ Cannot send vote, socket not connected');
            this.enableVoteButtons();
        }
    },
    
    getChoiceText: function(choice) {
        const texts = {
            'skip': '✖ SKIP',
            'like': '❤️ LIKE', 
            'super_like': '💖 SUPER LIKE'
        };
        return texts[choice] || choice;
    },
    
    disableVoteButtons: function() {
        ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
    },
    
    enableVoteButtons: function() {
        ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        });
    },
    
    // ==================== MATCH HANDLING ====================
    handleMatch: function(data) {
        console.log('🎉 Handling match...', data);
        
        this.stopAllTimers();
        this.hideDuelUI();
        
        // Save partner
        window.gameState.currentPartner = data.partner;
        window.gameState.matchCompleted = true;
        
        // Update user stats
        window.userState.coins += data.coinsEarned || 50;
        window.userState.rating = data.newRating || window.userState.rating;
        window.userState.matches++;
        
        // Save to storage
        window.storage?.saveUserState();
        window.uiManager?.updateUIFromUserState();
        
        // Show match celebration
        this.showMatchCelebration(data);
    },
    
    showMatchCelebration: function(data) {
        const duelScreen = document.getElementById('duelScreen');
        if (!duelScreen) return;
        
        const partner = data.partner;
        
        duelScreen.innerHTML = `
            <div class="match-celebration" >
                <div >🎉</div>
                <h2 >MATCH!</h2>
                
                <img src="${partner.photo}" alt="${partner.name}" 
                     >
                
                <h3>${partner.name}</h3>
                <p>@${partner.username}</p>
                
                <div >
                    <div >
                        <div>
                            <i></i>
                            <div>+${data.coinsEarned || 50}</div>
                            <div >Tanga</div>
                        </div>
                        <div>
                            <i ></i>
                            <div >+${data.ratingChange || 25}</div>
                            <div >Reyting</div>
                        </div>
                    </div>
                </div>
                
                <div >
                    <button id="nextDuelBtn" class="btn-primary" >
                        Keyingi Duel
                    </button>
                </div>
                
                <p >
                    ${partner.name} bilan o'zaro match!
                </p>
            </div>
        `;
        
        // Add event listener
        document.getElementById('nextDuelBtn')?.addEventListener('click', () => {
            this.proceedToNextDuel();
        });
        
        // Confetti
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    },
    
    handleLikedOnly: function(data) {
        this.stopAllTimers();
        this.hideDuelUI();
        
        window.utils?.showNotification('Like berdingiz', 
            data.opponentName ? `${data.opponentName} like bermadi` : 'Javob qaytmadi');
        
        // Add coins
        if (data.coins) {
            window.userState.coins += data.coins;
            window.storage?.saveUserState();
            window.uiManager?.updateUIFromUserState();
        }
        
        setTimeout(() => this.proceedToNextDuel(), 3000);
    },
    
    handleNoMatch: function() {
        this.stopAllTimers();
        this.hideDuelUI();
        
        window.utils?.showNotification('Match boʻlmadi', 'Hech kim like bermadi');
        
        setTimeout(() => this.proceedToNextDuel(), 3000);
    },
    
    handleTimeout: function() {
        this.stopAllTimers();
        this.hideDuelUI();
        
        window.utils?.showNotification('Vaqt tugadi', 'Javob berish vaqti oʻtdi');
        
        setTimeout(() => this.proceedToNextDuel(), 3000);
    },
    
    // ==================== TIMER ====================
    startTimer: function() {
        this.stopAllTimers();
        
        window.gameState.timeLeft = 20;
        const timerEl = document.getElementById('timer');
        if (!timerEl) return;
        
        timerEl.textContent = '20';
        timerEl.style.color = '#2ecc71';
        
        window.gameState.timerInterval = setInterval(() => {
            window.gameState.timeLeft--;
            timerEl.textContent = window.gameState.timeLeft;
            
            if (window.gameState.timeLeft <= 10) {
                timerEl.style.color = '#e74c3c';
            } else if (window.gameState.timeLeft <= 15) {
                timerEl.style.color = '#f39c12';
            }
            
            if (window.gameState.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    },
    
    stopAllTimers: function() {
        if (window.gameState.timerInterval) {
            clearInterval(window.gameState.timerInterval);
            window.gameState.timerInterval = null;
        }
        if (window.gameState.matchActionTimer) {
            clearInterval(window.gameState.matchActionTimer);
            window.gameState.matchActionTimer = null;
        }
    },
    
    // ==================== UI HELPERS ====================
    hideDuelUI: function() {
        const voteButtons = document.getElementById('voteButtons');
        const timer = document.getElementById('timer');
        
        if (voteButtons) voteButtons.style.display = 'none';
        if (timer) timer.style.display = 'none';
    },
    
    proceedToNextDuel: function() {
        console.log('🔄 Proceeding to next duel...');
        
        this.stopAllTimers();
        
        // Reset state
        window.gameState.currentDuelId = null;
        window.gameState.currentOpponent = null;
        window.gameState.isInDuel = false;
        window.gameState.isInQueue = false;
        window.gameState.matchCompleted = false;
        
        // Show queue screen
        this.showQueueScreen();
        
        // Re-enter queue
        if (window.socketManager?.socket?.connected) {
            setTimeout(() => {
                window.socketManager.socket.emit('enter_queue');
            }, 1000);
        }
    }
};

// Auto initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 gameLogic.js loaded');
    
    // Wait for other scripts
    setTimeout(function() {
        if (window.gameLogic) {
            window.gameLogic.initGameLogic();
            console.log('✅ gameLogic initialized');
        } else {
            console.error('❌ gameLogic not found');
        }
    }, 1000);
});