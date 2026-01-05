// public/ui.js - To'liq funksionallik bilan UI Manager

window.uiManager = {
    // ==================== INITIALIZATION ====================
    initUserProfile: function() {
        console.log('👤 UI Manager: User profile initializing...');

        // Telegram WebApp dan ma'lumot olish
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            const user = tg.initDataUnsafe?.user;

            if (user) {
                window.tgUserGlobal = {
                    id: user.id,
                    first_name: user.first_name || 'User',
                    last_name: user.last_name || '',
                    username: user.username || '',
                    photo_url: user.photo_url
                };

                // Telegram WebApp sozlamalari
                tg.expand();
                tg.enableClosingConfirmation();
            }
        }

        // LocalStorage dan yuklash
        window.storage?.loadUserState();

        // UI yangilash
        this.updateUserProfile();
        this.updateUIFromUserState();

        console.log('✅ UI Manager initialized');
    },

    initTabNavigation: function() {
        console.log('📱 Tab navigation initializing...');

        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Active tab o'zgartirish
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                window.gameState.currentTab = tabName;

                // Content ko'rsatish
                contents.forEach(c => {
                    c.classList.toggle('active', c.id === tabName + 'Tab');
                });

                // Tabga mos ma'lumot yuklash
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

    // ==================== PROFILE UPDATE ====================
    updateUserProfile: function() {
        const user = window.tgUserGlobal || {};
        const name = user.first_name || 'Foydalanuvchi';

        // Avatar
        ['myAvatar', 'profileAvatar'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.src = user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`;
                el.onerror = function() {
                    this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`;
                };
            }
        });

        // Ism va username
        ['myName', 'profileName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = name;
        });

        ['myUsername', 'profileUsername'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '@' + (user.username || 'username');
        });

        // Bio
        const bioEl = document.getElementById('profileBio');
        if (bioEl) bioEl.textContent = window.userState.bio || 'Bio kiritilmagan';
    },

    updateUIFromUserState: function() {
        console.log('🔄 UI user state bo\'yicha yangilanmoqda');

        // Tangalar
        ['coinsCount', 'shopCoinsCount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = window.userState.coins || 100;
        });

        // Level
        const levelEl = document.getElementById('levelCount');
        if (levelEl) levelEl.textContent = window.userState.level || 1;

        // Super Like
        const superEl = document.getElementById('superLikeCount');
        if (superEl) superEl.textContent = window.userState.dailySuperLikes || 3;

        // Profil statistikasi
        const statsMap = {
            myMatches: 'matches',
            mutualMatchesCount: 'mutualMatchesCount',
            myLikes: 'totalLikes',
            statRating: 'rating',
            statMatches: 'matches',
            statDuels: 'duels',
            mutualMatchesProfile: 'mutualMatchesCount',
            statFriends: 'friendsCount'
        };

        Object.entries(statsMap).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = window.userState[key] || 0;
        });

        // G'alaba foizi
        const winRateEl = document.getElementById('statWinRate');
        if (winRateEl && window.userState.duels > 0) {
            const rate = Math.round((window.userState.wins / window.userState.duels) * 100);
            winRateEl.textContent = rate + '%';
        } else if (winRateEl) {
            winRateEl.textContent = '0%';
        }

        console.log('✅ UI yangilandi');
    },

    // ==================== OPPONENT INFO ====================
    updateOpponentInfo: function(opponent) {
        if (!opponent) return;

        const avatar = document.getElementById('opponentAvatar');
        if (avatar) {
            avatar.src = opponent.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name)}&background=667eea&color=fff`;
            avatar.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name)}&background=667eea&color=fff`;
            };
        }

        document.getElementById('opponentName').textContent = opponent.name || 'Raqib';
        document.getElementById('opponentUsername').textContent = '@' + (opponent.username || 'username');
        document.getElementById('opponentRating').textContent = opponent.rating || 1500;
        document.getElementById('opponentMatches').textContent = opponent.matches || 0;
        document.getElementById('opponentLevel').textContent = opponent.level || 1;
    },

    // ==================== SCREEN MANAGEMENT ====================
    showScreen: function(screenName) {
        console.log(`🔄 Ekran o'zgartirilmoqda: ${screenName}`);

        const screens = ['welcomeScreen', 'queueScreen', 'duelScreen'];
        screens.forEach(s => {
            const el = document.getElementById(s);
            if (el) el.classList.toggle('hidden', s !== screenName);
        });
    },

    updateQueueStatus: function(message) {
        const statusEl = document.getElementById('queueStatus');
        const countEl = document.getElementById('waitingCount');
        if (statusEl) statusEl.textContent = message || 'Raqib izlanmoqda...';
        if (countEl) countEl.textContent = '1'; // serverdan kelguncha
    },
    
    showScreen: function(screenName) {
        ['welcomeScreen', 'queueScreen', 'duelScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', id !== screenName);
        });
    },

    updateDuelStatus: function(message) {
        const el = document.getElementById('duelStatus');
        if (el) el.textContent = message;
    },

    // ==================== FRIENDS LIST ====================
    loadFriendsList: function() {
        console.log('👥 Do\'stlar ro\'yxati yuklanmoqda...');

        const listEl = document.getElementById('friendsList');
        const noFriendsEl = document.getElementById('noFriends');
        const countEl = document.getElementById('friendsCount');
        const onlineCountEl = document.getElementById('onlineFriendsCount');

        if (!listEl || !noFriendsEl) return;

        // Serverdan olish (real loyihada socket.emit('get_friends_list'))
        const friends = window.storage?.loadFriendsList() || [];

        listEl.innerHTML = '';

        if (friends.length === 0) {
            noFriendsEl.classList.remove('hidden');
            if (countEl) countEl.textContent = '0';
            if (onlineCountEl) onlineCountEl.textContent = '0';
            return;
        }

        noFriendsEl.classList.add('hidden');

        const onlineCount = friends.filter(f => f.online).length;
        if (countEl) countEl.textContent = friends.length;
        if (onlineCountEl) onlineCountEl.textContent = onlineCount;

        friends.forEach(friend => {
            const item = document.createElement('div');
            item.className = 'friend-item';
            item.innerHTML = `
                <img src="${friend.photo}" class="friend-avatar" alt="${friend.name}">
                <div class="friend-info">
                    <div class="friend-name">
                        ${friend.name}
                        ${friend.gender === 'male' ? '<span class="gender-badge gender-male-badge"><i class="fas fa-mars"></i></span>' : 
                          friend.gender === 'female' ? '<span class="gender-badge gender-female-badge"><i class="fas fa-venus"></i></span>' : ''}
                    </div>
                    <div class="friend-username">@${friend.username || 'username'}</div>
                    <div class="friend-stats">
                        <span><i class="fas fa-trophy"></i> ${friend.rating || 1500}</span>
                        <span><i class="fas fa-heart"></i> ${friend.matches || 0}</span>
                    </div>
                    <div class="friend-status ${friend.online ? 'status-online' : 'status-offline'}">
                        <i class="fas fa-circle"></i> ${friend.online ? 'Online' : 'Offline'}
                    </div>
                </div>
            `;

            item.addEventListener('click', () => {
                if (friend.online) {
                    window.modalManager?.showChatModal?.(friend);
                } else {
                    window.utils?.showNotification('Offline', `${friend.name} hozir online emas`);
                }
            });

            listEl.appendChild(item);
        });
    },

    // ==================== SHOP ====================
    loadShopItems: function() {
        const list = document.getElementById('shopItemsList');
        if (!list) return;

        const items = [
            { id: 'superlike_10', name: '10 ta SUPER LIKE', desc: 'Kunlik limit +10', price: 150, icon: '💎' },
            { id: 'coins_500', name: '500 tanga', desc: 'Tezroq rivojlaning', price: 99, icon: '🪙' },
            { id: 'coins_1500', name: '1500 tanga', desc: 'O\'rta paket', price: 249, icon: '💰' },
            { id: 'coins_3000', name: '3000 tanga', desc: 'Eng yaxshi taklif', price: 499, icon: '💵' }
        ];

        list.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.desc}</div>
                </div>
                <button class="shop-item-buy" onclick="uiManager.buyItem('${item.id}')">
                    ${item.price} tanga
                </button>
            `;
            list.appendChild(div);
        });
    },

    buyItem: function(itemId) {
        const prices = { superlike_10: 150, coins_500: 99, coins_1500: 249, coins_3000: 499 };
        const price = prices[itemId];

        if (window.userState.coins < price) {
            window.utils?.showNotification('Yetarli tanga yo\'q', `Sizda ${window.userState.coins} tanga bor`);
            return;
        }

        window.userState.coins -= price;
        if (itemId === 'superlike_10') window.userState.dailySuperLikes += 10;

        window.storage?.saveUserState();
        this.updateUIFromUserState();
        window.utils?.showNotification('Sotib olindi!', 'Mahsulot muvaffaqiyatli sotib olindi');
    },

    // ==================== LEADERBOARD & QUESTS ====================
    loadLeaderboard: function() {
        const list = document.getElementById('leaderboardList');
        if (!list) return;

        // Mock data
        const leaders = [
            { name: 'Ali Vali', rating: 2450 },
            { name: 'Zarina', rating: 2310 },
            { name: 'Sherzod', rating: 2180 }
        ];

        list.innerHTML = '';
        leaders.forEach((l, i) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-item';
            div.innerHTML = `
                <div class="leaderboard-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${i+1}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${l.name}</div>
                    <div class="leaderboard-stats"><i class="fas fa-trophy"></i> ${l.rating}</div>
                </div>
            `;
            list.appendChild(div);
        });
    },

    loadProfileQuests: function() {
        const list = document.getElementById('profileQuestsList');
        if (!list) return;

        const quests = [
            { title: '3 ta duel o\'ynash', progress: 1, total: 3, reward: '+50 tanga' },
            { title: '1 ta match topish', progress: 0, total: 1, reward: '+100 tanga' }
        ];

        list.innerHTML = '';
        quests.forEach(q => {
            const percent = Math.round((q.progress / q.total) * 100);
            const div = document.createElement('div');
            div.className = 'quest-item';
            div.innerHTML = `
                <div class="quest-info">
                    <div class="quest-title">${q.title}</div>
                    <div class="quest-progress">${q.progress}/${q.total}</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
                </div>
                <div class="quest-reward">${q.reward}</div>
            `;
            list.appendChild(div);
        });
    }
};

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM yuklandi, UI Manager ishga tushmoqda...');
    setTimeout(() => {
        window.uiManager?.initUserProfile();
        window.uiManager?.initTabNavigation();
        console.log('✅ UI Manager to\'liq ishga tushdi');
    }, 500);
});