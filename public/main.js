// main.js - MUKAMMAL VERSIYA (Test User muammosi to'g'rilangan)
console.log('🚀 Like Duel - MUKAMMAL VERSIYA');

// ==================== O'YIN HOLATLARI ====================
const gameState = {
    socket: null,
    isConnected: false,
    isInQueue: false,
    isInDuel: false,
    isInChat: false,
    timeLeft: 20,
    timerInterval: null,
    playerData: null,
    currentDuelId: null,
    currentPartner: null,
    currentChatId: null,
    lastOpponent: null,
    uniqueUserId: null
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
    userName: localStorage.getItem('userName') || null,
    userPhoto: localStorage.getItem('userPhoto') || null
};

// ==================== UNIQUE USER ID GENERATOR ====================
function generateUniqueUserId() {
    // LocalStoragedan avvalgi ID ni olish
    let storedId = localStorage.getItem('uniqueUserId');
    
    if (!storedId) {
        // Yangi unique ID yaratish
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        storedId = `user_${timestamp}_${random}`;
        localStorage.setItem('uniqueUserId', storedId);
        console.log('🆔 Yangi unique ID yaratildi:', storedId);
    }
    
    return storedId;
}

// ==================== RANDOM USER GENERATOR (Real ko'rinish uchun) ====================
function generateRandomUser() {
    const maleNames = ['Ali', 'Vali', 'Hasan', 'Husan', 'Bekzod', 'Javohir', 'Shohruh', 'Sanjar', 'Jamshid', 'Farhod'];
    const femaleNames = ['Malika', 'Dilnoza', 'Sevara', 'Madina', 'Zarina', 'Gulnora', 'Maftuna', 'Sabina', 'Kamola', 'Dilbar'];
    const lastNames = ['Alimov', 'Valiyev', 'Hasanov', 'Husanov', 'Bekzodov', 'Javohirov', 'Shohruhov', 'Sanjarov', 'Jamshidov', 'Farhodov'];
    
    const selectedGender = Math.random() > 0.5 ? 'male' : 'female';
    const isMale = selectedGender === 'male';
    
    const firstName = isMale 
        ? maleNames[Math.floor(Math.random() * maleNames.length)]
        : femaleNames[Math.floor(Math.random() * femaleNames.length)];
    
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}_${Math.floor(Math.random() * 1000)}`;
    
    // Random photo (gender-based)
    const photoUrl = isMale
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}&backgroundColor=65c9ff`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}&backgroundColor=ff9a9e`;
    
    return {
        firstName: fullName,
        username: username,
        photoUrl: photoUrl,
        gender: selectedGender,
        rating: 1400 + Math.floor(Math.random() * 200),
        matches: Math.floor(Math.random() * 50),
        level: 1 + Math.floor(Math.random() * 10)
    };
}

// ==================== GENDER BADGE QO'SHISH ====================
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

// ==================== STATISTIKANI YANGILASH ====================
function updateStats() {
    const coinsCount = document.getElementById('coinsCount');
    const levelCount = document.getElementById('levelCount');
    const shopCoinsCount = document.getElementById('shopCoinsCount');
    const statRating = document.getElementById('statRating');
    const statMatches = document.getElementById('statMatches');
    const myMatches = document.getElementById('myMatches');
    const statDuels = document.getElementById('statDuels');
    const statWinRate = document.getElementById('statWinRate');
    const myLikes = document.getElementById('myLikes');
    const superLikeCount = document.getElementById('superLikeCount');
    const profileBio = document.getElementById('profileBio');
    
    if (coinsCount) coinsCount.textContent = userState.coins;
    if (levelCount) levelCount.textContent = userState.level;
    if (shopCoinsCount) shopCoinsCount.textContent = userState.coins;
    if (statRating) statRating.textContent = userState.rating;
    if (statMatches) statMatches.textContent = userState.matches;
    if (myMatches) myMatches.textContent = userState.matches;
    if (statDuels) statDuels.textContent = userState.duels;
    
    const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
    if (statWinRate) statWinRate.textContent = winRate + '%';
    
    if (myLikes) myLikes.textContent = userState.totalLikes;
    if (superLikeCount) superLikeCount.textContent = userState.dailySuperLikes;
    if (profileBio) profileBio.textContent = localStorage.getItem('userBio') || 'Bio kiritilmagan';
}

// ==================== LOCALSTORAGE GA SAQLASH ====================
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

// ==================== PROFILNI YUKLASH (YANGILANGAN) ====================
function initUserProfile() {
    console.log('👤 Profil yuklanmoqda...');
    
    let tgUser = {};
    let useTelegram = false;
    
    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            tgUser = Telegram.WebApp.initDataUnsafe.user || {};
            if (tgUser.id) {
                useTelegram = true;
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                console.log('✅ Telegram Web App mavjud, real foydalanuvchi');
            }
        }
    } catch (error) {
        console.log('ℹ️ Telegram Web App mavjud emas');
    }
    
    // Unique ID ni olish yoki yaratish
    gameState.uniqueUserId = generateUniqueUserId();
    
    let userData;
    
    if (useTelegram && tgUser.id) {
        // Telegram foydalanuvchisi uchun
        userData = {
            id: tgUser.id.toString(),
            firstName: tgUser.first_name || 'Foydalanuvchi',
            username: tgUser.username || '',
            photoUrl: tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`,
            isTelegramUser: true
        };
        console.log('✅ Real Telegram foydalanuvchisi:', userData.firstName);
    } else {
        // Test foydalanuvchi uchun (random)
        const randomUser = generateRandomUser();
        userData = {
            id: gameState.uniqueUserId,
            firstName: userState.userName || randomUser.firstName,
            username: randomUser.username,
            photoUrl: userState.userPhoto || randomUser.photoUrl,
            isTelegramUser: false
        };
        console.log('✅ Random test foydalanuvchi:', userData.firstName);
        
        // Random user ma'lumotlarini saqlash
        if (!userState.userName) {
            userState.userName = userData.firstName;
            userState.userPhoto = userData.photoUrl;
            localStorage.setItem('userName', userData.firstName);
            localStorage.setItem('userPhoto', userData.photoUrl);
        }
    }
    
    // DOM elementlarini yangilash
    const myAvatar = document.getElementById('myAvatar');
    const myName = document.getElementById('myName');
    const myUsername = document.getElementById('myUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const startBtn = document.getElementById('startBtn');
    
    if (myAvatar) myAvatar.src = userData.photoUrl;
    if (myName) myName.textContent = userData.firstName;
    if (myUsername) myUsername.textContent = userData.username ? `@${userData.username}` : `@${userData.firstName.toLowerCase().replace(' ', '_')}`;
    if (profileAvatar) profileAvatar.src = userData.photoUrl;
    if (profileName) profileName.textContent = userData.firstName;
    if (profileUsername) profileUsername.textContent = userData.username ? `@${userData.username}` : `@${userData.firstName.toLowerCase().replace(' ', '_')}`;
    
    // Gender badge qo'shish
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(myName, userState.currentGender);
        addGenderBadge(profileName, userState.currentGender);
    }
    
    // Start tugmasini sozlash
    if (startBtn) {
        if (userState.hasSelectedGender) {
            startBtn.disabled = false;
            startBtn.textContent = '🎮 O\'yinni Boshlash';
            startBtn.classList.remove('disabled');
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Avval gender tanlang';
            startBtn.classList.add('disabled');
        }
    }
    
    // Statistika yangilash
    updateStats();
    
    // Agar gender tanlanmagan bo'lsa
    if (!userState.hasSelectedGender) {
        setTimeout(() => {
            showGenderModal(true);
        }, 1000);
    }
    
    return userData;
}

// ==================== SERVERGA ULANISH (YANGILANGAN) ====================
function connectToServer() {
    console.log('🔗 Serverga ulanmoqda...');
    
    if (gameState.socket && gameState.isConnected) {
        console.log('⚠️ Allaqachon ulangan');
        return;
    }
    
    // Render.com manzilini aniqlash
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
    
    // Socket.IO ulanishini yaratish
    gameState.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        query: {
            userId: gameState.uniqueUserId,
            version: '2.0'
        }
    });
    
    // ==================== SOCKET EVENTLARI ====================
    gameState.socket.on('connect', () => {
        console.log('✅ Serverga ulandi! Socket ID:', gameState.socket.id);
        gameState.isConnected = true;
        
        // Foydalanuvchi ma'lumotlarini olish
        const myName = document.getElementById('myName');
        const myUsername = document.getElementById('myUsername');
        const myAvatar = document.getElementById('myAvatar');
        
        const firstName = myName?.textContent || 'Foydalanuvchi';
        const username = myUsername?.textContent?.replace('@', '') || 'foydalanuvchi';
        const photoUrl = myAvatar?.src || 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff';
        
        // Autentifikatsiya
        gameState.socket.emit('auth', {
            userId: gameState.uniqueUserId,
            firstName: firstName,
            username: username,
            photoUrl: photoUrl,
            gender: userState.currentGender,
            hasSelectedGender: userState.hasSelectedGender
        });
        
        console.log(`🔐 Auth yuborildi: ${firstName} (${gameState.uniqueUserId})`);
    });
    
    gameState.socket.on('auth_ok', (data) => {
        console.log('✅ Autentifikatsiya muvaffaqiyatli');
        gameState.playerData = data;
        
        // UserState yangilash
        userState.currentGender = data.gender;
        userState.hasSelectedGender = data.hasSelectedGender;
        userState.coins = data.coins;
        userState.level = data.level;
        userState.rating = data.rating;
        userState.matches = data.matches;
        userState.duels = data.duels;
        userState.wins = data.wins;
        userState.totalLikes = data.totalLikes;
        userState.dailySuperLikes = data.dailySuperLikes;
        
        saveUserStateToLocalStorage();
        updateStats();
        
        // Gender badge qo'shish
        const myName = document.getElementById('myName');
        const profileName = document.getElementById('profileName');
        if (userState.hasSelectedGender && userState.currentGender) {
            addGenderBadge(myName, userState.currentGender);
            addGenderBadge(profileName, userState.currentGender);
        }
        
        // Start tugmasini yoqish
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '🎮 O\'yinni Boshlash';
            startBtn.classList.remove('disabled');
        }
        
        // Ekran ko'rsatish
        showScreen('queue');
        
        // Agar gender tanlangan bo'lsa, avtomatik navbatga kirish
        if (userState.hasSelectedGender) {
            setTimeout(() => {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
                console.log('🔄 Avtomatik navbatga kirish...');
            }, 500);
        } else {
            showGenderModal(true);
        }
    });
    
    gameState.socket.on('show_gender_selection', (data) => {
        console.log('⚠️ Gender tanlash talab qilinmoqda');
        showGenderModal(true);
    });
    
    gameState.socket.on('gender_selected', (data) => {
        console.log('✅ Gender tanlandi:', data);
        
        userState.currentGender = data.gender;
        userState.hasSelectedGender = true;
        
        saveUserStateToLocalStorage();
        
        // Gender badge qo'shish
        const myName = document.getElementById('myName');
        const profileName = document.getElementById('profileName');
        addGenderBadge(myName, data.gender);
        addGenderBadge(profileName, data.gender);
        
        // Start tugmasini yoqish
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '🎮 O\'yinni Boshlash';
            startBtn.classList.remove('disabled');
        }
        
        hideGenderModal();
        
        // Navbatga kirish
        if (gameState.socket && gameState.isConnected) {
            setTimeout(() => {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
                console.log('🔄 Navbatga kirish...');
            }, 500);
        }
        
        showNotification('🎉 Jins tanlandi', data.message);
    });
    
    gameState.socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        showScreen('queue');
        
        const queueStatus = document.getElementById('queueStatus');
        if (queueStatus) {
            queueStatus.textContent = `Navbatdasiz. O'rningiz: ${data.position}/${data.total}`;
        }
    });
    
    gameState.socket.on('waiting_count', (data) => {
        const waitingCount = document.getElementById('waitingCount');
        const position = document.getElementById('position');
        const positionInfo = document.getElementById('positionInfo');
        const queueStatus = document.getElementById('queueStatus');
        
        if (waitingCount) waitingCount.textContent = data.count;
        if (position) {
            position.textContent = data.position;
            if (positionInfo) {
                positionInfo.style.display = data.position > 0 ? 'block' : 'none';
            }
        }
        if (queueStatus) {
            queueStatus.textContent = data.position > 0 ? 
                `Navbatdasiz. O'rningiz: ${data.position}/${data.count}` : 
                'Navbatda...';
        }
    });
    
    gameState.socket.on('duel_started', (data) => {
        console.log(`⚔️ Duel boshlandi: ${data.duelId.substring(0, 10)}...`);
        console.log(`   Raqib: ${data.opponent.name}`);
        
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        gameState.isInQueue = false;
        showScreen('duel');
        
        // Tugmalarni qayta faollashtirish
        enableVoteButtons();
        
        // Raqib ma'lumotlarini ko'rsatish
        const opponentAvatar = document.getElementById('opponentAvatar');
        const opponentName = document.getElementById('opponentName');
        const opponentUsername = document.getElementById('opponentUsername');
        const opponentRating = document.getElementById('opponentRating');
        const opponentMatches = document.getElementById('opponentMatches');
        const opponentLevel = document.getElementById('opponentLevel');
        
        if (opponentAvatar) opponentAvatar.src = data.opponent.photo;
        if (opponentName) {
            opponentName.innerHTML = data.opponent.name;
            addGenderBadge(opponentName, data.opponent.gender);
        }
        if (opponentUsername) opponentUsername.textContent = data.opponent.username;
        if (opponentRating) opponentRating.textContent = data.opponent.rating;
        if (opponentMatches) opponentMatches.textContent = data.opponent.matches;
        if (opponentLevel) opponentLevel.textContent = data.opponent.level;
        
        startTimer();
        
        const duelStatus = document.getElementById('duelStatus');
        if (duelStatus) duelStatus.textContent = 'Ovoz bering: ❤️ yoki 💖 yoki ✖';
        
        // Super like count yangilash
        const superLikeCount = document.getElementById('superLikeCount');
        if (superLikeCount) superLikeCount.textContent = userState.dailySuperLikes;
    });
    
    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        handleMatch(data);
    });
    
    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        
        showScreen('queue');
        showNotification('❤️ Like berdidingiz', `${data.opponentName} sizni like bermadi. +${data.reward.coins} coin oldingiz.`);
        
        // Mukofotlarni qo'shish
        userState.coins += data.reward.coins;
        userState.xp += data.reward.xp;
        userState.duels++;
        saveUserStateToLocalStorage();
        updateStats();
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
            }
        }, 2000);
    });
    
    gameState.socket.on('no_match', () => {
        console.log('❌ Match bo\'lmadi');
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        
        showScreen('queue');
        showNotification('😔 Match bo\'lmadi', 'Keyingi duelga tayyorlanaylik!');
        
        // Duel statistikasini yangilash
        userState.duels++;
        saveUserStateToLocalStorage();
        updateStats();
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
            }
        }, 2000);
    });
    
    gameState.socket.on('timeout', () => {
        console.log('⏰ Duel vaqti tugadi');
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        
        showScreen('queue');
        showNotification('⏰ Vaqt tugadi', 'Duel vaqti tugadi, yangi raqib izlanmoqda...');
        
        // Duel statistikasini yangilash
        userState.duels++;
        saveUserStateToLocalStorage();
        updateStats();
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
            }
        }, 2000);
    });
    
    // CHAT SO'ROVLARI
    gameState.socket.on('chat_request_received', (data) => {
        console.log('💬 Chat so\'rovi keldi:', data);
        showNotification('💬 Chat so\'rovi', `${data.name} chatga o'tishni xohlaydi. Siz ham so'rasangiz chat boshlanadi.`);
    });
    
    gameState.socket.on('chat_started', (data) => {
        console.log('💬 Chat boshlandi:', data);
        openChat(data);
    });
    
    gameState.socket.on('chat_skipped', (data) => {
        console.log('🚪 Chat o\'tkazib yuborildi');
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        
        showScreen('queue');
        showNotification('💬 Chat o\'tkazib yuborildi', `Raqib chatga o'tishni xohlamadi${data.by ? ` (${data.by})` : ''}.`);
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
            }
        }, 2000);
    });
    
    gameState.socket.on('chat_message_received', (data) => {
        console.log('📨 Chat xabari keldi:', data);
        displayChatMessage(data.message);
    });
    
    gameState.socket.on('chat_message_sent', (data) => {
        console.log('✅ Chat xabari yuborildi:', data);
        // Xabarni lokal ravishda ko'rsatish
        displayChatMessage(data.message);
    });
    
    gameState.socket.on('chat_ended', (data) => {
        console.log('👋 Chat tugadi:', data);
        closeChat();
        showScreen('queue');
        showNotification('👋 Chat tugadi', `Suhbat yakunlandi${data.by ? ` (${data.by})` : ''}.`);
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
            }
        }, 2000);
    });
    
    gameState.socket.on('return_to_queue', (data) => {
        console.log('🔄 Navbatga qaytarildi:', data);
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        gameState.isInQueue = true;
        
        showScreen('queue');
        
        const queueStatus = document.getElementById('queueStatus');
        if (queueStatus) {
            queueStatus.textContent = data ? `Navbatdasiz. O'rningiz: ${data.position}/${data.total}` : 'Navbatda...';
        }
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
                gameState.socket.emit('enter_queue');
            }
        }, 1000);
    });
    
    gameState.socket.on('opponent_left', (data) => {
        console.log('⚠️ Raqib duelni tark etdi:', data);
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        
        showScreen('queue');
        showNotification('⚠️ Raqib ketdi', `${data?.name || 'Raqib'} duelni tark etdi. Yangi raqib izlanmoqda...`);
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && userState.hasSelectedGender) {
                gameState.isInQueue = true;
                gameState.socket.emit('enter_queue');
            }
        }, 2000);
    });
    
    gameState.socket.on('error', (data) => {
        console.error('❌ Xato:', data);
        showNotification('Xato', data.message);
    });
    
    gameState.socket.on('disconnect', () => {
        console.log('❌ Serverdan uzildi');
        gameState.isConnected = false;
        gameState.isInQueue = false;
        gameState.isInDuel = false;
        gameState.isInChat = false;
        showNotification('🔌 Ulanish uzildi', 'Serverga qayta ulanmoqda...');
    });
    
    gameState.socket.on('reconnect', () => {
        console.log('🔄 Serverga qayta ulandi');
        showNotification('✅ Qayta ulandi', 'Serverga muvaffaqiyatli qayta ulandik!');
    });
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    
    saveUserStateToLocalStorage();
    
    // Gender badge qo'shish
    const myName = document.getElementById('myName');
    const profileName = document.getElementById('profileName');
    addGenderBadge(myName, gender);
    addGenderBadge(profileName, gender);
    
    // Start tugmasini yoqish
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = '🎮 O\'yinni Boshlash';
        startBtn.classList.remove('disabled');
    }
    
    hideGenderModal();
    
    // Agar socket ulanmagan bo'lsa, ulanish
    if (!gameState.socket || !gameState.isConnected) {
        connectToServer();
    } else {
        // Socket ulangan bo'lsa, serverga bildirish
        gameState.socket.emit('select_gender', { gender: gender });
    }
    
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
}

// ==================== MODAL FUNKSIYALARI ====================
function showGenderModal(mandatory = true) {
    const genderModal = document.getElementById('genderModal');
    const genderWarning = document.getElementById('genderWarning');
    
    if (genderModal) genderModal.classList.add('active');
    if (mandatory && genderWarning) {
        genderWarning.classList.remove('hidden');
    }
}

function hideGenderModal() {
    const genderModal = document.getElementById('genderModal');
    const genderWarning = document.getElementById('genderWarning');
    
    if (genderModal) genderModal.classList.remove('active');
    if (genderWarning) genderWarning.classList.add('hidden');
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    const screens = ['welcomeScreen', 'queueScreen', 'duelScreen', 'matchScreen'];
    
    screens.forEach(screenId => {
        const element = document.getElementById(screenId);
        if (element) element.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screen + 'Screen');
    if (targetScreen) targetScreen.classList.remove('hidden');
}

// ==================== TIMER FUNKSIYASI ====================
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    
    const timer = document.getElementById('timer');
    if (timer) {
        timer.textContent = 20;
        timer.style.color = '#fff';
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        if (timer) timer.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 5 && timer) {
            timer.style.color = '#ff4444';
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
        }
    }, 1000);
}

// ==================== OVOZ BERISH TUGMALARINI YANGILASH ====================
function enableVoteButtons() {
    const noBtn = document.getElementById('noBtn');
    const likeBtn = document.getElementById('likeBtn');
    const superLikeBtn = document.getElementById('superLikeBtn');
    
    [noBtn, likeBtn, superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = false;
            b.style.opacity = '1';
            b.style.cursor = 'pointer';
        }
    });
}

// ==================== OVOZ BERISH ====================
function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel || !gameState.currentDuelId) {
        console.log('❌ Vote qilish mumkin emas: socket, duel yoki duelId yo\'q');
        return;
    }
    
    const noBtn = document.getElementById('noBtn');
    const likeBtn = document.getElementById('likeBtn');
    const superLikeBtn = document.getElementById('superLikeBtn');
    
    // Tugmalarni bloklash
    [noBtn, likeBtn, superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
            b.style.cursor = 'not-allowed';
        }
    });
    
    // SUPER LIKE limit tekshirish
    if (choice === 'super_like' && userState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        enableVoteButtons();
        return;
    }
    
    console.log(`🗳️ Ovoz berish: ${choice} (duel: ${gameState.currentDuelId.substring(0, 10)}...)`);
    gameState.socket.emit('vote', { 
        duelId: gameState.currentDuelId, 
        choice: choice 
    });
    
    const timer = document.getElementById('timer');
    if (timer) {
        if (choice === 'like') timer.textContent = '❤️';
        else if (choice === 'super_like') timer.textContent = '💖';
        else timer.textContent = '✖';
    }
    
    const duelStatus = document.getElementById('duelStatus');
    if (duelStatus) {
        duelStatus.textContent = choice === 'like' ? 'LIKE berdingiz...' : 
                                choice === 'super_like' ? 'SUPER LIKE!' : 
                                'O\'tkazib yubordingiz...';
    }
}

// ==================== MATCH HANDLER ====================
function handleMatch(data) {
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentPartner = data.partner;
    gameState.currentDuelId = data.duelId;
    showScreen('match');
    
    const partnerName = document.getElementById('partnerName');
    const matchText = document.getElementById('matchText');
    const rewardCoins = document.getElementById('rewardCoins');
    const rewardXP = document.getElementById('rewardXP');
    const newRating = document.getElementById('newRating');
    const matchOptions = document.getElementById('matchOptions');
    
    if (partnerName) partnerName.textContent = data.partner.name;
    if (matchText) {
        matchText.innerHTML = data.isRematch ? 
            `<div style="font-size: 1.5rem;">🎉 QAYTA MATCH!</div>Yana birga bo'ldingiz!` :
            `<div style="font-size: 1.5rem;">🎉 MATCH!</div>Bir-biringizni yoqtirdingiz!`;
    }
    if (rewardCoins) rewardCoins.textContent = data.rewards.coins;
    if (rewardXP) rewardXP.textContent = data.rewards.xp;
    if (newRating) newRating.textContent = data.newRating;
    
    // Mukofotlarni qo'shish
    userState.coins += data.rewards.coins;
    userState.xp += data.rewards.xp;
    userState.matches++;
    userState.duels++;
    userState.wins++;
    
    // Level tekshirish
    const neededXP = userState.level * 100;
    if (userState.xp >= neededXP) {
        userState.level++;
        userState.xp -= neededXP;
    }
    
    saveUserStateToLocalStorage();
    updateStats();
    
    // Tugmalarni yaratish
    if (matchOptions) {
        matchOptions.innerHTML = '';
        
        // Chatga o'tish tugmasi
        const chatBtn = document.createElement('button');
        chatBtn.className = 'match-option-btn';
        chatBtn.style.background = '#2ecc71';
        chatBtn.innerHTML = '<i class="fas fa-comment"></i> Chatga O\'tish';
        chatBtn.onclick = () => {
            if (gameState.socket && gameState.isConnected && gameState.currentDuelId) {
                console.log(`💬 Chat so'rovi yuborilmoqda: ${gameState.currentDuelId.substring(0, 10)}...`);
                gameState.socket.emit('chat_request', { 
                    duelId: gameState.currentDuelId 
                });
                
                // Loading holatini ko'rsatish
                matchOptions.innerHTML = '<div style="padding: 20px; text-align: center;">Raqib javobini kutish...</div>';
            }
        };
        matchOptions.appendChild(chatBtn);
        
        // O'tkazib yuborish tugmasi
        const skipBtn = document.createElement('button');
        skipBtn.className = 'match-option-btn';
        skipBtn.style.background = '#ff6b6b';
        skipBtn.innerHTML = '<i class="fas fa-forward"></i> O\'tkazish';
        skipBtn.onclick = () => {
            if (gameState.socket && gameState.isConnected && gameState.currentDuelId) {
                console.log(`🚪 Chat o'tkazib yuborilmoqda: ${gameState.currentDuelId.substring(0, 10)}...`);
                gameState.socket.emit('skip_chat', { 
                    duelId: gameState.currentDuelId 
                });
                returnToQueue();
            }
        };
        matchOptions.appendChild(skipBtn);
    }
    
    // Konfetti
    if (typeof confetti === 'function') {
        confetti({ 
            particleCount: 300, 
            spread: 100, 
            origin: { y: 0.6 } 
        });
        
        setTimeout(() => {
            confetti({ 
                particleCount: 200, 
                angle: 60, 
                spread: 80, 
                origin: { x: 0 } 
            });
            confetti({ 
                particleCount: 200, 
                angle: 120, 
                spread: 80, 
                origin: { x: 1 } 
            });
        }, 250);
    }
}

// ==================== NAVBATGA QAYTISH ====================
function returnToQueue() {
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.isInChat = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = null;
    gameState.currentChatId = null;
    gameState.isInQueue = true;
    
    showScreen('queue');
    
    const queueStatus = document.getElementById('queueStatus');
    if (queueStatus) queueStatus.textContent = 'Yangi raqib izlanmoqda...';
    
    // Agar gender tanlagan bo'lsa, navbatga qayta kirish
    if (userState.hasSelectedGender && gameState.socket && gameState.isConnected) {
        setTimeout(() => {
            gameState.socket.emit('enter_queue');
        }, 1000);
    }
}

// ==================== CHAT FUNKSIYALARI ====================
function openChat(data) {
    gameState.isInChat = true;
    gameState.currentChatId = data.chatId;
    gameState.isInDuel = false;
    gameState.isInQueue = false;
    
    const chatModal = document.getElementById('chatModal');
    const chatPartnerAvatar = document.getElementById('chatPartnerAvatar');
    const chatPartnerName = document.getElementById('chatPartnerName');
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatModal) chatModal.classList.add('active');
    if (chatPartnerAvatar) chatPartnerAvatar.src = data.partner.photo;
    if (chatPartnerName) chatPartnerName.textContent = data.partner.name;
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="chat-welcome">
                <div style="text-align: center; padding: 20px; opacity: 0.7;">
                    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">💬 Chat boshlandi!</div>
                    <div>${data.partner.name} bilan suhbatlashishingiz mumkin</div>
                    <div style="font-size: 0.8rem; margin-top: 10px; opacity: 0.5;">
                        Xabar yuborish uchun yozing va Enter ni bosing
                    </div>
                </div>
            </div>
        `;
    }
    
    // Match ekranini yashirish
    const matchScreen = document.getElementById('matchScreen');
    if (matchScreen) matchScreen.classList.add('hidden');
    
    // Chat inputni focus qilish
    setTimeout(() => {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.focus();
            chatInput.value = '';
        }
    }, 300);
    
    showNotification('💬 Chat', `${data.partner.name} bilan chat boshlandi!`);
}

function closeChat() {
    const chatModal = document.getElementById('chatModal');
    if (chatModal) chatModal.classList.remove('active');
    
    gameState.isInChat = false;
    gameState.currentChatId = null;
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput || !chatInput.value.trim()) {
        console.log('❌ Chat xabari bo\'sh');
        return;
    }
    
    if (!gameState.currentChatId) {
        console.log('❌ Chat ID topilmadi');
        showNotification('Xato', 'Chat topilmadi');
        return;
    }
    
    const message = chatInput.value.trim();
    chatInput.value = '';
    
    if (gameState.socket && gameState.isConnected) {
        console.log(`📤 Chat xabari yuborilmoqda: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
        gameState.socket.emit('send_chat_message', {
            chatId: gameState.currentChatId,
            message: message
        });
        
        // O'z xabarimizni lokal ravishda ko'rsatish
        displayChatMessage({
            senderName: 'Siz',
            message: message,
            timestamp: new Date()
        });
    } else {
        console.log('❌ Socket ulanmagan');
        showNotification('Xato', 'Serverga ulanmagan');
    }
}

function displayChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Avvalgi "chat boshlandi" xabarini o'chirish
    const welcomeDiv = chatMessages.querySelector('.chat-welcome');
    if (welcomeDiv) {
        welcomeDiv.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = message.senderName === 'Siz' ? 'chat-message own' : 'chat-message other';
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="chat-message-content">
            <div class="chat-message-sender">${message.senderName}</div>
            <div class="chat-message-text">${message.message}</div>
            <div class="chat-message-time">${time}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================== NOTIFIKATSIYA ====================
function showNotification(title, message) {
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (notification && notificationTitle && notificationMessage) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notification.classList.add('active');
        
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }
}

// ==================== O'YINNI BOSHLASH ====================
function startGame() {
    if (!userState.hasSelectedGender) {
        showGenderModal(true);
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
    
    connectToServer();
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Like Duel - MUKAMMAL VERSIYA DOM yuklandi');
    console.log('🆔 User ID:', generateUniqueUserId());
    
    // Profilni yuklash
    const userData = initUserProfile();
    
    // Tugmalar uchun event listenerlar
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    
    const leaveQueueBtn = document.getElementById('leaveQueueBtn');
    if (leaveQueueBtn) {
        leaveQueueBtn.addEventListener('click', () => {
            if (gameState.socket && gameState.isConnected) {
                gameState.socket.emit('leave_queue');
            }
            gameState.isInQueue = false;
            showScreen('welcome');
            showNotification('🚪 Navbat', 'Navbatdan chiqdingiz');
        });
    }
    
    // Gender tanlash tugmalari
    document.querySelectorAll('.gender-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    const selectMaleBtn = document.getElementById('selectMaleBtn');
    const selectFemaleBtn = document.getElementById('selectFemaleBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    
    if (selectMaleBtn) selectMaleBtn.addEventListener('click', () => selectGender('male'));
    if (selectFemaleBtn) selectFemaleBtn.addEventListener('click', () => selectGender('female'));
    if (selectAllBtn) selectAllBtn.addEventListener('click', () => selectGender('not_specified'));
    
    // Ovoz berish tugmalari
    const noBtn = document.getElementById('noBtn');
    const likeBtn = document.getElementById('likeBtn');
    const superLikeBtn = document.getElementById('superLikeBtn');
    
    if (noBtn) noBtn.addEventListener('click', () => handleVote('skip'));
    if (likeBtn) likeBtn.addEventListener('click', () => handleVote('like'));
    if (superLikeBtn) superLikeBtn.addEventListener('click', () => handleVote('super_like'));
    
    // Chat funksiyalari
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
    }
    
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            if (gameState.socket && gameState.isConnected && gameState.currentChatId) {
                gameState.socket.emit('leave_chat', { chatId: gameState.currentChatId });
            }
            closeChat();
            returnToQueue();
        });
    }
    
    // Test rejimi: agar localhost bo'lsa
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Test rejimi faollashtirildi');
        setTimeout(() => {
            if (!userState.hasSelectedGender) {
                showGenderModal(true);
            }
        }, 2000);
    }
});

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
    
    .disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
    }
    
    .hidden {
        display: none !important;
    }
    
    /* Chat CSS */
    .chat-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        padding: 20px;
    }
    
    .chat-modal.active {
        opacity: 1;
        visibility: visible;
    }
    
    .chat-box {
        background: white;
        border-radius: 20px;
        width: 90%;
        max-width: 500px;
        height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .chat-header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .chat-header button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 5px;
    }
    
    .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f5f5f5;
    }
    
    .chat-input {
        display: flex;
        padding: 15px;
        background: white;
        border-top: 1px solid #eee;
    }
    
    .chat-input input {
        flex: 1;
        padding: 12px 15px;
        border: 2px solid #667eea;
        border-radius: 10px;
        font-size: 16px;
        outline: none;
    }
    
    .chat-input button {
        background: #667eea;
        color: white;
        border: none;
        border-radius: 10px;
        padding: 0 20px;
        margin-left: 10px;
        cursor: pointer;
        font-size: 16px;
    }
    
    .chat-message {
        margin-bottom: 15px;
        max-width: 80%;
    }
    
    .chat-message.own {
        margin-left: auto;
    }
    
    .chat-message.other {
        margin-right: auto;
    }
    
    .chat-message-content {
        background: white;
        padding: 12px 15px;
        border-radius: 15px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .chat-message.own .chat-message-content {
        background: #667eea;
        color: white;
        border-bottom-right-radius: 5px;
    }
    
    .chat-message.other .chat-message-content {
        background: #e8eaf6;
        border-bottom-left-radius: 5px;
    }
    
    .chat-message-sender {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 5px;
        opacity: 0.8;
    }
    
    .chat-message-text {
        font-size: 16px;
        line-height: 1.4;
        word-break: break-word;
    }
    
    .chat-message-time {
        font-size: 11px;
        text-align: right;
        margin-top: 5px;
        opacity: 0.6;
    }
    
    /* Notification */
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        z-index: 1001;
        max-width: 300px;
        transform: translateX(150%);
        transition: transform 0.3s ease;
    }
    
    .notification.active {
        transform: translateX(0);
    }
    
    /* Modal */
    .gender-modal.mandatory-modal .modal-content {
        background: white;
        border-radius: 20px;
        padding: 30px;
        max-width: 400px;
        width: 100%;
        text-align: center;
    }
    
    /* Timer */
    .timer {
        font-size: 2rem;
        font-weight: bold;
    }
    
    /* Match options */
    .match-option-btn {
        padding: 15px;
        border: none;
        border-radius: 15px;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        margin-bottom: 10px;
    }
    
    .match-option-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    /* Vote buttons */
    .vote-btn {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .vote-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
    }
    
    .vote-btn:hover:not(:disabled) {
        transform: scale(1.1);
    }
    
    /* Responsive */
    @media (max-width: 480px) {
        .vote-btn {
            width: 60px;
            height: 60px;
            font-size: 1.7rem;
        }
        
        .chat-box {
            width: 95%;
            height: 85vh;
        }
        
        .gender-modal .modal-content {
            padding: 20px;
            margin: 10px;
        }
    }
`;

document.head.appendChild(style);

console.log('✅ main.js chat funksiyasi bilan to\'liq yuklandi');