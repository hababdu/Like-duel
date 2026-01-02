// ==================== GLOBAL O'ZGARUVCHILAR ====================
let socket = null;
let currentUser = null;
let currentScreen = 'welcome';
let gameState = {
    isConnected: false,
    isInQueue: false,
    isInDuel: false,
    currentDuelId: null,
    currentPartner: null,
    timerInterval: null,
    timeLeft: 20,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
};

let userData = {
    coins: 100,
    level: 1,
    rating: 1500,
    matches: 0,
    duels: 0,
    wins: 0,
    totalLikes: 0,
    mutualMatches: 0,
    friends: 0,
    dailySuperLikes: 3,
    gender: null,
    filter: 'not_specified',
    bio: '',
    hasSelectedGender: false
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    // Header
    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    shopCoinsCount: document.getElementById('shopCoinsCount'),
    
    // Welcome screen
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    mutualMatchesCount: document.getElementById('mutualMatchesCount'),
    myLikes: document.getElementById('myLikes'),
    
    // Buttons
    connectBtn: document.getElementById('connectBtn'),
    enterQueueBtn: document.getElementById('enterQueueBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    skipBtn: document.getElementById('skipBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    
    // Queue screen
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    queueStatus: document.getElementById('queueStatus'),
    
    // Duel screen
    opponentAvatar: document.getElementById('opponentAvatar'),
    opponentName: document.getElementById('opponentName'),
    opponentUsername: document.getElementById('opponentUsername'),
    opponentRating: document.getElementById('opponentRating'),
    opponentMatches: document.getElementById('opponentMatches'),
    opponentLevel: document.getElementById('opponentLevel'),
    superLikeCount: document.getElementById('superLikeCount'),
    timer: document.getElementById('timer'),
    duelStatus: document.getElementById('duelStatus'),
    
    // Match screen
    partnerAvatar: document.getElementById('partnerAvatar'),
    partnerName: document.getElementById('partnerName'),
    partnerUsername: document.getElementById('partnerUsername'),
    matchMessage: document.getElementById('matchMessage'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    
    // Friends screen
    friendsCount: document.getElementById('friendsCount'),
    onlineFriendsCount: document.getElementById('onlineFriendsCount'),
    friendsList: document.getElementById('friendsList'),
    noFriends: document.getElementById('noFriends'),
    
    // Shop screen
    shopItems: document.getElementById('shopItems'),
    
    // Leaderboard screen
    leaderboardList: document.getElementById('leaderboardList'),
    leaderboardUpdated: document.getElementById('leaderboardUpdated'),
    
    // Modals
    genderModal: document.getElementById('genderModal'),
    profileModal: document.getElementById('profileModal'),
    chatModal: document.getElementById('chatModal'),
    statsModal: document.getElementById('statsModal'),
    
    // Profile edit
    editBio: document.getElementById('editBio'),
    editGender: document.getElementById('editGender'),
    editFilter: document.getElementById('editFilter'),
    
    // Chat modal
    chatPartnerAvatar: document.getElementById('chatPartnerAvatar'),
    chatPartnerName: document.getElementById('chatPartnerName'),
    chatPartnerUsername: document.getElementById('chatPartnerUsername'),
    
    // Stats modal
    statRating: document.getElementById('statRating'),
    statMatches: document.getElementById('statMatches'),
    statDuels: document.getElementById('statDuels'),
    statWinRate: document.getElementById('statWinRate'),
    statMutualMatches: document.getElementById('statMutualMatches'),
    statFriendsCount: document.getElementById('statFriendsCount'),
    detailTotalLikes: document.getElementById('detailTotalLikes'),
    detailCoins: document.getElementById('detailCoins'),
    detailLevel: document.getElementById('detailLevel'),
    detailDailySuperLikes: document.getElementById('detailDailySuperLikes'),
    
    // Notification
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 LIKE DUEL - DOM yuklandi');
    
    // Load saved data
    loadUserData();
    
    // Initialize Telegram WebApp
    initTelegram();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize UI
    updateUI();
    
    // Auto-connect if we have user data
    if (currentUser) {
        setTimeout(() => {
            connectToServer();
        }, 1000);
    }
});

// ==================== TELEGRAM INIT ====================
function initTelegram() {
    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser) {
                currentUser = {
                    id: tgUser.id.toString(),
                    firstName: tgUser.first_name || 'Foydalanuvchi',
                    username: tgUser.username || '',
                    photoUrl: tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`
                };
                
                // Update profile display
                if (elements.myAvatar) {
                    elements.myAvatar.src = currentUser.photoUrl;
                }
                if (elements.myName) {
                    elements.myName.textContent = currentUser.firstName;
                }
                if (elements.myUsername) {
                    elements.myUsername.textContent = currentUser.username ? '@' + currentUser.username : '';
                }
                
                console.log('✅ Telegram foydalanuvchi:', currentUser.firstName);
            }
        } else {
            // Test user for development
            currentUser = {
                id: 'test_' + Date.now(),
                firstName: 'Test Foydalanuvchi',
                username: 'testuser',
                photoUrl: 'https://ui-avatars.com/api/?name=Test+User&background=667eea&color=fff'
            };
            console.log('🔄 Test rejimi faollashtirildi');
        }
    } catch (error) {
        console.log('⚠️ Telegram WebApp mavjud emas:', error);
        // Test user for development
        currentUser = {
            id: 'test_' + Date.now(),
            firstName: 'Test Foydalanuvchi',
            username: 'testuser',
            photoUrl: 'https://ui-avatars.com/api/?name=Test+User&background=667eea&color=fff'
        };
    }
}

// ==================== DATA MANAGEMENT ====================
function loadUserData() {
    const saved = localStorage.getItem('likeDuelUserData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            userData = { ...userData, ...data };
            console.log('📁 Foydalanuvchi ma\'lumotlari yuklandi');
        } catch (e) {
            console.error('❌ Ma\'lumotlarni yuklashda xato:', e);
        }
    }
}

function saveUserData() {
    try {
        localStorage.setItem('likeDuelUserData', JSON.stringify(userData));
    } catch (e) {
        console.error('❌ Ma\'lumotlarni saqlashda xato:', e);
    }
}

// ==================== UI FUNCTIONS ====================
function updateUI() {
    // Update header
    if (elements.coinsCount) elements.coinsCount.textContent = userData.coins;
    if (elements.levelCount) elements.levelCount.textContent = userData.level;
    if (elements.shopCoinsCount) elements.shopCoinsCount.textContent = userData.coins;
    
    // Update profile stats
    if (elements.myMatches) elements.myMatches.textContent = userData.matches;
    if (elements.mutualMatchesCount) elements.mutualMatchesCount.textContent = userData.mutualMatches;
    if (elements.myLikes) elements.myLikes.textContent = userData.totalLikes;
    
    // Update super like count
    if (elements.superLikeCount) elements.superLikeCount.textContent = userData.dailySuperLikes;
    
    // Update connection button
    if (elements.connectBtn) {
        if (gameState.isConnected) {
            elements.connectBtn.innerHTML = '<i class="fas fa-check"></i> Ulandi';
            elements.connectBtn.classList.add('connected');
            elements.enterQueueBtn.disabled = !userData.hasSelectedGender;
        } else {
            elements.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Serverga Ulanish';
            elements.connectBtn.classList.remove('connected');
            elements.enterQueueBtn.disabled = true;
        }
    }
    
    // Update gender filter options
    updateGenderFilter();
}

function updateGenderFilter() {
    const filterOptions = document.querySelectorAll('.gender-filter-option');
    filterOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.filter === userData.filter) {
            option.classList.add('active');
        }
    });
}

// ==================== SCREEN MANAGEMENT ====================
function switchScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenName;
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });
        
        // Load screen-specific data
        switch(screenName) {
            case 'friends':
                loadFriends();
                break;
            case 'shop':
                loadShop();
                break;
            case 'leaderboard':
                loadLeaderboard();
                break;
        }
    }
}

// ==================== SOCKET.IO FUNCTIONS ====================
function connectToServer() {
    if (!currentUser) {
        showNotification('Xato', 'Foydalanuvchi ma\'lumotlari topilmadi');
        return;
    }
    
    if (socket && gameState.isConnected) {
        showNotification('Diqqat', 'Allaqachon serverga ulangansiz');
        return;
    }
    
    console.log('🔗 Serverga ulanmoqda...');
    
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    const socketUrl = isLocalhost ? 'http://localhost:3000' : 'https://like-duel.onrender.com';
    
    console.log('📡 Socket URL:', socketUrl);
    
    // Disconnect existing socket
    if (socket) {
        socket.disconnect();
    }
    
    // Create new connection
    socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000
    });
    
    // Setup event handlers
    setupSocketEvents();
    
    // Update UI
    updateQueueStatus('Serverga ulanmoqda...');
}

function setupSocketEvents() {
    if (!socket) return;
    
    // Connection events
    socket.on('connect', () => {
        console.log('✅ Serverga ulandi');
        gameState.isConnected = true;
        gameState.reconnectAttempts = 0;
        
        // Send auth data
        socket.emit('auth', {
            userId: currentUser.id,
            firstName: currentUser.firstName,
            username: currentUser.username,
            photoUrl: currentUser.photoUrl,
            gender: userData.gender,
            hasSelectedGender: userData.hasSelectedGender,
            bio: userData.bio,
            filter: userData.filter
        });
        
        updateUI();
        showNotification('✅ Ulanish', 'Serverga muvaffaqiyatli ulandik');
    });
    
    socket.on('auth_ok', (data) => {
        console.log('✅ Auth OK:', data);
        
        // Update user data from server
        userData.coins = data.coins || userData.coins;
        userData.level = data.level || userData.level;
        userData.rating = data.rating || userData.rating;
        userData.matches = data.matches || userData.matches;
        userData.duels = data.duels || userData.duels;
        userData.wins = data.wins || userData.wins;
        userData.totalLikes = data.totalLikes || userData.totalLikes;
        userData.mutualMatches = data.mutualMatchesCount || userData.mutualMatches;
        userData.friends = data.friendsCount || userData.friends;
        userData.dailySuperLikes = data.dailySuperLikes || userData.dailySuperLikes;
        userData.gender = data.gender || userData.gender;
        userData.hasSelectedGender = data.hasSelectedGender || userData.hasSelectedGender;
        userData.bio = data.bio || userData.bio;
        userData.filter = data.filter || userData.filter;
        
        saveUserData();
        updateUI();
        
        if (!userData.hasSelectedGender) {
            showGenderModal(true);
        }
    });
    
    socket.on('gender_selected', (data) => {
        userData.gender = data.gender;
        userData.hasSelectedGender = true;
        saveUserData();
        updateUI();
        hideGenderModal();
        showNotification('🎉 Jins tanlandi', 'Endi duel o\'ynashingiz mumkin!');
    });
    
    socket.on('show_gender_selection', (data) => {
        showGenderModal(true);
    });
    
    // Queue events
    socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        switchScreen('queue');
        
        if (elements.waitingCount) elements.waitingCount.textContent = data.total;
        if (elements.position) elements.position.textContent = data.position;
    });
    
    socket.on('waiting_count', (data) => {
        if (elements.waitingCount) elements.waitingCount.textContent = data.count;
        if (elements.position && data.position > 0) {
            elements.position.textContent = data.position;
        }
    });
    
    // Duel events
    socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        
        gameState.isInQueue = false;
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        
        // Show opponent info
        if (elements.opponentAvatar) {
            elements.opponentAvatar.src = data.opponent.photo || '';
        }
        if (elements.opponentName) {
            elements.opponentName.textContent = data.opponent.name;
        }
        if (elements.opponentUsername) {
            elements.opponentUsername.textContent = data.opponent.username ? '@' + data.opponent.username : '';
        }
        if (elements.opponentRating) {
            elements.opponentRating.textContent = data.opponent.rating;
        }
        if (elements.opponentMatches) {
            elements.opponentMatches.textContent = data.opponent.matches;
        }
        if (elements.opponentLevel) {
            elements.opponentLevel.textContent = data.opponent.level;
        }
        
        switchScreen('duel');
        startTimer();
    });
    
    // Match events
    socket.on('match', (data) => {
        console.log('🎉 Match!', data);
        
        gameState.isInDuel = false;
        gameState.currentPartner = data.partner;
        
        // Show match screen
        if (elements.partnerAvatar) {
            elements.partnerAvatar.src = data.partner.photo || '';
        }
        if (elements.partnerName) {
            elements.partnerName.textContent = data.partner.name;
        }
        if (elements.partnerUsername) {
            elements.partnerUsername.textContent = data.partner.username ? '@' + data.partner.username : '';
        }
        
        if (data.isMutual) {
            elements.matchMessage.textContent = data.isSuperLike ? 
                '💖 O\'ZARO SUPER LIKE!' : '🎉 O\'ZARO MATCH!';
        } else {
            elements.matchMessage.textContent = '❤️ Bir tomonli Like';
        }
        
        if (elements.rewardCoins) elements.rewardCoins.textContent = data.rewards?.coins || 0;
        if (elements.rewardXP) elements.rewardXP.textContent = data.rewards?.xp || 0;
        
        // Update user data
        userData.coins += data.rewards?.coins || 0;
        userData.matches += data.isMutual ? 1 : 0;
        userData.duels += 1;
        if (data.isMutual) userData.wins += 1;
        userData.totalLikes += 1;
        
        if (data.isMutual && data.isSuperLike) {
            userData.mutualMatches += 1;
            userData.friends += 1;
        }
        
        saveUserData();
        updateUI();
        
        switchScreen('match');
        
        // Show confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    });
    
    socket.on('mutual_match', (data) => {
        console.log('🤝 O\'zaro match qo\'shildi:', data);
        
        userData.mutualMatches = data.mutualMatchesCount || userData.mutualMatches;
        userData.friends = data.friendsCount || userData.friends;
        
        saveUserData();
        updateUI();
        
        if (currentScreen === 'friends') {
            loadFriends();
        }
        
        showNotification('🎉 Do\'st bo\'ldingiz!', `${data.partnerName} bilan o'zaro SUPER LIKE!`);
    });
    
    socket.on('no_match', () => {
        console.log('❌ Match bo\'lmadi');
        showNotification('Match bo\'lmadi', 'Raqibingiz sizni like bermadi');
        returnToMenu();
    });
    
    socket.on('timeout', () => {
        console.log('⏰ Vaqt tugadi');
        showNotification('Vaqt tugadi', 'Duel vaqti tugadi');
        returnToMenu();
    });
    
    socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        showNotification('Raqib chiqib ketdi', 'Raqibingiz duel davomida chiqib ketdi');
        returnToMenu();
    });
    
    socket.on('super_like_used', (data) => {
        userData.dailySuperLikes = data.remaining;
        updateUI();
    });
    
    socket.on('profile_updated', (data) => {
        userData.bio = data.bio || userData.bio;
        userData.gender = data.gender || userData.gender;
        userData.filter = data.filter || userData.filter;
        saveUserData();
        updateUI();
    });
    
    socket.on('error', (data) => {
        console.error('❌ Server xatosi:', data);
        showNotification('Xato', data.message || 'Noma\'lum xato');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Serverdan uzildi');
        gameState.isConnected = false;
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        updateUI();
        
        // Try to reconnect
        setTimeout(() => {
            if (!gameState.isConnected) {
                connectToServer();
            }
        }, 3000);
    });
}

// ==================== GAME FUNCTIONS ====================
function enterQueue() {
    if (!socket || !gameState.isConnected) {
        showNotification('Xato', 'Avval serverga ulanishingiz kerak');
        connectToServer();
        return;
    }
    
    if (!userData.hasSelectedGender) {
        showNotification('Diqqat', 'Avval jins tanlashingiz kerak!');
        showGenderModal(true);
        return;
    }
    
    if (gameState.isInQueue) {
        showNotification('Diqqat', 'Siz allaqachon navbatdasiz');
        return;
    }
    
    socket.emit('enter_queue');
    showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
}

function leaveQueue() {
    if (socket && gameState.isConnected) {
        socket.emit('leave_queue');
    }
    
    gameState.isInQueue = false;
    switchScreen('welcome');
}

function sendVote(choice) {
    if (!socket || !gameState.isInDuel || !gameState.currentDuelId) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }
    
    if (choice === 'super_like' && userData.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        return;
    }
    
    // Disable vote buttons
    [elements.skipBtn, elements.likeBtn, elements.superLikeBtn].forEach(btn => {
        if (btn) btn.disabled = true;
    });
    
    if (elements.duelStatus) {
        elements.duelStatus.textContent = 'Ovoz yuborilmoqda...';
    }
    
    socket.emit('vote', {
        duelId: gameState.currentDuelId,
        choice: choice
    });
}

function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    
    if (elements.timer) {
        elements.timer.textContent = gameState.timeLeft;
        elements.timer.style.color = '#fff';
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        
        if (elements.timer) {
            elements.timer.textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 5) {
                elements.timer.style.color = '#e74c3c';
            }
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            if (socket && gameState.isInDuel) {
                socket.emit('vote', {
                    duelId: gameState.currentDuelId,
                    choice: 'skip'
                });
            }
        }
    }, 1000);
}

// ==================== PROFILE FUNCTIONS ====================
function selectGender(gender) {
    userData.gender = gender;
    userData.hasSelectedGender = true;
    
    if (socket && gameState.isConnected) {
        socket.emit('select_gender', { gender: gender });
    } else {
        saveUserData();
        updateUI();
        hideGenderModal();
        showNotification('🎉 Jins tanlandi', 'Endi duel o\'ynashingiz mumkin!');
    }
}

function selectFilter(filter) {
    userData.filter = filter;
    
    const filterOptions = document.querySelectorAll('.gender-filter-option');
    filterOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.filter === filter) {
            option.classList.add('active');
        }
    });
    
    if (socket && gameState.isConnected) {
        socket.emit('update_profile', { filter: filter });
    }
    
    showNotification('Filter o\'zgartirildi', 
        filter === 'male' ? 'Faqat erkaklar bilan duel' :
        filter === 'female' ? 'Faqat ayollar bilan duel' :
        'Hamma bilan duel');
}

function saveProfile() {
    const bio = elements.editBio?.value || '';
    const gender = elements.editGender?.value || 'not_specified';
    const filter = elements.editFilter?.value || 'not_specified';
    
    userData.bio = bio;
    userData.gender = gender;
    userData.filter = filter;
    
    if (socket && gameState.isConnected) {
        socket.emit('update_profile', { bio, gender, filter });
    }
    
    saveUserData();
    updateUI();
    hideProfileModal();
    showNotification('✅ Profil yangilandi', 'O\'zgarishlar saqlandi');
}

// ==================== FRIENDS FUNCTIONS ====================
function loadFriends() {
    // For now, show test friends
    const friends = [
        {
            id: '1',
            name: 'Ali',
            username: 'ali_user',
            photo: 'https://ui-avatars.com/api/?name=Ali&background=3498db&color=fff',
            rating: 1650,
            matches: 12,
            online: true,
            lastActive: new Date(),
            isMutual: true
        },
        {
            id: '2',
            name: 'Malika',
            username: 'malika_user',
            photo: 'https://ui-avatars.com/api/?name=Malika&background=e74c3c&color=fff',
            rating: 1580,
            matches: 8,
            online: false,
            lastActive: new Date(Date.now() - 3600000),
            isMutual: true
        }
    ];
    
    if (friends.length === 0) {
        elements.noFriends.style.display = 'block';
        elements.friendsList.innerHTML = '';
    } else {
        elements.noFriends.style.display = 'none';
        
        elements.friendsList.innerHTML = friends.map(friend => `
            <div class="friend-item ${friend.isMutual ? 'mutual' : ''}">
                <img src="${friend.photo}" alt="${friend.name}" class="friend-avatar">
                <div class="friend-info">
                    <div class="friend-name">
                        ${friend.name}
                        ${friend.isMutual ? '<span class="mutual-badge">💖 Do\'st</span>' : ''}
                    </div>
                    <div class="friend-username">@${friend.username}</div>
                    <div class="friend-stats">
                        <span><i class="fas fa-trophy"></i> ${friend.rating}</span>
                        <span><i class="fas fa-heart"></i> ${friend.matches}</span>
                    </div>
                    <div class="friend-status ${friend.online ? 'status-online' : 'status-offline'}">
                        ${friend.online ? 'Onlayn' : formatTimeAgo(friend.lastActive)}
                    </div>
                </div>
                ${friend.isMutual ? 
                    '<button class="chat-btn-small" onclick="openChatWithFriend(\'' + friend.id + '\')">💬</button>' : 
                    ''
                }
            </div>
        `).join('');
    }
    
    elements.friendsCount.textContent = friends.filter(f => f.isMutual).length;
    elements.onlineFriendsCount.textContent = friends.filter(f => f.isMutual && f.online).length;
}

function formatTimeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    return `${days} kun oldin`;
}

// ==================== SHOP FUNCTIONS ====================
function loadShop() {
    const items = [
        { id: 1, name: '10 Super Like', price: 100, icon: '💖', description: '10 ta kunlik SUPER LIKE' },
        { id: 2, name: '50 Super Like', price: 450, icon: '💎', description: '50 ta kunlik SUPER LIKE' },
        { id: 3, name: '100 Super Like', price: 800, icon: '👑', description: '100 ta kunlik SUPER LIKE' },
        { id: 4, name: 'Premium Profil', price: 300, icon: '⭐', description: '30 kunlik premium status' }
    ];
    
    elements.shopItems.innerHTML = items.map(item => `
        <div class="shop-item">
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-description">${item.description}</div>
            </div>
            <button class="shop-item-price" onclick="buyItem(${item.id})" 
                    ${userData.coins < item.price ? 'disabled' : ''}>
                <i class="fas fa-coins"></i> ${item.price}
            </button>
        </div>
    `).join('');
}

function buyItem(itemId) {
    const items = [
        { id: 1, price: 100, reward: 'super_likes', amount: 10 },
        { id: 2, price: 450, reward: 'super_likes', amount: 50 },
        { id: 3, price: 800, reward: 'super_likes', amount: 100 },
        { id: 4, price: 300, reward: 'premium', days: 30 }
    ];
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (userData.coins >= item.price) {
        userData.coins -= item.price;
        
        if (item.reward === 'super_likes') {
            userData.dailySuperLikes += item.amount;
            showNotification('✅ Xarid qilindi', `${item.amount} ta SUPER LIKE sotib olindi!`);
        } else if (item.reward === 'premium') {
            showNotification('✅ Xarid qilindi', `${item.days} kunlik premium status aktivlashtirildi!`);
        }
        
        saveUserData();
        updateUI();
        loadShop();
    } else {
        showNotification('⚠️ Yetarli emas', 'Coinlaringiz yetarli emas!');
    }
}

// ==================== LEADERBOARD FUNCTIONS ====================
function loadLeaderboard() {
    const leaders = [
        { rank: 1, name: 'Ali', rating: 1850, matches: 45, friends: 12, gender: 'male' },
        { rank: 2, name: 'Malika', rating: 1790, matches: 38, friends: 8, gender: 'female' },
        { rank: 3, name: 'Sanjar', rating: 1720, matches: 32, friends: 5, gender: 'male' },
        { rank: 4, name: 'Dilnoza', rating: 1680, matches: 29, friends: 15, gender: 'female' },
        { rank: 5, name: 'Sardor', rating: 1620, matches: 25, friends: 7, gender: 'male' }
    ];
    
    elements.leaderboardList.innerHTML = leaders.map(leader => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">${leader.rank}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">
                    ${leader.name}
                    <span class="gender-badge gender-${leader.gender}">
                        <i class="fas fa-${leader.gender === 'male' ? 'mars' : 'venus'}"></i>
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
    
    elements.leaderboardUpdated.textContent = new Date().toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== CHAT FUNCTIONS ====================
function openChat() {
    if (!gameState.currentPartner) return;
    
    elements.chatPartnerAvatar.src = gameState.currentPartner.photo || '';
    elements.chatPartnerName.textContent = gameState.currentPartner.name;
    elements.chatPartnerUsername.textContent = gameState.currentPartner.username ? '@' + gameState.currentPartner.username : '';
    
    showChatModal();
}

function openTelegramChat() {
    if (!gameState.currentPartner || !gameState.currentPartner.username) {
        showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        return;
    }
    
    const telegramUrl = `https://t.me/${gameState.currentPartner.username}`;
    
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
        window.open(telegramUrl, '_blank');
    }
}

// ==================== STATS FUNCTIONS ====================
function showStats() {
    // Update stats modal
    elements.statRating.textContent = userData.rating;
    elements.statMatches.textContent = userData.matches;
    elements.statDuels.textContent = userData.duels;
    elements.statWinRate.textContent = userData.duels > 0 ? 
        Math.round((userData.wins / userData.duels) * 100) + '%' : '0%';
    elements.statMutualMatches.textContent = userData.mutualMatches;
    elements.statFriendsCount.textContent = userData.friends;
    elements.detailTotalLikes.textContent = userData.totalLikes;
    elements.detailCoins.textContent = userData.coins;
    elements.detailLevel.textContent = userData.level;
    elements.detailDailySuperLikes.textContent = userData.dailySuperLikes;
    
    showStatsModal();
}

// ==================== MODAL FUNCTIONS ====================
function showGenderModal(force = false) {
    if (force || !userData.hasSelectedGender) {
        elements.genderModal.classList.add('active');
    }
}

function hideGenderModal() {
    elements.genderModal.classList.remove('active');
}

function showProfileModal() {
    // Load current values
    if (elements.editBio) elements.editBio.value = userData.bio || '';
    if (elements.editGender) elements.editGender.value = userData.gender || 'not_specified';
    if (elements.editFilter) elements.editFilter.value = userData.filter || 'not_specified';
    
    elements.profileModal.classList.add('active');
}

function hideProfileModal() {
    elements.profileModal.classList.remove('active');
}

function showChatModal() {
    elements.chatModal.classList.add('active');
}

function hideChatModal() {
    elements.chatModal.classList.remove('active');
}

function showStatsModal() {
    elements.statsModal.classList.add('active');
}

function hideStatsModal() {
    elements.statsModal.classList.remove('active');
}

// ==================== NOTIFICATION ====================
function showNotification(title, message) {
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('active');
    
    setTimeout(() => {
        elements.notification.classList.remove('active');
    }, 3000);
}

// ==================== GAME FLOW FUNCTIONS ====================
function continuePlaying() {
    switchScreen('welcome');
}

function returnToMenu() {
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    
    clearInterval(gameState.timerInterval);
    
    if (socket && gameState.isConnected && gameState.isInQueue) {
        socket.emit('leave_queue');
    }
    
    switchScreen('welcome');
    showNotification('Menyuga qaytildi', 'Yangi duel boshlashingiz mumkin');
}

// ==================== UTILITY FUNCTIONS ====================
function updateQueueStatus(message) {
    if (elements.queueStatus) {
        elements.queueStatus.textContent = message;
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen(btn.dataset.screen);
        });
    });
    
    // Quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.textContent.includes('Do\'stlar') ? 'friends' :
                          btn.textContent.includes('Do\'kon') ? 'shop' :
                          btn.textContent.includes('Liderlar') ? 'leaderboard' : 'welcome';
            switchScreen(screen);
        });
    });
    
    // Gender filter options
    document.querySelectorAll('.gender-filter-option').forEach(option => {
        option.addEventListener('click', () => {
            selectFilter(option.dataset.filter);
        });
    });
    
    // Main buttons
    if (elements.connectBtn) {
        elements.connectBtn.addEventListener('click', connectToServer);
    }
    
    if (elements.enterQueueBtn) {
        elements.enterQueueBtn.addEventListener('click', enterQueue);
    }
    
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    // Vote buttons
    if (elements.skipBtn) {
        elements.skipBtn.addEventListener('click', () => sendVote('skip'));
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', () => sendVote('like'));
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', () => sendVote('super_like'));
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ==================== GLOBAL FUNCTIONS ====================
window.selectGender = selectGender;
window.selectFilter = selectFilter;
window.saveProfile = saveProfile;
window.buyItem = buyItem;
window.openChat = openChat;
window.openTelegramChat = openTelegramChat;
window.continuePlaying = continuePlaying;
window.returnToMenu = returnToMenu;
window.showGenderModal = showGenderModal;
window.hideGenderModal = hideGenderModal;
window.showProfileModal = showProfileModal;
window.showStats = showStats;
window.switchScreen = switchScreen;
window.loadFriends = loadFriends;