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
    currentFilter: localStorage.getItem('userFilter') || 'not_specified'
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
    premium: localStorage.getItem('userPremium') === 'true',
    premiumDays: parseInt(localStorage.getItem('userPremiumDays')) || 0
};

// ==================== SOVG'A HOLATI ====================
const giftState = {
    gifts: [],
    sentGifts: [],
    dailyLimits: {},
    giftTypes: {},
    selectedFriend: null,
    selectedGiftType: null,
    giftMessage: '',
    isGiftModalOpen: false,
    currentGiftTab: 'received',
    shopData: null,
    currentShopCategory: 'all'
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    // Asosiy ekranlar
    welcomeScreen: document.getElementById('welcomeScreen'),
    queueScreen: document.getElementById('queueScreen'),
    duelScreen: document.getElementById('duelScreen'),
    matchScreen: document.getElementById('matchScreen'),
    duelEndScreen: document.getElementById('duel_end'),
    
    // Profil elementlari
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    myLikes: document.getElementById('myLikes'),
    
    // Navbat elementlari
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    positionInfo: document.getElementById('positionInfo'),
    queueStatus: document.getElementById('queueStatus'),
    
    // Duel elementlari
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
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    
    // Match elementlari
    partnerName: document.getElementById('partnerName'),
    matchText: document.getElementById('matchText'),
    matchRewards: document.getElementById('matchRewards'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    newRating: document.getElementById('newRating'),
    matchOptions: document.getElementById('matchOptions'),
    
    // Duel tugashi elementlari
    duelEndMessage: document.getElementById('duel_end_message'),
    duelEndOptions: document.getElementById('duel_end_options'),
    
    // Profil tab elementlari
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileBio: document.getElementById('profileBio'),
    statRating: document.getElementById('statRating'),
    statMatches: document.getElementById('statMatches'),
    statDuels: document.getElementById('statDuels'),
    statWinRate: document.getElementById('statWinRate'),
    
    // Statistikalar
    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    shopCoinsCount: document.getElementById('shopCoinsCount'),
    
    // Notifikatsiya
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    
    // Modallar
    genderModal: document.getElementById('genderModal'),
    genderWarning: document.getElementById('genderWarning'),
    selectGenderNowBtn: document.getElementById('selectGenderNowBtn'),
    
    rematchModal: document.getElementById('rematchModal'),
    rematchOpponentName: document.getElementById('rematchOpponentName'),
    acceptRematchBtn: document.getElementById('acceptRematchBtn'),
    declineRematchBtn: document.getElementById('declineRematchBtn'),
    
    profileEditModal: document.getElementById('profileEditModal'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    closeProfileEditBtn: document.getElementById('closeProfileEditBtn'),
    editBio: document.getElementById('editBio'),
    editGender: document.getElementById('editGender'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
    // Gender tanlash tugmalari
    selectMaleBtn: document.getElementById('selectMaleBtn'),
    selectFemaleBtn: document.getElementById('selectFemaleBtn'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    
    // Chat modal elementlari
    chatModal: document.getElementById('chatModal'),
    chatPartnerAvatar: document.getElementById('chatPartnerAvatar'),
    chatPartnerName: document.getElementById('chatPartnerName'),
    chatUsername: document.getElementById('chatUsername'),
    chatOpenTelegramBtn: document.getElementById('chatOpenTelegramBtn'),
    closeChatBtn: document.getElementById('closeChatBtn'),
    
    // Do'stlar tab elementlari
    friendsList: document.getElementById('friendsList'),
    friendsCount: document.getElementById('friendsCount'),
    onlineFriendsCount: document.getElementById('onlineFriendsCount'),
    mutualLikesBadge: document.getElementById('mutualLikesBadge'),
    mutualLikesCount: document.getElementById('mutualLikesCount'),
    
    // Do'kon elementlari
    shopItemsList: document.getElementById('shopItemsList'),
    
    // Liderlar tab elementlari
    leaderboardList: document.getElementById('leaderboardList'),
    leaderboardUpdated: document.getElementById('leaderboardUpdated'),
    
    // Kunlik vazifalar
    profileQuestsList: document.getElementById('profileQuestsList'),
    
    // View stats button
    viewStatsBtn: document.getElementById('viewStatsBtn')
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
        }
    } catch (error) {
        console.log('ℹ️ Telegram Web App mavjud emas, test rejimida');
    }
    
    if (!tgUser.id) {
        tgUser = {
            id: 'test_' + Date.now(),
            first_name: 'Test Foydalanuvchi',
            username: 'test_user',
            photo_url: null
        };
    }
    
    const userPhoto = tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`;
    const userName = tgUser.first_name || 'Foydalanuvchi';
    const userUsername = tgUser.username ? '@' + tgUser.username : '@foydalanuvchi';
    
    if (elements.myAvatar) elements.myAvatar.src = userPhoto;
    if (elements.myName) elements.myName.textContent = userName;
    if (elements.myUsername) elements.myUsername.textContent = userUsername;
    if (elements.profileAvatar) elements.profileAvatar.src = userPhoto;
    if (elements.profileName) elements.profileName.textContent = userName;
    if (elements.profileUsername) elements.profileUsername.textContent = userUsername;
    
    tgUserGlobal = tgUser;
    
    // UI ni yangilash
    updateUIFromUserState();
    
    // Agar gender tanlanmagan bo'lsa, modalni ko'rsatish
    if (!userState.hasSelectedGender) {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        setTimeout(() => {
            showGenderModal(true);
        }, 1000);
    }
    
    return tgUser;
}

// ==================== UI YANGILASH ====================
function updateUIFromUserState() {
    console.log('🎨 UI yangilanmoqda...');
    
    // Gender badge qo'shish
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(elements.myName, userState.currentGender);
        addGenderBadge(elements.profileName, userState.currentGender);
    }
    
    // Statistika yangilash
    if (elements.coinsCount) elements.coinsCount.textContent = userState.coins;
    if (elements.levelCount) elements.levelCount.textContent = userState.level;
    if (elements.shopCoinsCount) elements.shopCoinsCount.textContent = userState.coins;
    if (elements.statRating) elements.statRating.textContent = userState.rating;
    if (elements.statMatches) elements.statMatches.textContent = userState.matches;
    if (elements.myMatches) elements.myMatches.textContent = userState.matches;
    if (elements.statDuels) elements.statDuels.textContent = userState.duels;
    
    const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
    if (elements.statWinRate) elements.statWinRate.textContent = winRate + '%';
    
    if (elements.myLikes) elements.myLikes.textContent = userState.totalLikes;
    if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
    
    if (elements.profileBio && userState.bio) {
        elements.profileBio.textContent = userState.bio;
    }
    
    // Start tugmasini yangilash
    if (elements.startBtn) {
        if (userState.hasSelectedGender) {
            elements.startBtn.disabled = false;
            elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
            elements.startBtn.classList.remove('disabled');
        } else {
            elements.startBtn.disabled = true;
            elements.startBtn.textContent = 'Avval gender tanlang';
            elements.startBtn.classList.add('disabled');
        }
    }
    
    // Filter sozlamasini yangilash
    gameState.currentFilter = userState.filter;
}

function addGenderBadge(element, gender) {
    if (!element || !gender) return;
    
    const oldBadges = element.querySelectorAll('.gender-badge');
    oldBadges.forEach(badge => badge.remove());
    
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
}

// ==================== SAVED STATE FUNCTIONS ====================
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
    localStorage.setItem('userPremium', userState.premium.toString());
    localStorage.setItem('userPremiumDays', userState.premiumDays.toString());
}

// ==================== SERVERGA ULANISH ====================
function connectToServer() {
    if (!tgUserGlobal) {
        showNotification('Xato', 'Foydalanuvchi ma\'lumotlari topilmadi');
        return;
    }
    
    if (gameState.socket && gameState.isConnected) {
        console.log('ℹ️ Allaqachon serverga ulanilgan');
        return;
    }
    
    console.log('🔗 Serverga ulanmoqda...');
    updateQueueStatus('Serverga ulanmoqda...');
    
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
    
    let socketUrl;
    
    if (isLocalhost) {
        socketUrl = 'http://localhost:3000';
        console.log('📍 Local development rejimi');
    } else {
        socketUrl = 'https://like-duel.onrender.com';
        console.log('📍 Production (Render.com) rejimi');
    }
    
    console.log('🔌 Socket URL:', socketUrl);
    
    gameState.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true
    });
    
    // ==================== SOCKET EVENTLARI ====================
    gameState.socket.on('connect', () => {
        console.log('✅ Serverga ulandi');
        gameState.isConnected = true;
        gameState.reconnectAttempts = 0;
        updateQueueStatus('Serverga ulandi...');
        
        gameState.socket.emit('auth', {
            userId: tgUserGlobal.id,
            firstName: tgUserGlobal.first_name,
            lastName: tgUserGlobal.last_name || '',
            username: tgUserGlobal.username,
            photoUrl: tgUserGlobal.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUserGlobal.first_name || 'User')}&background=667eea&color=fff`,
            language: tgUserGlobal.language_code || 'uz',
            gender: userState.currentGender,
            hasSelectedGender: userState.hasSelectedGender,
            bio: userState.bio,
            filter: userState.filter,
            premium: userState.premium,
            premiumDays: userState.premiumDays
        });
        
        showNotification('✅ Ulanish', 'Serverga muvaffaqiyatli ulandik');
    });
    
    gameState.socket.on('auth_ok', (data) => {
        console.log('✅ Autentifikatsiya muvaffaqiyatli:', data);
        
        userState.currentGender = data.gender || userState.currentGender;
        userState.hasSelectedGender = data.hasSelectedGender !== undefined ? data.hasSelectedGender : userState.hasSelectedGender;
        userState.coins = data.coins || userState.coins;
        userState.level = data.level || userState.level;
        userState.rating = data.rating || userState.rating;
        userState.matches = data.matches || userState.matches;
        userState.duels = data.duels || userState.duels;
        userState.wins = data.wins || userState.wins;
        userState.totalLikes = data.totalLikes || userState.totalLikes;
        userState.dailySuperLikes = data.dailySuperLikes || userState.dailySuperLikes;
        userState.bio = data.bio || userState.bio;
        userState.filter = data.filter || userState.filter;
        userState.premium = data.premium || userState.premium;
        userState.premiumDays = data.premiumDays || userState.premiumDays;
        
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        addFilterToWelcomeScreen();
        
        showScreen('queue');
        
        if (userState.hasSelectedGender) {
            console.log('🚀 Gender tanlangan, navbatga kirilmoqda...');
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        } else {
            console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
            updateQueueStatus('Gender tanlash kerak...');
            showGenderModal(true);
        }
    });
    
    // Asosiy socket eventlarni ishga tushirish
    initMainSocketEvents();
    // Sovg'a socket eventlarini ishga tushirish
    initGiftSocketEvents();
}

// ==================== FILTER FUNKSIYALARI ====================
function createFilterOptions() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'gender-filter-container';
    filterContainer.innerHTML = `
        <div class="gender-filter-title">Filter</div>
        <div class="gender-filter-options">
            <div class="gender-filter-option ${gameState.currentFilter === 'male' ? 'active' : ''}" data-filter="male">
                <div class="gender-filter-icon male">
                    <i class="fas fa-mars"></i>
                </div>
                <div class="gender-filter-info">
                    <div class="gender-filter-name">Faqat Erkaklar</div>
                    <div class="gender-filter-description">Erkaklar bilan duel</div>
                </div>
                <div class="gender-filter-check">
                    <i class="fas fa-check"></i>
                </div>
            </div>
            
            <div class="gender-filter-option ${gameState.currentFilter === 'female' ? 'active' : ''}" data-filter="female">
                <div class="gender-filter-icon female">
                    <i class="fas fa-venus"></i>
                </div>
                <div class="gender-filter-info">
                    <div class="gender-filter-name">Faqat Ayollar</div>
                    <div class="gender-filter-description">Ayollar bilan duel</div>
                </div>
                <div class="gender-filter-check">
                    <i class="fas fa-check"></i>
                </div>
            </div>
            
            <div class="gender-filter-option ${gameState.currentFilter === 'not_specified' ? 'active' : ''}" data-filter="not_specified">
                <div class="gender-filter-icon all">
                    <i class="fas fa-users"></i>
                </div>
                <div class="gender-filter-info">
                    <div class="gender-filter-name">Hamma</div>
                    <div class="gender-filter-description">Barcha genderlar bilan duel</div>
                </div>
                <div class="gender-filter-check">
                    <i class="fas fa-check"></i>
                </div>
            </div>
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
    
    if (gameState.isInQueue && gameState.socket) {
        gameState.socket.emit('leave_queue');
        setTimeout(() => {
            gameState.socket.emit('enter_queue');
        }, 500);
    }
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    hideGenderModal();
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { gender: gender });
    } else {
        connectToServer();
    }
    
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
}

// ==================== MODAL FUNKSIYALARI ====================
function showGenderModal(mandatory = true) {
    console.log(`🎯 Gender modali ko'rsatilmoqda`);
    
    if (!elements.genderModal) return;
    
    elements.genderModal.classList.add('active');
    
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
}

// ==================== ASOSIY SOCKET EVENTLARI ====================
function initMainSocketEvents() {
    if (!gameState.socket) return;
    
    gameState.socket.on('show_gender_selection', (data) => {
        console.log('⚠️ Serverdan gender tanlash so\'rovi:', data);
        showGenderModal(true);
        updateQueueStatus('Gender tanlash kerak...');
    });
    
    gameState.socket.on('gender_selected', (data) => {
        console.log('✅ Gender tanlandi:', data);
        
        userState.currentGender = data.gender;
        userState.hasSelectedGender = true;
        
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        hideGenderModal();
        
        if (gameState.socket && gameState.isConnected) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        }
        
        showNotification('🎉 Jins tanlandi', data.message || 'Endi duel o\'ynashingiz mumkin!');
    });
    
    gameState.socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        showScreen('queue');
        updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
    });
    
    gameState.socket.on('waiting_count', (data) => {
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
    });
    
    gameState.socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        showScreen('duel');
        
        if (elements.opponentAvatar) {
            elements.opponentAvatar.src = data.opponent.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.opponent.name || 'O')}&background=${data.opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
            elements.opponentAvatar.style.borderColor = data.opponent.gender === 'female' ? '#f5576c' : '#667eea';
        }
        if (elements.opponentName) {
            elements.opponentName.innerHTML = data.opponent.name;
            addGenderBadge(elements.opponentName, data.opponent.gender);
        }
        if (elements.opponentUsername) elements.opponentUsername.textContent = data.opponent.username || '';
        if (elements.opponentRating) elements.opponentRating.textContent = data.opponent.rating || 1500;
        if (elements.opponentMatches) elements.opponentMatches.textContent = data.opponent.matches || 0;
        if (elements.opponentLevel) elements.opponentLevel.textContent = data.opponent.level || 1;
        
        startTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
        
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
            }
        });
    });
    
    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        handleMatch(data);
    });
    
    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        handleLikedOnly(data);
    });
    
    gameState.socket.on('no_match', (data) => {
        console.log('❌ Match bo\'lmadi');
        handleNoMatch(data);
    });
    
    gameState.socket.on('timeout', (data) => {
        console.log('⏰ Vaqt tugadi');
        handleTimeout(data);
    });
    
    gameState.socket.on('return_to_queue', () => {
        console.log('🔄 Navbatga qaytish');
        if (!gameState.isChatModalOpen) {
            returnToQueue();
        }
    });
    
    gameState.socket.on('menu_returned', () => {
        console.log('🏠 Bosh menyuga qaytish');
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        showScreen('welcome');
    });
    
    gameState.socket.on('profile_updated', (data) => {
        console.log('📊 Profil yangilandi:', data);
        updateStats(data);
    });
    
    gameState.socket.on('super_like_used', (data) => {
        console.log('💖 Super like ishlatildi:', data);
        if (elements.superLikeCount) elements.superLikeCount.textContent = data.remaining;
        userState.dailySuperLikes = data.remaining;
        saveUserStateToLocalStorage();
    });
    
    gameState.socket.on('daily_reset', (data) => {
        console.log('🔄 Kunlik limitlar yangilandi:', data);
        if (elements.superLikeCount) elements.superLikeCount.textContent = data.superLikes;
        userState.dailySuperLikes = data.superLikes;
        saveUserStateToLocalStorage();
        
        // Sovg'a limitlarini yangilash
        Object.keys(giftState.dailyLimits).forEach(giftType => {
            if (giftState.dailyLimits[giftType]) {
                giftState.dailyLimits[giftType].sent = 0;
                giftState.dailyLimits[giftType].remaining = giftState.dailyLimits[giftType].totalLimit;
            }
        });
        
        showNotification('Kun yangilandi', 'Kunlik limitlar qayta tiklandi!');
    });
    
    gameState.socket.on('rematch_request', (data) => {
        console.log('🔄 Qayta duel so\'rovi:', data);
        showRematchModal(data.opponentName, data.opponentId);
    });
    
    gameState.socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        clearInterval(gameState.timerInterval);
        updateDuelStatus('Raqib chiqib ketdi. Keyingi duelga tayyormisiz?');
        
        setTimeout(() => {
            showDuelEndScreen('Raqib chiqib ketdi. Endi nima qilmoqchisiz?');
        }, 2000);
    });
    
    gameState.socket.on('error', (data) => {
        console.error('❌ Xato:', data);
        showNotification('Xato', data.message || 'Noma\'lum xato');
    });
    
    gameState.socket.on('connect_error', (error) => {
        console.error('❌ Ulanish xatosi:', error);
        gameState.reconnectAttempts++;
        
        if (gameState.reconnectAttempts > gameState.maxReconnectAttempts) {
            showNotification('Ulanish xatosi', 'Serverga ulanib bo\'lmadi. Iltimos, qayta urinib ko\'ring.');
            gameState.socket.disconnect();
        } else {
            updateQueueStatus(`Qayta ulanmoqda... (${gameState.reconnectAttempts}/${gameState.maxReconnectAttempts})`);
        }
    });
    
    gameState.socket.on('disconnect', (reason) => {
        console.log('❌ Serverdan uzildi:', reason);
        gameState.isConnected = false;
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        
        if (reason === 'io server disconnect') {
            updateQueueStatus('Server tomonidan uzildi. Qayta ulanmoqda...');
        } else {
            updateQueueStatus('Ulanish uzildi. Qayta ulanmoqda...');
        }
        
        setTimeout(() => {
            if (!gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                connectToServer();
            }
        }, 5000);
    });
}

// ==================== SOVG'A SOCKET EVENTLARI ====================
function initGiftSocketEvents() {
    if (!gameState.socket) return;
    
    gameState.socket.on('gift_sent_success', (data) => {
        console.log('✅ Sovg\'a yuborildi:', data);
        
        userState.coins = data.remainingCoins;
        updateUIFromUserState();
        
        showNotification('🎁 Sovg\'a yuborildi!', 
            `${data.receiverName} ga ${data.giftInfo.name} sovg\'asi yuborildi. -${data.coinsSpent} coin`);
        
        closeGiftModal();
        
        if (gameState.currentTab === 'gifts') {
            gameState.socket.emit('get_gifts');
        }
    });
    
    gameState.socket.on('gift_accepted_confirmation', (data) => {
        console.log('✅ Sovg\'a qabul qilindi:', data);
        
        userState.coins += data.bonuses.coins;
        userState.xp = (userState.xp || 0) + data.bonuses.xp;
        updateUIFromUserState();
        
        showNotification('🎉 Sovg\'a qabul qilindi!', 
            `${data.gift.name} sovg\'asini qabul qildingiz! +${data.bonuses.coins} coin, +${data.bonuses.xp} XP`);
        
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
        
        if (gameState.currentTab === 'gifts') {
            gameState.socket.emit('get_gifts');
        }
    });
    
    gameState.socket.on('new_gift_notification', (data) => {
        console.log('🎁 Yangi sovg\'a:', data);
        
        const pendingCount = (giftState.gifts.filter(g => g.status === 'pending').length || 0) + 1;
        updateGiftsBadge(pendingCount);
        
        showNotification('🎁 Yangi sovg\'a!', 
            `${data.senderName} sizga ${data.giftName} sovg\'asi yubordi!`);
        
        if (gameState.currentTab === 'gifts') {
            gameState.socket.emit('get_gifts');
        }
    });
    
    gameState.socket.on('gifts_data', (data) => {
        console.log('📦 Sovg\'alar ma\'lumotlari:', data);
        
        giftState.gifts = data.received || [];
        giftState.sentGifts = data.sent || [];
        giftState.dailyLimits = data.dailyLimits || {};
        
        updateGiftsUI(data);
        updateGiftsStats(data.stats);
        
        if (data.user) {
            userState.coins = data.user.coins;
            updateUIFromUserState();
        }
    });
    
    gameState.socket.on('shop_data', (data) => {
        console.log('🛒 Do\'kon ma\'lumotlari:', data);
        giftState.shopData = data;
        
        if (gameState.currentTab === 'gifts' && giftState.currentGiftTab === 'shop') {
            loadShopUI(data);
        }
    });
    
    gameState.socket.on('shop_purchase_success', (data) => {
        console.log('✅ Do\'kon xaridi:', data);
        
        userState.coins = data.remainingCoins || userState.coins;
        updateUIFromUserState();
        
        let message = '';
        switch(data.itemType) {
            case 'gift_limit':
                message = `${data.quantity} ta sovg'a limiti sotib olindi!`;
                break;
            case 'super_like':
                message = `${data.quantity} ta Super Like sotib olindi!`;
                break;
            case 'premium':
                message = `${data.days} kunlik Premium status sotib olindi!`;
                break;
            case 'coins':
                message = `${data.quantity} coin sotib olindi!`;
                break;
        }
        
        showNotification('✅ Xarid muvaffaqiyatli!', message);
        
        gameState.socket.emit('get_shop_data');
    });
    
    gameState.socket.on('premium_activated', (data) => {
        console.log('👑 Premium aktivlashtirildi:', data);
        
        userState.premium = true;
        userState.premiumDays = data.days;
        saveUserStateToLocalStorage();
        
        showNotification('👑 Premium Status!', 
            `${data.days} kunlik Premium status aktivlashtirildi!`);
    });
    
    gameState.socket.on('gift_error', (data) => {
        console.error('❌ Sovg\'a xatosi:', data);
        showNotification('Xato', data.message);
        
        const sendBtn = document.getElementById('sendGiftBtn');
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `Sovg'a yuborish`;
        }
    });
    
    gameState.socket.on('shop_purchase_error', (data) => {
        console.error('❌ Do\'kon xatosi:', data);
        showNotification('Xato', data.message);
    });
}

// ==================== MATCH HANDLERS ====================
function handleMatch(data) {
    console.log('🎉 MATCH!', data);
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    
    showScreen('match');
    gameState.currentPartner = data.partner;
    gameState.lastOpponent = data.partner.id;
    
    if (elements.partnerName) elements.partnerName.textContent = data.partner.name;
    
    if (data.isRematch) {
        if (elements.matchText) elements.matchText.innerHTML = `<div style="font-size: 1.5rem;">🎉 QAYTA MATCH!</div>Yana birga bo'ldingiz!`;
    } else {
        if (elements.matchText) elements.matchText.innerHTML = `<div style="font-size: 1.5rem;">🎉 MATCH!</div>Bir-biringizni yoqtirdingiz!`;
    }
    
    if (elements.rewardCoins) elements.rewardCoins.textContent = data.rewards.coins;
    if (elements.rewardXP) elements.rewardXP.textContent = data.rewards.xp;
    if (elements.newRating) elements.newRating.textContent = data.newRating;
    
    userState.coins += data.rewards.coins;
    userState.rating = data.newRating;
    userState.matches++;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    if (elements.matchOptions) {
        elements.matchOptions.innerHTML = '';
        
        const options = [
            {action: 'open_chat', label: '💬 Chatga o\'tish', style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'},
            {action: 'skip_to_next', label: '➡️ Keyingi duel', style: 'background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);'},
            {action: 'return_to_menu', label: '🏠 Bosh menyu', style: 'background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);'}
        ];
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'match-option-btn';
            btn.innerHTML = opt.label;
            btn.style.cssText = opt.style;
            btn.onclick = () => handleMatchOption(opt.action, data.partner);
            elements.matchOptions.appendChild(btn);
        });
    }
    
    if (typeof confetti === 'function') {
        confetti({ 
            particleCount: 300, 
            spread: 100, 
            origin: { y: 0.6 } 
        });
    }
}

function handleMatchOption(action, partner) {
    console.log(`Match option: ${action} for partner:`, partner);
    
    switch(action) {
        case 'open_chat':
            openChat(partner);
            break;
        case 'skip_to_next':
            skipToNextDuel();
            break;
        case 'return_to_menu':
            returnToMenu();
            break;
        default:
            skipToNextDuel();
    }
}

function handleLikedOnly(data) {
    console.log('❤️ Faqat siz like berdidingiz:', data);
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    
    if (elements.timer) elements.timer.textContent = '❤️';
    
    if (data.reward) {
        userState.coins += data.reward.coins;
        userState.totalLikes++;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification('Like uchun mukofot', `+${data.reward.coins} coin, +${data.reward.xp} XP`);
    }
    
    showDuelEndScreen(`Siz ${data.opponentName} ni yoqtirdingiz, lekin u sizni yoqtirmadi. Endi nima qilmoqchisiz?`);
}

function handleNoMatch(data) {
    console.log('❌ Match bo\'lmadi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    
    if (elements.timer) elements.timer.textContent = '✖';
    
    showDuelEndScreen('Match bo\'lmadi. Endi nima qilmoqchisiz?');
}

function handleTimeout(data) {
    console.log('⏰ Vaqt tugadi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    
    if (elements.timer) elements.timer.textContent = '⏰';
    
    showDuelEndScreen('Vaqt tugadi. Endi nima qilmoqchisiz?');
}

// ==================== DUEL TUGASHI EKRANI ====================
function showDuelEndScreen(message) {
    if (elements.duelEndMessage) {
        elements.duelEndMessage.textContent = message;
    }
    
    if (elements.duelEndOptions) {
        elements.duelEndOptions.innerHTML = '';
        
        const options = [
            {action: 'skip_to_next', label: '🔄 Keyingi duel', style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'},
            {action: 'return_to_menu', label: '🏠 Bosh menyu', style: 'background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);'}
        ];
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'duel-end-btn';
            btn.innerHTML = opt.label;
            btn.style.cssText = opt.style;
            btn.onclick = () => handleDuelEndOption(opt.action);
            elements.duelEndOptions.appendChild(btn);
        });
    }
    
    showScreen('duel_end');
}

function handleDuelEndOption(action) {
    switch(action) {
        case 'skip_to_next':
            skipToNextDuel();
            break;
        case 'return_to_menu':
            returnToMenu();
            break;
        default:
            skipToNextDuel();
    }
}

// ==================== SOVG'A FUNKSIYALARI ====================

// Sovg'a yuborish modalini ochish
function openGiftModal(friendId) {
    if (!gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Serverga ulanilmagan');
        return;
    }
    
    const friend = getFriendById(friendId);
    if (!friend) {
        showNotification('Xato', 'Do\'st topilmadi');
        return;
    }
    
    giftState.selectedFriend = friend;
    giftState.selectedGiftType = null;
    giftState.giftMessage = '';
    giftState.isGiftModalOpen = true;
    
    createGiftModal();
}

// Sovg'a modalini yaratish
function createGiftModal() {
    const existingModal = document.getElementById('giftModal');
    if (existingModal) existingModal.remove();
    
    const friend = giftState.selectedFriend;
    const modalHTML = `
    <div class="gift-modal active" id="giftModal">
        <div class="modal-overlay" onclick="closeGiftModal()"></div>
        <div class="modal-content gift-modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-gift"></i>
                    <span>Sovg'a yuborish</span>
                </div>
                <button class="modal-close" onclick="closeGiftModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="gift-friend-info">
                    <img src="${friend.photo}" alt="${friend.name}" class="gift-friend-avatar">
                    <div class="gift-friend-details">
                        <div class="gift-friend-name">${friend.name}</div>
                        <div class="gift-friend-status ${friend.online ? 'online' : 'offline'}">
                            <i class="fas fa-circle"></i>
                            ${friend.online ? 'Onlayn' : 'Offline'}
                        </div>
                    </div>
                </div>
                
                <div class="gift-types-section">
                    <div class="section-title">Sovg'a turini tanlang</div>
                    <div class="gift-types-grid" id="giftTypesGrid">
                    </div>
                </div>
                
                <div class="gift-message-section">
                    <div class="section-title">Xabar qoldirish (ixtiyoriy)</div>
                    <textarea class="gift-message-input" id="giftMessageInput" 
                              placeholder="Sovg'a bilan birga xabar yuboring..." 
                              maxlength="100"></textarea>
                    <div class="char-counter">
                        <span id="charCount">0</span>/100
                    </div>
                </div>
                
                <div class="gift-info-section" id="giftInfoSection" style="display: none;">
                    <div class="section-title">Sovg'a ma'lumotlari</div>
                    <div class="gift-info-card">
                        <div class="gift-info-row">
                            <span>Sovg'a:</span>
                            <span class="gift-info-value" id="selectedGiftName"></span>
                        </div>
                        <div class="gift-info-row">
                            <span>Narxi:</span>
                            <span class="gift-info-value coins" id="giftPrice">
                                <i class="fas fa-coins"></i> <span id="priceValue">0</span>
                            </span>
                        </div>
                        <div class="gift-info-row">
                            <span>Kunlik limit:</span>
                            <span class="gift-info-value" id="dailyLimitInfo"></span>
                        </div>
                        <div class="gift-info-row">
                            <span>Bugun yuborilgan:</span>
                            <span class="gift-info-value" id="sentTodayInfo"></span>
                        </div>
                        <div class="gift-info-row remaining">
                            <span>Qolgan:</span>
                            <span class="gift-info-value" id="remainingInfo"></span>
                        </div>
                    </div>
                </div>
                
                <div class="gift-actions-section">
                    <div class="balance-info">
                        <i class="fas fa-coins"></i>
                        <span>Sizning balansingiz:</span>
                        <span class="balance-amount">${userState.coins} coin</span>
                    </div>
                    
                    <div class="gift-action-buttons">
                        <button class="btn-secondary" onclick="closeGiftModal()">
                            Bekor qilish
                        </button>
                        <button class="btn-primary" id="sendGiftBtn" onclick="sendSelectedGift()" disabled>
                            Sovg'a yuborish
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    loadAvailableGiftTypes();
    
    const messageInput = document.getElementById('giftMessageInput');
    const charCount = document.getElementById('charCount');
    
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            giftState.giftMessage = this.value;
            charCount.textContent = this.value.length;
        });
    }
}

// Mavjud sovg'a turlarini yuklash
function loadAvailableGiftTypes() {
    const grid = document.getElementById('giftTypesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const giftTypeEntries = Object.entries(giftState.dailyLimits || {});
    
    const regularGifts = giftTypeEntries.filter(([type, data]) => !data.premiumOnly);
    const premiumGifts = giftTypeEntries.filter(([type, data]) => data.premiumOnly);
    
    [...regularGifts, ...premiumGifts].forEach(([giftType, giftData]) => {
        const giftElement = document.createElement('div');
        giftElement.className = `gift-type-card ${!giftData.canSend ? 'disabled' : ''} ${giftData.premiumOnly ? 'premium' : ''}`;
        giftElement.dataset.giftType = giftType;
        
        const remaining = giftData.remaining || 0;
        const canSend = giftData.canSend && remaining > 0;
        
        giftElement.innerHTML = `
            <div class="gift-type-icon">${giftData.icon}</div>
            <div class="gift-type-name">${giftData.name}</div>
            <div class="gift-type-price">
                <i class="fas fa-coins"></i> ${giftData.price}
            </div>
            <div class="gift-type-limit">
                ${remaining > 0 ? 
                    `<span class="remaining">${remaining} ta qoldi</span>` : 
                    `<span class="limit-reached">Limit tugadi</span>`
                }
            </div>
            ${giftData.premiumOnly ? '<div class="premium-badge">Premium</div>' : ''}
        `;
        
        if (canSend) {
            giftElement.onclick = () => selectGiftType(giftType, giftData);
        }
        
        grid.appendChild(giftElement);
    });
    
    if (giftTypeEntries.length === 0) {
        grid.innerHTML = `
            <div class="no-gifts-message">
                <i class="fas fa-gift" style="font-size: 3rem; opacity: 0.3; margin-bottom: 15px;"></i>
                <div>Hozircha sovg'a turlari mavjud emas</div>
                <div style="font-size: 0.9rem; opacity: 0.7; margin-top: 10px;">
                    Do'kondan sovg'a limitlarini sotib oling
                </div>
            </div>
        `;
    }
}

// Sovg'a turini tanlash
function selectGiftType(giftType, giftData) {
    giftState.selectedGiftType = giftType;
    
    document.querySelectorAll('.gift-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-gift-type="${giftType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    const infoSection = document.getElementById('giftInfoSection');
    const sendBtn = document.getElementById('sendGiftBtn');
    
    if (infoSection && sendBtn) {
        infoSection.style.display = 'block';
        
        document.getElementById('selectedGiftName').textContent = `${giftData.icon} ${giftData.name}`;
        document.getElementById('priceValue').textContent = giftData.price;
        document.getElementById('dailyLimitInfo').textContent = `${giftData.totalLimit} ta/kun`;
        document.getElementById('sentTodayInfo').textContent = `${giftData.sent} ta`;
        document.getElementById('remainingInfo').textContent = `${giftData.remaining} ta`;
        
        sendBtn.disabled = false;
        
        if (userState.coins < giftData.price) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = `<i class="fas fa-exclamation-circle"></i> Yetarli coin yo'q`;
            sendBtn.classList.add('disabled');
        } else {
            sendBtn.innerHTML = `Sovg'a yuborish (<i class="fas fa-coins"></i> ${giftData.price})`;
            sendBtn.classList.remove('disabled');
        }
    }
}

// Sovg'a yuborish
function sendSelectedGift() {
    if (!giftState.selectedFriend || !giftState.selectedGiftType) {
        showNotification('Xato', 'Sovg\'a va do\'stni tanlang');
        return;
    }
    
    if (!gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Serverga ulanilmagan');
        return;
    }
    
    const sendBtn = document.getElementById('sendGiftBtn');
    if (sendBtn.disabled) return;
    
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...`;
    
    gameState.socket.emit('send_gift', {
        receiverId: giftState.selectedFriend.id,
        giftType: giftState.selectedGiftType,
        message: giftState.giftMessage
    });
}

// Sovg'a modalini yopish
function closeGiftModal() {
    giftState.selectedFriend = null;
    giftState.selectedGiftType = null;
    giftState.giftMessage = '';
    giftState.isGiftModalOpen = false;
    
    const modal = document.getElementById('giftModal');
    if (modal) modal.remove();
}

// ==================== SOVG'ALAR TABINI YARATISH ====================

// DOM yuklanganda sovg'a tabini yaratish
function createGiftsTab() {
    // Nav tablarga sovg'a tabini qo'shish
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) {
        const existingTabs = Array.from(navTabs.children);
        
        const giftTab = document.createElement('div');
        giftTab.className = 'nav-tab';
        giftTab.dataset.tab = 'gifts';
        giftTab.innerHTML = `
            <i class="fas fa-gift"></i>
            <span class="nav-tab-text">Sovg'alar</span>
            <span class="nav-tab-badge" id="giftsBadge" style="display: none;">0</span>
        `;
        
        navTabs.appendChild(giftTab);
        
        giftTab.addEventListener('click', function() {
            switchToTab('gifts');
        });
    }
    
    // Tab content containerini topish
    const tabContents = document.querySelector('.tab-content.active')?.parentNode;
    if (tabContents) {
        const giftTabContent = document.createElement('div');
        giftTabContent.className = 'tab-content';
        giftTabContent.id = 'giftsTab';
        giftTabContent.innerHTML = `
            <div class="gifts-container">
                <div class="gifts-header">
                    <div class="gifts-header-left">
                        <h2 class="gifts-title">
                            <i class="fas fa-gift"></i>
                            Sovg'alar
                        </h2>
                        <div class="gifts-stats" id="giftsStats">
                            <span class="stat-item">
                                <i class="fas fa-download"></i>
                                <span id="receivedCount">0</span> qabul
                            </span>
                            <span class="stat-item">
                                <i class="fas fa-upload"></i>
                                <span id="sentCount">0</span> yuborilgan
                            </span>
                        </div>
                    </div>
                    <div class="gifts-header-right">
                        <div class="balance-display">
                            <i class="fas fa-coins"></i>
                            <span id="giftsBalance">${userState.coins}</span>
                        </div>
                        <button class="btn-refresh" onclick="refreshGifts()" title="Yangilash">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="gifts-tabs-nav">
                    <div class="gifts-tabs">
                        <button class="gift-tab active" data-tab="received">
                            <i class="fas fa-download"></i>
                            <span>Qabul qilingan</span>
                            <span class="tab-badge" id="pendingBadge" style="display: none;">0</span>
                        </button>
                        <button class="gift-tab" data-tab="sent">
                            <i class="fas fa-upload"></i>
                            <span>Yuborilgan</span>
                        </button>
                        <button class="gift-tab" data-tab="limits">
                            <i class="fas fa-chart-line"></i>
                            <span>Limitlar</span>
                        </button>
                        <button class="gift-tab" data-tab="shop">
                            <i class="fas fa-shopping-cart"></i>
                            <span>Do'kon</span>
                        </button>
                    </div>
                </div>
                
                <div class="gifts-content">
                    <div class="gifts-tab-content active" id="giftsReceivedTab">
                        <div class="gifts-list" id="receivedGiftsList">
                        </div>
                    </div>
                    
                    <div class="gifts-tab-content" id="giftsSentTab">
                        <div class="gifts-list" id="sentGiftsList">
                        </div>
                    </div>
                    
                    <div class="gifts-tab-content" id="giftsLimitsTab">
                        <div class="limits-container" id="limitsContainer">
                        </div>
                    </div>
                    
                    <div class="gifts-tab-content" id="giftsShopTab">
                        <div class="shop-container" id="shopContainer">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        tabContents.appendChild(giftTabContent);
        
        setupGiftTabs();
    }
}

// Sovg'a tab navigatsiyasini sozlash
function setupGiftTabs() {
    const tabs = document.querySelectorAll('.gift-tab');
    const tabContents = document.querySelectorAll('.gifts-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            giftState.currentGiftTab = tabName;
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`gifts${capitalizeFirstLetter(tabName)}Tab`).classList.add('active');
            
            switch(tabName) {
                case 'received':
                    loadReceivedGifts();
                    break;
                case 'sent':
                    loadSentGifts();
                    break;
                case 'limits':
                    loadLimits();
                    break;
                case 'shop':
                    loadShop();
                    break;
            }
        });
    });
}

// Qabul qilingan sovg'alarni yuklash
function loadReceivedGifts() {
    const container = document.getElementById('receivedGiftsList');
    if (!container) return;
    
    if (giftState.gifts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gift"></i>
                <h3>Hozircha sovg'alar yo'q</h3>
                <p>Do'stlaringiz sizga sovg'a yuborganlarida bu yerda ko'rasiz</p>
            </div>
        `;
        return;
    }
    
    const pendingGifts = giftState.gifts.filter(g => g.status === 'pending' && !g.isExpired);
    const acceptedGifts = giftState.gifts.filter(g => g.status === 'accepted');
    const expiredGifts = giftState.gifts.filter(g => g.status === 'pending' && g.isExpired);
    
    let html = '';
    
    if (pendingGifts.length > 0) {
        html += `
            <div class="gifts-section">
                <div class="section-header">
                    <h4><i class="fas fa-clock"></i> Kutilayotgan sovg'alar</h4>
                    <span class="section-count">${pendingGifts.length}</span>
                </div>
                <div class="gifts-grid">
        `;
        
        pendingGifts.forEach(gift => {
            html += createGiftCard(gift, 'received');
        });
        
        html += `</div></div>`;
    }
    
    if (acceptedGifts.length > 0) {
        html += `
            <div class="gifts-section">
                <div class="section-header">
                    <h4><i class="fas fa-check-circle"></i> Qabul qilingan sovg'alar</h4>
                    <span class="section-count">${acceptedGifts.length}</span>
                </div>
                <div class="gifts-grid">
        `;
        
        acceptedGifts.forEach(gift => {
            html += createGiftCard(gift, 'received');
        });
        
        html += `</div></div>`;
    }
    
    if (expiredGifts.length > 0) {
        html += `
            <div class="gifts-section">
                <div class="section-header">
                    <h4><i class="fas fa-hourglass-end"></i> Muddati o'tgan sovg'alar</h4>
                    <span class="section-count">${expiredGifts.length}</span>
                </div>
                <div class="gifts-grid">
        `;
        
        expiredGifts.forEach(gift => {
            html += createGiftCard(gift, 'received');
        });
        
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
    
    updateGiftsBadge(pendingGifts.length);
}

// Sovg'a kartasini yaratish
function createGiftCard(gift, type) {
    const isPending = gift.status === 'pending' && !gift.isExpired;
    const isExpired = gift.isExpired;
    const timeAgo = getTimeAgo(gift.createdAt);
    
    let actionsHtml = '';
    
    if (type === 'received') {
        if (isPending) {
            actionsHtml = `
                <div class="gift-actions">
                    <button class="btn-accept" onclick="acceptGift('${gift.id}')">
                        <i class="fas fa-check"></i> Qabul qilish
                    </button>
                    <button class="btn-reject" onclick="rejectGift('${gift.id}')">
                        <i class="fas fa-times"></i> Rad etish
                    </button>
                </div>
            `;
        } else if (gift.status === 'accepted') {
            actionsHtml = `
                <div class="gift-status accepted">
                    <i class="fas fa-check-circle"></i> Qabul qilingan
                    <span class="time-ago">${getTimeAgo(gift.acceptedAt)}</span>
                </div>
            `;
        } else if (isExpired) {
            actionsHtml = `
                <div class="gift-status expired">
                    <i class="fas fa-hourglass-end"></i> Muddati o'tgan
                </div>
            `;
        }
    } else if (type === 'sent') {
        if (gift.status === 'pending') {
            actionsHtml = `
                <div class="gift-status pending">
                    <i class="fas fa-clock"></i> Kutilmoqda
                </div>
            `;
        } else if (gift.status === 'accepted') {
            actionsHtml = `
                <div class="gift-status accepted">
                    <i class="fas fa-check-circle"></i> Qabul qilingan
                    <span class="time-ago">${getTimeAgo(gift.acceptedAt)}</span>
                </div>
            `;
        } else if (gift.status === 'rejected') {
            actionsHtml = `
                <div class="gift-status rejected">
                    <i class="fas fa-times-circle"></i> Rad etilgan
                </div>
            `;
        }
    }
    
    return `
        <div class="gift-card ${isPending ? 'pending' : ''} ${isExpired ? 'expired' : ''}">
            <div class="gift-header">
                <div class="gift-sender">
                    ${type === 'received' ? `
                        <img src="${gift.senderPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(gift.senderName)}" 
                             alt="${gift.senderName}" class="gift-avatar">
                        <div class="gift-user-info">
                            <div class="gift-user-name">${gift.senderName}</div>
                            <div class="gift-time">${timeAgo}</div>
                        </div>
                    ` : `
                        <img src="${gift.receiverPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(gift.receiverName)}" 
                             alt="${gift.receiverName}" class="gift-avatar">
                        <div class="gift-user-info">
                            <div class="gift-user-name">${gift.receiverName}</div>
                            <div class="gift-time">${timeAgo}</div>
                        </div>
                    `}
                </div>
                <div class="gift-type-icon-large">${gift.giftIcon}</div>
            </div>
            
            <div class="gift-body">
                <div class="gift-name">${gift.giftName}</div>
                ${gift.message ? `
                    <div class="gift-message">
                        <i class="fas fa-comment"></i>
                        <span>"${gift.message}"</span>
                    </div>
                ` : ''}
                ${type === 'sent' ? `
                    <div class="gift-price">
                        <i class="fas fa-coins"></i> ${gift.price} coin
                    </div>
                ` : ''}
            </div>
            
            ${actionsHtml}
            
            ${isExpired ? `
                <div class="gift-expired-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Sovg'a muddati tugagan
                </div>
            ` : ''}
        </div>
    `;
}

// Vaqt farqini olish
function getTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
        return `${diffMins} daqiqa oldin`;
    } else if (diffHours < 24) {
        return `${diffHours} soat oldin`;
    } else {
        return `${diffDays} kun oldin`;
    }
}

// Sovg'ani qabul qilish
function acceptGift(giftId) {
    if (!gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Serverga ulanilmagan');
        return;
    }
    
    gameState.socket.emit('accept_gift', { giftId: giftId });
}

// Sovg'ani rad etish
function rejectGift(giftId) {
    if (!gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Serverga ulanilmagan');
        return;
    }
    
    if (confirm('Sovg\'ani rad etishni xohlaysizmi?')) {
        gameState.socket.emit('reject_gift', { giftId: giftId });
    }
}

// Sovg'a badge yangilash
function updateGiftsBadge(count) {
    const badge = document.getElementById('giftsBadge');
    const pendingBadge = document.getElementById('pendingBadge');
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    if (pendingBadge) {
        if (count > 0) {
            pendingBadge.textContent = count;
            pendingBadge.style.display = 'inline-block';
        } else {
            pendingBadge.style.display = 'none';
        }
    }
}

// YANGILASH FUNKSIYALARI
function updateGiftsUI(data) {
    if (gameState.currentTab === 'gifts') {
        switch(giftState.currentGiftTab) {
            case 'received':
                loadReceivedGifts();
                break;
            case 'sent':
                loadSentGifts();
                break;
            case 'limits':
                loadLimits();
                break;
            case 'shop':
                if (giftState.shopData) {
                    loadShopUI(giftState.shopData);
                }
                break;
        }
    }
}

function updateGiftsStats(stats) {
    const receivedCount = document.getElementById('receivedCount');
    const sentCount = document.getElementById('sentCount');
    const giftsBalance = document.getElementById('giftsBalance');
    
    if (receivedCount) receivedCount.textContent = stats.totalReceived || 0;
    if (sentCount) sentCount.textContent = stats.totalSent || 0;
    if (giftsBalance) giftsBalance.textContent = userState.coins;
    
    const pendingCount = stats.pending || 0;
    updateGiftsBadge(pendingCount);
}

// Limitlarni yuklash
function loadLimits() {
    const container = document.getElementById('limitsContainer');
    if (!container) return;
    
    if (Object.keys(giftState.dailyLimits).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>Limitlar mavjud emas</h3>
                <p>Sovg'a limitlari hali mavjud emas</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="limits-header">
            <h3><i class="fas fa-chart-line"></i> Kunlik sovg'a limitlari</h3>
            <div class="limits-info">
                <div class="info-item">
                    <i class="fas fa-sync-alt"></i>
                    <span>Har kuni yangilanadi</span>
                </div>
                ${userState.premium ? `
                    <div class="info-item premium">
                        <i class="fas fa-crown"></i>
                        <span>Premium: Limitlar ${userState.premiumDays >= 90 ? 'cheksiz' : userState.premiumDays >= 30 ? '3x' : '2x'}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="limits-grid">
    `;
    
    Object.values(giftState.dailyLimits).forEach(limit => {
        const percentage = limit.totalLimit > 0 ? (limit.sent / limit.totalLimit) * 100 : 0;
        const progressColor = percentage >= 100 ? '#e74c3c' : 
                            percentage >= 80 ? '#f39c12' : '#2ecc71';
        
        html += `
            <div class="limit-card ${limit.premiumOnly ? 'premium-only' : ''}">
                <div class="limit-header">
                    <div class="limit-icon">${limit.icon}</div>
                    <div class="limit-info">
                        <div class="limit-name">${limit.name}</div>
                        <div class="limit-price">
                            <i class="fas fa-coins"></i> ${limit.price} coin
                        </div>
                    </div>
                    ${limit.premiumOnly ? `
                        <div class="premium-tag">
                            <i class="fas fa-crown"></i> Premium
                        </div>
                    ` : ''}
                </div>
                
                <div class="limit-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background: ${progressColor};"></div>
                    </div>
                    <div class="progress-text">
                        ${limit.sent}/${limit.totalLimit}
                    </div>
                </div>
                
                <div class="limit-details">
                    <div class="detail-item">
                        <span>Asosiy limit:</span>
                        <span>${limit.dailyFreeLimit}</span>
                    </div>
                    <div class="detail-item">
                        <span>Sotib olingan:</span>
                        <span>${limit.purchasedLimit}</span>
                    </div>
                    <div class="detail-item remaining">
                        <span>Qolgan:</span>
                        <span class="remaining-count">${limit.remaining}</span>
                    </div>
                </div>
                
                ${limit.remaining === 0 ? `
                    <button class="btn-buy-limit" onclick="openShopForLimit('${Object.keys(giftState.dailyLimits).find(key => giftState.dailyLimits[key] === limit)}')">
                        <i class="fas fa-shopping-cart"></i> Limitni oshirish
                    </button>
                ` : ''}
            </div>
        `;
    });
    
    html += `</div>`;
    
    if (!userState.premium) {
        html += `
            <div class="premium-promo">
                <div class="premium-promo-content">
                    <i class="fas fa-crown"></i>
                    <div>
                        <h4>Premium bo'ling!</h4>
                        <p>Barcha sovg'a limitlari ${userState.premiumDays >= 90 ? 'cheksiz' : userState.premiumDays >= 30 ? '3 barobar' : '2 barobar'} ko'payadi</p>
                    </div>
                    <button class="btn-premium" onclick="openShopTab()">
                        Premium sotib olish
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Do'kon UI yuklash
function loadShop() {
    if (!gameState.socket || !gameState.isConnected) {
        const container = document.getElementById('shopContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plug"></i>
                    <h3>Serverga ulanilmagan</h3>
                    <p>Do'konni ko'rish uchun serverga ulaning</p>
                </div>
            `;
        }
        return;
    }
    
    gameState.socket.emit('get_shop_data');
}

function loadShopUI(shopData) {
    const container = document.getElementById('shopContainer');
    if (!container || !shopData) return;
    
    const user = shopData.user;
    
    let html = `
        <div class="shop-header">
            <div class="shop-user-info">
                <div class="user-balance">
                    <i class="fas fa-coins"></i>
                    <span>${user.coins} coin</span>
                </div>
                ${user.premium ? `
                    <div class="user-premium">
                        <i class="fas fa-crown"></i>
                        <span>Premium (${user.premiumDays} kun qoldi)</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="shop-categories" id="shopCategories">
                <button class="category-btn active" data-category="all">
                    <i class="fas fa-th"></i> Barchasi
                </button>
                <button class="category-btn" data-category="coins">
                    <i class="fas fa-coins"></i> Coinlar
                </button>
                <button class="category-btn" data-category="gift_limits">
                    <i class="fas fa-gift"></i> Limitlar
                </button>
                <button class="category-btn" data-category="super_likes">
                    <i class="fas fa-gem"></i> Super Like
                </button>
                <button class="category-btn" data-category="premium">
                    <i class="fas fa-crown"></i> Premium
                </button>
            </div>
        </div>
        
        <div class="shop-items-container">
            <div class="shop-items-grid" id="shopItemsGrid">
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    setupShopCategories(shopData);
    loadShopItems(shopData);
}

function setupShopCategories(shopData) {
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            giftState.currentShopCategory = category;
            
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            loadShopItems(shopData, category);
        });
    });
}

function loadShopItems(shopData, category = 'all') {
    const grid = document.getElementById('shopItemsGrid');
    if (!grid || !shopData.itemsByCategory) return;
    
    let items = [];
    
    if (category === 'all') {
        Object.values(shopData.itemsByCategory).forEach(categoryItems => {
            items = items.concat(categoryItems);
        });
    } else {
        items = shopData.itemsByCategory[category] || [];
    }
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="empty-shop">
                <i class="fas fa-shopping-cart"></i>
                <h3>Mahsulotlar topilmadi</h3>
                <p>Bu kategoriyada hozircha mahsulotlar mavjud emas</p>
            </div>
        `;
        return;
    }
    
    items.sort((a, b) => {
        if (a.canAfford && !b.canAfford) return -1;
        if (!a.canAfford && b.canAfford) return 1;
        return a.price - b.price;
    });
    
    let html = '';
    
    items.forEach(item => {
        const isHot = item.category === 'premium' || 
                     (item.category === 'coins' && item.quantity >= 1000);
        
        html += `
            <div class="shop-item-card ${!item.canAfford ? 'disabled' : ''} ${isHot ? 'hot' : ''}">
                ${isHot ? '<div class="hot-badge">🔥</div>' : ''}
                
                <div class="shop-item-icon">${item.icon}</div>
                
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                    
                    ${item.benefits ? `
                        <div class="shop-item-benefits">
                            ${item.benefits.map(benefit => `
                                <div class="benefit-item">
                                    <i class="fas fa-check"></i> ${benefit}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="shop-item-footer">
                    <div class="shop-item-price">
                        <i class="fas fa-coins"></i>
                        <span>${item.price}</span>
                    </div>
                    
                    <button class="shop-item-buy" 
                            onclick="buyShopItem('${item.id}')"
                            ${!item.canAfford ? 'disabled' : ''}
                            ${item.disabledReason ? `title="${item.disabledReason}"` : ''}>
                        ${item.canAfford ? 'Sotib olish' : 'Coin yetarli emas'}
                    </button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Do'kon mahsulotini sotib olish
function buyShopItem(itemId) {
    if (!gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Serverga ulanilmagan');
        return;
    }
    
    if (!confirm('Bu mahsulotni sotib olishni xohlaysizmi?')) {
        return;
    }
    
    gameState.socket.emit('buy_shop_item', { itemId: itemId });
}

// Do'kon tabiga o'tish
function openShopTab() {
    if (gameState.currentTab !== 'gifts') {
        switchToTab('gifts');
    }
    
    const shopTab = document.querySelector('[data-tab="shop"]');
    if (shopTab) {
        shopTab.click();
    }
}

// Limit oshirish uchun do'konni ochish
function openShopForLimit(giftType) {
    openShopTab();
    giftState.currentShopCategory = 'gift_limits';
    
    setTimeout(() => {
        const limitCategoryBtn = document.querySelector('[data-category="gift_limits"]');
        if (limitCategoryBtn) {
            limitCategoryBtn.click();
        }
    }, 100);
}

// Sovg'alarni yangilash
function refreshGifts() {
    if (!gameState.socket || !gameState.isConnected) {
        showNotification('Xato', 'Serverga ulanilmagan');
        return;
    }
    
    gameState.socket.emit('get_gifts');
    
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }, 1000);
    }
}

// Tabni almashtirish
function switchToTab(tabName) {
    gameState.currentTab = tabName;
    
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName + 'Tab') {
            content.classList.add('active');
        }
    });
    
    if (tabName === 'gifts') {
        if (gameState.socket && gameState.isConnected) {
            gameState.socket.emit('get_gifts');
            gameState.socket.emit('get_shop_data');
        }
        
        if (!giftState.currentGiftTab) {
            giftState.currentGiftTab = 'received';
        }
    }
}

// ==================== YORDAMCHI FUNKSIYALAR ====================
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getFriendById(friendId) {
    const friends = getFriendsList();
    return friends.find(friend => friend.id === friendId);
}

function getFriendsList() {
    return [
        { id: 1, name: 'Ali', username: 'ali_jon', photo: 'https://ui-avatars.com/api/?name=Ali&background=667eea&color=fff', online: true, gender: 'male', lastActive: 'hozir', isMatch: true },
        { id: 2, name: 'Malika', username: 'malika_flower', photo: 'https://ui-avatars.com/api/?name=Malika&background=f5576c&color=fff', online: true, gender: 'female', lastActive: '5 daqiqa oldin', isMatch: true },
        { id: 3, name: 'Sanjar', username: 'sanjarbek', photo: 'https://ui-avatars.com/api/?name=Sanjar&background=667eea&color=fff', online: false, gender: 'male', lastActive: '2 kun oldin', isMatch: false },
        { id: 4, name: 'Dilnoza', username: 'dilnoza_girl', photo: 'https://ui-avatars.com/api/?name=Dilnoza&background=f5576c&color=fff', online: true, gender: 'female', lastActive: 'hozir', isMatch: true }
    ];
}

// ==================== DO'STLAR RO'YXATIGA SOVG'A TUGMASI ====================
function updateFriendItemUI(friend) {
    return `
        <div class="friend-item" id="friend-${friend.id}">
            <img src="${friend.photo}" alt="${friend.name}" class="friend-avatar">
            <div class="friend-info">
                <div class="friend-name">
                    ${friend.name}
                    ${friend.premium ? '<span class="premium-badge-small"><i class="fas fa-crown"></i></span>' : ''}
                    ${friend.isMatch ? '<span class="match-badge"><i class="fas fa-heart"></i></span>' : ''}
                </div>
                <div class="friend-username">@${friend.username}</div>
                <div class="friend-status ${friend.online ? 'status-online' : 'status-offline'}">
                    <i class="fas fa-circle"></i>
                    ${friend.online ? 'Onlayn' : 'Oxirgi faol: ' + friend.lastActive}
                </div>
            </div>
            
            <div class="friend-actions">
                <button class="friend-action-btn gift-btn" onclick="openGiftModal('${friend.id}')" 
                        title="${friend.name} ga sovg'a yuborish">
                    <i class="fas fa-gift"></i>
                </button>
                
                <button class="friend-action-btn chat-btn" 
                        onclick="${friend.isMatch ? `openTelegramChat('${friend.username}')` : 'showNotification(\"Xabar\", \"Match bo\\\\\'lmaganingiz uchun chat ochib bo\\\\\'lmaydi\")'}"
                        title="Chat">
                    <i class="fas fa-comment"></i>
                </button>
            </div>
        </div>
    `;
}

// ==================== STILLAR QO'SHIMCHALARI ====================
function addGiftStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
    /* Sovg'a modal stillari */
    .gift-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2000;
        display: none;
    }
    
    .gift-modal.active {
        display: block;
    }
    
    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(5px);
    }
    
    .gift-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 20px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    /* Boshqa stillar... */
    `;
    document.head.appendChild(styleElement);
}

// ==================== TIMER FUNKSIYASI ====================
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    if (elements.timer) {
        elements.timer.textContent = 20;
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        if (elements.timer) elements.timer.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 5 && elements.timer) {
            elements.timer.style.color = '#ff4444';
            elements.timer.style.animation = 'pulse 1s infinite';
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            if (gameState.socket && gameState.isInDuel) {
                gameState.socket.emit('vote', { 
                    duelId: gameState.currentDuelId, 
                    choice: 'skip' 
                });
                if (elements.timer) {
                    elements.timer.textContent = '⏰';
                }
                updateDuelStatus('Vaqt tugadi...');
            }
        }
    }, 1000);
}

// ==================== KEYINGI DUELGA O'TISH ====================
function skipToNextDuel() {
    console.log('🔄 Keyingi duelga o\'tish');
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('skip_to_next');
    } else {
        returnToQueue();
    }
}

// ==================== BOSH MENYUGA QAYTISH ====================
function returnToMenu() {
    console.log('🏠 Bosh menyuga qaytish');
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('return_to_menu');
    } else {
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        showScreen('welcome');
    }
}

// ==================== NAVBATGA QAYTISH ====================
function returnToQueue() {
    console.log('🔄 Navbatga qaytish funksiyasi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = null;
    
    if (elements.rematchModal && elements.rematchModal.classList.contains('active')) {
        elements.rematchModal.classList.remove('active');
    }
    
    if (!gameState.isChatModalOpen) {
        showScreen('queue');
        updateQueueStatus('Yangi raqib izlanmoqda...');
        
        if (userState.hasSelectedGender && gameState.socket && gameState.isConnected) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        }
    }
}

// ==================== CHAT FUNKSIYALARI ====================
function openChat(partner) {
    if (!partner) return;
    
    gameState.isChatModalOpen = true;
    
    if (elements.chatPartnerAvatar) {
        elements.chatPartnerAvatar.src = partner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=667eea&color=fff`;
    }
    if (elements.chatPartnerName) {
        elements.chatPartnerName.textContent = partner.name;
    }
    if (elements.chatUsername && partner.username) {
        elements.chatUsername.textContent = `@${partner.username}`;
    } else if (elements.chatUsername) {
        elements.chatUsername.textContent = '';
    }
    
    if (elements.chatModal) {
        elements.chatModal.classList.add('active');
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
        window.open(telegramUrl, '_blank');
    }
    
    closeChatModal();
}

function closeChatModal() {
    gameState.isChatModalOpen = false;
    if (elements.chatModal) {
        elements.chatModal.classList.remove('active');
    }
    
    showDuelEndScreen('Chat yopildi. Endi nima qilmoqchisiz?');
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
    
    [elements.welcomeScreen, elements.queueScreen, elements.duelScreen, elements.matchScreen, elements.duelEndScreen]
        .forEach(s => {
            if (s) s.classList.add('hidden');
        });
    
    if (screen === 'welcome' && elements.welcomeScreen) {
        elements.welcomeScreen.classList.remove('hidden');
    }
    if (screen === 'queue' && elements.queueScreen) {
        elements.queueScreen.classList.remove('hidden');
    }
    if (screen === 'duel' && elements.duelScreen) {
        elements.duelScreen.classList.remove('hidden');
    }
    if (screen === 'match' && elements.matchScreen) {
        elements.matchScreen.classList.remove('hidden');
    }
    if (screen === 'duel_end' && elements.duelEndScreen) {
        elements.duelEndScreen.classList.remove('hidden');
    }
}

// ==================== OVOZ BERISH ====================
function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }
    
    console.log(`🗳️ Ovoz berish: ${choice}`);
    
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
        }
    });
    
    if (choice === 'super_like' && userState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
            }
        });
        return;
    }
    
    gameState.socket.emit('vote', { 
        duelId: gameState.currentDuelId, 
        choice: choice 
    });
    
    clearInterval(gameState.timerInterval);
    if (choice === 'like') {
        if (elements.timer) elements.timer.textContent = '❤️';
        updateDuelStatus('LIKE berdingiz...');
    } else if (choice === 'super_like') {
        if (elements.timer) elements.timer.textContent = '💖';
        updateDuelStatus('SUPER LIKE!');
        userState.dailySuperLikes--;
        if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
        saveUserStateToLocalStorage();
    } else {
        if (elements.timer) elements.timer.textContent = '✖';
        updateDuelStatus('O\'tkazib yubordingiz...');
    }
}

// ==================== O'YINNI BOSHLASH ====================
function startGame() {
    console.log('🎮 O\'yinni boshlash');
    
    if (!userState.hasSelectedGender) {
        showGenderModal(true);
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
    
    // Agar allaqachon ulanilgan bo'lsa
    if (gameState.socket && gameState.isConnected) {
        console.log('ℹ️ Serverga allaqachon ulangan');
        showScreen('queue');
        if (!gameState.isInQueue) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        }
    } else {
        // Yangi ulanamiz
        connectToServer();
    }
}

// ==================== FILTER QO'SHISH ====================
function addFilterToWelcomeScreen() {
    const profileCard = document.getElementById('profileCard');
    if (!profileCard) return;
    
    // Avvalgi filterni olib tashlash
    const existingFilter = profileCard.querySelector('.gender-filter-container');
    if (existingFilter) {
        existingFilter.remove();
    }
    
    // Start tugmasini topish
    const startBtn = profileCard.querySelector('.start-btn');
    
    if (startBtn && startBtn.parentNode) {
        // Filter elementini yaratish
        const filterElement = document.createElement('div');
        filterElement.className = 'gender-filter-container';
        filterElement.innerHTML = `
            <div class="gender-filter-title">Kim bilan duel?</div>
            <div class="gender-filter-options">
                <div class="gender-filter-option ${gameState.currentFilter === 'male' ? 'active' : ''}" data-filter="male">
                    <div class="gender-filter-icon male">
                        <i class="fas fa-mars"></i>
                    </div>
                    <div class="gender-filter-info">
                        <div class="gender-filter-name">Faqat Erkaklar</div>
                        <div class="gender-filter-description">Erkaklar bilan duel</div>
                    </div>
                    <div class="gender-filter-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
                
                <div class="gender-filter-option ${gameState.currentFilter === 'female' ? 'active' : ''}" data-filter="female">
                    <div class="gender-filter-icon female">
                        <i class="fas fa-venus"></i>
                    </div>
                    <div class="gender-filter-info">
                        <div class="gender-filter-name">Faqat Ayollar</div>
                        <div class="gender-filter-description">Ayollar bilan duel</div>
                    </div>
                    <div class="gender-filter-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
                
                <div class="gender-filter-option ${gameState.currentFilter === 'not_specified' ? 'active' : ''}" data-filter="not_specified">
                    <div class="gender-filter-icon all">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="gender-filter-info">
                        <div class="gender-filter-name">Hamma</div>
                        <div class="gender-filter-description">Barcha genderlar bilan duel</div>
                    </div>
                    <div class="gender-filter-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            </div>
        `;
        
        // Tugmalarga event listener qo'shish
        const filterOptions = filterElement.querySelectorAll('.gender-filter-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                const filter = option.dataset.filter;
                selectFilter(filter);
            });
        });
        
        // Start tugmasidan oldin qo'shish
        startBtn.parentNode.insertBefore(filterElement, startBtn);
    }
}

// ==================== EVENT LISTENER QO'SHISH ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    initUserProfile();
    
    // Sovg'a tabini yaratish
    createGiftsTab();
    
    // Tab navigatsiyasini ishga tushirish
    initTabNavigation();
    
    // Sovg'a stillarini qo'shish
    addGiftStyles();
    
    // Start tugmasi uchun event listener
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    // Gender tanlash tugmalari
    if (elements.selectMaleBtn) {
        elements.selectMaleBtn.addEventListener('click', () => selectGender('male'));
    }
    
    if (elements.selectFemaleBtn) {
        elements.selectFemaleBtn.addEventListener('click', () => selectGender('female'));
    }
    
    if (elements.selectAllBtn) {
        elements.selectAllBtn.addEventListener('click', () => selectGender('not_specified'));
    }
    
    // Duel tugmalari
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => handleVote('skip'));
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', () => handleVote('like'));
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));
    }
    
    // Navbatdan chiqish
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    // Filterlarni welcome screenga qo'shish
    setTimeout(() => {
        addFilterToWelcomeScreen();
    }, 500);
    
    console.log('✅ Barcha funksiyalar aktiv');
});

// ==================== TEST REJIMI ====================
// Agar Telegram WebApp bo'lmasa, test rejimini yoqish
if (!window.Telegram || !Telegram.WebApp) {
    console.log('ℹ️ Telegram WebApp mavjud emas, test rejimi');
    
    // Test ma'lumotlarini o'rnatish
    setTimeout(() => {
        if (!userState.hasSelectedGender) {
            console.log('⚠️ Test rejimi: Gender tanlash modalini ko\'rsatish');
            showGenderModal(true);
        }
        
        // Test uchun start tugmasini faollashtirish
        if (elements.startBtn) {
            elements.startBtn.disabled = false;
            elements.startBtn.classList.remove('disabled');
        }
    }, 1000);
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
    clearInterval(gameState.timerInterval);
    
    showScreen('welcome');
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
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

// ==================== YANGI FUNKSIYALAR ====================
function updateQueueStatus(message) {
    if (elements.queueStatus) {
        elements.queueStatus.textContent = message;
    }
}

function updateDuelStatus(message) {
    if (elements.duelStatus) {
        elements.duelStatus.textContent = message;
    }
}

function updateStats(data) {
    if (data.coins) userState.coins = data.coins;
    if (data.rating) userState.rating = data.rating;
    if (data.matches) userState.matches = data.matches;
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
}

function showNotification(title, message) {
    if (elements.notification) {
        elements.notificationTitle.textContent = title;
        elements.notificationMessage.textContent = message;
        elements.notification.classList.add('active');
        
        setTimeout(() => {
            elements.notification.classList.remove('active');
        }, 3000);
    }
}

function showRematchModal(opponentName, opponentId) {
    if (elements.rematchModal && elements.rematchOpponentName) {
        elements.rematchOpponentName.textContent = opponentName;
        elements.rematchModal.classList.add('active');
        
        // Event listener'lar
        if (elements.acceptRematchBtn) {
            elements.acceptRematchBtn.onclick = () => {
                if (gameState.socket) {
                    gameState.socket.emit('accept_rematch', { opponentId: opponentId });
                }
                elements.rematchModal.classList.remove('active');
            };
        }
        
        if (elements.declineRematchBtn) {
            elements.declineRematchBtn.onclick = () => {
                elements.rematchModal.classList.remove('active');
            };
        }
    }
}

// ==================== GLOBAL FUNKSIYALAR ====================
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;
window.openTelegramChat = openTelegramChat;
window.selectFilter = selectFilter;
window.skipToNextDuel = skipToNextDuel;
window.returnToMenu = returnToMenu;
window.openGiftModal = openGiftModal;
window.closeGiftModal = closeGiftModal;
window.acceptGift = acceptGift;
window.rejectGift = rejectGift;
window.buyShopItem = buyShopItem;
window.openShopTab = openShopTab;
window.openShopForLimit = openShopForLimit;
window.refreshGifts = refreshGifts;
window.switchToTab = switchToTab;