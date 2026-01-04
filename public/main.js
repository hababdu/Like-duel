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
    skipToNextRequested: false
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

/**
 * Initialize DOM element references
 */
function initElementReferences() {
    const getElement = (id) => document.getElementById(id);
    
    window.elements = {
        // Screens
        welcomeScreen: getElement('welcomeScreen'),
        queueScreen: getElement('queueScreen'),
        duelScreen: getElement('duelScreen'),
        matchScreen: getElement('matchScreen'),
        
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
        
        // Match elements
        partnerName: getElement('partnerName'),
        matchText: getElement('matchText'),
        matchRewards: getElement('matchRewards'),
        rewardCoins: getElement('rewardCoins'),
        rewardXP: getElement('rewardXP'),
        matchOptions: getElement('matchOptions'),
        
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

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    console.log('🎮 Event listenerlar o\'rnatilmoqda...');
    
    // Start game button
    if (window.elements.startBtn) {
        window.elements.startBtn.addEventListener('click', startGame);
        console.log('✅ Start button event listener o\'rnatildi');
    } else {
        console.error('❌ Start button topilmadi');
    }
    
    // Leave queue button
    if (window.elements.leaveQueueBtn) {
        window.elements.leaveQueueBtn.addEventListener('click', leaveQueue);
        console.log('✅ Leave queue button event listener o\'rnatildi');
    } else {
        console.error('❌ Leave queue button topilmadi');
    }
    
    // Vote buttons
    if (window.elements.noBtn) {
        window.elements.noBtn.addEventListener('click', () => {
            console.log('🗳️ No button bosildi');
            window.gameLogic?.handleVote?.('skip');
        });
        console.log('✅ No button event listener o\'rnatildi');
    } else {
        console.error('❌ No button topilmadi');
    }
    
    if (window.elements.likeBtn) {
        window.elements.likeBtn.addEventListener('click', () => {
            console.log('🗳️ Like button bosildi');
            window.gameLogic?.handleVote?.('like');
        });
        console.log('✅ Like button event listener o\'rnatildi');
    } else {
        console.error('❌ Like button topilmadi');
    }
    
    if (window.elements.superLikeBtn) {
        window.elements.superLikeBtn.addEventListener('click', () => {
            console.log('🗳️ Super like button bosildi');
            window.gameLogic?.handleVote?.('super_like');
        });
        console.log('✅ Super like button event listener o\'rnatildi');
    } else {
        console.error('❌ Super like button topilmadi');
    }
    
    // Refresh friends button
    if (window.elements.refreshFriendsBtn) {
        window.elements.refreshFriendsBtn.addEventListener('click', () => {
            console.log('🔄 Refresh friends button bosildi');
            window.uiManager?.loadFriendsList?.();
        });
        console.log('✅ Refresh friends button event listener o\'rnatildi');
    } else {
        console.error('❌ Refresh friends button topilmadi');
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
        console.log('✅ View stats button event listener o\'rnatildi');
    } else {
        console.error('❌ View stats button topilmadi');
    }
    
    console.log('✅ Barcha event listenerlar o\'rnatildi');
}

// ==================== GAME FUNCTIONS ====================

/**
 * Start the game
 */
/**
 * Start the game - UPDATED VERSION
 */
/**
 * Start the game - FIXED VERSION
 */
function startGame() {
    console.log('🎮 O\'yinni boshlash tugmasi bosildi');
    
    // 1. Gender tanlanganligini tekshirish
    if (!window.userState.hasSelectedGender) {
        console.log('⚠️ Gender tanlanmagan, modal ko\'rsatish');
        window.modalManager?.showGenderModal?.(true);
        window.utils?.showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
    
    console.log('✅ Gender tanlangan, oyin boshlanmoqda...');
    
    // 2. Socket manager ishlayotganligini tekshirish
    if (!window.socketManager) {
        console.error('❌ Socket manager topilmadi');
        window.utils?.showNotification('Xato', 'Tizimda xatolik yuz berdi');
        return;
    }
    
    // 3. Agar socket ulanmagan bo'lsa, ulanish
    if (!window.gameState.socket || !window.gameState.isConnected) {
        console.log('🔄 Socket ulanmagan, ulanish...');
        const connected = window.socketManager.connectToServer();
        
        if (!connected) {
            window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
            return;
        }
        
        // Ulanish kutish
        setTimeout(() => {
            if (window.gameState.isConnected) {
                // Ulanganidan keyin queue ga kirish
                window.gameState.isInQueue = true;
                window.showScreen?.('queue');
                window.updateQueueStatus?.('Navbatga kiritilmoqda...');
                
                // Navbatga kirish
                setTimeout(() => {
                    window.socketManager?.enterQueue?.();
                }, 1000);
            } else {
                window.utils?.showNotification('Xato', 'Serverga ulanib bo\'lmadi');
                window.showScreen?.('welcome');
            }
        }, 2000);
    } else {
        // Socket allaqachon ulangan, darhol navbatga kirish
        console.log('✅ Socket allaqachon ulangan, navbatga kirilmoqda...');
        window.gameState.isInQueue = true;
        window.showScreen?.('queue');
        window.updateQueueStatus?.('Navbatga kiritilmoqda...');
        
        // Navbatga kirish
        setTimeout(() => {
            window.socketManager?.enterQueue?.();
        }, 500);
    }
}
/**
 * Leave the queue
 */
function leaveQueue() {
    console.log('🚪 Navbatdan chiqish tugmasi bosildi');
    
    if (window.gameState.socket && window.gameState.isConnected) {
        window.socketManager?.leaveQueue?.();
    }
    
    window.gameState.isInQueue = false;
    window.gameState.isInDuel = false;
    window.gameState.currentDuelId = null;
    window.gameState.waitingForOpponent = false;
    clearInterval(window.gameState.timerInterval);
    
    window.uiManager?.showScreen?.('welcome');
    
    window.utils?.showNotification('Navbatdan chiqdingiz', 
        'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
}

// ==================== MODAL FUNCTIONS ====================

/**
 * Show liked only options modal
 */
function showLikedOnlyOptions(opponentName) {
    console.log('❤️ Liked only options modal ko\'rsatilmoqda');
    
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
                    <button class="modal-btn cancel-btn" onclick="window.gameLogic?.skipToNextDuel?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        ➡️ Yangi duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="window.gameLogic?.returnToMenu?.()" 
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        🏠 Bosh menyu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

/**
 * Show no match modal
 */
function showNoMatchModal() {
    console.log('❌ No match modal ko\'rsatilmoqda');
    
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
                    <button class="modal-btn cancel-btn" onclick="window.gameLogic?.skipToNextDuel?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        ➡️ Yangi duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="window.gameLogic?.returnToMenu?.()" 
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        🏠 Bosh menyu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

/**
 * Show timeout options modal
 */
function showTimeoutOptions() {
    console.log('⏰ Timeout options modal ko\'rsatilmoqda');
    
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
                    <button class="modal-btn cancel-btn" onclick="window.gameLogic?.skipToNextDuel?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        ➡️ Yangi duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="window.gameLogic?.returnToMenu?.()" 
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        🏠 Bosh menyu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

/**
 * Show opponent timeout modal
 */
function showOpponentTimeoutModal() {
    console.log('⏰ Opponent timeout modal ko\'rsatilmoqda');
    
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
                    <button class="modal-btn cancel-btn" onclick="window.gameLogic?.skipToNextDuel?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        ➡️ Keyingi duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="window.gameLogic?.returnToMenu?.()" 
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        🏠 Bosh menyu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

/**
 * Show opponent left modal
 */
function showOpponentLeftModal() {
    console.log('🚪 Opponent left modal ko\'rsatilmoqda');
    
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
                    <button class="modal-btn cancel-btn" onclick="window.gameLogic?.skipToNextDuel?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        ➡️ Keyingi duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="window.gameLogic?.returnToMenu?.()" 
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        🏠 Bosh menyu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

/**
 * Show no match options
 */
function showNoMatchOptions() {
    console.log('❌ No match options modal ko\'rsatilmoqda');
    
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
                    <button class="modal-btn cancel-btn" onclick="window.gameLogic?.skipToNextDuel?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        ➡️ Keyingi duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="window.gameLogic?.returnToMenu?.()" 
                            style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                        🏠 Bosh menyu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

/**
 * Show next duel confirm modal
 */
function showNextDuelConfirmModal(partner) {
    console.log('🎮 Next duel confirm modal ko\'rsatilmoqda');
    
    const modalHTML = `
        <div class="modal active" id="nextDuelConfirmModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="color: #fff;">🎮 Yangi Duel</h3>
                </div>
                <div class="modal-body">
                    <p style="color: #ccc;">Yangi duel o'ynashni xohlaysizmi?</p>
                    <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <p style="color: #fff; font-size: 0.9rem; margin-bottom: 5px;">
                            <i class="fas fa-info-circle"></i> <strong>Eslatma:</strong>
                        </p>
                        <ul style="color: #ccc; font-size: 0.85rem; padding-left: 20px; margin: 0;">
                            <li>Yangi duel boshlaganingizda, navbatga qo'shilasiz</li>
                            <li>Yangi sherik topilgach, duel boshlanadi</li>
                            <li>Hozirgi match ma'lumotlari saqlanib qoladi</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel-btn" onclick="window.gameLogic?.startNewDuelFromMatch?.()" 
                            style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        <i class="fas fa-play"></i> Ha, Yangi Duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="hideNextDuelConfirmModal()" 
                            style="background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);">
                        <i class="fas fa-times"></i> Bekor qilish
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHTML);
}

/**
 * Hide next duel confirm modal
 */
function hideNextDuelConfirmModal() {
    console.log('🎮 Next duel confirm modal yopilmoqda');
    
    const modal = document.getElementById('nextDuelConfirmModal');
    if (modal) {
        modal.remove();
        console.log('✅ Next duel confirm modal yopildi');
    }
}

/**
 * Show modal
 */
function showModal(html) {
    console.log('🎯 Modal ko\'rsatilmoqda');
    
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.zIndex = '2000';
        document.body.appendChild(container);
        console.log('✅ Modal container yaratildi');
        return container;
    })();
    
    modalContainer.innerHTML = html;
    
    // Background click yopish
    const modal = modalContainer.querySelector('.modal.active');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                console.log('✅ Background click bilan modal yopildi');
            }
        });
        
        // Escape key yopish
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
                console.log('✅ Escape key bilan modal yopildi');
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
    }
}

/**
 * Hide all modals
 */
function hideAllModals() {
    console.log('🎯 Barcha custom modallar yopilmoqda');
    
    const modals = ['timeoutModal', 'opponentLeftModal', 'noMatchModal', 'likedOnlyModal', 'matchModal', 'nextDuelConfirmModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    });
    
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer && modalContainer.children.length === 0) {
        modalContainer.remove();
    }
    
    console.log('✅ Barcha custom modallar yopildi');
}

// ==================== GLOBAL FUNCTIONS EXPORT ====================

/**
 * Export functions to global scope
 */
function exportGlobalFunctions() {
    console.log('🌍 Global funksiyalar export qilinmoqda...');
    
    // UI Manager functions
    window.selectGender = (gender) => window.uiManager?.selectGender?.(gender);
    window.hideGenderModal = () => window.uiManager?.hideGenderModal?.();
    window.openTelegramChat = (username) => window.uiManager?.openTelegramChat?.(username);
    window.selectFilter = (filter) => window.uiManager?.selectFilter?.(filter);
    window.returnToMenu = () => window.gameLogic?.returnToMenu?.();
    window.buyItem = (itemId) => window.uiManager?.buyItem?.(itemId);
    window.closeChatModal = () => window.uiManager?.closeChatModal?.();
    window.openChatFromFriend = (friend) => window.uiManager?.openChatFromFriend?.(friend);
    window.startNewDuelFromMatch = () => window.gameLogic?.startNewDuelFromMatch?.();
    
    // Screen functions
    window.showScreen = (screen) => window.uiManager?.showScreen?.(screen);
    window.updateQueueStatus = (msg) => window.uiManager?.updateQueueStatus?.(msg);
    window.updateDuelStatus = (msg) => window.uiManager?.updateDuelStatus?.(msg);
    window.updateUIFromUserState = () => window.uiManager?.updateUIFromUserState?.();
    window.addGenderBadge = (element, gender) => window.uiManager?.addGenderBadge?.(element, gender);
    window.showGenderModal = (mandatory) => window.modalManager?.showGenderModal?.(mandatory);
    window.openChat = (partner) => window.modalManager?.showChatModal?.(partner);
    
    // Game Logic functions
    window.handleMatch = (data) => window.gameLogic?.handleMatch?.(data);
    window.handleLikedOnly = (data) => window.gameLogic?.handleLikedOnly?.(data);
    window.handleNoMatch = (data) => window.gameLogic?.handleNoMatch?.(data);
    window.handleTimeout = (data) => window.gameLogic?.handleTimeout?.(data);
    window.handleWaitingResponse = (data) => window.gameLogic?.handleWaitingResponse?.(data);
    window.updateStats = (data) => window.gameLogic?.updateStats?.(data);
    window.resetVoteButtons = () => window.gameLogic?.resetVoteButtons?.();
    window.startTimer = () => window.gameLogic?.startTimer?.();
    
    // Modal functions
    window.skipToNextDuel = () => window.gameLogic?.skipToNextDuel?.();
    window.hideAllModals = hideAllModals;
    window.hideNextDuelConfirmModal = hideNextDuelConfirmModal;
    
    // Modal display functions
    window.showLikedOnlyOptions = showLikedOnlyOptions;
    window.showNoMatchModal = showNoMatchModal;
    window.showTimeoutOptions = showTimeoutOptions;
    window.showOpponentTimeoutModal = showOpponentTimeoutModal;
    window.showOpponentLeftModal = showOpponentLeftModal;
    window.showNoMatchOptions = showNoMatchOptions;
    window.showNextDuelConfirmModal = showNextDuelConfirmModal;
    
    console.log('✅ Barcha global funksiyalar export qilindi');
}
// main.js ga qo'shing

// Lazy loading images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            imageObserver.unobserve(img);
        }
    });
});

// Code splitting
function loadModule(moduleName) {
    return import(`./modules/${moduleName}.js`)
        .then(module => module.default)
        .catch(() => console.error(`Module ${moduleName} failed to load`));
}

// Memory management
class MemoryManager {
    static clearOldData() {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const oldChats = storage.get('chat_history', []).filter(chat => 
            chat.lastActivity > oneWeekAgo
        );
        storage.set('chat_history', oldChats);
    }
    
    static compressImages(base64) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 150;
                canvas.height = 150;
                ctx.drawImage(img, 0, 0, 150, 150);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = base64;
        });
    }
}
// ==================== INITIALIZATION ====================

/**
 * Initialize the application
 */
function initApplication() {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Initialize element references
    initElementReferences();
    
    // Initialize modal manager (MUHIM!)
    if (window.modalManager) {
        window.modalManager.initAllModals();
        console.log('✅ Modal manager ishga tushirildi');
    } else {
        console.error('❌ Modal manager topilmadi');
    }
    
    // Initialize user profile
    if (window.uiManager) {
        window.uiManager.initUserProfile();
        console.log('✅ UI manager ishga tushirildi');
    } else {
        console.error('❌ UI manager topilmadi');
    }
    
    // Initialize tab navigation
    if (window.uiManager) {
        window.uiManager.initTabNavigation();
        console.log('✅ Tab navigation ishga tushirildi');
    }
    
    // Initialize event listeners
    initEventListeners();
    
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

// ==================== DOM READY ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplication);
} else {
    initApplication();
}