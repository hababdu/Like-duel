// ==================== IMPORTLAR ====================
import { updateUIFromUserState, addGenderBadge, createFilterOptions, selectFilter, showGenderModal, hideGenderModal, showNotification, showScreen, initTabNavigation, updateQueueStatus, updateDuelStatus, updateStats, addFilterToWelcomeScreen } from './ui.js';
import { connectToServer } from './socket.js';
import { startGame, leaveQueue, handleVote, handleMatch, handleLikedOnly, handleNoMatch, handleTimeout, handleWaitingResponse, openChat, closeChatModal, startNewDuelFromMatch, hideNextDuelConfirmModal, skipToNextDuel, returnToMenu, resetVoteButtons, startTimer, loadFriendsList, loadShopItems, loadLeaderboard, loadProfileQuests, buyItem, showOpponentTimeoutModal, showOpponentLeftModal, showNoMatchOptions, hideAllModals, handleMatchOption, showNextDuelConfirmModal, openChatFromFriend, formatDate, showLikedOnlyOptions, showNoMatchModal, showTimeoutOptions, openTelegramChat } from './gameLogic.js';
import { saveUserStateToLocalStorage } from './storage.js';

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
    matchCompleted: false,
    skipToNextRequested: false // Yangi flag
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
window.hideAllModals = hideAllModals;
window.closeChatModal = closeChatModal;
window.openChatFromFriend = openChatFromFriend;
window.startNewDuelFromMatch = startNewDuelFromMatch;
window.hideNextDuelConfirmModal = hideNextDuelConfirmModal;