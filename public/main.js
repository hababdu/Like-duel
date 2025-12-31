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
    currentFilter: localStorage.getItem('userFilter') || 'not_specified',
    mutualMatches: [],
    friendsList: [],
    waitingForOpponent: false,
    matchCompleted: false // Yangi flag
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
    friendsCount: parseInt(localStorage.getItem('friendsCount')) || 0
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
    
    // Navbat elementlari
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    positionInfo: document.getElementById('positionInfo'),
    queueStatus: document.getElementById('queueStatus'),
    genderFilterContainer: document.getElementById('genderFilterContainer'),
    
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
    refreshFriendsBtn: document.getElementById('refreshFriendsBtn'),
    
    // Match elementlari
    partnerName: document.getElementById('partnerName'),
    matchText: document.getElementById('matchText'),
    matchRewards: document.getElementById('matchRewards'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
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
    mutualMatchesProfile: document.getElementById('mutualMatchesProfile'),
    statFriends: document.getElementById('statFriends'),
    
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
    editFilter: document.getElementById('editFilter'),
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
    chatTitle: document.getElementById('chatTitle'),
    
    // Do'stlar tab elementlari
    friendsList: document.getElementById('friendsList'),
    friendsCount: document.getElementById('friendsCount'),
    onlineFriendsCount: document.getElementById('onlineFriendsCount'),
    noFriends: document.getElementById('noFriends'),
    
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
    
    // Gender filter qo'shish
    addFilterToWelcomeScreen();
    
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
    if (elements.mutualMatchesCount) elements.mutualMatchesCount.textContent = userState.mutualMatchesCount;
    if (elements.mutualMatchesProfile) elements.mutualMatchesProfile.textContent = userState.mutualMatchesCount;
    if (elements.statFriends) elements.statFriends.textContent = userState.friendsCount;
    
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

// ==================== FILTER FUNKSIYALARI ====================
function createFilterOptions() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'gender-filter-container';
    filterContainer.innerHTML = `
        <div class="gender-filter-title">Kim bilan duel qilmoqchisiz?</div>
        <div class="gender-filter-options">
            <div class="gender-filter-option ${gameState.currentFilter === 'male' ? 'active' : ''}" data-filter="male">
                <div class="gender-filter-icon male">
                    <i class="fas fa-mars"></i>
                </div>
               
            </div>
            
            <div class="gender-filter-option ${gameState.currentFilter === 'female' ? 'active' : ''}" data-filter="female">
                <div class="gender-filter-icon female">
                    <i class="fas fa-venus"></i>
                </div>
               
            </div>
            
            <div class="gender-filter-option ${gameState.currentFilter === 'not_specified' ? 'active' : ''}" data-filter="not_specified">
                <div class="gender-filter-icon all">
                    <i class="fas fa-users"></i>
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
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('update_profile', { filter: filter });
        
        if (gameState.isInQueue) {
            gameState.socket.emit('leave_queue');
            setTimeout(() => {
                gameState.socket.emit('enter_queue');
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
            filter: userState.filter
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
        userState.mutualMatchesCount = data.mutualMatchesCount || userState.mutualMatchesCount;
        userState.friendsCount = data.friendsCount || userState.friendsCount;
        
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
        gameState.waitingForOpponent = false;
        gameState.matchCompleted = false; // Match tugamagan
        gameState.currentDuelId = data.duelId;
        showScreen('duel');
        
        // Oldingi taymerlarni to'xtatamiz
        clearInterval(gameState.timerInterval);
        
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
        
        // 20 soniyalik taymerni boshlaymiz
        startTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
        
        // Tugmalarni yoqamiz va reset qilamiz
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
            }
        });
        
        if (elements.noBtn) {
            elements.noBtn.textContent = '✖';
            elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        }
    });
    
    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        gameState.matchCompleted = true; // Match tugadi
        handleMatch(data);
    });
    
    gameState.socket.on('mutual_match', (data) => {
        console.log('🤝 O\'zaro Match qo\'shildi:', data);
        
        userState.mutualMatchesCount = data.mutualMatchesCount;
        userState.friendsCount = data.friendsCount;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification('🎉 DO\'ST BO\'LDINGIZ!', 
            `${data.partnerName} bilan o'zaro match! Endi siz bir-biringizning do'stlaringiz ro'yxatidasiz.`);
    });
    
    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        gameState.matchCompleted = true; // Match tugadi
        handleLikedOnly(data);
    });
    
    gameState.socket.on('no_match', (data) => {
        console.log('❌ Match bo\'lmadi');
        gameState.matchCompleted = true; // Match tugadi
        handleNoMatch(data);
    });
    
    gameState.socket.on('timeout', (data) => {
        console.log('⏰ Vaqt tugadi');
        gameState.matchCompleted = true; // Match tugadi
        handleTimeout(data);
    });
    
    gameState.socket.on('waiting_response', (data) => {
        console.log('⏳ Raqib javobini kutish:', data);
        handleWaitingResponse(data);
    });
    
    gameState.socket.on('friends_list', (data) => {
        console.log('👥 Dostlar royxati:', data);
        gameState.friendsList = data.friends;
        updateFriendsListUI(data);
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
    
    gameState.socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        clearInterval(gameState.timerInterval);
        updateDuelStatus('Raqib chiqib ketdi. Keyingi duelga tayyormisiz?');
        
        // Faqat bosh menyuga qaytish yoki keyingi duel tugmalari
        showOpponentLeftModal();
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
    localStorage.setItem('userFilter', userState.filter.toString());
    localStorage.setItem('mutualMatchesCount', userState.mutualMatchesCount.toString());
    localStorage.setItem('friendsCount', userState.friendsCount.toString());
}

// ==================== OVOZ BERISH ====================
function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }
    
    console.log(`🗳️ Ovoz berish: ${choice}`);
    
    // Tugmalarni vaqtincha disable qilamiz
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
    
    // Serverga ovozni yuboramiz
    gameState.socket.emit('vote', { 
        duelId: gameState.currentDuelId, 
        choice: choice 
    });
    
    // Taymerni to'xtatamiz
    clearInterval(gameState.timerInterval);
    
    // UI yangilash
    if (choice === 'like') {
        if (elements.timer) elements.timer.textContent = '❤️';
        updateDuelStatus('LIKE berdingiz. Raqib javobini kutish...');
    } else if (choice === 'super_like') {
        if (elements.timer) elements.timer.textContent = '💖';
        updateDuelStatus('SUPER LIKE! Raqib javobini kutish...');
        userState.dailySuperLikes--;
        if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
        saveUserStateToLocalStorage();
    } else {
        if (elements.timer) elements.timer.textContent = '✖';
        updateDuelStatus('O\'tkazib yubordingiz...');
        // O'tkazib yuborilganda, faqat keyingi duel yoki bosh menyuga qaytish imkoniyati
        gameState.matchCompleted = true;
        showNoMatchOptions();
    }
}

// ==================== KUTISH HOLATI ====================
function handleWaitingResponse(data) {
    console.log('⏳ Raqib javobini kutish...');
    
    clearInterval(gameState.timerInterval);
    gameState.waitingForOpponent = true;
    
    // 2 daqiqa (120 soniya) kutish taymerini boshlaymiz
    gameState.timeLeft = 120;
    
    if (elements.timer) {
        elements.timer.textContent = '2:00';
        elements.timer.style.color = '#ff9500';
        elements.timer.style.animation = 'pulse 2s infinite';
    }
    
    updateDuelStatus('⏳ Raqib javobini kutish... (2 daqiqa)');
    
    // Like/Super Like tugmalarini disable qilamiz
    if (elements.likeBtn) {
        elements.likeBtn.disabled = true;
        elements.likeBtn.style.opacity = '0.5';
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.disabled = true;
        elements.superLikeBtn.style.opacity = '0.5';
    }
    
    // O'tkazib yuborish tugmasini yoqamiz va matnini o'zgartiramiz
    if (elements.noBtn) {
        elements.noBtn.disabled = false;
        elements.noBtn.style.opacity = '1';
        elements.noBtn.textContent = '⏭️ Keyingisi';
        elements.noBtn.style.background = 'linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%)';
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        
        if (elements.timer) {
            elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (gameState.timeLeft <= 30) {
            if (elements.timer) {
                elements.timer.style.color = '#ff4444';
                elements.timer.style.animation = 'pulse 0.5s infinite';
            }
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            handleOpponentTimeout();
        }
    }, 1000);
}

function handleOpponentTimeout() {
    console.log('⏰ Raqib javob bermadi');
    
    if (elements.timer) {
        elements.timer.textContent = '⏰';
    }
    
    updateDuelStatus('Raqib javob bermadi. O\'yinni tugatish?');
    
    // Tugmalarni qayta yoqamiz
    if (elements.noBtn) {
        elements.noBtn.disabled = false;
        elements.noBtn.style.opacity = '1';
        elements.noBtn.textContent = '❌ O\'yinni tugatish';
        elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    }
    
    // O'yinni tugatish modalini ko'rsatish
    showOpponentTimeoutModal();
}

function showOpponentTimeoutModal() {
    const modalHTML = `
        <div class="modal active" id="timeoutModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">⏰ Raqib javob bermadi</h3>
                </div>
                <div class="modal-body">
                    <p style="color: #ccc;">Raqibingiz 2 daqiqa ichida javob bermadi. O'yinni tugatishni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Keyingi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    // Modalni qo'shamiz
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = modalHTML;
}

function showOpponentLeftModal() {
    const modalHTML = `
        <div class="modal active" id="opponentLeftModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">🚪 Raqib chiqib ketdi</h3>
                </div>
                <div class="modal-body">
                    <p style="color: #ccc;">Raqibingiz duel davomida chiqib ketdi. Keyingi duelga o'tishni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Keyingi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = modalHTML;
}

function showNoMatchOptions() {
    const modalHTML = `
        <div class="modal active" id="noMatchModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">❌ Match bo'lmadi</h3>
                </div>
                <div class="modal-body">
                    <p style="color: #ccc;">Sizning ovozingiz: ✖</p>
                    <p style="color: #ccc;">Keyingi duelga o'tishni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Keyingi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = modalHTML;
}

function hideTimeoutModal() {
    const modal = document.getElementById('timeoutModal');
    if (modal) {
        modal.remove();
    }
    
    const opponentModal = document.getElementById('opponentLeftModal');
    if (opponentModal) {
        opponentModal.remove();
    }
    
    const noMatchModal = document.getElementById('noMatchModal');
    if (noMatchModal) {
        noMatchModal.remove();
    }
}

// ==================== MATCH HANDLERS ====================
function handleMatch(data) {
    console.log('🎉 MATCH!', data);
    
    // Barcha taymerlarni to'xtatamiz
    clearInterval(gameState.timerInterval);
    
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = data.partner;
    gameState.lastOpponent = data.partner.id;
    gameState.waitingForOpponent = false;
    
    showScreen('match');
    
    if (elements.partnerName) elements.partnerName.textContent = data.partner.name;
    
    if (data.isMutual) {
        if (elements.matchText) elements.matchText.innerHTML = `<div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold;">🎉 O'ZARO MATCH!</div><div style="margin-top: 10px; color: #fff;">Endi siz do'st bo'ldingiz!</div>`;
    } else {
        if (elements.matchText) elements.matchText.innerHTML = `<div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold;">🎉 MATCH!</div><div style="margin-top: 10px; color: #fff;">Bir-biringizni yoqtirdingiz!</div>`;
    }
    
    if (elements.rewardCoins) elements.rewardCoins.textContent = data.rewards.coins;
    if (elements.rewardXP) elements.rewardXP.textContent = data.rewards.xp;
    
    userState.coins += data.rewards.coins;
    userState.rating = data.newRating;
    userState.matches++;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    // Match option tugmalarini ko'rsatish
    if (elements.matchOptions) {
        elements.matchOptions.innerHTML = '';
        
        const options = [
            {action: 'open_chat', label: '💬 Chatga o\'tish', style: 'background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);'},
            {action: 'skip_to_next', label: '➡️ Yangi duel', style: 'background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);'},
            {action: 'return_to_menu', label: '🏠 Bosh menyu', style: 'background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);'}
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
    
    // Confetti efekti
    if (typeof confetti === 'function') {
        confetti({ 
            particleCount: 300, 
            spread: 100, 
            origin: { y: 0.6 } 
        });
        
        if (data.isMutual) {
            setTimeout(() => {
                confetti({ 
                    particleCount: 200,
                    angle: 60,
                    spread: 80,
                    origin: { x: 0, y: 0.6 }
                });
                confetti({ 
                    particleCount: 200,
                    angle: 120,
                    spread: 80,
                    origin: { x: 1, y: 0.6 }
                });
            }, 300);
        }
    }
}

function handleMatchOption(action, partner) {
    console.log(`Match option: ${action} for partner:`, partner);
    
    switch(action) {
        case 'open_chat':
            openChat(partner);
            // Chat ochilganda, avtomatik navbatga o'tmaslik uchun return qilamiz
            return;
        case 'skip_to_next':
            skipToNextDuel();
            break;
        case 'return_to_menu':
            returnToMenu();
            break;
        default:
            returnToMenu();
    }
}

function handleLikedOnly(data) {
    console.log('❤️ Faqat siz like berdidingiz:', data);
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    
    if (elements.timer) elements.timer.textContent = '❤️';
    
    if (data.reward) {
        userState.coins += data.reward.coins;
        userState.totalLikes++;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification('Like uchun mukofot', `+${data.reward.coins} coin, +${data.reward.xp} XP`);
    }
    
    // Keyingi duel yoki bosh menyu tanlash imkoniyati
    setTimeout(() => {
        showLikedOnlyOptions(data.opponentName);
    }, 1500);
}

function handleNoMatch(data) {
    console.log('❌ Match bo\'lmadi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    
    if (elements.timer) elements.timer.textContent = '✖';
    
    // Keyingi duel yoki bosh menyu tanlash imkoniyati
    setTimeout(() => {
        showNoMatchModal();
    }, 1500);
}

function handleTimeout(data) {
    console.log('⏰ Vaqt tugadi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    
    if (elements.timer) elements.timer.textContent = '⏰';
    
    // Keyingi duel yoki bosh menyu tanlash imkoniyati
    setTimeout(() => {
        showTimeoutOptions();
    }, 1500);
}

function showLikedOnlyOptions(opponentName) {
    const modalHTML = `
        <div class="modal active" id="likedOnlyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">❤️ Faqat siz like berdidingiz</h3>
                </div>
                <div class="modal-body">
                    <p style="color: #ccc;">${opponentName} sizga like bermadi</p>
                    <p style="color: #ccc;">Yangi duel o'ynashni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Yangi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = modalHTML;
}

function showNoMatchModal() {
    const modalHTML = `
        <div class="modal active" id="noMatchModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">❌ Match bo'lmadi</h3>
                </div>
                <div class="modal-body">
                    <p style="color: #ccc;">Yangi duel o'ynashni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Yangi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = modalHTML;
}

function showTimeoutOptions() {
    const modalHTML = `
        <div class="modal active" id="timeoutModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">⏰ Vaqt tugadi</h3>
                </div>
                <div class="modal-body">
                    <p style="color: #ccc;">Yangi duel o'ynashni xohlaysizmi?</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Yangi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = modalHTML;
}

// ==================== CHAT FUNKSIYALARI ====================
function openChat(partner) {
    if (!partner) return;
    
    gameState.isChatModalOpen = true;
    
    if (elements.chatPartnerAvatar) {
        elements.chatPartnerAvatar.src = partner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=3498db&color=fff`;
    }
    if (elements.chatPartnerName) {
        elements.chatPartnerName.textContent = partner.name;
    }
    if (elements.chatUsername && partner.username) {
        elements.chatUsername.textContent = `@${partner.username}`;
    } else if (elements.chatUsername) {
        elements.chatUsername.textContent = '';
    }
    
    if (elements.chatTitle) {
        elements.chatTitle.textContent = `${partner.name} bilan chat`;
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
    
    // Chat yopilgandan keyin avtomatik navbatga o'tmaslik
    closeChatModal();
}

function closeChatModal() {
    console.log('💬 Chat modali yopilmoqda');
    
    gameState.isChatModalOpen = false;
    if (elements.chatModal) {
        elements.chatModal.classList.remove('active');
    }
    
    // Chat yopilganda, match ekraniga qaytamiz
    // Foydalanuvchi qaytadan tanlov qilishi mumkin
    if (gameState.currentPartner) {
        showScreen('match');
    } else {
        // Agar partner ma'lumotlari yo'q bo'lsa, bosh menyuga qaytamiz
        returnToMenu();
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
            elements.timer.style.color = '#e74c3c';
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
function skipToNextDuel() {
    console.log('🔄 Keyingi duelga o\'tish');
    
    // Barcha modallarni yopamiz
    hideTimeoutModal();
    closeChatModal();
    
    // Barcha taymerlarni to'xtatamiz
    clearInterval(gameState.timerInterval);
    
    // UI elementlarini reset qilamiz
    if (elements.timer) {
        elements.timer.textContent = '20';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
    
    if (elements.noBtn) {
        elements.noBtn.textContent = '✖';
        elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    }
    
    // Tugmalarni yoqamiz
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = false;
            b.style.opacity = '1';
        }
    });
    
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    
    if (gameState.socket && gameState.isConnected) {
        if (userState.hasSelectedGender) {
            gameState.isInQueue = true;
            gameState.isInDuel = false;
            gameState.currentDuelId = null;
            
            // Serverga navbatga kirish so'rovini yuboramiz
            gameState.socket.emit('enter_queue');
            showScreen('queue');
            showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
        } else {
            showScreen('welcome');
        }
    } else {
        showScreen('welcome');
    }
}

function returnToMenu() {
    console.log('🏠 Bosh menyuga qaytish');
    
    // Barcha modallarni yopamiz
    hideTimeoutModal();
    closeChatModal();
    
    // Barcha taymerlarni to'xtatamiz
    clearInterval(gameState.timerInterval);
    
    // Serverdan navbatdan chiqish
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
    
    // Holatni reset qilamiz
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    
    // UI ni reset qilamiz
    if (elements.timer) {
        elements.timer.textContent = '20';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
    
    if (elements.noBtn) {
        elements.noBtn.textContent = '✖';
        elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    }
    
    showScreen('welcome');
    
    showNotification('Bosh menyuga qaytildi', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
}

// ==================== DO'STLAR FUNKSIYALARI ====================
function loadFriendsList() {
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('get_friends_list');
    } else {
        // Test ma'lumotlari
        const testFriends = [
            { id: 1, name: 'Ali', username: 'ali_jon', online: true, gender: 'male', lastActive: new Date(), rating: 1650, matches: 12, isMutual: true },
            { id: 2, name: 'Malika', username: 'malika_flower', online: true, gender: 'female', lastActive: new Date(), rating: 1720, matches: 8, isMutual: true },
            { id: 3, name: 'Sanjar', username: 'sanjarbek', online: false, gender: 'male', lastActive: new Date(Date.now() - 2*24*60*60*1000), rating: 1550, matches: 5, isMutual: false },
            { id: 4, name: 'Dilnoza', username: 'dilnoza_girl', online: true, gender: 'female', lastActive: new Date(), rating: 1680, matches: 15, isMutual: true }
        ];
        
        updateFriendsListUI({
            friends: testFriends,
            total: testFriends.length,
            online: testFriends.filter(f => f.online).length
        });
    }
}

function updateFriendsListUI(data) {
    const friends = data.friends;
    const mutualFriends = friends.filter(f => f.isMutual);
    
    if (elements.friendsList) {
        if (friends.length === 0) {
            elements.friendsList.innerHTML = '';
            if (elements.noFriends) elements.noFriends.classList.remove('hidden');
        } else {
            if (elements.noFriends) elements.noFriends.classList.add('hidden');
            
            elements.friendsList.innerHTML = friends.map(friend => `
                <div class="friend-item ${friend.isMutual ? 'mutual' : ''}">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=${friend.gender === 'male' ? '3498db' : 'e74c3c'}&color=fff" 
                         alt="${friend.name}" class="friend-avatar">
                    <div class="friend-info">
                        <div class="friend-name">
                            ${friend.name}
                            ${friend.isMutual ? '<span class="mutual-badge">❤️ Do\'st</span>' : ''}
                        </div>
                        <div class="friend-username">@${friend.username}</div>
                        <div class="friend-stats">
                            <span><i class="fas fa-trophy"></i> ${friend.rating}</span>
                            <span><i class="fas fa-heart"></i> ${friend.matches}</span>
                        </div>
                        <div class="friend-status ${friend.online ? 'status-online' : 'status-offline'}">
                            ${friend.online ? 'Onlayn' : 'Oxirgi faol: ' + formatDate(friend.lastActive)}
                        </div>
                    </div>
                    ${friend.isMutual ? 
                        `<button class="match-option-btn" style="padding: 8px 12px; min-width: 80px;" 
                                onclick="openChat(${JSON.stringify(friend).replace(/"/g, '&quot;')})">
                            💬 Chat
                        </button>` : 
                        `<button class="match-option-btn" style="padding: 8px 12px; min-width: 80px; background: #95a5a6;" 
                                onclick="showNotification('Xabar', 'Match bo\'lmaganingiz uchun chat ochib bo\'lmaydi')">
                            ⏳
                        </button>`
                    }
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

function formatDate(date) {
    if (!date) return 'noma\'lum';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'hozir';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' daqiqa oldin';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' soat oldin';
    if (diff < 604800000) return Math.floor(diff / 86400000) + ' kun oldin';
    return d.toLocaleDateString('uz-UZ');
}

// ==================== DO'KON FUNKSIYALARI ====================
function loadShopItems() {
    const items = [
        { id: 1, name: '10 Super Like', price: 100, icon: '💖', description: '10 ta kunlik SUPER LIKE' },
        { id: 2, name: '50 Super Like', price: 450, icon: '💎', description: '50 ta kunlik SUPER LIKE' },
        { id: 3, name: '100 Super Like', price: 800, icon: '👑', description: '100 ta kunlik SUPER LIKE' },
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
        { rank: 1, name: 'Ali', rating: 1850, matches: 45, friends: 12, gender: 'male' },
        { rank: 2, name: 'Malika', rating: 1790, matches: 38, friends: 8, gender: 'female' },
        { rank: 3, name: 'Sanjar', rating: 1720, matches: 32, friends: 5, gender: 'male' },
        { rank: 4, name: 'Dilnoza', rating: 1680, matches: 29, friends: 15, gender: 'female' },
        { rank: 5, name: 'Sardor', rating: 1620, matches: 25, friends: 7, gender: 'male' }
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
                        <span><i class="fas fa-users"></i> ${leader.friends}</span>
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
        { id: 4, title: '1 ta do\'st orttirish', progress: Math.min(userState.mutualMatchesCount, 1), total: 1, reward: 200 }
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
    if (data.filter !== undefined) userState.filter = data.filter;
    if (data.mutualMatchesCount !== undefined) userState.mutualMatchesCount = data.mutualMatchesCount;
    if (data.friendsCount !== undefined) userState.friendsCount = data.friendsCount;
    
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
    gameState.waitingForOpponent = false;
    clearInterval(gameState.timerInterval);
    
    showScreen('welcome');
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
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
    
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', () => {
            if (elements.editBio) elements.editBio.value = userState.bio || '';
            if (elements.editGender) elements.editGender.value = userState.currentGender || 'not_specified';
            if (elements.editFilter) elements.editFilter.value = userState.filter || 'not_specified';
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
                O'zaro Match: ${userState.mutualMatchesCount}
                Do'stlar: ${userState.friendsCount}
                Coin: ${userState.coins}
                Level: ${userState.level}
                Kunlik Super Like: ${userState.dailySuperLikes}/3
                Filter: ${userState.filter === 'male' ? 'Faqat erkaklar' : userState.filter === 'female' ? 'Faqat ayollar' : 'Hamma'}
            `;
            alert('Batafsil statistika:\n\n' + stats);
        });
    }
    
    // Refresh friends button
    if (elements.refreshFriendsBtn) {
        elements.refreshFriendsBtn.addEventListener('click', loadFriendsList);
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
window.selectFilter = selectFilter;
window.skipToNextDuel = skipToNextDuel;
window.returnToMenu = returnToMenu;
window.buyItem = buyItem;
window.hideTimeoutModal = hideTimeoutModal;
window.closeChatModal = closeChatModal;