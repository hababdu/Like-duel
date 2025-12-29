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
    updateStartButtonState();
    
    // Filter sozlamasini yangilash
    gameState.currentFilter = userState.filter;
}

function updateStartButtonState() {
    if (!elements.startBtn) return;
    
    if (userState.hasSelectedGender) {
        elements.startBtn.disabled = false;
        elements.startBtn.innerHTML = '<i class="fas fa-gamepad"></i> O\'yinni Boshlash';
        elements.startBtn.classList.remove('disabled');
    } else {
        elements.startBtn.disabled = true;
        elements.startBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Avval gender tanlang';
        elements.startBtn.classList.add('disabled');
    }
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
    console.log('🔄 connectToServer funksiyasi chaqirildi');
    
    if (!tgUserGlobal) {
        showNotification('Xato', 'Foydalanuvchi ma\'lumotlari topilmadi');
        return;
    }
    
    if (gameState.socket && gameState.isConnected) {
        console.log('ℹ️ Allaqachon serverga ulanilgan');
        showScreen('queue');
        updateQueueStatus('Navbatdasiz...');
        
        if (userState.hasSelectedGender) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        }
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
    
    try {
        gameState.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            forceNew: true
        });
        
        initSocketEvents();
        
    } catch (error) {
        console.error('❌ Socket ulanish xatosi:', error);
        showNotification('Ulanish xatosi', 'Serverga ulanib bo\'lmadi');
        
        // Tugmani qayta faollashtirish
        updateStartButtonState();
        showScreen('welcome');
    }
}

// ==================== SOCKET EVENTLARNI SOZLASH ====================
function initSocketEvents() {
    if (!gameState.socket) return;
    
    // Asosiy socket eventlari
    gameState.socket.on('connect', () => {
        console.log('✅ Serverga ulandi');
        gameState.isConnected = true;
        gameState.reconnectAttempts = 0;
        updateQueueStatus('Serverga ulandi...');
        
        // Auth ma'lumotlarini yuborish
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
    });
    
    gameState.socket.on('auth_ok', (data) => {
        console.log('✅ Autentifikatsiya muvaffaqiyatli:', data);
        
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
            premium: data.premium || userState.premium,
            premiumDays: data.premiumDays || userState.premiumDays
        });
        
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        // Filter qo'shish
        addFilterToWelcomeScreen();
        
        // Start tugmasini yangilash
        updateStartButtonState();
        
        // Gender tanlangan bo'lsa, navbatga kirish
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
    
    // Navbatga kirish
    gameState.socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        showScreen('queue');
        updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
    });
    
    // Navbat holati
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
    
    // Duel boshlanishi
    gameState.socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        gameState.isInQueue = false;
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        showScreen('duel');
        
        // Raqib ma'lumotlarini ko'rsatish
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
        
        // Timer boshlash
        startTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
        
        // Tugmalarni faollashtirish
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
            }
        });
    });
    
    // Match natijalari
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
    
    // Xatolar
    gameState.socket.on('connect_error', (error) => {
        console.error('❌ Ulanish xatosi:', error);
        gameState.reconnectAttempts++;
        
        if (gameState.reconnectAttempts > gameState.maxReconnectAttempts) {
            showNotification('Ulanish xatosi', 'Serverga ulanib bo\'lmadi. Iltimos, qayta urinib ko\'ring.');
            gameState.socket.disconnect();
            
            // Tugmani qayta faollashtirish
            updateStartButtonState();
            showScreen('welcome');
        } else {
            updateQueueStatus(`Qayta ulanmoqda... (${gameState.reconnectAttempts}/${gameState.maxReconnectAttempts})`);
        }
    });
    
    // Disconnect
    gameState.socket.on('disconnect', (reason) => {
        console.log('❌ Serverdan uzildi:', reason);
        gameState.isConnected = false;
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        
        updateQueueStatus('Ulanish uzildi...');
        
        setTimeout(() => {
            if (!gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                connectToServer();
            }
        }, 3000);
    });
}

// ==================== O'YINNI BOSHLASH ====================
function startGame() {
    console.log('🎮 startGame funksiyasi chaqirildi');
    
    // Gender tanlanmagan bo'lsa
    if (!userState.hasSelectedGender || !userState.currentGender) {
        console.log('⚠️ Gender tanlanmagan, modal ochiladi');
        showGenderModal(true);
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
    
    // Agar allaqachon navbatda yoki duelda bo'lsa
    if (gameState.isInQueue || gameState.isInDuel) {
        console.log('ℹ️ Siz allaqachon o\'yindasiz');
        return;
    }
    
    // Tugmani loading holatiga o'tkazish
    if (elements.startBtn) {
        elements.startBtn.disabled = true;
        elements.startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ulanish...';
        elements.startBtn.classList.add('disabled');
    }
    
    // UI yangilash
    showScreen('queue');
    updateQueueStatus('Serverga ulanmoqda...');
    
    // Serverga ulanish
    setTimeout(() => {
        connectToServer();
    }, 500);
}

// ==================== NAVBAT HOLATINI YANGILASH ====================
function updateQueueStatus(text) {
    console.log('📋 Queue status:', text);
    if (elements.queueStatus) {
        elements.queueStatus.textContent = text;
    }
}

// ==================== DUEL STATUS YANGILASH ====================
function updateDuelStatus(text) {
    if (elements.duelStatus) {
        elements.duelStatus.textContent = text;
    }
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

// ==================== OVOZ BERISH ====================
function handleVote(choice) {
    console.log(`🗳️ Ovoz berish: ${choice}`);
    
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }
    
    // Tugmalarni bloklash
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
        }
    });
    
    // Super like limitini tekshirish
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
    
    // Ovozni yuborish
    gameState.socket.emit('vote', { 
        duelId: gameState.currentDuelId, 
        choice: choice 
    });
    
    clearInterval(gameState.timerInterval);
    
    // UI yangilash
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
    
    // User stateni yangilash
    userState.coins += data.rewards.coins;
    userState.rating = data.newRating;
    userState.matches++;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    // Match opsiyalari
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
    
    // Konfet efekti
    if (typeof confetti === 'function') {
        confetti({ 
            particleCount: 300, 
            spread: 100, 
            origin: { y: 0.6 } 
        });
    }
}

function handleMatchOption(action, partner) {
    console.log(`Match option: ${action}`, partner);
    
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
    console.log('🔄 Navbatga qaytish');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = null;
    
    showScreen('queue');
    updateQueueStatus('Yangi raqib izlanmoqda...');
    
    if (userState.hasSelectedGender && gameState.socket && gameState.isConnected) {
        gameState.isInQueue = true;
        gameState.socket.emit('enter_queue');
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
    clearInterval(gameState.timerInterval);
    
    showScreen('welcome');
    updateStartButtonState();
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
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

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
    
    // Barcha ekranlarni yashirish
    const screens = [
        elements.welcomeScreen, 
        elements.queueScreen, 
        elements.duelScreen, 
        elements.matchScreen, 
        elements.duelEndScreen
    ];
    
    screens.forEach(s => {
        if (s) s.classList.add('hidden');
    });
    
    // Kerakli ekranni ko'rsatish
    switch(screen) {
        case 'welcome':
            if (elements.welcomeScreen) {
                elements.welcomeScreen.classList.remove('hidden');
                updateStartButtonState();
            }
            break;
        case 'queue':
            if (elements.queueScreen) elements.queueScreen.classList.remove('hidden');
            break;
        case 'duel':
            if (elements.duelScreen) elements.duelScreen.classList.remove('hidden');
            break;
        case 'match':
            if (elements.matchScreen) elements.matchScreen.classList.remove('hidden');
            break;
        case 'duel_end':
            if (elements.duelEndScreen) elements.duelEndScreen.classList.remove('hidden');
            break;
    }
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    userState.filter = gender; // Default filter gender bo'yicha
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    hideGenderModal();
    
    // Serverga gender ma'lumotini yuborish
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { gender: gender });
    }
    
    // O'yinni boshlash
    setTimeout(() => {
        startGame();
    }, 500);
    
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
}

// ==================== FILTER QO'SHISH ====================
function addFilterToWelcomeScreen() {
    const profileCard = document.getElementById('profileCard');
    if (!profileCard) return;
    
    // Avvalgi filterni olib tashlash
    const existingFilter = profileCard.querySelector('.gender-filter-container');
    if (existingFilter) existingFilter.remove();
    
    const startBtn = profileCard.querySelector('.start-btn');
    if (startBtn && startBtn.parentNode) {
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
        
        const filterOptions = filterElement.querySelectorAll('.gender-filter-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                const filter = this.dataset.filter;
                selectFilter(filter);
            });
        });
        
        startBtn.parentNode.insertBefore(filterElement, startBtn);
    }
}

// ==================== FILTER TANLASH ====================
function selectFilter(filter) {
    console.log(`🎯 Filter tanlash: ${filter}`);
    
    gameState.currentFilter = filter;
    userState.filter = filter;
    localStorage.setItem('userFilter', filter);
    
    // UI yangilash
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
    
    // Agar navbatda bo'lsa, yangi filter bilan qayta kirish
    if (gameState.isInQueue && gameState.socket) {
        gameState.socket.emit('leave_queue');
        setTimeout(() => {
            gameState.socket.emit('enter_queue');
        }, 500);
    }
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

// ==================== NOTIFIKATSIYA ====================
function showNotification(title, message) {
    console.log(`📢 Notification: ${title} - ${message}`);
    
    if (!elements.notification) return;
    
    if (elements.notificationTitle) elements.notificationTitle.textContent = title;
    if (elements.notificationMessage) elements.notificationMessage.textContent = message;
    
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // 1. Foydalanuvchi profilini yuklash
    initUserProfile();
    
    // 2. Start tugmasi event listener
    if (elements.startBtn) {
        console.log('✅ Start tugmasi topildi');
        elements.startBtn.addEventListener('click', startGame);
    } else {
        console.error('❌ Start tugmasi topilmadi!');
    }
    
    // 3. Gender tanlash tugmalari
    if (elements.selectMaleBtn) {
        elements.selectMaleBtn.addEventListener('click', function() {
            selectGender('male');
        });
    }
    
    if (elements.selectFemaleBtn) {
        elements.selectFemaleBtn.addEventListener('click', function() {
            selectGender('female');
        });
    }
    
    if (elements.selectAllBtn) {
        elements.selectAllBtn.addEventListener('click', function() {
            selectGender('not_specified');
        });
    }
    
    if (elements.selectGenderNowBtn) {
        elements.selectGenderNowBtn.addEventListener('click', function() {
            showGenderModal(true);
        });
    }
    
    // 4. Duel tugmalari
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', function() {
            handleVote('skip');
        });
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', function() {
            handleVote('like');
        });
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', function() {
            handleVote('super_like');
        });
    }
    
    // 5. Navbatdan chiqish tugmasi
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    // 6. Chat modalini yopish
    if (elements.closeChatBtn) {
        elements.closeChatBtn.addEventListener('click', closeChatModal);
    }
    
    // 7. Filterlarni ekranga qo'shish
    setTimeout(function() {
        addFilterToWelcomeScreen();
    }, 1000);
    
    // 8. Test rejimi
    if (!window.Telegram || !Telegram.WebApp) {
        console.log('ℹ️ Telegram WebApp mavjud emas, test rejimi');
        
        setTimeout(function() {
            // Gender tanlanmagan bo'lsa modal ko'rsatish
            if (!userState.hasSelectedGender) {
                console.log('⚠️ Test rejimi: Gender tanlash modalini ko\'rsatish');
                showGenderModal(true);
            }
            
            // Start tugmasini faollashtirish
            updateStartButtonState();
        }, 1500);
    }
    
    console.log('✅ Barcha funksiyalar aktiv');
    console.log('🎮 O\'yinni boshlash uchun startBtn tugmasini bosing!');
});

// ==================== GLOBAL FUNKSIYALAR ====================
// Bu funksiyalar HTML dan chaqirilishi mumkin
window.startGame = startGame;
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;
window.openTelegramChat = openTelegramChat;
window.selectFilter = selectFilter;
window.skipToNextDuel = skipToNextDuel;
window.returnToMenu = returnToMenu;
window.leaveQueue = leaveQueue;
window.handleVote = handleVote;