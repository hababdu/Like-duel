// main.js - YANGILANGAN VERSIYA

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
    // Yangi: chat modal ochiqligini kuzatish
    isChatModalOpen: false
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
    bio: localStorage.getItem('userBio') || ''
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
    
    // Chat modal elementlari (yangi dizayn)
    chatModal: document.getElementById('chatModal'),
    chatPartnerAvatar: document.getElementById('chatPartnerAvatar'),
    chatPartnerName: document.getElementById('chatPartnerName'),
    chatUsername: document.getElementById('chatUsername'),
    chatOpenTelegramBtn: document.getElementById('chatOpenTelegramBtn'),
    closeChatBtn: document.getElementById('closeChatBtn'),
    
    // Do'stlar tab elementlari
    friendRequestsSection: document.getElementById('friendRequestsSection'),
    friendRequestsList: document.getElementById('friendRequestsList'),
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
    dailyQuestsList: document.getElementById('dailyQuestsList'),
    questsPreview: document.getElementById('questsPreview'),
    
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
            
            // Telegram username ni olish
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
    
    // Render.com uchun Socket URL
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
            bio: userState.bio
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
        
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
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
        
        if (elements.opponentAvatar) elements.opponentAvatar.src = data.opponent.photo || 'https://ui-avatars.com/api/?name=O&background=764ba2&color=fff';
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
    
    gameState.socket.on('no_match', () => {
        console.log('❌ Match bo\'lmadi');
        handleNoMatch();
    });
    
    gameState.socket.on('timeout', () => {
        console.log('⏰ Vaqt tugadi');
        handleTimeout();
    });
    
    gameState.socket.on('return_to_queue', () => {
        console.log('🔄 Navbatga qaytish');
        // Faqat chat modal ochiq bo'lmasa
        if (!gameState.isChatModalOpen) {
            returnToQueue();
        }
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
        showNotification('Kun yangilandi', 'Kunlik SUPER LIKE lar qayta tiklandi!');
    });
    
    gameState.socket.on('rematch_request', (data) => {
        console.log('🔄 Qayta duel so\'rovi:', data);
        showRematchModal(data.opponentName, data.opponentId);
    });
    
    gameState.socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        clearInterval(gameState.timerInterval);
        updateDuelStatus('Raqib chiqib ketdi. Yangi raqib izlanmoqda...');
        setTimeout(() => {
            returnToQueue();
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

function showRematchModal(name, id) {
    if (elements.rematchOpponentName) {
        elements.rematchOpponentName.textContent = name;
    }
    gameState.lastOpponent = id;
    if (elements.rematchModal) {
        elements.rematchModal.classList.add('active');
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

// ==================== MATCH HANDLERS (YANGILANGAN) ====================
function handleMatch(data) {
    clearInterval(gameState.timerInterval);
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
    
    // YANGI: Match options - faqat "Chatga o'tish" va "O'tkazish"
    if (elements.matchOptions) {
        elements.matchOptions.innerHTML = '';
        
        const options = [
            {action: 'open_chat', label: '💬 Chatga o\'tish', style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'},
            {action: 'skip', label: '➡️ O\'tkazish', style: 'background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);'}
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
    
    // YANGI: 5 soniyadan keyin avtomatik navbatga qaytish
    setTimeout(() => {
        if (!gameState.isChatModalOpen) {
            returnToQueue();
        }
    }, 5000); // 5 soniya
}

// YANGI: Match option funksiyalari
function handleMatchOption(action, partner) {
    console.log(`Match option: ${action} for partner:`, partner);
    
    switch(action) {
        case 'open_chat':
            openChat(partner);
            break;
        case 'skip':
        default:
            returnToQueue();
            break;
    }
}

// YANGI: Chat funksiyasi - Telegram chatga o'tish
function openChat(partner) {
    if (!partner) return;
    
    // Chat modalni ko'rsatish
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

// Telegram chatga o'tish funksiyasi
function openTelegramChat(username) {
    if (!username) {
        showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        return;
    }
    
    const telegramUrl = `https://t.me/${username.replace('@', '')}`;
    
    // Telegram Web App ichida ochish
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
        // Oddiy brauzerda ochish
        window.open(telegramUrl, '_blank');
    }
    
    // Chat modalni yopish
    closeChatModal();
}

function closeChatModal() {
    gameState.isChatModalOpen = false;
    if (elements.chatModal) {
        elements.chatModal.classList.remove('active');
    }
    
    // Chat yopilganda navbatga qaytish
    returnToQueue();
}

function handleLikedOnly(data) {
    clearInterval(gameState.timerInterval);
    if (elements.timer) elements.timer.textContent = '❤️';
    updateDuelStatus('Siz yoqtirdingiz, lekin raqib yoqtirmadi');
    
    if (data.reward) {
        userState.coins += data.reward.coins;
        userState.totalLikes++;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification('Like uchun mukofot', `+${data.reward.coins} coin, +${data.reward.xp} XP`);
    }
    
    setTimeout(() => {
        returnToQueue();
    }, 3000);
}

function handleNoMatch() {
    clearInterval(gameState.timerInterval);
    if (elements.timer) elements.timer.textContent = '✖';
    updateDuelStatus('Match bo\'lmadi. Yangi raqib izlanmoqda...');
    setTimeout(() => {
        returnToQueue();
    }, 3000);
}

function handleTimeout() {
    clearInterval(gameState.timerInterval);
    if (elements.timer) elements.timer.textContent = '⏰';
    updateDuelStatus('Vaqt tugadi. Yangi raqib izlanmoqda...');
    setTimeout(() => {
        returnToQueue();
    }, 2000);
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

// ==================== NAVBATGA QAYTISH (YANGILANGAN) ====================
function returnToQueue() {
    console.log('🔄 Navbatga qaytish funksiyasi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = null;
    
    // Modallarni yopish (faqat chat modal emas)
    if (elements.rematchModal && elements.rematchModal.classList.contains('active')) {
        elements.rematchModal.classList.remove('active');
    }
    
    // Faqat chat modal ochiq bo'lmasa, queue ekraniga o'tish
    if (!gameState.isChatModalOpen) {
        showScreen('queue');
        updateQueueStatus('Yangi raqib izlanmoqda...');
        
        if (userState.hasSelectedGender && gameState.socket && gameState.isConnected) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        }
    }
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
    
    [elements.welcomeScreen, elements.queueScreen, elements.duelScreen, elements.matchScreen]
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

// ==================== DO'STLAR FUNKSIYALARI ====================
function loadFriendsList() {
    // Bu test ma'lumotlar, aslida serverdan keladi
    const friends = [
        { id: 1, name: 'Ali', username: 'ali_jon', online: true, gender: 'male', lastActive: 'hozir', isMatch: true },
        { id: 2, name: 'Malika', username: 'malika_flower', online: true, gender: 'female', lastActive: '5 daqiqa oldin', isMatch: true },
        { id: 3, name: 'Sanjar', username: 'sanjarbek', online: false, gender: 'male', lastActive: '2 kun oldin', isMatch: false },
        { id: 4, name: 'Dilnoza', username: 'dilnoza_girl', online: true, gender: 'female', lastActive: 'hozir', isMatch: true }
    ];
    
    if (elements.friendsList) {
        elements.friendsList.innerHTML = friends.map(friend => `
            <div class="friend-item">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=${friend.gender === 'male' ? '667eea' : 'f5576c'}&color=fff" 
                     alt="${friend.name}" class="friend-avatar">
                <div class="friend-info">
                    <div class="friend-name">
                        ${friend.name}
                        ${friend.isMatch ? '<span style="color: #667eea; font-size: 0.8rem; margin-left: 5px;">❤️</span>' : ''}
                    </div>
                    <div class="friend-username">@${friend.username}</div>
                    <div class="friend-status ${friend.online ? 'status-online' : 'status-offline'}">
                        ${friend.online ? 'Onlayn' : 'Oxirgi faol: ' + friend.lastActive}
                    </div>
                </div>
                <button class="match-option-btn" style="padding: 8px 12px; font-size: 0.85rem; min-width: 80px;"
                        onclick="${friend.isMatch ? `openTelegramChat('${friend.username}')` : 'showNotification("Xabar", "Match bo\'lmaganingiz uchun chat ochib bo\'lmaydi")'}"}>
                    ${friend.online ? 'Chat' : 'Xabar'}
                </button>
            </div>
        `).join('');
    }
    
    if (elements.friendsCount) elements.friendsCount.textContent = friends.length;
    if (elements.onlineFriendsCount) {
        const onlineCount = friends.filter(f => f.online).length;
        elements.onlineFriendsCount.textContent = onlineCount;
    }
    if (elements.mutualLikesBadge && elements.mutualLikesCount) {
        const mutualCount = friends.filter(f => f.isMatch).length;
        if (mutualCount > 0) {
            elements.mutualLikesCount.textContent = mutualCount;
            elements.mutualLikesBadge.classList.remove('hidden');
        } else {
            elements.mutualLikesBadge.classList.add('hidden');
        }
    }
}

// ==================== DO'KON FUNKSIYALARI ====================
function loadShopItems() {
    const items = [
        { id: 1, name: '10 Super Like', price: 100, icon: '💖', description: '10 ta kunlik SUPER LIKE' },
        { id: 2, name: '50 Super Like', price: 450, icon: '💎', description: '50 ta kunlik SUPER LIKE', discount: '10%' },
        { id: 3, name: '100 Super Like', price: 800, icon: '👑', description: '100 ta kunlik SUPER LIKE', discount: '20%' },
        { id: 4, name: 'Premium Profil', price: 300, icon: '⭐', description: '30 kunlik premium status' }
    ];
    
    if (elements.shopItemsList) {
        elements.shopItemsList.innerHTML = items.map(item => `
            <div class="shop-item">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                </div>
                <button class="shop-item-buy" onclick="buyItem(${item.id})" 
                        ${userState.coins < item.price ? 'disabled' : ''}>
                    <i class="fas fa-coins"></i> ${item.price}
                </button>
            </div>
        `).join('');
    }
}

window.buyItem = function(itemId) {
    const items = [
        { id: 1, price: 100 },
        { id: 2, price: 450 },
        { id: 3, price: 800 },
        { id: 4, price: 300 }
    ];
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (userState.coins >= item.price) {
        userState.coins -= item.price;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        showNotification('✅ Xarid qilindi', 'Mahsulot muvaffaqiyatli sotib olindi!');
    } else {
        showNotification('⚠️ Yetarli emas', 'Coinlaringiz yetarli emas!');
    }
};

// ==================== LIDERLAR FUNKSIYALARI ====================
function loadLeaderboard() {
    const leaders = [
        { rank: 1, name: 'Ali', rating: 1850, matches: 45, coins: 1250, gender: 'male' },
        { rank: 2, name: 'Malika', rating: 1790, matches: 38, coins: 980, gender: 'female' },
        { rank: 3, name: 'Sanjar', rating: 1720, matches: 32, coins: 750, gender: 'male' },
        { rank: 4, name: 'Dilnoza', rating: 1680, matches: 29, coins: 620, gender: 'female' },
        { rank: 5, name: 'Sardor', rating: 1620, matches: 25, coins: 580, gender: 'male' }
    ];
    
    if (elements.leaderboardList) {
        elements.leaderboardList.innerHTML = leaders.map(leader => `
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
                        <span><i class="fas fa-coins"></i> ${leader.coins}</span>
                    </div>
                </div>
                <div class="leaderboard-value">${leader.rating}</div>
            </div>
        `).join('');
    }
    
    if (elements.leaderboardUpdated) {
        elements.leaderboardUpdated.textContent = 'hozir';
    }
}

// ==================== KUNLIK VAZIFALAR ====================
function loadProfileQuests() {
    const quests = [
        { id: 1, title: '3 ta duel o\'ynash', progress: Math.min(userState.duels, 3), total: 3, reward: 50 },
        { id: 2, title: '5 ta like berish', progress: Math.min(userState.totalLikes, 5), total: 5, reward: 30 },
        { id: 3, title: '1 ta match olish', progress: Math.min(userState.matches, 1), total: 1, reward: 100 },
        { id: 4, title: 'Reytingni 50 ga oshirish', progress: Math.min(Math.max(0, userState.rating - 1500), 50), total: 50, reward: 200 }
    ];
    
    if (elements.profileQuestsList) {
        elements.profileQuestsList.innerHTML = quests.map(quest => `
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
    }
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

function updateStats(data) {
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

// ==================== O'YINNI BOSHLASH ====================
function startGame() {
    console.log('🎮 O\'yinni boshlash');
    
    if (!userState.hasSelectedGender) {
        showGenderModal(true);
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
    gameState.currentDuelId = null;
    clearInterval(gameState.timerInterval);
    
    showScreen('welcome');
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Profilni yuklash
    initUserProfile();
    
    // Tab navigatsiyasini ishga tushirish
    initTabNavigation();
    
    // Gender tugmalarini ishga tushirish
    if (elements.selectMaleBtn) {
        elements.selectMaleBtn.onclick = () => {
            selectGender('male');
            hideGenderModal();
        };
    }
    
    if (elements.selectFemaleBtn) {
        elements.selectFemaleBtn.onclick = () => {
            selectGender('female');
            hideGenderModal();
        };
    }
    
    if (elements.selectAllBtn) {
        elements.selectAllBtn.onclick = () => {
            selectGender('not_specified');
            hideGenderModal();
        };
    }
    
    // Event listener'lar
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => handleVote('skip'));
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', () => handleVote('like'));
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));
    }
    
    if (elements.selectGenderNowBtn) {
        elements.selectGenderNowBtn.addEventListener('click', () => showGenderModal(true));
    }
    
    if (elements.acceptRematchBtn) {
        elements.acceptRematchBtn.addEventListener('click', () => {
            if (gameState.socket && gameState.lastOpponent) {
                gameState.socket.emit('accept_rematch', { opponentId: gameState.lastOpponent });
            }
            if (elements.rematchModal) {
                elements.rematchModal.classList.remove('active');
            }
            returnToQueue();
        });
    }
    
    if (elements.declineRematchBtn) {
        elements.declineRematchBtn.addEventListener('click', () => {
            if (elements.rematchModal) {
                elements.rematchModal.classList.remove('active');
            }
            returnToQueue();
        });
    }
    
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', () => {
            if (elements.editBio) elements.editBio.value = userState.bio || '';
            if (elements.editGender) elements.editGender.value = userState.currentGender || 'not_specified';
            if (elements.profileEditModal) {
                elements.profileEditModal.classList.add('active');
            }
        });
    }
    
    if (elements.closeProfileEditBtn) {
        elements.closeProfileEditBtn.addEventListener('click', () => {
            if (elements.profileEditModal) {
                elements.profileEditModal.classList.remove('active');
            }
        });
    }
    
    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.addEventListener('click', () => {
            const bio = elements.editBio?.value.trim() || '';
            const gender = elements.editGender?.value || 'not_specified';
            
            if (gender === 'not_specified') {
                if (!confirm('⚠️ Gender tanlanmasa, duel o\'ynay olmaysiz. Davom etishni xohlaysizmi?')) {
                    return;
                }
            }
            
            if (gameState.socket) {
                gameState.socket.emit('update_profile', { bio, gender });
                
                userState.bio = bio;
                if (gender !== userState.currentGender) {
                    userState.currentGender = gender;
                    userState.hasSelectedGender = true;
                }
                saveUserStateToLocalStorage();
                updateUIFromUserState();
                
                if (bio && elements.profileBio) {
                    elements.profileBio.textContent = bio;
                }
            }
            
            if (elements.profileEditModal) {
                elements.profileEditModal.classList.remove('active');
            }
            showNotification('✅ Profil yangilandi', 'O\'zgarishlar saqlandi');
        });
    }
    
    // Chat modal event listener'lar
    if (elements.closeChatBtn) {
        elements.closeChatBtn.addEventListener('click', () => {
            closeChatModal();
        });
    }
    
    // Telegram chatga o'tish tugmasi
    if (elements.chatOpenTelegramBtn) {
        elements.chatOpenTelegramBtn.addEventListener('click', () => {
            if (gameState.currentPartner && gameState.currentPartner.username) {
                openTelegramChat(gameState.currentPartner.username);
            } else {
                showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
                closeChatModal();
            }
        });
    }
    
    // View stats button
    if (elements.viewStatsBtn) {
        elements.viewStatsBtn.addEventListener('click', () => {
            const stats = `
                Reyting: ${userState.rating}
                Matchlar: ${userState.matches}
                Duellar: ${userState.duels}
                G'alabalar: ${userState.wins}
                G'alaba %: ${userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0}%
                Total Like: ${userState.totalLikes}
                Coin: ${userState.coins}
                Level: ${userState.level}
                Kunlik Super Like: ${userState.dailySuperLikes}/3
            `;
            alert('Batafsil statistika:\n\n' + stats);
        });
    }
    
    // Kunlik vazifalarni ko'rsatish
    loadProfileQuests();
    loadShopItems();
    loadLeaderboard();
    loadFriendsList();
    
    console.log('✅ main.js to\'liq yuklandi - Barcha funksiyalar aktiv');
});

// ==================== GLOBAL FUNKSIYALAR ====================
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;
window.openTelegramChat = openTelegramChat;