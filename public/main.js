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

// ==================== TO'SH-QAYCHI-QOG'OZ O'YINI ====================
const RPSGame = {
    // Tanlovlar ro'yxati
    choices: ['rock', 'scissors', 'paper'],
    
    // Tanlov ikonkalari
    choiceIcons: {
        rock: '🪨',
        scissors: '✂️',
        paper: '📄',
        skip: '✖'
    },
    
    // Tanlov matnlari
    choiceNames: {
        rock: 'Tosh',
        scissors: 'Qaychi',
        paper: 'Qog\'oz',
        skip: 'O\'tkazib yuborish'
    },
    
    // Tanlov ranglari
    choiceColors: {
        rock: '#95a5a6',
        scissors: '#3498db',
        paper: '#f1c40f',
        skip: '#e74c3c'
    },
    
    // To'sh-Qaychi-Qog'oz qoidalari
    rules: {
        rock: ['scissors'],     // Tosh qaychini yengadi
        scissors: ['paper'],    // Qaychi qog'ozni yengadi
        paper: ['rock']         // Qog'oz toshni yengadi
    },
    
    // Natijani aniqlash
    determineResult(playerChoice, opponentChoice) {
        console.log(`🎮 Tosh-Qaychi-Qog'oz: ${playerChoice} vs ${opponentChoice}`);
        
        // O'zaro tanlov
        if (playerChoice === 'skip' || opponentChoice === 'skip') {
            return 'no_match';
        }
        
        if (playerChoice === opponentChoice) {
            return 'draw';
        }
        
        // Qoidalarni tekshirish
        if (this.rules[playerChoice]?.includes(opponentChoice)) {
            return 'win';
        }
        
        return 'lose';
    },
    
    // Qoida matni
    getRuleText(playerChoice, opponentChoice, result) {
        const playerName = this.choiceNames[playerChoice] || 'Tanlov';
        const opponentName = this.choiceNames[opponentChoice] || 'Tanlov';
        const playerIcon = this.choiceIcons[playerChoice] || '';
        const opponentIcon = this.choiceIcons[opponentChoice] || '';
        
        switch(result) {
            case 'win':
                return `${playerIcon} ${playerName} > ${opponentIcon} ${opponentName}`;
            case 'lose':
                return `${playerIcon} ${playerName} < ${opponentIcon} ${opponentName}`;
            case 'draw':
                return `${playerIcon} ${playerName} = ${opponentIcon} ${opponentName}`;
            default:
                return 'Natija aniqlanmadi';
        }
    },
    
    // Reyting o'zgarishini hisoblash
    calculateRatingChange(playerRating, opponentRating, result, isRanked = true) {
        if (!isRanked) {
            return {
                player: 0,
                opponent: 0
            };
        }
        
        const K = 32; // Reyting o'zgarish koeffitsienti
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        
        let actualScore;
        switch(result) {
            case 'win': actualScore = 1; break;
            case 'draw': actualScore = 0.5; break;
            case 'lose': actualScore = 0; break;
            default: actualScore = 0;
        }
        
        const ratingChange = Math.round(K * (actualScore - expectedScore));
        
        return {
            player: ratingChange,
            opponent: -ratingChange
        };
    },
    
    // Mukofotlarni hisoblash
    calculateRewards(result, playerLevel, opponentLevel, isSuperLike = false) {
        const baseCoins = {
            win: 50,
            draw: 25,
            lose: 10,
            no_match: 5
        };
        
        const baseXP = {
            win: 30,
            draw: 15,
            lose: 5,
            no_match: 2
        };
        
        // Asosiy mukofotlar
        let coins = baseCoins[result] || 0;
        let xp = baseXP[result] || 0;
        
        // Super Like uchun bonus
        if (isSuperLike) {
            coins *= 2;
            xp *= 2;
        }
        
        // Level farqi uchun bonus
        const levelDiff = opponentLevel - playerLevel;
        if (levelDiff > 0) {
            // Yuqori leveldagi raqibni yutish uchun bonus
            coins += Math.min(levelDiff * 10, 50);
            xp += Math.min(levelDiff * 5, 25);
        }
        
        // Ketma-ket g'alaba uchun bonus
        if (result === 'win') {
            const winStreak = parseInt(localStorage.getItem('winStreak')) || 0;
            const streakBonus = Math.min(Math.floor(winStreak / 3) * 5, 25);
            coins += streakBonus;
        }
        
        return {
            coins: coins,
            xp: xp,
            message: this.getRewardMessage(result, coins, xp)
        };
    },
    
    // Mukofot xabari
    getRewardMessage(result, coins, xp) {
        const messages = {
            win: `🏆 G'alaba uchun ${coins} coin va ${xp} XP!`,
            lose: `💪 Yaxshi urindiz! ${coins} coin va ${xp} XP!`,
            draw: `🤝 Durang uchun ${coins} coin va ${xp} XP!`,
            no_match: `👋 ${coins} coin va ${xp} XP!`
        };
        
        return messages[result] || 'Mukofot olindi!';
    },
    
    // Tanlovni tasodifiy qilish (bot uchun)
    getRandomChoice() {
        return this.choices[Math.floor(Math.random() * this.choices.length)];
    },
    
    // Strategiya asosida tanlov (aqlli bot)
    getSmartChoice(opponentHistory = []) {
        if (opponentHistory.length === 0) {
            return this.getRandomChoice();
        }
        
        // O'tmishdagi tanlovlar statistikasini hisoblash
        const choiceCount = { rock: 0, scissors: 0, paper: 0 };
        opponentHistory.forEach(choice => {
            if (choiceCount[choice] !== undefined) {
                choiceCount[choice]++;
            }
        });
        
        // Eng ko'p ishlatilgan tanlovni aniqlash
        let mostUsedChoice = 'rock';
        let maxCount = 0;
        
        Object.entries(choiceCount).forEach(([choice, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostUsedChoice = choice;
            }
        });
        
        // Qarama-qarshi tanlovni qaytarish
        switch(mostUsedChoice) {
            case 'rock': return 'paper';      // Toshga qarshi qog'oz
            case 'scissors': return 'rock';   // Qaychiga qarshi tosh
            case 'paper': return 'scissors';  // Qog'ozga qarshi qaychi
            default: return this.getRandomChoice();
        }
    }
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
    playerChoiceIcon: document.getElementById('playerChoiceIcon'),
    opponentChoiceIcon: document.getElementById('opponentChoiceIcon'),
    timer: document.getElementById('timer'),
    duelStatus: document.getElementById('duelStatus'),
    
    // RPS elementlari
    matchResultTitle: document.getElementById('matchResultTitle'),
    rockBtn: document.getElementById('rockBtn'),
    scissorsBtn: document.getElementById('scissorsBtn'),
    paperBtn: document.getElementById('paperBtn'),
    noBtn: document.getElementById('noBtn'),
    rulesBtn: document.getElementById('rulesBtn'),
    
    // Tugmalar
    startBtn: document.getElementById('startBtn'),
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
    statWinStreak: document.getElementById('statWinStreak'),
    statFriends: document.getElementById('statFriends'),
    
    // Valyuta va level
    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    shopCoinsCount: document.getElementById('shopCoinsCount'),
    
    // Ulanish holati
    connectionStatusBadge: document.getElementById('connectionStatusBadge'),
    
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
    
    rulesModal: document.getElementById('rulesModal'),
    
    profileEditModal: document.getElementById('profileEditModal'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    editBio: document.getElementById('editBio'),
    editGender: document.getElementById('editGender'),
    editFilter: document.getElementById('editFilter'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
    statsModal: document.getElementById('statsModal'),
    
    settingsModal: document.getElementById('settingsModal'),
    soundToggle: document.getElementById('soundToggle'),
    vibrationToggle: document.getElementById('vibrationToggle'),
    notificationsToggle: document.getElementById('notificationsToggle'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
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
    detailedStatsContent: document.getElementById('detailedStatsContent')
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
    
    try {
        const theme = Telegram.WebApp.colorScheme;
        const bgColor = Telegram.WebApp.backgroundColor;
        const textColor = Telegram.WebApp.textColor;
        
        document.documentElement.style.setProperty('--tg-bg-color', bgColor);
        document.documentElement.style.setProperty('--tg-text-color', textColor);
        
        // Versiyani tekshirish
        const version = Telegram.WebApp.version || '6.0';
        const isOldVersion = parseFloat(version) < 6.1;
        
        if (!isOldVersion) {
            try {
                Telegram.WebApp.setHeaderColor('#667eea');
                Telegram.WebApp.setBackgroundColor('#0f0f23');
            } catch (e) {
                console.log('Telegram API cheklovlari:', e.message);
            }
        }
        
        // BackButton faqat zarurat bo'lganda
        if (gameState.isInDuel || gameState.isInQueue || gameState.inMatchScreen) {
            try {
                Telegram.WebApp.BackButton.show();
                Telegram.WebApp.BackButton.onClick(() => {
                    if (gameState.isInDuel) {
                        showExitDuelConfirm();
                    } else {
                        returnToRPSMenu();
                    }
                });
            } catch (e) {
                console.log('BackButton not supported');
            }
        } else {
            try {
                Telegram.WebApp.BackButton.hide();
            } catch (e) {
                // Ignore
            }
        }
        
    } catch (error) {
        console.log('Telegram theme apply error:', error);
    }
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
    if (elements.statWinStreak) elements.statWinStreak.textContent = userState.winStreak;
    if (elements.statFriends) elements.statFriends.textContent = userState.friendsCount;
    
    const winRate = userState.totalGames > 0 ? Math.round((userState.wins / userState.totalGames) * 100) : 0;
    if (elements.statWinRate) elements.statWinRate.textContent = winRate + '%';
    
    if (elements.profileBio && userState.bio) {
        elements.profileBio.textContent = userState.bio;
    }
    
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

// ==================== SERVERGA ULANISH ==================== 
function connectToServer() {

    if (servers.length === 0 || !servers[0]) {
        console.log('ℹ️ Test rejimida ishlayapman');
        setTimeout(() => {
            gameState.isConnected = true;
            gameState.connectionStatus = 'connected';
            updateConnectionStatus();
            simulateServerConnection();
        }, 1000);
        return;
    }
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
    
    const servers = ['wss://like-duel-server.onrender.com'];
    
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
    socket.on('rps_duel_started', handleRPSDuelStarted);
    socket.on('rps_result', handleRPSResponse);
    socket.on('rps_opponent_choice', handleRPSOpponentChoice);
    socket.on('mutual_match', handleMutualMatch);
    socket.on('friends_list', handleFriendsList);
    socket.on('profile_updated', handleProfileUpdated);
    socket.on('daily_reset', handleDailyReset);
    socket.on('opponent_left', handleOpponentLeft);
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

function handleRPSDuelStarted(data) {
    console.log('🎮 Tosh-Qaychi-Qog\'oz duel boshlandi:', {
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
    enableRPSButtons();
    
    updateOpponentInfo(data.opponent);
    
    startTimer();
    updateDuelStatus('Tosh, Qaychi yoki Qog\'oz tanlang!');
    
    playSound('duel_start');
}

function handleRPSResponse(data) {
    console.log('🎮 Tosh-Qaychi-Qog\'oz natijasi:', data);
    
    const { result, playerChoice, opponentChoice, rewards, partner } = data;
    
    // Animatsiyalar
    showRPSAnimation(playerChoice, opponentChoice, result);
    
    // Natijani ko'rsatish
    showRPSResult(result, playerChoice, opponentChoice, partner);
    
    // Mukofotlarni qo'shish
    if (rewards) {
        applyRPSRewards(rewards, result);
    }
    
    // O'yin holatini yangilash
    updateRPSGameState(result, playerChoice, opponentChoice, rewards, partner);
    
    // Match ekraniga o'tish
    setTimeout(() => {
        showMatchScreen(result, partner, rewards);
    }, 2000);
}

function handleRPSOpponentChoice(data) {
    console.log('👀 Raqib tanlovi:', data.choice);
    
    gameState.opponentChoice = data.choice;
    
    if (elements.opponentChoiceIcon) {
        elements.opponentChoiceIcon.textContent = RPSGame.choiceIcons[data.choice] || '❓';
        elements.opponentChoiceIcon.style.color = RPSGame.choiceColors[data.choice] || '#fff';
        elements.opponentChoiceIcon.style.animation = 'bounce 0.5s ease';
    }
    
    updateDuelStatus('Raqib tanladi. Natijani kutish...');
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
    
    if (gameState.averagePing < 100) {
        gameState.networkQuality = 'good';
    } else if (gameState.averagePing < 300) {
        gameState.networkQuality = 'medium';
    } else {
        gameState.networkQuality = 'poor';
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
        showNotification('Diqqat', 'Serverga ulanmadingiz. Test rejimida ishlayapman.');
        
        // Test rejimida ishlash
        gameState.isConnected = true;
        gameState.connectionStatus = 'connected';
        updateConnectionStatus();
        simulateServerConnection();
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
    
    // Haqiqiy serverga yoki test rejimiga
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('enter_rps_queue');
    } else {
        // Test rejimi - simulyatsiya qilish
        const testEvent = new CustomEvent('enterQueueSimulated');
        document.dispatchEvent(testEvent);
    }
    
    showScreen('queue');
    updateBackButtonVisibility();
    showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
    
    gameState.lastActivity = Date.now();
}

// ==================== O'YINNI BOSHLASH ==================== 
function startGame() {
    console.log('🎮 Oyni boshlash');
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

// ==================== TUGMALARNI RESET QILISH ==================== 
function enableRPSButtons() {
    const buttons = [elements.noBtn, elements.rockBtn, elements.scissorsBtn, elements.paperBtn];
    buttons.forEach(b => {
        if (b) {
            b.disabled = false;
            b.style.opacity = '1';
            b.style.cursor = 'pointer';
            b.style.transform = 'scale(1)';
        }
    });
}

function disableRPSButtons() {
    const buttons = [elements.noBtn, elements.rockBtn, elements.scissorsBtn, elements.paperBtn];
    buttons.forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
            b.style.cursor = 'not-allowed';
        }
    });
}

// ==================== TO'SH-QAYCHI-QOG'OZ TANLOV QILISH ==================== 
function handleRPSChoice(choice) {
    if (!gameState.isInDuel || !gameState.socket || !gameState.currentDuelId) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }

    console.log(`🎮 Tanlov qabul qilindi: ${choice}`);

    // Tugmalarni bloklash
    disableRPSButtons();

    // O'z tanlovini ko'rsatish
    showPlayerChoice(choice);

    // Serverga yuborish
    gameState.socket.emit('rps_vote', {
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

function showPlayerChoice(choice) {
    if (elements.playerChoiceIcon) {
        elements.playerChoiceIcon.textContent = RPSGame.choiceIcons[choice] || '❓';
        elements.playerChoiceIcon.style.color = RPSGame.choiceColors[choice] || '#fff';
        elements.playerChoiceIcon.style.animation = 'bounce 0.5s ease';
    }
}

// ==================== SKIP NATIJASI ==================== 
function handleSkipResult() {
    console.log('✖ Duel tugatildi (foydalanuvchi tomonidan)');
    
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.inMatchScreen = false;
    
    showNoMatchOptions();
}

// ==================== O'YIN HOLATI YANGILASH ====================
function updateRPSGameState(result, playerChoice, opponentChoice, rewards, partner = null) {
    console.log('🔄 Tosh-Qaychi-Qog\'oz natijasi yangilanmoqda:', {
        result,
        playerChoice,
        opponentChoice,
        rewards,
        partner: partner?.name
    });
    
    // O'yin statistikasini yangilash
    updateGameStats(result, playerChoice, opponentChoice);
    
    // Foydalanuvchi ma'lumotlarini yangilash
    userState.totalGames = (userState.totalGames || 0) + 1;
    
    if (result === 'win') {
        userState.wins = (userState.wins || 0) + 1;
        userState.winStreak = (userState.winStreak || 0) + 1;
        
        // Maksimal streakni yangilash
        if (userState.winStreak > (userState.maxWinStreak || 0)) {
            userState.maxWinStreak = userState.winStreak;
        }
    } else if (result === 'lose') {
        userState.losses = (userState.losses || 0) + 1;
        userState.winStreak = 0;
    } else if (result === 'draw') {
        userState.draws = (userState.draws || 0) + 1;
    }
    
    // Coin va XP ni qo'shish
    userState.coins = (userState.coins || 0) + (rewards?.coins || 0);
    
    // Levelni yangilash
    const oldLevel = userState.level || 1;
    userState.level = Math.floor(userState.rating / 100) + 1;
    
    // Level o'zgarsa bildirishnoma ko'rsatish
    if (userState.level > oldLevel) {
        showLevelUpNotification(oldLevel, userState.level);
    }
    
    // LocalStorage ga saqlash
    saveUserStateToLocalStorage();
    
    // UI ni yangilash
    updateUIFromUserState();
    
    return {
        success: true,
        result: result,
        playerChoice: playerChoice,
        opponentChoice: opponentChoice,
        rewards: rewards,
        partner: partner,
        updatedStats: {
            coins: userState.coins,
            rating: userState.rating,
            level: userState.level,
            totalGames: userState.totalGames,
            winStreak: userState.winStreak
        }
    };
}

// ==================== O'YIN STATISTIKASI ====================
function updateGameStats(result, playerChoice, opponentChoice) {
    const statsKey = 'rps_game_stats';
    let stats = JSON.parse(localStorage.getItem(statsKey)) || {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        choiceStats: {
            rock: { wins: 0, uses: 0 },
            scissors: { wins: 0, uses: 0 },
            paper: { wins: 0, uses: 0 }
        },
        recentGames: [],
        winStreak: 0,
        maxWinStreak: 0
    };
    
    // Umumiy statistika
    stats.totalGames++;
    
    // Natija bo'yicha statistika
    switch(result) {
        case 'win':
            stats.wins++;
            stats.winStreak++;
            if (stats.winStreak > stats.maxWinStreak) {
                stats.maxWinStreak = stats.winStreak;
            }
            break;
        case 'lose':
            stats.losses++;
            stats.winStreak = 0;
            break;
        case 'draw':
            stats.draws++;
            break;
    }
    
    // Tanlov bo'yicha statistika
    if (playerChoice && stats.choiceStats[playerChoice]) {
        stats.choiceStats[playerChoice].uses++;
        if (result === 'win') {
            stats.choiceStats[playerChoice].wins++;
        }
    }
    
    // So'nggi o'yinlar
    stats.recentGames.unshift({
        timestamp: new Date().toISOString(),
        result: result,
        playerChoice: playerChoice,
        opponentChoice: opponentChoice
    });
    
    // Faqat so'nggi 20 ta o'yinni saqlash
    if (stats.recentGames.length > 20) {
        stats.recentGames = stats.recentGames.slice(0, 20);
    }
    
    // LocalStorage ga saqlash
    localStorage.setItem(statsKey, JSON.stringify(stats));
    
    return stats;
}

// ==================== VISUAL EFEKTLAR ====================
function showRPSAnimation(playerChoice, opponentChoice, result) {
    if (elements.playerChoiceIcon) {
        elements.playerChoiceIcon.textContent = RPSGame.choiceIcons[playerChoice] || '❓';
        elements.playerChoiceIcon.style.color = RPSGame.choiceColors[playerChoice] || '#fff';
        elements.playerChoiceIcon.style.animation = 'bounce 0.5s ease';
    }
    
    if (elements.opponentChoiceIcon) {
        elements.opponentChoiceIcon.textContent = RPSGame.choiceIcons[opponentChoice] || '❓';
        elements.opponentChoiceIcon.style.color = RPSGame.choiceColors[opponentChoice] || '#fff';
        elements.opponentChoiceIcon.style.animation = 'bounce 0.5s ease';
    }
    
    if (elements.matchResultTitle) {
        switch(result) {
            case 'win':
                elements.matchResultTitle.textContent = '🏆 G\'ALABA!';
                elements.matchResultTitle.style.color = '#2ecc71';
                break;
            case 'lose':
                elements.matchResultTitle.textContent = '😔 MAG\'LUBIYAT';
                elements.matchResultTitle.style.color = '#e74c3c';
                break;
            case 'draw':
                elements.matchResultTitle.textContent = '🤝 DURANG!';
                elements.matchResultTitle.style.color = '#f39c12';
                break;
            default:
                elements.matchResultTitle.textContent = 'O\'YIN TUGADI';
                elements.matchResultTitle.style.color = '#95a5a6';
        }
    }
    
    // Maxsus animatsiyalar
    if (result === 'win' && typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

function showRPSResult(result, playerChoice, opponentChoice, partner) {
    const statusElement = elements.duelStatus;
    
    if (!statusElement) return;
    
    const ruleText = RPSGame.getRuleText(playerChoice, opponentChoice, result);
    
    switch(result) {
        case 'win':
            statusElement.innerHTML = `🏆 G'ALABA!<br>${ruleText}`;
            statusElement.style.color = '#2ecc71';
            break;
        case 'lose':
            statusElement.innerHTML = `😔 MAG'LUBIYAT<br>${ruleText}`;
            statusElement.style.color = '#e74c3c';
            break;
        case 'draw':
            statusElement.innerHTML = `🤝 DURANG<br>${ruleText}`;
            statusElement.style.color = '#f39c12';
            break;
        case 'no_match':
            statusElement.innerHTML = `👋 Match bo'lmadi<br>${partner ? partner.name + ' bilan' : ''}`;
            statusElement.style.color = '#95a5a6';
            break;
    }
}

function applyRPSRewards(rewards, result) {
    if (elements.rewardCoins) elements.rewardCoins.textContent = rewards.coins || 0;
    if (elements.rewardXP) elements.rewardXP.textContent = rewards.xp || 0;
    
    // Streak bonusini tekshirish
    if (result === 'win') {
        const winStreak = parseInt(localStorage.getItem('winStreak')) || 0;
        const newStreak = winStreak + 1;
        localStorage.setItem('winStreak', newStreak.toString());
        
        // Streak bonusini ko'rsatish
        if (newStreak >= 3) {
            showStreakBonusNotification(newStreak);
        }
    } else if (result === 'lose' || result === 'draw') {
        localStorage.setItem('winStreak', '0');
    }
}

function showMatchScreen(result, partner, rewards) {
    if (!elements.matchScreen || !elements.matchText) return;
    
    // Ekran ko'rsatish
    gameState.inMatchScreen = true;
    gameState.isInDuel = false;
    showScreen('match');
    
    // Match matni
    let matchContent = '';
    const ruleText = RPSGame.getRuleText(gameState.currentChoice, gameState.opponentChoice, result);
    
    switch(result) {
        case 'win':
            matchContent = `
                <div class="match-icon">🏆</div>
                <div class="match-title">TABRIKLAYMIZ!</div>
                <div class="match-message">Siz ${partner ? partner.name : 'Raqib'} ni yutdingiz!</div>
                <div class="match-note">${ruleText}</div>
                <div class="match-rewards">
                    <div><i class="fas fa-coins"></i> +${rewards?.coins || 0} coin</div>
                    <div><i class="fas fa-star"></i> +${rewards?.xp || 0} XP</div>
                </div>
            `;
            break;
        case 'lose':
            matchContent = `
                <div class="match-icon">😔</div>
                <div class="match-title">AFSUSKI...</div>
                <div class="match-message">${partner ? partner.name : 'Raqib'} sizni yutdi!</div>
                <div class="match-note">${ruleText}</div>
                <div class="match-rewards">
                    <div><i class="fas fa-coins"></i> +${rewards?.coins || 0} coin</div>
                    <div><i class="fas fa-star"></i> +${rewards?.xp || 0} XP</div>
                </div>
            `;
            break;
        case 'draw':
            matchContent = `
                <div class="match-icon">🤝</div>
                <div class="match-title">DURANG!</div>
                <div class="match-message">Siz va ${partner ? partner.name : 'Raqib'} durang qildingiz!</div>
                <div class="match-note">${ruleText}</div>
                <div class="match-rewards">
                    <div><i class="fas fa-coins"></i> +${rewards?.coins || 0} coin</div>
                    <div><i class="fas fa-star"></i> +${rewards?.xp || 0} XP</div>
                </div>
            `;
            break;
        case 'no_match':
            matchContent = `
                <div class="match-icon">👋</div>
                <div class="match-title">MATCH BO'LMADI</div>
                <div class="match-message">${partner ? partner.name + ' bilan' : 'Raqib bilan'} match bo'lmadi</div>
                <div class="match-rewards">
                    <div><i class="fas fa-coins"></i> +${rewards?.coins || 0} coin</div>
                    <div><i class="fas fa-star"></i> +${rewards?.xp || 0} XP</div>
                </div>
            `;
            break;
    }
    
    elements.matchText.innerHTML = matchContent;
    
    // Tugmalar
    if (elements.matchOptions) {
        elements.matchOptions.innerHTML = `
            ${partner ? `
                <button class="match-option-btn" onclick="requestRPSRematch('${partner.id}')" style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);">
                    🔄 Qayta o'ynash
                </button>
            ` : ''}
            <button class="match-option-btn" onclick="continueToNextRPS()" style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);">
                ➡️ Yangi duel
            </button>
            <button class="match-option-btn" onclick="returnToRPSMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                🏠 Bosh menyu
            </button>
        `;
    }
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
        gameState.socket.emit('rps_vote', {
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

// ==================== STREAK BONUSI ====================
function showStreakBonusNotification(streak) {
    const bonusCoins = Math.min(Math.floor(streak / 3) * 5, 25);
    
    const notification = document.getElementById('streakNotification');
    if (notification) {
        document.getElementById('streakTitle').textContent = `${streak} KETMA-KET G'ALABA!`;
        document.getElementById('streakMessage').textContent = `Streak bonus: ${bonusCoins} coin qo'shildi!`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

// ==================== LEVEL UP NOTIFIKATSIYASI ====================
function showLevelUpNotification(oldLevel, newLevel) {
    const notification = document.getElementById('levelUpNotification');
    if (notification) {
        document.getElementById('levelUpText').textContent = `${oldLevel} → ${newLevel}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
        
        userState.coins += 100;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        playSound('level_up');
    }
}

// ==================== ACHIEVEMENT NOTIFIKATSIYASI ====================
function showAchievementNotification(achievement) {
    const notification = document.getElementById('achievementNotification');
    if (notification) {
        document.getElementById('achievementIcon').textContent = achievement.icon;
        document.getElementById('achievementTitle').textContent = achievement.title;
        document.getElementById('achievementReward').textContent = `${achievement.reward} coin qo'shildi!`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
        
        playSound('achievement');
    }
}

// ==================== NAVBATGA QAYTISH ==================== 
function continueToNextRPS() {
    console.log('🔄 Keyingi duelga o\'tish');
    
    hideAllModals();
    
    clearInterval(gameState.timerInterval);
    
    if (elements.timer) {
        elements.timer.textContent = '30';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
    
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

function returnToRPSMenu() {
    console.log('🏠 Bosh menyuga qaytish');
    
    hideAllModals();
    
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
        elements.timer.textContent = '30';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
    
    updateQueueButton();
    updateBackButtonVisibility();
    
    showScreen('welcome');
    
    showNotification('Bosh menyuga qaytildi', 'Yana o\'ynash uchun "Navbatga Kirish" tugmasini bosing');
}

// ==================== QAYTA O'YIN FUNKSIYALARI ====================
function requestRPSRematch(opponentId) {
    if (!gameState.socket || !opponentId) {
        showNotification('Xato', 'Qayta o\'ynash mumkin emas');
        return;
    }
    
    gameState.socket.emit('rps_rematch', {
        opponentId: opponentId
    });
    
    showNotification('So\'rov yuborildi', 'Qayta o\'ynash so\'rovi yuborildi');
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
    
    // Achievements listini yaratish
    // Bu yerda siz achievements ro'yxatini ko'rsatishingiz mumkin
}

// ==================== STATISTIKA KO'RSATISH ==================== 
function showRPSStatistics() {
    const stats = JSON.parse(localStorage.getItem('rps_game_stats')) || {};
    
    const statsHTML = `
        <div class="modal" id="rpsStatsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📊 Tosh-Qaychi-Qog'oz Statistika</h2>
                    <button class="close-btn" onclick="hideModal('rpsStatsModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="stats-summary">
                        <div class="stat-item">
                            <div class="stat-label">Jami O'yinlar</div>
                            <div class="stat-value">${stats.totalGames || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">G'alabalar</div>
                            <div class="stat-value">${stats.wins || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Mag'lubiyatlar</div>
                            <div class="stat-value">${stats.losses || 0}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Duranglar</div>
                            <div class="stat-value">${stats.draws || 0}</div>
                        </div>
                    </div>
                    
                    <div class="stats-details">
                        <h3>Tanlovlar bo'yicha statistika:</h3>
                        <div class="choice-stats">
                            ${Object.entries(stats.choiceStats || {}).map(([choice, data]) => `
                                <div class="choice-stat">
                                    <div class="choice-icon">${RPSGame.choiceIcons[choice]}</div>
                                    <div class="choice-name">${RPSGame.choiceNames[choice]}</div>
                                    <div class="choice-data">
                                        <span>${data.wins || 0}/${data.uses || 0}</span>
                                        <span class="win-rate">
                                            ${data.uses ? Math.round((data.wins / data.uses) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <h3>So'nggi 5 ta o'yin:</h3>
                        <div class="recent-games">
                            ${(stats.recentGames || []).slice(0, 5).map(game => `
                                <div class="recent-game">
                                    <div class="game-result">
                                        ${game.result === 'win' ? '🏆' : game.result === 'lose' ? '😔' : '🤝'}
                                    </div>
                                    <div class="game-choices">
                                        ${RPSGame.choiceIcons[game.playerChoice] || '?'} vs 
                                        ${RPSGame.choiceIcons[game.opponentChoice] || '?'}
                                    </div>
                                    <div class="game-time">
                                        ${new Date(game.timestamp).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="hideModal('rpsStatsModal')" class="btn btn-primary">Yopish</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('rpsStatsModal', statsHTML);
}

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

// ==================== TOVUSH FUNKSIYALARI ==================== 
function playSound(soundName) {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    
    if (!soundEnabled) return;
    
    // Soddalashtirilgan tovushlar
    const sounds = {
        'rock': 'https://assets.mixkit.co/sfx/preview/mixkit-rock-hit-759.mp3',
        'scissors': 'https://assets.mixkit.co/sfx/preview/mixkit-cutting-with-scissors-767.mp3',
        'paper': 'https://assets.mixkit.co/sfx/preview/mixkit-page-paper-1093.mp3',
        'win': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
        'lose': 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
        'draw': 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
        'skip': 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
        'duel_start': 'https://assets.mixkit.co/sfx/preview/mixkit-game-start-1664.mp3',
        'notification': 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3',
        'level_up': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
        'achievement': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'
    };
    
    if (sounds[soundName]) {
        try {
            const audio = new Audio(sounds[soundName]);
            audio.volume = 0.3;
            audio.play().catch(e => {
                console.log('Tovushni ijro etishda xato:', e);
                // Tovush bo'lmasa, hech narsa qilma
            });
        } catch (error) {
            console.log('Audio yaratishda xato:', error);
        }
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

// ==================== PROFIL TAXRIRLASH ==================== 
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
    const modals = ['rulesModal', 'rpsStatsModal', 'opponentLeftModal', 'noMatchModal', 'profileEditModal', 'statsModal', 'settingsModal'];
    modals.forEach(modalId => hideModal(modalId));
    
    if (elements.genderModal) {
        elements.genderModal.classList.remove('active');
    }
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
                    <button class="btn btn-primary" onclick="continueToNextRPS()">Yangi duel</button>
                    <button class="btn btn-secondary" onclick="returnToRPSMenu()">Bosh menyu</button>
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
                    <button class="btn btn-primary" onclick="continueToNextRPS()">Keyingi duel</button>
                    <button class="btn btn-secondary" onclick="returnToRPSMenu()">Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('opponentLeftModal', modalHTML);
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
    returnToRPSMenu();
}

// ==================== OPEN SETTINGS ==================== 
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

// ==================== DOM YUKLANGANDA ==================== 
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 TOSH-QAYCHI-QOG\'OZ DUEL - DOM yuklandi');
    
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
    setupActivityTracking();
    
    // Test tugmalarini qo'shish (faqat test rejimida)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        addTestButtons();
    }
    
    console.log('✅ Tosh-Qaychi-Qog\'oz Duel to\'liq yuklandi!');
});
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 TOSH-QAYCHI-QOG\'OZ DUEL - DOM yuklandi');
    
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
        elements.rockBtn.addEventListener('click', () => handleRPSChoice('rock'));
    }
    
    if (elements.scissorsBtn) {
        elements.scissorsBtn.addEventListener('click', () => handleRPSChoice('scissors'));
    }
    
    if (elements.paperBtn) {
        elements.paperBtn.addEventListener('click', () => handleRPSChoice('paper'));
    }
    
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => handleRPSChoice('skip'));
    }
    
    if (elements.rulesBtn) {
        elements.rulesBtn.addEventListener('click', showRulesModal);
    }
    
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', openProfileEdit);
    }
    
    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.addEventListener('click', saveProfile);
    }
    
    if (elements.saveSettingsBtn) {
        elements.saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    if (elements.refreshFriendsBtn) {
        elements.refreshFriendsBtn.addEventListener('click', loadFriendsList);
    }
}

function loadProfileQuests() {
    loadDailyQuests();
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

// ==================== GLOBAL FUNKSIYALAR ==================== 
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;
window.showRulesModal = showRulesModal;
window.hideRulesModal = hideRulesModal;
window.selectFilter = selectFilter;
window.continueToNextRPS = continueToNextRPS;
window.returnToRPSMenu = returnToRPSMenu;
window.buyItem = buyItem;
window.hideAllModals = hideAllModals;
window.hideModal = hideModal;
window.enterQueue = enterQueue;
window.leaveQueue = leaveQueue;
window.showRPSStatistics = showRPSStatistics;
window.showDetailedStats = showDetailedStats;
window.closeStatsModal = closeStatsModal;
window.claimQuestReward = claimQuestReward;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.exitDuel = exitDuel;
window.openProfileEdit = openProfileEdit;
window.closeProfileEdit = closeProfileEdit;
window.saveProfile = saveProfile;

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

console.log('🎮 TOSH-QAYCHI-QOG\'OZ DUEL - TAKOMILLASHTIRILGAN VERSIYA!');