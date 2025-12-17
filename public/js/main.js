// main.js - LIKE DUEL FRONTEND
console.log('🎮 Like Duel - Loading...');

// ==================== CONFIGURATION ====================
const CONFIG = {
    SOCKET_URL: window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin,
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    DUEL_TIMEOUT: 20000,
    VOTE_COOLDOWN: 300
};

// ==================== GLOBAL STATE ====================
const STATE = {
    socket: null,
    isConnected: false,
    userId: null,
    currentScreen: 'welcome',
    currentDuel: null,
    currentChat: null,
    isInQueue: false,
    isInDuel: false,
    isInChat: false,
    timeLeft: 20,
    timerInterval: null,
    lastVoteTime: 0
};

// ==================== USER DATA ====================
const USER = {
    gender: localStorage.getItem('userGender') || null,
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

// ==================== DOM ELEMENTS ====================
const ELEMENTS = {
    // Screens
    loadingScreen: document.getElementById('loadingScreen'),
    appContainer: document.getElementById('appContainer'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    queueScreen: document.getElementById('queueScreen'),
    duelScreen: document.getElementById('duelScreen'),
    matchScreen: document.getElementById('matchScreen'),
    
    // Profile elements
    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    
    // Stats
    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    superLikeCount: document.getElementById('superLikeCount'),
    myMatches: document.getElementById('myMatches'),
    myDuels: document.getElementById('myDuels'),
    myLikes: document.getElementById('myLikes'),
    
    // Buttons
    startBtn: document.getElementById('startBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    refreshQueueBtn: document.getElementById('refreshQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    
    // Queue elements
    queueStatus: document.getElementById('queueStatus'),
    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    queueProgress: document.getElementById('queueProgress'),
    
    // Duel elements
    timer: document.getElementById('timer'),
    opponentAvatar: document.getElementById('opponentAvatar'),
    opponentName: document.getElementById('opponentName'),
    opponentUsername: document.getElementById('opponentUsername'),
    opponentRating: document.getElementById('opponentRating'),
    opponentMatches: document.getElementById('opponentMatches'),
    opponentLevel: document.getElementById('opponentLevel'),
    opponentBio: document.getElementById('opponentBio'),
    duelStatus: document.getElementById('duelStatus'),
    superLikeCountDuel: document.getElementById('superLikeCountDuel'),
    
    // Match elements
    partnerName: document.getElementById('partnerName'),
    partnerNameText: document.getElementById('partnerNameText'),
    partnerAvatar: document.getElementById('partnerAvatar'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    newRating: document.getElementById('newRating'),
    matchOptions: document.getElementById('matchOptions'),
    
    // Modals
    genderModal: document.getElementById('genderModal'),
    
    // Notification
    notification: document.getElementById('notification'),
    notificationTitle: document.getElementById('notificationTitle'),
    notificationMessage: document.getElementById('notificationMessage'),
    closeNotification: document.getElementById('closeNotification')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded');
    
    try {
        // Initialize UI
        initUI();
        
        // Load user data
        loadUserData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize Telegram WebApp if available
        if (window.Telegram && Telegram.WebApp) {
            initTelegramWebApp();
        }
        
        // Hide loading screen
        setTimeout(() => {
            ELEMENTS.loadingScreen.classList.add('hidden');
            ELEMENTS.appContainer.classList.remove('hidden');
            console.log('🎮 App ready!');
        }, 500);
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showError('Ilova yuklanmadi', error.message);
    }
});

// ==================== TELEGRAM WEBAPP ====================
function initTelegramWebApp() {
    try {
        console.log('✅ Telegram WebApp detected');
        const tg = Telegram.WebApp;
        
        tg.ready();
        tg.expand();
        
        // Set theme
        tg.setHeaderColor('#667eea');
        tg.setBackgroundColor('#0f172a');
        
        // Get user data
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
            console.log('👤 Telegram user:', tgUser);
            
            // Update user data
            USER.userName = tgUser.first_name || 'Telegram User';
            USER.userPhoto = tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}`;
            
            // Save to localStorage
            localStorage.setItem('userName', USER.userName);
            localStorage.setItem('userPhoto', USER.userPhoto);
            
            // Update UI
            updateProfileDisplay();
        }
        
        // Add Telegram button
        addTelegramBackButton();
        
    } catch (error) {
        console.log('⚠️ Telegram WebApp error:', error);
        createTestUser();
    }
}

function addTelegramBackButton() {
    if (Telegram.WebApp) {
        Telegram.WebApp.BackButton.show();
        Telegram.WebApp.BackButton.onClick(() => {
            if (STATE.isInQueue) {
                leaveQueue();
            } else if (STATE.isInDuel) {
                // Can't leave during duel
                showNotification('Diqqat', 'Duel davomida chiqib bo\'lmaydi!');
            } else {
                showScreen('welcome');
            }
        });
    }
}

// ==================== UI INITIALIZATION ====================
function initUI() {
    console.log('🔄 Initializing UI...');
    
    // Update profile display
    updateProfileDisplay();
    
    // Update stats
    updateStats();
    
    // Check gender status
    updateGenderStatus();
    
    console.log('✅ UI initialized');
}

function createTestUser() {
    const maleNames = ['Ali', 'Vali', 'Hasan', 'Husan', 'Bekzod'];
    const femaleNames = ['Malika', 'Dilnoza', 'Sevara', 'Madina', 'Zarina'];
    const lastNames = ['Alimov', 'Valiyev', 'Hasanov', 'Husanov'];
    
    const isMale = Math.random() > 0.5;
    const firstName = isMale 
        ? maleNames[Math.floor(Math.random() * maleNames.length)]
        : femaleNames[Math.floor(Math.random() * femaleNames.length)];
    
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    
    // Update user data
    USER.userName = USER.userName || fullName;
    USER.userPhoto = USER.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`;
    
    // Save to localStorage
    localStorage.setItem('userName', USER.userName);
    localStorage.setItem('userPhoto', USER.userPhoto);
    
    // Update UI
    updateProfileDisplay();
}

// ==================== USER DATA MANAGEMENT ====================
function loadUserData() {
    console.log('📂 Loading user data...');
    
    USER.gender = localStorage.getItem('userGender') || null;
    USER.hasSelectedGender = localStorage.getItem('hasSelectedGender') === 'true';
    USER.coins = parseInt(localStorage.getItem('userCoins')) || 100;
    USER.level = parseInt(localStorage.getItem('userLevel')) || 1;
    USER.rating = parseInt(localStorage.getItem('userRating')) || 1500;
    USER.xp = parseInt(localStorage.getItem('userXP')) || 0;
    USER.matches = parseInt(localStorage.getItem('userMatches')) || 0;
    USER.duels = parseInt(localStorage.getItem('userDuels')) || 0;
    USER.wins = parseInt(localStorage.getItem('userWins')) || 0;
    USER.totalLikes = parseInt(localStorage.getItem('userTotalLikes')) || 0;
    USER.dailySuperLikes = parseInt(localStorage.getItem('userDailySuperLikes')) || 3;
    USER.userName = localStorage.getItem('userName') || null;
    USER.userPhoto = localStorage.getItem('userPhoto') || null;
    USER.userBio = localStorage.getItem('userBio') || '';
    
    console.log('✅ User data loaded:', USER.userName);
}

function saveUserData() {
    console.log('💾 Saving user data...');
    
    localStorage.setItem('userGender', USER.gender || '');
    localStorage.setItem('hasSelectedGender', USER.hasSelectedGender.toString());
    localStorage.setItem('userCoins', USER.coins.toString());
    localStorage.setItem('userLevel', USER.level.toString());
    localStorage.setItem('userRating', USER.rating.toString());
    localStorage.setItem('userXP', USER.xp.toString());
    localStorage.setItem('userMatches', USER.matches.toString());
    localStorage.setItem('userDuels', USER.duels.toString());
    localStorage.setItem('userWins', USER.wins.toString());
    localStorage.setItem('userTotalLikes', USER.totalLikes.toString());
    localStorage.setItem('userDailySuperLikes', USER.dailySuperLikes.toString());
    localStorage.setItem('userName', USER.userName || '');
    localStorage.setItem('userPhoto', USER.userPhoto || '');
    localStorage.setItem('userBio', USER.userBio || '');
    
    console.log('✅ User data saved');
}

// ==================== PROFILE DISPLAY ====================
function updateProfileDisplay() {
    console.log('🔄 Updating profile display...');
    
    try {
        // Set avatar
        if (ELEMENTS.myAvatar) {
            ELEMENTS.myAvatar.src = USER.userPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
            ELEMENTS.myAvatar.onerror = function() {
                this.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
            };
        }
        
        // Set name
        if (ELEMENTS.myName) {
            ELEMENTS.myName.textContent = USER.userName || 'Foydalanuvchi';
            addGenderBadge(ELEMENTS.myName, USER.gender);
        }
        
        // Set username
        const username = USER.userName ? `@${USER.userName.toLowerCase().replace(/\s+/g, '_')}` : '@user';
        if (ELEMENTS.myUsername) {
            ELEMENTS.myUsername.textContent = username;
        }
        
        console.log('✅ Profile display updated');
        
    } catch (error) {
        console.error('❌ Profile display error:', error);
    }
}

function updateStats() {
    console.log('📊 Updating stats...');
    
    try {
        // Update header stats
        if (ELEMENTS.coinsCount) ELEMENTS.coinsCount.textContent = USER.coins;
        if (ELEMENTS.levelCount) ELEMENTS.levelCount.textContent = USER.level;
        if (ELEMENTS.superLikeCount) ELEMENTS.superLikeCount.textContent = USER.dailySuperLikes;
        
        // Update profile stats
        if (ELEMENTS.myMatches) ELEMENTS.myMatches.textContent = USER.matches;
        if (ELEMENTS.myDuels) ELEMENTS.myDuels.textContent = USER.duels;
        if (ELEMENTS.myLikes) ELEMENTS.myLikes.textContent = USER.totalLikes;
        
        // Update duel super like count
        if (ELEMENTS.superLikeCountDuel) ELEMENTS.superLikeCountDuel.textContent = USER.dailySuperLikes;
        
        console.log('✅ Stats updated');
        
    } catch (error) {
        console.error('❌ Stats update error:', error);
    }
}

function updateGenderStatus() {
    console.log('🎯 Updating gender status...');
    
    try {
        const genderStatus = document.getElementById('genderStatus');
        const startBtn = ELEMENTS.startBtn;
        const genderInfo = document.getElementById('genderInfo');
        
        if (genderStatus) {
            if (USER.hasSelectedGender && USER.gender) {
                genderStatus.textContent = `Gender: ${
                    USER.gender === 'male' ? 'Erkak' :
                    USER.gender === 'female' ? 'Ayol' : 'Hammasi'
                }`;
                genderStatus.style.color = '#10b981';
            } else {
                genderStatus.textContent = 'Gender tanlanmagan';
                genderStatus.style.color = '#fbbf24';
            }
        }
        
        if (startBtn) {
            if (USER.hasSelectedGender) {
                startBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-play"></i> O\'yinni Boshlash';
                startBtn.classList.remove('disabled');
            } else {
                startBtn.disabled = true;
                startBtn.innerHTML = 'Avval gender tanlang';
                startBtn.classList.add('disabled');
            }
        }
        
        if (genderInfo) {
            genderInfo.style.display = USER.hasSelectedGender ? 'none' : 'flex';
        }
        
        console.log('✅ Gender status updated');
        
    } catch (error) {
        console.error('❌ Gender status error:', error);
    }
}

function addGenderBadge(element, gender) {
    if (!element || !gender) return;
    
    try {
        // Remove existing badges
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
        
    } catch (error) {
        console.error('❌ Add gender badge error:', error);
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('🔌 Setting up event listeners...');
    
    // Start button
    if (ELEMENTS.startBtn) {
        ELEMENTS.startBtn.addEventListener('click', handleStartGame);
    }
    
    // Queue buttons
    if (ELEMENTS.leaveQueueBtn) {
        ELEMENTS.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    if (ELEMENTS.refreshQueueBtn) {
        ELEMENTS.refreshQueueBtn.addEventListener('click', refreshQueue);
    }
    
    // Vote buttons
    if (ELEMENTS.noBtn) {
        ELEMENTS.noBtn.addEventListener('click', () => handleVote('skip'));
    }
    
    if (ELEMENTS.likeBtn) {
        ELEMENTS.likeBtn.addEventListener('click', () => handleVote('like'));
    }
    
    if (ELEMENTS.superLikeBtn) {
        ELEMENTS.superLikeBtn.addEventListener('click', () => handleVote('super_like'));
    }
    
    // Gender modal buttons
    document.querySelectorAll('.gender-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gender = btn.dataset.gender;
            selectGender(gender);
        });
    });
    
    // Close gender modal
    const closeGenderModal = document.getElementById('closeGenderModal');
    if (closeGenderModal) {
        closeGenderModal.addEventListener('click', hideGenderModal);
    }
    
    // Notification close
    if (ELEMENTS.closeNotification) {
        ELEMENTS.closeNotification.addEventListener('click', hideNotification);
    }
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            switchTab(tabId);
        });
    });
    
    console.log('✅ Event listeners set up');
}

// ==================== GENDER SELECTION ====================
function showGenderModal() {
    console.log('👤 Showing gender modal');
    ELEMENTS.genderModal.classList.add('active');
}

function hideGenderModal() {
    console.log('👤 Hiding gender modal');
    ELEMENTS.genderModal.classList.remove('active');
}

function selectGender(gender) {
    console.log(`🎯 Selecting gender: ${gender}`);
    
    USER.gender = gender;
    USER.hasSelectedGender = true;
    
    saveUserData();
    updateGenderStatus();
    updateProfileDisplay();
    hideGenderModal();
    
    showNotification('✅ Jins tanlandi', 
        gender === 'male' ? 'Siz erkak sifatida ro\'yxatdan o\'tdingiz. Faqat ayollar bilan duel qilasiz!' :
        gender === 'female' ? 'Siz ayol sifatida ro\'yxatdan o\'tdingiz. Faqat erkaklar bilan duel qilasiz!' :
        'Siz har qanday gender bilan duel qilishingiz mumkin!');
    
    // Send to server if connected
    if (STATE.socket && STATE.isConnected) {
        STATE.socket.emit('select_gender', { gender: gender });
    }
}

// ==================== SCREEN MANAGEMENT ====================
function showScreen(screenName) {
    console.log(`🔄 Showing screen: ${screenName}`);
    
    // Hide all screens
    const screens = ['welcome', 'queue', 'duel', 'match'];
    screens.forEach(screen => {
        const element = document.getElementById(`${screen}Screen`);
        if (element) element.classList.add('hidden');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(`${screenName}Screen`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        STATE.currentScreen = screenName;
    }
    
    // Update Telegram BackButton
    if (Telegram && Telegram.WebApp) {
        if (screenName === 'welcome') {
            Telegram.WebApp.BackButton.hide();
        } else {
            Telegram.WebApp.BackButton.show();
        }
    }
}

function switchTab(tabId) {
    console.log(`🔄 Switching to tab: ${tabId}`);
    
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(`${tabId}Tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

// ==================== GAME FLOW ====================
function handleStartGame() {
    console.log('🎮 Starting game...');
    
    if (!USER.hasSelectedGender) {
        showGenderModal();
        return;
    }
    
    // Connect to server if not connected
    if (!STATE.socket || !STATE.isConnected) {
        connectToServer();
    } else {
        enterQueue();
    }
}

function enterQueue() {
    console.log('⏳ Entering queue...');
    
    if (STATE.socket && STATE.isConnected) {
        STATE.socket.emit('enter_queue');
        STATE.isInQueue = true;
        showScreen('queue');
        
        // Update queue status
        updateQueueStatus('Raqib izlanmoqda...', 0, '0');
    }
}

function leaveQueue() {
    console.log('🚪 Leaving queue...');
    
    if (STATE.socket && STATE.isConnected) {
        STATE.socket.emit('leave_queue');
    }
    
    STATE.isInQueue = false;
    STATE.isInDuel = false;
    showScreen('welcome');
    
    clearInterval(STATE.timerInterval);
}

function refreshQueue() {
    console.log('🔄 Refreshing queue...');
    
    if (STATE.socket && STATE.isConnected) {
        STATE.socket.emit('get_queue_status');
    }
}

// ==================== DUEL FUNCTIONS ====================
function startDuel(opponent) {
    console.log('⚔️ Starting duel with:', opponent.name);
    
    STATE.isInQueue = false;
    STATE.isInDuel = true;
    STATE.currentDuel = opponent;
    
    showScreen('duel');
    
    // Update opponent info
    if (ELEMENTS.opponentAvatar) {
        ELEMENTS.opponentAvatar.src = opponent.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Opponent';
    }
    if (ELEMENTS.opponentName) ELEMENTS.opponentName.textContent = opponent.name || 'Raqib';
    if (ELEMENTS.opponentUsername) ELEMENTS.opponentUsername.textContent = opponent.username ? `@${opponent.username}` : '@opponent';
    if (ELEMENTS.opponentRating) ELEMENTS.opponentRating.textContent = opponent.rating || 1500;
    if (ELEMENTS.opponentMatches) ELEMENTS.opponentMatches.textContent = opponent.matches || 0;
    if (ELEMENTS.opponentLevel) ELEMENTS.opponentLevel.textContent = opponent.level || 1;
    if (ELEMENTS.opponentBio) ELEMENTS.opponentBio.textContent = opponent.bio || 'Bio kiritilmagan';
    
    // Enable vote buttons
    enableVoteButtons();
    
    // Start timer
    startTimer();
}

function startTimer() {
    console.log('⏰ Starting duel timer');
    
    clearInterval(STATE.timerInterval);
    STATE.timeLeft = 20;
    
    if (ELEMENTS.timer) {
        ELEMENTS.timer.textContent = STATE.timeLeft;
        ELEMENTS.timer.style.color = '#ffffff';
    }
    
    STATE.timerInterval = setInterval(() => {
        STATE.timeLeft--;
        
        if (ELEMENTS.timer) {
            ELEMENTS.timer.textContent = STATE.timeLeft;
            
            if (STATE.timeLeft <= 5) {
                ELEMENTS.timer.style.color = '#ef4444';
            }
        }
        
        if (STATE.timeLeft <= 0) {
            clearInterval(STATE.timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function enableVoteButtons() {
    console.log('✅ Enabling vote buttons');
    
    const buttons = [ELEMENTS.noBtn, ELEMENTS.likeBtn, ELEMENTS.superLikeBtn];
    buttons.forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    });
}

function disableVoteButtons() {
    console.log('❌ Disabling vote buttons');
    
    const buttons = [ELEMENTS.noBtn, ELEMENTS.likeBtn, ELEMENTS.superLikeBtn];
    buttons.forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
    });
}

function handleVote(choice) {
    console.log(`🗳️ Voting: ${choice}`);
    
    // Check cooldown
    const now = Date.now();
    if (now - STATE.lastVoteTime < CONFIG.VOTE_COOLDOWN) {
        console.log('⏳ Vote cooldown active');
        return;
    }
    
    // Check super like limit
    if (choice === 'super_like' && USER.dailySuperLikes <= 0) {
        showNotification('❌ Limit', 'Kunlik SUPER LIKE limitingiz tugadi!');
        return;
    }
    
    // Update super like count if used
    if (choice === 'super_like' && USER.dailySuperLikes > 0) {
        USER.dailySuperLikes--;
        updateStats();
        saveUserData();
    }
    
    STATE.lastVoteTime = now;
    disableVoteButtons();
    
    // Update timer to show vote
    if (ELEMENTS.timer) {
        if (choice === 'like') ELEMENTS.timer.textContent = '❤️';
        else if (choice === 'super_like') ELEMENTS.timer.textContent = '💖';
        else ELEMENTS.timer.textContent = '✖';
    }
    
    // Update duel status
    if (ELEMENTS.duelStatus) {
        ELEMENTS.duelStatus.innerHTML = `<i class="fas fa-check-circle"></i> Ovozingiz qabul qilindi!`;
    }
    
    // Send vote to server
    if (STATE.socket && STATE.isConnected && STATE.currentDuel) {
        STATE.socket.emit('vote', {
            duelId: STATE.currentDuel.id,
            choice: choice
        });
    } else {
        // Simulate server response for testing
        setTimeout(() => {
            simulateVoteResult(choice);
        }, 1000);
    }
}

function handleTimeout() {
    console.log('⏰ Duel timeout');
    
    STATE.isInDuel = false;
    disableVoteButtons();
    
    showNotification('⏰ Vaqt tugadi', 'Duel vaqti tugadi. Navbatga qaytish.');
    
    // Auto return to queue after timeout
    setTimeout(() => {
        showScreen('queue');
        updateQueueStatus('Navbatga qaytildi', 0, '0');
    }, 2000);
}

// ==================== MATCH HANDLING ====================
function showMatch(partner, rewards) {
    console.log('🎉 Showing match with:', partner.name);
    
    STATE.isInDuel = false;
    showScreen('match');
    
    // Update partner info
    if (ELEMENTS.partnerAvatar) {
        ELEMENTS.partnerAvatar.src = partner.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Partner';
    }
    if (ELEMENTS.partnerName) ELEMENTS.partnerName.textContent = partner.name || 'Hamkor';
    if (ELEMENTS.partnerNameText) ELEMENTS.partnerNameText.textContent = partner.name || 'Hamkor';
    
    // Update rewards
    if (ELEMENTS.rewardCoins) ELEMENTS.rewardCoins.textContent = rewards.coins || 50;
    if (ELEMENTS.rewardXP) ELEMENTS.rewardXP.textContent = rewards.xp || 30;
    if (ELEMENTS.newRating) ELEMENTS.newRating.textContent = rewards.rating || USER.rating;
    
    // Update user stats
    USER.coins += rewards.coins || 50;
    USER.xp += rewards.xp || 30;
    USER.rating = rewards.rating || USER.rating;
    USER.matches++;
    USER.wins++;
    USER.totalLikes++;
    
    saveUserData();
    updateStats();
    
    // Create match options
    createMatchOptions(partner);
}

function createMatchOptions(partner) {
    if (!ELEMENTS.matchOptions) return;
    
    ELEMENTS.matchOptions.innerHTML = `
        <button class="match-btn primary-btn" id="continueBtn">
            <i class="fas fa-play"></i> Davom etish
        </button>
        <button class="match-btn secondary-btn" id="chatBtn">
            <i class="fas fa-comment"></i> Chat
        </button>
    `;
    
    // Add event listeners
    setTimeout(() => {
        const continueBtn = document.getElementById('continueBtn');
        const chatBtn = document.getElementById('chatBtn');
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                showScreen('welcome');
            });
        }
        
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                showNotification('ℹ️ Chat', 'Chat funksiyasi tez orada ishga tushadi!');
            });
        }
    }, 100);
}

// ==================== SOCKET.IO CONNECTION ====================
function connectToServer() {
    console.log('🔗 Connecting to server...', CONFIG.SOCKET_URL);
    
    if (STATE.socket && STATE.isConnected) {
        console.log('⚠️ Already connected');
        enterQueue();
        return;
    }
    
    // Create socket connection
    STATE.socket = io(CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: CONFIG.RECONNECT_ATTEMPTS,
        reconnectionDelay: CONFIG.RECONNECT_DELAY,
        timeout: 10000
    });
    
    setupSocketEvents();
}

function setupSocketEvents() {
    if (!STATE.socket) return;
    
    // Connection events
    STATE.socket.on('connect', () => {
        console.log('✅ Connected to server');
        STATE.isConnected = true;
        
        // Send auth data
        const userData = {
            name: USER.userName,
            photo: USER.userPhoto,
            gender: USER.gender,
            hasSelectedGender: USER.hasSelectedGender,
            rating: USER.rating,
            level: USER.level
        };
        
        STATE.socket.emit('auth', userData);
    });
    
    STATE.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        STATE.isConnected = false;
        showNotification('🔌 Ulanish uzildi', 'Serverga qayta ulanmoqda...');
    });
    
    STATE.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        showNotification('❌ Xato', 'Serverga ulanib bo\'lmadi. Qayta urinib ko\'ring.');
    });
    
    // Game events
    STATE.socket.on('auth_ok', (data) => {
        console.log('✅ Authentication successful', data);
        STATE.userId = data.userId;
        
        // Enter queue after successful auth
        enterQueue();
    });
    
    STATE.socket.on('show_gender_selection', () => {
        console.log('⚠️ Gender selection required');
        showGenderModal();
    });
    
    STATE.socket.on('queue_joined', (data) => {
        console.log('✅ Joined queue:', data);
        updateQueueStatus('Raqib izlanmoqda...', data.position || 0, data.total || '?');
    });
    
    STATE.socket.on('waiting_count', (data) => {
        console.log('👥 Waiting count:', data);
        if (ELEMENTS.waitingCount) ELEMENTS.waitingCount.textContent = data.count || 0;
        if (ELEMENTS.position) ELEMENTS.position.textContent = data.position || '-';
        
        // Update progress bar
        if (ELEMENTS.queueProgress) {
            const progress = data.position ? Math.max(0, 100 - (data.position * 10)) : 50;
            ELEMENTS.queueProgress.style.width = `${progress}%`;
        }
    });
    
    STATE.socket.on('duel_started', (data) => {
        console.log('⚔️ Duel started:', data);
        startDuel(data.opponent);
    });
    
    STATE.socket.on('match', (data) => {
        console.log('🎉 Match!', data);
        showMatch(data.partner, data.rewards);
    });
    
    STATE.socket.on('no_match', (data) => {
        console.log('😔 No match', data);
        showNotification('😔 Match bo\'lmadi', data.reason || 'Raqib sizni like bermadi');
        showScreen('queue');
        updateQueueStatus('Yana raqib izlanmoqda...', 0, '?');
    });
    
    STATE.socket.on('timeout', () => {
        console.log('⏰ Duel timeout from server');
        handleTimeout();
    });
}

// ==================== QUEUE STATUS ====================
function updateQueueStatus(status, position, total) {
    console.log(`📊 Queue status: ${status}, position: ${position}/${total}`);
    
    if (ELEMENTS.queueStatus) {
        ELEMENTS.queueStatus.textContent = status;
    }
    
    if (ELEMENTS.position) {
        ELEMENTS.position.textContent = position;
    }
    
    if (ELEMENTS.waitingCount) {
        ELEMENTS.waitingCount.textContent = total;
    }
    
    // Update progress bar
    if (ELEMENTS.queueProgress && position > 0 && total > 0) {
        const progress = Math.max(0, 100 - ((position / total) * 100));
        ELEMENTS.queueProgress.style.width = `${progress}%`;
    }
}

// ==================== SIMULATION FUNCTIONS (FOR TESTING) ====================
function simulateVoteResult(choice) {
    console.log(`🎲 Simulating vote result for: ${choice}`);
    
    // Random result for testing
    const isMatch = Math.random() > 0.5;
    
    if (isMatch) {
        const partner = {
            name: 'Test Partner',
            photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Partner',
            rating: 1520
        };
        
        const rewards = {
            coins: choice === 'super_like' ? 100 : 50,
            xp: 30,
            rating: USER.rating + 20
        };
        
        showMatch(partner, rewards);
    } else {
        showNotification('😔 Match bo\'lmadi', 'Raqib sizni like bermadi');
        showScreen('queue');
        updateQueueStatus('Yana raqib izlanmoqda...', Math.floor(Math.random() * 10) + 1, '15');
    }
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(title, message, type = 'info') {
    console.log(`📢 ${title}: ${message}`);
    
    if (!ELEMENTS.notification) return;
    
    // Set notification content
    ELEMENTS.notificationTitle.textContent = title;
    ELEMENTS.notificationMessage.textContent = message;
    
    // Set type-based styling
    ELEMENTS.notification.className = 'notification';
    if (type === 'error') {
        ELEMENTS.notification.classList.add('error');
    } else if (type === 'success') {
        ELEMENTS.notification.classList.add('success');
    } else if (type === 'warning') {
        ELEMENTS.notification.classList.add('warning');
    }
    
    // Show notification
    ELEMENTS.notification.classList.add('active');
    
    // Auto-hide after 5 seconds
    setTimeout(hideNotification, 5000);
}

function hideNotification() {
    if (ELEMENTS.notification) {
        ELEMENTS.notification.classList.remove('active');
    }
}

function showError(title, message) {
    console.error(`❌ ${title}: ${message}`);
    showNotification(title, message, 'error');
}

// ==================== UTILITY FUNCTIONS ====================
function updateQueueUI(isInQueue) {
    STATE.isInQueue = isInQueue;
    
    if (isInQueue) {
        showScreen('queue');
    } else {
        showScreen('welcome');
    }
}

function resetGame() {
    console.log('🔄 Resetting game state');
    
    STATE.isInQueue = false;
    STATE.isInDuel = false;
    STATE.isInChat = false;
    STATE.currentDuel = null;
    STATE.currentChat = null;
    
    clearInterval(STATE.timerInterval);
    
    showScreen('welcome');
}

// ==================== DEBUG FUNCTIONS ====================
function debugSimulateMatch() {
    console.log('🎲 Debug: Simulating match');
    
    const partner = {
        name: 'Debug Partner',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Debug',
        rating: 1600
    };
    
    const rewards = {
        coins: 100,
        xp: 50,
        rating: USER.rating + 50
    };
    
    showMatch(partner, rewards);
}

function debugSimulateDuel() {
    console.log('🎲 Debug: Simulating duel');
    
    const opponent = {
        id: 'debug_opponent',
        name: 'Debug Opponent',
        username: 'debug',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DebugOpponent',
        rating: 1550,
        matches: 25,
        level: 3,
        bio: 'Debug bio for testing purposes'
    };
    
    startDuel(opponent);
}



// Add debug functions to window for testing
window.debugSimulateMatch = debugSimulateMatch;
window.debugSimulateDuel = debugSimulateDuel;
window.resetGame = resetGame;
window.showScreen = showScreen;

console.log('🚀 Like Duel frontend initialized!');