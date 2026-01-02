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
}

// ==================== EVENT LISTENERS ====================

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Start game button
    if (window.elements.startBtn) {
        window.elements.startBtn.addEventListener('click', startGame);
    }
    
    // Leave queue button
    if (window.elements.leaveQueueBtn) {
        window.elements.leaveQueueBtn.addEventListener('click', leaveQueue);
    }
    
    // Vote buttons
    if (window.elements.noBtn) {
        window.elements.noBtn.addEventListener('click', () => window.gameLogic?.handleVote?.('skip'));
    }
    
    if (window.elements.likeBtn) {
        window.elements.likeBtn.addEventListener('click', () => window.gameLogic?.handleVote?.('like'));
    }
    
    if (window.elements.superLikeBtn) {
        window.elements.superLikeBtn.addEventListener('click', () => window.gameLogic?.handleVote?.('super_like'));
    }
    
    // Gender selection buttons
    if (window.elements.selectMaleBtn) {
        window.elements.selectMaleBtn.onclick = () => {
            window.uiManager?.selectGender?.('male');
            window.uiManager?.hideGenderModal?.();
        };
    }
    
    if (window.elements.selectFemaleBtn) {
        window.elements.selectFemaleBtn.onclick = () => {
            window.uiManager?.selectGender?.('female');
            window.uiManager?.hideGenderModal?.();
        };
    }
    
    if (window.elements.selectAllBtn) {
        window.elements.selectAllBtn.onclick = () => {
            window.uiManager?.selectGender?.('not_specified');
            window.uiManager?.hideGenderModal?.();
        };
    }
    
    if (window.elements.selectGenderNowBtn) {
        window.elements.selectGenderNowBtn.addEventListener('click', () => {
            window.uiManager?.showGenderModal?.(true);
        });
    }
    
    // Profile edit buttons
    if (window.elements.editProfileBtn) {
        window.elements.editProfileBtn.addEventListener('click', () => {
            if (window.elements.editBio) {
                window.elements.editBio.value = window.userState.bio || '';
            }
            if (window.elements.editGender) {
                window.elements.editGender.value = window.userState.currentGender || 'not_specified';
            }
            if (window.elements.editFilter) {
                window.elements.editFilter.value = window.userState.filter || 'not_specified';
            }
            if (window.elements.profileEditModal) {
                window.elements.profileEditModal.classList.add('active');
            }
        });
    }
    
    if (window.elements.closeProfileEditBtn) {
        window.elements.closeProfileEditBtn.addEventListener('click', () => {
            if (window.elements.profileEditModal) {
                window.elements.profileEditModal.classList.remove('active');
            }
        });
    }
    
    if (window.elements.saveProfileBtn) {
        window.elements.saveProfileBtn.addEventListener('click', () => {
            const bio = window.elements.editBio?.value.trim() || '';
            const gender = window.elements.editGender?.value || 'not_specified';
            const filter = window.elements.editFilter?.value || 'not_specified';
            
            if (window.gameState.socket) {
                window.socketManager?.updateProfile?.({ bio, gender, filter });
                
                window.userState.bio = bio;
                if (gender !== window.userState.currentGender) {
                    window.userState.currentGender = gender;
                    window.userState.hasSelectedGender = true;
                }
                window.userState.filter = filter;
                
                window.storage?.saveUserState?.();
                window.uiManager?.updateUIFromUserState?.();
                
                if (bio && window.elements.profileBio) {
                    window.elements.profileBio.textContent = bio;
                }
            }
            
            if (window.elements.profileEditModal) {
                window.elements.profileEditModal.classList.remove('active');
            }
            window.utils?.showNotification('✅ Profil yangilandi', 'O\'zgarishlar saqlandi');
        });
    }
    
    // Chat modal buttons
    if (window.elements.closeChatBtn) {
        window.elements.closeChatBtn.addEventListener('click', () => {
            window.uiManager?.closeChatModal?.();
        });
    }
    
    if (window.elements.chatOpenTelegramBtn) {
        window.elements.chatOpenTelegramBtn.addEventListener('click', () => {
            if (window.gameState.currentPartner && window.gameState.currentPartner.username) {
                window.uiManager?.openTelegramChat?.(window.gameState.currentPartner.username);
            } else {
                window.utils?.showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
                window.uiManager?.closeChatModal?.();
            }
        });
    }
    
    // View stats button
    if (window.elements.viewStatsBtn) {
        window.elements.viewStatsBtn.addEventListener('click', () => {
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
            alert('Batafsil statistika:\n\n' + stats);
        });
    }
    
    // Refresh friends button
    if (window.elements.refreshFriendsBtn) {
        window.elements.refreshFriendsBtn.addEventListener('click', () => {
            window.uiManager?.loadFriendsList?.();
        });
    }
}

// ==================== GAME FUNCTIONS ====================

/**
 * Start the game
 */
function startGame() {
    console.log('🎮 O\'yinni boshlash');
    
    if (!window.userState.hasSelectedGender) {
        window.uiManager?.showGenderModal?.(true);
        window.utils?.showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
    
    window.socketManager?.connectToServer?.();
}

/**
 * Leave the queue
 */
function leaveQueue() {
    console.log('🚪 Navbatdan chiqish');
    
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
    const modal = document.getElementById('nextDuelConfirmModal');
    if (modal) modal.remove();
}

/**
 * Show modal
 */
function showModal(html) {
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
    
    modalContainer.innerHTML = html;
}

/**
 * Hide all modals
 */
function hideAllModals() {
    const modals = ['timeoutModal', 'opponentLeftModal', 'noMatchModal', 'likedOnlyModal', 'matchModal', 'nextDuelConfirmModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    });
    
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer && modalContainer.children.length === 0) {
        modalContainer.remove();
    }
}

// ==================== GLOBAL FUNCTIONS EXPORT ====================

/**
 * Export functions to global scope
 */
function exportGlobalFunctions() {
    window.selectGender = (gender) => window.uiManager?.selectGender?.(gender);
    window.hideGenderModal = () => window.uiManager?.hideGenderModal?.();
    window.openTelegramChat = (username) => window.uiManager?.openTelegramChat?.(username);
    window.selectFilter = (filter) => window.uiManager?.selectFilter?.(filter);
    window.skipToNextDuel = () => window.gameLogic?.skipToNextDuel?.();
    window.returnToMenu = () => window.gameLogic?.returnToMenu?.();
    window.buyItem = (itemId) => window.uiManager?.buyItem?.(itemId);
    window.hideAllModals = hideAllModals;
    window.closeChatModal = () => window.uiManager?.closeChatModal?.();
    window.openChatFromFriend = (friend) => window.uiManager?.openChatFromFriend?.(friend);
    window.startNewDuelFromMatch = () => window.gameLogic?.startNewDuelFromMatch?.();
    window.hideNextDuelConfirmModal = hideNextDuelConfirmModal;
    
    window.showScreen = (screen) => window.uiManager?.showScreen?.(screen);
    window.updateQueueStatus = (msg) => window.uiManager?.updateQueueStatus?.(msg);
    window.updateDuelStatus = (msg) => window.uiManager?.updateDuelStatus?.(msg);
    window.updateUIFromUserState = () => window.uiManager?.updateUIFromUserState?.();
    window.addGenderBadge = (element, gender) => window.uiManager?.addGenderBadge?.(element, gender);
    window.showGenderModal = (mandatory) => window.uiManager?.showGenderModal?.(mandatory);
    window.openChat = (partner) => window.uiManager?.openChat?.(partner);
    
    window.handleMatch = (data) => window.gameLogic?.handleMatch?.(data);
    window.handleLikedOnly = (data) => window.gameLogic?.handleLikedOnly?.(data);
    window.handleNoMatch = (data) => window.gameLogic?.handleNoMatch?.(data);
    window.handleTimeout = (data) => window.gameLogic?.handleTimeout?.(data);
    window.handleWaitingResponse = (data) => window.gameLogic?.handleWaitingResponse?.(data);
    window.updateStats = (data) => window.gameLogic?.updateStats?.(data);
    
    window.resetVoteButtons = () => window.gameLogic?.resetVoteButtons?.();
    window.startTimer = () => window.gameLogic?.startTimer?.();
    
    window.showLikedOnlyOptions = showLikedOnlyOptions;
    window.showNoMatchModal = showNoMatchModal;
    window.showTimeoutOptions = showTimeoutOptions;
    window.showOpponentTimeoutModal = showOpponentTimeoutModal;
    window.showOpponentLeftModal = showOpponentLeftModal;
    window.showNoMatchOptions = showNoMatchOptions;
    window.showNextDuelConfirmModal = showNextDuelConfirmModal;
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the application
 */
function initApplication() {
    console.log('🚀 DOM yuklandi, dastur ishga tushmoqda...');
    
    // Initialize element references
    initElementReferences();
    
    // Initialize user profile
    window.uiManager?.initUserProfile?.();
    
    // Initialize tab navigation
    window.uiManager?.initTabNavigation?.();
    
    // Initialize event listeners
    initEventListeners();
    
    // Export global functions
    exportGlobalFunctions();
    
    // Load initial data
    window.uiManager?.loadProfileQuests?.();
    window.uiManager?.loadShopItems?.();
    window.uiManager?.loadLeaderboard?.();
    window.uiManager?.loadFriendsList?.();
    
    console.log('✅ main.js to\'liq yuklandi - Barcha funksiyalar aktiv');
}

// ==================== DOM READY ====================

document.addEventListener('DOMContentLoaded', initApplication);