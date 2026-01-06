// public/ui.js - UI MANAGER WITH FRIENDS SYSTEM
window.uiManager = {
    
    initUserProfile: function() {
        // Load Telegram user data
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
            window.tgUserGlobal = {
                id: tgUser.id,
                first_name: tgUser.first_name,
                username: tgUser.username,
                photo_url: tgUser.photo_url
            };
        }
        
        // Load from storage
        window.storage?.loadUserState();
        
        // Update UI
        this.updateUserProfile();
        this.updateUIFromUserState();
    },
    
    updateUserProfile: function() {
        const user = window.tgUserGlobal || {};
        
        // Update avatars
        ['myAvatar', 'profileAvatar'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.src = user.photo_url || `https://ui-avatars.com/api/?name=${user.first_name || 'User'}`;
            }
        });
        
        // Update names
        ['myName', 'profileName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = user.first_name || 'Foydalanuvchi';
        });
        
        // Update usernames
        ['myUsername', 'profileUsername'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '@' + (user.username || 'username');
        });
    },
    
    updateUIFromUserState: function() {
        // Update coins
        ['coinsCount', 'shopCoinsCount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = window.userState.coins || 100;
        });
        
        // Update level
        const levelEl = document.getElementById('levelCount');
        if (levelEl) levelEl.textContent = window.userState.level || 1;
        
        // Update super like count
        const superLikeEl = document.getElementById('superLikeCount');
        if (superLikeEl) superLikeEl.textContent = window.userState.dailySuperLikes || 3;
        
        // Update match counts
        const matchesEl = document.getElementById('myMatches');
        if (matchesEl) matchesEl.textContent = window.userState.matches || 0;
        
        const mutualMatchesEl = document.getElementById('mutualMatchesCount');
        if (mutualMatchesEl) mutualMatchesEl.textContent = window.userState.friendsCount || 0;
        
        // Update profile stats
        const statMatches = document.getElementById('statMatches');
        if (statMatches) statMatches.textContent = window.userState.matches || 0;
        
        const statFriends = document.getElementById('statFriends');
        if (statFriends) statFriends.textContent = window.userState.friendsCount || 0;
    },
    
    updateOpponentInfo: function(opponent) {
        if (!opponent) return;
        
        const avatar = document.getElementById('opponentAvatar');
        if (avatar) {
            avatar.src = opponent.photo || `https://ui-avatars.com/api/?name=${opponent.name}`;
        }
        
        const nameEl = document.getElementById('opponentName');
        if (nameEl) nameEl.textContent = opponent.name || 'Raqib';
        
        const usernameEl = document.getElementById('opponentUsername');
        if (usernameEl) usernameEl.textContent = '@' + (opponent.username || 'username');
        
        const ratingEl = document.getElementById('opponentRating');
        if (ratingEl) ratingEl.textContent = opponent.rating || 1500;
        
        const matchesEl = document.getElementById('opponentMatches');
        if (matchesEl) matchesEl.textContent = opponent.matches || 0;
        
        const levelEl = document.getElementById('opponentLevel');
        if (levelEl) levelEl.textContent = opponent.level || 1;
    },
    
    showScreen: function(screenName) {
        const screens = ['welcomeScreen', 'queueScreen', 'duelScreen'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.toggle('hidden', screenId !== screenName);
            }
        });
    },
    
    // ==================== FRIENDS LIST ====================
    loadFriendsList: function() {
        const friendsListEl = document.getElementById('friendsList');
        const noFriendsEl = document.getElementById('noFriends');
        const friendsCountEl = document.getElementById('friendsCount');
        
        if (!friendsListEl || !noFriendsEl) return;
        
        // Load friends from storage
        const friends = window.storage?.loadFriendsList() || [];
        
        // Clear list
        friendsListEl.innerHTML = '';
        
        if (friends.length === 0) {
            noFriendsEl.classList.remove('hidden');
            if (friendsCountEl) friendsCountEl.textContent = '0';
            return;
        }
        
        noFriendsEl.classList.add('hidden');
        if (friendsCountEl) friendsCountEl.textContent = friends.length.toString();
        
        // Add each friend
        friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            friendItem.innerHTML = `
                <img src="${friend.photo}" class="friend-avatar" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${friend.name}'">
                <div class="friend-info">
                    <div class="friend-name">
                        ${friend.name}
                        ${friend.online ? '<span class="online-dot"></span>' : ''}
                    </div>
                    <div class="friend-username">@${friend.username || 'username'}</div>
                    <div class="friend-stats">
                        <span><i class="fas fa-trophy"></i> ${friend.rating || 1500}</span>
                        <span><i class="fas fa-heart"></i> ${friend.matches || 0}</span>
                    </div>
                    <div class="friend-status ${friend.online ? 'online' : 'offline'}">
                        ${friend.online ? 'Online' : 'Offline'}
                    </div>
                </div>
                <button class="chat-btn" onclick="uiManager.openChatWithFriend('${friend.id}')">
                    <i class="fas fa-comment"></i>
                </button>
            `;
            
            friendsListEl.appendChild(friendItem);
        });
        
        // Also request from server
        if (window.socketManager?.socket?.connected) {
            window.socketManager.socket.emit('get_friends_list');
        }
    },
    
    openChatWithFriend: function(friendId) {
        // Find friend in storage
        const friends = window.storage?.loadFriendsList() || [];
        const friend = friends.find(f => f.id === friendId);
        
        if (!friend) {
            window.utils?.showNotification('Xato', 'Do\'st topilmadi');
            return;
        }
        
        // Check if friend has Telegram username
        if (friend.username && friend.username !== 'username') {
            window.open(`https://t.me/${friend.username.replace('@', '')}`, '_blank');
        } else {
            window.utils?.showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        }
    },
    
    // ==================== TABS ====================
    initTabNavigation: function() {
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                contents.forEach(content => {
                    content.classList.toggle('active', content.id === tabName + 'Tab');
                });
                
                // Load data for tab
                switch(tabName) {
                    case 'friends':
                        this.loadFriendsList();
                        break;
                    case 'profile':
                        this.loadProfileData();
                        break;
                }
            });
        });
    },
    
    loadProfileData: function() {
        // Update profile stats
        const statRating = document.getElementById('statRating');
        if (statRating) statRating.textContent = window.userState.rating || 1500;
        
        const statMatches = document.getElementById('statMatches');
        if (statMatches) statMatches.textContent = window.userState.matches || 0;
        
        const statDuels = document.getElementById('statDuels');
        if (statDuels) statDuels.textContent = window.userState.duels || 0;
        
        const mutualMatchesProfile = document.getElementById('mutualMatchesProfile');
        if (mutualMatchesProfile) mutualMatchesProfile.textContent = window.userState.friendsCount || 0;
        
        const statFriends = document.getElementById('statFriends');
        if (statFriends) statFriends.textContent = window.userState.friendsCount || 0;
        
        // Calculate win rate
        const winRateEl = document.getElementById('statWinRate');
        if (winRateEl && window.userState.duels > 0) {
            const winRate = Math.round((window.userState.wins / window.userState.duels) * 100);
            winRateEl.textContent = winRate + '%';
        } else if (winRateEl) {
            winRateEl.textContent = '0%';
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.uiManager?.initUserProfile();
        window.uiManager?.initTabNavigation();
    }, 500);
});