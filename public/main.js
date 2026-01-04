// ==================== MAIN APPLICATION ====================

// ==================== GLOBAL VARIABLES ====================
window.gameState = {
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
    matchCompleted: false,
    skipToNextRequested: false,
    isWaitingForMatchAction: false,
    matchActionTimeout: null,
    matchActionTimerInterval: null,
    pendingChatInvite: null,
    chatInviteRequestId: null,
    hasRespondedToChat: false
};

window.userState = {
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

window.elements = {};
window.tgUserGlobal = null;

// ==================== DOM ELEMENT REFERENCES ====================

function initElementReferences() {
    const getElement = (id) => document.getElementById(id);
    
    window.elements = {
        // Screens
        welcomeScreen: getElement('welcomeScreen'),
        queueScreen: getElement('queueScreen'),
        duelScreen: getElement('duelScreen'),
        
        // Profile elements
        myAvatar: getElement('myAvatar'),
        myName: getElement('myName'),
        myUsername: getElement('myUsername'),
        myMatches: getElement('myMatches'),
        myLikes: getElement('myLikes'),
        mutualMatchesCount: getElement('mutualMatchesCount'),
        
        // Queue elements
        waitingCount: getElement('waitingCount'),
        position: getElement('position'),
        positionInfo: getElement('positionInfo'),
        queueStatus: getElement('queueStatus'),
        genderFilterContainer: getElement('genderFilterContainer'),
        
        // Duel elements
        opponentAvatar: getElement('opponentAvatar'),
        opponentName: getElement('opponentName'),
        opponentUsername: getElement('opponentUsername'),
        opponentRating: getElement('opponentRating'),
        opponentMatches: getElement('opponentMatches'),
        opponentLevel: getElement('opponentLevel'),
        timer: getElement('timer'),
        duelStatus: getElement('duelStatus'),
        superLikeCount: getElement('superLikeCount'),
        
        // Buttons
        startBtn: getElement('startBtn'),
        leaveQueueBtn: getElement('leaveQueueBtn'),
        noBtn: getElement('noBtn'),
        likeBtn: getElement('likeBtn'),
        superLikeBtn: getElement('superLikeBtn'),
        refreshFriendsBtn: getElement('refreshFriendsBtn'),
        
        // Profile tab elements
        profileAvatar: getElement('profileAvatar'),
        profileName: getElement('profileName'),
        profileUsername: getElement('profileUsername'),
        profileBio: getElement('profileBio'),
        statRating: getElement('statRating'),
        statMatches: getElement('statMatches'),
        statDuels: getElement('statDuels'),
        statWinRate: getElement('statWinRate'),
        mutualMatchesProfile: getElement('mutualMatchesProfile'),
        statFriends: getElement('statFriends'),
        
        // Statistics
        coinsCount: getElement('coinsCount'),
        levelCount: getElement('levelCount'),
        shopCoinsCount: getElement('shopCoinsCount'),
        
        // Notification
        notification: getElement('notification'),
        notificationTitle: getElement('notificationTitle'),
        notificationMessage: getElement('notificationMessage'),
        
        // Modals
        genderModal: getElement('genderModal'),
        genderWarning: getElement('genderWarning'),
        selectGenderNowBtn: getElement('selectGenderNowBtn'),
        profileEditModal: getElement('profileEditModal'),
        editProfileBtn: getElement('editProfileBtn'),
        closeProfileEditBtn: getElement('closeProfileEditBtn'),
        editBio: getElement('editBio'),
        editGender: getElement('editGender'),
        editFilter: getElement('editFilter'),
        saveProfileBtn: getElement('saveProfileBtn'),
        
        // Gender selection buttons
        selectMaleBtn: getElement('selectMaleBtn'),
        selectFemaleBtn: getElement('selectFemaleBtn'),
        selectAllBtn: getElement('selectAllBtn'),
        
        // Chat modal elements
        chatModal: getElement('chatModal'),
        chatPartnerAvatar: getElement('chatPartnerAvatar'),
        chatPartnerName: getElement('chatPartnerName'),
        chatUsername: getElement('chatUsername'),
        chatOpenTelegramBtn: getElement('chatOpenTelegramBtn'),
        closeChatBtn: getElement('closeChatBtn'),
        chatTitle: getElement('chatTitle'),
        
        // Friends tab elements
        friendsList: getElement('friendsList'),
        friendsCount: getElement('friendsCount'),
        onlineFriendsCount: getElement('onlineFriendsCount'),
        noFriends: getElement('noFriends'),
        
        // Shop elements
        shopItemsList: getElement('shopItemsList'),
        
        // Leaderboard elements
        leaderboardList: getElement('leaderboardList'),
        leaderboardUpdated: getElement('leaderboardUpdated'),
        
        // Quests
        profileQuestsList: getElement('profileQuestsList'),
        
        // View stats button
        viewStatsBtn: getElement('viewStatsBtn')
    };
    
    console.log('✅ DOM element referenslari o\'rnatildi');
}

// ==================== EVENT LISTENERS ====================

function initEventListeners() {
    console.log('🎮 Event listenerlar o\'rnatilmoqda...');
    
    // Start game button
    if (window.elements.startBtn) {
        window.elements.startBtn.addEventListener('click', () => {
            console.log('🎮 Start button bosildi');
            window.gameLogic?.startDuelFlow?.();
        });
        console.log('✅ Start button event listener o\'rnatildi');
    }
    
    // Leave queue button
    if (window.elements.leaveQueueBtn) {
        window.elements.leaveQueueBtn.addEventListener('click', () => {
            console.log('🚪 Navbatdan chiqish tugmasi bosildi');
            window.socketManager?.leaveQueue?.();
            window.gameState.isInQueue = false;
            window.showScreen?.('welcome');
        });
    }
    
    // Vote buttons
    if (window.elements.noBtn) {
        window.elements.noBtn.addEventListener('click', () => {
            console.log('🗳️ No button bosildi');
            window.gameLogic?.handleVote?.('skip');
        });
    }
    
    if (window.elements.likeBtn) {
        window.elements.likeBtn.addEventListener('click', () => {
            console.log('🗳️ Like button bosildi');
            window.gameLogic?.handleVote?.('like');
        });
    }
    
    if (window.elements.superLikeBtn) {
        window.elements.superLikeBtn.addEventListener('click', () => {
            console.log('🗳️ Super like button bosildi');
            if (window.userState.dailySuperLikes > 0) {
                window.gameLogic?.handleVote?.('super_like');
            } else {
                window.utils?.showNotification('Super Like', 'Kunlik SUPER LIKE laringiz tugadi!');
            }
        });
    }
    
    // Refresh friends button
    if (window.elements.refreshFriendsBtn) {
        window.elements.refreshFriendsBtn.addEventListener('click', () => {
            console.log('🔄 Refresh friends button bosildi');
            window.uiManager?.loadFriendsList?.();
        });
    }
    
    // View stats button
    if (window.elements.viewStatsBtn) {
        window.elements.viewStatsBtn.addEventListener('click', () => {
            console.log('📊 View stats button bosildi');
            const stats = `
                Reyting: ${window.userState.rating}
                Matchlar: ${window.userState.matches}
                Duellar: ${window.userState.duels}
                G'alabalar: ${window.userState.wins}
                G'alaba %: ${window.userState.duels > 0 ? 
                    Math.round((window.userState.wins / window.userState.duels) * 100) : 0}%
                Total Like: ${window.userState.totalLikes}
                O'zaro Match: ${window.userState.mutualMatchesCount}
                Do'stlar: ${window.userState.friendsCount}
                Coin: ${window.userState.coins}
                Level: ${window.userState.level}
                Kunlik Super Like: ${window.userState.dailySuperLikes}/3
                Filter: ${window.userState.filter === 'male' ? 'Faqat erkaklar' : 
                         window.userState.filter === 'female' ? 'Faqat ayollar' : 'Hamma'}
            `;
            alert('📊 Batafsil statistika:\n\n' + stats);
        });
    }
    
    console.log('✅ Barcha event listenerlar o\'rnatildi');
}

// ==================== SCREEN MANAGEMENT ====================

window.showScreen = function(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
    
    // Hide all screens
    ['welcomeScreen', 'queueScreen', 'duelScreen'].forEach(s => {
        const element = document.getElementById(s);
        if (element) element.classList.add('hidden');
    });
    
    // Show selected screen
    const screenElement = document.getElementById(screen + 'Screen');
    if (screenElement) {
        screenElement.classList.remove('hidden');
    }
    
    // Clear any match options
    const matchOptions = document.getElementById('matchOptionsContainer');
    if (matchOptions) matchOptions.remove();
    
    const newDuelInvite = document.getElementById('newDuelInviteContainer');
    if (newDuelInvite) newDuelInvite.remove();
};

window.updateQueueStatus = function(msg) {
    if (window.elements?.queueStatus) {
        window.elements.queueStatus.textContent = msg;
    }
};

window.updateDuelStatus = function(msg) {
    if (window.elements?.duelStatus) {
        window.elements.duelStatus.textContent = msg;
    }
};

window.updateUIFromUserState = function() {
    console.log('🎨 UI yangilanmoqda...');
    
    // Add gender badges
    if (window.userState.hasSelectedGender && window.userState.currentGender) {
        if (window.elements?.myName) {
            window.uiManager?.addGenderBadge?.(window.elements.myName, window.userState.currentGender);
        }
        if (window.elements?.profileName) {
            window.uiManager?.addGenderBadge?.(window.elements.profileName, window.userState.currentGender);
        }
    }
    
    // Update statistics
    if (window.elements?.coinsCount) window.elements.coinsCount.textContent = window.userState.coins;
    if (window.elements?.levelCount) window.elements.levelCount.textContent = window.userState.level;
    if (window.elements?.shopCoinsCount) window.elements.shopCoinsCount.textContent = window.userState.coins;
    if (window.elements?.statRating) window.elements.statRating.textContent = window.userState.rating;
    if (window.elements?.statMatches) window.elements.statMatches.textContent = window.userState.matches;
    if (window.elements?.myMatches) window.elements.myMatches.textContent = window.userState.matches;
    if (window.elements?.statDuels) window.elements.statDuels.textContent = window.userState.duels;
    if (window.elements?.mutualMatchesCount) window.elements.mutualMatchesCount.textContent = window.userState.mutualMatchesCount;
    if (window.elements?.mutualMatchesProfile) window.elements.mutualMatchesProfile.textContent = window.userState.mutualMatchesCount;
    if (window.elements?.statFriends) window.elements.statFriends.textContent = window.userState.friendsCount;
    
    // Calculate win rate
    const winRate = window.userState.duels > 0 ? 
        Math.round((window.userState.wins / window.userState.duels) * 100) : 0;
    if (window.elements?.statWinRate) window.elements.statWinRate.textContent = winRate + '%';
    
    if (window.elements?.myLikes) window.elements.myLikes.textContent = window.userState.totalLikes;
    if (window.elements?.superLikeCount) window.elements.superLikeCount.textContent = window.userState.dailySuperLikes;
    
    // Update bio
    if (window.elements?.profileBio && window.userState.bio) {
        window.elements.profileBio.textContent = window.userState.bio;
    }
    
    // Update start button
    if (window.elements?.startBtn) {
        if (window.userState.hasSelectedGender) {
            window.elements.startBtn.disabled = false;
            window.elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
            window.elements.startBtn.classList.remove('disabled');
        } else {
            window.elements.startBtn.disabled = true;
            window.elements.startBtn.textContent = 'Avval gender tanlang';
            window.elements.startBtn.classList.add('disabled');
        }
    }
    
    // Update filter
    if (window.gameState) {
        window.gameState.currentFilter = window.userState.filter;
    }
};

// ==================== INITIALIZATION ====================

function initApplication() {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Initialize element references
    initElementReferences();
    
    // Initialize modal manager
    if (window.modalManager) {
        window.modalManager.initAllModals();
        console.log('✅ Modal manager ishga tushirildi');
    }
    
    // Initialize user profile
    if (window.uiManager) {
        window.uiManager.initUserProfile();
        console.log('✅ UI manager ishga tushirildi');
    }
    
    // Initialize tab navigation
    if (window.uiManager) {
        window.uiManager.initTabNavigation();
        console.log('✅ Tab navigation ishga tushirildi');
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize game logic
    if (window.gameLogic) {
        window.gameLogic.initGameLogic();
        console.log('✅ Game logic ishga tushirildi');
    }
    
    // Export global functions
    exportGlobalFunctions();
    
    // Load initial data
    if (window.uiManager) {
        window.uiManager.loadProfileQuests();
        window.uiManager.loadShopItems();
        window.uiManager.loadLeaderboard();
        window.uiManager.loadFriendsList();
        console.log('✅ Dastlabki ma\'lumotlar yuklandi');
    }
    
    console.log('✅ main.js to\'liq yuklandi - Barcha funksiyalar aktiv');
    
    // Auto show gender modal if not selected
    setTimeout(() => {
        if (!window.userState.hasSelectedGender) {
            console.log('⚠️ Gender tanlanmagan, avtomatik modal ko\'rsatish');
            window.modalManager?.showGenderModal?.(true);
        }
    }, 1500);
}

// ==================== GLOBAL FUNCTIONS EXPORT ====================

function exportGlobalFunctions() {
    console.log('🌍 Global funksiyalar export qilinmoqda...');
    
    // UI functions
    window.showScreen = showScreen;
    window.updateQueueStatus = updateQueueStatus;
    window.updateDuelStatus = updateDuelStatus;
    window.updateUIFromUserState = updateUIFromUserState;
    
    // Game logic functions
    window.startGame = () => window.gameLogic?.startDuelFlow?.();
    window.leaveQueue = () => window.socketManager?.leaveQueue?.();
    window.handleVote = (choice) => window.gameLogic?.handleVote?.(choice);
    window.handleMatch = (data) => window.gameLogic?.handleMatch?.(data);
    window.handleLikedOnly = (data) => window.gameLogic?.handleLikedOnly?.(data);
    window.handleNoMatch = (data) => window.gameLogic?.handleNoMatch?.(data);
    window.handleTimeout = (data) => window.gameLogic?.handleTimeout?.(data);
    window.handleOpponentLeft = () => window.gameLogic?.handleOpponentLeft?.();
    window.handleChatInvite = (data) => window.gameLogic?.handleChatInvite?.(data);
    window.proceedToNextDuel = () => window.gameLogic?.proceedToNextDuel?.();
    window.returnToMenu = () => window.gameLogic?.returnToMenu?.();
    window.acceptChatInvite = (data) => window.gameLogic?.acceptChatInvite?.(data);
    window.skipChatInvite = () => window.gameLogic?.skipChatInvite?.();
    window.acceptChatInviteFromModal = () => window.gameLogic?.acceptChatInviteFromModal?.();
    window.rejectChatInviteFromModal = () => window.gameLogic?.rejectChatInviteFromModal?.();
    
    // Modal functions
    window.showGenderModal = (mandatory) => window.modalManager?.showGenderModal?.(mandatory);
    window.openChat = (partner) => window.modalManager?.showChatModal?.(partner);
    window.closeChatModal = () => window.modalManager?.hideChatModal?.();
    
    console.log('✅ Barcha global funksiyalar export qilindi');
}

// ==================== DOM READY ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplication);
} else {
    initApplication();
}