// stateManager.js faylini yarating
class GameStateManager {
    constructor() {
        this.state = {
            // Connection state
            socket: null,
            isConnected: false,
            isConnecting: false,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5,
            
            // Game flow
            isInQueue: false,
            isInDuel: false,
            isWaitingForOpponent: false,
            matchCompleted: false,
            
            // Current game
            currentDuelId: null,
            currentPartner: null,
            lastOpponent: null,
            timeLeft: 20,
            timerInterval: null,
            duelTimeout: null,
            
            // Chat state
            pendingChatInvite: null,
            waitingForChatResponse: false,
            chatResponseTimer: null,
            isVoiceChatActive: false,
            
            // UI state
            currentTab: 'duel',
            isChatModalOpen: false,
            isGenderModalOpen: false,
            
            // Stats
            gameStats: {
                totalDuels: parseInt(localStorage.getItem('totalDuels')) || 0,
                wins: parseInt(localStorage.getItem('wins')) || 0,
                losses: parseInt(localStorage.getItem('losses')) || 0,
                matches: parseInt(localStorage.getItem('matches')) || 0,
                winStreak: parseInt(localStorage.getItem('winStreak')) || 0,
                bestWinStreak: parseInt(localStorage.getItem('bestWinStreak')) || 0,
                lastPlayed: localStorage.getItem('lastPlayed') || null
            },
            
            // Filter
            currentFilter: localStorage.getItem('currentFilter') || 'not_specified',
            
            // Mutex flags
            isProcessing: false,
            skipToNextRequested: false,
            isTransitioning: false
        };
    }
    
    // State getter/setter methods
    setSocket(socket) {
        this.state.socket = socket;
        this.saveState();
    }
    
    setIsConnected(connected) {
        this.state.isConnected = connected;
        this.saveState();
    }
    
    setIsInQueue(inQueue) {
        this.state.isInQueue = inQueue;
        this.saveState();
        
        // Queue state change handlers
        if (inQueue) {
            this.state.isInDuel = false;
            this.state.matchCompleted = false;
            this.state.currentDuelId = null;
            this.clearTimers();
        }
    }
    
    setIsInDuel(inDuel, duelId = null) {
        this.state.isInDuel = inDuel;
        if (duelId) {
            this.state.currentDuelId = duelId;
        }
        this.saveState();
        
        if (inDuel) {
            this.state.isInQueue = false;
            this.state.matchCompleted = false;
        }
    }
    
    setCurrentPartner(partner) {
        this.state.currentPartner = partner;
        this.saveState();
    }
    
    setMatchCompleted(completed) {
        this.state.matchCompleted = completed;
        this.saveState();
    }
    
    // Timer management
    startTimer(duration = 20) {
        this.clearTimers();
        this.state.timeLeft = duration;
        
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            
            if (this.state.timeLeft <= 0) {
                this.handleTimeout();
            } else {
                this.updateTimerUI();
            }
        }, 1000);
        
        this.state.duelTimeout = setTimeout(() => {
            if (this.state.isInDuel && !this.state.matchCompleted) {
                this.handleTimeout();
            }
        }, duration * 1000 + 5000);
    }
    
    updateTimerUI() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = this.state.timeLeft;
            
            // Color coding
            if (this.state.timeLeft <= 5) {
                timerElement.style.color = '#e74c3c';
            } else if (this.state.timeLeft <= 10) {
                timerElement.style.color = '#f39c12';
            } else {
                timerElement.style.color = '#2ecc71';
            }
        }
    }
    
    handleTimeout() {
        this.clearTimers();
        
        if (this.state.isInDuel) {
            // Handle timeout logic
            if (window.gameLogic && window.gameLogic.handleTimeout) {
                window.gameLogic.handleTimeout();
            }
        }
    }
    
    clearTimers() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
        
        if (this.state.duelTimeout) {
            clearTimeout(this.state.duelTimeout);
            this.state.duelTimeout = null;
        }
        
        if (this.state.chatResponseTimer) {
            clearTimeout(this.state.chatResponseTimer);
            this.state.chatResponseTimer = null;
        }
    }
    
    // Game stats
    updateGameStats(result, data = null) {
        this.state.gameStats.totalDuels++;
        this.state.lastPlayed = new Date().toISOString();
        
        if (result === 'win' || result === 'match') {
            this.state.gameStats.wins++;
            this.state.gameStats.winStreak++;
            
            if (this.state.gameStats.winStreak > this.state.gameStats.bestWinStreak) {
                this.state.gameStats.bestWinStreak = this.state.gameStats.winStreak;
            }
            
            if (result === 'match') {
                this.state.gameStats.matches++;
            }
        } else {
            this.state.gameStats.losses++;
            this.state.gameStats.winStreak = 0;
        }
        
        this.saveStats();
        this.updateStatsUI();
    }
    
    updateStatsUI() {
        // Update all UI elements with current stats
        const elements = {
            totalDuels: document.getElementById('statDuels'),
            wins: document.getElementById('statWins'),
            matches: document.getElementById('statMatches'),
            winStreak: document.getElementById('statWinStreak')
        };
        
        for (const [key, element] of Object.entries(elements)) {
            if (element && this.state.gameStats[key] !== undefined) {
                element.textContent = this.state.gameStats[key];
            }
        }
        
        // Update win rate
        const winRateElement = document.getElementById('statWinRate');
        if (winRateElement && this.state.gameStats.totalDuels > 0) {
            const winRate = Math.round((this.state.gameStats.wins / this.state.gameStats.totalDuels) * 100);
            winRateElement.textContent = winRate + '%';
        }
    }
    
    // State persistence
    saveState() {
        try {
            // Save critical state to localStorage
            localStorage.setItem('gameState_lastTab', this.state.currentTab);
            localStorage.setItem('gameState_currentFilter', this.state.currentFilter);
            localStorage.setItem('gameState_lastPartner', JSON.stringify(this.state.currentPartner));
            
            // Save user preferences
            if (window.userState) {
                localStorage.setItem('userState', JSON.stringify(window.userState));
            }
        } catch (e) {
            console.error('State save error:', e);
        }
    }
    
    saveStats() {
        try {
            for (const [key, value] of Object.entries(this.state.gameStats)) {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.error('Stats save error:', e);
        }
    }
    
    loadState() {
        try {
            this.state.currentTab = localStorage.getItem('gameState_lastTab') || 'duel';
            this.state.currentFilter = localStorage.getItem('gameState_currentFilter') || 'not_specified';
            
            const lastPartner = localStorage.getItem('gameState_lastPartner');
            if (lastPartner) {
                this.state.currentPartner = JSON.parse(lastPartner);
            }
            
            // Load user state
            const savedUserState = localStorage.getItem('userState');
            if (savedUserState) {
                window.userState = { ...window.userState, ...JSON.parse(savedUserState) };
            }
            
            // Load stats
            this.loadStats();
            
        } catch (e) {
            console.error('State load error:', e);
        }
    }
    
    loadStats() {
        try {
            const stats = {};
            ['totalDuels', 'wins', 'losses', 'matches', 'winStreak', 'bestWinStreak', 'lastPlayed'].forEach(key => {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    stats[key] = isNaN(value) ? value : parseInt(value);
                }
            });
            
            this.state.gameStats = { ...this.state.gameStats, ...stats };
        } catch (e) {
            console.error('Stats load error:', e);
        }
    }
    
    // State validation and cleanup
    validateState() {
        // Clear invalid states
        if (this.state.isInDuel && !this.state.currentDuelId) {
            this.state.isInDuel = false;
        }
        
        if (this.state.matchCompleted && !this.state.currentPartner) {
            this.state.matchCompleted = false;
        }
        
        // Reset processing flags
        this.state.isProcessing = false;
        this.state.skipToNextRequested = false;
        this.state.isTransitioning = false;
    }
    
    // State transitions
    transitionToQueue() {
        if (this.state.isTransitioning) return false;
        
        this.state.isTransitioning = true;
        this.state.isInQueue = true;
        this.state.isInDuel = false;
        this.state.matchCompleted = false;
        this.state.currentDuelId = null;
        this.clearTimers();
        
        setTimeout(() => {
            this.state.isTransitioning = false;
        }, 500);
        
        return true;
    }
    
    transitionToDuel(duelId) {
        if (this.state.isTransitioning) return false;
        
        this.state.isTransitioning = true;
        this.state.isInQueue = false;
        this.state.isInDuel = true;
        this.state.matchCompleted = false;
        this.state.currentDuelId = duelId;
        
        setTimeout(() => {
            this.state.isTransitioning = false;
        }, 500);
        
        return true;
    }
    
    transitionToMatch(partner) {
        if (this.state.isTransitioning) return false;
        
        this.state.isTransitioning = true;
        this.state.isInDuel = false;
        this.state.matchCompleted = true;
        this.state.currentPartner = partner;
        this.clearTimers();
        
        setTimeout(() => {
            this.state.isTransitioning = false;
        }, 500);
        
        return true;
    }
    
    // Helper methods
    isBusy() {
        return this.state.isProcessing || 
               this.state.isTransitioning || 
               this.state.skipToNextRequested;
    }
    
    getState() {
        return { ...this.state };
    }
    
    reset() {
        this.state.isInQueue = false;
        this.state.isInDuel = false;
        this.state.isWaitingForOpponent = false;
        this.state.matchCompleted = false;
        this.state.currentDuelId = null;
        this.state.skipToNextRequested = false;
        this.clearTimers();
    }
}

window.gameStateManager = new GameStateManager();