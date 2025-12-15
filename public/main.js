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
    currentGender: 'not_specified',
    hasSelectedGender: false,
    lastOpponent: null
};

// ==================== DOM ELEMENTLARI ====================
const elements = {
    tabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),

    welcomeScreen: document.getElementById('welcomeScreen'),
    queueScreen: document.getElementById('queueScreen'),
    duelScreen: document.getElementById('duelScreen'),
    matchScreen: document.getElementById('matchScreen'),

    myAvatar: document.getElementById('myAvatar'),
    myName: document.getElementById('myName'),
    myUsername: document.getElementById('myUsername'),
    myMatches: document.getElementById('myMatches'),
    myLikes: document.getElementById('myLikes'),

    waitingCount: document.getElementById('waitingCount'),
    position: document.getElementById('position'),
    positionInfo: document.getElementById('positionInfo'),
    queueStatus: document.getElementById('queueStatus'),

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

    startBtn: document.getElementById('startBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    noBtn: document.getElementById('noBtn'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),

    partnerName: document.getElementById('partnerName'),
    matchText: document.getElementById('matchText'),
    matchRewards: document.getElementById('matchRewards'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardXP: document.getElementById('rewardXP'),
    newRating: document.getElementById('newRating'),
    matchOptions: document.getElementById('matchOptions'),

    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileBio: document.getElementById('profileBio'),
    statRating: document.getElementById('statRating'),
    statMatches: document.getElementById('statMatches'),
    statDuels: document.getElementById('statDuels'),
    statWinRate: document.getElementById('statWinRate'),

    coinsCount: document.getElementById('coinsCount'),
    levelCount: document.getElementById('levelCount'),
    shopCoinsCount: document.getElementById('shopCoinsCount'),

    friendsList: document.getElementById('friendsList'),
    friendRequestsSection: document.getElementById('friendRequestsSection'),
    friendRequestsList: document.getElementById('friendRequestsList'),
    friendRequestsCount: document.getElementById('friendRequestsCount'),
    friendsCount: document.getElementById('friendsCount'),
    onlineFriendsCount: document.getElementById('onlineFriendsCount'),
    mutualLikesBadge: document.getElementById('mutualLikesBadge'),
    mutualLikesCount: document.getElementById('mutualLikesCount'),

    shopItemsList: document.getElementById('shopItemsList'),
    leaderboardList: document.getElementById('leaderboardList'),
    leaderboardTabs: document.querySelectorAll('.leaderboard-tab'),
    leaderboardUpdated: document.getElementById('leaderboardUpdated'),

    profileQuestsList: document.getElementById('profileQuestsList'),
    dailyQuestsList: document.getElementById('dailyQuestsList'),
    questsPreview: document.getElementById('questsPreview'),

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
    saveProfileBtn: document.getElementById('saveProfileBtn')
};

// ==================== GLOBAL USER ====================
let tgUserGlobal = null;

// ==================== PROFILNI YUKLASH + LOCALSTORAGE GENDER ====================
function initUserProfile() {
    let tgUser = {};

    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            tgUser = Telegram.WebApp.initDataUnsafe.user || {};
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    } catch (error) {
        console.log('Telegram Web App mavjud emas');
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
    const userUsername = tgUser.username ? '@' + tgUser.username : '';

    elements.myAvatar.src = userPhoto;
    elements.myName.textContent = userName;
    elements.myUsername.textContent = userUsername;
    elements.profileAvatar.src = userPhoto;
    elements.profileName.textContent = userName;
    elements.profileUsername.textContent = userUsername;

    tgUserGlobal = tgUser;

    // localStorage dan gender yuklash
    const savedGender = localStorage.getItem('userGender');
    const savedHasSelected = localStorage.getItem('hasSelectedGender') === 'true';

    if (savedHasSelected && savedGender) {
        gameState.currentGender = savedGender;
        gameState.hasSelectedGender = true;
        addGenderBadge(elements.myName, savedGender);
        addGenderBadge(elements.profileName, savedGender);
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
    }

    return tgUser;
}

// ==================== SERVERGA ULANISH ====================
function connectToServer() {
    if (!tgUserGlobal) return;
    if (gameState.socket && gameState.isConnected) return;

    console.log('Serverga ulanmoqda...');

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

    gameState.socket.on('connect', () => {
        console.log('Serverga ulandi');
        gameState.isConnected = true;
        updateQueueStatus('Serverga ulandi...');

        gameState.socket.emit('auth', {
            userId: tgUserGlobal.id,
            firstName: tgUserGlobal.first_name,
            lastName: tgUserGlobal.last_name || '',
            username: tgUserGlobal.username,
            photoUrl: tgUserGlobal.photo_url,
            language: tgUserGlobal.language_code || 'uz'
        });
    });

    // ==================== SOCKET EVENTLAR ====================
    gameState.socket.on('auth_ok', (data) => {
        console.log('Autentifikatsiya muvaffaqiyatli', data);
        gameState.playerData = data;

        // Statistika yangilash
        elements.coinsCount.textContent = data.coins || 100;
        elements.levelCount.textContent = data.level || 1;
        elements.shopCoinsCount.textContent = data.coins || 100;
        elements.statRating.textContent = data.rating || 1500;
        elements.statMatches.textContent = data.matches || 0;
        elements.statDuels.textContent = data.duels || 0;
        elements.statWinRate.textContent = data.winRate ? data.winRate + '%' : '0%';
        elements.myMatches.textContent = data.matches || 0;
        elements.myLikes.textContent = data.totalLikes || 0;
        elements.superLikeCount.textContent = data.dailySuperLikes ?? 3;
        elements.profileBio.textContent = data.bio || 'Bio kiritilmagan';

        addGenderBadge(elements.myName, gameState.currentGender);
        addGenderBadge(elements.profileName, gameState.currentGender);

        showScreen('queue');
        updateQueueStatus('Navbatda...');

        // === ASOSIY TUZATISH: Avtomatik navbatga kirish ===
        gameState.socket.emit('enter_queue');

        if (!gameState.hasSelectedGender) {
            setTimeout(enforceGenderSelection, 1000);
        }
    });

    gameState.socket.on('waiting_count', (data) => {
        elements.waitingCount.textContent = data.count;
        if (data.position > 0) {
            elements.position.textContent = data.position;
            elements.positionInfo.style.display = 'block';
            updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}`);
        } else {
            elements.positionInfo.style.display = 'none';
        }
    });

    gameState.socket.on('show_gender_selection', enforceGenderSelection);

    gameState.socket.on('gender_selected', (data) => {
        gameState.currentGender = data.gender;
        gameState.hasSelectedGender = true;

        localStorage.setItem('userGender', data.gender);
        localStorage.setItem('hasSelectedGender', 'true');

        document.querySelectorAll('.gender-badge').forEach(b => b.remove());
        addGenderBadge(elements.myName, data.gender);
        addGenderBadge(elements.profileName, data.gender);

        elements.genderWarning.classList.add('hidden');
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';

        hideGenderModal();

        showNotification('Jins tanlandi', data.gender === 'male' ? 'Faqat ayollar bilan duel' : data.gender === 'female' ? 'Faqat erkaklar bilan duel' : 'Hamma bilan duel');
    });

    gameState.socket.on('duel_started', (data) => {
        gameState.isInDuel = true;
        gameState.currentDuelId = data.duelId;
        showScreen('duel');

        document.querySelectorAll('.met-again-indicator, .previous-match-indicator').forEach(el => el.remove());

        elements.opponentAvatar.src = data.opponent.photo || 'https://ui-avatars.com/api/?name=R&background=764ba2&color=fff';
        elements.opponentName.innerHTML = data.opponent.name;
        elements.opponentUsername.textContent = data.opponent.username || '';
        elements.opponentRating.textContent = data.opponent.rating || 1500;
        elements.opponentMatches.textContent = data.opponent.matches || 0;
        elements.opponentLevel.textContent = data.opponent.level || 1;

        addGenderBadge(elements.opponentName, data.opponent.gender);

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
    });

    gameState.socket.on('match', (data) => {
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
        }

        elements.rewardCoins.textContent = data.rewards.coins;
        elements.rewardXP.textContent = data.rewards.xp;
        elements.newRating.textContent = data.newRating;

        elements.matchOptions.innerHTML = '';
        const options = data.isRematch
            ? [{action: 'open_chat', label: '💬 Chatga o\'tish'}, {action: 'rematch', label: '🔄 Qayta duel'}, {action: 'skip', label: '➡️ O\'tkazish'}]
            : [{action: 'open_chat', label: '💬 Chatga o\'tish'}, {action: 'skip', label: '➡️ O\'tkazish'}];

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'match-option-btn';
            btn.innerHTML = opt.label;
            btn.onclick = () => handleMatchOption(opt.action, data.partner.id);
            if (opt.action === 'rematch') btn.style.background = '#9b59b6';
            elements.matchOptions.appendChild(btn);
        });

        if (typeof confetti === 'function') confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });

        setTimeout(() => {
            if (!elements.chatModal.classList.contains('active')) returnToQueue();
        }, 5000);
    });

    gameState.socket.on('liked_only', () => {
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '❤️';
        updateDuelStatus('Siz yoqtirdingiz, lekin raqib yoqtirmadi');
        setTimeout(returnToQueue, 3000);
    });

    gameState.socket.on('no_match', () => {
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '✖';
        updateDuelStatus('Match bo\'lmadi. Yangi raqib izlanmoqda...');
        setTimeout(returnToQueue, 3000);
    });

    gameState.socket.on('rematch_request', (data) => showRematchModal(data.opponentName, data.opponentId));
    gameState.socket.on('rematch_accepted', (data) => showNotification('Qayta Duel', `${data.opponentName} qabul qildi!`));
    gameState.socket.on('rematch_declined', (data) => showNotification('Rad etildi', `${data.opponentName} rad etdi`));

    gameState.socket.on('chat_opened', (data) => openChatModal(data.partner));
    gameState.socket.on('error', (data) => showNotification('Xato', data.message || 'Noma\'lum xato'));
    gameState.socket.on('disconnect', () => {
        gameState.isConnected = false;
        updateQueueStatus('Serverdan uzildi. Qayta ulanmoqda...');
    });
}

// ==================== GENDER FUNKSİYALARI ====================
function selectGender(gender) {
    if (gameState.socket && gameState.socket.connected) {
        gameState.socket.emit('select_gender', { gender });
    } else {
        connectToServer();
        const sendOnce = () => {
            gameState.socket.emit('select_gender', { gender });
            gameState.socket.off('connect', sendOnce);
        };
        gameState.socket.on('connect', sendOnce);
    }
}

function hideGenderModal() {
    elements.genderModal.classList.remove('active');
}

function enforceGenderSelection() {
    if (gameState.hasSelectedGender) {
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
        return true;
    }

    elements.genderModal.classList.add('active');
    elements.genderWarning.classList.remove('hidden');
    elements.startBtn.disabled = true;
    elements.startBtn.textContent = 'Avval gender tanlang';
    return false;
}

function addGenderBadge(element, gender) {
    if (!element || gender === 'not_specified') return;
    const old = element.querySelector('.gender-badge');
    if (old) old.remove();

    const badge = document.createElement('span');
    badge.className = `gender-badge gender-${gender}-badge`;
    badge.innerHTML = gender === 'male' ? '<i class="fas fa-mars"></i> Erkak' : '<i class="fas fa-venus"></i> Ayol';
    element.appendChild(badge);
}

function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    elements.timer.textContent = 20;

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        elements.timer.textContent = gameState.timeLeft;
        if (gameState.timeLeft <= 5) elements.timer.style.color = '#ff4444';
        if (gameState.timeLeft <= 0 && gameState.socket) {
            gameState.socket.emit('vote', { choice: 'skip' });
        }
    }, 1000);
}

function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) return;

    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        b.disabled = true;
        b.style.opacity = '0.6';
    });

    gameState.socket.emit('vote', { choice });

    if (choice === 'like') elements.timer.textContent = '❤️';
    else if (choice === 'super_like') {
        elements.timer.textContent = '💖';
        const count = parseInt(elements.superLikeCount.textContent);
        if (count > 0) elements.superLikeCount.textContent = count - 1;
    } else elements.timer.textContent = '✖';

    updateDuelStatus(choice === 'like' ? 'LIKE berdingiz...' : choice === 'super_like' ? 'SUPER LIKE!' : 'O\'tkazib yubordingiz...');

    setTimeout(() => {
        if (!elements.duelScreen.classList.contains('hidden')) {
            [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
                b.disabled = false;
                b.style.opacity = '1';
            });
        }
    }, 1000);
}

function handleMatchOption(action, userId) {
    if (action === 'open_chat') gameState.socket.emit('open_chat', { userId });
    else if (action === 'rematch') {
        gameState.socket.emit('request_rematch', { opponentId: userId });
        showNotification('So‘rov yuborildi', 'Qayta duel so‘rovi yuborildi');
        returnToQueue();
    } else if (action === 'skip') returnToQueue();
}

function showRematchModal(name, id) {
    elements.rematchOpponentName.textContent = name;
    gameState.lastOpponent = id;
    elements.rematchModal.classList.add('active');
}

function openChatModal(partner) {
    elements.chatPartnerAvatar.src = partner.photo;
    elements.chatPartnerName.textContent = partner.name;
    elements.chatModal.classList.add('active');
}

function showNotification(title, message) {
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('active');
    setTimeout(() => elements.notification.classList.remove('active'), 3000);
}

function showScreen(screen) {
    [elements.welcomeScreen, elements.queueScreen, elements.duelScreen, elements.matchScreen]
        .forEach(s => s.classList.add('hidden'));

    if (screen === 'welcome') elements.welcomeScreen.classList.remove('hidden');
    if (screen === 'queue') elements.queueScreen.classList.remove('hidden');
    if (screen === 'duel') elements.duelScreen.classList.remove('hidden');
    if (screen === 'match') elements.matchScreen.classList.remove('hidden');
}

function updateQueueStatus(msg) {
    elements.queueStatus.textContent = msg;
}

function updateDuelStatus(msg) {
    elements.duelStatus.textContent = msg;
}

function returnToQueue() {
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    showScreen('queue');
    updateQueueStatus('Yangi raqib izlanmoqda...');
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    initUserProfile();

    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
        });
    });

    elements.startBtn.addEventListener('click', () => {
        if (!enforceGenderSelection()) return;
        connectToServer();
    });

    elements.leaveQueueBtn.addEventListener('click', () => {
        if (gameState.socket) gameState.socket.emit('leave_queue');
        showScreen('welcome');
    });

    elements.noBtn.addEventListener('click', () => handleVote('skip'));
    elements.likeBtn.addEventListener('click', () => handleVote('like'));
    elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));

    document.getElementById('selectMaleBtn')?.addEventListener('click', () => {
        selectGender('male');
        hideGenderModal();
    });
    document.getElementById('selectFemaleBtn')?.addEventListener('click', () => {
        selectGender('female');
        hideGenderModal();
    });
    document.getElementById('selectAllBtn')?.addEventListener('click', () => {
        selectGender('not_specified');
        hideGenderModal();
    });
    document.getElementById('selectGenderNowBtn')?.addEventListener('click', enforceGenderSelection);

    elements.acceptRematchBtn.addEventListener('click', () => {
        if (gameState.socket) gameState.socket.emit('accept_rematch', { opponentId: gameState.lastOpponent });
        elements.rematchModal.classList.remove('active');
    });

    elements.declineRematchBtn.addEventListener('click', () => elements.rematchModal.classList.remove('active'));
    elements.closeChatBtn.addEventListener('click', () => elements.chatModal.classList.remove('active'));

    elements.editProfileBtn.addEventListener('click', () => {
        elements.editBio.value = gameState.playerData?.bio || '';
        elements.editGender.value = gameState.currentGender;
        elements.profileEditModal.classList.add('active');
    });

    elements.closeProfileEditBtn.addEventListener('click', () => elements.profileEditModal.classList.remove('active'));

    elements.saveProfileBtn.addEventListener('click', () => {
        const bio = elements.editBio.value.trim();
        const gender = elements.editGender.value;

        if (gender === 'not_specified') {
            showNotification('Xato', 'Gender tanlash majburiy!');
            return;
        }

        if (gameState.socket) gameState.socket.emit('update_profile', { bio, gender });
        elements.profileEditModal.classList.remove('active');
    });

    // Test rejimi
    if (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:') {
        setTimeout(() => elements.startBtn.click(), 1000);
    }
});

// Mobile touch
['touchstart', 'touchend'].forEach(ev => {
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(btn => {
        if (!btn) return;
        btn.addEventListener(ev, e => {
            e.preventDefault();
            if (ev === 'touchstart') btn.style.transform = 'scale(0.95)';
            else {
                btn.style.transform = '';
                btn.click();
            }
        });
    });
});