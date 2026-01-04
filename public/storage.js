// ==================== STORAGE MANAGEMENT ====================

const StorageManager = {
    // ==================== USER STATE ====================
    
    /**
     * Save user state to localStorage
     */
    saveUserState: function() {
        try {
            if (!window.userState) {
                console.warn('No userState to save');
                return;
            }
            
            localStorage.setItem('userState', JSON.stringify(window.userState));
            console.log('✅ User state saved');
        } catch (error) {
            console.error('❌ Error saving user state:', error);
        }
    },
    
    /**
     * Load user state from localStorage
     */
    loadUserState: function() {
        try {
            const saved = localStorage.getItem('userState');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (window.userState) {
                    Object.assign(window.userState, parsed);
                } else {
                    window.userState = parsed;
                }
                console.log('✅ User state loaded');
            } else {
                console.log('ℹ️ No saved user state found');
            }
        } catch (error) {
            console.error('❌ Error loading user state:', error);
        }
    },
    
    /**
     * Clear user state
     */
    clearUserState: function() {
        try {
            localStorage.removeItem('userState');
            console.log('✅ User state cleared');
        } catch (error) {
            console.error('❌ Error clearing user state:', error);
        }
    },
    
    // ==================== GAME STATE ====================
    
    /**
     * Save game state to localStorage
     */
    saveGameState: function() {
        try {
            if (!window.gameState) {
                console.warn('No gameState to save');
                return;
            }
            
            // Don't save socket connection data
            const gameStateToSave = {...window.gameState};
            delete gameStateToSave.socket;
            delete gameStateToSave.timerInterval;
            delete gameStateToSave.waitingTimerInterval;
            
            localStorage.setItem('gameState', JSON.stringify(gameStateToSave));
            console.log('✅ Game state saved');
        } catch (error) {
            console.error('❌ Error saving game state:', error);
        }
    },
    
    /**
     * Load game state from localStorage
     */
    loadGameState: function() {
        try {
            const saved = localStorage.getItem('gameState');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (window.gameState) {
                    Object.assign(window.gameState, parsed);
                } else {
                    window.gameState = parsed;
                }
                console.log('✅ Game state loaded');
            } else {
                console.log('ℹ️ No saved game state found');
            }
        } catch (error) {
            console.error('❌ Error loading game state:', error);
        }
    },
    
    // ==================== SPECIFIC SETTINGS ====================
    
    /**
     * Get gender setting
     */
    getGender: function() {
        return localStorage.getItem('userGender') || null;
    },
    
    /**
     * Set gender setting
     */
    setGender: function(gender) {
        localStorage.setItem('userGender', gender);
        localStorage.setItem('hasSelectedGender', 'true');
    },
    
    /**
     * Get filter setting
     */
    getFilter: function() {
        return localStorage.getItem('userFilter') || 'not_specified';
    },
    
    /**
     * Set filter setting
     */
    setFilter: function(filter) {
        localStorage.setItem('userFilter', filter);
    },
    
    /**
     * Get coins
     */
    getCoins: function() {
        return parseInt(localStorage.getItem('userCoins')) || 100;
    },
    
    /**
     * Set coins
     */
    setCoins: function(coins) {
        localStorage.setItem('userCoins', coins.toString());
    },
    
    /**
     * Update coins (add or subtract)
     */
    updateCoins: function(amount) {
        const current = this.getCoins();
        const newAmount = Math.max(0, current + amount);
        this.setCoins(newAmount);
        return newAmount;
    },
    
    // ==================== STATISTICS ====================
    
    /**
     * Update statistics
     */
    updateStats: function(stats) {
        try {
            Object.entries(stats).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    localStorage.setItem(key, value.toString());
                }
            });
            console.log('✅ Stats updated');
        } catch (error) {
            console.error('❌ Error updating stats:', error);
        }
    },
    
    /**
     * Get all statistics
     */
    getAllStats: function() {
        return {
            coins: this.getCoins(),
            level: parseInt(localStorage.getItem('userLevel')) || 1,
            rating: parseInt(localStorage.getItem('userRating')) || 1500,
            matches: parseInt(localStorage.getItem('userMatches')) || 0,
            duels: parseInt(localStorage.getItem('userDuels')) || 0,
            wins: parseInt(localStorage.getItem('userWins')) || 0,
            totalLikes: parseInt(localStorage.getItem('userTotalLikes')) || 0,
            dailySuperLikes: parseInt(localStorage.getItem('userDailySuperLikes')) || 3,
            bio: localStorage.getItem('userBio') || '',
            filter: this.getFilter(),
            mutualMatchesCount: parseInt(localStorage.getItem('mutualMatchesCount')) || 0,
            friendsCount: parseInt(localStorage.getItem('friendsCount')) || 0
        };
    },
    
    // ==================== MUTUAL MATCHES ====================
    
    /**
     * Save mutual matches
     */
    saveMutualMatches: function(matches) {
        try {
            localStorage.setItem('mutualMatches', JSON.stringify(matches));
            console.log('✅ Mutual matches saved');
        } catch (error) {
            console.error('❌ Error saving mutual matches:', error);
        }
    },
    
    /**
     * Load mutual matches
     */
    loadMutualMatches: function() {
        try {
            const saved = localStorage.getItem('mutualMatches');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('❌ Error loading mutual matches:', error);
            return [];
        }
    },
    
    // ==================== FRIENDS LIST ====================
    
    /**
     * Save friends list
     */
    saveFriendsList: function(friends) {
        try {
            localStorage.setItem('friendsList', JSON.stringify(friends));
            localStorage.setItem('friendsCount', friends.length.toString());
            console.log('✅ Friends list saved');
        } catch (error) {
            console.error('❌ Error saving friends list:', error);
        }
    },
    
    /**
     * Load friends list
     */
    loadFriendsList: function() {
        try {
            const saved = localStorage.getItem('friendsList');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('❌ Error loading friends list:', error);
            return [];
        }
    },
    
    // ==================== SHOP ITEMS ====================
    
    /**
     * Save purchased items
     */
    savePurchasedItems: function(items) {
        try {
            localStorage.setItem('purchasedItems', JSON.stringify(items));
            console.log('✅ Purchased items saved');
        } catch (error) {
            console.error('❌ Error saving purchased items:', error);
        }
    },
    
    /**
     * Load purchased items
     */
    loadPurchasedItems: function() {
        try {
            const saved = localStorage.getItem('purchasedItems');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('❌ Error loading purchased items:', error);
            return [];
        }
    },
    
    // ==================== SESSION DATA ====================
    
    /**
     * Save session data
     */
    saveSession: function(data) {
        try {
            localStorage.setItem('session', JSON.stringify(data));
            console.log('✅ Session saved');
        } catch (error) {
            console.error('❌ Error saving session:', error);
        }
    },
    
    /**
     * Load session data
     */
    loadSession: function() {
        try {
            const saved = localStorage.getItem('session');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('❌ Error loading session:', error);
            return {};
        }
    },
    
    // ==================== CLEAR ALL ====================
    
    /**
     * Clear all game data
     */
    clearAll: function() {
        try {
            const keys = [
                'userState',
                'gameState',
                'userGender',
                'hasSelectedGender',
                'userCoins',
                'userLevel',
                'userRating',
                'userMatches',
                'userDuels',
                'userWins',
                'userTotalLikes',
                'userDailySuperLikes',
                'userBio',
                'userFilter',
                'mutualMatchesCount',
                'friendsCount',
                'mutualMatches',
                'friendsList',
                'purchasedItems',
                'session'
            ];
            
            keys.forEach(key => localStorage.removeItem(key));
            console.log('✅ All game data cleared');
            
            return true;
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            return false;
        }
    },
    
    // ==================== EXPORT DATA ====================
    
    /**
     * Export all data as JSON
     */
    exportData: function() {
        try {
            const data = {};
            
            // Collect all relevant data
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('user') || key.startsWith('game') || 
                    key.includes('match') || key.includes('friend') ||
                    key.includes('purchased') || key === 'session') {
                    try {
                        data[key] = JSON.parse(localStorage.getItem(key));
                    } catch {
                        data[key] = localStorage.getItem(key);
                    }
                }
            }
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            return null;
        }
    },
    
    /**
     * Import data from JSON
     */
    importData: function(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    localStorage.setItem(key, JSON.stringify(value));
                } else {
                    localStorage.setItem(key, value);
                }
            });
            
            console.log('✅ Data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Error importing data:', error);
            return false;
        }
    },
    
    // ==================== BACKUP SYSTEM ====================
    
    /**
     * Create backup
     */
    createBackup: function() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                data: this.exportData()
            };
            
            localStorage.setItem('backup', JSON.stringify(backup));
            console.log('✅ Backup created');
            return backup;
        } catch (error) {
            console.error('❌ Error creating backup:', error);
            return null;
        }
    },
    
    /**
     * Restore from backup
     */
    restoreBackup: function() {
        try {
            const backupStr = localStorage.getItem('backup');
            if (!backupStr) {
                console.warn('No backup found');
                return false;
            }
            
            const backup = JSON.parse(backupStr);
            if (!backup.data) {
                console.error('Invalid backup format');
                return false;
            }
            
            return this.importData(backup.data);
        } catch (error) {
            console.error('❌ Error restoring backup:', error);
            return false;
        }
    },
    
    // ==================== INITIALIZATION ====================
    
    /**
     * Initialize storage
     */
    init: function() {
        console.log('💾 Storage manager initializing...');
        
        // Load existing data
        this.loadUserState();
        this.loadGameState();
        
        // Initialize default user state if not exists
        if (!window.userState) {
            window.userState = {
                currentGender: null,
                hasSelectedGender: false,
                coins: 100,
                level: 1,
                rating: 1500,
                matches: 0,
                duels: 0,
                wins: 0,
                totalLikes: 0,
                dailySuperLikes: 3,
                bio: '',
                filter: 'not_specified',
                mutualMatchesCount: 0,
                friendsCount: 0
            };
            this.saveUserState();
            console.log('✅ Default user state created');
        }
        
        // Initialize default game state if not exists
        if (!window.gameState) {
            window.gameState = {
                socket: null,
                isConnected: false,
                isInQueue: false,
                isInDuel: false,
                timeLeft: 20,
                timerInterval: null,
                playerData: null,
                currentDuelId: null,
                currentPartner: null,
                lastOpponent: null,
                reconnectAttempts: 0,
                maxReconnectAttempts: 5,
                currentTab: 'duel',
                isChatModalOpen: false,
                currentFilter: 'not_specified',
                mutualMatches: [],
                friendsList: [],
                waitingForOpponent: false,
                matchCompleted: false,
                skipToNextRequested: false
            };
            this.saveGameState();
            console.log('✅ Default game state created');
        }
        
        console.log('✅ Storage manager initialized');
    }
};
// storage.js ga qo'shing
class AchievementSystem {
    constructor() {
        this.achievements = [
            { id: 1, type: 'first_match', title: "Birinchi Match", description: "Birinchi matchingizni qiling", reward: 100, icon: "🎯", unlocked: false },
            { id: 2, type: 'first_friend', title: "Birinchi Do'st", description: "Birinchi do'stingizni qo'shing", reward: 150, icon: "🤝", unlocked: false },
            { id: 3, type: 'duels_10', title: "Duelchi", description: "10 ta duel o'ynang", reward: 200, icon: "⚔️", unlocked: false },
            { id: 4, type: 'likes_50', title: "Sevimli", description: "50 ta like bering", reward: 300, icon: "❤️", unlocked: false },
            { id: 5, type: 'superlikes_20', title: "Super Sevar", description: "20 ta Super Like bering", reward: 500, icon: "💎", unlocked: false },
            { id: 6, type: 'friends_10', title: "Ijtimoiy", description: "10 ta do'stingiz bo'lsin", reward: 1000, icon: "👥", unlocked: false },
            { id: 7, type: 'win_streak_5', title: "G'olib", description: "Ketma-ket 5 ta duel yutishingiz kerak", reward: 800, icon: "🏆", unlocked: false },
            { id: 8, type: 'daily_login_7', title: "Sodiq", description: "7 kun ketma-ket tizimga kiring", reward: 700, icon: "📅", unlocked: false },
            { id: 9, type: 'perfect_match', title: "Mukammal Match", description: "Barcha ovozlaringiz match bo'lsin", reward: 1000, icon: "✨", unlocked: false },
            { id: 10, type: 'rich', title: "Boy", description: "5000 tanga to'plang", reward: 2000, icon: "💰", unlocked: false }
        ];
        this.loadAchievements();
    }

    loadAchievements() {
        const saved = storage.get('achievements');
        if (saved) {
            this.achievements = saved;
        }
    }

    saveAchievements() {
        storage.set('achievements', this.achievements);
    }

    checkAchievement(type, value = 1) {
        const achievement = this.achievements.find(a => a.type === type);
        
        if (achievement && !achievement.unlocked) {
            // Logic har bir achievement uchun alohida
            let unlock = false;
            
            switch(type) {
                case 'first_match':
                    unlock = value > 0;
                    break;
                case 'first_friend':
                    unlock = value > 0;
                    break;
                case 'duels_10':
                    unlock = value >= 10;
                    break;
                case 'likes_50':
                    unlock = value >= 50;
                    break;
                case 'superlikes_20':
                    unlock = value >= 20;
                    break;
                case 'friends_10':
                    unlock = value >= 10;
                    break;
                case 'win_streak_5':
                    unlock = value >= 5;
                    break;
                case 'daily_login_7':
                    unlock = value >= 7;
                    break;
                case 'perfect_match':
                    unlock = value; // boolean
                    break;
                case 'rich':
                    unlock = value >= 5000;
                    break;
            }
            
            if (unlock) {
                this.unlockAchievement(achievement.id);
            }
        }
    }

    unlockAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.saveAchievements();
            this.showAchievementPopup(achievement);
            return true;
        }
        return false;
    }

    showAchievementPopup(achievement) {
        // Notification ko'rinishida
        showNotification(
            `🏆 ${achievement.title}`,
            `${achievement.description} - ${achievement.reward} tanga mukofoti!`
        );
        
        // Konfetti efekti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        // Mukofotni qo'shish
        gameState.user.coins += achievement.reward;
        updateUserStats();
    }

    getUnlockedCount() {
        return this.achievements.filter(a => a.unlocked).length;
    }

    getTotalRewards() {
        return this.achievements
            .filter(a => a.unlocked)
            .reduce((sum, a) => sum + a.reward, 0);
    }
}

const achievementSystem = new AchievementSystem();
// Initialize storage when loaded
StorageManager.init();

// Export to global scope
window.storage = StorageManager;