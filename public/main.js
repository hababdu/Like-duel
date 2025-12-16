// main.js - MUKAMMAL VERSIYA 3.0
console.log('🚀 Like Duel - MUKAMMAL VERSIYA 3.0');

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
    uniqueUserId: null,
    currentOpponent: null
};

// ==================== USER STATE ====================
const userState = {
    currentGender: localStorage.getItem('userGender') || null,
    hasSelectedGender: localStorage.getItem('hasSelectedGender') === 'true',
    coins: parseInt(localStorage.getItem('userCoins')) || 100,
    level: parseInt(localStorage.getItem('userLevel')) || 1,
    rating: parseInt(localStorage.getItem('userRating')) || 1500,
    xp: parseInt(localStorage.getItem('userXP')) || 0,
    matches: parseInt(localStorage.getItem('userMatches')) || 0,
    duels: parseInt(localStorage.getItem('userDuels')) || 0,
    wins: parseInt(localStorage.getItem('userWins')) || 0,
    totalLikes: parseInt(localStorage.getItem('userTotalLikes')) || 0,
    dailySuperLikes: parseInt(localStorage.getItem('userDailySuperLikes')) || 3,
    userName: localStorage.getItem('userName') || null,
    userPhoto: localStorage.getItem('userPhoto') || null,
    userBio: localStorage.getItem('userBio') || ''
};

// ==================== UTILITY FUNCTIONS ====================
function generateUniqueUserId() {
    let storedId = localStorage.getItem('uniqueUserId');
    
    if (!storedId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        storedId = `user_${timestamp}_${random}`;
        localStorage.setItem('uniqueUserId', storedId);
        console.log('🆔 Yangi unique ID yaratildi:', storedId);
    }
    
    return storedId;
}

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
    const username = `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
    
    const photoUrl = isMale
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}&backgroundColor=65c9ff`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}&backgroundColor=ff9a9e`;
    
    const bioOptions = [
        'Yangi do\'stlar qidiryapman!',
        'Sportga qiziqaman',
        'Musiqa tinglashni yoqtiraman',
        'Kitob o\'qishni sevaman',
        'Sayohat qilishni yoqtiraman',
        'O\'zbekistonlik!',
        'Web dasturchi',
        'Talaba'
    ];
    
    return {
        firstName: fullName,
        username: username,
        photoUrl: photoUrl,
        gender: selectedGender,
        rating: 1400 + Math.floor(Math.random() * 200),
        matches: Math.floor(Math.random() * 50),
        level: 1 + Math.floor(Math.random() * 10),
        bio: bioOptions[Math.floor(Math.random() * bioOptions.length)]
    };
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

// ==================== STATISTIKANI YANGILASH ====================
function updateStats() {
    // Header statistikasi
    document.getElementById('coinsCount').textContent = userState.coins;
    document.getElementById('levelCount').textContent = userState.level;
    document.getElementById('superLikeCount').textContent = userState.dailySuperLikes;
    
    // Profile statistikasi
    document.getElementById('shopCoinsCount').textContent = userState.coins;
    document.getElementById('statRating').textContent = userState.rating;
    document.getElementById('statMatches').textContent = userState.matches;
    document.getElementById('myMatches').textContent = userState.matches;
    document.getElementById('statDuels').textContent = userState.duels;
    document.getElementById('myDuels').textContent = userState.duels;
    
    const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
    document.getElementById('statWinRate').textContent = winRate + '%';
    
    document.getElementById('myLikes').textContent = userState.totalLikes;
    document.getElementById('profileXP').textContent = `${userState.xp}/${userState.level * 100}`;
    document.getElementById('profileBioText').textContent = userState.userBio || 'Bio kiritilmagan';
}

function saveUserStateToLocalStorage() {
    localStorage.setItem('userGender', userState.currentGender || '');
    localStorage.setItem('hasSelectedGender', userState.hasSelectedGender.toString());
    localStorage.setItem('userCoins', userState.coins.toString());
    localStorage.setItem('userLevel', userState.level.toString());
    localStorage.setItem('userRating', userState.rating.toString());
    localStorage.setItem('userXP', userState.xp.toString());
    localStorage.setItem('userMatches', userState.matches.toString());
    localStorage.setItem('userDuels', userState.duels.toString());
    localStorage.setItem('userWins', userState.wins.toString());
    localStorage.setItem('userTotalLikes', userState.totalLikes.toString());
    localStorage.setItem('userDailySuperLikes', userState.dailySuperLikes.toString());
    localStorage.setItem('userName', userState.userName || '');
    localStorage.setItem('userPhoto', userState.userPhoto || '');
    localStorage.setItem('userBio', userState.userBio || '');
}

// ==================== PROFILNI YUKLASH ====================
function initUserProfile() {
    console.log('👤 Profil yuklanmoqda...');
    
    // Unique ID ni olish yoki yaratish
    gameState.uniqueUserId = generateUniqueUserId();
    
    let userData;
    
    try {
        // Telegram test qilish
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user || {};
            if (tgUser.id) {
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                
                userData = {
                    id: tgUser.id.toString(),
                    firstName: tgUser.first_name || 'Foydalanuvchi',
                    username: tgUser.username || '',
                    photoUrl: tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`,
                    isTelegramUser: true
                };
                console.log('✅ Telegram foydalanuvchisi:', userData.firstName);
            } else {
                throw new Error('Telegram user topilmadi');
            }
        } else {
            throw new Error('Telegram Web App mavjud emas');
        }
    } catch (error) {
        // Test foydalanuvchi yaratish
        const randomUser = generateRandomUser();
        userData = {
            id: gameState.uniqueUserId,
            firstName: userState.userName || randomUser.firstName,
            username: randomUser.username,
            photoUrl: userState.userPhoto || randomUser.photoUrl,
            isTelegramUser: false
        };
        console.log('✅ Test foydalanuvchi:', userData.firstName);
        
        // Ma'lumotlarni saqlash
        if (!userState.userName) {
            userState.userName = userData.firstName;
            userState.userPhoto = userData.photoUrl;
        }
    }
    
    // DOM elementlarini yangilash
    document.getElementById('myAvatar').src = userData.photoUrl;
    document.getElementById('myName').textContent = userData.firstName;
    document.getElementById('myUsername').textContent = userData.username ? `@${userData.username}` : `@${userData.firstName.toLowerCase().replace(' ', '_')}`;
    document.getElementById('profileAvatar').src = userData.photoUrl;
    document.getElementById('profileName').textContent = userData.firstName;
    document.getElementById('profileUsername').textContent = userData.username ? `@${userData.username}` : `@${userData.firstName.toLowerCase().replace(' ', '_')}`;
    
    // Gender badge qo'shish
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(document.getElementById('myName'), userState.currentGender);
        addGenderBadge(document.getElementById('profileName'), userState.currentGender);
    }
    
    // Start tugmasini sozlash
    const startBtn = document.getElementById('startBtn');
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

// ==================== SERVERGA ULANISH ====================
function connectToServer() {
    console.log('🔗 Serverga ulanmoqda...');
    
    if (gameState.socket && gameState.isConnected) {
        console.log('⚠️ Allaqachon ulangan');
        return;
    }
    
    // URL aniqlash
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
    
    const socketUrl = isLocalhost ? 'http://localhost:3000' : 'https://like-duel.onrender.com';
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
            version: '3.0'
        }
    });
    
    // ==================== SOCKET EVENTLARI ====================
    gameState.socket.on('connect', () => {
        console.log('✅ Serverga ulandi! Socket ID:', gameState.socket.id);
        gameState.isConnected = true;
        
        // Foydalanuvchi ma'lumotlarini yuborish
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
        userState.coins = data.coins || userState.coins;
        userState.level = data.level || userState.level;
        userState.rating = data.rating || userState.rating;
        userState.matches = data.matches || userState.matches;
        userState.duels = data.duels || userState.duels;
        userState.wins = data.wins || userState.wins;
        userState.totalLikes = data.totalLikes || userState.totalLikes;
        userState.dailySuperLikes = data.dailySuperLikes || userState.dailySuperLikes;
        
        saveUserStateToLocalStorage();
        updateStats();
        
        // Gender badge qo'shish
        if (userState.hasSelectedGender && userState.currentGender) {
            addGenderBadge(document.getElementById('myName'), userState.currentGender);
            addGenderBadge(document.getElementById('profileName'), userState.currentGender);
        }
        
        // Start tugmasini yoqish
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '🎮 O\'yinni Boshlash';
            startBtn.classList.remove('disabled');
        }
        
        // Agar gender tanlangan bo'lsa, avtomatik navbatga kirish
        if (userState.hasSelectedGender) {
            setTimeout(() => {
                enterQueue();
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
        addGenderBadge(document.getElementById('myName'), data.gender);
        addGenderBadge(document.getElementById('profileName'), data.gender);
        
        // Start tugmasini yoqish
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '🎮 O\'yinni Boshlash';
            startBtn.classList.remove('disabled');
        }
        
        hideGenderModal();
        
        // Navbatga kirish
        setTimeout(() => {
            enterQueue();
        }, 500);
        
        showNotification('🎉 Jins tanlandi', data.message);
    });
    
    gameState.socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        showScreen('queue');
        
        document.getElementById('queueStatus').textContent = `Navbatdasiz. O'rningiz: ${data.position}/${data.total}`;
    });
    
    gameState.socket.on('waiting_count', (data) => {
        document.getElementById('waitingCount').textContent = data.count;
        document.getElementById('position').textContent = data.position;
        document.getElementById('queueStatus').textContent = data.position > 0 ? 
            `Navbatdasiz. O'rningiz: ${data.position}/${data.count}` : 
            'Navbatda...';
    });
    
    gameState.socket.on('duel_started', (data) => {
        console.log(`⚔️ Duel boshlandi: ${data.duelId.substring(0, 10)}...`);
        console.log(`   Raqib: ${data.opponent.name}`);
        
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        gameState.currentOpponent = data.opponent;
        gameState.isInQueue = false;
        showScreen('duel');
        
        // Ovoz berish tugmalarini yoqish
        enableVoteButtons();
        
        // Raqib ma'lumotlarini ko'rsatish
        const opponentAvatar = document.getElementById('opponentAvatar');
        const opponentName = document.getElementById('opponentName');
        const opponentUsername = document.getElementById('opponentUsername');
        const opponentRating = document.getElementById('opponentRating');
        const opponentMatches = document.getElementById('opponentMatches');
        const opponentLevel = document.getElementById('opponentLevel');
        const opponentBio = document.getElementById('opponentBio');
        
        opponentAvatar.src = data.opponent.photo;
        opponentName.innerHTML = data.opponent.name;
        addGenderBadge(opponentName, data.opponent.gender);
        opponentUsername.textContent = data.opponent.username ? '@' + data.opponent.username : '';
        opponentRating.textContent = data.opponent.rating;
        opponentMatches.textContent = data.opponent.matches;
        opponentLevel.textContent = data.opponent.level;
        opponentBio.textContent = data.opponent.bio || 'Bio kiritilmagan';
        
        // Oldingi ovoz tarixini ko'rsatish
        if (data.previousHistory) {
            const duelStatus = document.getElementById('duelStatus');
            if (duelStatus && data.previousHistory.myVote) {
                let historyText = '';
                if (data.previousHistory.wasMatch) {
                    historyText = 'Oldin match bo\'lgansiz!';
                } else if (data.previousHistory.myVote === 'like' && data.previousHistory.opponentVote === 'skip') {
                    historyText = 'Oldin siz like bergan edingiz';
                } else if (data.previousHistory.myVote === 'skip' && data.previousHistory.opponentVote === 'like') {
                    historyText = 'Oldin raqib sizga like bergan edi';
                }
                
                if (historyText) {
                    duelStatus.innerHTML = `<i class="fas fa-history"></i> ${historyText}`;
                }
            }
        }
        
        startTimer();
        
        // Super like count yangilash
        document.getElementById('superLikeCountDuel').textContent = userState.dailySuperLikes;
    });
    
    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        handleMatch(data);
    });
    
    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        gameState.currentOpponent = null;
        
        showScreen('queue');
        showNotification('❤️ Like berdidingiz', 
            `${data.opponentName} sizni like bermadi. +${data.reward.coins} coin oldingiz.`);
        
        // Mukofotlarni qo'shish
        userState.coins += data.reward.coins;
        userState.xp += data.reward.xp;
        userState.duels++;
        userState.totalLikes++;
        saveUserStateToLocalStorage();
        updateStats();
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (userState.hasSelectedGender) {
                enterQueue();
            }
        }, 2000);
    });
    
    gameState.socket.on('no_match', (data) => {
        console.log('❌ Match bo\'lmadi');
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        gameState.currentOpponent = null;
        
        showScreen('queue');
        
        let notificationText = 'Match bo\'lmadi';
        if (data && data.yourVote && data.opponentVote) {
            notificationText = `Siz ${data.yourVote === 'like' ? 'like' : 'skip'} berdidingiz, raqib ${data.opponentVote === 'like' ? 'like' : 'skip'} berdi`;
        }
        
        showNotification('😔 Match bo\'lmadi', notificationText);
        
        // Duel statistikasini yangilash
        userState.duels++;
        saveUserStateToLocalStorage();
        updateStats();
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (userState.hasSelectedGender) {
                enterQueue();
            }
        }, 2000);
    });
    
    gameState.socket.on('timeout', () => {
        console.log('⏰ Duel vaqti tugadi');
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        gameState.currentOpponent = null;
        
        showScreen('queue');
        showNotification('⏰ Vaqt tugadi', 'Duel vaqti tugadi, yangi raqib izlanmoqda...');
        
        // Duel statistikasini yangilash
        userState.duels++;
        saveUserStateToLocalStorage();
        updateStats();
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (userState.hasSelectedGender) {
                enterQueue();
            }
        }, 2000);
    });
    
    gameState.socket.on('chat_request_received', (data) => {
        console.log('💬 Chat so\'rovi keldi:', data);
        showNotification('💬 Chat so\'rovi', 
            `${data.name} chatga o'tishni xohlaydi. Siz ham so'rasangiz chat boshlanadi.`);
    });
    
    gameState.socket.on('chat_started', (data) => {
        console.log('💬 Chat boshlandi:', data);
        openChat(data);
    });
    
    gameState.socket.on('chat_skipped', (data) => {
        console.log('🚪 Chat o\'tkazib yuborildi');
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        gameState.currentOpponent = null;
        
        showScreen('queue');
        showNotification('💬 Chat o\'tkazib yuborildi', 
            `Raqib chatga o'tishni xohlamadi${data.by ? ` (${data.by})` : ''}.`);
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (userState.hasSelectedGender) {
                enterQueue();
            }
        }, 2000);
    });
    
    gameState.socket.on('chat_message_received', (data) => {
        console.log('📨 Chat xabari keldi:', data);
        displayChatMessage(data.message);
    });
    
    gameState.socket.on('chat_message_sent', (data) => {
        console.log('✅ Chat xabari yuborildi:', data);
        displayChatMessage(data.message);
    });
    
    gameState.socket.on('chat_ended', (data) => {
        console.log('👋 Chat tugadi:', data);
        closeChat();
        showScreen('queue');
        showNotification('👋 Chat tugadi', 
            `Suhbat yakunlandi${data.by ? ` (${data.by})` : ''}.`);
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (userState.hasSelectedGender) {
                enterQueue();
            }
        }, 2000);
    });
    
    gameState.socket.on('return_to_queue', (data) => {
        console.log('🔄 Navbatga qaytarildi:', data);
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        gameState.currentOpponent = null;
        gameState.isInQueue = true;
        
        showScreen('queue');
        
        document.getElementById('queueStatus').textContent = data ? 
            `Navbatdasiz. O'rningiz: ${data.position}/${data.total}` : 
            'Navbatda...';
        
        // Yangi duel qidirish
        setTimeout(() => {
            enterQueue();
        }, 1000);
    });
    
    gameState.socket.on('left_queue', () => {
        console.log('🚪 Navbatdan chiqildi');
        gameState.isInQueue = false;
        showScreen('welcome');
    });
    
    gameState.socket.on('opponent_left', (data) => {
        console.log('⚠️ Raqib duelni tark etdi:', data);
        gameState.isInDuel = false;
        gameState.currentDuelId = null;
        gameState.currentOpponent = null;
        
        showScreen('queue');
        showNotification('⚠️ Raqib ketdi', 
            `${data?.name || 'Raqib'} duelni tark etdi. Yangi raqib izlanmoqda...`);
        
        // Yangi duel qidirish
        setTimeout(() => {
            if (userState.hasSelectedGender) {
                enterQueue();
            }
        }, 2000);
    });
    
    gameState.socket.on('vote_registered', () => {
        console.log('✅ Ovoz qabul qilindi');
        // Faqat bosilgan tugmani bloklash
        // Qolgan tugmalarni bloklash
        disableVoteButtonsExcept(null);
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
}

// ==================== NAVBAT FUNKSIYALARI ====================
function enterQueue() {
    if (!userState.hasSelectedGender) {
        showGenderModal(true);
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
    
    if (gameState.isInQueue) {
        console.log('ℹ️ Allaqachon navbatdasiz');
        return;
    }
    
    console.log('🚀 Navbatga kirish...');
    gameState.isInQueue = true;
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('enter_queue');
    } else {
        connectToServer();
    }
    
    showScreen('queue');
}

function leaveQueue() {
    console.log('🚪 Navbatdan chiqish...');
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.isInChat = false;
    gameState.currentDuelId = null;
    gameState.currentOpponent = null;
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
    
    showScreen('welcome');
    showNotification('🚪', 'Navbatdan chiqdingiz');
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    
    saveUserStateToLocalStorage();
    
    // Gender badge qo'shish
    addGenderBadge(document.getElementById('myName'), gender);
    addGenderBadge(document.getElementById('profileName'), gender);
    
    // Start tugmasini yoqish
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = '🎮 O\'yinni Boshlash';
        startBtn.classList.remove('disabled');
    }
    
    hideGenderModal();
    
    // Serverga gender tanlaganligini bildirish
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { gender: gender });
    } else {
        // Agar socket ulanmagan bo'lsa, ulanish
        connectToServer();
    }
    
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
}

// ==================== MODAL FUNKSIYALARI ====================
function showGenderModal(mandatory = true) {
    document.getElementById('genderModal').classList.add('active');
    if (mandatory) {
        document.getElementById('mandatoryWarning').style.display = 'block';
    }
}

function hideGenderModal() {
    document.getElementById('genderModal').classList.remove('active');
    document.getElementById('mandatoryWarning').style.display = 'none';
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    ['welcomeScreen', 'queueScreen', 'duelScreen', 'matchScreen'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(screen + 'Screen').classList.remove('hidden');
}

// ==================== TIMER FUNKSIYASI ====================
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    
    const timer = document.getElementById('timer');
    timer.textContent = 20;
    timer.style.color = '#fff';
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        timer.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 5) {
            timer.style.color = '#ff4444';
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
        }
    }, 1000);
}

// ==================== OVOZ BERISH FUNKSIYALARI ====================
function enableVoteButtons() {
    ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
        const btn = document.getElementById(id);
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
}

function disableVoteButtonsExcept(voteType) {
    // voteType: 'skip', 'like', 'super_like' yoki null
    const buttons = {
        'skip': document.getElementById('noBtn'),
        'like': document.getElementById('likeBtn'),
        'super_like': document.getElementById('superLikeBtn')
    };
    
    Object.entries(buttons).forEach(([type, btn]) => {
        if (btn) {
            if (type === voteType) {
                // Bosilgan tugmani bloklash
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else if (voteType === null) {
                // Barcha tugmalarni bloklash (ovoz berilgandan keyin)
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        }
    });
}

let lastVoteTime = 0;
const VOTE_COOLDOWN = 300;

function handleVote(choice) {
    const now = Date.now();
    if (now - lastVoteTime < VOTE_COOLDOWN) {
        console.log('⚠️ Ovoz berish tezligi cheklangan');
        return;
    }
    
    lastVoteTime = now;
    
    if (!gameState.socket || !gameState.isInDuel || !gameState.currentDuelId) {
        console.log('❌ Vote qilish mumkin emas');
        return;
    }
    
    // SUPER LIKE limit tekshirish
    if (choice === 'super_like' && userState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        return;
    }
    
    // Faqat bosilgan tugmani bloklash
    disableVoteButtonsExcept(choice);
    
    console.log(`🗳️ Ovoz berish: ${choice} (duel: ${gameState.currentDuelId.substring(0, 10)}...)`);
    gameState.socket.emit('vote', { 
        duelId: gameState.currentDuelId, 
        choice: choice 
    });
    
    // Timer textni o'zgartirish
    const timer = document.getElementById('timer');
    const duelStatus = document.getElementById('duelStatus');
    
    if (choice === 'like') {
        timer.textContent = '❤️';
        if (duelStatus) duelStatus.textContent = 'LIKE berdingiz...';
    } else if (choice === 'super_like') {
        timer.textContent = '💖';
        if (duelStatus) duelStatus.textContent = 'SUPER LIKE!';
        
        // Super like count ni kamaytirish
        userState.dailySuperLikes = Math.max(0, userState.dailySuperLikes - 1);
        updateStats();
    } else {
        timer.textContent = '✖';
        if (duelStatus) duelStatus.textContent = 'O\'tkazib yubordingiz...';
    }
}

// ==================== MATCH HANDLER ====================
function handleMatch(data) {
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentPartner = data.partner;
    showScreen('match');
    
    // Partner ma'lumotlarini ko'rsatish
    document.getElementById('partnerName').textContent = data.partner.name;
    document.getElementById('partnerNameText').textContent = data.partner.name;
    document.getElementById('partnerAvatar').src = data.partner.photo;
    
    // Agar username bo'lsa, ko'rsatish
    const partnerUsername = document.getElementById('partnerUsername');
    if (partnerUsername && data.partner.username) {
        partnerUsername.textContent = '@' + data.partner.username;
        partnerUsername.style.display = 'block';
    }
    
    // Gender badge
    const partnerGender = document.getElementById('partnerGender');
    if (partnerGender) {
        partnerGender.innerHTML = data.partner.gender === 'male' ? 
            '<i class="fas fa-mars"></i> Erkak' : 
            '<i class="fas fa-venus"></i> Ayol';
    }
    
    // Mukofotlarni ko'rsatish
    document.getElementById('rewardCoins').textContent = data.rewards.coins;
    document.getElementById('rewardXP').textContent = data.rewards.xp;
    document.getElementById('newRating').textContent = data.newRating;
    
    // Mukofotlarni qo'shish
    userState.coins += data.rewards.coins;
    userState.xp += data.rewards.xp;
    userState.matches++;
    userState.duels++;
    userState.wins++;
    userState.totalLikes++;
    
    // Rating yangilash
    userState.rating = data.newRating;
    
    // Level tekshirish
    const neededXP = userState.level * 100;
    if (userState.xp >= neededXP) {
        userState.level++;
        userState.xp -= neededXP;
        showNotification('🎊 Level Up!', `Siz ${userState.level}-levelga chiqdingiz!`);
    }
    
    saveUserStateToLocalStorage();
    updateStats();
    
    // Tugmalarni yaratish
    const matchOptions = document.getElementById('matchOptions');
    matchOptions.innerHTML = '';
    
    // Telegram tugmasi (agar username bo'lsa)
    if (data.partner.username && !data.partner.username.includes('_') && data.partner.username.length > 3) {
        const telegramBtn = document.createElement('button');
        telegramBtn.className = 'match-option-btn';
        telegramBtn.style.background = '#0088cc';
        telegramBtn.innerHTML = `
            <i class="fab fa-telegram"></i> Telegramga o'tish
            <span style="font-size: 0.8rem; opacity: 0.8;">@${data.partner.username}</span>
        `;
        telegramBtn.onclick = () => {
            window.open(`https://t.me/${data.partner.username}`, '_blank');
        };
        matchOptions.appendChild(telegramBtn);
    }
    
    // Chat tugmasi
    const chatBtn = document.createElement('button');
    chatBtn.className = 'match-option-btn';
    chatBtn.style.background = '#2ecc71';
    chatBtn.innerHTML = '<i class="fas fa-comments"></i> Chat';
    chatBtn.onclick = () => {
        if (gameState.socket && gameState.isConnected && gameState.currentDuelId) {
            console.log('💬 Chat so\'rovi yuborilmoqda...');
            gameState.socket.emit('chat_request', { 
                duelId: gameState.currentDuelId 
            });
            
            // Loading holatini ko'rsatish
            matchOptions.innerHTML = '<div style="padding: 20px; text-align: center;">Raqib javobini kutish...</div>';
        }
    };
    matchOptions.appendChild(chatBtn);
    
    // O'tkazish tugmasi
    const skipBtn = document.createElement('button');
    skipBtn.className = 'match-option-btn';
    skipBtn.style.background = '#ff6b6b';
    skipBtn.innerHTML = '<i class="fas fa-forward"></i> Keyingisi';
    skipBtn.onclick = () => {
        if (gameState.socket && gameState.isConnected && gameState.currentDuelId) {
            gameState.socket.emit('skip_chat', { 
                duelId: gameState.currentDuelId 
            });
            returnToQueue();
        }
    };
    matchOptions.appendChild(skipBtn);
    
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
    gameState.currentOpponent = null;
    
    showScreen('queue');
    document.getElementById('queueStatus').textContent = 'Yangi raqib izlanmoqda...';
    
    // Yangi duel qidirish
    setTimeout(() => {
        if (userState.hasSelectedGender) {
            enterQueue();
        }
    }, 1000);
}

// ==================== CHAT FUNKSIYALARI ====================
function openChat(data) {
    gameState.isInChat = true;
    gameState.currentChatId = data.chatId;
    gameState.isInDuel = false;
    gameState.isInQueue = false;
    
    const chatModal = document.getElementById('chatModal');
    chatModal.classList.add('active');
    
    document.getElementById('chatPartnerAvatar').src = data.partner.photo;
    document.getElementById('chatPartnerName').textContent = data.partner.name;
    
    const chatMessages = document.getElementById('chatMessages');
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
    
    // Match ekranini yashirish
    document.getElementById('matchScreen').classList.add('hidden');
    
    // Chat inputni focus qilish
    setTimeout(() => {
        const chatInput = document.getElementById('chatInput');
        chatInput.focus();
        chatInput.value = '';
    }, 300);
    
    showNotification('💬 Chat', `${data.partner.name} bilan chat boshlandi!`);
}

function closeChat() {
    document.getElementById('chatModal').classList.remove('active');
    gameState.isInChat = false;
    gameState.currentChatId = null;
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) {
        return;
    }
    
    if (!gameState.currentChatId) {
        showNotification('Xato', 'Chat topilmadi');
        return;
    }
    
    chatInput.value = '';
    
    if (gameState.socket && gameState.isConnected) {
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
    }
}

function displayChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    
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
    
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Like Duel - MUKAMMAL VERSIYA 3.0 DOM yuklandi');
    
    // Profilni yuklash
    initUserProfile();
    
    // ==================== EVENT LISTENERS ====================
    
    // Start button
    document.getElementById('startBtn').addEventListener('click', () => {
        if (!userState.hasSelectedGender) {
            showGenderModal(true);
            showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
            return;
        }
        
        if (!gameState.isConnected) {
            connectToServer();
        } else {
            enterQueue();
        }
    });
    
    // Leave queue button
    document.getElementById('leaveQueueBtn').addEventListener('click', leaveQueue);
    
    // Refresh queue button
    document.getElementById('refreshQueueBtn').addEventListener('click', () => {
        if (gameState.socket && gameState.isConnected) {
            gameState.socket.emit('enter_queue');
        }
    });
    
    // Select gender now button
    document.getElementById('selectGenderNowBtn').addEventListener('click', () => {
        showGenderModal(true);
    });
    
    // Gender tanlash tugmalari
    document.querySelectorAll('.gender-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const gender = btn.getAttribute('data-gender');
            selectGender(gender);
        });
    });
    
    // Gender option cardlar
    document.querySelectorAll('.gender-option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const gender = card.getAttribute('data-gender');
            selectGender(gender);
        });
    });
    
    // Close gender modal
    document.getElementById('closeGenderModal').addEventListener('click', hideGenderModal);
    
    // Ovoz berish tugmalari
    document.getElementById('noBtn').addEventListener('click', () => handleVote('skip'));
    document.getElementById('likeBtn').addEventListener('click', () => handleVote('like'));
    document.getElementById('superLikeBtn').addEventListener('click', () => handleVote('super_like'));
    
    // Chat funksiyalari
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
    
    document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
    document.getElementById('closeChatBtn').addEventListener('click', () => {
        if (gameState.socket && gameState.isConnected && gameState.currentChatId) {
            gameState.socket.emit('leave_chat', { chatId: gameState.currentChatId });
        }
        closeChat();
        returnToQueue();
    });
    
    document.getElementById('leaveChatBtn').addEventListener('click', () => {
        if (gameState.socket && gameState.isConnected && gameState.currentChatId) {
            gameState.socket.emit('leave_chat', { chatId: gameState.currentChatId });
        }
        closeChat();
        returnToQueue();
    });
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Faqat welcome yoki queue ekranlarida navigation ishlaydi
            if (gameState.isInDuel || gameState.isInChat) {
                showNotification('Diqqat', 'Duel yoki chat davom etayotganida menyu o\'zgartirib bo\'lmaydi');
                return;
            }
            
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
    
    // Profile edit
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('profileEditModal').classList.add('active');
    });
    
    document.getElementById('closeProfileEditModal').addEventListener('click', () => {
        document.getElementById('profileEditModal').classList.remove('active');
    });
    
    document.getElementById('cancelProfileEdit').addEventListener('click', () => {
        document.getElementById('profileEditModal').classList.remove('active');
    });
    
    document.getElementById('saveProfileBtn').addEventListener('click', () => {
        const firstName = document.getElementById('editFirstName').value;
        const username = document.getElementById('editUsername').value;
        const bio = document.getElementById('editBio').value;
        const gender = document.getElementById('editGender').value;
        
        if (firstName) {
            userState.userName = firstName;
            document.getElementById('myName').textContent = firstName;
            document.getElementById('profileName').textContent = firstName;
        }
        
        if (username) {
            document.getElementById('myUsername').textContent = '@' + username;
            document.getElementById('profileUsername').textContent = '@' + username;
        }
        
        if (bio) {
            userState.userBio = bio;
            document.getElementById('profileBioText').textContent = bio;
        }
        
        if (gender && gender !== userState.currentGender) {
            userState.currentGender = gender;
            addGenderBadge(document.getElementById('myName'), gender);
            addGenderBadge(document.getElementById('profileName'), gender);
        }
        
        saveUserStateToLocalStorage();
        document.getElementById('profileEditModal').classList.remove('active');
        showNotification('✅ Profil yangilandi', 'Profil muvaffaqiyatli yangilandi');
    });
    
    // Edit bio button
    document.getElementById('editBioBtn').addEventListener('click', () => {
        document.getElementById('editBio').value = userState.userBio;
        document.getElementById('profileEditModal').classList.add('active');
    });
    
    // Test rejimi uchun
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Test rejimi faollashtirildi');
        setTimeout(() => {
            if (!userState.hasSelectedGender) {
                showGenderModal(true);
            }
        }, 2000);
    }
});

// ==================== STYLE QO'SHISH ====================
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
    
    .vote-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
        transform: none !important;
    }
    
    .match-option-btn {
        width: 100%;
        padding: 15px;
        margin-bottom: 10px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    
    .match-option-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    /* Chat styles */
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
        padding: 10px 15px;
        border-radius: 15px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .chat-message.own .chat-message-content {
        background: #667eea;
        color: white;
        border-bottom-right-radius: 5px;
    }
    
    .chat-message.other .chat-message-content {
        background: #f0f0f0;
        border-bottom-left-radius: 5px;
    }
    
    .chat-message-sender {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 5px;
        opacity: 0.8;
    }
    
    .chat-message-text {
        font-size: 14px;
        line-height: 1.4;
        word-break: break-word;
    }
    
    .chat-message-time {
        font-size: 10px;
        text-align: right;
        margin-top: 5px;
        opacity: 0.6;
    }
    
    .notification-container {
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
    
    .notification-container.active {
        transform: translateX(0);
    }
    
    .modal-overlay.active {
        opacity: 1;
        visibility: visible;
    }
`;

document.head.appendChild(style);

console.log('✅ main.js to\'liq yuklandi');