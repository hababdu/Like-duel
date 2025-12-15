// main.js - Render.com uchun maxsus optimallashtirilgan

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
    maxReconnectAttempts: 5
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
    dailySuperLikes: parseInt(localStorage.getItem('userDailySuperLikes')) || 3
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    queueScreen: document.getElementById('queueScreen'),
    duelScreen: document.getElementById('duelScreen'),
    matchScreen: document.getElementById('matchScreen'),
    
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    myLikes: document.getElementById('myLikes'),
    
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    positionInfo: document.getElementById('positionInfo'),
    queueStatus: document.getElementById('queueStatus'),
    
    opponentAvatar: document.getElementById('opponentAvatar'),
    opponentName: document.getElementById('opponentName'),
    opponentUsername: document.getElementById('opponentUsername'),
    opponentRating: document.getElementById('opponentRating'),
    opponentMatches: document.getElementById('opponentMatches'),
    opponentLevel: document.getElementById('opponentLevel'),
    timer: document.getElementById('timer'),
    duelStatus: document.getElementById('duelStatus'),
    superLikeCount: document.getElementById('superLikeCount'),
    
    startBtn: document.getElementById('startBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    
    partnerName: document.getElementById('partnerName'),
    matchText: document.getElementById('matchText'),
    matchRewards: document.getElementById('matchRewards'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    newRating: document.getElementById('newRating'),
    matchOptions: document.getElementById('matchOptions'),
    
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileBio: document.getElementById('profileBio'),
    statRating: document.getElementById('statRating'),
    statMatches: document.getElementById('statMatches'),
    statDuels: document.getElementById('statDuels'),
    statWinRate: document.getElementById('statWinRate'),
    
    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    shopCoinsCount: document.getElementById('shopCoinsCount'),
    
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    
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
    
    selectMaleBtn: document.getElementById('selectMaleBtn'),
    selectFemaleBtn: document.getElementById('selectFemaleBtn'),
    selectAllBtn: document.getElementById('selectAllBtn')
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
        badge.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    } else if (gender === 'female') {
        badge.innerHTML = '<i class="fas fa-venus"></i> Ayol';
        badge.style.background = 'linear-gradient(135deg, #f093fb, #f5576c)';
    } else {
        badge.innerHTML = '<i class="fas fa-users"></i> Hammasi';
        badge.style.background = 'linear-gradient(135deg, #4facfe, #00f2fe)';
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
    
    // ========== MUHIM: Render.com uchun Socket URL ==========
    // Agar localhost da ishlayotgan bo'lsangiz, localhost ga ulaning
    // Agar Render.com da ishlayotgan bo'lsangiz, Render URL ga ulaning
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
    
    let socketUrl;
    
    if (isLocalhost) {
        // Local development uchun
        socketUrl = 'http://localhost:3000';
        console.log('📍 Local development rejimi');
    } else {
        // Render.com production uchun
        socketUrl = 'https://like-duel.onrender.com';
        console.log('📍 Production (Render.com) rejimi');
    }
    
    console.log('🔌 Socket URL:', socketUrl);
    
    // Socket.IO ulanishini yaratish
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
        
        // Autentifikatsiya
        gameState.socket.emit('auth', {
            userId: tgUserGlobal.id,
            firstName: tgUserGlobal.first_name,
            lastName: tgUserGlobal.last_name || '',
            username: tgUserGlobal.username,
            photoUrl: tgUserGlobal.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUserGlobal.first_name || 'User')}&background=667eea&color=fff`,
            language: tgUserGlobal.language_code || 'uz',
            gender: userState.currentGender,
            hasSelectedGender: userState.hasSelectedGender
        });
        
        showNotification('✅ Ulanish', 'Serverga muvaffaqiyatli ulandik');
    });
    
    gameState.socket.on('auth_ok', (data) => {
        console.log('✅ Autentifikatsiya muvaffaqiyatli:', data);
        
        // UserState yangilash
        if (data.gender) userState.currentGender = data.gender;
        if (data.hasSelectedGender !== undefined) userState.hasSelectedGender = data.hasSelectedGender;
        if (data.coins) userState.coins = data.coins;
        if (data.level) userState.level = data.level;
        if (data.rating) userState.rating = data.rating;
        if (data.matches) userState.matches = data.matches;
        if (data.duels) userState.duels = data.duels;
        if (data.wins) userState.wins = data.wins;
        if (data.totalLikes) userState.totalLikes = data.totalLikes;
        if (data.dailySuperLikes) userState.dailySuperLikes = data.dailySuperLikes;
        
        // LocalStorage ga saqlash
        saveUserStateToLocalStorage();
        
        // UI yangilash
        updateUIFromUserState();
        
        // Ekran ko'rsatish
        showScreen('queue');
        
        // Agar gender tanlangan bo'lsa, avtomatik navbatga kirish
        if (userState.hasSelectedGender) {
            console.log('🚀 Gender tanlangan, navbatga kirilmoqda...');
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        } else {
            // Gender tanlanmagan bo'lsa, modalni ko'rsatish
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
        
        // UserState yangilash
        userState.currentGender = data.gender;
        userState.hasSelectedGender = true;
        
        // LocalStorage ga saqlash
        saveUserStateToLocalStorage();
        
        // UI yangilash
        updateUIFromUserState();
        
        // Modalni yopish
        hideGenderModal();
        
        // Navbatga kirish
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
        
        // Raqib ma'lumotlarini ko'rsatish
        if (elements.opponentAvatar) elements.opponentAvatar.src = data.opponent.photo || 'https://ui-avatars.com/api/?name=O&background=764ba2&color=fff';
        if (elements.opponentName) elements.opponentName.innerHTML = data.opponent.name;
        if (elements.opponentUsername) elements.opponentUsername.textContent = data.opponent.username || '';
        if (elements.opponentRating) elements.opponentRating.textContent = data.opponent.rating || 1500;
        if (elements.opponentMatches) elements.opponentMatches.textContent = data.opponent.matches || 0;
        if (elements.opponentLevel) elements.opponentLevel.textContent = data.opponent.level || 1;
        
        // Raqib genderini ko'rsatish
        addGenderBadge(elements.opponentName, data.opponent.gender);
        
        startTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
        
        // Tugmalarni qayta faollashtirish
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
        returnToQueue();
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
        
        // 5 soniyadan keyin qayta ulanish
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
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    // UserState yangilash
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    
    // LocalStorage ga saqlash
    saveUserStateToLocalStorage();
    
    // UI yangilash
    updateUIFromUserState();
    
    // Modalni yopish
    hideGenderModal();
    
    // Agar socket ulangan bo'lsa, serverga bildirish
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { gender: gender });
    } else {
        // Socket ulanmagan bo'lsa, serverga ulanish
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
    
    // Tugmalarni bloklash
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
        }
    });
    
    // SUPER LIKE limit tekshirish
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
    
    // UI yangilash
    clearInterval(gameState.timerInterval);
    if (choice === 'like') {
        if (elements.timer) elements.timer.textContent = '❤️';
        updateDuelStatus('LIKE berdingiz...');
    } else if (choice === 'super_like') {
        if (elements.timer) elements.timer.textContent = '💖';
        updateDuelStatus('SUPER LIKE!');
        // Super like sonini yangilash
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
    
    // Mukofotlarni userState ga qo'shish
    userState.coins += data.rewards.coins;
    userState.rating = data.newRating;
    userState.matches++;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    // Tugmalarni yaratish
    if (elements.matchOptions) {
        elements.matchOptions.innerHTML = '';
        const options = [
            {action: 'open_chat', label: '💬 Chatga o\'tish'},
            {action: 'skip', label: '➡️ O\'tkazish'}
        ];
        
        if (data.isRematch) {
            options.splice(1, 0, {action: 'rematch', label: '🔄 Qayta duel'});
        }
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'match-option-btn';
            btn.innerHTML = opt.label;
            btn.onclick = () => handleMatchOption(opt.action, data.partner.id);
            if (opt.action === 'rematch') btn.style.background = '#9b59b6';
            elements.matchOptions.appendChild(btn);
        });
    }
    
    // Konfetti
    if (typeof confetti === 'function') {
        confetti({ 
            particleCount: 300, 
            spread: 100, 
            origin: { y: 0.6 } 
        });
    }
    
    // 10 soniyadan keyin avtomatik o'tkazish
    setTimeout(() => {
        if (elements.chatModal && !elements.chatModal.classList.contains('active')) {
            returnToQueue();
        }
    }, 10000);
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

// ==================== NAVBATGA QAYTISH ====================
function returnToQueue() {
    console.log('🔄 Navbatga qaytish funksiyasi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = null;
    
    // Modallarni yopish
    if (elements.chatModal && elements.chatModal.classList.contains('active')) {
        elements.chatModal.classList.remove('active');
    }
    if (elements.rematchModal && elements.rematchModal.classList.contains('active')) {
        elements.rematchModal.classList.remove('active');
    }
    
    showScreen('queue');
    updateQueueStatus('Yangi raqib izlanmoqda...');
    
    // Agar gender tanlagan bo'lsa, navbatga qayta kirish
    if (userState.hasSelectedGender && gameState.socket && gameState.isConnected) {
        gameState.isInQueue = true;
        gameState.socket.emit('enter_queue');
    }
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
    
    // Barcha ekranlarni yashirish
    [elements.welcomeScreen, elements.queueScreen, elements.duelScreen, elements.matchScreen]
        .forEach(s => {
            if (s) s.classList.add('hidden');
        });
    
    // Kerakli ekranni ko'rsatish
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
    
    // GameState ni tozalash
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    clearInterval(gameState.timerInterval);
    
    // Welcome ekraniga qaytish
    showScreen('welcome');
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Profilni yuklash
    initUserProfile();
    
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
            if (elements.editBio) elements.editBio.value = elements.profileBio?.textContent || '';
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
                
                if (gender !== userState.currentGender) {
                    userState.currentGender = gender;
                    userState.hasSelectedGender = true;
                    saveUserStateToLocalStorage();
                    updateUIFromUserState();
                }
                
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
    
    // Test rejimi
    if (['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:') {
        console.log('🧪 Test rejimi aktiv');
    }
});

// ==================== GLOBAL FUNKSIYALAR ====================
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;

// ==================== CSS STYLE QO'SHISH ====================
const style = document.createElement('style');
style.textContent = `
    .gender-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        margin-left: 10px;
        color: white;
        font-weight: bold;
        vertical-align: middle;
        animation: badgeAppear 0.5s ease-out;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    }
    
    .gender-male-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
    }
    
    .gender-female-badge {
        background: linear-gradient(135deg, #f093fb, #f5576c);
    }
    
    .gender-not_specified-badge {
        background: linear-gradient(135deg, #4facfe, #00f2fe);
    }
    
    .met-again-indicator {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 10px 15px;
        border-radius: 10px;
        margin-bottom: 15px;
        text-align: center;
        font-weight: bold;
        animation: pulse 2s infinite;
    }
    
    .rematch-bonus {
        background: linear-gradient(135deg, #f093fb, #f5576c);
        color: white;
        padding: 10px;
        border-radius: 10px;
        margin-top: 10px;
        text-align: center;
        font-weight: bold;
    }
    
    .disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
    }
    
    .hidden {
        display: none !important;
    }
    
    @keyframes badgeAppear {
        0% {
            opacity: 0;
            transform: scale(0.8) translateY(-10px);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;

document.head.appendChild(style);

console.log('✅ main.js to\'liq yuklandi - Render.com optimallashtirildi');