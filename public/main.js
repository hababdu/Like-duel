// main.js - TO'LIQ TAYYOR VERSIYA

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
    currentGender: null,
    hasSelectedGender: false,
    lastOpponent: null
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    tabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),

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
    superLikeIndicator: document.getElementById('superLikeIndicator'),
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

    friendsList: document.getElementById('friendsList'),
    friendRequestsSection: document.getElementById('friendRequestsSection'),
    friendRequestsList: document.getElementById('friendRequestsList'),
    friendRequestsCount: document.getElementById('friendRequestsCount'),
    friendsCount: document.getElementById('friendsCount'),
    onlineFriendsCount: document.getElementById('onlineFriendsCount'),
    mutualLikesBadge: document.getElementById('mutualLikesBadge'),
    mutualLikesCount: document.getElementById('mutualLikesCount'),

    shopItemsList: document.getElementById('shopItemsList'),
    leaderboardList: document.getElementById('leaderboardList'),
    leaderboardTabs: document.querySelectorAll('.leaderboard-tab'),
    leaderboardUpdated: document.getElementById('leaderboardUpdated'),

    profileQuestsList: document.getElementById('profileQuestsList'),
    dailyQuestsList: document.getElementById('dailyQuestsList'),
    questsPreview: document.getElementById('questsPreview'),

    chatModal: document.getElementById('chatModal'),
    chatPartnerAvatar: document.getElementById('chatPartnerAvatar'),
    chatPartnerName: document.getElementById('chatPartnerName'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    closeChatBtn: document.getElementById('closeChatBtn'),

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
    saveProfileBtn: document.getElementById('saveProfileBtn')
};

// ==================== GLOBAL USER ====================
let tgUserGlobal = null;

// ==================== PROFILNI YUKLASH ====================
function initUserProfile() {
    let tgUser = {};

    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            tgUser = Telegram.WebApp.initDataUnsafe.user || {};
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    } catch (error) {
        console.log('Telegram Web App mavjud emas');
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
    const userUsername = tgUser.username ? '@' + tgUser.username : '';

    elements.myAvatar.src = userPhoto;
    elements.myName.textContent = userName;
    elements.myUsername.textContent = userUsername;
    elements.profileAvatar.src = userPhoto;
    elements.profileName.textContent = userName;
    elements.profileUsername.textContent = userUsername;

    tgUserGlobal = tgUser;

    // localStorage dan gender yuklash
    const savedGender = localStorage.getItem('userGender');
    const savedHasSelected = localStorage.getItem('hasSelectedGender') === 'true';

    if (savedHasSelected && savedGender) {
        gameState.currentGender = savedGender;
        gameState.hasSelectedGender = true;
        addGenderBadge(elements.myName, savedGender);
        addGenderBadge(elements.profileName, savedGender);
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
    } else {
        // Gender tanlanmagan bo'lsa, modalni ko'rsatish
        setTimeout(() => {
            showGenderModal(true);
        }, 1000);
    }

    return tgUser;
}

// ==================== SERVERGA ULANISH ====================
function connectToServer() {
    if (!tgUserGlobal) return;
    if (gameState.socket && gameState.isConnected) return;

    console.log('Serverga ulanmoqda...');

    let socketUrl = 'http://localhost:3000';
    if (window.location.protocol !== 'file:' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        socketUrl = window.location.origin;
    }

    gameState.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
    });

    gameState.socket.on('connect', () => {
        console.log('✅ Serverga ulandi');
        gameState.isConnected = true;
        updateQueueStatus('Serverga ulandi...');

        // Autentifikatsiya
        gameState.socket.emit('auth', {
            userId: tgUserGlobal.id,
            firstName: tgUserGlobal.first_name,
            lastName: tgUserGlobal.last_name || '',
            username: tgUserGlobal.username,
            photoUrl: tgUserGlobal.photo_url,
            language: tgUserGlobal.language_code || 'uz'
        });
    });

    // ==================== SOCKET EVENTLAR ====================
    gameState.socket.on('auth_ok', (data) => {
        console.log('✅ Autentifikatsiya muvaffaqiyatli', data);
        gameState.playerData = data;
        gameState.currentGender = data.gender;
        gameState.hasSelectedGender = data.hasSelectedGender;

        // Statistika yangilash
        elements.coinsCount.textContent = data.coins || 100;
        elements.levelCount.textContent = data.level || 1;
        elements.shopCoinsCount.textContent = data.coins || 100;
        elements.statRating.textContent = data.rating || 1500;
        elements.statMatches.textContent = data.matches || 0;
        elements.statDuels.textContent = data.duels || 0;
        elements.statWinRate.textContent = data.winRate ? data.winRate + '%' : '0%';
        elements.myMatches.textContent = data.matches || 0;
        elements.myLikes.textContent = data.totalLikes || 0;
        elements.superLikeCount.textContent = data.dailySuperLikes ?? 3;
        elements.profileBio.textContent = data.bio || 'Bio kiritilmagan';

        // Gender badge qo'shish
        if (data.hasSelectedGender && data.gender) {
            addGenderBadge(elements.myName, data.gender);
            addGenderBadge(elements.profileName, data.gender);
            elements.startBtn.disabled = false;
            elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
        } else {
            // Gender tanlanmagan bo'lsa
            elements.startBtn.disabled = true;
            elements.startBtn.textContent = 'Avval gender tanlang';
        }

        // Mutual likes
        if (data.mutualLikes > 0) {
            elements.mutualLikesBadge.classList.remove('hidden');
            elements.mutualLikesCount.textContent = data.mutualLikes;
        }

        // Agar gender tanlangan bo'lsa, avtomatik navbatga kirish
        if (data.hasSelectedGender) {
            gameState.isInQueue = true;
            showScreen('queue');
            updateQueueStatus('Navbatda...');
            gameState.socket.emit('enter_queue');
        } else {
            // Gender tanlanmagan bo'lsa, modalni ko'rsatish
            showScreen('queue');
            updateQueueStatus('Gender tanlash kerak...');
            showGenderModal(true);
        }
    });

    gameState.socket.on('show_gender_selection', (data) => {
        console.log('⚠️ Gender tanlash so\'ralmoqda');
        showGenderModal(data.mandatory || true);
    });

    gameState.socket.on('gender_selected', (data) => {
        console.log('✅ Gender tanlandi:', data);
        
        gameState.currentGender = data.gender;
        gameState.hasSelectedGender = true;

        // LocalStorage ga saqlash
        localStorage.setItem('userGender', data.gender);
        localStorage.setItem('hasSelectedGender', 'true');

        // UI yangilash
        document.querySelectorAll('.gender-badge').forEach(b => b.remove());
        addGenderBadge(elements.myName, data.gender);
        addGenderBadge(elements.profileName, data.gender);

        elements.genderWarning.classList.add('hidden');
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';

        hideGenderModal();

        // Navbatga kirish
        if (gameState.socket && gameState.isConnected) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        }

        showNotification('Jins tanlandi', 
            data.gender === 'male' ? 'Faqat ayollar bilan duel' : 
            data.gender === 'female' ? 'Faqat erkaklar bilan duel' : 
            'Hamma bilan duel');
    });

    gameState.socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        showScreen('queue');
        updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}`);
    });

    gameState.socket.on('waiting_count', (data) => {
        elements.waitingCount.textContent = data.count;
        if (data.position > 0) {
            elements.position.textContent = data.position;
            elements.positionInfo.style.display = 'block';
            updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}`);
        } else {
            elements.positionInfo.style.display = 'none';
        }
    });

    gameState.socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        showScreen('duel');

        // Oldingi ko'rsatkichlarni tozalash
        document.querySelectorAll('.met-again-indicator, .previous-match-indicator').forEach(el => el.remove());

        // Raqib ma'lumotlarini ko'rsatish
        elements.opponentAvatar.src = data.opponent.photo || 'https://ui-avatars.com/api/?name=R&background=764ba2&color=fff';
        elements.opponentName.innerHTML = data.opponent.name;
        elements.opponentUsername.textContent = data.opponent.username || '';
        elements.opponentRating.textContent = data.opponent.rating || 1500;
        elements.opponentMatches.textContent = data.opponent.matches || 0;
        elements.opponentLevel.textContent = data.opponent.level || 1;

        // Gender badge qo'shish
        addGenderBadge(elements.opponentName, data.opponent.gender);

        // Avval uchrashganlik ko'rsatkichi
        if (data.hasMetBefore) {
            const indicator = document.createElement('div');
            indicator.className = 'met-again-indicator';
            let msg = 'Avval uchrashgansiz';
            if (data.previousResult === 'match') msg = 'Avval MATCH qilgansiz! 💖';
            else if (data.previousResult === 'liked_only') msg = 'Avval siz yoqtirgansiz ❤️';
            else if (data.previousResult === 'was_liked') msg = 'Avval u sizni yoqtirgan ❤️';
            indicator.innerHTML = `🔄 ${msg}`;
            elements.duelScreen.insertBefore(indicator, elements.duelScreen.firstChild);
        }

        startTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
    });

    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        clearInterval(gameState.timerInterval);
        showScreen('match');
        gameState.currentPartner = data.partner;
        gameState.lastOpponent = data.partner.id;
        elements.partnerName.textContent = data.partner.name;

        if (data.isRematch) {
            elements.matchText.innerHTML = `<div style="font-size: 1.5rem;">🎉 QAYTA MATCH!</div>Yana birga bo'ldingiz!`;
            const bonus = document.createElement('div');
            bonus.className = 'rematch-bonus';
            bonus.innerHTML = `<i class="fas fa-gift"></i> Qayta uchrashuv bonus: +20 coin, +15 XP`;
            elements.matchRewards.appendChild(bonus);
        }

        elements.rewardCoins.textContent = data.rewards.coins;
        elements.rewardXP.textContent = data.rewards.xp;
        elements.newRating.textContent = data.newRating;

        // Tugmalarni yaratish
        elements.matchOptions.innerHTML = '';
        const options = data.isRematch
            ? [{action: 'open_chat', label: '💬 Chatga o\'tish'}, {action: 'rematch', label: '🔄 Qayta duel'}, {action: 'skip', label: '➡️ O\'tkazish'}]
            : [{action: 'open_chat', label: '💬 Chatga o\'tish'}, {action: 'skip', label: '➡️ O\'tkazish'}];

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'match-option-btn';
            btn.innerHTML = opt.label;
            btn.onclick = () => handleMatchOption(opt.action, data.partner.id);
            if (opt.action === 'rematch') btn.style.background = '#9b59b6';
            elements.matchOptions.appendChild(btn);
        });

        // Konfetti
        if (typeof confetti === 'function') confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });

        // 5 soniyadan keyin avtomatik o'tkazish
        setTimeout(() => {
            if (!elements.chatModal.classList.contains('active')) {
                returnToQueue();
            }
        }, 5000);
    });

    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz');
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '❤️';
        updateDuelStatus('Siz yoqtirdingiz, lekin raqib yoqtirmadi');
        
        if (data.reward) {
            showNotification('Like uchun mukofot', `+${data.reward.coins} coin, +${data.reward.xp} XP`);
        }
        
        setTimeout(returnToQueue, 3000);
    });

    gameState.socket.on('no_match', () => {
        console.log('❌ Match bo\'lmadi');
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '✖';
        updateDuelStatus('Match bo\'lmadi. Yangi raqib izlanmoqda...');
        setTimeout(returnToQueue, 3000);
    });

    gameState.socket.on('timeout', () => {
        console.log('⏰ Vaqt tugadi');
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '⏰';
        updateDuelStatus('Vaqt tugadi. Yangi raqib izlanmoqda...');
        setTimeout(returnToQueue, 2000);
    });

    gameState.socket.on('return_to_queue', () => {
        console.log('🔄 Navbatga qaytish');
        returnToQueue();
    });

    gameState.socket.on('profile_updated', (data) => {
        console.log('📊 Profil yangilandi:', data);
        
        if (data.coins !== undefined) {
            elements.coinsCount.textContent = data.coins;
            elements.shopCoinsCount.textContent = data.coins;
        }
        if (data.level !== undefined) elements.levelCount.textContent = data.level;
        if (data.rating !== undefined) elements.statRating.textContent = data.rating;
        if (data.matches !== undefined) {
            elements.statMatches.textContent = data.matches;
            elements.myMatches.textContent = data.matches;
        }
        if (data.duels !== undefined) elements.statDuels.textContent = data.duels;
        if (data.winRate !== undefined) elements.statWinRate.textContent = data.winRate + '%';
        if (data.totalLikes !== undefined) elements.myLikes.textContent = data.totalLikes;
        if (data.dailySuperLikes !== undefined) elements.superLikeCount.textContent = data.dailySuperLikes;
        if (data.mutualLikes !== undefined && data.mutualLikes > 0) {
            elements.mutualLikesBadge.classList.remove('hidden');
            elements.mutualLikesCount.textContent = data.mutualLikes;
        }
    });

    gameState.socket.on('rematch_request', (data) => {
        console.log('🔄 Qayta duel so\'rovi:', data);
        showRematchModal(data.opponentName, data.opponentId);
    });

    gameState.socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        clearInterval(gameState.timerInterval);
        updateDuelStatus('Raqib chiqib ketdi. Yangi raqib izlanmoqda...');
        setTimeout(returnToQueue, 2000);
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
        updateQueueStatus('Serverdan uzildi. Qayta ulanmoqda...');
    });
}

// ==================== GENDER FUNKSIYALARI ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    if (!gameState.socket || !gameState.isConnected) {
        console.log('⚠️ Socket ulanmagan, avval ulanamiz...');
        connectToServer();
        
        // Socket ulangandan keyin gender tanlash
        const sendGender = () => {
            if (gameState.socket && gameState.socket.connected) {
                gameState.socket.emit('select_gender', { gender: gender });
                gameState.socket.off('connect', sendGender);
            }
        };
        gameState.socket.on('connect', sendGender);
    } else {
        // Socket ulangan bo'lsa, darrov tanlash
        gameState.socket.emit('select_gender', { gender: gender });
    }
}

function showGenderModal(mandatory = true) {
    console.log(`🎯 Gender modali ko'rsatilmoqda (majburiy: ${mandatory})`);
    
    elements.genderModal.classList.add('active');
    
    if (mandatory) {
        elements.genderWarning.classList.remove('hidden');
        elements.startBtn.disabled = true;
        elements.startBtn.textContent = 'Avval gender tanlang';
        
        // Modalni yopishni taqiqlash
        document.getElementById('genderModal').style.pointerEvents = 'auto';
        document.getElementById('genderModal').querySelector('.modal-content').style.background = '#ffebee';
    }
}

function hideGenderModal() {
    elements.genderModal.classList.remove('active');
}

function enforceGenderSelection() {
    if (gameState.hasSelectedGender) {
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
        return true;
    }

    showGenderModal(true);
    return false;
}

function addGenderBadge(element, gender) {
    if (!element || !gender || gender === 'not_specified') return;
    
    // Eski badge'ni olib tashlash
    const oldBadge = element.querySelector('.gender-badge');
    if (oldBadge) oldBadge.remove();

    // Yangi badge yaratish
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

// ==================== TIMER FUNKSIYASI ====================
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    elements.timer.textContent = 20;
    elements.timer.style.color = '#fff';

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        elements.timer.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 5) {
            elements.timer.style.color = '#ff4444';
            elements.timer.style.animation = 'pulse 1s infinite';
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            if (gameState.socket && gameState.isInDuel) {
                gameState.socket.emit('vote', { duelId: gameState.currentDuelId, choice: 'skip' });
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

    // Tugmalarni vaqtincha bloklash
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        b.disabled = true;
        b.style.opacity = '0.6';
    });

    // Ovozni serverga yuborish
    gameState.socket.emit('vote', { 
        duelId: gameState.currentDuelId, 
        choice: choice 
    });

    // UI yangilash
    if (choice === 'like') elements.timer.textContent = '❤️';
    else if (choice === 'super_like') {
        elements.timer.textContent = '💖';
        const count = parseInt(elements.superLikeCount.textContent);
        if (count > 0) elements.superLikeCount.textContent = count - 1;
    } else {
        elements.timer.textContent = '✖';
    }

    updateDuelStatus(
        choice === 'like' ? 'LIKE berdingiz...' : 
        choice === 'super_like' ? 'SUPER LIKE!' : 
        'O\'tkazib yubordingiz...'
    );

    // 1 soniyadan keyin blokni ochish
    setTimeout(() => {
        if (!elements.duelScreen.classList.contains('hidden')) {
            [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
                b.disabled = false;
                b.style.opacity = '1';
            });
        }
    }, 1000);
}

// ==================== MATCH OPTIONLARI ====================
function handleMatchOption(action, userId) {
    if (action === 'open_chat') {
        if (gameState.socket) {
            gameState.socket.emit('open_chat', { userId: userId });
        }
    } else if (action === 'rematch') {
        if (gameState.socket) {
            gameState.socket.emit('request_rematch', { opponentId: userId });
            showNotification('So‘rov yuborildi', 'Qayta duel so‘rovi yuborildi');
        }
        returnToQueue();
    } else if (action === 'skip') {
        returnToQueue();
    }
}

// ==================== QAYTA DUEL MODALI ====================
function showRematchModal(name, id) {
    elements.rematchOpponentName.textContent = name;
    gameState.lastOpponent = id;
    elements.rematchModal.classList.add('active');
}

// ==================== CHAT MODALI ====================
function openChatModal(partner) {
    elements.chatPartnerAvatar.src = partner.photo;
    elements.chatPartnerName.textContent = partner.name;
    elements.chatModal.classList.add('active');
}

// ==================== NOTIFIKATSIYA ====================
function showNotification(title, message) {
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('active');
    
    setTimeout(() => {
        elements.notification.classList.remove('active');
    }, 3000);
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    // Barcha ekranlarni yashirish
    [elements.welcomeScreen, elements.queueScreen, elements.duelScreen, elements.matchScreen]
        .forEach(s => s.classList.add('hidden'));

    // Kerakli ekranni ko'rsatish
    if (screen === 'welcome') elements.welcomeScreen.classList.remove('hidden');
    if (screen === 'queue') elements.queueScreen.classList.remove('hidden');
    if (screen === 'duel') elements.duelScreen.classList.remove('hidden');
    if (screen === 'match') elements.matchScreen.classList.remove('hidden');
}

// ==================== NAVBAT HOLATI ====================
function updateQueueStatus(msg) {
    elements.queueStatus.textContent = msg;
}

function updateDuelStatus(msg) {
    elements.duelStatus.textContent = msg;
}

// ==================== NAVBATGA QAYTISH ====================
function returnToQueue() {
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    
    showScreen('queue');
    updateQueueStatus('Yangi raqib izlanmoqda...');
    
    // Agar gender tanlagan bo'lsa, navbatga qayta kirish
    if (gameState.hasSelectedGender && gameState.socket) {
        gameState.isInQueue = true;
        gameState.socket.emit('enter_queue');
    }
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    // Profilni yuklash
    initUserProfile();

    // Tab navigatsiyasi
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Faq tab'ni aktiv qilish
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
        });
    });

    // O'yinni boshlash tugmasi
    elements.startBtn.addEventListener('click', () => {
        if (!enforceGenderSelection()) {
            showGenderModal(true);
            return;
        }
        
        connectToServer();
    });

    // Navbatdan chiqish
    elements.leaveQueueBtn.addEventListener('click', () => {
        if (gameState.socket) {
            gameState.socket.emit('leave_queue');
            gameState.isInQueue = false;
        }
        showScreen('welcome');
    });

    // Ovoz berish tugmalari
    elements.noBtn.addEventListener('click', () => handleVote('skip'));
    elements.likeBtn.addEventListener('click', () => handleVote('like'));
    elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));

    // Gender tanlash tugmalari
    document.getElementById('selectMaleBtn')?.addEventListener('click', () => {
        selectGender('male');
    });
    
    document.getElementById('selectFemaleBtn')?.addEventListener('click', () => {
        selectGender('female');
    });
    
    document.getElementById('selectAllBtn')?.addEventListener('click', () => {
        selectGender('not_specified');
    });

    // Gender tanlash modali
    elements.selectGenderNowBtn?.addEventListener('click', () => {
        showGenderModal(true);
    });

    // Qayta duel modali
    elements.acceptRematchBtn.addEventListener('click', () => {
        if (gameState.socket && gameState.lastOpponent) {
            gameState.socket.emit('accept_rematch', { opponentId: gameState.lastOpponent });
        }
        elements.rematchModal.classList.remove('active');
    });

    elements.declineRematchBtn.addEventListener('click', () => {
        elements.rematchModal.classList.remove('active');
    });

    // Chat modali
    elements.closeChatBtn.addEventListener('click', () => {
        elements.chatModal.classList.remove('active');
        returnToQueue();
    });

    // Profil tahrirlash
    elements.editProfileBtn.addEventListener('click', () => {
        elements.editBio.value = gameState.playerData?.bio || '';
        elements.editGender.value = gameState.currentGender || 'not_specified';
        elements.profileEditModal.classList.add('active');
    });

    elements.closeProfileEditBtn.addEventListener('click', () => {
        elements.profileEditModal.classList.remove('active');
    });

    elements.saveProfileBtn.addEventListener('click', () => {
        const bio = elements.editBio.value.trim();
        const gender = elements.editGender.value;

        if (gender === 'not_specified' && !confirm('Gender tanlanmasa, duel o\'ynay olmaysiz. Davom etishni xohlaysizmi?')) {
            return;
        }

        if (gameState.socket) {
            gameState.socket.emit('update_profile', { bio, gender });
        }
        
        elements.profileEditModal.classList.remove('active');
        showNotification('Profil yangilandi', 'O\'zgarishlar saqlandi');
    });

    // Mobile touch events
    ['touchstart', 'touchend'].forEach(ev => {
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(btn => {
            if (!btn) return;
            btn.addEventListener(ev, e => {
                e.preventDefault();
                if (ev === 'touchstart') {
                    btn.style.transform = 'scale(0.95)';
                } else {
                    btn.style.transform = '';
                    btn.click();
                }
            });
        });
    });

    // Test rejimi
    if (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:') {
        console.log('🧪 Test rejimi aktiv');
        // setTimeout(() => elements.startBtn.click(), 1000);
    }
});

// ==================== CSS STYLE QO'SHISH ====================
const style = document.createElement('style');
style.textContent = `
    .gender-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 0.7rem;
        margin-left: 8px;
        color: white;
        font-weight: bold;
        vertical-align: middle;
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
        padding: 8px 15px;
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
    
    .mutual-likes-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
    
    .hidden {
        display: none !important;
    }
`;

document.head.appendChild(style);