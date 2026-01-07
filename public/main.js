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
    streakWins: 0,
    currentChoice: null,
    opponentChoice: null,
    duelTimer: 30 // 30 soniya
};

// ==================== USER STATE ==================== 
const userState = {
    currentGender: localStorage.getItem('userGender') || null,
    hasSelectedGender: localStorage.getItem('hasSelectedGender') === 'true',
    coins: parseInt(localStorage.getItem('userCoins')) || 100,
    level: parseInt(localStorage.getItem('userLevel')) || 1,
    rating: parseInt(localStorage.getItem('userRating')) || 1500,
    totalGames: parseInt(localStorage.getItem('userTotalGames')) || 0,
    wins: parseInt(localStorage.getItem('userWins')) || 0,
    draws: parseInt(localStorage.getItem('userDraws')) || 0,
    losses: parseInt(localStorage.getItem('userLosses')) || 0,
    winStreak: parseInt(localStorage.getItem('userWinStreak')) || 0,
    maxWinStreak: parseInt(localStorage.getItem('userMaxWinStreak')) || 0,
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

// ==================== GIFT STATE ==================== 
const giftState = {
    availableGifts: [
        { id: 1, name: 'Oltin Medal', price: 100, icon: '🥇', description: 'G\'alaba uchun' },
        { id: 2, name: 'Kumush Medal', price: 50, icon: '🥈', description: 'Yaxshi natija' },
        { id: 3, name: 'Yorqin Yulduz', price: 75, icon: '⭐', description: 'Ajoyib o\'yin' },
        { id: 4, name: 'Tog\' Tosh', price: 25, icon: '🪨', description: 'Tosh ramzi' },
        { id: 5, name: 'Oltin Qaychi', price: 150, icon: '✂️', description: 'Maxsus qaychi' },
        { id: 6, name: 'Sehrli Qog\'oz', price: 125, icon: '📜', description: 'Sehrli qog\'oz' },
        { id: 7, name: 'Diamond', price: 500, icon: '💎', description: 'Eng qimmat sovg\'a' },
        { id: 8, name: 'G\'alaba Bayrog\'i', price: 200, icon: '🏁', description: 'G\'alaba ramzi' }
    ],
    sentGifts: [],
    receivedGifts: []
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
    myWins: document.getElementById('myWins'),
    myDraws: document.getElementById('myDraws'),
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
    opponentGames: document.getElementById('opponentGames'),
    opponentLevel: document.getElementById('opponentLevel'),
    timer: document.getElementById('timer'),
    duelStatus: document.getElementById('duelStatus'),
    
    // RPS elementlari
    playerChoiceIcon: document.getElementById('playerChoiceIcon'),
    opponentChoiceIcon: document.getElementById('opponentChoiceIcon'),
    playerResultChoice: document.getElementById('playerResultChoice'),
    opponentResultChoice: document.getElementById('opponentResultChoice'),
    rockBtn: document.getElementById('rockBtn'),
    scissorsBtn: document.getElementById('scissorsBtn'),
    paperBtn: document.getElementById('paperBtn'),
    noBtn: document.getElementById('noBtn'),
    rulesBtn: document.getElementById('rulesBtn'),
    matchResultTitle: document.getElementById('matchResultTitle'),
    
    // Tugmalar
    startBtn: document.getElementById('startBtn'),
    connectBtn: document.getElementById('connectBtn'),
    enterQueueBtn: document.getElementById('enterQueueBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
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
    statGames: document.getElementById('statGames'),
    statWins: document.getElementById('statWins'),
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
    
    rulesModal: document.getElementById('rulesModal'),
    
    profileEditModal: document.getElementById('profileEditModal'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    closeProfileEditBtn: document.getElementById('closeProfileEditBtn'),
    editBio: document.getElementById('editBio'),
    editGender: document.getElementById('editGender'),
    editFilter: document.getElementById('editFilter'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
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
    connectionStatusBadge: document.getElementById('connectionStatusBadge'),
    pingDisplay: document.getElementById('pingDisplay'),
    networkStatus: document.getElementById('networkStatus'),
    
    // Progress barlar
    levelProgress: document.getElementById('levelProgress'),
    levelProgressText: document.getElementById('levelProgressText'),
    
    // Statistika modal
    statsModal: document.getElementById('statsModal'),
    closeStatsBtn: document.getElementById('closeStatsBtn'),
    detailedStatsContent: document.getElementById('detailedStatsContent'),
    
    // Kunlik streak
    streakDaysElement: document.getElementById('streakDays'),
    streakRewardBtn: document.getElementById('streakRewardBtn'),
    
    // Achievements
    achievementsList: document.getElementById('achievementsList'),
    
    // O'yin sozlamalari
    settingsModal: document.getElementById('settingsModal'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    soundToggle: document.getElementById('soundToggle'),
    vibrationToggle: document.getElementById('vibrationToggle'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn')
};

// ==================== GLOBAL USER ==================== 
let tgUserGlobal = null;

// ==================== TO'SH-QAYCHI-QOG'OZ FUNKSIYALARI ====================

// Tanlov belgilarini olish
function getChoiceIcon(choice) {
    switch(choice) {
        case 'rock': return '🪨';
        case 'scissors': return '✂️';
        case 'paper': return '📄';
        case 'skip': return '✖';
        default: return '❓';
    }
}

// Tanlov matnini olish
function getChoiceText(choice) {
    switch(choice) {
        case 'rock': return 'Tosh';
        case 'scissors': return 'Qaychi';
        case 'paper': return 'Qog\'oz';
        case 'skip': return 'Tashlash';
        default: return 'Tanlanmagan';
    }
}

// Tanlov rangini olish
function getChoiceColor(choice) {
    switch(choice) {
        case 'rock': return '#95a5a6';
        case 'scissors': return '#3498db';
        case 'paper': return '#f1c40f';
        case 'skip': return '#e74c3c';
        default: return '#fff';
    }
}

// Qoidalarni ko'rsatish
function showRulesModal() {
    if (elements.rulesModal) {
        elements.rulesModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideRulesModal() {
    if (elements.rulesModal) {
        elements.rulesModal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
}

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
    
    checkDailyLoginStreak();
    
    const userPhoto = tgUser.photo_url || `https://ui-avatars.com/api/?name=${tgUser.first_name || 'User'}&background=667eea&color=fff`;
    const userName = tgUser.first_name || 'Foydalanuvchi';
    const userUsername = tgUser.username ? '@' + tgUser.username : '@foydalanuvchi';
    
    updateAvatar(elements.myAvatar, userPhoto);
    updateAvatar(elements.profileAvatar, userPhoto);
    
    if (elements.myName) elements.myName.textContent = userName;
    if (elements.myUsername) elements.myUsername.textContent = userUsername;
    if (elements.profileName) elements.profileName.textContent = userName;
    if (elements.profileUsername) elements.profileUsername.textContent = userUsername;
    
    tgUserGlobal = tgUser;
    
    loadDailyQuests();
    loadAchievements();
    
    updateUIFromUserState();
    addFilterToWelcomeScreen();
    updateQueueButton();
    
    if (!userState.hasSelectedGender) {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        setTimeout(() => {
            showGenderModal(true);
        }, 1000);
    }
    
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
    
    Telegram.WebApp.setHeaderColor('#667eea');
    Telegram.WebApp.setBackgroundColor('#0f0f23');
    
    Telegram.WebApp.BackButton.onClick(() => {
        if (gameState.isInDuel) {
            showExitDuelConfirm();
        } else {
            returnToMenu();
        }
    });
    
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
    
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(elements.myName, userState.currentGender);
        addGenderBadge(elements.profileName, userState.currentGender);
    }
    
    if (elements.coinsCount) elements.coinsCount.textContent = formatNumber(userState.coins);
    if (elements.levelCount) elements.levelCount.textContent = userState.level;
    if (elements.shopCoinsCount) elements.shopCoinsCount.textContent = formatNumber(userState.coins);
    
    if (elements.statRating) elements.statRating.textContent = userState.rating;
    if (elements.statGames) elements.statGames.textContent = userState.totalGames;
    if (elements.myMatches) elements.myMatches.textContent = userState.totalGames;
    if (elements.myWins) elements.myWins.textContent = userState.wins;
    if (elements.myDraws) elements.myDraws.textContent = userState.draws;
    if (elements.statWins) elements.statWins.textContent = userState.wins;
    if (elements.mutualMatchesCount) elements.mutualMatchesCount.textContent = userState.mutualMatchesCount;
    if (elements.mutualMatchesProfile) elements.mutualMatchesProfile.textContent = userState.mutualMatchesCount;
    if (elements.statFriends) elements.statFriends.textContent = userState.friendsCount;
    
    const winRate = userState.totalGames > 0 ? Math.round((userState.wins / userState.totalGames) * 100) : 0;
    if (elements.statWinRate) elements.statWinRate.textContent = winRate + '%';
    
    if (elements.profileBio && userState.bio) {
        elements.profileBio.textContent = userState.bio;
    }
    
    if (elements.streakDaysElement) {
        elements.streakDaysElement.textContent = userState.streakDays;
        updateStreakRewardButton();
    }
    
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
    
    const filterOptions = filterContainer.querySelectorAll('.gender-filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            const filter = option.dataset.filter;
            selectFilter(filter);
        });
    });
    
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
    
    const filterOptions = document.querySelectorAll('.gender-filter-option');
    filterOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.filter === filter) {
            option.classList.add('active');
        }
    });
    
    showNotification('Filter o\'zgartirildi',
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
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    
    if (!localStorage.getItem('genderSelectedBonus')) {
        userState.coins += 50;
        localStorage.setItem('genderSelectedBonus', 'true');
        showNotification('🎁 Bonus!', 'Gender tanlaganingiz uchun 50 coin bonus!');
    }
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    hideGenderModal();
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { gender: gender });
    } else {
        connectToServer();
    }
    
    showNotification('🎉 Jins tanlandi',
        gender === 'male' ? 'Endi duel o\'ynashingiz mumkin!' :
        gender === 'female' ? 'Endi duel o\'ynashingiz mumkin!' :
        'Endi duel o\'ynashingiz mumkin!');
    
    checkAchievement('first_gender_selection');
}

// ==================== MODAL FUNKSIYALARI ==================== 
function showGenderModal(mandatory = true) {
    console.log('🎯 Gender modali ko\'rsatilmoqda');
    
    if (!elements.genderModal) return;
    
    elements.genderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (mandatory && elements.genderWarning) {
        elements.genderWarning.classList.remove('hidden');
    }
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

// ==================== SERVERGA ULANISH ==================== 
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
    updateConnectionStatus();
    updateQueueStatus('Serverga ulanmoqda...');
    showNotification('Ulanish', 'Serverga ulanmoqda...');
    
    const serverUrl = 'https://like-duel.onrender.com';
    
    let currentServerIndex = 0;
    let connected = false;
    
    function tryNextServer() {
        if (currentServerIndex >= servers.length) {
            console.error('❌ Barcha serverlarga ulanish muvaffaqiyatsiz');
            gameState.connectionStatus = 'disconnected';
            updateConnectionStatus();
            showNotification('Xato', 'Serverga ulanib bo\'lmadi. Iltimos, keyinroq urinib ko\'ring.');
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
                updateConnectionStatus();
                
                startPingMeasurement();
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
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('connect_error', handleSocketError);
    socket.on('reconnect', handleSocketReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_error', handleReconnectError);
    
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
    socket.on('daily_reset', handleDailyReset);
    socket.on('opponent_left', handleOpponentLeft);
    socket.on('opponent_choice', handleOpponentChoice);
    socket.on('quest_updated', handleQuestUpdated);
    socket.on('quest_reward_claimed', handleQuestRewardClaimed);
    socket.on('achievement_unlocked', handleAchievementUnlocked);
    socket.on('streak_bonus', handleStreakBonus);
    socket.on('ping', handlePing);
    socket.on('error', handleSocketError);
}

function authenticateUser() {
    console.log('📤 Auth ma\'lumotlari yuborilmoqda...');
    
    gameState.socket.emit('auth', {
        userId: tgUserGlobal.id.toString(),
        firstName: tgUserGlobal.first_name,
        lastName: tgUserGlobal.last_name || '',
        username: tgUserGlobal.username,
        photoUrl: tgUserGlobal.photo_url || `https://ui-avatars.com/api/?name=${tgUserGlobal.first_name || 'User'}&background=667eea&color=fff`,
        language: tgUserGlobal.language_code || 'uz',
        gender: userState.currentGender,
        hasSelectedGender: userState.hasSelectedGender,
        bio: userState.bio,
        filter: userState.filter,
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
    updateConnectionStatus();
    updateQueueStatus('Serverga ulandi...');
}

function handleSocketDisconnect(reason) {
    console.log('❌ Socket uzildi:', reason);
    gameState.isConnected = false;
    gameState.connectionStatus = 'disconnected';
    updateConnectionStatus();
    
    if (gameState.pingInterval) {
        clearInterval(gameState.pingInterval);
        gameState.pingInterval = null;
    }
    
    if (reason !== 'io client disconnect') {
        gameState.connectionStatus = 'reconnecting';
        updateConnectionStatus();
        
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
    updateConnectionStatus();
}

function handleSocketReconnect(attempt) {
    console.log(`🔄 Qayta ulandi (urinish: ${attempt})`);
    gameState.connectionStatus = 'connected';
    updateConnectionStatus();
}

function handleReconnectAttempt(attempt) {
    console.log(`🔄 Qayta ulanish urinishi: ${attempt}`);
    gameState.connectionStatus = 'reconnecting';
    updateConnectionStatus();
}

function handleReconnectError(error) {
    console.error('❌ Qayta ulanish xatosi:', error);
}

function handleAuthOk(data) {
    console.log('✅ Autentifikatsiya muvaffaqiyatli:', {
        userId: data.userId?.substring(0, 10) + '...',
        firstName: data.firstName,
        hasSelectedGender: data.hasSelectedGender,
        rating: data.rating,
        totalGames: data.totalGames
    });
    
    Object.assign(userState, {
        currentGender: data.gender || userState.currentGender,
        hasSelectedGender: data.hasSelectedGender !== undefined ? data.hasSelectedGender : userState.hasSelectedGender,
        coins: data.coins || userState.coins,
        level: data.level || userState.level,
        rating: data.rating || userState.rating,
        totalGames: data.totalGames || userState.totalGames,
        wins: data.wins || userState.wins,
        draws: data.draws || userState.draws,
        losses: data.losses || userState.losses,
        winStreak: data.winStreak || userState.winStreak,
        maxWinStreak: data.maxWinStreak || userState.maxWinStreak,
        bio: data.bio || userState.bio,
        filter: data.filter || userState.filter,
        mutualMatchesCount: data.mutualMatchesCount || userState.mutualMatchesCount,
        friendsCount: data.friendsCount || userState.friendsCount,
        streakDays: data.streakDays || userState.streakDays,
        dailyQuests: data.dailyQuests || userState.dailyQuests,
        achievements: data.achievements || userState.achievements
    });
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    updateQueueButton();
    
    showScreen('welcome');
    
    if (userState.hasSelectedGender) {
        console.log('✅ Gender tanlangan, navbatga kirish mumkin');
        updateQueueStatus('Gender tanlangan. "Navbatga Kirish" tugmasini bosing');
    } else {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        updateQueueStatus('Gender tanlash kerak...');
        setTimeout(() => {
            showGenderModal(true);
        }, 500);
    }
    
    if (data.dailyQuests) {
        loadDailyQuests();
    }
}

function handleShowGenderSelection(data) {
    console.log('⚠️ Serverdan gender tanlash so\'rovi:', data);
    showGenderModal(true);
    updateQueueStatus('Gender tanlash kerak...');
}

function handleGenderSelected(data) {
    console.log('✅ Gender tanlandi:', data);
    
    userState.currentGender = data.gender;
    userState.hasSelectedGender = true;
    
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
    console.log('⚔️ Duel boshlandi:', {
        duelId: data.duelId?.substring(0, 10) + '...',
        opponent: data.opponent.name
    });
    
    gameState.isInDuel = true;
    gameState.isInQueue = false;
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    gameState.inMatchScreen = false;
    gameState.currentDuelId = data.duelId;
    gameState.currentChoice = null;
    gameState.opponentChoice = null;
    gameState.duelTimer = 30;
    
    showScreen('duel');
    
    updateQueueButton();
    updateBackButtonVisibility();
    clearInterval(gameState.timerInterval);
    resetVoteButtons();
    
    updateOpponentInfo(data.opponent);
    
    startTimer();
    updateDuelStatus('Tosh, Qaychi yoki Qog\'oz tanlang!');
    
    playSound('duel_start');
}

function handleMatch(data) {
    console.log('🎮 Tosh-Qaychi-Qog\'oz natijasi:', {
        result: data.result,
        yourChoice: data.yourChoice,
        opponentChoice: data.opponentChoice,
        partner: data.partner?.name
    });
    
    gameState.matchCompleted = true;
    gameState.lastMatchData = data;
    handleRPSMatchResult(data);
}

function handleMutualMatch(data) {
    console.log('🤝 O\'ZARO SUPER LIKE Match qo\'shildi:', data);
    
    userState.mutualMatchesCount = data.mutualMatchesCount || userState.mutualMatchesCount;
    userState.friendsCount = data.friendsCount || userState.friendsCount;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    if (gameState.currentTab === 'friends') {
        loadFriendsList();
    }
    
    showNotification('🎉 DO\'ST BO\'LDINGIZ!',
        `${data.partnerName} bilan o\'zaro SUPER LIKE! Endi siz do\'st bo\'ldingiz.`);
    
    checkAchievement('first_friend');
}

function handleNoMatch(data) {
    console.log('❌ Match bo\'lmadi');
    gameState.matchCompleted = true;
    handleNoMatchResult(data);
}

function handleWaitingResponse(data) {
    console.log('⏳ Raqib javobini kutish:', data);
    handleWaitingForResponse(data);
}

function handleFriendsList(data) {
    console.log('👥 Dostlar royxati:', data);
    gameState.friendsList = data.friends;
    updateFriendsListUI(data);
}

function handleProfileUpdated(data) {
    console.log('📊 Profil yangilandi:', data);
    updateStatsFromServer(data);
}

function handleDailyReset(data) {
    console.log('🔄 Kunlik limitlar yangilandi:', data);
    userState.dailyQuests = data.dailyQuests || [];
    saveUserStateToLocalStorage();
    
    loadDailyQuests();
    showNotification('Kun yangilandi', 'Kunlik vazifalar qayta tiklandi!');
}

function handleOpponentLeft() {
    console.log('🚪 Raqib chiqib ketdi');
    clearInterval(gameState.timerInterval);
    updateDuelStatus('Raqib chiqib ketdi. Keyingi duelga tayyormisiz?');
    
    showOpponentLeftModal();
}

function handleOpponentChoice(data) {
    console.log('👀 Raqib tanlovi:', data.choice);
    
    gameState.opponentChoice = data.choice;
    
    if (elements.opponentChoiceIcon) {
        elements.opponentChoiceIcon.textContent = getChoiceIcon(data.choice);
        elements.opponentChoiceIcon.style.animation = 'bounce 0.5s ease';
        elements.opponentChoiceIcon.style.color = getChoiceColor(data.choice);
    }
    
    updateDuelStatus('Raqib tanladi. Natijani kutish...');
}

function handleQuestUpdated(data) {
    console.log('🎯 Vazifa yangilandi:', data);
    userState.dailyQuests = data.quests;
    saveUserStateToLocalStorage();
    loadDailyQuests();
    
    if (data.completed) {
        showNotification('✅ Vazifa bajarildi!', `${data.reward} coin qo\'shildi!`);
    }
}

function handleQuestRewardClaimed(data) {
    console.log('💰 Quest mukofoti olindi:', data);
    userState.coins += data.reward;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    showNotification('🎁 Mukofot olindi!', `${data.reward} coin qo'shildi!`);
    
    const quests = userState.dailyQuests;
    const updatedQuests = quests.map(q => {
        if (q.questId === data.questId) {
            q.claimed = true;
        }
        return q;
    });
    userState.dailyQuests = updatedQuests;
    saveUserStateToLocalStorage();
    loadDailyQuests();
}

function handleAchievementUnlocked(data) {
    console.log('🏆 Achievement ochildi:', data);
    userState.achievements = data.achievements;
    saveUserStateToLocalStorage();
    loadAchievements();
    
    showAchievementNotification(data.achievement);
}

function handleStreakBonus(data) {
    console.log('🔥 Streak bonus:', data);
    
    userState.coins += data.bonus;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    showNotification(`🔥 ${data.streak} ketma-ket g'alaba!`,
        `${data.bonus} coin streak bonus qo'shildi!`);
}

function handlePing(data) {
    const ping = Date.now() - data.sent;
    gameState.averagePing = (gameState.averagePing * 0.8) + (ping * 0.2);
    
    if (elements.pingDisplay) {
        elements.pingDisplay.textContent = `${Math.round(gameState.averagePing)}ms`;
        
        if (gameState.averagePing < 100) {
            gameState.networkQuality = 'good';
            elements.pingDisplay.style.color = '#2ecc71';
        } else if (gameState.averagePing < 300) {
            gameState.networkQuality = 'medium';
            elements.pingDisplay.style.color = '#f39c12';
        } else {
            gameState.networkQuality = 'poor';
            elements.pingDisplay.style.color = '#e74c3c';
        }
        
        if (elements.networkStatus) {
            elements.networkStatus.textContent =
                gameState.networkQuality === 'good' ? 'Yaxshi' :
                gameState.networkQuality === 'medium' ? 'O\'rtacha' : 'Yomon';
        }
    }
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

// ==================== ULanish STATUSI ==================== 
function updateConnectionStatus() {
    if (!elements.connectionStatusBadge) return;
    
    const statusText = {
        'disconnected': 'Ulanmagan',
        'connecting': 'Ulanmoqda...',
        'connected': 'Onlayn',
        'reconnecting': 'Qayta ulanmoqda...'
    };
    
    elements.connectionStatusBadge.textContent = statusText[gameState.connectionStatus];
    elements.connectionStatusBadge.className = `connection-status ${gameState.connectionStatus}`;
    
    updateQueueButton();
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
    
    if (!userState.hasSelectedGender) {
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
    updateBackButtonVisibility();
    showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
    
    gameState.lastActivity = Date.now();
}

// ==================== O'YINNI BOSHLASH ==================== 
function startGame() {
    console.log('🎮 O\'yni boshlash');
    connectToServer();
}

// ==================== USER STATE LOCALSTORAGE GA SAQLASH ==================== 
function saveUserStateToLocalStorage() {
    localStorage.setItem('userGender', userState.currentGender || '');
    localStorage.setItem('hasSelectedGender', userState.hasSelectedGender.toString());
    localStorage.setItem('userCoins', userState.coins.toString());
    localStorage.setItem('userLevel', userState.level.toString());
    localStorage.setItem('userRating', userState.rating.toString());
    localStorage.setItem('userTotalGames', userState.totalGames.toString());
    localStorage.setItem('userWins', userState.wins.toString());
    localStorage.setItem('userDraws', userState.draws.toString());
    localStorage.setItem('userLosses', userState.losses.toString());
    localStorage.setItem('userWinStreak', userState.winStreak.toString());
    localStorage.setItem('userMaxWinStreak', userState.maxWinStreak.toString());
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

function updateStreakRewardButton() {
    if (!elements.streakRewardBtn) return;
    
    const nextReward = getNextStreakReward();
    if (nextReward) {
        elements.streakRewardBtn.textContent = `${nextReward.days} kun: ${nextReward.reward} coin`;
        elements.streakRewardBtn.disabled = userState.streakDays < nextReward.days;
    } else {
        elements.streakRewardBtn.textContent = 'Streak mukofoti';
        elements.streakRewardBtn.disabled = true;
    }
}

function getNextStreakReward() {
    const streakRewards = [
        { days: 3, reward: 50 },
        { days: 7, reward: 100 },
        { days: 14, reward: 200 },
        { days: 30, reward: 500 }
    ];
    
    return streakRewards.find(reward => userState.streakDays < reward.days);
}

// ==================== TUGMALARNI RESET QILISH ==================== 
function resetVoteButtons() {
    console.log('🔄 Tugmalar reset qilinmoqda...');
    
    const buttons = [elements.noBtn, elements.rockBtn, elements.scissorsBtn, elements.paperBtn];
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
    
    if (elements.rockBtn) {
        elements.rockBtn.textContent = '🪨';
        elements.rockBtn.style.background = 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
    }
    
    if (elements.scissorsBtn) {
        elements.scissorsBtn.textContent = '✂️';
        elements.scissorsBtn.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
    }
    
    if (elements.paperBtn) {
        elements.paperBtn.textContent = '📄';
        elements.paperBtn.style.background = 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)';
    }
    
    if (elements.playerChoiceIcon) {
        elements.playerChoiceIcon.textContent = '?';
        elements.playerChoiceIcon.style.color = '#fff';
        elements.playerChoiceIcon.style.animation = '';
    }
    
    if (elements.opponentChoiceIcon) {
        elements.opponentChoiceIcon.textContent = '?';
        elements.opponentChoiceIcon.style.color = '#fff';
        elements.opponentChoiceIcon.style.animation = '';
    }
    
    gameState.currentChoice = null;
    gameState.opponentChoice = null;
}

// ==================== TO'SH-QAYCHI-QOG'OZ OVOZ BERISH ==================== 
function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }

    console.log(`🗳️ Ovoz berish: ${choice}`);

    // Tugmalarni block qilish
    [elements.noBtn, elements.rockBtn, elements.scissorsBtn, elements.paperBtn].forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
            b.style.cursor = 'not-allowed';
        }
    });

    // Tanlovni ko'rsatish
    if (choice !== 'skip') {
        gameState.currentChoice = choice;
        if (elements.playerChoiceIcon) {
            elements.playerChoiceIcon.textContent = getChoiceIcon(choice);
            elements.playerChoiceIcon.style.animation = 'bounce 0.5s ease';
            elements.playerChoiceIcon.style.color = getChoiceColor(choice);
        }
    }

    // Animation
    const button = choice === 'skip' ? elements.noBtn :
                  choice === 'rock' ? elements.rockBtn :
                  choice === 'scissors' ? elements.scissorsBtn : elements.paperBtn;
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
        case 'rock':
            if (elements.timer) elements.timer.textContent = '🪨';
            updateDuelStatus('TOSH tanladingiz. Raqib javobini kutish...');
            playSound('rock');
            break;
        case 'scissors':
            if (elements.timer) elements.timer.textContent = '✂️';
            updateDuelStatus('QAYCHI tanladingiz. Raqib javobini kutish...');
            playSound('scissors');
            break;
        case 'paper':
            if (elements.timer) elements.timer.textContent = '📄';
            updateDuelStatus('QOG\'OZ tanladingiz. Raqib javobini kutish...');
            playSound('paper');
            break;
        case 'skip':
            if (elements.timer) elements.timer.textContent = '✖';
            updateDuelStatus('Duel tugatildi...');
            gameState.matchCompleted = true;
            playSound('skip');

            setTimeout(() => {
                handleSkipResult();
            }, 500);
            break;
    }

    updateGameStats(choice);
}

// ==================== SKIP NATIJASI ==================== 
function handleSkipResult() {
    console.log('✖ Duel tugatildi (foydalanuvchi tomonidan)');
    
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.inMatchScreen = false;
    
    resetVoteButtons();
    
    showNoMatchOptions();
}

// ==================== RPS MATCH HANDLERS ==================== 
function handleRPSMatchResult(data) {
    console.log('🎮 Tosh-Qaychi-Qog\'oz natijasi:', data);
    
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
    
    updateRPSMatchUI(data);
    
    if (data.rewards) {
        applyRPSMatchRewards(data.rewards, data.result);
    }
    
    createMatchOptions(data);
    
    if (data.result === 'win') {
        gameState.streakWins++;
        if (gameState.streakWins > 1) {
            showStreakBonusNotification(gameState.streakWins);
        }
        
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 300,
                spread: 100,
                origin: { y: 0.6 }
            });
        }
    } else {
        gameState.streakWins = 0;
    }
    
    playSound(data.result === 'win' ? 'win' : data.result === 'lose' ? 'lose' : 'draw');
    
    checkAchievementsAfterGame(data);
}

function updateRPSMatchUI(data) {
    if (elements.partnerName) elements.partnerName.textContent = data.partner?.name || 'Raqib';
    
    if (elements.playerResultChoice) {
        elements.playerResultChoice.textContent = getChoiceIcon(data.yourChoice);
        elements.playerResultChoice.style.animation = 'bounce 0.5s ease';
        elements.playerResultChoice.style.color = getChoiceColor(data.yourChoice);
        elements.playerResultChoice.style.fontSize = '4rem';
    }
    
    if (elements.opponentResultChoice) {
        elements.opponentResultChoice.textContent = getChoiceIcon(data.opponentChoice);
        elements.opponentResultChoice.style.animation = 'bounce 0.5s ease';
        elements.opponentResultChoice.style.color = getChoiceColor(data.opponentChoice);
        elements.opponentResultChoice.style.fontSize = '4rem';
    }
    
    let matchHTML = '';
    let matchClass = '';
    
    if (data.result === 'win') {
        if (elements.matchResultTitle) elements.matchResultTitle.textContent = '🏆 G\'ALABA!';
        matchHTML = `
            <div class="match-icon">🏆</div>
            <div class="match-title">TABRIKLAYMIZ!</div>
            <div class="match-message">Siz ${data.partner?.name || 'Raqib'} ni yutdingiz!</div>
            <div class="match-note">
                ${getChoiceText(data.yourChoice)} ${getChoiceIcon(data.yourChoice)} > 
                ${getChoiceText(data.opponentChoice)} ${getChoiceIcon(data.opponentChoice)}
            </div>
        `;
        matchClass = 'win-match';
    } else if (data.result === 'lose') {
        if (elements.matchResultTitle) elements.matchResultTitle.textContent = '😔 MAG\'LUBIYAT';
        matchHTML = `
            <div class="match-icon">😔</div>
            <div class="match-title">AFSUSKI...</div>
            <div class="match-message">${data.partner?.name || 'Raqib'} sizni yutdi!</div>
            <div class="match-note">
                ${getChoiceText(data.opponentChoice)} ${getChoiceIcon(data.opponentChoice)} > 
                ${getChoiceText(data.yourChoice)} ${getChoiceIcon(data.yourChoice)}
            </div>
        `;
        matchClass = 'lose-match';
    } else if (data.result === 'draw') {
        if (elements.matchResultTitle) elements.matchResultTitle.textContent = '🤝 DURANG!';
        matchHTML = `
            <div class="match-icon">🤝</div>
            <div class="match-title">DURANG!</div>
            <div class="match-message">Siz va ${data.partner?.name || 'Raqib'} durang qildingiz!</div>
            <div class="match-note">
                Ikkalangiz ham ${getChoiceText(data.yourChoice)} ${getChoiceIcon(data.yourChoice)} tanladingiz
            </div>
        `;
        matchClass = 'draw-match';
    }
    
    if (elements.matchText) {
        elements.matchText.innerHTML = matchHTML;
        elements.matchText.className = `match-text ${matchClass}`;
    }
}

function applyRPSMatchRewards(rewards, result) {
    if (elements.rewardCoins) elements.rewardCoins.textContent = rewards.coins || 0;
    if (elements.rewardXP) elements.rewardXP.textContent = rewards.xp || 0;
    
    userState.coins += rewards.coins || 0;
    userState.rating = gameState.lastMatchData?.newRating || userState.rating;
    userState.totalGames++;
    
    if (gameState.lastMatchData) {
        if (gameState.lastMatchData.result === 'win') {
            userState.wins++;
            userState.winStreak = (userState.winStreak || 0) + 1;
            if (userState.winStreak > userState.maxWinStreak) {
                userState.maxWinStreak = userState.winStreak;
            }
        } else if (gameState.lastMatchData.result === 'lose') {
            userState.losses++;
            userState.winStreak = 0;
        } else if (gameState.lastMatchData.result === 'draw') {
            userState.draws++;
        }
    }
    
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
    
    if (gameState.lastMatchData?.result === 'win') {
        updateDailyQuest('win_duel');
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
    console.log(`Match option: ${action} for partner:`, partner);
    
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
    
    playSound('no_match');
}

// ==================== TIMER FUNKSIYASI ==================== 
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.duelTimer = 30;
    
    if (elements.timer) {
        elements.timer.textContent = gameState.duelTimer;
        elements.timer.style.color = '#fff';
        elements.timer.style.fontSize = '3rem';
        elements.timer.style.animation = '';
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.duelTimer--;
        
        if (elements.timer) {
            elements.timer.textContent = gameState.duelTimer;
            
            if (gameState.duelTimer <= 10) {
                elements.timer.style.color = '#e74c3c';
                elements.timer.style.animation = 'pulse 1s infinite';
            } else if (gameState.duelTimer <= 20) {
                elements.timer.style.color = '#f1c40f';
            }
        }
        
        if (gameState.duelTimer <= 0) {
            clearInterval(gameState.timerInterval);
            handleDuelTimeout();
        }
    }, 1000);
}

function handleDuelTimeout() {
    console.log('⏱️ Duel vaqti tugadi');
    
    if (gameState.socket && gameState.currentDuelId) {
        gameState.socket.emit('vote', {
            duelId: gameState.currentDuelId,
            choice: 'skip'
        });
    }
    
    handleSkipResult();
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
    if (elements.opponentGames) elements.opponentGames.textContent = opponent.totalGames || 0;
    if (elements.opponentLevel) elements.opponentLevel.textContent = opponent.level || 1;
}

// ==================== KETMA-KET G'ALABA BONUSI ====================
function showStreakBonusNotification(streakCount) {
    let bonusCoins = 0;
    
    if (streakCount >= 3) bonusCoins = 25;
    if (streakCount >= 5) bonusCoins = 50;
    if (streakCount >= 10) bonusCoins = 100;
    
    if (bonusCoins > 0) {
        userState.coins += bonusCoins;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification(`🔥 ${streakCount} ketma-ket g'alaba!`,
            `Qo'shimcha ${bonusCoins} coin streak bonus!`);
    }
}

// ==================== ACHIEVEMENT TEKSHIRISH ====================
function checkAchievementsAfterGame(data) {
    if (data.result === 'win') {
        checkAchievement('first_win');
        
        if (gameState.streakWins >= 3) checkAchievement('win_streak_3');
        if (gameState.streakWins >= 5) checkAchievement('win_streak_5');
        if (gameState.streakWins >= 10) checkAchievement('win_streak_10');
    }
    
    if (userState.totalGames >= 10) checkAchievement('play_10_games');
    if (userState.totalGames >= 50) checkAchievement('play_50_games');
    if (userState.totalGames >= 100) checkAchievement('play_100_games');
    
    if (userState.maxWinStreak >= 10) checkAchievement('max_streak_10');
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
    
    playSound('achievement');
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
    
    gameState.socket.emit('vote', {
        duelId: gameState.currentDuelId,
        choice: 'skip'
    });
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
                games: 15,
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
                games: 22,
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
                                <span class="friend-stat">🎮 ${friend.games}</span>
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
            name: '100 Coin',
            price: 0.99,
            icon: '💰',
            description: '100 ta coin',
            type: 'coin_pack',
            realMoney: true
        },
        {
            id: 2,
            name: '500 Coin',
            price: 3.99,
            icon: '💵',
            description: '500 ta coin (50% ko\'proq)',
            type: 'coin_pack',
            realMoney: true
        },
        {
            id: 3,
            name: '1000 Coin',
            price: 6.99,
            icon: '💎',
            description: '1000 ta coin (2x ko\'proq)',
            type: 'coin_pack',
            realMoney: true
        },
        {
            id: 4,
            name: 'Premium Profil',
            price: 300,
            icon: '⭐',
            description: '30 kunlik premium status',
            type: 'premium'
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
        { id: 1, price: 0.99, type: 'coin_pack', value: 100, realMoney: true },
        { id: 2, price: 3.99, type: 'coin_pack', value: 500, realMoney: true },
        { id: 3, price: 6.99, type: 'coin_pack', value: 1000, realMoney: true },
        { id: 4, price: 300, type: 'premium', value: 30 }
    ];
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.realMoney) {
        showNotification('Kechirasiz', 'Real pul bilan xarid hozircha mavjud emas');
        return;
    }
    
    if (userState.coins >= item.price) {
        userState.coins -= item.price;
        
        if (item.type === 'premium') {
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
        { rank: 1, name: 'Ali', rating: 1850, games: 45, wins: 32, streak: 7, gender: 'male', level: 19 },
        { rank: 2, name: 'Malika', rating: 1790, games: 38, wins: 28, streak: 5, gender: 'female', level: 18 },
        { rank: 3, name: 'Sanjar', rating: 1720, games: 32, wins: 25, streak: 3, gender: 'male', level: 18 },
        { rank: 4, name: 'Dilnoza', rating: 1680, games: 29, wins: 20, streak: 2, gender: 'female', level: 17 },
        { rank: 5, name: 'Sardor', rating: 1620, games: 25, wins: 18, streak: 4, gender: 'male', level: 17 },
        { rank: 6, name: 'Kamola', rating: 1590, games: 28, wins: 19, streak: 1, gender: 'female', level: 16 },
        { rank: 7, name: 'Javohir', rating: 1550, games: 22, wins: 15, streak: 6, gender: 'male', level: 16 },
        { rank: 8, name: 'Nargiza', rating: 1520, games: 20, wins: 14, streak: 2, gender: 'female', level: 16 },
        { rank: 9, name: 'Bekzod', rating: 1480, games: 18, wins: 12, streak: 3, gender: 'male', level: 15 },
        { rank: 10, name: 'Sevara', rating: 1450, games: 16, wins: 10, streak: 1, gender: 'female', level: 15 }
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
                        <span class="leaderboard-stat">🎮 ${leader.games}</span>
                        <span class="leaderboard-stat">🏆 ${leader.wins}</span>
                        <span class="leaderboard-stat">🔥 ${leader.streak}</span>
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
            progress: Math.min(userState.totalGames, 3),
            total: 3,
            reward: 50,
            type: 'play_duel',
            completed: userState.totalGames >= 3
        },
        {
            id: 'win_1_duel',
            title: '1 ta duel yutish',
            progress: Math.min(userState.wins, 1),
            total: 1,
            reward: 100,
            type: 'win_duel',
            completed: userState.wins >= 1
        },
        {
            id: 'make_1_friend',
            title: '1 ta do\'st orttirish',
            progress: Math.min(userState.mutualMatchesCount, 1),
            total: 1,
            reward: 200,
            type: 'make_friend',
            completed: userState.mutualMatchesCount >= 1
        },
        {
            id: 'earn_100_coins',
            title: '100 coin yig\'ish',
            progress: Math.min(userState.coins, 100),
            total: 100,
            reward: 50,
            type: 'earn_coins',
            completed: userState.coins >= 100
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
                    ${quest.completed && !quest.claimed ? 
                        '<button class="btn btn-success" onclick="claimQuestReward(\'' + quest.id + '\')">📥 Olish</button>' : 
                        quest.claimed ? 
                        '<button class="btn btn-disabled" disabled>✅ Olingan</button>' :
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
            unlocked: userState.totalGames > 0,
            progress: Math.min(userState.totalGames, 1),
            required: 1,
            reward: 100
        },
        {
            id: 'first_win',
            title: 'Birinchi G\'alaba',
            description: 'Birinchi g\'alabani qo\'lga kiriting',
            icon: '🏆',
            unlocked: userState.wins > 0,
            progress: Math.min(userState.wins, 1),
            required: 1,
            reward: 200
        },
        {
            id: 'win_streak_3',
            title: '3 ketma-ket g\'alaba',
            description: '3 marta ketma-ket g\'alaba qozoning',
            icon: '🔥',
            unlocked: userState.winStreak >= 3,
            progress: Math.min(userState.winStreak, 3),
            required: 3,
            reward: 150
        },
        {
            id: 'play_10_games',
            title: '10 ta duel',
            description: '10 ta duel o\'ynang',
            icon: '🎯',
            unlocked: userState.totalGames >= 10,
            progress: Math.min(userState.totalGames, 10),
            required: 10,
            reward: 250
        },
        {
            id: 'play_50_games',
            title: '50 ta duel',
            description: '50 ta duel o\'ynang',
            icon: '💎',
            unlocked: userState.totalGames >= 50,
            progress: Math.min(userState.totalGames, 50),
            required: 50,
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

// ==================== STATISTIKA ==================== 
function showDetailedStats() {
    const winRate = userState.totalGames > 0 ? Math.round((userState.wins / userState.totalGames) * 100) : 0;
    const drawRate = userState.totalGames > 0 ? Math.round((userState.draws / userState.totalGames) * 100) : 0;
    const loseRate = userState.totalGames > 0 ? Math.round((userState.losses / userState.totalGames) * 100) : 0;
    
    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">${userState.rating}</div>
                <div class="stat-label">Reyting</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-value">${userState.totalGames}</div>
                <div class="stat-label">Jami Duel</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-value">${userState.wins}</div>
                <div class="stat-label">G'alabalar</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🤝</div>
                <div class="stat-value">${userState.draws}</div>
                <div class="stat-label">Durang</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value">${winRate}%</div>
                <div class="stat-label">G'alaba %</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-value">${userState.winStreak}</div>
                <div class="stat-label">Joriy Streak</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👑</div>
                <div class="stat-value">${userState.maxWinStreak}</div>
                <div class="stat-label">Max Streak</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${userState.friendsCount}</div>
                <div class="stat-label">Do'stlar</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🤝</div>
                <div class="stat-value">${userState.mutualMatchesCount}</div>
                <div class="stat-label">O'zaro Match</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🪙</div>
                <div class="stat-value">${userState.coins}</div>
                <div class="stat-label">Coin</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📈</div>
                <div class="stat-value">${userState.level}</div>
                <div class="stat-label">Level</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-value">${userState.streakDays}</div>
                <div class="stat-label">Streak (kun)</div>
            </div>
        </div>
        
        <div class="stats-details">
            <div class="stats-section">
                <h3>Statistika taqsimoti:</h3>
                <div class="stat-distribution">
                    <div class="stat-dist-item win">G'alaba: ${winRate}%</div>
                    <div class="stat-dist-item draw">Durang: ${drawRate}%</div>
                    <div class="stat-dist-item lose">Mag'lubiyat: ${loseRate}%</div>
                </div>
            </div>
            <div class="stats-section">
                <h3>Filter sozlamalari:</h3>
                <p>Jins: ${userState.currentGender === 'male' ? 'Erkak' : userState.currentGender === 'female' ? 'Ayol' : 'Ko\'rsatilmagan'}</p>
                <p>Qidiruv filteri: ${getFilterText(userState.filter)}</p>
            </div>
            <div class="stats-section">
                <h3>Faollik:</h3>
                <p>Oxirgi login: ${userState.lastLogin ? new Date(userState.lastLogin).toLocaleString('uz-UZ') : 'Ma\'lumot yo\'q'}</p>
                <p>Umumiy o'yin vaqti: ${Math.floor(userState.totalPlayTime / 60)} daqiqa</p>
            </div>
        </div>
    `;
    
    if (elements.detailedStatsContent) {
        elements.detailedStatsContent.innerHTML = statsHTML;
    }
    
    if (elements.statsModal) {
        elements.statsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeStatsModal() {
    if (elements.statsModal) {
        elements.statsModal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
}

// ==================== O'YIN STATISTIKASI ==================== 
function updateGameStats(action) {
    const now = Date.now();
    const timePlayed = Math.floor((now - gameState.lastActivity) / 1000);
    userState.totalPlayTime += timePlayed;
    gameState.lastActivity = now;
    
    saveUserStateToLocalStorage();
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
        if (gameState.isConnected && userState.hasSelectedGender) {
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
            elements.enterQueueBtn.innerHTML = '🔌 Navbatga kirish';
            elements.enterQueueBtn.style.background = 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
        }
    }
    
    if (elements.startBtn) {
        elements.startBtn.disabled = !gameState.isConnected;
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
    if (data.totalGames !== undefined) userState.totalGames = data.totalGames;
    if (data.wins !== undefined) userState.wins = data.wins;
    if (data.draws !== undefined) userState.draws = data.draws;
    if (data.losses !== undefined) userState.losses = data.losses;
    if (data.winStreak !== undefined) userState.winStreak = data.winStreak;
    if (data.maxWinStreak !== undefined) userState.maxWinStreak = data.maxWinStreak;
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
    
    playSound('notification');
    
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
    
    playSound('level_up');
}

// ==================== TOVUSH FUNKSIYALARI ==================== 
function playSound(soundName) {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    
    if (!soundEnabled) return;
    
    const sounds = {
        'rock': 'https://assets.mixkit.co/sfx/preview/mixkit-stone-drop-759.mp3',
        'scissors': 'https://assets.mixkit.co/sfx/preview/mixkit-scissors-cutting-767.mp3',
        'paper': 'https://assets.mixkit.co/sfx/preview/mixkit-paper-rips-1093.mp3',
        'win': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
        'lose': 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
        'draw': 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
        'skip': 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
        'duel_start': 'https://assets.mixkit.co/sfx/preview/mixkit-game-show-intro-music-687.mp3',
        'notification': 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3',
        'level_up': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
        'achievement': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'
    };
    
    if (sounds[soundName]) {
        const audio = new Audio(sounds[soundName]);
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Tovushni ijro etishda xato:', e));
    }
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

// ==================== SOZLAMALAR ==================== 
function initSettings() {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
    
    if (elements.soundToggle) {
        elements.soundToggle.checked = soundEnabled;
    }
    
    if (elements.vibrationToggle) {
        elements.vibrationToggle.checked = vibrationEnabled;
    }
    
    if (elements.notificationsToggle) {
        elements.notificationsToggle.checked = notificationsEnabled;
    }
}

function saveSettings() {
    const soundEnabled = elements.soundToggle?.checked ?? true;
    const vibrationEnabled = elements.vibrationToggle?.checked ?? true;
    const notificationsEnabled = elements.notificationsToggle?.checked ?? true;
    
    localStorage.setItem('soundEnabled', soundEnabled);
    localStorage.setItem('vibrationEnabled', vibrationEnabled);
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
    
    if (elements.settingsModal) {
        elements.settingsModal.classList.remove('active');
    }
    
    showNotification('✅ Sozlamalar', 'Sozlamalar saqlandi');
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

// ==================== YANGI DUEL BOSHLASH ==================== 
function showNextDuelConfirmModal() {
    const modalHTML = `
        <div class="modal" id="nextDuelConfirmModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Yangi Duel</h2>
                    <button class="close-btn" onclick="hideNextDuelConfirmModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Yangi duel o'ynashni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="startNewDuelFromMatch()">Ha, Yangi Duel</button>
                    <button class="btn btn-secondary" onclick="hideNextDuelConfirmModal()">Bekor qilish</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('nextDuelConfirmModal', modalHTML);
}

function hideNextDuelConfirmModal() {
    hideModal('nextDuelConfirmModal');
}

function startNewDuelFromMatch() {
    console.log('🔄 Matchdan yangi duelga o\'tish');
    
    hideNextDuelConfirmModal();
    closeChatModal();
    skipToNextDuel();
}

// ==================== MODAL FUNKSIYALARI ==================== 
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
    const modals = ['rulesModal', 'timeoutModal', 'opponentLeftModal', 'noMatchModal', 'nextDuelConfirmModal', 'statsModal'];
    modals.forEach(modalId => hideModal(modalId));
    
    if (elements.profileEditModal) {
        elements.profileEditModal.classList.remove('active');
    }
    
    closeChatModal();
    hideGenderModal();
}

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

// ==================== QAYTA DUEL ==================== 
function requestRematch(partner) {
    if (!partner || !gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Qayta duel so\'rash mumkin emas');
        return;
    }
    
    gameState.socket.emit('request_rematch', {
        opponentId: partner.id,
        duelId: gameState.lastMatchData?.duelId
    });
    
    showNotification('Qayta duel so\'raldi', `${partner.name} ga qayta duel so\'rovi yuborildi`);
    
    hideAllModals();
    returnToMenu();
}

// ==================== DUELDAN CHIQISH ==================== 
function showExitDuelConfirm() {
    const modalHTML = `
        <div class="modal" id="exitDuelModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Duelni tark etish</h2>
                </div>
                <div class="modal-body">
                    <p>Duelni tark etishni xohlaysizmi? Bu sizning reytingingizga salbiy ta'sir ko'rsatishi mumkin.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger" onclick="exitDuel()">Ha, chiqish</button>
                    <button class="btn btn-secondary" onclick="hideModal('exitDuelModal')">Bekor qilish</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('exitDuelModal', modalHTML);
}

function exitDuel() {
    if (gameState.socket && gameState.currentDuelId) {
        gameState.socket.emit('leave_duel', { duelId: gameState.currentDuelId });
    }
    
    hideModal('exitDuelModal');
    returnToMenu();
}

// ==================== DOM YUKLANGANDA ==================== 
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 TO\'SH-QAYCHI-QOG\'OZ DUEL - DOM yuklandi');
    
    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            console.log('✅ Telegram WebApp faollashtirildi');
        }
    } catch (error) {
        console.log('ℹ️ Telegram Web App mavjud emas, test rejimida');
    }
    
    initUserProfile();
    initTabNavigation();
    initSettings();
    setupEventListeners();
    loadProfileQuests();
    loadShopItems();
    loadLeaderboard();
    loadFriendsList();
    loadAchievements();
    setupActivityTracking();
    
    console.log('✅ Tosh-Qaychi-Qog\'oz Duel to\'liq yuklandi!');
});

function setupEventListeners() {
    if (elements.selectMaleBtn) {
        elements.selectMaleBtn.onclick = () => selectGender('male');
    }
    
    if (elements.selectFemaleBtn) {
        elements.selectFemaleBtn.onclick = () => selectGender('female');
    }
    
    if (elements.selectAllBtn) {
        elements.selectAllBtn.onclick = () => selectGender('not_specified');
    }
    
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    if (elements.enterQueueBtn) {
        elements.enterQueueBtn.addEventListener('click', enterQueue);
    }
    
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    if (elements.rockBtn) {
        elements.rockBtn.addEventListener('click', () => handleVote('rock'));
    }
    
    if (elements.scissorsBtn) {
        elements.scissorsBtn.addEventListener('click', () => handleVote('scissors'));
    }
    
    if (elements.paperBtn) {
        elements.paperBtn.addEventListener('click', () => handleVote('paper'));
    }
    
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => handleVote('skip'));
    }
    
    if (elements.rulesBtn) {
        elements.rulesBtn.addEventListener('click', showRulesModal);
    }
    
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', openProfileEdit);
    }
    
    if (elements.closeProfileEditBtn) {
        elements.closeProfileEditBtn.addEventListener('click', closeProfileEdit);
    }
    
    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    if (elements.viewStatsBtn) {
        elements.viewStatsBtn.addEventListener('click', showDetailedStats);
    }
    
    if (elements.closeStatsBtn) {
        elements.closeStatsBtn.addEventListener('click', closeStatsModal);
    }
    
    if (elements.streakRewardBtn) {
        elements.streakRewardBtn.addEventListener('click', claimStreakReward);
    }
    
    if (elements.refreshFriendsBtn) {
        elements.refreshFriendsBtn.addEventListener('click', loadFriendsList);
    }
    
    if (elements.openSettingsBtn) {
        elements.openSettingsBtn.addEventListener('click', openSettings);
    }
    
    if (elements.closeSettingsBtn) {
        elements.closeSettingsBtn.addEventListener('click', closeSettings);
    }
    
    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }
}

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

function claimStreakReward() {
    const nextReward = getNextStreakReward();
    if (!nextReward || userState.streakDays < nextReward.days) {
        showNotification('Kechirasiz', 'Streak mukofotini olish uchun hali vaqt emas');
        return;
    }
    
    userState.coins += nextReward.reward;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    showNotification('🎁 Streak mukofoti!',
        `${nextReward.days} kunlik streak uchun ${nextReward.reward} coin qo'shildi!`);
}

function openSettings() {
    if (elements.settingsModal) {
        elements.settingsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSettings() {
    if (elements.settingsModal) {
        elements.settingsModal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
}

function setupActivityTracking() {
    document.addEventListener('click', () => {
        gameState.lastActivity = Date.now();
    });
    
    document.addEventListener('keypress', () => {
        gameState.lastActivity = Date.now();
    });
    
    setInterval(() => {
        const inactiveTime = Date.now() - gameState.lastActivity;
        if (inactiveTime > 300000 && gameState.isInDuel) {
            showNotification('Faollik yo\'q', '5 daqiqa davomida faol emassiz. Duelda qolish uchun faol bo\'ling.');
        }
    }, 60000);
}

function loadProfileQuests() {
    loadDailyQuests();
}

// ==================== GLOBAL FUNKSIYALAR ==================== 
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;
window.showRulesModal = showRulesModal;
window.hideRulesModal = hideRulesModal;
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

// ==================== TEST FOYDALANUVCHI ==================== 
if (!tgUserGlobal) {
    tgUserGlobal = {
        id: 'test_' + Date.now(),
        first_name: 'Test Foydalanuvchi',
        username: 'testuser',
        photo_url: null
    };
    console.log('🔄 Test foydalanuvchi yaratildi:', tgUserGlobal.id);
}

console.log('🎮 TO\'SH-QAYCHI-QOG\'OZ DUEL - TAKOMILLASHTIRILGAN VERSIYA!');