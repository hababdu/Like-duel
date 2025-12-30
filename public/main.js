// ==================== O'YIN HOLATLARI ====================
const gameState = {
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
    waitingForOpponent: false,
    isVoting: false,
    matchCompleted: false,
    isProcessingMatch: false
};

// ==================== USER STATE ====================
const userState = {
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
    friendsCount: 0,
    telegramUsername: null
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    // Header
    headerCoins: document.getElementById('headerCoins'),
    headerLevel: document.getElementById('headerLevel'),
    
    // Welcome Screen
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    myLikes: document.getElementById('myLikes'),
    mutualMatchesCount: document.getElementById('mutualMatchesCount'),
    
    // Filter buttons
    filterButtons: document.querySelectorAll('.filter-btn'),
    
    // Queue Screen
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    queueStatus: document.getElementById('queueStatus'),
    
    // Duel Screen
    opponentAvatar: document.getElementById('opponentAvatar'),
    opponentName: document.getElementById('opponentName'),
    opponentUsername: document.getElementById('opponentUsername'),
    opponentRating: document.getElementById('opponentRating'),
    opponentMatches: document.getElementById('opponentMatches'),
    timer: document.getElementById('timer'),
    duelStatus: document.getElementById('duelStatus'),
    superLikeCount: document.getElementById('superLikeCount'),
    
    // Match Screen
    partnerAvatar: document.getElementById('partnerAvatar'),
    partnerName: document.getElementById('partnerName'),
    matchType: document.getElementById('matchType'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    
    // Profile Screen
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileBio: document.getElementById('profileBio'),
    statRating: document.getElementById('statRating'),
    statMatches: document.getElementById('statMatches'),
    statDuels: document.getElementById('statDuels'),
    statWinRate: document.getElementById('statWinRate'),
    
    // Buttons
    startBtn: document.getElementById('startBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    viewStatsBtn: document.getElementById('viewStatsBtn'),
    
    // Modals
    genderModal: document.getElementById('genderModal'),
    chatModal: document.getElementById('chatModal'),
    
    // Notification
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    
    // Chat elements
    chatPartnerAvatar: document.getElementById('chatPartnerAvatar'),
    chatPartnerName: document.getElementById('chatPartnerName'),
    chatUsername: document.getElementById('chatUsername')
};

// ==================== GLOBAL USER ====================
let tgUserGlobal = null;

// ==================== PROFILNI YUKLASH ====================
function initUserProfile() {
    console.log('👤 Profil yuklanmoqda...');
    
    let tgUser = {};
    
    // Telegram WebApp dan foydalanuvchi ma'lumotlarini olish
    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            tgUser = Telegram.WebApp.initDataUnsafe.user || {};
            console.log('✅ Telegram WebApp mavjud:', tgUser);
        }
    } catch (error) {
        console.log('ℹ️ Telegram Web App mavjud emas, test rejimida');
    }
    
    // Agar Telegram user bo'lmasa, test ma'lumotlarini yaratamiz
    if (!tgUser.id) {
        tgUser = {
            id: 'test_' + Date.now(),
            first_name: 'Test Foydalanuvchi',
            username: 'test_user',
            photo_url: null
        };
    }
    
    // Avatar URL
    const userPhoto = tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`;
    const userName = tgUser.first_name || 'Foydalanuvchi';
    const userUsername = tgUser.username ? '@' + tgUser.username : '@foydalanuvchi';
    
    // DOM elementlarini yangilash
    if (elements.myAvatar) {
        elements.myAvatar.src = userPhoto;
        elements.myAvatar.onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff`;
        };
    }
    
    if (elements.profileAvatar) {
        elements.profileAvatar.src = userPhoto;
        elements.profileAvatar.onerror = function() {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff`;
        };
    }
    
    if (elements.myName) elements.myName.textContent = userName;
    if (elements.profileName) elements.profileName.textContent = userName;
    if (elements.myUsername) elements.myUsername.textContent = userUsername;
    if (elements.profileUsername) elements.profileUsername.textContent = userUsername;
    
    tgUserGlobal = tgUser;
    
    // UI ni yangilash
    updateUIFromUserState();
    
    // Event listener larni o'rnatish
    setupEventListeners();
    
    // LocalStorage dan ma'lumotlarni yuklash
    loadFromLocalStorage();
    
    // Agar gender tanlanmagan bo'lsa, modalni ko'rsatish
    if (!userState.hasSelectedGender) {
        setTimeout(() => {
            showGenderModal();
        }, 1000);
    }
    
    console.log('✅ Profil yuklandi:', userName);
    return tgUser;
}

// ==================== EVENT LISTENER LAR ====================
function setupEventListeners() {
    console.log('🎮 Event listener lar o\'rnatilmoqda...');
    
    // Start button
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    // Leave queue button
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    // Vote buttons
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => handleVote('skip'));
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', () => handleVote('like'));
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));
    }
    
    // Filter buttons
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            toggleFilter(filter);
        });
    });
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Edit profile button
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', showEditProfileModal);
    }
    
    // View stats button
    if (elements.viewStatsBtn) {
        elements.viewStatsBtn.addEventListener('click', showDetailedStats);
    }
    
    console.log('✅ Event listener lar o\'rnatildi');
}

// ==================== UI YANGILASH ====================
function updateUIFromUserState() {
    // Header stats
    if (elements.headerCoins) elements.headerCoins.textContent = userState.coins;
    if (elements.headerLevel) elements.headerLevel.textContent = userState.level;
    
    // Profile stats
    if (elements.myMatches) elements.myMatches.textContent = userState.matches;
    if (elements.mutualMatchesCount) elements.mutualMatchesCount.textContent = userState.mutualMatchesCount;
    if (elements.myLikes) elements.myLikes.textContent = userState.totalLikes;
    
    // Profile tab stats
    if (elements.statRating) elements.statRating.textContent = userState.rating;
    if (elements.statMatches) elements.statMatches.textContent = userState.matches;
    if (elements.statDuels) elements.statDuels.textContent = userState.duels;
    
    const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
    if (elements.statWinRate) elements.statWinRate.textContent = winRate + '%';
    
    if (elements.profileBio && userState.bio) {
        elements.profileBio.textContent = userState.bio;
    }
    
    // Start button state
    if (elements.startBtn) {
        if (userState.hasSelectedGender) {
            elements.startBtn.disabled = false;
            elements.startBtn.textContent = '🎮 Duel Boshlash';
            elements.startBtn.classList.remove('disabled');
        } else {
            elements.startBtn.disabled = true;
            elements.startBtn.textContent = 'Avval gender tanlang';
            elements.startBtn.classList.add('disabled');
        }
    }
    
    // Super like count
    if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
    
    // Filter buttons
    elements.filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === userState.filter) {
            btn.classList.add('active');
        }
    });
}

// ==================== LOCALSTORAGE FUNKSIYALARI ====================
function saveToLocalStorage() {
    localStorage.setItem('userGender', userState.currentGender || '');
    localStorage.setItem('hasSelectedGender', userState.hasSelectedGender);
    localStorage.setItem('userCoins', userState.coins);
    localStorage.setItem('userLevel', userState.level);
    localStorage.setItem('userRating', userState.rating);
    localStorage.setItem('userMatches', userState.matches);
    localStorage.setItem('userDuels', userState.duels);
    localStorage.setItem('userWins', userState.wins);
    localStorage.setItem('userTotalLikes', userState.totalLikes);
    localStorage.setItem('userDailySuperLikes', userState.dailySuperLikes);
    localStorage.setItem('userBio', userState.bio);
    localStorage.setItem('userFilter', userState.filter);
}

function loadFromLocalStorage() {
    const savedGender = localStorage.getItem('userGender');
    const savedHasGender = localStorage.getItem('hasSelectedGender');
    
    if (savedGender) userState.currentGender = savedGender;
    if (savedHasGender) userState.hasSelectedGender = savedHasGender === 'true';
    
    const coins = localStorage.getItem('userCoins');
    const matches = localStorage.getItem('userMatches');
    const duels = localStorage.getItem('userDuels');
    const wins = localStorage.getItem('userWins');
    const likes = localStorage.getItem('userTotalLikes');
    
    if (coins) userState.coins = parseInt(coins);
    if (matches) userState.matches = parseInt(matches);
    if (duels) userState.duels = parseInt(duels);
    if (wins) userState.wins = parseInt(wins);
    if (likes) userState.totalLikes = parseInt(likes);
    
    const filter = localStorage.getItem('userFilter');
    if (filter) userState.filter = filter;
    
    const bio = localStorage.getItem('userBio');
    if (bio) userState.bio = bio;
    
    updateUIFromUserState();
}

// ==================== TAB NAVIGATSIYASI ====================
function switchTab(tabName) {
    console.log('📱 Tab o\'zgartirildi:', tabName);
    
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    // Add active class to selected tab
    const selectedTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`${tabName}Tab`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.classList.remove('hidden');
    }
    
    gameState.currentTab = tabName;
    
    // Play click sound
    playSound('click');
}

// ==================== FILTER FUNKSIYALARI ====================
function toggleFilter(filter) {
    console.log('🎯 Filter o\'zgartirildi:', filter);
    
    userState.filter = filter;
    gameState.currentFilter = filter;
    
    // Update UI
    elements.filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Show notification
    showNotification('Filter', 
        filter === 'male' ? 'Faqat erkaklar bilan' : 
        filter === 'female' ? 'Faqat ayollar bilan' : 
        'Hamma bilan duel');
    
    // Re-enter queue if currently in queue
    if (gameState.isInQueue && gameState.socket) {
        gameState.socket.emit('leave_queue');
        setTimeout(() => {
            gameState.socket.emit('enter_queue');
        }, 500);
    }
}

// ==================== GENDER FUNKSIYALARI ====================
function selectGender(gender) {
    console.log('🎯 Gender tanlandi:', gender);
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    userState.filter = gender === 'not_specified' ? 'not_specified' : gender;
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Update UI
    updateUIFromUserState();
    
    // Hide modal
    hideGenderModal();
    
    // If connected to server, send gender selection
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { 
            gender: gender,
            filter: userState.filter 
        });
    }
    
    // Show notification
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
    
    // Play sound
    playSound('match');
}

function showGenderModal() {
    if (elements.genderModal) {
        elements.genderModal.classList.add('active');
        elements.genderModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideGenderModal() {
    if (elements.genderModal) {
        elements.genderModal.classList.remove('active');
        elements.genderModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ==================== SCREEN FUNKSIYALARI ====================
function showScreen(screenName) {
    console.log('📱 Ekran o\'zgartirildi:', screenName);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });
    
    // Show selected screen
    const screen = document.getElementById(`${screenName}Screen`);
    if (screen) {
        screen.classList.add('active');
        screen.classList.remove('hidden');
    }
    
    // Update current tab
    if (screenName === 'welcome') {
        switchTab('duel');
    }
}

// ==================== SOUND FUNKSIYALARI ====================
function playSound(soundName) {
    try {
        const audio = document.getElementById(soundName + 'Sound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Sound play failed:', e));
        }
    } catch (error) {
        console.log('Sound error:', error);
    }
}

// ==================== NOTIFICATION ====================
function showNotification(title, message) {
    if (!elements.notification) return;
    
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('active');
    elements.notification.classList.remove('hidden');
    
    setTimeout(() => {
        elements.notification.classList.remove('active');
        elements.notification.classList.add('hidden');
    }, 3000);
}

// ==================== SERVERGA ULANISH ====================
function connectToServer() {
    console.log('🔗 Serverga ulanmoqda...');
    
    if (!tgUserGlobal) {
        showNotification('Xato', 'Foydalanuvchi ma\'lumotlari topilmadi');
        return;
    }
    
    if (gameState.socket && gameState.isConnected) {
        console.log('ℹ️ Allaqachon serverga ulanilgan');
        return;
    }
    
    // Update queue status
    if (elements.queueStatus) {
        elements.queueStatus.textContent = 'Serverga ulanmoqda...';
    }
    
    // Server URL - Local server
    const socketUrl = 'http://localhost:3000';
    console.log('🔌 Socket URL:', socketUrl);
    
    // Create socket connection
    gameState.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    // ==================== SOCKET EVENT HANDLERS ====================
    
    gameState.socket.on('connect', () => {
        console.log('✅ Serverga ulandi');
        gameState.isConnected = true;
        gameState.reconnectAttempts = 0;
        
        if (elements.queueStatus) {
            elements.queueStatus.textContent = 'Serverga ulandi...';
        }
        
        // Send authentication
        gameState.socket.emit('auth', {
            userId: tgUserGlobal.id,
            firstName: tgUserGlobal.first_name,
            username: tgUserGlobal.username,
            photoUrl: tgUserGlobal.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUserGlobal.first_name || 'User')}&background=667eea&color=fff`,
            gender: userState.currentGender,
            hasSelectedGender: userState.hasSelectedGender,
            bio: userState.bio,
            filter: userState.filter
        });
        
        showNotification('✅ Ulanish', 'Serverga muvaffaqiyatli ulandik');
    });
    
    gameState.socket.on('auth_ok', (data) => {
        console.log('✅ Autentifikatsiya muvaffaqiyatli:', data);
        
        // Update user state from server
        userState.coins = data.coins || userState.coins;
        userState.rating = data.rating || userState.rating;
        userState.matches = data.matches || userState.matches;
        userState.duels = data.duels || userState.duels;
        userState.wins = data.wins || userState.wins;
        userState.totalLikes = data.totalLikes || userState.totalLikes;
        userState.dailySuperLikes = data.dailySuperLikes || userState.dailySuperLikes;
        userState.mutualMatchesCount = data.mutualMatchesCount || userState.mutualMatchesCount;
        userState.friendsCount = data.friendsCount || userState.friendsCount;
        
        // Update UI
        updateUIFromUserState();
        saveToLocalStorage();
        
        // Show queue screen
        showScreen('queue');
        
        // Enter queue if gender is selected
        if (userState.hasSelectedGender) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        } else {
            showGenderModal();
        }
    });
    
    gameState.socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        showScreen('queue');
        
        if (elements.queueStatus) {
            elements.queueStatus.textContent = `Navbatdasiz. O'rningiz: ${data.position}/${data.total}`;
        }
    });
    
    gameState.socket.on('waiting_count', (data) => {
        if (elements.waitingCount) elements.waitingCount.textContent = data.count;
        if (elements.position) elements.position.textContent = data.position;
        
        if (elements.queueStatus) {
            elements.queueStatus.textContent = `Navbatdasiz. O'rningiz: ${data.position}/${data.count}`;
        }
    });
    
    gameState.socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        
        gameState.isInDuel = true;
        gameState.waitingForOpponent = false;
        gameState.currentDuelId = data.duelId;
        
        // Show duel screen
        showScreen('duel');
        
        // Update opponent info
        if (elements.opponentAvatar && data.opponent.photo) {
            elements.opponentAvatar.src = data.opponent.photo;
        }
        
        if (elements.opponentName) {
            elements.opponentName.textContent = data.opponent.name;
        }
        
        if (elements.opponentUsername) {
            elements.opponentUsername.textContent = data.opponent.username || '';
        }
        
        if (elements.opponentRating) {
            elements.opponentRating.textContent = data.opponent.rating || 1500;
        }
        
        if (elements.opponentMatches) {
            elements.opponentMatches.textContent = data.opponent.matches || 0;
        }
        
        // Start timer
        startTimer();
        
        if (elements.duelStatus) {
            elements.duelStatus.textContent = 'Ovoz bering: ❤️ yoki 💖 yoki ✖';
        }
    });
    
    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        
        gameState.matchCompleted = true;
        gameState.currentPartner = data.partner;
        
        // Show match screen
        showScreen('match');
        
        // Update partner info
        if (elements.partnerAvatar && data.partner.photo) {
            elements.partnerAvatar.src = data.partner.photo;
        }
        
        if (elements.partnerName) {
            elements.partnerName.textContent = data.partner.name;
        }
        
        if (elements.matchType) {
            elements.matchType.textContent = data.isMutual ? 'O\'ZARO MATCH!' : 'MATCH!';
        }
        
        if (elements.rewardCoins) {
            elements.rewardCoins.textContent = data.rewards.coins;
        }
        
        if (elements.rewardXP) {
            elements.rewardXP.textContent = data.rewards.xp;
        }
        
        // Update user stats
        userState.coins += data.rewards.coins;
        userState.matches++;
        userState.rating = data.newRating || userState.rating;
        
        if (data.isMutual) {
            userState.mutualMatchesCount++;
            userState.friendsCount++;
        }
        
        updateUIFromUserState();
        saveToLocalStorage();
        
        // Play match sound
        playSound('match');
        
        // Confetti
        if (typeof confetti === 'function') {
            confetti({ particleCount: 300, spread: 100 });
        }
    });
    
    gameState.socket.on('no_match', () => {
        console.log('❌ Match bo\'lmadi');
        
        showNotification('Match bo\'lmadi', 'Raqib sizni like bermadi');
        
        setTimeout(() => {
            skipToNextDuel();
        }, 2000);
    });
    
    gameState.socket.on('timeout', () => {
        console.log('⏰ Vaqt tugadi');
        
        showNotification('Vaqt tugadi', 'Javob berish vaqti tugadi');
        
        setTimeout(() => {
            skipToNextDuel();
        }, 2000);
    });
    
    gameState.socket.on('error', (data) => {
        console.error('❌ Xato:', data);
        showNotification('Xato', data.message || 'Noma\'lum xato');
    });
    
    gameState.socket.on('disconnect', () => {
        console.log('❌ Serverdan uzildi');
        gameState.isConnected = false;
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        
        showNotification('Ulanish uzildi', 'Qayta ulanmoqda...');
        
        // Try to reconnect
        setTimeout(() => {
            if (!gameState.isConnected) {
                connectToServer();
            }
        }, 5000);
    });
}

// ==================== TIMER FUNKSIYASI ====================
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    
    if (elements.timer) {
        elements.timer.textContent = gameState.timeLeft;
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        
        if (elements.timer) {
            elements.timer.textContent = gameState.timeLeft;
        }
        
        if (gameState.timeLeft <= 5) {
            if (elements.timer) {
                elements.timer.style.color = '#ff4444';
            }
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            if (gameState.socket && gameState.isInDuel) {
                gameState.socket.emit('vote', {
                    duelId: gameState.currentDuelId,
                    choice: 'skip'
                });
            }
        }
    }, 1000);
}

// ==================== OVOZ BERISH ====================
function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }
    
    if (gameState.isVoting) {
        console.log('⚠️ Ovoz berish jarayonida');
        return;
    }
    
    console.log('🗳️ Ovoz berish:', choice);
    
    gameState.isVoting = true;
    
    // Disable buttons
    if (elements.noBtn) elements.noBtn.disabled = true;
    if (elements.likeBtn) elements.likeBtn.disabled = true;
    if (elements.superLikeBtn) elements.superLikeBtn.disabled = true;
    
    // Stop timer
    clearInterval(gameState.timerInterval);
    
    // Send vote to server
    gameState.socket.emit('vote', {
        duelId: gameState.currentDuelId,
        choice: choice
    });
    
    // Update UI
    if (choice === 'like') {
        if (elements.timer) elements.timer.textContent = '❤️';
        if (elements.duelStatus) {
            elements.duelStatus.textContent = 'LIKE berdingiz. Kutish...';
        }
        playSound('like');
    } else if (choice === 'super_like') {
        if (elements.timer) elements.timer.textContent = '💖';
        if (elements.duelStatus) {
            elements.duelStatus.textContent = 'SUPER LIKE! Kutish...';
        }
        playSound('match');
        
        // Update super like count
        if (userState.dailySuperLikes > 0) {
            userState.dailySuperLikes--;
            if (elements.superLikeCount) {
                elements.superLikeCount.textContent = userState.dailySuperLikes;
            }
        }
    } else {
        if (elements.timer) elements.timer.textContent = '✖';
        if (elements.duelStatus) {
            elements.duelStatus.textContent = 'O\'tkazib yubordingiz...';
        }
        playSound('click');
    }
}

// ==================== NAVBATGA QAYTISH ====================
function skipToNextDuel() {
    console.log('🔄 Keyingi duelga o\'tish');
    
    // Reset states
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.isVoting = false;
    gameState.matchCompleted = false;
    
    // Clear timer
    clearInterval(gameState.timerInterval);
    
    // Enable buttons
    if (elements.noBtn) elements.noBtn.disabled = false;
    if (elements.likeBtn) elements.likeBtn.disabled = false;
    if (elements.superLikeBtn) elements.superLikeBtn.disabled = false;
    
    // Re-enter queue
    if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
        gameState.isInQueue = true;
        showScreen('queue');
        gameState.socket.emit('enter_queue');
    } else {
        showScreen('welcome');
    }
}

// ==================== O'YINNI BOSHLASH ====================
function startGame() {
    console.log('🎮 O\'yinni boshlash');
    
    if (!userState.hasSelectedGender) {
        showGenderModal();
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
    
    connectToServer();
}

// ==================== NAVBATDAN CHIQISH ====================
function leaveQueue() {
    console.log('🚪 Navbatdan chiqish');
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
    
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    
    showScreen('welcome');
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "Duel Boshlash" tugmasini bosing');
}

// ==================== BOSH MENYUGA QAYTISH ====================
function returnToMenu() {
    console.log('🏠 Bosh menyuga qaytish');
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
    
    // Reset states
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    
    // Clear timer
    clearInterval(gameState.timerInterval);
    
    showScreen('welcome');
    
    showNotification('Bosh menyuga qaytildi', 'Yana o\'ynash uchun "Duel Boshlash" tugmasini bosing');
}

// ==================== CHAT FUNKSIYALARI ====================
function openChat() {
    if (!gameState.currentPartner) return;
    
    console.log('💬 Chat ochilmoqda');
    
    // Update chat modal
    if (elements.chatPartnerAvatar && gameState.currentPartner.photo) {
        elements.chatPartnerAvatar.src = gameState.currentPartner.photo;
    }
    
    if (elements.chatPartnerName) {
        elements.chatPartnerName.textContent = gameState.currentPartner.name;
    }
    
    if (elements.chatUsername && gameState.currentPartner.username) {
        elements.chatUsername.textContent = `@${gameState.currentPartner.username}`;
    }
    
    // Show chat modal
    if (elements.chatModal) {
        elements.chatModal.classList.add('active');
        elements.chatModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeChatModal() {
    if (elements.chatModal) {
        elements.chatModal.classList.remove('active');
        elements.chatModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function openTelegramChat() {
    if (!gameState.currentPartner || !gameState.currentPartner.username) {
        showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        return;
    }
    
    const telegramUrl = `https://t.me/${gameState.currentPartner.username.replace('@', '')}`;
    
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
        window.open(telegramUrl, '_blank');
    }
}

// ==================== PROFIL TAXRIRLASH ====================
function showEditProfileModal() {
    // Bu funksiyani keyinroq to'ldiramiz
    showNotification('Tez orada', 'Profil tahrirlash funksiyasi tez orada ishga tushadi');
}

function showDetailedStats() {
    const stats = `
        Reyting: ${userState.rating}
        Matchlar: ${userState.matches}
        Duellar: ${userState.duels}
        G'alabalar: ${userState.wins}
        G'alaba %: ${userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0}%
        Total Like: ${userState.totalLikes}
        O'zaro Match: ${userState.mutualMatchesCount}
        Do'stlar: ${userState.friendsCount}
        Coin: ${userState.coins}
        Level: ${userState.level}
        Kunlik Super Like: ${userState.dailySuperLikes}/3
    `;
    
    alert('Batafsil statistika:\n\n' + stats);
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Initialize user profile
    initUserProfile();
    
    // Initial screen
    showScreen('welcome');
    
    console.log('✅ Dastur to\'liq yuklandi');
});

// ==================== GLOBAL FUNKSIYALAR ====================
window.selectGender = selectGender;
window.closeChatModal = closeChatModal;
window.openTelegramChat = openTelegramChat;
window.skipToNextDuel = skipToNextDuel;
window.returnToMenu = returnToMenu;
window.openChat = openChat;