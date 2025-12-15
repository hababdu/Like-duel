// main.js - TO'LIQ TAYYOR KOD

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
    currentGender: localStorage.getItem('userGender') || null,
    hasSelectedGender: localStorage.getItem('hasSelectedGender') === 'true',
    lastOpponent: null,
    dailySuperLikes: 3,
    coins: 100,
    level: 1,
    rating: 1500,
    matches: 0,
    duels: 0,
    wins: 0,
    totalLikes: 0,
    mutualLikes: 0
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    // Tablar va kontentlar
    tabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Ekranlar
    welcomeScreen: document.getElementById('welcomeScreen'),
    queueScreen: document.getElementById('queueScreen'),
    duelScreen: document.getElementById('duelScreen'),
    matchScreen: document.getElementById('matchScreen'),

    // Mening profilim
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    myLikes: document.getElementById('myLikes'),

    // Navbat ekrani
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    positionInfo: document.getElementById('positionInfo'),
    queueStatus: document.getElementById('queueStatus'),

    // Duel ekrani
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

    // Tugmalar
    startBtn: document.getElementById('startBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),

    // Match ekrani
    partnerName: document.getElementById('partnerName'),
    matchText: document.getElementById('matchText'),
    matchRewards: document.getElementById('matchRewards'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    newRating: document.getElementById('newRating'),
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

    // Statistika
    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    shopCoinsCount: document.getElementById('shopCoinsCount'),

    // Do'stlar ekrani
    friendsList: document.getElementById('friendsList'),
    friendRequestsSection: document.getElementById('friendRequestsSection'),
    friendRequestsList: document.getElementById('friendRequestsList'),
    friendRequestsCount: document.getElementById('friendRequestsCount'),
    friendsCount: document.getElementById('friendsCount'),
    onlineFriendsCount: document.getElementById('onlineFriendsCount'),
    mutualLikesBadge: document.getElementById('mutualLikesBadge'),
    mutualLikesCount: document.getElementById('mutualLikesCount'),

    // Do'kon ekrani
    shopItemsList: document.getElementById('shopItemsList'),

    // Liderlar ekrani
    leaderboardList: document.getElementById('leaderboardList'),
    leaderboardTabs: document.querySelectorAll('.leaderboard-tab'),
    leaderboardUpdated: document.getElementById('leaderboardUpdated'),

    // Vazifalar
    profileQuestsList: document.getElementById('profileQuestsList'),
    dailyQuestsList: document.getElementById('dailyQuestsList'),
    questsPreview: document.getElementById('questsPreview'),

    // Modallar
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
    saveProfileBtn: document.getElementById('saveProfileBtn'),

    // Gender tanlash tugmalari
    selectMaleBtn: document.getElementById('selectMaleBtn'),
    selectFemaleBtn: document.getElementById('selectFemaleBtn'),
    selectAllBtn: document.getElementById('selectAllBtn')
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
            console.log('✅ Telegram Web App aktiv');
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

    // Avatar va ismni o'rnatish
    elements.myAvatar.src = userPhoto;
    elements.myName.textContent = userName;
    elements.myUsername.textContent = userUsername;
    elements.profileAvatar.src = userPhoto;
    elements.profileName.textContent = userName;
    elements.profileUsername.textContent = userUsername;

    tgUserGlobal = tgUser;

    console.log('👤 Foydalanuvchi:', {
        id: tgUser.id,
        name: userName,
        gender: gameState.currentGender,
        hasSelectedGender: gameState.hasSelectedGender
    });

    // Agar gender tanlangan bo'lsa, UI ni yangilash
    if (gameState.hasSelectedGender && gameState.currentGender) {
        updateGenderUI(gameState.currentGender);
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
        elements.startBtn.classList.remove('disabled');
    } else {
        // Gender tanlanmagan bo'lsa
        elements.startBtn.disabled = true;
        elements.startBtn.textContent = 'Avval gender tanlang';
        elements.startBtn.classList.add('disabled');
        
        // 1 soniyadan keyin modalni ko'rsatish
        setTimeout(() => {
            if (!gameState.hasSelectedGender) {
                showGenderModal(true);
            }
        }, 1000);
    }

    return tgUser;
}

// ==================== GENDER UI YANGILASH ====================
function updateGenderUI(gender) {
    console.log('🎨 Gender UI yangilash:', gender);
    
    // Oldingi badge'larni tozalash
    document.querySelectorAll('.gender-badge').forEach(b => b.remove());
    
    // Yangi badge qo'shish
    addGenderBadge(elements.myName, gender);
    addGenderBadge(elements.profileName, gender);
    
    // Profil edit modalida gender qiymatini yangilash
    if (elements.editGender) {
        elements.editGender.value = gender;
    }
    
    // Queue statusni yangilash
    if (gender === 'male') {
        updateQueueStatus('Faqat ayollar bilan duel');
    } else if (gender === 'female') {
        updateQueueStatus('Faqat erkaklar bilan duel');
    } else {
        updateQueueStatus('Hamma bilan duel');
    }
}

function addGenderBadge(element, gender) {
    if (!element || !gender) return;
    
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
        console.error('❌ Foydalanuvchi ma\'lumotlari topilmadi');
        showNotification('Xato', 'Foydalanuvchi ma\'lumotlari topilmadi');
        return;
    }
    
    if (gameState.socket && gameState.isConnected) {
        console.log('ℹ️ Allaqachon serverga ulanilgan');
        return;
    }

    console.log('🔗 Serverga ulanmoqda...');
    updateQueueStatus('Serverga ulanmoqda...');

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

    // ==================== SOCKET EVENTLARI ====================
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
            photoUrl: tgUserGlobal.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUserGlobal.first_name || 'User')}&background=667eea&color=fff`,
            language: tgUserGlobal.language_code || 'uz',
            gender: gameState.currentGender,
            hasSelectedGender: gameState.hasSelectedGender
        });
    });

    gameState.socket.on('auth_ok', (data) => {
        console.log('✅ Autentifikatsiya muvaffaqiyatli:', data);
        gameState.playerData = data;
        
        // Gender holatini yangilash
        if (data.gender && data.hasSelectedGender) {
            gameState.currentGender = data.gender;
            gameState.hasSelectedGender = true;
            
            // LocalStorage ga saqlash
            localStorage.setItem('userGender', data.gender);
            localStorage.setItem('hasSelectedGender', 'true');
            
            // UI yangilash
            updateGenderUI(data.gender);
        }
        
        // Statistika yangilash
        updateStats(data);
        
        // Ekran ko'rsatish
        showScreen('queue');
        
        // Agar gender tanlangan bo'lsa, avtomatik navbatga kirish
        if (data.hasSelectedGender) {
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
        
        gameState.currentGender = data.gender;
        gameState.hasSelectedGender = true;
        
        // LocalStorage ga saqlash
        localStorage.setItem('userGender', data.gender);
        localStorage.setItem('hasSelectedGender', 'true');
        
        // UI yangilash
        updateGenderUI(data.gender);
        
        // Modalni yopish
        hideGenderModal();
        
        // Start tugmasini yoqish
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
        elements.startBtn.classList.remove('disabled');
        
        // Navbatga kirish
        if (gameState.socket && gameState.isConnected) {
            gameState.isInQueue = true;
            showScreen('queue');
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
        elements.waitingCount.textContent = data.count;
        if (data.position > 0) {
            elements.position.textContent = data.position;
            elements.positionInfo.style.display = 'block';
            updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.count}`);
        } else {
            elements.positionInfo.style.display = 'none';
            updateQueueStatus('Navbatda...');
        }
    });

    gameState.socket.on('queue_stats', (data) => {
        console.log('📊 Navbat statistikasi:', data);
    });

    gameState.socket.on('user_gender_updated', (data) => {
        console.log('🔄 Boshqa foydalanuvchi gender o\'zgartirdi:', data);
    });

    gameState.socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        showScreen('duel');

        // Oldingi ko'rsatkichlarni tozalash
        document.querySelectorAll('.met-again-indicator').forEach(el => el.remove());

        // Raqib ma'lumotlarini ko'rsatish
        elements.opponentAvatar.src = data.opponent.photo || 'https://ui-avatars.com/api/?name=O&background=764ba2&color=fff';
        elements.opponentName.innerHTML = data.opponent.name;
        elements.opponentUsername.textContent = data.opponent.username || '';
        elements.opponentRating.textContent = data.opponent.rating || 1500;
        elements.opponentMatches.textContent = data.opponent.matches || 0;
        elements.opponentLevel.textContent = data.opponent.level || 1;

        // Raqib genderini ko'rsatish
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
        
        // Tugmalarni qayta faollashtirish
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
            b.disabled = false;
            b.style.opacity = '1';
        });
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
        } else {
            elements.matchText.innerHTML = `<div style="font-size: 1.5rem;">🎉 MATCH!</div>Bir-biringizni yoqtirdingiz!`;
        }

        elements.rewardCoins.textContent = data.rewards.coins;
        elements.rewardXP.textContent = data.rewards.xp;
        elements.newRating.textContent = data.newRating;

        // Tugmalarni yaratish
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
            if (!elements.chatModal.classList.contains('active')) {
                returnToQueue();
            }
        }, 10000);
    });

    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '❤️';
        updateDuelStatus('Siz yoqtirdingiz, lekin raqib yoqtirmadi');
        
        if (data.reward) {
            showNotification('Like uchun mukofot', `+${data.reward.coins} coin, +${data.reward.xp} XP`);
            // Statistikani yangilash
            gameState.coins += data.reward.coins;
            elements.coinsCount.textContent = gameState.coins;
            elements.shopCoinsCount.textContent = gameState.coins;
        }
        
        setTimeout(() => {
            returnToQueue();
        }, 3000);
    });

    gameState.socket.on('no_match', () => {
        console.log('❌ Match bo\'lmadi');
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '✖';
        updateDuelStatus('Match bo\'lmadi. Yangi raqib izlanmoqda...');
        setTimeout(() => {
            returnToQueue();
        }, 3000);
    });

    gameState.socket.on('timeout', () => {
        console.log('⏰ Vaqt tugadi');
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '⏰';
        updateDuelStatus('Vaqt tugadi. Yangi raqib izlanmoqda...');
        setTimeout(() => {
            returnToQueue();
        }, 2000);
    });

    gameState.socket.on('return_to_queue', () => {
        console.log('🔄 Navbatga qaytish');
        returnToQueue();
    });

    gameState.socket.on('profile_updated', (data) => {
        console.log('📊 Profil yangilandi:', data);
        updateStats(data);
        
        // Agar gender o'zgartirilgan bo'lsa
        if (data.gender && data.gender !== gameState.currentGender) {
            gameState.currentGender = data.gender;
            updateGenderUI(data.gender);
            localStorage.setItem('userGender', data.gender);
        }
    });

    gameState.socket.on('super_like_used', (data) => {
        console.log('💖 Super like ishlatildi:', data);
        elements.superLikeCount.textContent = data.remaining;
        gameState.dailySuperLikes = data.remaining;
    });

    gameState.socket.on('daily_reset', (data) => {
        console.log('🔄 Kunlik limitlar yangilandi:', data);
        elements.superLikeCount.textContent = data.superLikes;
        gameState.dailySuperLikes = data.superLikes;
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

    gameState.socket.on('disconnect', () => {
        console.log('❌ Serverdan uzildi');
        gameState.isConnected = false;
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        updateQueueStatus('Serverdan uzildi. Qayta ulanmoqda...');
        
        // 3 soniyadan keyin qayta ulanish
        setTimeout(() => {
            if (!gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                connectToServer();
            }
        }, 3000);
    });
}

// ==================== STATISTIKANI YANGILASH ====================
function updateStats(data) {
    if (data.coins !== undefined) {
        gameState.coins = data.coins;
        elements.coinsCount.textContent = data.coins;
        elements.shopCoinsCount.textContent = data.coins;
    }
    if (data.level !== undefined) {
        gameState.level = data.level;
        elements.levelCount.textContent = data.level;
    }
    if (data.rating !== undefined) {
        gameState.rating = data.rating;
        elements.statRating.textContent = data.rating;
    }
    if (data.matches !== undefined) {
        gameState.matches = data.matches;
        elements.statMatches.textContent = data.matches;
        elements.myMatches.textContent = data.matches;
    }
    if (data.duels !== undefined) {
        gameState.duels = data.duels;
        elements.statDuels.textContent = data.duels;
    }
    if (data.wins !== undefined) {
        gameState.wins = data.wins;
        const winRate = data.duels > 0 ? Math.round((data.wins / data.duels) * 100) : 0;
        elements.statWinRate.textContent = winRate + '%';
    }
    if (data.totalLikes !== undefined) {
        gameState.totalLikes = data.totalLikes;
        elements.myLikes.textContent = data.totalLikes;
    }
    if (data.dailySuperLikes !== undefined) {
        gameState.dailySuperLikes = data.dailySuperLikes;
        elements.superLikeCount.textContent = data.dailySuperLikes;
    }
    if (data.bio !== undefined) {
        elements.profileBio.textContent = data.bio || 'Bio kiritilmagan';
    }
    if (data.mutualLikes !== undefined) {
        gameState.mutualLikes = data.mutualLikes;
        if (data.mutualLikes > 0) {
            elements.mutualLikesBadge.classList.remove('hidden');
            elements.mutualLikesCount.textContent = data.mutualLikes;
        }
    }
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    if (!gameState.socket || !gameState.isConnected) {
        console.log('⚠️ Socket ulanmagan, avval ulaymiz...');
        connectToServer();
        
        // Ulangandan keyin gender tanlash
        const handleConnection = () => {
            if (gameState.socket && gameState.isConnected) {
                gameState.socket.emit('select_gender', { gender: gender });
                gameState.socket.off('connect', handleConnection);
            }
        };
        gameState.socket.on('connect', handleConnection);
    } else {
        // Darrov gender tanlash
        gameState.socket.emit('select_gender', { gender: gender });
    }
    
    // UI ni darhol yangilash (server javobini kutmasdan)
    gameState.currentGender = gender;
    gameState.hasSelectedGender = true;
    updateGenderUI(gender);
    
    // Start tugmasini yoqish
    elements.startBtn.disabled = false;
    elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
    elements.startBtn.classList.remove('disabled');
    
    // LocalStorage ga saqlash
    localStorage.setItem('userGender', gender);
    localStorage.setItem('hasSelectedGender', 'true');
    
    // Modalni yopish
    hideGenderModal();
    
    // Navbatga kirish
    if (gameState.socket && gameState.isConnected) {
        gameState.isInQueue = true;
        showScreen('queue');
        gameState.socket.emit('enter_queue');
    }
    
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
}

// ==================== MODAL FUNKSIYALARI ====================
function showGenderModal(mandatory = true) {
    console.log(`🎯 Gender modali ko'rsatilmoqda (majburiy: ${mandatory})`);
    
    elements.genderModal.classList.add('active');
    
    if (mandatory) {
        elements.genderWarning.classList.remove('hidden');
        elements.startBtn.disabled = true;
        elements.startBtn.textContent = 'Avval gender tanlang';
        elements.startBtn.classList.add('disabled');
        
        // Modalni majburiy qilish
        elements.genderModal.style.pointerEvents = 'auto';
        const modalContent = elements.genderModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.background = '#fff5f5';
            modalContent.style.border = '2px solid #ff6b6b';
            modalContent.style.animation = 'pulseWarning 2s infinite';
        }
    }
}

function hideGenderModal() {
    elements.genderModal.classList.remove('active');
    elements.genderModal.style.pointerEvents = '';
    const modalContent = elements.genderModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.background = '';
        modalContent.style.border = '';
        modalContent.style.animation = '';
    }
}

function showRematchModal(name, id) {
    elements.rematchOpponentName.textContent = name;
    gameState.lastOpponent = id;
    elements.rematchModal.classList.add('active');
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
        b.disabled = true;
        b.style.opacity = '0.6';
    });

    // SUPER LIKE limit tekshirish
    if (choice === 'super_like' && gameState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
            b.disabled = false;
            b.style.opacity = '1';
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
        elements.timer.textContent = '❤️';
        updateDuelStatus('LIKE berdingiz...');
    } else if (choice === 'super_like') {
        elements.timer.textContent = '💖';
        updateDuelStatus('SUPER LIKE!');
        // Super like sonini yangilash
        gameState.dailySuperLikes--;
        elements.superLikeCount.textContent = gameState.dailySuperLikes;
    } else {
        elements.timer.textContent = '✖';
        updateDuelStatus('O\'tkazib yubordingiz...');
    }
}

// ==================== MATCH OPTIONLARI ====================
function handleMatchOption(action, userId) {
    console.log(`🎯 Match option: ${action}`, userId);
    
    if (action === 'open_chat') {
        openChatModal(gameState.currentPartner);
    } else if (action === 'rematch') {
        if (gameState.socket) {
            gameState.socket.emit('request_rematch', { opponentId: userId });
            showNotification('Qayta Duel', 'So\'rov yuborildi');
        }
        returnToQueue();
    } else if (action === 'skip') {
        returnToQueue();
    }
}

// ==================== CHAT FUNKSIYALARI ====================
function openChatModal(partner) {
    if (!partner) return;
    
    elements.chatPartnerAvatar.src = partner.photo || 'https://ui-avatars.com/api/?name=P&background=667eea&color=fff';
    elements.chatPartnerName.textContent = partner.name;
    elements.chatModal.classList.add('active');
    
    // Chat boshlanishi
    elements.chatMessages.innerHTML = `
        <div class="chat-message system">
            <div class="message-text">Chat boshlandi! Endi suhbatlashishingiz mumkin.</div>
            <div class="message-time">${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
}

function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // O'zimizning xabarimizni ko'rsatish
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message my-message';
    messageElement.innerHTML = `
        <div class="message-text">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    elements.chatMessages.appendChild(messageElement);
    elements.chatInput.value = '';
    
    // Scroll pastga
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    // Serverga yuborish (agar socket bo'lsa)
    if (gameState.socket && gameState.currentPartner) {
        gameState.socket.emit('chat_message', {
            to: gameState.currentPartner.id,
            message: message
        });
    }
}

// ==================== TIMER FUNKSIYASI ====================
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    elements.timer.textContent = 20;
    elements.timer.style.color = '#fff';
    elements.timer.style.animation = '';

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
                gameState.socket.emit('vote', { 
                    duelId: gameState.currentDuelId, 
                    choice: 'skip' 
                });
                elements.timer.textContent = '⏰';
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
    
    // Chat modali ochiq bo'lsa yopish
    if (elements.chatModal.classList.contains('active')) {
        elements.chatModal.classList.remove('active');
    }
    
    // Rematch modali ochiq bo'lsa yopish
    if (elements.rematchModal.classList.contains('active')) {
        elements.rematchModal.classList.remove('active');
    }
    
    showScreen('queue');
    updateQueueStatus('Yangi raqib izlanmoqda...');
    
    // Agar gender tanlagan bo'lsa, navbatga qayta kirish
    if (gameState.hasSelectedGender && gameState.socket && gameState.isConnected) {
        gameState.isInQueue = true;
        gameState.socket.emit('enter_queue');
    }
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
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
    
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
}

// ==================== STATUS YANGILASH ====================
function updateQueueStatus(msg) {
    if (elements.queueStatus) {
        elements.queueStatus.textContent = msg;
        elements.queueStatus.classList.add('queue-status-updating');
        setTimeout(() => {
            elements.queueStatus.classList.remove('queue-status-updating');
        }, 500);
    }
}

function updateDuelStatus(msg) {
    if (elements.duelStatus) {
        elements.duelStatus.textContent = msg;
    }
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

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Profilni yuklash
    initUserProfile();

    // Tab navigatsiyasi
    if (elements.tabs) {
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Faq tab'ni aktiv qilish
                elements.tabs.forEach(t => t.classList.remove('active'));
                elements.tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const tabId = tab.dataset.tab + 'Tab';
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
                
                console.log(`📱 Tab o'zgartirildi: ${tab.dataset.tab}`);
            });
        });
    }

    // O'yinni boshlash tugmasi
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', () => {
            console.log('🎮 Start tugmasi bosildi');
            
            if (!gameState.hasSelectedGender) {
                showGenderModal(true);
                showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
                return;
            }
            
            connectToServer();
        });
    }

    // Navbatdan chiqish tugmasi
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', () => {
            console.log('🚪 Navbatdan chiqish');
            
            if (gameState.socket && gameState.isInQueue) {
                gameState.socket.emit('leave_queue');
                gameState.isInQueue = false;
            }
            
            showScreen('welcome');
            showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
        });
    }

    // Ovoz berish tugmalari
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => handleVote('skip'));
        elements.noBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            elements.noBtn.style.transform = 'scale(0.95)';
        });
        elements.noBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            elements.noBtn.style.transform = '';
            handleVote('skip');
        });
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', () => handleVote('like'));
        elements.likeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            elements.likeBtn.style.transform = 'scale(0.95)';
        });
        elements.likeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            elements.likeBtn.style.transform = '';
            handleVote('like');
        });
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));
        elements.superLikeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            elements.superLikeBtn.style.transform = 'scale(0.95)';
        });
        elements.superLikeBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            elements.superLikeBtn.style.transform = '';
            handleVote('super_like');
        });
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

    // Gender modal tugmasi
    if (elements.selectGenderNowBtn) {
        elements.selectGenderNowBtn.addEventListener('click', () => showGenderModal(true));
    }

    // Qayta duel modali
    if (elements.acceptRematchBtn) {
        elements.acceptRematchBtn.addEventListener('click', () => {
            console.log('✅ Qayta duel qabul qilindi');
            
            if (gameState.socket && gameState.lastOpponent) {
                gameState.socket.emit('accept_rematch', { opponentId: gameState.lastOpponent });
            }
            
            elements.rematchModal.classList.remove('active');
            returnToQueue();
        });
    }
    
    if (elements.declineRematchBtn) {
        elements.declineRematchBtn.addEventListener('click', () => {
            console.log('❌ Qayta duel rad etildi');
            elements.rematchModal.classList.remove('active');
            returnToQueue();
        });
    }

    // Chat modali
    if (elements.closeChatBtn) {
        elements.closeChatBtn.addEventListener('click', () => {
            elements.chatModal.classList.remove('active');
            returnToQueue();
        });
    }
    
    if (elements.sendChatBtn) {
        elements.sendChatBtn.addEventListener('click', sendChatMessage);
    }
    
    if (elements.chatInput) {
        elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    // Profil tahrirlash
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', () => {
            console.log('✏️ Profil tahrirlash');
            
            elements.editBio.value = gameState.playerData?.bio || elements.profileBio.textContent || '';
            elements.editGender.value = gameState.currentGender || 'not_specified';
            elements.profileEditModal.classList.add('active');
        });
    }
    
    if (elements.closeProfileEditBtn) {
        elements.closeProfileEditBtn.addEventListener('click', () => {
            elements.profileEditModal.classList.remove('active');
        });
    }
    
    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.addEventListener('click', () => {
            const bio = elements.editBio.value.trim();
            const gender = elements.editGender.value;

            if (gender === 'not_specified') {
                if (!confirm('⚠️ Gender tanlanmasa, duel o\'ynay olmaysiz. Davom etishni xohlaysizmi?')) {
                    return;
                }
            }

            if (gameState.socket) {
                gameState.socket.emit('update_profile', { bio, gender });
                
                // UI ni darhol yangilash
                if (gender !== gameState.currentGender) {
                    gameState.currentGender = gender;
                    updateGenderUI(gender);
                    localStorage.setItem('userGender', gender);
                    
                    if (gender === 'not_specified') {
                        showNotification('Diqqat', 'Endi hamma bilan duel qilishingiz mumkin');
                    }
                }
                
                if (bio) {
                    elements.profileBio.textContent = bio;
                }
            }
            
            elements.profileEditModal.classList.remove('active');
            showNotification('✅ Profil yangilandi', 'O\'zgarishlar saqlandi');
        });
    }

    // Liderlar tablari
    if (elements.leaderboardTabs) {
        elements.leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.leaderboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loadLeaderboard(tab.dataset.leaderboard);
            });
        });
    }

    // Kunlik vazifalarni yuklash
    loadDailyQuests();
    
    // Do'kon elementlarini yuklash
    loadShopItems();
    
    // Liderlarni yuklash
    loadLeaderboard('rating');

    // Test rejimi - agar localhost bo'lsa
    if (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:') {
        console.log('🧪 Test rejimi aktiv');
        
        // 3 soniyadan keyin gender modalni ko'rsatish
        setTimeout(() => {
            if (!gameState.hasSelectedGender) {
                console.log('⚠️ Test rejimida gender modal ko\'rsatilmoqda');
                showGenderModal(true);
            } else {
                console.log('✅ Gender allaqachon tanlangan, start bosish mumkin');
            }
        }, 3000);
    }
});

// ==================== YORDAMCHI FUNKSIYALAR ====================
function loadDailyQuests() {
    const quests = [
        { id: 1, title: "3 ta duel", description: "3 ta duel o'ynang", progress: 0, target: 3, reward: "50 coin", icon: "⚔️" },
        { id: 2, title: "5 ta LIKE", description: "5 ta odamga LIKE bering", progress: 0, target: 5, reward: "75 coin", icon: "❤️" },
        { id: 3, title: "1 ta SUPER LIKE", description: "Kunlik SUPER LIKE ishlating", progress: 0, target: 1, reward: "30 coin", icon: "💖" }
    ];
    
    if (elements.profileQuestsList) {
        elements.profileQuestsList.innerHTML = quests.map(quest => `
            <div class="quest-item">
                <div class="quest-title">${quest.icon} ${quest.title}</div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-progress">
                    <span>${quest.progress}/${quest.target}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(quest.progress / quest.target) * 100}%"></div>
                    </div>
                    <span class="quest-reward">${quest.reward}</span>
                </div>
            </div>
        `).join('');
    }
    
    if (elements.questsPreview) {
        elements.questsPreview.innerHTML = quests.slice(0, 2).map(quest => `
            <div class="quest-preview-item">
                <div>${quest.icon} ${quest.title}</div>
                <div class="progress-bar small">
                    <div class="progress-fill" style="width: ${(quest.progress / quest.target) * 100}%"></div>
                </div>
            </div>
        `).join('');
        elements.questsPreview.style.display = 'block';
    }
}

function loadShopItems() {
    const items = [
        { id: 1, name: "Bronza Ramka", description: "Profil ramkasi", price: 100, icon: "🟤" },
        { id: 2, name: "3 ta SUPER LIKE", description: "Kunlik limitni oshirish", price: 300, icon: "💖" },
        { id: 3, name: "30 soniya Duel", description: "Vaqtni oshirish", price: 150, icon: "⏱️" },
        { id: 4, name: "VIP Profil", description: "1 kunlik VIP", price: 500, icon: "👑" }
    ];
    
    if (elements.shopItemsList) {
        elements.shopItemsList.innerHTML = items.map(item => `
            <div class="shop-item" onclick="buyItem(${item.id})">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-description">${item.description}</div>
                <div class="shop-item-price">
                    <i class="fas fa-coins"></i> ${item.price}
                </div>
            </div>
        `).join('');
    }
}

function loadLeaderboard(type = 'rating') {
    const leaderboardData = {
        rating: [
            { rank: 1, name: "Ali", value: 1850, photo: "https://ui-avatars.com/api/?name=Ali&background=667eea&color=fff" },
            { rank: 2, name: "Sara", value: 1720, photo: "https://ui-avatars.com/api/?name=Sara&background=f093fb&color=fff" },
            { rank: 3, name: "John", value: 1680, photo: "https://ui-avatars.com/api/?name=John&background=4facfe&color=fff" }
        ],
        matches: [
            { rank: 1, name: "Sara", value: 42, photo: "https://ui-avatars.com/api/?name=Sara&background=f093fb&color=fff" },
            { rank: 2, name: "Ali", value: 38, photo: "https://ui-avatars.com/api/?name=Ali&background=667eea&color=fff" },
            { rank: 3, name: "John", value: 35, photo: "https://ui-avatars.com/api/?name=John&background=4facfe&color=fff" }
        ],
        coins: [
            { rank: 1, name: "Ali", value: 1250, photo: "https://ui-avatars.com/api/?name=Ali&background=667eea&color=fff" },
            { rank: 2, name: "Sara", value: 980, photo: "https://ui-avatars.com/api/?name=Sara&background=f093fb&color=fff" },
            { rank: 3, name: "John", value: 750, photo: "https://ui-avatars.com/api/?name=John&background=4facfe&color=fff" }
        ]
    };
    
    if (elements.leaderboardList) {
        const data = leaderboardData[type] || leaderboardData.rating;
        const typeLabel = type === 'rating' ? 'Reyting' : type === 'matches' ? 'Matchlar' : 'Coinlar';
        
        elements.leaderboardList.innerHTML = data.map(player => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${player.rank}</div>
                <img src="${player.photo}" alt="${player.name}" class="leaderboard-avatar">
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${player.name}</div>
                    <div class="leaderboard-value">${typeLabel}: ${player.value}</div>
                </div>
            </div>
        `).join('');
        
        if (elements.leaderboardUpdated) {
            elements.leaderboardUpdated.textContent = new Date().toLocaleTimeString('uz-UZ', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
}

function buyItem(itemId) {
    showNotification('Do\'kon', 'Tez orada bu funksiya ishga tushadi!');
}

// ==================== GLOBAL FUNKSIYALAR ====================
window.selectGender = selectGender;
window.hideGenderModal = hideGenderModal;
window.buyItem = buyItem;

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
    
    .disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
    }
    
    .queue-status-updating {
        animation: blink 0.5s ease-in-out;
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
    
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    @keyframes pulseWarning {
        0%, 100% { 
            box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4);
        }
        50% { 
            box-shadow: 0 0 0 10px rgba(255, 68, 68, 0);
        }
    }
    
    .hidden {
        display: none !important;
    }
    
    /* Chat message styles */
    .chat-message {
        margin-bottom: 15px;
        padding: 10px 15px;
        border-radius: 15px;
        max-width: 80%;
        word-wrap: break-word;
    }
    
    .chat-message.system {
        background: #f0f0f0;
        color: #666;
        margin: 0 auto;
        text-align: center;
        max-width: 90%;
    }
    
    .chat-message.my-message {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        margin-left: auto;
        border-bottom-right-radius: 5px;
    }
    
    .chat-message.their-message {
        background: #f0f0f0;
        color: #333;
        margin-right: auto;
        border-bottom-left-radius: 5px;
    }
    
    .message-text {
        margin-bottom: 5px;
    }
    
    .message-time {
        font-size: 0.7rem;
        opacity: 0.7;
        text-align: right;
    }
`;

document.head.appendChild(style);

console.log('✅ main.js to\'liq yuklandi');