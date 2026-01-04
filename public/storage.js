// ==================== STORAGE MANAGER ====================
window.storage = {
    /**
     * Save user state
     */
    saveUserState: function() {
        try {
            const userState = {
                currentGender: window.userState.currentGender,
                hasSelectedGender: window.userState.hasSelectedGender,
                coins: window.userState.coins,
                level: window.userState.level,
                rating: window.userState.rating,
                matches: window.userState.matches,
                duels: window.userState.duels,
                wins: window.userState.wins,
                totalLikes: window.userState.totalLikes,
                dailySuperLikes: window.userState.dailySuperLikes,
                bio: window.userState.bio,
                filter: window.userState.filter,
                mutualMatchesCount: window.userState.mutualMatchesCount,
                friendsCount: window.userState.friendsCount
            };
            
            localStorage.setItem('likeDuelUserState', JSON.stringify(userState));
            console.log('💾 User state saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving user state:', error);
            return false;
        }
    },
    
    /**
     * Load user state
     */
    loadUserState: function() {
        try {
            const saved = localStorage.getItem('likeDuelUserState');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(window.userState, parsed);
                console.log('📦 User state loaded:', window.userState);
                return true;
            }
        } catch (error) {
            console.error('❌ Error loading user state:', error);
        }
        return false;
    },
    
    /**
     * Clear all storage
     */
    clearAll: function() {
        try {
            localStorage.removeItem('likeDuelUserState');
            localStorage.removeItem('userGender');
            localStorage.removeItem('hasSelectedGender');
            localStorage.removeItem('userFilter');
            console.log('🗑️ All storage cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing storage:', error);
            return false;
        }
    },
    
    /**
     * Save friends list
     */
    saveFriendsList: function(friendsList) {
        try {
            localStorage.setItem('likeDuelFriends', JSON.stringify(friendsList));
            console.log('💾 Friends list saved:', friendsList.length, 'friends');
            return true;
        } catch (error) {
            console.error('❌ Error saving friends list:', error);
            return false;
        }
    },
    
    /**
     * Load friends list
     */
    loadFriendsList: function() {
        try {
            const saved = localStorage.getItem('likeDuelFriends');
            if (saved) {
                const friendsList = JSON.parse(saved);
                console.log('📦 Friends list loaded:', friendsList.length, 'friends');
                return friendsList;
            }
        } catch (error) {
            console.error('❌ Error loading friends list:', error);
        }
        return [];
    },
    
    /**
     * Add to friends list
     */
    addToFriendsList: function(friend) {
        try {
            const friendsList = this.loadFriendsList();
            
            // Check if friend already exists
            const existingIndex = friendsList.findIndex(f => f.id === friend.id);
            if (existingIndex === -1) {
                friendsList.push({
                    id: friend.id,
                    name: friend.name || 'Foydalanuvchi',
                    username: friend.username || '',
                    photo: friend.photo || 
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'User')}&background=3498db&color=fff`,
                    gender: friend.gender || 'not_specified',
                    rating: friend.rating || 1500,
                    matches: friend.matches || 0,
                    online: friend.online || false,
                    lastActive: new Date(),
                    isMutual: true,
                    mutualMatchDate: new Date(),
                    isSuperLikeMatch: friend.isSuperLikeMatch || false
                });
                
                this.saveFriendsList(friendsList);
                console.log('✅ Friend added:', friend.name);
                return true;
            }
            
            console.log('ℹ️ Friend already exists:', friend.name);
            return false;
        } catch (error) {
            console.error('❌ Error adding friend:', error);
            return false;
        }
    },
    
    /**
     * Remove from friends list
     */
    removeFromFriendsList: function(friendId) {
        try {
            const friendsList = this.loadFriendsList();
            const filteredList = friendsList.filter(friend => friend.id !== friendId);
            
            if (filteredList.length !== friendsList.length) {
                this.saveFriendsList(filteredList);
                console.log('❌ Friend removed:', friendId);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error removing friend:', error);
            return false;
        }
    },
    
    /**
     * Save match history
     */
    saveMatchHistory: function(match) {
        try {
            const history = this.loadMatchHistory();
            history.unshift({
                ...match,
                timestamp: new Date()
            });
            
            // Keep only last 100 matches
            const limitedHistory = history.slice(0, 100);
            
            localStorage.setItem('likeDuelMatchHistory', JSON.stringify(limitedHistory));
            console.log('💾 Match history saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving match history:', error);
            return false;
        }
    },
    
    /**
     * Load match history
     */
    loadMatchHistory: function() {
        try {
            const saved = localStorage.getItem('likeDuelMatchHistory');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('❌ Error loading match history:', error);
        }
        return [];
    },
    
    /**
     * Save settings
     */
    saveSettings: function(settings) {
        try {
            localStorage.setItem('likeDuelSettings', JSON.stringify(settings));
            console.log('💾 Settings saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving settings:', error);
            return false;
        }
    },
    
    /**
     * Load settings
     */
    loadSettings: function() {
        try {
            const saved = localStorage.getItem('likeDuelSettings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('❌ Error loading settings:', error);
        }
        return {
            soundEnabled: true,
            vibrationEnabled: true,
            notificationsEnabled: true,
            autoQueue: false
        };
    },
    
    /**
     * Save quests progress
     */
    saveQuestsProgress: function(quests) {
        try {
            localStorage.setItem('likeDuelQuests', JSON.stringify(quests));
            console.log('💾 Quests progress saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving quests:', error);
            return false;
        }
    },
    
    /**
     * Load quests progress
     */
    loadQuestsProgress: function() {
        try {
            const saved = localStorage.getItem('likeDuelQuests');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('❌ Error loading quests:', error);
        }
        return {
            daily_duels: { progress: 0, completed: false },
            mutual_matches: { progress: 0, completed: false },
            win_streak: { progress: 0, completed: false }
        };
    },
    
    /**
     * Save leaderboard data
     */
    saveLeaderboardData: function(data) {
        try {
            const cache = {
                data: data,
                timestamp: new Date().getTime()
            };
            
            localStorage.setItem('likeDuelLeaderboard', JSON.stringify(cache));
            console.log('💾 Leaderboard data cached');
            return true;
        } catch (error) {
            console.error('❌ Error saving leaderboard:', error);
            return false;
        }
    },
    
    /**
     * Load leaderboard data
     */
    loadLeaderboardData: function() {
        try {
            const saved = localStorage.getItem('likeDuelLeaderboard');
            if (saved) {
                const cache = JSON.parse(saved);
                const now = new Date().getTime();
                const oneHour = 60 * 60 * 1000;
                
                // Return cached data if less than 1 hour old
                if (now - cache.timestamp < oneHour) {
                    console.log('📦 Leaderboard data loaded from cache');
                    return cache.data;
                }
            }
        } catch (error) {
            console.error('❌ Error loading leaderboard:', error);
        }
        return null;
    },
    
    /**
     * Get storage statistics
     */
    getStorageStats: function() {
        try {
            let totalSize = 0;
            const stats = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const size = (key.length + value.length) * 2; // Approximate size in bytes
                
                totalSize += size;
                
                if (key.startsWith('likeDuel')) {
                    stats[key] = {
                        size: size,
                        items: key.includes('Friends') || key.includes('History') ? 
                            JSON.parse(value).length : 1
                    };
                }
            }
            
            return {
                totalSize: totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                stats: stats
            };
        } catch (error) {
            console.error('❌ Error getting storage stats:', error);
            return null;
        }
    },
    
    /**
     * Export all data
     */
    exportAllData: function() {
        try {
            const data = {
                userState: window.userState,
                friends: this.loadFriendsList(),
                matchHistory: this.loadMatchHistory(),
                settings: this.loadSettings(),
                quests: this.loadQuestsProgress(),
                timestamp: new Date().toISOString()
            };
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `like_duel_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            console.log('📤 All data exported');
            return true;
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            return false;
        }
    },
    
    /**
     * Import data from file
     */
    importData: function(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // Validate data
                        if (!data.userState || !data.timestamp) {
                            throw new Error('Invalid backup file format');
                        }
                        
                        // Restore data
                        Object.assign(window.userState, data.userState);
                        
                        if (data.friends) {
                            localStorage.setItem('likeDuelFriends', JSON.stringify(data.friends));
                        }
                        
                        if (data.matchHistory) {
                            localStorage.setItem('likeDuelMatchHistory', JSON.stringify(data.matchHistory));
                        }
                        
                        if (data.settings) {
                            localStorage.setItem('likeDuelSettings', JSON.stringify(data.settings));
                        }
                        
                        if (data.quests) {
                            localStorage.setItem('likeDuelQuests', JSON.stringify(data.quests));
                        }
                        
                        console.log('📥 Data imported successfully');
                        resolve(true);
                    } catch (parseError) {
                        console.error('❌ Error parsing backup file:', parseError);
                        reject(parseError);
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsText(file);
            } catch (error) {
                console.error('❌ Error importing data:', error);
                reject(error);
            }
        });
    }
};

// ==================== AUTO LOAD ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM yuklandi, Storage Manager ishga tushmoqda...');
    
    // Load user state automatically
    setTimeout(() => {
        if (window.storage && window.storage.loadUserState) {
            window.storage.loadUserState();
            console.log('✅ Storage Manager ishga tushdi');
        }
    }, 500);
});