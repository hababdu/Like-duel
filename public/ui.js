// ==================== UI MANAGEMENT ====================

const UIManager = {
    // ==================== SCREEN MANAGEMENT ====================
    
    /**
     * Show specific screen
     */
    showScreen: function(screen) {
        console.log(`📱 Ekran o'zgartirildi: ${screen}`);
        
        // Hide all screens
        [window.elements?.welcomeScreen, 
         window.elements?.queueScreen, 
         window.elements?.duelScreen, 
         window.elements?.matchScreen].forEach(s => {
            if (s) s.classList.add('hidden');
        });
        
        // Show selected screen
        if (screen === 'welcome' && window.elements?.welcomeScreen) {
            window.elements.welcomeScreen.classList.remove('hidden');
        }
        if (screen === 'queue' && window.elements?.queueScreen) {
            window.elements.queueScreen.classList.remove('hidden');
        }
        if (screen === 'duel' && window.elements?.duelScreen) {
            window.elements.duelScreen.classList.remove('hidden');
        }
        if (screen === 'match' && window.elements?.matchScreen) {
            window.elements.matchScreen.classList.remove('hidden');
        }
    },
    
    // ==================== PROFILE MANAGEMENT ====================
    
    /**
     * Initialize user profile
     */
    initUserProfile: function() {
        console.log('👤 Profil yuklanmoqda...');
        
        let tgUser = {};
        
        try {
            if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
                tgUser = Telegram.WebApp.initDataUnsafe.user || {};
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                
                if (tgUser.username) {
                    window.userState.telegramUsername = tgUser.username;
                }
            }
        } catch (error) {
            console.log('ℹ️ Telegram Web App mavjud emas, test rejimida');
        }
        
        // Test mode
        if (!tgUser.id) {
            tgUser = {
                id: 'test_' + Date.now(),
                first_name: 'Test Foydalanuvchi',
                username: 'test_user',
                photo_url: null
            };
        }
        
        // Set user info
        const userPhoto = tgUser.photo_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`;
        const userName = tgUser.first_name || 'Foydalanuvchi';
        const userUsername = tgUser.username ? '@' + tgUser.username : '@foydalanuvchi';
        
        // Update elements
        if (window.elements?.myAvatar) window.elements.myAvatar.src = userPhoto;
        if (window.elements?.myName) window.elements.myName.textContent = userName;
        if (window.elements?.myUsername) window.elements.myUsername.textContent = userUsername;
        if (window.elements?.profileAvatar) window.elements.profileAvatar.src = userPhoto;
        if (window.elements?.profileName) window.elements.profileName.textContent = userName;
        if (window.elements?.profileUsername) window.elements.profileUsername.textContent = userUsername;
        
        window.tgUserGlobal = tgUser;
        
        // Update UI
        this.updateUIFromUserState();
        
        // Add filter to welcome screen
        this.addFilterToWelcomeScreen();
        
        // Show gender modal if not selected
        if (!window.userState.hasSelectedGender) {
            console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
            setTimeout(() => {
                this.showGenderModal(true);
            }, 1000);
        }
        
        return tgUser;
    },
    
    /**
     * Update UI from user state
     */
    updateUIFromUserState: function() {
        console.log('🎨 UI yangilanmoqda...');
        
        // Add gender badges
        if (window.userState.hasSelectedGender && window.userState.currentGender) {
            this.addGenderBadge(window.elements?.myName, window.userState.currentGender);
            this.addGenderBadge(window.elements?.profileName, window.userState.currentGender);
        }
        
        // Update statistics
        if (window.elements?.coinsCount) window.elements.coinsCount.textContent = window.userState.coins;
        if (window.elements?.levelCount) window.elements.levelCount.textContent = window.userState.level;
        if (window.elements?.shopCoinsCount) window.elements.shopCoinsCount.textContent = window.userState.coins;
        if (window.elements?.statRating) window.elements.statRating.textContent = window.userState.rating;
        if (window.elements?.statMatches) window.elements.statMatches.textContent = window.userState.matches;
        if (window.elements?.myMatches) window.elements.myMatches.textContent = window.userState.matches;
        if (window.elements?.statDuels) window.elements.statDuels.textContent = window.userState.duels;
        if (window.elements?.mutualMatchesCount) window.elements.mutualMatchesCount.textContent = window.userState.mutualMatchesCount;
        if (window.elements?.mutualMatchesProfile) window.elements.mutualMatchesProfile.textContent = window.userState.mutualMatchesCount;
        if (window.elements?.statFriends) window.elements.statFriends.textContent = window.userState.friendsCount;
        
        // Calculate win rate
        const winRate = window.userState.duels > 0 ? 
            Math.round((window.userState.wins / window.userState.duels) * 100) : 0;
        if (window.elements?.statWinRate) window.elements.statWinRate.textContent = winRate + '%';
        
        if (window.elements?.myLikes) window.elements.myLikes.textContent = window.userState.totalLikes;
        if (window.elements?.superLikeCount) window.elements.superLikeCount.textContent = window.userState.dailySuperLikes;
        
        // Update bio
        if (window.elements?.profileBio && window.userState.bio) {
            window.elements.profileBio.textContent = window.userState.bio;
        }
        
        // Update start button
        if (window.elements?.startBtn) {
            if (window.userState.hasSelectedGender) {
                window.elements.startBtn.disabled = false;
                window.elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
                window.elements.startBtn.classList.remove('disabled');
            } else {
                window.elements.startBtn.disabled = true;
                window.elements.startBtn.textContent = 'Avval gender tanlang';
                window.elements.startBtn.classList.add('disabled');
            }
        }
        
        // Update filter
        if (window.gameState) {
            window.gameState.currentFilter = window.userState.filter;
        }
    },
    
    /**
     * Add gender badge to element
     */
    addGenderBadge: function(element, gender) {
        if (!element || !gender) return;
        
        // Remove existing badges
        const oldBadges = element.querySelectorAll('.gender-badge');
        oldBadges.forEach(badge => badge.remove());
        
        // Create new badge
        const badge = document.createElement('span');
        badge.className = `gender-badge gender-${gender}-badge`;
        
        if (gender === 'male') {
            badge.innerHTML = '<i class="fas fa-mars"></i> Erkak';
        } else if (gender === 'female') {
            badge.innerHTML = '<i class="fas fa-venus"></i> Ayol';
        } else {
            badge.innerHTML = '<i class="fas fa-users"></i> Hammasi';
        }
        
        element.appendChild(badge);
    },
    
    // ==================== FILTER MANAGEMENT ====================
    
    /**
     * Create filter options
     */
    createFilterOptions: function() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'gender-filter-container';
        
        const activeFilter = window.gameState?.currentFilter || 'not_specified';
        
        filterContainer.innerHTML = `
            <div class="gender-filter-options">
                <div class="gender-filter-option ${activeFilter === 'male' ? 'active' : ''}" data-filter="male">
                    <div class="gender-filter-icon male">
                        <i class="fas fa-mars"></i>
                    </div>
                </div>
                
                <div class="gender-filter-option ${activeFilter === 'female' ? 'active' : ''}" data-filter="female">
                    <div class="gender-filter-icon female">
                        <i class="fas fa-venus"></i>
                    </div>
                </div>
                
                <div class="gender-filter-option ${activeFilter === 'not_specified' ? 'active' : ''}" data-filter="not_specified">
                    <div class="gender-filter-icon all">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        const filterOptions = filterContainer.querySelectorAll('.gender-filter-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                const filter = option.dataset.filter;
                this.selectFilter(filter);
            });
        });
        
        return filterContainer;
    },
    
    /**
     * Select filter
     */
    selectFilter: function(filter) {
        console.log(`🎯 Filter tanlash: ${filter}`);
        
        window.gameState.currentFilter = filter;
        window.userState.filter = filter;
        window.storage?.setFilter?.(filter);
        
        // Update UI
        const filterOptions = document.querySelectorAll('.gender-filter-option');
        filterOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.filter === filter) {
                option.classList.add('active');
            }
        });
        
        window.utils?.showNotification('Filter o\'zgartirildi', 
            filter === 'male' ? 'Endi faqat erkaklar bilan duel!' : 
            filter === 'female' ? 'Endi faqat ayollar bilan duel!' : 
            'Endi hamma bilan duel!');
        
        // Update server if connected
        if (window.gameState.socket && window.gameState.isConnected) {
            window.socketManager?.updateProfile?.({ filter: filter });
            
            if (window.gameState.isInQueue) {
                window.gameState.socket.emit('leave_queue');
                setTimeout(() => {
                    window.gameState.socket.emit('enter_queue');
                }, 500);
            }
        }
    },
    
    /**
     * Add filter to welcome screen
     */
    addFilterToWelcomeScreen: function() {
        const profileCard = document.getElementById('profileCard');
        if (!profileCard) return;
        
        // Remove existing filter
        const existingFilter = profileCard.querySelector('.gender-filter-container');
        if (existingFilter) {
            existingFilter.remove();
        }
        
        const startBtn = profileCard.querySelector('.start-btn');
        const filterElement = this.createFilterOptions();
        
        if (startBtn && startBtn.parentNode) {
            startBtn.parentNode.insertBefore(filterElement, startBtn);
        }
    },
    
    // ==================== GENDER SELECTION ====================
    
    /**
     * Select gender
     */
    selectGender: function(gender) {
        console.log(`🎯 Gender tanlash: ${gender}`);
        
        window.userState.currentGender = gender;
        window.userState.hasSelectedGender = true;
        
        window.storage?.saveUserState?.();
        this.updateUIFromUserState();
        
        this.hideGenderModal();
        
        // Notify server
        if (window.gameState.socket && window.gameState.isConnected) {
            window.gameState.socket.emit('select_gender', { gender: gender });
        } else {
            window.socketManager?.connectToServer?.();
        }
        
        window.utils?.showNotification('🎉 Jins tanlandi', 
            gender === 'male' ? 'Faqat ayollar bilan duel!' : 
            gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
            'Hamma bilan duel!');
    },
    
    /**
     * Show gender modal
     */
    showGenderModal: function(mandatory = true) {
        console.log(`🎯 Gender modali ko'rsatilmoqda`);
        
        if (!window.elements?.genderModal) return;
        
        window.elements.genderModal.classList.add('active');
        
        if (mandatory && window.elements?.genderWarning) {
            window.elements.genderWarning.classList.remove('hidden');
        }
    },
    
    /**
     * Hide gender modal
     */
    hideGenderModal: function() {
        if (window.elements?.genderModal) {
            window.elements.genderModal.classList.remove('active');
        }
        if (window.elements?.genderWarning) {
            window.elements.genderWarning.classList.add('hidden');
        }
    },
    
    // ==================== CHAT MANAGEMENT ====================
    
    /**
     * Open chat
     */
    openChat: function(partner) {
        if (!partner) return;
        
        window.gameState.isChatModalOpen = true;
        
        // Update chat modal
        if (window.elements?.chatPartnerAvatar) {
            window.elements.chatPartnerAvatar.src = partner.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=3498db&color=fff`;
        }
        
        if (window.elements?.chatPartnerName) {
            window.elements.chatPartnerName.textContent = partner.name;
        }
        
        if (window.elements?.chatUsername && partner.username) {
            window.elements.chatUsername.textContent = `@${partner.username}`;
        } else if (window.elements?.chatUsername) {
            window.elements.chatUsername.textContent = '';
        }
        
        if (window.elements?.chatTitle) {
            window.elements.chatTitle.textContent = `${partner.name} bilan chat`;
        }
        
        if (window.elements?.chatModal) {
            window.elements.chatModal.classList.add('active');
        }
    },
    
    /**
     * Open Telegram chat
     */
    openTelegramChat: function(username) {
        if (!username) {
            window.utils?.showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
            return;
        }
        
        const telegramUrl = `https://t.me/${username.replace('@', '')}`;
        
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.openTelegramLink(telegramUrl);
        } else {
            window.open(telegramUrl, '_blank');
        }
    },
    
    /**
     * Close chat modal
     */
    closeChatModal: function() {
        console.log('💬 Chat modali yopilmoqda');
        
        window.gameState.isChatModalOpen = false;
        if (window.elements?.chatModal) {
            window.elements.chatModal.classList.remove('active');
        }
        
        // Return to match screen if available
        if (window.gameState.currentPartner) {
            this.showScreen('match');
        } else {
            window.returnToMenu?.();
        }
    },
    
    // ==================== FRIENDS MANAGEMENT ====================
    
    /**
     * Load friends list
     */
    loadFriendsList: function() {
        if (window.gameState.socket && window.gameState.isConnected) {
            window.socketManager?.getFriendsList?.();
        } else {
            // Test data
            const testFriends = [
                {
                    id: 'test_1',
                    name: 'Ali',
                    username: 'ali_test',
                    photo: 'https://ui-avatars.com/api/?name=Ali&background=3498db&color=fff',
                    online: true,
                    lastActive: new Date(),
                    gender: 'male',
                    rating: 1600,
                    matches: 15,
                    isMutual: true
                }
            ];
            
            this.updateFriendsListUI({
                friends: testFriends,
                total: testFriends.length,
                online: testFriends.filter(f => f.online).length
            });
        }
    },
    
    /**
     * Update friends list UI
     */
    updateFriendsListUI: function(data) {
        const friends = data.friends;
        const mutualFriends = friends.filter(f => f.isMutual);
        
        if (!window.elements?.friendsList) return;
        
        if (friends.length === 0) {
            window.elements.friendsList.innerHTML = '';
            if (window.elements?.noFriends) {
                window.elements.noFriends.classList.remove('hidden');
            }
        } else {
            if (window.elements?.noFriends) {
                window.elements.noFriends.classList.add('hidden');
            }
            
            window.elements.friendsList.innerHTML = friends.map(friend => `
                <div class="friend-item ${friend.isMutual ? 'mutual' : ''}">
                    <img src="${friend.photo}" 
                         alt="${friend.name}" class="friend-avatar">
                    <div class="friend-info">
                        <div class="friend-name">
                            ${friend.name}
                            ${friend.isMutual ? '<span class="mutual-badge">❤️ Do\'st</span>' : ''}
                        </div>
                        <div class="friend-username">@${friend.username}</div>
                        <div class="friend-stats">
                            <span><i class="fas fa-trophy"></i> ${friend.rating}</span>
                            <span><i class="fas fa-heart"></i> ${friend.matches}</span>
                        </div>
                        <div class="friend-status ${friend.online ? 'status-online' : 'status-offline'}">
                            ${friend.online ? 'Onlayn' : 'Oxirgi faol: ' + window.utils?.formatDate(friend.lastActive)}
                        </div>
                    </div>
                    ${friend.isMutual ? 
                        `<button class="match-option-btn" style="padding: 8px 12px; min-width: 80px;" 
                                onclick="openChatFromFriend(${JSON.stringify(friend).replace(/"/g, '&quot;')})">
                            💬 Chat
                        </button>` : 
                        `<button class="match-option-btn" style="padding: 8px 12px; min-width: 80px; background: #95a5a6;" 
                                onclick="window.utils?.showNotification('Xabar', 'Match bo\\'lmaganingiz uchun chat ochib bo\\'lmaydi')">
                            ⏳
                        </button>`
                    }
                </div>
            `).join('');
        }
        
        // Update counts
        if (window.elements?.friendsCount) {
            window.elements.friendsCount.textContent = mutualFriends.length;
        }
        
        if (window.elements?.onlineFriendsCount) {
            const onlineCount = mutualFriends.filter(f => f.online).length;
            window.elements.onlineFriendsCount.textContent = onlineCount;
        }
    },
    
    /**
     * Open chat from friend
     */
    openChatFromFriend: function(friend) {
        this.openChat(friend);
    },
    
    // ==================== SHOP MANAGEMENT ====================
    
    /**
     * Load shop items
     */
    loadShopItems: function() {
        const items = [
            { id: 1, name: '10 Super Like', price: 100, icon: '💖', description: '10 ta kunlik SUPER LIKE' },
            { id: 2, name: '50 Super Like', price: 450, icon: '💎', description: '50 ta kunlik SUPER LIKE' },
            { id: 3, name: '100 Super Like', price: 800, icon: '👑', description: '100 ta kunlik SUPER LIKE' },
            { id: 4, name: 'Premium Profil', price: 300, icon: '⭐', description: '30 kunlik premium status' }
        ];
        
        if (!window.elements?.shopItemsList) return;
        
        window.elements.shopItemsList.innerHTML = items.map(item => `
            <div class="shop-item">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                </div>
                <button class="shop-item-buy" onclick="buyItem(${item.id})" 
                        ${window.userState.coins < item.price ? 'disabled' : ''}>
                    <i class="fas fa-coins"></i> ${item.price}
                </button>
            </div>
        `).join('');
    },
    
    /**
     * Buy item
     */
    buyItem: function(itemId) {
        const items = [
            { id: 1, price: 100 },
            { id: 2, price: 450 },
            { id: 3, price: 800 },
            { id: 4, price: 300 }
        ];
        
        const item = items.find(i => i.id === itemId);
        if (!item) return;
        
        if (window.userState.coins >= item.price) {
            window.userState.coins -= item.price;
            window.storage?.saveUserState?.();
            this.updateUIFromUserState();
            window.utils?.showNotification('✅ Xarid qilindi', 'Mahsulot muvaffaqiyatli sotib olindi!');
        } else {
            window.utils?.showNotification('⚠️ Yetarli emas', 'Coinlaringiz yetarli emas!');
        }
    },
    
    // ==================== LEADERBOARD MANAGEMENT ====================
    
    /**
     * Load leaderboard
     */
    loadLeaderboard: function() {
        const leaders = [
            // Add leaderboard data here
        ];
        
        if (!window.elements?.leaderboardList) return;
        
        window.elements.leaderboardList.innerHTML = leaders.map(leader => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${leader.rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">
                        ${leader.name}
                        <span class="gender-badge gender-${leader.gender}-badge">
                            <i class="fas fa-${leader.gender === 'male' ? 'mars' : 'venus'}"></i>
                            ${leader.gender === 'male' ? 'Erkak' : 'Ayol'}
                        </span>
                    </div>
                    <div class="leaderboard-stats">
                        <span><i class="fas fa-trophy"></i> ${leader.rating}</span>
                        <span><i class="fas fa-heart"></i> ${leader.matches}</span>
                        <span><i class="fas fa-users"></i> ${leader.friends}</span>
                    </div>
                </div>
                <div class="leaderboard-value">${leader.rating}</div>
            </div>
        `).join('');
        
        if (window.elements?.leaderboardUpdated) {
            window.elements.leaderboardUpdated.textContent = 'hozir';
        }
    },
    
    // ==================== QUESTS MANAGEMENT ====================
    
    /**
     * Load profile quests
     */
    loadProfileQuests: function() {
        const quests = [
            { 
                id: 1, 
                title: '3 ta duel o\'ynash', 
                progress: Math.min(window.userState.duels, 3), 
                total: 3, 
                reward: 50 
            },
            { 
                id: 2, 
                title: '5 ta like berish', 
                progress: Math.min(window.userState.totalLikes, 5), 
                total: 5, 
                reward: 30 
            },
            { 
                id: 3, 
                title: '1 ta match olish', 
                progress: Math.min(window.userState.matches, 1), 
                total: 1, 
                reward: 100 
            },
            { 
                id: 4, 
                title: '1 ta do\'st orttirish', 
                progress: Math.min(window.userState.mutualMatchesCount, 1), 
                total: 1, 
                reward: 200 
            }
        ];
        
        if (!window.elements?.profileQuestsList) return;
        
        window.elements.profileQuestsList.innerHTML = quests.map(quest => `
            <div class="quest-item">
                <div class="quest-info">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-progress">${quest.progress}/${quest.total}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(quest.progress / quest.total) * 100}%"></div>
                    </div>
                </div>
                <div class="quest-reward">
                    <i class="fas fa-coins"></i> ${quest.reward}
                </div>
            </div>
        `).join('');
    },
    
    // ==================== STATUS UPDATES ====================
    
    /**
     * Update queue status
     */
    updateQueueStatus: function(msg) {
        if (window.elements?.queueStatus) {
            window.elements.queueStatus.textContent = msg;
        }
    },
    
    /**
     * Update duel status
     */
    updateDuelStatus: function(msg) {
        if (window.elements?.duelStatus) {
            window.elements.duelStatus.textContent = msg;
        }
    },
    
    // ==================== TAB NAVIGATION ====================
    
    /**
     * Initialize tab navigation
     */
    initTabNavigation: function() {
        const tabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show selected tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabName + 'Tab') {
                        content.classList.add('active');
                    }
                });
                
                // Update game state
                if (window.gameState) {
                    window.gameState.currentTab = tabName;
                }
                
                // Load tab-specific content
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
    }
};

// Export to global scope
window.uiManager = UIManager;