// ==================== UI MANAGER ====================
window.uiManager = {
    /**
     * Initialize user profile
     */
    initUserProfile: function() {
        console.log('👤 User profile initializing...');
        
        // Telegram WebApp dan foydalanuvchi ma'lumotlarini olish
        try {
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const user = tg.initDataUnsafe?.user;
                
                if (user) {
                    console.log('✅ Telegram user found:', user);
                    
                    window.tgUserGlobal = {
                        id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        username: user.username,
                        photo_url: user.photo_url
                    };
                    
                    // Update UI with Telegram data
                    this.updateUserProfile();
                    
                    // Initialize Telegram WebApp
                    tg.expand();
                    tg.enableClosingConfirmation();
                    tg.setHeaderColor('#667eea');
                    tg.setBackgroundColor('#667eea');
                    
                    console.log('✅ Telegram WebApp initialized');
                }
            }
        } catch (error) {
            console.error('❌ Telegram WebApp error:', error);
        }
        
        // Load from localStorage
        this.loadUserState();
        
        // Update UI
        this.updateUIFromUserState();
        
        console.log('✅ User profile initialized');
    },
    
    /**
     * Load user state from localStorage
     */
    loadUserState: function() {
        console.log('📦 User state loading from localStorage...');
        
        try {
            const savedState = localStorage.getItem('likeDuelUserState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                Object.assign(window.userState, parsed);
                console.log('✅ User state loaded:', window.userState);
            }
        } catch (error) {
            console.error('❌ Error loading user state:', error);
        }
    },
    
    /**
     * Save user state to localStorage
     */
    saveUserState: function() {
        console.log('💾 User state saving to localStorage...');
        
        try {
            localStorage.setItem('likeDuelUserState', JSON.stringify(window.userState));
            console.log('✅ User state saved');
        } catch (error) {
            console.error('❌ Error saving user state:', error);
        }
    },
    
    /**
     * Update user profile UI
     */
    updateUserProfile: function() {
        console.log('🔄 User profile UI updating...');
        
        const elements = window.elements || {};
        
        // Avatar
        if (elements.myAvatar) {
            elements.myAvatar.src = window.tgUserGlobal?.photo_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(window.tgUserGlobal?.first_name || 'User')}&background=667eea&color=fff`;
            elements.myAvatar.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(window.tgUserGlobal?.first_name || 'User')}&background=667eea&color=fff`;
            };
        }
        
        if (elements.profileAvatar) {
            elements.profileAvatar.src = window.tgUserGlobal?.photo_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(window.tgUserGlobal?.first_name || 'User')}&background=667eea&color=fff`;
            elements.profileAvatar.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(window.tgUserGlobal?.first_name || 'User')}&background=667eea&color=fff`;
            };
        }
        
        // Name
        const userName = window.tgUserGlobal?.first_name || 'Foydalanuvchi';
        if (elements.myName) elements.myName.textContent = userName;
        if (elements.profileName) elements.profileName.textContent = userName;
        
        // Username
        const username = window.tgUserGlobal?.username || '';
        if (elements.myUsername) elements.myUsername.textContent = '@' + (username || 'username');
        if (elements.profileUsername) elements.profileUsername.textContent = '@' + (username || 'username');
        
        // Bio
        if (elements.profileBio) {
            elements.profileBio.textContent = window.userState.bio || 'Bio kiritilmagan';
        }
        
        console.log('✅ User profile UI updated');
    },
    
    /**
     * Update UI from user state
     */
    updateUIFromUserState: function() {
        console.log('🎨 UI user state bo\'yicha yangilanmoqda...');
        
        // Coins yangilash
        const coinsElements = [
            document.getElementById('coinsCount'),
            document.getElementById('shopCoinsCount')
        ];
        coinsElements.forEach(el => {
            if (el) el.textContent = window.userState.coins || 100;
        });
        
        // Level yangilash
        const levelElement = document.getElementById('levelCount');
        if (levelElement) levelElement.textContent = window.userState.level || 1;
        
        // Super like count yangilash
        const superLikeElement = document.getElementById('superLikeCount');
        if (superLikeElement) superLikeElement.textContent = window.userState.dailySuperLikes || 3;
        
        // Profile stats yangilash
        const profileStats = [
            { id: 'myMatches', value: window.userState.matches || 0 },
            { id: 'mutualMatchesCount', value: window.userState.mutualMatchesCount || 0 },
            { id: 'myLikes', value: window.userState.totalLikes || 0 },
            { id: 'statRating', value: window.userState.rating || 1500 },
            { id: 'statMatches', value: window.userState.matches || 0 },
            { id: 'statDuels', value: window.userState.duels || 0 },
            { id: 'mutualMatchesProfile', value: window.userState.mutualMatchesCount || 0 },
            { id: 'statFriends', value: window.userState.friendsCount || 0 }
        ];
        
        profileStats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element) element.textContent = stat.value;
        });
        
        // Win rate hisoblash
        const winRateElement = document.getElementById('statWinRate');
        if (winRateElement && window.userState.duels > 0) {
            const winRate = Math.round((window.userState.wins / window.userState.duels) * 100);
            winRateElement.textContent = winRate + '%';
        }
        
        console.log('✅ UI yangilandi');
    },
    
    /**
     * Initialize tab navigation
     */
    initTabNavigation: function() {
        console.log('📱 Tab navigation initializing...');
        
        const tabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                window.gameState.currentTab = tabName;
                
                // Show corresponding content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabName + 'Tab') {
                        content.classList.add('active');
                    }
                });
                
                console.log(`📱 Tab changed to: ${tabName}`);
                
                // Load data for the tab
                switch(tabName) {
                    case 'friends':
                        this.loadFriendsList();
                        break;
                    case 'shop':
                        this.loadShopItems();
                        break;
                    case 'leaderboard':
                        this.loadLeaderboard();
                        break;
                    case 'profile':
                        this.loadProfileQuests();
                        break;
                }
            });
        });
        
        console.log('✅ Tab navigation initialized');
    },
    
    /**
     * Show specific screen
     */
    showScreen: function(screenName) {
        console.log(`🔄 Ekran o'zgartirilmoqda: ${screenName}`);
        
        // Barcha ekranlarni yashirish
        const screens = ['welcomeScreen', 'queueScreen', 'duelScreen', 'matchScreen'];
        screens.forEach(screen => {
            const element = document.getElementById(screen);
            if (element) element.classList.add('hidden');
        });
        
        // Tanlangan ekranni ko'rsatish
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        } else {
            console.error(`❌ Ekran topilmadi: ${screenName}`);
        }
        
        console.log(`✅ Ekran o'zgartirildi: ${screenName}`);
    },
    
    /**
     * Update queue status message
     */
    updateQueueStatus: function(message) {
        console.log(`📝 Queue status: ${message}`);
        const element = document.getElementById('queueStatus');
        if (element) element.textContent = message;
    },
    
    /**
     * Update duel status message
     */
    updateDuelStatus: function(message) {
        console.log(`📝 Duel status: ${message}`);
        const element = document.getElementById('duelStatus');
        if (element) element.textContent = message;
    },
    
    /**
     * Update opponent info in duel screen
     */
    updateOpponentInfo: function(opponent) {
        console.log('👤 Opponent info yangilanmoqda:', opponent);
        
        if (!opponent) return;
        
        const elements = window.elements || {};
        
        if (opponent.photo && elements.opponentAvatar) {
            elements.opponentAvatar.src = opponent.photo;
            elements.opponentAvatar.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name)}&background=667eea&color=fff`;
            };
        }
        
        if (opponent.name && elements.opponentName) {
            elements.opponentName.textContent = opponent.name;
        }
        
        if (opponent.username && elements.opponentUsername) {
            elements.opponentUsername.textContent = '@' + opponent.username;
        }
        
        if (opponent.rating !== undefined && elements.opponentRating) {
            elements.opponentRating.textContent = opponent.rating;
        }
        
        if (opponent.matches !== undefined && elements.opponentMatches) {
            elements.opponentMatches.textContent = opponent.matches;
        }
        
        if (opponent.level !== undefined && elements.opponentLevel) {
            elements.opponentLevel.textContent = opponent.level;
        }
        
        console.log('✅ Opponent info yangilandi');
    },
    
    /**
     * Load friends list
     */
    loadFriendsList: function() {
        console.log('👥 Friends list loading...');
        
        const friendsList = document.getElementById('friendsList');
        const noFriends = document.getElementById('noFriends');
        const friendsCount = document.getElementById('friendsCount');
        const onlineFriendsCount = document.getElementById('onlineFriendsCount');
        
        if (!friendsList || !noFriends) return;
        
        // Mock data (server bilan aloqaga chiqganda, bu real data bilan almashtiriladi)
        const mockFriends = [
            {
                id: 'user_123',
                name: 'Ali Valiyev',
                username: 'ali_valiyev',
                photo: 'https://ui-avatars.com/api/?name=Ali&background=667eea&color=fff',
                online: true,
                gender: 'male',
                rating: 1750,
                matches: 25,
                isMutual: true
            },
            {
                id: 'user_456',
                name: 'Zarina Husanova',
                username: 'zarina_h',
                photo: 'https://ui-avatars.com/api/?name=Zarina&background=e74c3c&color=fff',
                online: false,
                gender: 'female',
                rating: 1620,
                matches: 18,
                isMutual: true
            }
        ];
        
        // Real data serverdan kelganda:
        // const friends = window.userState.friendsList || [];
        const friends = mockFriends;
        
        friendsList.innerHTML = '';
        
        if (friends.length === 0) {
            noFriends.classList.remove('hidden');
            if (friendsCount) friendsCount.textContent = '0';
            if (onlineFriendsCount) onlineFriendsCount.textContent = '0';
            console.log('ℹ️ No friends found');
            return;
        }
        
        noFriends.classList.add('hidden');
        
        const onlineCount = friends.filter(f => f.online).length;
        if (friendsCount) friendsCount.textContent = friends.length;
        if (onlineFriendsCount) onlineFriendsCount.textContent = onlineCount;
        
        friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item' + (friend.isMutual ? ' mutual' : '');
            
            const lastActive = friend.online ? 'Online' : window.utils?.formatDate?.(friend.lastActive) || 'Offline';
            const statusClass = friend.online ? 'status-online' : 'status-offline';
            
            friendItem.innerHTML = `
                <img src="${friend.photo}" class="friend-avatar" alt="${friend.name}">
                <div class="friend-info">
                    <div class="friend-name">
                        ${friend.name}
                        ${friend.gender === 'male' ? 
                            '<span class="gender-badge gender-male-badge"><i class="fas fa-mars"></i></span>' : 
                          friend.gender === 'female' ? 
                            '<span class="gender-badge gender-female-badge"><i class="fas fa-venus"></i></span>' : ''}
                        ${friend.isMutual ? '<span class="mutual-badge"><i class="fas fa-handshake"></i> O\'zaro</span>' : ''}
                    </div>
                    <div class="friend-username">@${friend.username}</div>
                    <div class="friend-stats">
                        <span><i class="fas fa-trophy"></i> ${friend.rating}</span>
                        <span><i class="fas fa-heart"></i> ${friend.matches}</span>
                    </div>
                    <div class="friend-status ${statusClass}">
                        <i class="fas fa-circle"></i> ${lastActive}
                    </div>
                </div>
            `;
            
            friendItem.addEventListener('click', () => {
                this.openChatFromFriend(friend);
            });
            
            friendsList.appendChild(friendItem);
        });
        
        console.log(`✅ ${friends.length} friends loaded (${onlineCount} online)`);
    },
    
    /**
     * Open chat from friend
     */
    openChatFromFriend: function(friend) {
        console.log('💬 Chat ochilmoqda:', friend);
        
        if (!friend.online) {
            window.utils?.showNotification('Offline', `${friend.name} hozir online emas`);
            return;
        }
        
        if (window.modalManager?.showChatModal) {
            window.modalManager.showChatModal(friend);
        }
    },
    
    /**
     * Load shop items
     */
    loadShopItems: function() {
        console.log('🛒 Shop items loading...');
        
        const shopItemsList = document.getElementById('shopItemsList');
        if (!shopItemsList) return;
        
        const shopItems = [
            {
                id: 'super_like_pack',
                name: 'SUPER LIKE Pack',
                description: '10 ta SUPER LIKE',
                price: 100,
                icon: '💎'
            },
            {
                id: 'coins_small',
                name: 'Coin Pack (Kichik)',
                description: '500 tanga',
                price: 99,
                icon: '🪙'
            },
            {
                id: 'coins_medium',
                name: 'Coin Pack (O\'rta)',
                description: '1,500 tanga',
                price: 249,
                icon: '💰'
            },
            {
                id: 'coins_large',
                name: 'Coin Pack (Katta)',
                description: '3,000 tanga',
                price: 499,
                icon: '💵'
            }
        ];
        
        shopItemsList.innerHTML = '';
        
        shopItems.forEach(item => {
            const shopItem = document.createElement('div');
            shopItem.className = 'shop-item';
            
            const canBuy = window.userState.coins >= item.price;
            
            shopItem.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                </div>
                <button class="shop-item-buy" ${canBuy ? '' : 'disabled'} onclick="buyItem('${item.id}')">
                    <i class="fas fa-shopping-cart"></i> ${item.price} tanga
                </button>
            `;
            
            shopItemsList.appendChild(shopItem);
        });
        
        console.log(`✅ ${shopItems.length} shop items loaded`);
    },
    
    /**
     * Buy item
     */
    buyItem: function(itemId) {
        console.log(`🛒 Buying item: ${itemId}`);
        
        const items = {
            'super_like_pack': { price: 100, superLikes: 10 },
            'coins_small': { price: 99, coins: 500 },
            'coins_medium': { price: 249, coins: 1500 },
            'coins_large': { price: 499, coins: 3000 }
        };
        
        const item = items[itemId];
        if (!item) {
            window.utils?.showNotification('Xato', 'Mahsulot topilmadi');
            return;
        }
        
        if (window.userState.coins < item.price) {
            window.utils?.showNotification('Tangalar yetarli emas', `Sizda ${window.userState.coins} tanga bor, ${item.price} tanga kerak`);
            return;
        }
        
        // Transaction
        window.userState.coins -= item.price;
        
        if (item.superLikes) {
            window.userState.dailySuperLikes += item.superLikes;
            window.utils?.showNotification('Muvaffaqiyatli', `${item.superLikes} ta SUPER LIKE qo'shildi!`);
        }
        
        if (item.coins) {
            window.userState.coins += item.coins;
            window.utils?.showNotification('Muvaffaqiyatli', `${item.coins} tanga qo'shildi!`);
        }
        
        // Update UI
        this.updateUIFromUserState();
        this.saveUserState();
        
        console.log(`✅ Item purchased: ${itemId}`);
    },
    
    /**
     * Load leaderboard
     */
    loadLeaderboard: function() {
        console.log('🏆 Leaderboard loading...');
        
        const leaderboardList = document.getElementById('leaderboardList');
        const leaderboardUpdated = document.getElementById('leaderboardUpdated');
        
        if (!leaderboardList) return;
        
        const mockLeaderboard = [
            { id: 'user_1', name: 'Ali Valiyev', rating: 2450, matches: 156, wins: 128, friends: 45 },
            { id: 'user_2', name: 'Zarina Husanova', rating: 2310, matches: 142, wins: 115, friends: 38 },
            { id: 'user_3', name: 'Sherzod Qodirov', rating: 2180, matches: 128, wins: 98, friends: 32 },
            { id: 'user_4', name: 'Malika Yusupova', rating: 2050, matches: 115, wins: 85, friends: 28 },
            { id: 'user_5', name: 'Javohir Karimov', rating: 1920, matches: 102, wins: 72, friends: 25 }
        ];
        
        leaderboardList.innerHTML = '';
        
        mockLeaderboard.forEach((user, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            
            leaderboardItem.innerHTML = `
                <div class="leaderboard-rank ${rankClass}">${rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">
                        ${user.name}
                        <span class="mutual-badge"><i class="fas fa-crown"></i> ${user.rating}</span>
                    </div>
                    <div class="leaderboard-stats">
                        <span><i class="fas fa-trophy"></i> ${user.rating}</span>
                        <span><i class="fas fa-heart"></i> ${user.matches}</span>
                        <span><i class="fas fa-users"></i> ${user.friends}</span>
                    </div>
                </div>
            `;
            
            leaderboardList.appendChild(leaderboardItem);
        });
        
        if (leaderboardUpdated) {
            leaderboardUpdated.textContent = 'hozir';
        }
        
        console.log(`✅ Leaderboard loaded: ${mockLeaderboard.length} users`);
    },
    
    /**
     * Load profile quests
     */
    loadProfileQuests: function() {
        console.log('🎯 Profile quests loading...');
        
        const profileQuestsList = document.getElementById('profileQuestsList');
        if (!profileQuestsList) return;
        
        const quests = [
            {
                id: 'daily_duels',
                title: 'Kunlik Duel',
                description: 'Kun davomida 3 ta duel o\'ynash',
                progress: 1,
                total: 3,
                reward: { coins: 50 }
            },
            {
                id: 'mutual_matches',
                title: 'O\'zaro Match',
                description: '1 ta o\'zaro match topish',
                progress: 0,
                total: 1,
                reward: { coins: 100, superLikes: 1 }
            },
            {
                id: 'win_streak',
                title: 'G\'alaba Seriyasi',
                description: '3 ta duel ketma-ket yutish',
                progress: 1,
                total: 3,
                reward: { coins: 75 }
            }
        ];
        
        profileQuestsList.innerHTML = '';
        
        quests.forEach(quest => {
            const questItem = document.createElement('div');
            questItem.className = 'quest-item';
            
            const percent = Math.min(Math.round((quest.progress / quest.total) * 100), 100);
            
            questItem.innerHTML = `
                <div class="quest-info">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-progress">${quest.progress}/${quest.total}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
                <div class="quest-reward">
                    <i class="fas fa-coins"></i> ${quest.reward.coins}
                    ${quest.reward.superLikes ? `<i class="fas fa-gem"></i> ${quest.reward.superLikes}` : ''}
                </div>
            `;
            
            profileQuestsList.appendChild(questItem);
        });
        
        console.log(`✅ ${quests.length} quests loaded`);
    },
    
    /**
     * Select gender
     */
    selectGender: function(gender) {
        console.log(`🎯 Gender selected: ${gender}`);
        
        window.userState.currentGender = gender;
        window.userState.hasSelectedGender = true;
        window.userState.filter = gender === 'all' ? 'not_specified' : gender;
        
        // Save to localStorage
        localStorage.setItem('userGender', gender);
        localStorage.setItem('hasSelectedGender', 'true');
        localStorage.setItem('userFilter', window.userState.filter);
        
        // Save user state
        this.saveUserState();
        
        // Send to server
        if (window.socketManager && window.socketManager.socket) {
            window.socketManager.socket.emit('select_gender', {
                gender: gender,
                filter: window.userState.filter
            });
        }
        
        console.log(`✅ Gender saved: ${gender}, filter: ${window.userState.filter}`);
    },
    
    /**
     * Select filter
     */
    selectFilter: function(filter) {
        console.log(`🎯 Filter selected: ${filter}`);
        
        window.userState.filter = filter;
        localStorage.setItem('userFilter', filter);
        
        // Save user state
        this.saveUserState();
        
        // Send to server
        if (window.socketManager && window.socketManager.socket) {
            window.socketManager.socket.emit('update_profile', {
                filter: filter
            });
        }
        
        console.log(`✅ Filter saved: ${filter}`);
    },
    
    /**
     * Open Telegram chat
     */
    openTelegramChat: function(username) {
        console.log(`📱 Telegram chat opening: @${username}`);
        
        if (!username) {
            window.utils?.showNotification('Xato', 'Telegram username mavjud emas');
            return;
        }
        
        const telegramUrl = `https://t.me/${username}`;
        window.open(telegramUrl, '_blank');
        
        window.utils?.showNotification('Telegram ochildi', `${username} bilan chat`);
    },
    
    /**
     * Close chat modal
     */
    closeChatModal: function() {
        console.log('❌ Chat modal yopilmoqda');
        
        const chatModal = document.getElementById('chatModal');
        if (chatModal) {
            chatModal.classList.remove('active');
        }
    },
    
    /**
     * Add gender badge to element
     */
    addGenderBadge: function(element, gender) {
        if (!element || !gender) return;
        
        if (gender === 'male') {
            element.innerHTML += ' <span class="gender-badge gender-male-badge"><i class="fas fa-mars"></i></span>';
        } else if (gender === 'female') {
            element.innerHTML += ' <span class="gender-badge gender-female-badge"><i class="fas fa-venus"></i></span>';
        }
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM yuklandi, UI Manager ishga tushmoqda...');
    
    // Delay to ensure all scripts are loaded
    setTimeout(() => {
        if (window.uiManager && window.uiManager.initUserProfile) {
            window.uiManager.initUserProfile();
            window.uiManager.initTabNavigation();
            console.log('✅ UI Manager to\'liq ishga tushdi');
        }
    }, 500);
});