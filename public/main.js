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
    isVoting: false,
    matchCompleted: false,
    isProcessingMatch: false,
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    hapticEnabled: localStorage.getItem('hapticEnabled') !== 'false' && 'vibrate' in navigator,
    theme: localStorage.getItem('appTheme') || 'dark'
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
    friendsCount: parseInt(localStorage.getItem('friendsCount')) || 0,
    telegramUsername: null
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    // Asosiy ekranlar
    welcomeScreen: document.getElementById('welcomeScreen'),
    queueScreen: document.getElementById('queueScreen'),
    duelScreen: document.getElementById('duelScreen'),
    matchScreen: document.getElementById('matchScreen'),
    
    // Yangi elementlar
    modernHeaderCoins: document.getElementById('headerCoins'),
    modernHeaderLevel: document.getElementById('headerLevel'),
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    myLikes: document.getElementById('myLikes'),
    mutualMatchesCount: document.getElementById('mutualMatchesCount'),
    myGenderBadge: document.getElementById('myGenderBadge'),
    
    // Filter chips
    filterChips: document.querySelectorAll('.filter-chip'),
    
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
    liquidTimer: document.getElementById('liquidTimer'),
    timerDisplay: document.querySelector('.timer-display'),
    duelStatus: document.getElementById('duelStatus'),
    superLikeCount: document.getElementById('superLikeCount'),
    matchStreak: document.getElementById('matchStreak'),
    
    // Tugmalar
    startBtn: document.getElementById('startBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    refreshFriendsBtn: document.getElementById('refreshFriendsBtn'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
    // Match elementlari
    partnerName: document.getElementById('partnerName'),
    partnerAvatar: document.getElementById('partnerAvatar'),
    matchText: document.getElementById('matchText'),
    matchRewards: document.getElementById('matchRewards'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    matchOptions: document.getElementById('matchOptions'),
    mutualInterests: document.getElementById('mutualInterests'),
    matchType: document.getElementById('matchType'),
    
    // Profil elementlari
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
    
    // Tab elementlari
    contentTabs: document.querySelectorAll('.content-tab'),
    floatingNavBtns: document.querySelectorAll('.floating-btn'),
    
    // Notification
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    
    // Modallar
    genderModal: document.getElementById('genderModal'),
    chatModal: document.getElementById('chatModal'),
    profileEditModal: document.getElementById('profileEditModal'),
    
    // Audio elementlari
    likeSound: document.getElementById('likeSound'),
    matchSound: document.getElementById('matchSound'),
    clickSound: document.getElementById('clickSound')
};

// ==================== SOUND MANAGER ====================
class SoundManager {
    static play(soundName) {
        if (!gameState.soundEnabled) return;
        
        const sounds = {
            like: elements.likeSound,
            match: elements.matchSound,
            click: elements.clickSound
        };
        
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    static toggle() {
        gameState.soundEnabled = !gameState.soundEnabled;
        localStorage.setItem('soundEnabled', gameState.soundEnabled);
        return gameState.soundEnabled;
    }
}

// ==================== HAPTIC MANAGER ====================
class HapticManager {
    static vibrate(pattern = [50]) {
        if (!gameState.hapticEnabled) return;
        
        try {
            if ('vibrate' in navigator) {
                navigator.vibrate(pattern);
            }
        } catch (e) {
            console.log('Vibration not supported');
        }
    }
    
    static likeVibration() {
        this.vibrate([30, 50, 30]);
    }
    
    static matchVibration() {
        this.vibrate([100, 50, 100, 50, 100]);
    }
    
    static toggle() {
        gameState.hapticEnabled = !gameState.hapticEnabled;
        localStorage.setItem('hapticEnabled', gameState.hapticEnabled);
        return gameState.hapticEnabled;
    }
}

// ==================== THEME MANAGER ====================
class ThemeManager {
    static themes = {
        dark: {
            '--dark-bg': '#0f0f23',
            '--card-bg': 'rgba(255, 255, 255, 0.08)',
            '--card-border': 'rgba(255, 255, 255, 0.1)',
            '--text-primary': '#ffffff',
            '--text-secondary': 'rgba(255, 255, 255, 0.7)'
        },
        light: {
            '--dark-bg': '#f8f9fa',
            '--card-bg': 'rgba(255, 255, 255, 0.9)',
            '--card-border': 'rgba(0, 0, 0, 0.1)',
            '--text-primary': '#333333',
            '--text-secondary': 'rgba(0, 0, 0, 0.6)'
        }
    };
    
    static applyTheme(themeName) {
        const theme = this.themes[themeName] || this.themes.dark;
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
        gameState.theme = themeName;
        localStorage.setItem('appTheme', themeName);
    }
}

// ==================== ANIMATION MANAGER ====================
class AnimationManager {
    static createBubble(x, y, text, color) {
        const bubble = document.createElement('div');
        bubble.className = 'feedback-bubble';
        bubble.textContent = text;
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        bubble.style.color = color;
        bubble.style.position = 'fixed';
        bubble.style.zIndex = '9999';
        bubble.style.fontWeight = 'bold';
        bubble.style.pointerEvents = 'none';
        
        document.body.appendChild(bubble);
        
        // Animate
        const animation = bubble.animate([
            { transform: 'translateY(0) scale(0.8)', opacity: 0 },
            { transform: 'translateY(-30px) scale(1.2)', opacity: 1 },
            { transform: 'translateY(-60px) scale(1)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
        });
        
        animation.onfinish = () => bubble.remove();
    }
    
    static animateTimerLiquid(seconds) {
        const liquidFill = document.querySelector('.liquid-fill');
        if (!liquidFill) return;
        
        const percentage = (20 - seconds) / 20 * 100;
        liquidFill.style.height = `${percentage}%`;
        
        // Change color based on time
        if (seconds <= 5) {
            liquidFill.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #c44569 100%)';
        } else if (seconds <= 10) {
            liquidFill.style.background = 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)';
        } else {
            liquidFill.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }
}

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
            
            // Telegram rang mavzusiga moslashish
            const themeParams = Telegram.WebApp.themeParams;
            if (themeParams && themeParams.bg_color) {
                document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color);
                document.documentElement.style.setProperty('--text-primary', themeParams.text_color || '#333');
            }
        }
    } catch (error) {
        console.log('ℹ️ Telegram Web App mavjud emas, test rejimida');
        tgUser = {
            id: 'test_' + Date.now(),
            first_name: 'Test Foydalanuvchi',
            username: 'test_user',
            photo_url: null
        };
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
    
    // Asosiy avatar elementlarini yangilash
    const avatarElements = [
        elements.myAvatar,
        elements.profileAvatar,
        elements.partnerAvatar
    ];
    
    avatarElements.forEach(el => {
        if (el) el.src = userPhoto;
    });
    
    // Ism elementlarini yangilash
    if (elements.myName) elements.myName.textContent = userName;
    if (elements.profileName) elements.profileName.textContent = userName;
    if (elements.myUsername) elements.myUsername.textContent = userUsername;
    if (elements.profileUsername) elements.profileUsername.textContent = userUsername;
    
    tgUserGlobal = tgUser;
    
    // UI ni yangilash
    updateUIFromUserState();
    
    // Theme ni apply qilish
    ThemeManager.applyTheme(gameState.theme);
    
    // Agar gender tanlanmagan bo'lsa, modalni ko'rsatish
    if (!userState.hasSelectedGender) {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        setTimeout(() => {
            showGenderModal(true);
        }, 1000);
    }
    
    // Filter chips larni setup qilish
    setupFilterChips();
    
    // Floating nav setup
    setupFloatingNav();
    
    // Daily spin check
    checkDailySpin();
    
    return tgUser;
}

// ==================== UI YANGILASH ====================
function updateUIFromUserState() {
    console.log('🎨 UI yangilanmoqda...');
    
    // Header statlari
    if (elements.modernHeaderCoins) elements.modernHeaderCoins.textContent = userState.coins;
    if (elements.modernHeaderLevel) elements.modernHeaderLevel.textContent = userState.level;
    
    // Gender badge
    if (elements.myGenderBadge) {
        let genderEmoji = '👥';
        if (userState.currentGender === 'male') genderEmoji = '👨';
        else if (userState.currentGender === 'female') genderEmoji = '👩';
        elements.myGenderBadge.textContent = genderEmoji;
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
    
    // Win rate
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
            elements.startBtn.textContent = '🎮 Duel Boshlash';
            elements.startBtn.classList.remove('disabled');
        } else {
            elements.startBtn.disabled = true;
            elements.startBtn.textContent = 'Avval gender tanlang';
            elements.startBtn.classList.add('disabled');
        }
    }
    
    // Filter sozlamasini yangilash
    gameState.currentFilter = userState.filter;
    
    // Filter chips larni yangilash
    updateFilterChips();
    
    // Save to localStorage
    saveUserStateToLocalStorage();
}

// ==================== FILTER CHIPS ====================
function setupFilterChips() {
    elements.filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filter = chip.dataset.filter;
            toggleFilter(filter);
        });
    });
}

function updateFilterChips() {
    elements.filterChips.forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.filter === gameState.currentFilter) {
            chip.classList.add('active');
        }
    });
}

function toggleFilter(filter) {
    console.log(`🎯 Filter o'zgartirish: ${filter}`);
    
    const oldFilter = gameState.currentFilter;
    gameState.currentFilter = filter;
    userState.filter = filter;
    
    // UI yangilash
    updateFilterChips();
    
    // Serverga yangilash
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('update_profile', { filter: filter });
        
        // Agar navbatda bo'lsa, qayta kiritish
        if (gameState.isInQueue && oldFilter !== filter) {
            gameState.socket.emit('leave_queue');
            setTimeout(() => {
                gameState.socket.emit('enter_queue');
            }, 500);
        }
    }
    
    // Kichik bildirishnoma
    showNotification('Filter o\'zgartirildi', 
        filter === 'male' ? 'Faqat erkaklar bilan' : 
        filter === 'female' ? 'Faqat ayollar bilan' : 
        'Hamma bilan');
        
    // Sound effect
    SoundManager.play('click');
    HapticManager.vibrate([30]);
}

// ==================== FLOATING NAV ====================
function setupFloatingNav() {
    elements.floatingNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    console.log(`📱 Tab o'zgartirildi: ${tabName}`);
    
    // Remove active class from all
    elements.floatingNavBtns.forEach(btn => btn.classList.remove('active'));
    elements.contentTabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to selected
    const selectedBtn = document.querySelector(`.floating-btn[data-tab="${tabName}"]`);
    const selectedTab = document.getElementById(`${tabName}Tab`);
    
    if (selectedBtn) selectedBtn.classList.add('active');
    if (selectedTab) selectedTab.classList.add('active');
    
    gameState.currentTab = tabName;
    
    // Sound effect
    SoundManager.play('click');
    HapticManager.vibrate([30]);
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    userState.filter = gender === 'not_specified' ? 'not_specified' : gender;
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    hideGenderModal();
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { 
            gender: gender,
            filter: userState.filter
        });
    } else {
        connectToServer();
    }
    
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
        
    SoundManager.play('match');
}

// ==================== MODAL FUNKSIYALARI ====================
function showGenderModal(mandatory = true) {
    console.log(`🎯 Gender modali ko'rsatilmoqda`);
    
    if (!elements.genderModal) return;
    
    elements.genderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideGenderModal() {
    if (elements.genderModal) {
        elements.genderModal.classList.remove('active');
    }
    document.body.style.overflow = '';
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
        timeout: 20000
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
        gameState.isProcessingMatch = false;
        showScreen('queue');
        updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
        
        // Countdown boshlash
        startQueueCountdown();
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
        gameState.currentDuelId = data.duelId;
        gameState.isVoting = false;
        gameState.matchCompleted = false;
        gameState.isProcessingMatch = false;
        
        showScreen('duel');
        
        // Oldingi taymerlarni to'xtatamiz
        clearInterval(gameState.timerInterval);
        
        // Raqib ma'lumotlarini yangilash
        if (elements.opponentAvatar) {
            elements.opponentAvatar.src = data.opponent.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.opponent.name || 'O')}&background=${data.opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
        }
        if (elements.opponentName) {
            elements.opponentName.innerHTML = data.opponent.name;
        }
        if (elements.opponentUsername) elements.opponentUsername.textContent = data.opponent.username || '';
        if (elements.opponentRating) elements.opponentRating.textContent = data.opponent.rating || 1500;
        if (elements.opponentMatches) elements.opponentMatches.textContent = data.opponent.matches || 0;
        if (elements.opponentLevel) elements.opponentLevel.textContent = data.opponent.level || 1;
        
        // Match streak ni ko'rsatish
        if (elements.matchStreak) {
            const streak = getMatchStreak(data.opponent.id);
            if (streak > 1) {
                elements.matchStreak.textContent = `🔥${streak}`;
                elements.matchStreak.style.display = 'block';
            } else {
                elements.matchStreak.style.display = 'none';
            }
        }
        
        // Liquid timer ni boshlash
        startLiquidTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
        
        // Tugmalarni yoqamiz
        [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
            }
        });
        
        if (elements.noBtn) {
            elements.noBtn.querySelector('.btn-icon').textContent = '✖';
        }
        
        // Sound effect
        SoundManager.play('click');
    });
    
    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        
        if (gameState.isProcessingMatch) {
            console.log('⚠️ Match allaqachon qayta ishlanmoqda');
            return;
        }
        
        gameState.isProcessingMatch = true;
        handleMatch(data);
    });
    
    gameState.socket.on('mutual_match', (data) => {
        console.log('🤝 O\'zaro Match qo\'shildi:', data);
        
        userState.mutualMatchesCount = data.mutualMatchesCount;
        userState.friendsCount = data.friendsCount;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification('🎉 DO\'ST BO\'LDINGIZ!', 
            `${data.partnerName} bilan o'zaro match!`);
            
        SoundManager.play('match');
        HapticManager.matchVibration();
    });
    
    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        
        if (gameState.isProcessingMatch) {
            console.log('⚠️ Match qayta ishlanmoqda');
            return;
        }
        
        handleLikedOnly(data);
    });
    
    gameState.socket.on('no_match', (data) => {
        console.log('❌ Match bo\'lmadi');
        
        if (gameState.isProcessingMatch) {
            console.log('⚠️ Match qayta ishlanmoqda');
            return;
        }
        
        handleNoMatch(data);
    });
    
    gameState.socket.on('timeout', (data) => {
        console.log('⏰ Vaqt tugadi');
        
        if (gameState.isProcessingMatch) {
            console.log('⚠️ Match qayta ishlanmoqda');
            return;
        }
        
        handleTimeout(data);
    });
    
    gameState.socket.on('waiting_response', (data) => {
        console.log('⏳ Raqib javobini kutish:', data);
        
        if (gameState.isProcessingMatch) {
            console.log('⚠️ Match qayta ishlanmoqda');
            return;
        }
        
        handleWaitingResponse(data);
    });
    
    gameState.socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        
        if (gameState.isProcessingMatch) {
            console.log('⚠️ Match qayta ishlanmoqda');
            return;
        }
        
        clearInterval(gameState.timerInterval);
        updateDuelStatus('Raqib chiqib ketdi. Keyingi duelga tayyormisiz?');
        
        setTimeout(() => {
            skipToNextDuel();
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
        gameState.isProcessingMatch = false;
        
        updateQueueStatus('Ulanish uzildi. Qayta ulanmoqda...');
        
        setTimeout(() => {
            if (!gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                connectToServer();
            }
        }, 5000);
    });
}

// ==================== USER STATE LOCALSTORAGE ====================
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
    
    if (gameState.isVoting) {
        console.log('⚠️ Ovoz berish jarayonida');
        return;
    }
    
    console.log(`🗳️ Ovoz berish: ${choice}`);
    
    gameState.isVoting = true;
    
    // Tugmalarni disable qilamiz
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
        gameState.isVoting = false;
        return;
    }
    
    // Feedback animation
    let button;
    if (choice === 'like') button = elements.likeBtn;
    else if (choice === 'super_like') button = elements.superLikeBtn;
    else button = elements.noBtn;
    
    if (button) {
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        let message = '', color = '';
        if (choice === 'like') {
            message = 'Feeling the Spark!';
            color = '#ff6b8b';
            SoundManager.play('like');
            HapticManager.likeVibration();
        } else if (choice === 'super_like') {
            message = 'SUPER LIKE!';
            color = '#f5576c';
            SoundManager.play('match');
            HapticManager.matchVibration();
        } else {
            message = 'Skipped!';
            color = '#ff6b6b';
            SoundManager.play('click');
            HapticManager.vibrate([30]);
        }
        
        AnimationManager.createBubble(x, y, message, color);
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
        if (elements.timerDisplay) elements.timerDisplay.textContent = '❤️';
        updateDuelStatus('LIKE berdingiz. Raqib javobini kutish...');
    } else if (choice === 'super_like') {
        if (elements.timerDisplay) elements.timerDisplay.textContent = '💖';
        updateDuelStatus('SUPER LIKE! Raqib javobini kutish...');
        userState.dailySuperLikes--;
        if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
        saveUserStateToLocalStorage();
    } else if (choice === 'skip') {
        if (elements.timerDisplay) elements.timerDisplay.textContent = '✖';
        updateDuelStatus('O\'tkazib yubordingiz...');
        
        setTimeout(() => {
            if (gameState.socket && gameState.isConnected && !gameState.matchCompleted) {
                gameState.isVoting = false;
                gameState.socket.emit('enter_queue');
                showScreen('queue');
                updateQueueStatus('Yangi raqib qidirilmoqda...');
            }
        }, 1000);
    }
}

// ==================== TIMER FUNKSIYALARI ====================
function startLiquidTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    
    if (elements.timerDisplay) {
        elements.timerDisplay.textContent = 20;
    }
    
    AnimationManager.animateTimerLiquid(20);
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        
        if (elements.timerDisplay) {
            elements.timerDisplay.textContent = gameState.timeLeft;
        }
        
        AnimationManager.animateTimerLiquid(gameState.timeLeft);
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            if (gameState.socket && gameState.isInDuel && !gameState.isVoting && !gameState.matchCompleted) {
                gameState.socket.emit('vote', { 
                    duelId: gameState.currentDuelId, 
                    choice: 'skip' 
                });
                if (elements.timerDisplay) {
                    elements.timerDisplay.textContent = '⏰';
                }
                updateDuelStatus('Vaqt tugadi...');
                gameState.isVoting = true;
            }
        }
    }, 1000);
}

function startQueueCountdown() {
    const countdownProgress = document.querySelector('.countdown-progress');
    const countdownText = document.querySelector('.countdown-text');
    
    if (!countdownProgress || !countdownText) return;
    
    let time = 120; // 2 daqiqa
    countdownText.textContent = `${Math.floor(time/60)}:${(time%60).toString().padStart(2, '0')}`;
    
    const interval = setInterval(() => {
        time--;
        
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        countdownText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Progress yangilash
        const progress = ((120 - time) / 120) * 283;
        countdownProgress.style.strokeDashoffset = 283 - progress;
        
        if (time <= 0) {
            clearInterval(interval);
            countdownText.textContent = 'Vaqt tugadi';
        }
    }, 1000);
}

// ==================== KUTISH HOLATI ====================
function handleWaitingResponse(data) {
    console.log('⏳ Raqib javobini kutish...');
    
    clearInterval(gameState.timerInterval);
    gameState.waitingForOpponent = true;
    gameState.isVoting = false;
    
    gameState.timeLeft = 120;
    
    if (elements.timerDisplay) {
        elements.timerDisplay.textContent = '2:00';
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
    
    // O'tkazib yuborish tugmasini yoqamiz
    if (elements.noBtn) {
        elements.noBtn.disabled = false;
        elements.noBtn.style.opacity = '1';
        elements.noBtn.querySelector('.btn-icon').textContent = '⏭️';
        elements.noBtn.querySelector('.btn-label').textContent = 'Keyingisi';
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        
        if (elements.timerDisplay) {
            elements.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            handleOpponentTimeout();
        }
    }, 1000);
}

function handleOpponentTimeout() {
    console.log('⏰ Raqib javob bermadi');
    
    if (elements.timerDisplay) {
        elements.timerDisplay.textContent = '⏰';
    }
    
    updateDuelStatus('Raqib javob bermadi. O\'yinni tugatish?');
    
    if (elements.noBtn) {
        elements.noBtn.disabled = false;
        elements.noBtn.style.opacity = '1';
        elements.noBtn.querySelector('.btn-icon').textContent = '❌';
        elements.noBtn.querySelector('.btn-label').textContent = 'O\'yinni tugatish';
    }
}

// ==================== MATCH HANDLERS ====================
function handleMatch(data) {
    console.log('🎉 MATCH! Qayta ishlanmoqda:', data);
    
    gameState.matchCompleted = true;
    gameState.isProcessingMatch = true;
    
    clearInterval(gameState.timerInterval);
    
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = data.partner;
    gameState.lastOpponent = data.partner.id;
    gameState.waitingForOpponent = false;
    gameState.isVoting = false;
    
    showScreen('match');
    
    // Partner ma'lumotlarini yangilash
    if (elements.partnerName) {
        elements.partnerName.textContent = data.partner.name;
    }
    if (elements.partnerAvatar) {
        elements.partnerAvatar.src = data.partner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.partner.name)}&background=667eea&color=fff`;
    }
    
    // Match turini ko'rsatish
    if (elements.matchType) {
        elements.matchType.textContent = data.isMutual ? 'O\'ZARO MATCH!' : 'MATCH!';
    }
    
    // Mutual interests
    if (elements.mutualInterests && data.isMutual) {
        showMutualInterests(data.partner);
    }
    
    if (elements.rewardCoins) elements.rewardCoins.textContent = data.rewards.coins;
    if (elements.rewardXP) elements.rewardXP.textContent = data.rewards.xp;
    
    // Mukofotlarni qo'shamiz
    userState.coins += data.rewards.coins;
    userState.rating = data.newRating;
    userState.matches++;
    if (data.isMutual) {
        userState.mutualMatchesCount++;
        userState.friendsCount++;
    }
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    // Match option tugmalarini ko'rsatish
    if (elements.matchOptions) {
        elements.matchOptions.innerHTML = `
            <button class="action-btn chat-btn" onclick="openChat()">
                <i class="fas fa-comment"></i>
                Chatga o'tish
            </button>
            <button class="action-btn duel-btn" onclick="skipToNextDuel()">
                <i class="fas fa-redo"></i>
                Yangi Duel
            </button>
            <button class="action-btn menu-btn" onclick="returnToMenu()">
                <i class="fas fa-home"></i>
                Menyu
            </button>
        `;
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
    
    // Sound effects
    SoundManager.play('match');
    HapticManager.matchVibration();
    
    setTimeout(() => {
        gameState.isProcessingMatch = false;
        console.log('✅ Match qayta ishlash tugadi');
    }, 3000);
}

function handleLikedOnly(data) {
    console.log('❤️ Faqat siz like berdidingiz:', data);
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.isVoting = false;
    gameState.matchCompleted = false;
    gameState.isProcessingMatch = false;
    
    if (elements.timerDisplay) elements.timerDisplay.textContent = '❤️';
    
    if (data.reward) {
        userState.coins += data.reward.coins;
        userState.totalLikes++;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        showNotification('Like uchun mukofot', `+${data.reward.coins} coin`);
    }
    
    setTimeout(() => {
        skipToNextDuel();
    }, 2000);
}

function handleNoMatch(data) {
    console.log('❌ Match bo\'lmadi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.isVoting = false;
    gameState.matchCompleted = false;
    gameState.isProcessingMatch = false;
    
    if (elements.timerDisplay) elements.timerDisplay.textContent = '✖';
    
    setTimeout(() => {
        skipToNextDuel();
    }, 2000);
}

function handleTimeout(data) {
    console.log('⏰ Vaqt tugadi');
    
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.isVoting = false;
    gameState.matchCompleted = false;
    gameState.isProcessingMatch = false;
    
    if (elements.timerDisplay) elements.timerDisplay.textContent = '⏰';
    
    setTimeout(() => {
        skipToNextDuel();
    }, 2000);
}

function showMutualInterests(partner) {
    const interests = [];
    
    // Rating comparison
    if (Math.abs(userState.rating - (partner.rating || 1500)) <= 100) {
        interests.push('Reyting: 1500+');
    }
    
    // Matches comparison
    if (userState.matches >= 5 && (partner.matches || 0) >= 5) {
        interests.push('Match: 5+');
    }
    
    // Add random interests
    const allInterests = ['Premium foydalanuvchi', 'Faol o\'yinchi', 'Tajribali duelchi'];
    while (interests.length < 2 && allInterests.length > 0) {
        const randomIndex = Math.floor(Math.random() * allInterests.length);
        interests.push(allInterests[randomIndex]);
        allInterests.splice(randomIndex, 1);
    }
    
    if (elements.mutualInterests && interests.length > 0) {
        elements.mutualInterests.innerHTML = `
            <h4><i class="fas fa-handshake"></i> O'xshashliklar</h4>
            <div class="interest-tags">
                ${interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
            </div>
        `;
        elements.mutualInterests.style.display = 'block';
    }
}

// ==================== STREAK SYSTEM ====================
function getMatchStreak(opponentId) {
    const streaks = JSON.parse(localStorage.getItem('matchStreaks') || '{}');
    return streaks[opponentId] || 0;
}

function updateMatchStreak(opponentId) {
    const streaks = JSON.parse(localStorage.getItem('matchStreaks') || '{}');
    const lastOpponent = localStorage.getItem('lastMatchOpponent');
    
    if (lastOpponent === opponentId) {
        streaks[opponentId] = (streaks[opponentId] || 0) + 1;
    } else {
        streaks[opponentId] = 1;
    }
    
    localStorage.setItem('lastMatchOpponent', opponentId);
    localStorage.setItem('matchStreaks', JSON.stringify(streaks));
    
    return streaks[opponentId];
}

// ==================== CHAT FUNKSIYALARI ====================
function openChat() {
    if (!gameState.currentPartner) return;
    
    console.log('💬 Chat ochilmoqda:', gameState.currentPartner.name);
    
    const chatModal = document.getElementById('chatModal');
    if (!chatModal) return;
    
    // Chat modaldagi elementlarni yangilash
    const chatPartnerAvatar = chatModal.querySelector('#chatPartnerAvatar');
    const chatPartnerName = chatModal.querySelector('#chatPartnerName');
    const chatUsername = chatModal.querySelector('#chatUsername');
    
    if (chatPartnerAvatar) {
        chatPartnerAvatar.src = gameState.currentPartner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(gameState.currentPartner.name)}&background=667eea&color=fff`;
    }
    if (chatPartnerName) {
        chatPartnerName.textContent = gameState.currentPartner.name;
    }
    if (chatUsername && gameState.currentPartner.username) {
        chatUsername.textContent = `@${gameState.currentPartner.username}`;
    }
    
    gameState.isChatModalOpen = true;
    chatModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openTelegramChat() {
    if (!gameState.currentPartner || !gameState.currentPartner.username) {
        showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        return;
    }
    
    console.log('📱 Telegram chat ochilmoqda:', gameState.currentPartner.username);
    
    const telegramUrl = `https://t.me/${gameState.currentPartner.username.replace('@', '')}`;
    
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
        window.open(telegramUrl, '_blank');
    }
}

function closeChatModal() {
    console.log('❌ Chat yopilmoqda');
    
    gameState.isChatModalOpen = false;
    gameState.currentPartner = null;
    
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// ==================== NAVBATGA QAYTISH ====================
function skipToNextDuel() {
    console.log('🔄 Keyingi duelga o\'tish');
    
    if (gameState.isChatModalOpen) {
        closeChatModal();
    }
    
    clearInterval(gameState.timerInterval);
    
    // UI elementlarini reset qilamiz
    if (elements.timerDisplay) {
        elements.timerDisplay.textContent = '20';
    }
    
    const liquidFill = document.querySelector('.liquid-fill');
    if (liquidFill) {
        liquidFill.style.height = '0%';
        liquidFill.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    if (elements.noBtn) {
        elements.noBtn.querySelector('.btn-icon').textContent = '✖';
        elements.noBtn.querySelector('.btn-label').textContent = 'O\'tkazish';
    }
    
    // Tugmalarni yoqamiz
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = false;
            b.style.opacity = '1';
        }
    });
    
    // Holatlarni reset qilamiz
    gameState.waitingForOpponent = false;
    gameState.isVoting = false;
    gameState.currentPartner = null;
    gameState.matchCompleted = false;
    gameState.isProcessingMatch = false;
    
    if (gameState.socket && gameState.isConnected) {
        if (userState.hasSelectedGender) {
            gameState.isInQueue = true;
            gameState.isInDuel = false;
            gameState.currentDuelId = null;
            gameState.socket.emit('enter_queue');
            showScreen('queue');
        } else {
            showScreen('welcome');
        }
    } else {
        showScreen('welcome');
    }
}

function returnToMenu() {
    console.log('🏠 Bosh menyuga qaytish');
    
    closeChatModal();
    
    clearInterval(gameState.timerInterval);
    
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
    
    // Holatni reset qilamiz
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.isVoting = false;
    gameState.currentPartner = null;
    gameState.matchCompleted = false;
    gameState.isProcessingMatch = false;
    
    showScreen('welcome');
    
    showNotification('Bosh menyuga qaytildi', 'Yana o\'ynash uchun "Duel Boshlash" tugmasini bosing');
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
    
    // Barcha ekranlarni yashirish
    document.querySelectorAll('.welcome-screen, .queue-screen, .duel-screen, .match-screen').forEach(s => {
        s.classList.remove('active');
    });
    
    // Tanlangan ekranni ko'rsatish
    const screenElement = document.getElementById(`${screen}Screen`);
    if (screenElement) {
        screenElement.classList.add('active');
    }
    
    // Floating nav ni yangilash
    elements.floatingNavBtns.forEach(btn => {
        if (screen === 'welcome' && btn.dataset.tab === 'duel') {
            btn.classList.add('active');
        } else if (screen !== 'welcome') {
            btn.classList.remove('active');
        }
    });
}

// ==================== DAILY SPIN ====================
function checkDailySpin() {
    const lastSpin = localStorage.getItem('lastSpinDate');
    const today = new Date().toDateString();
    
    const spinBtn = document.getElementById('spinBtn');
    if (!spinBtn) return;
    
    if (lastSpin === today) {
        spinBtn.disabled = true;
        spinBtn.textContent = 'Ertaga kuting';
        spinBtn.style.opacity = '0.5';
    } else {
        spinBtn.disabled = false;
        spinBtn.textContent = 'Aylantirish';
        spinBtn.style.opacity = '1';
    }
}

function spinWheel() {
    const wheel = document.querySelector('.wheel-items');
    const spinBtn = document.getElementById('spinBtn');
    
    if (!wheel || !spinBtn || spinBtn.disabled) return;
    
    spinBtn.disabled = true;
    spinBtn.textContent = 'Aylanmoqda...';
    
    // Calculate random rotation
    const fullRotations = 3 + Math.floor(Math.random() * 2);
    const itemAngle = 60;
    const randomItem = Math.floor(Math.random() * 6);
    const targetRotation = (fullRotations * 360) + (randomItem * itemAngle);
    
    // Animate
    wheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.3, 1)';
    wheel.style.transform = `rotate(${targetRotation}deg)`;
    
    // Get reward
    setTimeout(() => {
        const rewards = ['50', '100', 'SUPER LIKE', 'VIP', '20', '75'];
        const reward = rewards[randomItem];
        giveSpinReward(reward);
        
        // Save spin date
        localStorage.setItem('lastSpinDate', new Date().toDateString());
        
        setTimeout(() => {
            spinBtn.textContent = 'Ertaga kuting';
            spinBtn.style.opacity = '0.5';
        }, 1000);
    }, 4000);
}

function giveSpinReward(reward) {
    let message = '';
    
    switch(reward) {
        case 'SUPER LIKE':
            message = '🎉 Kunlik Super Like +1!';
            userState.dailySuperLikes++;
            break;
        case 'VIP':
            message = '👑 24 soatlik VIP status!';
            // VIP status aktivlashtirish
            break;
        default:
            const coins = parseInt(reward);
            message = `🪙 ${coins} coin yutib oldingiz!`;
            userState.coins += coins;
    }
    
    saveUserStateToLocalStorage();
    updateUIFromUserState();
    
    showNotification('🎁 Sovg\'a', message);
    SoundManager.play('match');
    HapticManager.matchVibration();
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
    gameState.isVoting = false;
    gameState.matchCompleted = false;
    gameState.isProcessingMatch = false;
    clearInterval(gameState.timerInterval);
    
    showScreen('welcome');
    
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "Duel Boshlash" tugmasini bosing');
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Profilni yuklash
    initUserProfile();
    
    // Gender tugmalarini ishga tushirish
    document.querySelectorAll('.gender-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const gender = btn.classList.contains('gender-male') ? 'male' :
                          btn.classList.contains('gender-female') ? 'female' : 'not_specified';
            selectGender(gender);
        });
    });
    
    // Event listener'lar
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    if (elements.leaveQueueBtn) {
        elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    if (elements.noBtn) {
        elements.noBtn.addEventListener('click', () => {
            if (gameState.waitingForOpponent) {
                skipToNextDuel();
            } else {
                handleVote('skip');
            }
        });
    }
    
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', () => {
            handleVote('like');
        });
    }
    
    if (elements.superLikeBtn) {
        elements.superLikeBtn.addEventListener('click', () => {
            handleVote('super_like');
        });
    }
    
    // Spin wheel
    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) {
        spinBtn.addEventListener('click', spinWheel);
    }
    
    // Modal yopish tugmalari
    document.querySelectorAll('.modal-overlay, [data-close-modal]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.target.closest('.modal')?.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Edit profile
    if (elements.editProfileBtn) {
        elements.editProfileBtn.addEventListener('click', () => {
            const modal = document.getElementById('profileEditModal');
            if (modal) modal.classList.add('active');
        });
    }
    
    if (elements.saveProfileBtn) {
        elements.saveProfileBtn.addEventListener('click', () => {
            const bio = document.getElementById('editBio')?.value.trim() || '';
            const gender = document.getElementById('editGender')?.value || 'not_specified';
            const filter = document.getElementById('editFilter')?.value || 'not_specified';
            
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
            }
            
            const modal = document.getElementById('profileEditModal');
            if (modal) modal.classList.remove('active');
            
            showNotification('✅ Profil yangilandi', 'O\'zgarishlar saqlandi');
        });
    }
    
    // Chat modal
    const closeChatBtn = document.getElementById('closeChatBtn');
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', closeChatModal);
    }
    
    const chatOpenTelegramBtn = document.getElementById('chatOpenTelegramBtn');
    if (chatOpenTelegramBtn) {
        chatOpenTelegramBtn.addEventListener('click', openTelegramChat);
    }
    
    console.log('✅ main.js to\'liq yuklandi');
});