// ==================== O'YIN HOLATLARI ==================== 
const gameState = {
    socket: null,
    isConnected: false,
    isInQueue: false,
    isInDuel: false,
    timerInterval: null,
    playerData: null,
    currentDuelId: null,
    currentPartner: null,
    lastOpponent: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    currentTab: 'duel',
    isChatModalOpen: false,
    currentFilter: localStorage.getItem('userFilter') || 'not_specified',
    mutualMatches: [],
    friendsList: [],
    waitingForOpponent: false,
    matchCompleted: false,
    lastMatchData: null,
    inMatchScreen: false,
    connectionStatus: 'disconnected',
    lastActivity: Date.now(),
    pingInterval: null,
    averagePing: 0,
    networkQuality: 'good',
    giftReceiver: null,
    genderModalShown: false,
    isGenderSelected: localStorage.getItem('permanentGenderSelected') === 'true'
};

// ==================== USER STATE ==================== 
const userState = {
    currentGender: localStorage.getItem('userGender') || null,
    hasSelectedGender: localStorage.getItem('hasSelectedGender') === 'true',
    coins: parseInt(localStorage.getItem('userCoins')) || 100,
    level: parseInt(localStorage.getItem('userLevel')) || 1,
    rating: parseInt(localStorage.getItem('userRating')) || 1500,
    matches: parseInt(localStorage.getItem('userMatches')) || 0,
    duels: parseInt(localStorage.getItem('userDuels')) || 0,
    wins: parseInt(localStorage.getItem('userWins')) || 0,
    totalLikes: parseInt(localStorage.getItem('userTotalLikes')) || 0,
    dailySuperLikes: parseInt(localStorage.getItem('userDailySuperLikes')) || 3,
    bio: localStorage.getItem('userBio') || '',
    filter: localStorage.getItem('userFilter') || 'not_specified',
    mutualMatchesCount: parseInt(localStorage.getItem('mutualMatchesCount')) || 0,
    friendsCount: parseInt(localStorage.getItem('friendsCount')) || 0,
    telegramUsername: null,
    dailyQuests: JSON.parse(localStorage.getItem('userDailyQuests')) || [],
    achievements: JSON.parse(localStorage.getItem('userAchievements')) || [],
    streakDays: parseInt(localStorage.getItem('userStreakDays')) || 0,
    lastLogin: localStorage.getItem('userLastLogin') || null,
    totalPlayTime: parseInt(localStorage.getItem('userTotalPlayTime')) || 0
};

// ==================== DOM ELEMENTLARI ==================== 
const elements = {
    // Asosiy ekranlar
    welcomeScreen: document.getElementById('welcomeScreen'),
    queueScreen: document.getElementById('queueScreen'),
    duelScreen: document.getElementById('duelScreen'),
    matchScreen: document.getElementById('matchScreen'),
    
    // Profil elementlari
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    myLikes: document.getElementById('myLikes'),
    mutualMatchesCount: document.getElementById('mutualMatchesCount'),
    
    // Navbat ekrani
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    positionInfo: document.getElementById('positionInfo'),
    queueStatus: document.getElementById('queueStatus'),
    genderFilterContainer: document.getElementById('genderFilterContainer'),
    
    // Duel ekrani
    opponentAvatar: document.getElementById('opponentAvatar'),
    opponentName: document.getElementById('opponentName'),
    opponentUsername: document.getElementById('opponentUsername'),
    opponentRating: document.getElementById('opponentRating'),
    opponentMatches: document.getElementById('opponentMatches'),
    opponentLevel: document.getElementById('opponentLevel'),
    timer: document.getElementById('timer'),
    duelStatus: document.getElementById('duelStatus'),
    superLikeCount: document.getElementById('superLikeCount'),
    
    // Tugmalar
    startBtn: document.getElementById('startBtn'),
    connectBtn: document.getElementById('connectBtn'),
    enterQueueBtn: document.getElementById('enterQueueBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    refreshFriendsBtn: document.getElementById('refreshFriendsBtn'),
    
    // Match ekrani
    partnerName: document.getElementById('partnerName'),
    matchText: document.getElementById('matchText'),
    matchRewards: document.getElementById('matchRewards'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    matchOptions: document.getElementById('matchOptions'),
    
    // Profil ekrani
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileBio: document.getElementById('profileBio'),
    statRating: document.getElementById('statRating'),
    statMatches: document.getElementById('statMatches'),
    statDuels: document.getElementById('statDuels'),
    statWinRate: document.getElementById('statWinRate'),
    mutualMatchesProfile: document.getElementById('mutualMatchesProfile'),
    statFriends: document.getElementById('statFriends'),
    
    // Valyuta va level
    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    shopCoinsCount: document.getElementById('shopCoinsCount'),
    
    // Notifikatsiya
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    
    // Modal oynalar
    genderModal: document.getElementById('genderModal'),
    genderWarning: document.getElementById('genderWarning'),
    selectGenderNowBtn: document.getElementById('selectGenderNowBtn'),
    
    selectMaleBtn: document.getElementById('selectMaleBtn'),
    selectFemaleBtn: document.getElementById('selectFemaleBtn'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    
    chatModal: document.getElementById('chatModal'),
    chatPartnerAvatar: document.getElementById('chatPartnerAvatar'),
    chatPartnerName: document.getElementById('chatPartnerName'),
    chatUsername: document.getElementById('chatUsername'),
    chatOpenTelegramBtn: document.getElementById('chatOpenTelegramBtn'),
    closeChatBtn: document.getElementById('closeChatBtn'),
    chatTitle: document.getElementById('chatTitle'),
    
    // Profil edit modal
    profileEditModal: document.getElementById('profileEditModal'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    closeProfileEditBtn: document.getElementById('closeProfileEditBtn'),
    editBio: document.getElementById('editBio'),
    editGender: document.getElementById('editGender'),
    editFilter: document.getElementById('editFilter'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
    // Do'stlar ro'yxati
    friendsList: document.getElementById('friendsList'),
    friendsCount: document.getElementById('friendsCount'),
    onlineFriendsCount: document.getElementById('onlineFriendsCount'),
    noFriends: document.getElementById('noFriends'),
    
    // Do'kon
    shopItemsList: document.getElementById('shopItemsList'),
    
    // Liderlar jadvali
    leaderboardList: document.getElementById('leaderboardList'),
    leaderboardUpdated: document.getElementById('leaderboardUpdated'),
    
    // Vazifalar
    profileQuestsList: document.getElementById('profileQuestsList'),
    
    // Boshqa elementlar
    viewStatsBtn: document.getElementById('viewStatsBtn'),
};

// ==================== GLOBAL USER ==================== 
let tgUserGlobal = null;

// ==================== PROFILNI YUKLASH ==================== 
function initUserProfile() {
    console.log('👤 Profil yuklanmoqda...');
    
    let tgUser = {};
    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            tgUser = Telegram.WebApp.initDataUnsafe.user || {};
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            if (tgUser.username) {
                userState.telegramUsername = tgUser.username;
            }
            
            applyTelegramTheme();
        }
    } catch (error) {
        console.log('ℹ️ Telegram Web App mavjud emas, test rejimida');
    }
    
    if (!tgUser.id) {
        tgUser = {
            id: 'test_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            first_name: 'Test Foydalanuvchi',
            username: 'test_user',
            photo_url: null
        };
    }
    
    // Kunlik login streak ni tekshirish
    checkDailyLoginStreak();
    
    // Foydalanuvchi ma'lumotlarini yuklash
    const userPhoto = tgUser.photo_url || `https://ui-avatars.com/api/?name=${tgUser.first_name || 'User'}&background=667eea&color=fff`;
    const userName = tgUser.first_name || 'Foydalanuvchi';
    const userUsername = tgUser.username ? '@' + tgUser.username : '@foydalanuvchi';
    
    // DOM elementlarini yangilash
    updateAvatar(elements.myAvatar, userPhoto);
    updateAvatar(elements.profileAvatar, userPhoto);
    
    if (elements.myName) elements.myName.textContent = userName;
    if (elements.myUsername) elements.myUsername.textContent = userUsername;
    if (elements.profileName) elements.profileName.textContent = userName;
    if (elements.profileUsername) elements.profileUsername.textContent = userUsername;
    
    tgUserGlobal = tgUser;
    
    // Permanent gender tanlanganligini tekshirish
    const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
    const permanentUserGender = localStorage.getItem('permanentUserGender');
    
    if (permanentGenderSelected && permanentUserGender) {
        console.log('✅ Permanent gender tanlangan:', permanentUserGender);
        
        userState.hasSelectedGender = true;
        userState.currentGender = permanentUserGender;
        userState.filter = permanentUserGender;
        
        // Game state ni yangilash
        gameState.currentFilter = permanentUserGender;
        gameState.isGenderSelected = true;
        localStorage.setItem('userFilter', permanentUserGender);
        
        // UI ni yangilash
        updateUIFromUserState();
        addFilterToWelcomeScreen();
        updateQueueButton();
        
        console.log('✅ Gender avval tanlangan, modal ko\'rsatilmaydi');
        
        // Serverga avtomatik ulanish
        setTimeout(() => {
            console.log('🔌 Servere avtomatik ulanmoqda...');
            connectToServer();
        }, 1000);
        
    } else {
        console.log('⚠️ Permanent gender tanlanmagan');
        
        // Kunlik vazifalarni yuklash
        loadDailyQuests();
        
        // Achievementslarni yuklash
        loadAchievements();
        
        updateUIFromUserState();
        addFilterToWelcomeScreen();
        updateQueueButton();
        
        // Gender tanlanmagan bo'lsa
        if (!userState.hasSelectedGender) {
            console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
            setTimeout(() => {
                showGenderModal(true);
            }, 1500);
        } else {
            // Gender tanlangan bo'lsa, serverga ulanish
            setTimeout(() => {
                console.log('🔌 Servere avtomatik ulanmoqda...');
                connectToServer();
            }, 1000);
        }
    }
    
    // Faollikni yangilash
    gameState.lastActivity = Date.now();
    
    return tgUser;
}

// ==================== TELEGRAM THEME ==================== 
function applyTelegramTheme() {
    if (typeof Telegram === 'undefined' || !Telegram.WebApp) return;
    
    const theme = Telegram.WebApp.colorScheme;
    const bgColor = Telegram.WebApp.backgroundColor;
    const textColor = Telegram.WebApp.textColor;
    
    document.documentElement.style.setProperty('--tg-bg-color', bgColor);
    document.documentElement.style.setProperty('--tg-text-color', textColor);
    
    // Telegram button theme
    Telegram.WebApp.setHeaderColor('#667eea');
    Telegram.WebApp.setBackgroundColor('#0f0f23');
    
    // Back button
    Telegram.WebApp.BackButton.onClick(() => {
        if (gameState.isInDuel) {
            showExitDuelConfirm();
        } else {
            returnToMenu();
        }
    });
    
    // Faollikda BackButton ko'rsatish
    updateBackButtonVisibility();
}

function updateBackButtonVisibility() {
    if (typeof Telegram === 'undefined' || !Telegram.WebApp) return;
    
    if (gameState.isInDuel || gameState.isInQueue || gameState.inMatchScreen) {
        Telegram.WebApp.BackButton.show();
    } else {
        Telegram.WebApp.BackButton.hide();
    }
}

// ==================== UI YANGILASH ==================== 
function updateUIFromUserState() {
    console.log('🎨 UI yangilanmoqda...');
    
    // Gender badge qo'shish
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(elements.myName, userState.currentGender);
        addGenderBadge(elements.profileName, userState.currentGender);
    }
    
    // Valyuta va level
    if (elements.coinsCount) elements.coinsCount.textContent = formatNumber(userState.coins);
    if (elements.levelCount) elements.levelCount.textContent = userState.level;
    if (elements.shopCoinsCount) elements.shopCoinsCount.textContent = formatNumber(userState.coins);
    
    // Statistika
    if (elements.statRating) elements.statRating.textContent = userState.rating;
    if (elements.statMatches) elements.statMatches.textContent = userState.matches;
    if (elements.myMatches) elements.myMatches.textContent = userState.matches;
    if (elements.statDuels) elements.statDuels.textContent = userState.duels;
    if (elements.mutualMatchesCount) elements.mutualMatchesCount.textContent = userState.mutualMatchesCount;
    if (elements.mutualMatchesProfile) elements.mutualMatchesProfile.textContent = userState.mutualMatchesCount;
    if (elements.statFriends) elements.statFriends.textContent = userState.friendsCount;
    
    // G'alaba foizi
    const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
    if (elements.statWinRate) elements.statWinRate.textContent = winRate + '%';
    
    // Like'lar
    if (elements.myLikes) elements.myLikes.textContent = userState.totalLikes;
    if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
    
    // Bio
    if (elements.profileBio && userState.bio) {
        elements.profileBio.textContent = userState.bio;
    }
    
    // Streak
    if (elements.streakDaysElement) {
        elements.streakDaysElement.textContent = userState.streakDays;
        updateStreakRewardButton();
    }
    
    // Level progress
    updateLevelProgress();
    
    updateQueueButton();
}

function updateAvatar(imgElement, photoUrl) {
    if (!imgElement) return;
    
    imgElement.src = photoUrl;
    imgElement.onerror = function() {
        const name = tgUserGlobal?.first_name || 'User';
        this.src = `https://ui-avatars.com/api/?name=${name}&background=667eea&color=fff`;
    };
}

function addGenderBadge(element, gender) {
    if (!element || !gender) return;
    
    const oldBadges = element.querySelectorAll('.gender-badge');
    oldBadges.forEach(badge => badge.remove());
    
    const badge = document.createElement('span');
    badge.className = `gender-badge gender-${gender}-badge`;
    
    if (gender === 'male') {
        badge.innerHTML = ' 👤 Erkak';
    } else if (gender === 'female') {
        badge.innerHTML = ' 👤 Ayol';
    } else {
        badge.innerHTML = ' 👤 Hammasi';
    }
    
    element.appendChild(badge);
}

function updateLevelProgress() {
    if (!elements.levelProgress || !elements.levelProgressText) return;
    
    const currentLevel = userState.level;
    const currentXP = userState.rating - ((currentLevel - 1) * 100);
    const totalXP = 100;
    const progressPercentage = Math.min(100, (currentXP / totalXP) * 100);
    
    elements.levelProgress.style.width = `${progressPercentage}%`;
    elements.levelProgressText.textContent = `Level ${currentLevel} (${Math.round(progressPercentage)}%)`;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ==================== FILTER FUNKSIYALARI ==================== 
function createFilterOptions() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'gender-filter-container';
    filterContainer.innerHTML = `
        <div class="filter-options">
            <div class="gender-filter-option ${gameState.currentFilter === 'male' ? 'active' : ''}" data-filter="male">
                <div class="filter-icon">👨</div>
                <div class="filter-text">Faqat erkaklar</div>
            </div>
            <div class="gender-filter-option ${gameState.currentFilter === 'female' ? 'active' : ''}" data-filter="female">
                <div class="filter-icon">👩</div>
                <div class="filter-text">Faqat ayollar</div>
            </div>
            <div class="gender-filter-option ${gameState.currentFilter === 'not_specified' ? 'active' : ''}" data-filter="not_specified">
                <div class="filter-icon">👥</div>
                <div class="filter-text">Hamma bilan</div>
            </div>
        </div>
        <div class="filter-info">
            Filter: ${getFilterText(gameState.currentFilter)}
        </div>
    `;
    
    // Event listener qo'shish
    setTimeout(() => {
        const filterOptions = filterContainer.querySelectorAll('.gender-filter-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                const filter = option.dataset.filter;
                selectFilter(filter);
            });
        });
    }, 100);
    
    return filterContainer;
}

function getFilterText(filter) {
    switch(filter) {
        case 'male': return 'Faqat erkaklar';
        case 'female': return 'Faqat ayollar';
        default: return 'Hamma bilan';
    }
}

function selectFilter(filter) {
    console.log(`🎯 Filter tanlash: ${filter}`);
    
    gameState.currentFilter = filter;
    userState.filter = filter;
    localStorage.setItem('userFilter', filter);
    
    // UI ni yangilash
    const filterOptions = document.querySelectorAll('.gender-filter-option');
    filterOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.filter === filter) {
            option.classList.add('active');
        }
    });
    
    // Filter info text ni yangilash
    const filterInfoElements = document.querySelectorAll('.filter-info');
    filterInfoElements.forEach(el => {
        el.textContent = `Filter: ${getFilterText(filter)}`;
    });
    
    showNotification('✅ Filter o\'zgartirildi',
        filter === 'male' ? 'Endi faqat erkaklar bilan duel!' :
        filter === 'female' ? 'Endi faqat ayollar bilan duel!' :
        'Endi hamma bilan duel!');
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('update_profile', { filter: filter });
        
        if (gameState.isInQueue) {
            gameState.socket.emit('leave_queue');
            setTimeout(() => {
                enterQueue();
            }, 500);
        }
    }
}

function addFilterToWelcomeScreen() {
    const profileCard = document.getElementById('profileCard');
    if (!profileCard) return;
    
    const existingFilter = profileCard.querySelector('.gender-filter-container');
    if (existingFilter) {
        existingFilter.remove();
    }
    
    const startBtn = profileCard.querySelector('.start-btn');
    const filterElement = createFilterOptions();
    
    if (startBtn && startBtn.parentNode) {
        startBtn.parentNode.insertBefore(filterElement, startBtn);
    }
}

// ==================== GENDER TANLASH ==================== 
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    // User state ni yangilash
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    userState.filter = gender;
    
    // Gender tanlaganda bonus berish
    if (!localStorage.getItem('genderSelectedBonus')) {
        userState.coins += 50;
        localStorage.setItem('genderSelectedBonus', 'true');
        showNotification('🎁 Bonus!', 'Gender tanlaganingiz uchun 50 coin bonus!');
    }
    
    // Gender tanlanganini permanent saqlash
    localStorage.setItem('permanentGenderSelected', 'true');
    localStorage.setItem('permanentUserGender', gender);
    localStorage.setItem('userFilter', gender);
    localStorage.setItem('userGender', gender);
    localStorage.setItem('hasSelectedGender', 'true');
    
    // Game state ni yangilash
    gameState.currentFilter = gender;
    gameState.isGenderSelected = true;
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    addFilterToWelcomeScreen();
    
    hideGenderModal();
    
    // Servere ulanish
    console.log('🔌 Gender tanlandi, servere ulanmoqda...');
    connectToServer();
    
    showNotification('✅ Jins tanlandi',
        gender === 'male' ? 'Erkak sifatida ro\'yxatdan o\'tdingiz!' :
        gender === 'female' ? 'Ayol sifatida ro\'yxatdan o\'tdingiz!' :
        'Barcha jinslar bilan duel o\'ynashingiz mumkin!');
    
    // Achievement tekshirish
    checkAchievement('first_gender_selection');
}

// ==================== MODAL FUNKSIYALARI ==================== 
function showGenderModal(mandatory = true) {
    console.log('🎯 Gender modali ko\'rsatilmoqda');
    
    if (!elements.genderModal) return;
    
    // Allaqachon ochiq bo'lsa
    if (elements.genderModal.classList.contains('active')) {
        console.log('ℹ️ Gender modal allaqachon ochiq');
        return;
    }
    
    // Permanent gender tanlanganligini tekshirish
    const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
    if (permanentGenderSelected) {
        console.log('✅ Gender allaqachon tanlangan, modal ko\'rsatilmaydi');
        return;
    }
    
    elements.genderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (mandatory && elements.genderWarning) {
        elements.genderWarning.classList.remove('hidden');
    }
    
    // Tugmalarga event listener qo'shish
    setTimeout(() => {
        if (elements.selectMaleBtn && !elements.selectMaleBtn.hasAttribute('data-listener-added')) {
            elements.selectMaleBtn.addEventListener('click', () => selectGender('male'));
            elements.selectMaleBtn.setAttribute('data-listener-added', 'true');
        }
        
        if (elements.selectFemaleBtn && !elements.selectFemaleBtn.hasAttribute('data-listener-added')) {
            elements.selectFemaleBtn.addEventListener('click', () => selectGender('female'));
            elements.selectFemaleBtn.setAttribute('data-listener-added', 'true');
        }
        
        if (elements.selectAllBtn && !elements.selectAllBtn.hasAttribute('data-listener-added')) {
            elements.selectAllBtn.addEventListener('click', () => selectGender('not_specified'));
            elements.selectAllBtn.setAttribute('data-listener-added', 'true');
        }
    }, 100);
}

function hideGenderModal() {
    if (elements.genderModal) {
        elements.genderModal.classList.remove('active');
    }
    if (elements.genderWarning) {
        elements.genderWarning.classList.add('hidden');
    }
    document.body.style.overflow = 'auto';
}

// ==================== TAKOMILLASHTIRILGAN SERVERGA ULANISH ==================== 
function connectToServer() {
    if (!tgUserGlobal) {
        tgUserGlobal = {
            id: 'temp_' + Date.now(),
            first_name: 'Mehmon',
            username: 'guest'
        };
    }
    
    if (gameState.socket?.connected) {
        console.log('ℹ️ Allaqachon serverga ulanilgan');
        showNotification('Diqqat', 'Allaqachon serverga ulangansiz');
        return;
    }
    
    console.log('🔗 Serverga ulanmoqda...');
    gameState.connectionStatus = 'connecting';
    updateQueueStatus('Serverga ulanmoqda...');
    showNotification('Ulanish', 'Serverga ulanmoqda...');
    
    // Server URL lari
    const servers = [
        'wss://like-duel.onrender.com',
        'wss://backup-server.onrender.com',
        'ws://localhost:3000'
    ];
    
    let currentServerIndex = 0;
    let connected = false;
    
    function tryNextServer() {
        if (currentServerIndex >= servers.length) {
            console.error('❌ Barcha serverlarga ulanish muvaffaqiyatsiz');
            gameState.connectionStatus = 'disconnected';
            showNotification('Xato', 'Serverga ulanib bo\'lmadi. Iltimos, keyinroq urinib ko\'ring.');
            updateQueueButton();
            return;
        }
        
        const socketUrl = servers[currentServerIndex];
        console.log(`🔄 ${socketUrl} serveriga ulanish urinilmoqda...`);
        
        if (gameState.socket) {
            gameState.socket.disconnect();
            gameState.socket = null;
        }
        
        try {
            gameState.socket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000,
                forceNew: true,
                autoConnect: true,
                query: {
                    userId: tgUserGlobal.id,
                    platform: 'web',
                    version: '1.0.0'
                }
            });
            
            setupSocketEvents(gameState.socket);
            
            // Timeout
            const connectionTimeout = setTimeout(() => {
                if (!connected) {
                    console.log(`⏱️ ${socketUrl} ga ulanish vaqti tugadi`);
                    gameState.socket.disconnect();
                    currentServerIndex++;
                    tryNextServer();
                }
            }, 8000);
            
            gameState.socket.once('connect', () => {
                clearTimeout(connectionTimeout);
                connected = true;
                console.log(`✅ ${socketUrl} serveriga ulandi`);
                gameState.connectionStatus = 'connected';
                
                // Ping o'lchashni boshlash
                startPingMeasurement();
                
                // Authentication yuborish
                authenticateUser();
            });
            
            gameState.socket.once('connect_error', (error) => {
                clearTimeout(connectionTimeout);
                console.error(`❌ ${socketUrl} ga ulanish xatosi:`, error);
                currentServerIndex++;
                setTimeout(tryNextServer, 1000);
            });
            
        } catch (error) {
            console.error('❌ Socket yaratish xatosi:', error);
            currentServerIndex++;
            setTimeout(tryNextServer, 1000);
        }
    }
    
    tryNextServer();
}

function setupSocketEvents(socket) {
    // Asosiy eventlar
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('connect_error', handleSocketError);
    socket.on('reconnect', handleSocketReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_error', handleReconnectError);
    
    // O'yin eventlari
    socket.on('auth_ok', handleAuthOk);
    socket.on('show_gender_selection', handleShowGenderSelection);
    socket.on('gender_selected', handleGenderSelected);
    socket.on('queue_joined', handleQueueJoined);
    socket.on('waiting_count', handleWaitingCount);
    socket.on('duel_started', handleDuelStarted);
    socket.on('match', handleMatch);
    socket.on('mutual_match', handleMutualMatch);
    socket.on('no_match', handleNoMatch);
    socket.on('waiting_response', handleWaitingResponse);
    socket.on('friends_list', handleFriendsList);
    socket.on('profile_updated', handleProfileUpdated);
    socket.on('super_like_used', handleSuperLikeUsed);
    socket.on('daily_reset', handleDailyReset);
    socket.on('opponent_left', handleOpponentLeft);
    socket.on('quest_updated', handleQuestUpdated);
    socket.on('achievement_unlocked', handleAchievementUnlocked);
    socket.on('ping', handlePing);
    socket.on('error', handleSocketError);
}

function authenticateUser() {
    console.log('📤 Auth ma\'lumotlari yuborilmoqda...');
    
    // Permanent gender tanlanganligini tekshirish
    const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
    const permanentUserGender = localStorage.getItem('permanentUserGender');
    
    let genderToSend = userState.currentGender;
    let hasSelectedGenderToSend = userState.hasSelectedGender;
    let filterToSend = userState.filter;
    
    if (permanentGenderSelected && permanentUserGender) {
        genderToSend = permanentUserGender;
        hasSelectedGenderToSend = true;
        filterToSend = permanentUserGender;
        
        // Local state ni yangilash
        userState.currentGender = permanentUserGender;
        userState.hasSelectedGender = true;
        userState.filter = permanentUserGender;
        gameState.currentFilter = permanentUserGender;
    }
    
    gameState.socket.emit('auth', {
        userId: tgUserGlobal.id.toString(),
        firstName: tgUserGlobal.first_name,
        lastName: tgUserGlobal.last_name || '',
        username: tgUserGlobal.username,
        photoUrl: tgUserGlobal.photo_url || `https://ui-avatars.com/api/?name=${tgUserGlobal.first_name || 'User'}&background=667eea&color=fff`,
        language: tgUserGlobal.language_code || 'uz',
        gender: genderToSend,
        hasSelectedGender: hasSelectedGenderToSend,
        bio: userState.bio,
        filter: filterToSend,
        version: '1.0.0',
        platform: typeof Telegram !== 'undefined' ? 'telegram' : 'web'
    });
}

// ==================== SOCKET EVENT HANDLERS ==================== 
function handleSocketConnect() {
    console.log('✅ Socket ulandi');
    gameState.isConnected = true;
    gameState.connectionStatus = 'connected';
    gameState.reconnectAttempts = 0;
    updateQueueStatus('Serverga ulandi...');
    updateQueueButton();
}

function handleSocketDisconnect(reason) {
    console.log('❌ Socket uzildi:', reason);
    gameState.isConnected = false;
    gameState.connectionStatus = 'disconnected';
    updateQueueButton();
    
    if (gameState.pingInterval) {
        clearInterval(gameState.pingInterval);
        gameState.pingInterval = null;
    }
    
    // Qayta ulanish
    if (reason !== 'io client disconnect') {
        gameState.connectionStatus = 'reconnecting';
        
        setTimeout(() => {
            if (!gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                connectToServer();
            }
        }, 3000);
    }
}

function handleSocketError(error) {
    console.error('❌ Socket xatosi:', error);
    gameState.connectionStatus = 'disconnected';
    updateQueueButton();
}

function handleSocketReconnect(attempt) {
    console.log(`🔄 Qayta ulandi (urinish: ${attempt})`);
    gameState.connectionStatus = 'connected';
    updateQueueButton();
}

function handleReconnectAttempt(attempt) {
    console.log(`🔄 Qayta ulanish urinishi: ${attempt}`);
    gameState.connectionStatus = 'reconnecting';
}

function handleReconnectError(error) {
    console.error('❌ Qayta ulanish xatosi:', error);
}

function handleAuthOk(data) {
    console.log('✅ Autentifikatsiya muvaffaqiyatli');
    
    // Permanent gender tanlanganligini tekshirish
    const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
    const permanentUserGender = localStorage.getItem('permanentUserGender');
    
    if (permanentGenderSelected && permanentUserGender) {
        data.gender = permanentUserGender;
        data.hasSelectedGender = true;
        data.filter = permanentUserGender;
        
        // Servere yangilash
        gameState.socket.emit('select_gender', { gender: permanentUserGender });
        gameState.socket.emit('update_profile', {
            gender: permanentUserGender,
            filter: permanentUserGender,
            hasSelectedGender: true
        });
    }
    
    // User stateni yangilash
    Object.assign(userState, {
        currentGender: data.gender || userState.currentGender,
        hasSelectedGender: data.hasSelectedGender !== undefined ? data.hasSelectedGender : userState.hasSelectedGender,
        coins: data.coins || userState.coins,
        level: data.level || userState.level,
        rating: data.rating || userState.rating,
        matches: data.matches || userState.matches,
        duels: data.duels || userState.duels,
        wins: data.wins || userState.wins,
        totalLikes: data.totalLikes || userState.totalLikes,
        dailySuperLikes: data.dailySuperLikes || userState.dailySuperLikes,
        bio: data.bio || userState.bio,
        filter: data.filter || userState.filter,
        mutualMatchesCount: data.mutualMatchesCount || userState.mutualMatchesCount,
        friendsCount: data.friendsCount || userState.friendsCount,
        streakDays: data.streakDays || userState.streakDays,
        dailyQuests: data.dailyQuests || userState.dailyQuests,
        achievements: data.achievements || userState.achievements
    });
    
    // Game state ni yangilash
    gameState.currentFilter = userState.filter;
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    updateQueueButton();
    
    showScreen('welcome');
    
    if (userState.hasSelectedGender) {
        console.log('✅ Gender tanlangan, navbatga kirish mumkin');
        updateQueueStatus('"Navbatga Kirish" tugmasini bosing');
    } else {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        updateQueueStatus('Gender tanlash kerak...');
        
        // Faqat permanent gender tanlanmagan bo'lsa modalni ko'rsat
        if (!permanentGenderSelected) {
            setTimeout(() => {
                showGenderModal(true);
            }, 500);
        }
    }
    
    // Kunlik vazifalarni yuklash
    if (data.dailyQuests) {
        loadDailyQuests();
    }
}

function handleShowGenderSelection(data) {
    console.log('⚠️ Serverdan gender tanlash so\'rovi');
    
    // Permanent gender tanlanganligini tekshirish
    const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
    const permanentUserGender = localStorage.getItem('permanentUserGender');
    
    if (permanentGenderSelected && permanentUserGender) {
        console.log('✅ Gender allaqachon tanlangan, serverga bildirish');
        gameState.socket.emit('gender_selected', {
            gender: permanentUserGender,
            hasSelectedGender: true
        });
        return;
    }
    
    showGenderModal(true);
    updateQueueStatus('Gender tanlash kerak...');
}

function handleGenderSelected(data) {
    console.log('✅ Gender tanlandi:', data);
    
    userState.currentGender = data.gender;
    userState.hasSelectedGender = true;
    userState.filter = data.gender;
    
    // Permanent saqlash
    localStorage.setItem('permanentGenderSelected', 'true');
    localStorage.setItem('permanentUserGender', data.gender);
    localStorage.setItem('userFilter', data.gender);
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    updateQueueButton();
    
    hideGenderModal();
    
    showNotification('🎉 Jins tanlandi', data.message || 'Endi duel o\'ynashingiz mumkin!');
    updateQueueStatus('Gender tanlandi. "Navbatga Kirish" tugmasini bosing');
}

function handleQueueJoined(data) {
    console.log('✅ Navbatga kirdingiz:', data);
    gameState.isInQueue = true;
    showScreen('queue');
    updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
    updateQueueButton();
    updateBackButtonVisibility();
    
    if (elements.waitingCount) elements.waitingCount.textContent = data.total;
    if (elements.position) {
        elements.position.textContent = data.position;
        if (elements.positionInfo) elements.positionInfo.style.display = 'block';
    }
}

function handleWaitingCount(data) {
    if (elements.waitingCount) elements.waitingCount.textContent = data.count;
    if (elements.position) {
        if (data.position > 0) {
            elements.position.textContent = data.position;
            if (elements.positionInfo) elements.positionInfo.style.display = 'block';
            updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.count}`);
        } else {
            if (elements.positionInfo) elements.positionInfo.style.display = 'none';
            updateQueueStatus('Navbatda...');
        }
    }
}

function handleDuelStarted(data) {
    console.log('⚔️ Duel boshlandi');
    
    gameState.isInDuel = true;
    gameState.isInQueue = false;
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    gameState.inMatchScreen = false;
    gameState.currentDuelId = data.duelId;
    showScreen('duel');
    
    updateQueueButton();
    updateBackButtonVisibility();
    clearInterval(gameState.timerInterval);
    resetVoteButtons();
    
    // Raqib ma'lumotlarini yangilash
    updateOpponentInfo(data.opponent);
    
    startTimer();
    updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
}

function handleMatch(data) {
    console.log('🎉 MATCH!');
    
    gameState.matchCompleted = true;
    gameState.lastMatchData = data;
    handleMatchResult(data);
}

function handleMutualMatch(data) {
    console.log('🤝 O\'ZARO SUPER LIKE Match qo\'shildi');
    
    userState.mutualMatchesCount = data.mutualMatchesCount || userState.mutualMatchesCount;
    userState.friendsCount = data.friendsCount || userState.friendsCount;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    if (gameState.currentTab === 'friends') {
        loadFriendsList();
    }
    
    showNotification('🎉 DO\'ST BO\'LDINGIZ!',
        `${data.partnerName} bilan o\'zaro SUPER LIKE! Endi siz do\'st bo\'ldingiz.`);
}

function handleNoMatch(data) {
    console.log('❌ Match bo\'lmadi');
    gameState.matchCompleted = true;
    handleNoMatchResult(data);
}

function handleWaitingResponse(data) {
    console.log('⏳ Raqib javobini kutish');
    handleWaitingForResponse(data);
}

function handleFriendsList(data) {
    console.log('👥 Dostlar royxati');
    gameState.friendsList = data.friends;
    updateFriendsListUI(data);
}

function handleProfileUpdated(data) {
    console.log('📊 Profil yangilandi');
    updateStatsFromServer(data);
}

function handleSuperLikeUsed(data) {
    console.log('💖 Super like ishlatildi');
    if (elements.superLikeCount) elements.superLikeCount.textContent = data.remaining;
    userState.dailySuperLikes = data.remaining;
    saveUserStateToLocalStorage();
}

function handleDailyReset(data) {
    console.log('🔄 Kunlik limitlar yangilandi');
    if (elements.superLikeCount) elements.superLikeCount.textContent = data.superLikes;
    userState.dailySuperLikes = data.superLikes;
    userState.dailyQuests = data.dailyQuests || [];
    saveUserStateToLocalStorage();
    
    loadDailyQuests();
    showNotification('Kun yangilandi', 'Kunlik SUPER LIKE lar va vazifalar qayta tiklandi!');
}

function handleOpponentLeft() {
    console.log('🚪 Raqib chiqib ketdi');
    clearInterval(gameState.timerInterval);
    updateDuelStatus('Raqib chiqib ketdi. Keyingi duelga tayyormisiz?');
    
    showOpponentLeftModal();
}

function handleQuestUpdated(data) {
    console.log('🎯 Vazifa yangilandi');
    userState.dailyQuests = data.quests;
    saveUserStateToLocalStorage();
    loadDailyQuests();
    
    if (data.completed) {
        showNotification('✅ Vazifa bajarildi!', `${data.reward} coin qo'shildi!`);
    }
}

function handleAchievementUnlocked(data) {
    console.log('🏆 Achievement ochildi');
    userState.achievements = data.achievements;
    saveUserStateToLocalStorage();
    loadAchievements();
    
    showAchievementNotification(data.achievement);
}

function handlePing(data) {
    const ping = Date.now() - data.sent;
    gameState.averagePing = (gameState.averagePing * 0.8) + (ping * 0.2);
}

// ==================== PING O'LCHASH ==================== 
function startPingMeasurement() {
    if (gameState.pingInterval) {
        clearInterval(gameState.pingInterval);
    }
    
    gameState.pingInterval = setInterval(() => {
        if (gameState.socket?.connected) {
            gameState.socket.emit('ping', { sent: Date.now() });
        }
    }, 5000);
}

// ==================== O'YINNI BOSHLASH ==================== 
function startGame() {
    console.log('🎮 O\'yni boshlash');
    
    // Avval gender tanlanganligini tekshirish
    const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
    
    if (!permanentGenderSelected) {
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        showGenderModal(true);
        return;
    }
    
    connectToServer();
}

// ==================== NAVBATGA KIRISH ==================== 
function enterQueue() {
    console.log('🎮 Navbatga kirish funksiyasi');
    
    if (!tgUserGlobal) {
        showNotification('Xato', 'Foydalanuvchi ma\'lumotlari topilmadi');
        return;
    }
    
    if (!gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Avval serverga ulanishingiz kerak');
        connectToServer();
        return;
    }
    
    // Permanent gender tanlanganligini tekshirish
    const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
    if (!permanentGenderSelected) {
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        showGenderModal(true);
        return;
    }
    
    if (gameState.isInQueue) {
        showNotification('Diqqat', 'Siz allaqachon navbatdasiz');
        return;
    }
    
    console.log('🔄 Navbatga kirish...');
    gameState.isInQueue = true;
    updateQueueButton();
    gameState.socket.emit('enter_queue');
    showScreen('queue');
    showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
}

// ==================== USER STATE LOCALSTORAGE GA SAQLASH ==================== 
function saveUserStateToLocalStorage() {
    localStorage.setItem('userGender', userState.currentGender || '');
    localStorage.setItem('hasSelectedGender', userState.hasSelectedGender.toString());
    localStorage.setItem('userCoins', userState.coins.toString());
    localStorage.setItem('userLevel', userState.level.toString());
    localStorage.setItem('userRating', userState.rating.toString());
    localStorage.setItem('userMatches', userState.matches.toString());
    localStorage.setItem('userDuels', userState.duels.toString());
    localStorage.setItem('userWins', userState.wins.toString());
    localStorage.setItem('userTotalLikes', userState.totalLikes.toString());
    localStorage.setItem('userDailySuperLikes', userState.dailySuperLikes.toString());
    localStorage.setItem('userBio', userState.bio.toString());
    localStorage.setItem('userFilter', userState.filter.toString());
    localStorage.setItem('mutualMatchesCount', userState.mutualMatchesCount.toString());
    localStorage.setItem('friendsCount', userState.friendsCount.toString());
    localStorage.setItem('userStreakDays', userState.streakDays.toString());
    localStorage.setItem('userLastLogin', new Date().toISOString());
    localStorage.setItem('userTotalPlayTime', userState.totalPlayTime.toString());
    localStorage.setItem('userDailyQuests', JSON.stringify(userState.dailyQuests));
    localStorage.setItem('userAchievements', JSON.stringify(userState.achievements));
}

// ==================== KUNLIK LOGIN STREAK ==================== 
function checkDailyLoginStreak() {
    const today = new Date().toDateString();
    const lastLogin = userState.lastLogin ? new Date(userState.lastLogin).toDateString() : null;
    
    if (lastLogin === today) {
        return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastLogin === yesterdayStr) {
        userState.streakDays++;
        showNotification('🔥 Streak!', `Ketma-ket ${userState.streakDays} kun login qildingiz!`);
    } else if (lastLogin && lastLogin !== yesterdayStr) {
        userState.streakDays = 1;
        showNotification('📅 Yangi streak', 'Yangi login streak boshlandi!');
    } else {
        userState.streakDays = 1;
    }
    
    userState.lastLogin = new Date().toISOString();
    saveUserStateToLocalStorage();
    
    checkStreakRewards();
}

function checkStreakRewards() {
    const streakRewards = {
        3: 50,
        7: 100,
        14: 200,
        30: 500
    };
    
    if (streakRewards[userState.streakDays]) {
        const reward = streakRewards[userState.streakDays];
        userState.coins += reward;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification('🎁 Streak mukofoti!',
            `${userState.streakDays} kunlik streak uchun ${reward} coin qo'shildi!`);
    }
}

// ==================== TUGMALARNI RESET QILISH ==================== 
function resetVoteButtons() {
    console.log('🔄 Tugmalar reset qilinmoqda...');
    
    const buttons = [elements.noBtn, elements.likeBtn, elements.superLikeBtn];
    buttons.forEach(b => {
        if (b) {
            b.disabled = false;
            b.style.opacity = '1';
            b.style.cursor = 'pointer';
            b.style.transform = 'scale(1)';
        }
    });
    
    if (elements.noBtn) {
        elements.noBtn.textContent = '✖';
        elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.textContent = '❤️';
        elements.likeBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.textContent = '💖';
        elements.superLikeBtn.style.background = 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)';
        elements.superLikeBtn.disabled = userState.dailySuperLikes <= 0;
        if (userState.dailySuperLikes <= 0) {
            elements.superLikeBtn.style.opacity = '0.5';
            elements.superLikeBtn.style.cursor = 'not-allowed';
        }
    }
}

// ==================== OVOZ BERISH ==================== 
function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }

    console.log(`🗳️ Ovoz berish: ${choice}`);

    // Tugmalarni block qilish
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
            b.style.cursor = 'not-allowed';
        }
    });

    // Super like limitini tekshirish
    if (choice === 'super_like' && userState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        resetVoteButtons();
        return;
    }

    // Animation
    const button = choice === 'skip' ? elements.noBtn :
                  choice === 'like' ? elements.likeBtn : elements.superLikeBtn;
    if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (button) button.style.transform = 'scale(1)';
        }, 150);
    }

    // Serverga yuborish
    gameState.socket.emit('vote', {
        duelId: gameState.currentDuelId,
        choice: choice
    });

    clearInterval(gameState.timerInterval);

    // UI ni yangilash
    switch(choice) {
        case 'like':
            if (elements.timer) elements.timer.textContent = '❤️';
            updateDuelStatus('LIKE berdingiz. Raqib javobini kutish...');
            break;
        case 'super_like':
            if (elements.timer) elements.timer.textContent = '💖';
            updateDuelStatus('SUPER LIKE! Raqib javobini kutish...');
            userState.dailySuperLikes--;
            if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
            saveUserStateToLocalStorage();
            break;
        case 'skip':
            if (elements.timer) elements.timer.textContent = '✖';
            updateDuelStatus('Duel tugatildi...');
            gameState.matchCompleted = true;

            setTimeout(() => {
                handleSkipResult();
            }, 500);
            break;
    }

    updateGameStats(choice);
}

// ==================== SKIP NATIJASI ==================== 
function handleSkipResult() {
    console.log('✖ Duel tugatildi');
    
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.inMatchScreen = false;
    
    resetVoteButtons();
    
    showNoMatchOptions();
}

// ==================== MATCH HANDLERS ==================== 
function handleMatchResult(data) {
    console.log('🎉 MATCH!');
    
    clearInterval(gameState.timerInterval);
    
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = data.partner;
    gameState.lastOpponent = data.partner?.id;
    gameState.waitingForOpponent = false;
    gameState.inMatchScreen = true;
    
    resetVoteButtons();
    updateBackButtonVisibility();
    
    showScreen('match');
    
    updateMatchUI(data);
    
    if (data.rewards) {
        applyMatchRewards(data.rewards);
    }
    
    createMatchOptions(data);
    
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 300,
            spread: 100,
            origin: { y: 0.6 }
        });
    }
}

function updateMatchUI(data) {
    if (elements.partnerName) elements.partnerName.textContent = data.partner?.name || 'Raqib';
    
    let matchHTML = '';
    let matchClass = '';
    
    if (data.isMutual && data.isSuperLike) {
        matchHTML = `
            <div class="match-icon">💖</div>
            <div class="match-title">O'ZARO SUPER LIKE!</div>
            <div class="match-message">${data.partner?.name || 'Raqib'} bilan SUPER LIKE bo'ldingiz!</div>
            <div class="match-note">
                🎉 Endi siz do'stlaringiz ro'yxatidasiz!
            </div>
        `;
        matchClass = 'super-match';
    } else if (data.isMutual) {
        matchHTML = `
            <div class="match-icon">🎉</div>
            <div class="match-title">O'ZARO MATCH!</div>
            <div class="match-message">${data.partner?.name || 'Raqib'} bilan bir-biringizni yoqtirdingiz!</div>
        `;
        matchClass = 'mutual-match';
    } else {
        matchHTML = `
            <div class="match-icon">❤️</div>
            <div class="match-title">Bir tomonli Like</div>
            <div class="match-message">Siz ${data.partner?.name || 'Raqib'} ni yoqtirdingiz</div>
            <div class="match-note">
                ❌ O'zaro match bo'lmadi
            </div>
        `;
        matchClass = 'one-sided-match';
    }
    
    if (elements.matchText) {
        elements.matchText.innerHTML = matchHTML;
        elements.matchText.className = `match-text ${matchClass}`;
    }
}

function applyMatchRewards(rewards) {
    if (elements.rewardCoins) elements.rewardCoins.textContent = rewards.coins || 0;
    if (elements.rewardXP) elements.rewardXP.textContent = rewards.xp || 0;
    
    userState.coins += rewards.coins || 0;
    userState.rating = rewards.newRating || userState.rating;
    userState.matches++;
    
    const oldLevel = userState.level;
    userState.level = Math.floor(userState.rating / 100) + 1;
    
    if (userState.level > oldLevel) {
        showLevelUpNotification(oldLevel, userState.level);
    }
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    updateDailyQuest('play_duel');
    if (rewards.coins > 0) {
        updateDailyQuest('earn_coins', rewards.coins);
    }
}

function createMatchOptions(data) {
    if (!elements.matchOptions) return;
    
    elements.matchOptions.innerHTML = '';
    
    const options = [];
    
    if (data.isMutual && data.isSuperLike) {
        options.push({
            action: 'open_chat',
            label: '💬 Chatga o\'tish',
            icon: 'fa-comments',
            style: 'background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);',
            priority: 1
        });
    }
    
    options.push(
        {
            action: 'rematch',
            label: '🔄 Qayta duel',
            icon: 'fa-redo',
            style: 'background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);',
            priority: 2,
            disabled: !data.partner?.id
        },
        {
            action: 'continue_match_screen',
            label: '➡️ Yangi duel',
            icon: 'fa-play',
            style: 'background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);',
            priority: 3
        },
        {
            action: 'return_to_menu',
            label: '🏠 Bosh menyu',
            icon: 'fa-home',
            style: 'background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);',
            priority: 4
        }
    );
    
    options.sort((a, b) => a.priority - b.priority);
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'match-option-btn';
        if (opt.disabled) {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
        btn.innerHTML = `${opt.label}`;
        btn.style.cssText = opt.style;
        btn.onclick = () => handleMatchOption(opt.action, data.partner);
        elements.matchOptions.appendChild(btn);
    });
}

function handleMatchOption(action, partner) {
    console.log(`Match option: ${action}`);
    
    switch(action) {
        case 'open_chat':
            openChat(partner);
            return;
        case 'rematch':
            requestRematch(partner);
            break;
        case 'continue_match_screen':
            showNextDuelConfirmModal();
            break;
        case 'return_to_menu':
            returnToMenu();
            break;
        default:
            returnToMenu();
    }
}

function handleNoMatchResult(data) {
    console.log('❌ Match bo\'lmadi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.inMatchScreen = false;
    
    resetVoteButtons();
    
    if (elements.timer) elements.timer.textContent = '✖';
    
    setTimeout(() => {
        showNoMatchModal();
    }, 1500);
}

// ==================== TIMER FUNKSIYASI ==================== 
function startTimer() {
    if (elements.timer) {
        elements.timer.textContent = '∞';
        elements.timer.style.color = '#fff';
        elements.timer.style.fontSize = '3rem';
        elements.timer.style.animation = '';
    }
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// ==================== RAQIB MA'LUMOTLARI ==================== 
function updateOpponentInfo(opponent) {
    if (!opponent) return;
    
    const genderColor = opponent.gender === 'female' ? '#f5576c' : '#667eea';
    
    if (elements.opponentAvatar) {
        elements.opponentAvatar.src = opponent.photo || 
            `https://ui-avatars.com/api/?name=${opponent.name || 'O'}&background=${genderColor.replace('#', '')}&color=fff`;
        elements.opponentAvatar.style.borderColor = genderColor;
    }
    
    if (elements.opponentName) {
        elements.opponentName.innerHTML = opponent.name || 'Raqib';
        addGenderBadge(elements.opponentName, opponent.gender);
    }
    
    if (elements.opponentUsername) {
        elements.opponentUsername.textContent = opponent.username ? '@' + opponent.username : '';
    }
    
    if (elements.opponentRating) elements.opponentRating.textContent = opponent.rating || 1500;
    if (elements.opponentMatches) elements.opponentMatches.textContent = opponent.matches || 0;
    if (elements.opponentLevel) elements.opponentLevel.textContent = opponent.level || 1;
}

// ==================== CHAT FUNKSIYALARI ==================== 
function openChat(partner) {
    if (!partner) return;
    
    gameState.isChatModalOpen = true;
    
    if (elements.chatPartnerAvatar) {
        elements.chatPartnerAvatar.src = partner.photo || 
            `https://ui-avatars.com/api/?name=${partner.name}&background=667eea&color=fff`;
    }
    
    if (elements.chatPartnerName) {
        elements.chatPartnerName.textContent = partner.name;
    }
    
    if (elements.chatUsername) {
        elements.chatUsername.textContent = partner.username ? `@${partner.username}` : '';
    }
    
    if (elements.chatTitle) {
        elements.chatTitle.textContent = `${partner.name} bilan chat`;
    }
    
    if (elements.chatModal) {
        elements.chatModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    if (elements.chatOpenTelegramBtn) {
        elements.chatOpenTelegramBtn.disabled = !partner.username;
        elements.chatOpenTelegramBtn.title = partner.username ? 
            'Telegramda ochish' : 'Telegram username mavjud emas';
    }
}

function openTelegramChat(username) {
    if (!username) {
        showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        return;
    }
    
    const telegramUrl = `https://t.me/${username.replace('@', '')}`;
    
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
        window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    }
}

function closeChatModal() {
    console.log('💬 Chat modali yopilmoqda');
    
    gameState.isChatModalOpen = false;
    if (elements.chatModal) {
        elements.chatModal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
    
    if (gameState.inMatchScreen) {
        showScreen('match');
    } else {
        returnToMenu();
    }
}

// ==================== NAVBATDAN CHIQISH ==================== 
function leaveQueue() {
    console.log('🚪 Navbatdan chiqish');
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
    
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    clearInterval(gameState.timerInterval);
    
    updateQueueButton();
    updateBackButtonVisibility();
    showScreen('welcome');
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "Navbatga Kirish" tugmasini bosing');
}

function returnToMenu() {
    console.log('🏠 Bosh menyuga qaytish');
    
    hideAllModals();
    closeChatModal();
    
    clearInterval(gameState.timerInterval);
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
    
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    gameState.inMatchScreen = false;
    
    if (elements.timer) {
        elements.timer.textContent = '∞';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
    
    resetVoteButtons();
    updateQueueButton();
    updateBackButtonVisibility();
    
    showScreen('welcome');
    
    showNotification('Bosh menyuga qaytildi', 'Yana o\'ynash uchun "Navbatga Kirish" tugmasini bosing');
}

// ==================== DO'STLAR FUNKSIYALARI ==================== 
function loadFriendsList() {
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('get_friends_list');
    } else {
        const testFriends = [
            {
                id: 'test_1',
                name: 'Ali',
                username: 'ali_test',
                photo: '',
                online: true,
                lastActive: new Date(),
                gender: 'male',
                rating: 1600,
                matches: 15,
                isMutual: true
            },
            {
                id: 'test_2',
                name: 'Malika',
                username: 'malika_test',
                photo: '',
                online: false,
                lastActive: new Date(Date.now() - 3600000),
                gender: 'female',
                rating: 1750,
                matches: 22,
                isMutual: true
            }
        ];
        
        updateFriendsListUI({
            friends: testFriends,
            total: testFriends.length,
            online: testFriends.filter(f => f.online).length
        });
    }
}

function updateFriendsListUI(data) {
    const friends = data.friends || [];
    const mutualFriends = friends.filter(f => f.isMutual);
    
    if (elements.friendsList) {
        if (friends.length === 0) {
            elements.friendsList.innerHTML = '';
            if (elements.noFriends) {
                elements.noFriends.classList.remove('hidden');
                elements.noFriends.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👥</div>
                        <h3>Do'stlaringiz yo'q</h3>
                        <p>O'zaro SUPER LIKE qilgan foydalanuvchilar bu yerda ko'rinadi</p>
                    </div>
                `;
            }
        } else {
            if (elements.noFriends) elements.noFriends.classList.add('hidden');
            
            elements.friendsList.innerHTML = friends.map(friend => `
                <div class="friend-item">
                    <div class="friend-info">
                        <img src="${friend.photo || `https://ui-avatars.com/api/?name=${friend.name}&background=667eea&color=fff`}" 
                             alt="${friend.name}" class="friend-avatar">
                        <div class="friend-details">
                            <div class="friend-name">
                                ${friend.name}
                                ${friend.isMutual ? ' <span class="mutual-badge">Do\'st</span>' : ''}
                                ${friend.online ? '<span class="online-badge"></span>' : ''}
                            </div>
                            <div class="friend-username">@${friend.username}</div>
                            <div class="friend-stats">
                                <span class="friend-stat">⭐ ${friend.rating}</span>
                                <span class="friend-stat">🎮 ${friend.matches}</span>
                                <span class="friend-stat">${friend.online ? 'Onlayn' : formatLastActive(friend.lastActive)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="friend-actions">
                        ${friend.isMutual ? 
                            `<button class="friend-action-btn chat-btn" onclick="openChat(${JSON.stringify(friend).replace(/"/g, '&quot;')})">
                                💬 Chat
                            </button>` 
                            : 
                            `<button class="friend-action-btn disabled">
                                ⏳ Kutish
                            </button>`
                        }
                    </div>
                </div>
            `).join('');
        }
    }
    
    if (elements.friendsCount) elements.friendsCount.textContent = mutualFriends.length;
    if (elements.onlineFriendsCount) {
        const onlineCount = mutualFriends.filter(f => f.online).length;
        elements.onlineFriendsCount.textContent = onlineCount;
    }
}

function formatLastActive(timestamp) {
    if (!timestamp) return 'noma\'lum';
    
    const lastActive = new Date(timestamp);
    const now = new Date();
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'hozir';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays < 7) return `${diffDays} kun oldin`;
    return lastActive.toLocaleDateString('uz-UZ');
}

// ==================== DO'KON FUNKSIYALARI ==================== 
function loadShopItems() {
    const items = [
        {
            id: 1,
            name: '10 Super Like',
            price: 100,
            icon: '💖',
            description: '10 ta kunlik SUPER LIKE',
            type: 'super_like'
        },
        {
            id: 2,
            name: '50 Super Like',
            price: 450,
            icon: '💎',
            description: '50 ta kunlik SUPER LIKE (10% chegirma)',
            type: 'super_like'
        },
        {
            id: 3,
            name: '100 Super Like',
            price: 800,
            icon: '👑',
            description: '100 ta kunlik SUPER LIKE (20% chegirma)',
            type: 'super_like'
        },
        {
            id: 4,
            name: 'Premium Profil',
            price: 300,
            icon: '⭐',
            description: '30 kunlik premium status',
            type: 'premium'
        },
        {
            id: 5,
            name: '1000 Coin',
            price: 0.99,
            icon: '💰',
            description: '1000 coin (real pul bilan)',
            type: 'coin_pack',
            realMoney: true
        },
        {
            id: 6,
            name: '5000 Coin',
            price: 3.99,
            icon: '💵',
            description: '5000 coin (50% ko\'proq)',
            type: 'coin_pack',
            realMoney: true
        }
    ];
    
    if (elements.shopItemsList) {
        elements.shopItemsList.innerHTML = items.map(item => `
            <div class="shop-item" onclick="buyItem(${item.id})">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                    ${item.realMoney ? 
                        '<div class="shop-item-real-money">💰 Real pul</div>' : 
                        ''
                    }
                </div>
                <div class="shop-item-price">
                    ${item.realMoney ? 
                        `$${item.price}` : 
                        `${item.price} coin`
                    }
                </div>
            </div>
        `).join('');
    }
}

function buyItem(itemId) {
    const items = [
        { id: 1, price: 100, type: 'super_like', value: 10 },
        { id: 2, price: 450, type: 'super_like', value: 50 },
        { id: 3, price: 800, type: 'super_like', value: 100 },
        { id: 4, price: 300, type: 'premium', value: 30 },
        { id: 5, price: 0.99, type: 'coin_pack', value: 1000, realMoney: true },
        { id: 6, price: 3.99, type: 'coin_pack', value: 5000, realMoney: true }
    ];
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.realMoney) {
        showNotification('Kechirasiz', 'Real pul bilan xarid hozircha mavjud emas');
        return;
    }
    
    if (userState.coins >= item.price) {
        userState.coins -= item.price;
        
        if (item.type === 'super_like') {
            userState.dailySuperLikes += item.value;
            showNotification('✅ Xarid qilindi', `${item.value} ta SUPER LIKE qo'shildi!`);
        } else if (item.type === 'premium') {
            showNotification('✅ Xarid qilindi', 'Premium profil faollashtirildi!');
        }
        
        saveUserStateToLocalStorage();
        updateUIFromUserState();
    } else {
        showNotification('⚠️ Yetarli emas', 'Coinlaringiz yetarli emas!');
    }
}

// ==================== LIDERLAR FUNKSIYALARI ==================== 
function loadLeaderboard() {
    const leaders = [
        { rank: 1, name: 'Ali', rating: 1850, matches: 45, friends: 12, gender: 'male', level: 19 },
        { rank: 2, name: 'Malika', rating: 1790, matches: 38, friends: 8, gender: 'female', level: 18 },
        { rank: 3, name: 'Sanjar', rating: 1720, matches: 32, friends: 5, gender: 'male', level: 18 },
        { rank: 4, name: 'Dilnoza', rating: 1680, matches: 29, friends: 15, gender: 'female', level: 17 },
        { rank: 5, name: 'Sardor', rating: 1620, matches: 25, friends: 7, gender: 'male', level: 17 },
        { rank: 6, name: 'Kamola', rating: 1590, matches: 28, friends: 9, gender: 'female', level: 16 },
        { rank: 7, name: 'Javohir', rating: 1550, matches: 22, friends: 4, gender: 'male', level: 16 },
        { rank: 8, name: 'Nargiza', rating: 1520, matches: 20, friends: 11, gender: 'female', level: 16 },
        { rank: 9, name: 'Bekzod', rating: 1480, matches: 18, friends: 6, gender: 'male', level: 15 },
        { rank: 10, name: 'Sevara', rating: 1450, matches: 16, friends: 8, gender: 'female', level: 15 }
    ];
    
    if (elements.leaderboardList) {
        elements.leaderboardList.innerHTML = leaders.map(leader => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${leader.rank}</div>
                <div class="leaderboard-user">
                    <div class="leaderboard-name">
                        ${leader.name}
                        <span class="leaderboard-level">Level ${leader.level}</span>
                    </div>
                    <div class="leaderboard-stats">
                        <span class="leaderboard-stat">⭐ ${leader.rating}</span>
                        <span class="leaderboard-stat">🎮 ${leader.matches}</span>
                        <span class="leaderboard-stat">👥 ${leader.friends}</span>
                    </div>
                </div>
                <div class="leaderboard-rating">
                    ${leader.rating}
                </div>
            </div>
        `).join('');
    }
    
    if (elements.leaderboardUpdated) {
        elements.leaderboardUpdated.textContent = new Date().toLocaleTimeString('uz-UZ');
    }
}

// ==================== KUNLIK VAZIFALAR ==================== 
function loadDailyQuests() {
    const defaultQuests = [
        {
            id: 'play_3_duels',
            title: '3 ta duel o\'ynash',
            progress: Math.min(userState.duels, 3),
            total: 3,
            reward: 50,
            type: 'play',
            completed: userState.duels >= 3
        },
        {
            id: 'give_5_likes',
            title: '5 ta like berish',
            progress: Math.min(userState.totalLikes, 5),
            total: 5,
            reward: 30,
            type: 'like',
            completed: userState.totalLikes >= 5
        },
        {
            id: 'get_1_match',
            title: '1 ta match olish',
            progress: Math.min(userState.matches, 1),
            total: 1,
            reward: 100,
            type: 'match',
            completed: userState.matches >= 1
        },
        {
            id: 'make_1_friend',
            title: '1 ta do\'st orttirish',
            progress: Math.min(userState.mutualMatchesCount, 1),
            total: 1,
            reward: 200,
            type: 'friend',
            completed: userState.mutualMatchesCount >= 1
        }
    ];
    
    const quests = userState.dailyQuests.length > 0 ? userState.dailyQuests : defaultQuests;
    
    if (elements.profileQuestsList) {
        elements.profileQuestsList.innerHTML = quests.map(quest => `
            <div class="quest-item">
                <div class="quest-info">
                    <div class="quest-title">
                        ${quest.title}
                        ${quest.completed ? 
                            '<span class="quest-completed">✅</span>' : 
                            '<span class="quest-incomplete">⏳</span>'
                        }
                    </div>
                    <div class="quest-progress">
                        <span class="quest-progress-text">${quest.progress}/${quest.total}</span>
                        <span class="quest-reward">${quest.reward} coin</span>
                    </div>
                    <div class="quest-progress-bar">
                        <div class="progress-fill" style="width: ${(quest.progress/quest.total)*100}%"></div>
                    </div>
                </div>
                <div class="quest-action">
                    ${quest.completed ? 
                        '<button class="btn btn-success" onclick="claimQuestReward(\'' + quest.id + '\')">📥 Olish</button>' : 
                        '<button class="btn btn-disabled" disabled>⏳ Davom eting</button>'
                    }
                </div>
            </div>
        `).join('');
    }
}

function updateDailyQuest(questType, value = 1) {
    if (!gameState.socket || !gameState.isConnected) return;
    
    gameState.socket.emit('update_quest', {
        questType: questType,
        value: value
    });
}

function claimQuestReward(questId) {
    if (!gameState.socket || !gameState.isConnected) return;
    gameState.socket.emit('claim_quest_reward', { questId: questId });
}

// ==================== ACHIEVEMENTS ==================== 
function loadAchievements() {
    const defaultAchievements = [
        {
            id: 'first_duel',
            title: 'Birinchi Duel',
            description: 'Birinchi duelni o\'ynash',
            icon: '🎮',
            unlocked: userState.duels > 0,
            progress: Math.min(userState.duels, 1),
            required: 1,
            reward: 100
        },
        {
            id: 'first_match',
            title: 'Birinchi Match',
            description: 'Birinchi matchni olish',
            icon: '❤️',
            unlocked: userState.matches > 0,
            progress: Math.min(userState.matches, 1),
            required: 1,
            reward: 200
        },
        {
            id: 'first_friend',
            title: 'Birinchi Do\'st',
            description: 'Birinchi do\'st orttirish',
            icon: '🤝',
            unlocked: userState.friendsCount > 0,
            progress: Math.min(userState.friendsCount, 1),
            required: 1,
            reward: 300
        },
        {
            id: 'like_master',
            title: 'Like Ustasi',
            description: '10 ta like berish',
            icon: '💖',
            unlocked: userState.totalLikes >= 10,
            progress: Math.min(userState.totalLikes, 10),
            required: 10,
            reward: 150
        },
        {
            id: 'duel_expert',
            title: 'Duel Eksperti',
            description: '25 ta duel o\'ynash',
            icon: '⚔️',
            unlocked: userState.duels >= 25,
            progress: Math.min(userState.duels, 25),
            required: 25,
            reward: 500
        }
    ];
    
    const achievements = userState.achievements.length > 0 ? userState.achievements : defaultAchievements;
    
    if (elements.achievementsList) {
        elements.achievementsList.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(achievement.progress/achievement.required)*100}%"></div>
                        </div>
                        <div class="progress-text">${achievement.progress}/${achievement.required}</div>
                    </div>
                </div>
                <div class="achievement-reward">
                    <div class="reward-amount">${achievement.reward}</div>
                    <div class="reward-icon">🪙</div>
                </div>
            </div>
        `).join('');
    }
}

function checkAchievement(achievementId) {
    if (!gameState.socket || !gameState.isConnected) return;
    
    gameState.socket.emit('check_achievement', { achievementId: achievementId });
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-content">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <h3>🏆 Achievement Ochildi!</h3>
                <p>${achievement.title}</p>
                <p class="achievement-reward-text">${achievement.reward} coin qo'shildi!</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ==================== STATUS YANGILASH ==================== 
function updateQueueStatus(msg) {
    if (elements.queueStatus) {
        elements.queueStatus.textContent = msg;
    }
}

function updateDuelStatus(msg) {
    if (elements.duelStatus) {
        elements.duelStatus.textContent = msg;
    }
}

function updateQueueButton() {
    console.log('🔄 Navbat tugmasi yangilanmoqda...');
    
    if (elements.enterQueueBtn) {
        const permanentGenderSelected = localStorage.getItem('permanentGenderSelected') === 'true';
        
        if (gameState.isConnected && permanentGenderSelected) {
            elements.enterQueueBtn.disabled = false;
            elements.enterQueueBtn.classList.remove('disabled');
            
            if (gameState.isInQueue) {
                elements.enterQueueBtn.innerHTML = '🔄 Navbatdasiz';
                elements.enterQueueBtn.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
            } else {
                elements.enterQueueBtn.innerHTML = '🎮 Navbatga Kirish';
                elements.enterQueueBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        } else {
            elements.enterQueueBtn.disabled = true;
            elements.enterQueueBtn.classList.add('disabled');
            elements.enterQueueBtn.innerHTML = '🔌 Ulanish kerak';
            elements.enterQueueBtn.style.background = 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
        }
    }
    
    if (elements.startBtn) {
        elements.startBtn.disabled = gameState.isConnected;
        if (gameState.isConnected) {
            elements.startBtn.innerHTML = '✅ Ulandi';
            elements.startBtn.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
        } else {
            elements.startBtn.innerHTML = '🔗 Serverga Ulanish';
            elements.startBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }
}

function updateStatsFromServer(data) {
    if (data.gender) userState.currentGender = data.gender;
    if (data.hasSelectedGender !== undefined) userState.hasSelectedGender = data.hasSelectedGender;
    if (data.coins !== undefined) userState.coins = data.coins;
    if (data.level !== undefined) userState.level = data.level;
    if (data.rating !== undefined) userState.rating = data.rating;
    if (data.matches !== undefined) userState.matches = data.matches;
    if (data.duels !== undefined) userState.duels = data.duels;
    if (data.wins !== undefined) userState.wins = data.wins;
    if (data.totalLikes !== undefined) userState.totalLikes = data.totalLikes;
    if (data.dailySuperLikes !== undefined) userState.dailySuperLikes = data.dailySuperLikes;
    if (data.bio !== undefined) userState.bio = data.bio;
    if (data.filter !== undefined) userState.filter = data.filter;
    if (data.mutualMatchesCount !== undefined) userState.mutualMatchesCount = data.mutualMatchesCount;
    if (data.friendsCount !== undefined) userState.friendsCount = data.friendsCount;
    if (data.streakDays !== undefined) userState.streakDays = data.streakDays;
    if (data.dailyQuests !== undefined) userState.dailyQuests = data.dailyQuests;
    if (data.achievements !== undefined) userState.achievements = data.achievements;
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
}

// ==================== NOTIFIKATSIYA ==================== 
function showNotification(title, message) {
    if (!elements.notification) return;
    
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('active');
    
    setTimeout(() => {
        elements.notification.classList.remove('active');
    }, 3000);
}

function showLevelUpNotification(oldLevel, newLevel) {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-icon">🎉</div>
            <div class="level-up-text">
                <h3>LEVEL UP!</h3>
                <p>${oldLevel} → ${newLevel}</p>
                <p class="level-up-reward">100 coin bonus!</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    userState.coins += 100;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
}

// ==================== EKRANLARNI ALMASHTIRISH ==================== 
function showScreen(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
    
    const screens = {
        'welcome': elements.welcomeScreen,
        'queue': elements.queueScreen,
        'duel': elements.duelScreen,
        'match': elements.matchScreen
    };
    
    Object.values(screens).forEach(screenElement => {
        if (screenElement) {
            screenElement.classList.add('hidden');
        }
    });
    
    const selectedScreen = screens[screen];
    if (selectedScreen) {
        selectedScreen.classList.remove('hidden');
    }
    
    updateBackButtonVisibility();
}

// ==================== TAB NAVIGATSIYASI ==================== 
function initTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName + 'Tab') {
                    content.classList.add('active');
                }
            });
            
            gameState.currentTab = tabName;
            
            switch(tabName) {
                case 'friends':
                    loadFriendsList();
                    break;
                case 'shop':
                    loadShopItems();
                    break;
                case 'leaderboard':
                    loadLeaderboard();
                    break;
                case 'profile':
                    loadProfileQuests();
                    loadAchievements();
                    break;
            }
        });
    });
}

// ==================== O'YIN STATISTIKASI ==================== 
function updateGameStats(action) {
    const now = Date.now();
    const timePlayed = Math.floor((now - gameState.lastActivity) / 1000);
    userState.totalPlayTime += timePlayed;
    gameState.lastActivity = now;
    
    switch(action) {
        case 'like':
            userState.totalLikes++;
            break;
        case 'super_like':
            userState.totalLikes++;
            break;
    }
    
    saveUserStateToLocalStorage();
}

// ==================== KUTISH HOLATI ==================== 
function handleWaitingForResponse(data) {
    console.log('⏳ Raqib javobini kutish...');
    
    clearInterval(gameState.timerInterval);
    gameState.waitingForOpponent = true;
    
    if (elements.timer) {
        elements.timer.textContent = '⏳';
        elements.timer.style.color = '#ff9500';
        elements.timer.style.animation = 'pulse 2s infinite';
    }
    
    updateDuelStatus('⏳ Raqib javobini kutish...');
    
    if (elements.likeBtn) {
        elements.likeBtn.disabled = true;
        elements.likeBtn.style.opacity = '0.5';
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.disabled = true;
        elements.superLikeBtn.style.opacity = '0.5';
    }
    
    if (elements.noBtn) {
        elements.noBtn.disabled = false;
        elements.noBtn.style.opacity = '1';
        elements.noBtn.textContent = '⏭️ Keyingisi';
        elements.noBtn.style.background = 'linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%)';
        elements.noBtn.onclick = () => skipWaitingForResponse();
    }
}

function skipWaitingForResponse() {
    if (!gameState.socket || !gameState.currentDuelId) return;
    
    gameState.socket.emit('skip_waiting', { duelId: gameState.currentDuelId });
    skipToNextDuel();
}

// ==================== NAVBATGA QAYTISH ==================== 
function skipToNextDuel() {
    console.log('🔄 Keyingi duelga o\'tish');
    
    hideAllModals();
    closeChatModal();
    
    clearInterval(gameState.timerInterval);
    
    if (elements.timer) {
        elements.timer.textContent = '∞';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
    
    resetVoteButtons();
    
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    gameState.inMatchScreen = false;
    
    enterQueue();
}

// ==================== MODAL FUNKSIYALARI ==================== 
function showNoMatchOptions() {
    const modalHTML = `
        <div class="modal" id="noMatchModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Match bo'lmadi</h2>
                </div>
                <div class="modal-body">
                    <p>Sizning ovozingiz: ✖</p>
                    <p>Keyingi duelga o'tishni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="skipToNextDuel()">Yangi duel</button>
                    <button class="btn btn-secondary" onclick="returnToMenu()">Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('noMatchModal', modalHTML);
}

function showOpponentLeftModal() {
    const modalHTML = `
        <div class="modal" id="opponentLeftModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Raqib chiqib ketdi</h2>
                </div>
                <div class="modal-body">
                    <p>Raqibingiz duel davomida chiqib ketdi. Keyingi duelga o'tishni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="skipToNextDuel()">Keyingi duel</button>
                    <button class="btn btn-secondary" onclick="returnToMenu()">Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('opponentLeftModal', modalHTML);
}

function showNoMatchModal() {
    const modalHTML = `
        <div class="modal" id="noMatchModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Match bo'lmadi</h2>
                </div>
                <div class="modal-body">
                    <p>Yangi duel o'ynashni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="skipToNextDuel()">Yangi duel</button>
                    <button class="btn btn-secondary" onclick="returnToMenu()">Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('noMatchModal', modalHTML);
}

function showModal(modalId, content) {
    let modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = content;
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.remove();
    }
    
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer && modalContainer.children.length === 0) {
        modalContainer.remove();
        document.body.style.overflow = 'auto';
    }
}

function hideAllModals() {
    const modals = ['timeoutModal', 'opponentLeftModal', 'noMatchModal', 'nextDuelConfirmModal', 'statsModal', 'giftHistoryModal'];
    modals.forEach(modalId => hideModal(modalId));
    
    if (elements.profileEditModal) {
        elements.profileEditModal.classList.remove('active');
    }
    
    closeChatModal();
    hideGenderModal();
}

// ==================== PROFIL EDIT ==================== 
function openProfileEdit() {
    if (elements.editBio) elements.editBio.value = userState.bio || '';
    if (elements.editGender) {
        elements.editGender.value = userState.currentGender || 'not_specified';
    }
    if (elements.editFilter) {
        elements.editFilter.value = userState.filter || 'not_specified';
    }
    
    if (elements.profileEditModal) {
        elements.profileEditModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeProfileEdit() {
    if (elements.profileEditModal) {
        elements.profileEditModal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
}

function saveProfile() {
    const bio = elements.editBio?.value.trim() || '';
    const gender = elements.editGender?.value || 'not_specified';
    const filter = elements.editFilter?.value || 'not_specified';
    
    if (gameState.socket) {
        gameState.socket.emit('update_profile', { bio, gender, filter });
        
        userState.bio = bio;
        if (gender !== userState.currentGender) {
            userState.currentGender = gender;
            userState.hasSelectedGender = true;
            
            localStorage.setItem('permanentGenderSelected', 'true');
            localStorage.setItem('permanentUserGender', gender);
        }
        userState.filter = filter;
        
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        if (bio && elements.profileBio) {
            elements.profileBio.textContent = bio;
        }
    }
    
    closeProfileEdit();
    showNotification('✅ Profil yangilandi', 'O\'zgarishlar saqlandi');
}

// ==================== EVENT LISTENERS ==================== 
function setupEventListeners() {
    console.log('🎮 Event listenerlar o\'rnatilmoqda...');
    
    // Gender tanlash
    if (elements.selectMaleBtn) {
        elements.selectMaleBtn.addEventListener('click', () => selectGender('male'));
    }
    
    if (elements.selectFemaleBtn) {
        elements.selectFemaleBtn.addEventListener('click', () => selectGender('female'));
    }
    
    if (elements.selectAllBtn) {
        elements.selectAllBtn.addEventListener('click', () => selectGender('not_specified'));
    }
    
    if (elements.selectGenderNowBtn) {
        elements.selectGenderNowBtn.addEventListener('click', () => showGenderModal(true));
    }
    
    // Asosiy tugmalar
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    if (elements.enterQueueBtn) {
        elements.enterQueueBtn.addEventListener('click', enterQueue);
    }
    
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    // Ovoz berish tugmalari
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => handleVote('skip'));
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', () => handleVote('like'));
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));
    }
    
    // Profile edit
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', openProfileEdit);
    }
    
    if (elements.closeProfileEditBtn) {
        elements.closeProfileEditBtn.addEventListener('click', closeProfileEdit);
    }
    
    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    // Chat
    if (elements.closeChatBtn) {
        elements.closeChatBtn.addEventListener('click', closeChatModal);
    }
    
    if (elements.chatOpenTelegramBtn) {
        elements.chatOpenTelegramBtn.addEventListener('click', () => {
            if (gameState.currentPartner && gameState.currentPartner.username) {
                openTelegramChat(gameState.currentPartner.username);
            }
        });
    }
}

// ==================== DOM YUKLANGANDA ==================== 
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            console.log('✅ Telegram WebApp faollashtirildi');
        }
    } catch (error) {
        console.log('ℹ️ Telegram Web App mavjud emas, test rejimida');
    }
    
    // Foydalanuvchi profilini yuklash
    initUserProfile();
    
    // Tab navigatsiyasini ishga tushirish
    initTabNavigation();
    
    // Event listenerlarni o'rnatish
    setupEventListeners();
    
    // Ma'lumotlarni yuklash
    loadProfileQuests();
    loadShopItems();
    loadLeaderboard();
    loadFriendsList();
    loadAchievements();
    
    console.log('✅ main.js to\'liq yuklandi - Barcha funksiyalar aktiv');
});

// ==================== GLOBAL FUNKSIYALAR ==================== 
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;
window.openTelegramChat = openTelegramChat;
window.selectFilter = selectFilter;
window.skipToNextDuel = skipToNextDuel;
window.returnToMenu = returnToMenu;
window.buyItem = buyItem;
window.hideAllModals = hideAllModals;
window.closeChatModal = closeChatModal;
window.startNewDuelFromMatch = startNewDuelFromMatch;
window.hideNextDuelConfirmModal = hideNextDuelConfirmModal;
window.enterQueue = enterQueue;
window.leaveQueue = leaveQueue;
window.showDetailedStats = showDetailedStats;
window.closeStatsModal = closeStatsModal;
window.claimQuestReward = claimQuestReward;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.exitDuel = exitDuel;
window.hideModal = hideModal;
window.openGiftModal = openGiftModal;
window.closeGiftModal = closeGiftModal;
window.showGiftHistory = showGiftHistory;
window.startGame = startGame;
window.showGenderModal = showGenderModal;
window.openProfileEdit = openProfileEdit;
window.closeProfileEdit = closeProfileEdit;
window.saveProfile = saveProfile;

console.log('🎮 LIKE DUEL - TUZATILGAN VERSIYA!');