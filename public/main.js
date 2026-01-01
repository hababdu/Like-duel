// ==================== KONFIGURATSIYA ====================
const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const SOCKET_URL = IS_PRODUCTION 
    ? 'https://like-duel.onrender.com' 
    : 'http://localhost:3000';

console.log(`📍 ${IS_PRODUCTION ? 'Production (Render.com)' : 'Development'} rejimi`);
console.log(`🔌 Socket URL: ${SOCKET_URL}`);

// ==================== GLOBAL O'ZGARUVCHILAR ====================
let socket = null;
let currentUser = null;
let currentDuel = null;
let currentOpponent = null;
let duelTimer = null;
let timeLeft = 20;

// ==================== DOM ELEMENTLARI ====================
const elements = {
    // Asosiy elementlar
    playBtn: document.getElementById('playBtn'),
    leaveQueueBtn: document.getElementById('leaveQueueBtn'),
    waitingStatus: document.getElementById('waitingStatus'),
    profileBtn: document.getElementById('profileBtn'),
    statsBtn: document.getElementById('statsBtn'),
    friendsBtn: document.getElementById('friendsBtn'),
    
    // Profile modal
    profileModal: document.getElementById('profileModal'),
    closeProfileModal: document.querySelector('.close-profile'),
    profilePhoto: document.getElementById('profilePhoto'),
    profileName: document.getElementById('profileName'),
    profileUsername: document.getElementById('profileUsername'),
    profileGender: document.getElementById('profileGender'),
    profileBio: document.getElementById('profileBio'),
    profileFilter: document.getElementById('profileFilter'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    
    // Stats modal
    statsModal: document.getElementById('statsModal'),
    closeStatsModal: document.querySelector('.close-stats'),
    userRating: document.getElementById('userRating'),
    userCoins: document.getElementById('userCoins'),
    userLevel: document.getElementById('userLevel'),
    userMatches: document.getElementById('userMatches'),
    userDuels: document.getElementById('userDuels'),
    userWins: document.getElementById('userWins'),
    userWinRate: document.getElementById('userWinRate'),
    userFriends: document.getElementById('userFriends'),
    userLikes: document.getElementById('userLikes'),
    dailySuperLikes: document.getElementById('dailySuperLikes'),
    
    // Gender selection modal
    genderModal: document.getElementById('genderModal'),
    maleBtn: document.getElementById('maleBtn'),
    femaleBtn: document.getElementById('femaleBtn'),
    notSpecifiedBtn: document.getElementById('notSpecifiedBtn'),
    genderMessage: document.getElementById('genderMessage'),
    
    // Duel screen
    duelScreen: document.getElementById('duelScreen'),
    opponentPhoto: document.getElementById('opponentPhoto'),
    opponentName: document.getElementById('opponentName'),
    opponentUsername: document.getElementById('opponentUsername'),
    opponentRating: document.getElementById('opponentRating'),
    opponentMatches: document.getElementById('opponentMatches'),
    opponentLevel: document.getElementById('opponentLevel'),
    opponentGender: document.getElementById('opponentGender'),
    timerDisplay: document.getElementById('timerDisplay'),
    likeBtn: document.getElementById('likeBtn'),
    superLikeBtn: document.getElementById('superLikeBtn'),
    passBtn: document.getElementById('passBtn'),
    duelIdDisplay: document.getElementById('duelIdDisplay'),
    
    // Match result modal
    matchModal: document.getElementById('matchModal'),
    closeMatchModal: document.querySelector('.close-match'),
    matchTitle: document.getElementById('matchTitle'),
    matchMessage: document.getElementById('matchMessage'),
    partnerPhoto: document.getElementById('partnerPhoto'),
    partnerName: document.getElementById('partnerName'),
    rewardsCoins: document.getElementById('rewardsCoins'),
    rewardsXP: document.getElementById('rewardsXP'),
    newRating: document.getElementById('newRating'),
    
    // Friends modal
    friendsModal: document.getElementById('friendsModal'),
    closeFriendsModal: document.querySelector('.close-friends'),
    friendsList: document.getElementById('friendsList'),
    friendsCount: document.getElementById('friendsCount'),
    onlineCount: document.getElementById('onlineCount'),
    
    // Error modal
    errorModal: document.getElementById('errorModal'),
    errorMessage: document.getElementById('errorMessage'),
    closeErrorModal: document.querySelector('.close-error'),
    
    // Loading overlay
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // User info display
    userDisplayName: document.getElementById('userDisplayName'),
    userDisplayPhoto: document.getElementById('userDisplayPhoto'),
    userDisplayRating: document.getElementById('userDisplayRating'),
    userDisplayCoins: document.getElementById('userDisplayCoins'),
    userDisplayLevel: document.getElementById('userDisplayLevel')
};

// ==================== SOCKET.IO ULASH ====================
function connectSocket() {
    console.log('🔌 Socket ulanmoqda...');
    
    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
        console.log('✅ Serverga ulandi');
        hideLoading();
        authenticateUser();
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Ulanish xatosi:', error);
        showErrorModal('Serverga ulanib boʻlmadi. Qayta urinib koʻring.');
        showLoading('Serverga ulanilmoqda...');
        setTimeout(connectSocket, 3000);
    });
    
    socket.on('disconnect', (reason) => {
        console.warn('⚠️ Serverdan uzildi:', reason);
        if (reason === 'io server disconnect') {
            showErrorModal('Server tomonidan uzildi. Qayta ulaning.');
        }
    });
    
    socket.on('reconnecting', (attemptNumber) => {
        console.log(`🔄 Qayta ulanish (${attemptNumber}-urunish)`);
        showLoading('Qayta ulanilmoqda...');
    });
    
    socket.on('reconnect', () => {
        console.log('✅ Qayta ulandi');
        hideLoading();
        authenticateUser();
    });
    
    // ==================== SOCKET HANDLERS ====================
    
    socket.on('auth_ok', (data) => {
        console.log('✅ Auth muvaffaqiyatli:', data);
        
        // Foydalanuvchi ma'lumotlarini saqlash
        currentUser = {
            id: data.userId,
            firstName: data.firstName,
            username: data.username,
            photoUrl: data.photoUrl,
            rating: data.rating,
            coins: data.coins,
            level: data.level,
            gender: data.gender,
            hasSelectedGender: data.hasSelectedGender,
            bio: data.bio,
            filter: data.filter,
            dailySuperLikes: data.dailySuperLikes,
            winRate: data.winRate,
            matches: data.matches,
            duels: data.duels,
            wins: data.wins,
            totalLikes: data.totalLikes,
            mutualMatchesCount: data.mutualMatchesCount,
            friendsCount: data.friendsCount
        };
        
        // LocalStorage ga saqlash
        localStorage.setItem('likeDuelUser', JSON.stringify({
            userId: currentUser.id,
            firstName: currentUser.firstName,
            username: currentUser.username,
            gender: currentUser.gender,
            hasSelectedGender: currentUser.hasSelectedGender,
            bio: currentUser.bio,
            filter: currentUser.filter
        }));
        
        // UI yangilash
        updateProfileUI();
        
        // Agar gender tanlamagan bo'lsa
        if (!data.hasSelectedGender) {
            console.log('⚠️ Gender tanlanmagan, modal ochilmoqda...');
            setTimeout(() => {
                showGenderSelectionModal(true, 'Duel qilish uchun avval gender tanlashingiz kerak!');
            }, 1000);
        }
    });
    
    socket.on('gender_selected', (data) => {
        console.log('✅ Gender tanlandi:', data);
        if (currentUser) {
            currentUser.gender = data.gender;
            currentUser.hasSelectedGender = true;
        }
        hideGenderModal();
        showSuccessNotification('Gender muvaffaqiyatli tanlandi!');
    });
    
    socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga qo\'shildi:', data);
        elements.waitingStatus.innerHTML = `
            <strong>Navbatda: ${data.position}/${data.total}</strong><br>
            <small>Raqib qidirilmoqda...</small>
        `;
    });
    
    socket.on('waiting_count', (data) => {
        console.log('⏳ Navbat ma\'lumoti:', data);
        elements.waitingStatus.innerHTML = `
            <strong>Navbatda: ${data.position}/${data.count}</strong><br>
            <small>Tahmini kutish vaqti: ${data.estimatedTime} soniya</small>
        `;
    });
    
    socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        
        // Navbat UI'ni yopish
        elements.playBtn.style.display = 'block';
        elements.leaveQueueBtn.style.display = 'none';
        elements.waitingStatus.style.display = 'none';
        
        // Duel ma'lumotlarini saqlash
        currentDuel = data;
        currentOpponent = data.opponent;
        timeLeft = data.timeLeft;
        
        // Duel ekranini ko'rsatish
        showDuelScreen();
        
        // Opponent ma'lumotlarini ko'rsatish
        updateOpponentInfo();
        
        // Timer boshlash
        startDuelTimer();
    });
    
    socket.on('match', (data) => {
        console.log('💖 Match topildi:', data);
        
        // Duel ekranini yopish
        hideDuelScreen();
        
        // Match natijasini ko'rsatish
        showMatchResult(data);
        
        // User ma'lumotlarini yangilash
        if (currentUser) {
            currentUser.rating = data.newRating;
            currentUser.coins += data.rewards.coins;
            currentUser.matches += 1;
            if (data.isMutual) currentUser.wins += 1;
            updateProfileUI();
        }
    });
    
    socket.on('no_match', () => {
        console.log('😔 Match yoʻq');
        
        hideDuelScreen();
        showMatchResult({
            partner: currentOpponent,
            isMutual: false,
            message: 'Uzr, bu safar match yoʻq'
        });
    });
    
    socket.on('timeout', () => {
        console.log('⏰ Vaqt tugadi');
        
        hideDuelScreen();
        showErrorModal('Vaqt tugadi! Keyingi duelga tayyor boʻling.');
    });
    
    socket.on('opponent_left', () => {
        console.log('🏃‍♂️ Raqib ketdi');
        
        hideDuelScreen();
        showErrorModal('Raqib duelni tark etdi. Navbatga qaytildi.');
        returnToQueue();
    });
    
    socket.on('super_like_used', (data) => {
        console.log('🌟 Super like ishlatildi:', data);
        if (currentUser) {
            currentUser.dailySuperLikes = data.remaining;
            updateSuperLikeUI();
        }
    });
    
    socket.on('mutual_match', (data) => {
        console.log('💖 O\'zaro match:', data);
        showSuccessNotification(`🎉 ${data.partnerName} bilan o'zaro SUPER LIKE! Do'st bo'ldingiz.`);
    });
    
    socket.on('profile_updated', (data) => {
        console.log('✅ Profil yangilandi:', data);
        if (currentUser) {
            currentUser.bio = data.bio;
            currentUser.gender = data.gender;
            currentUser.filter = data.filter;
        }
        hideProfileModal();
        showSuccessNotification('Profil muvaffaqiyatli yangilandi!');
    });
    
    socket.on('friends_list', (data) => {
        console.log('👥 Doʻstlar roʻyxati:', data);
        showFriendsList(data);
    });
    
    socket.on('error', (data) => {
        console.error('❌ Server xatosi:', data);
        showErrorModal(data.message || 'Serverda xato yuz berdi');
    });
    
    socket.on('show_gender_selection', (data) => {
        console.log('ℹ️ Gender tanlash talab qilinmoqda:', data);
        showGenderSelectionModal(data.mandatory, data.message);
    });
}

// ==================== FUNKSIYALAR ====================

function authenticateUser() {
    console.log('🔐 Autentifikatsiya boshlanmoqda...');
    
    // LocalStorage'dan foydalanuvchi ma'lumotlarini olish
    const savedUser = localStorage.getItem('likeDuelUser');
    let userData = {};
    
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            userData = {
                userId: parsedUser.userId || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                firstName: parsedUser.firstName || 'Foydalanuvchi',
                username: parsedUser.username || '',
                photoUrl: parsedUser.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(parsedUser.firstName || 'User')}&background=667eea&color=fff`,
                gender: parsedUser.gender || 'not_specified',
                hasSelectedGender: parsedUser.hasSelectedGender || false,
                bio: parsedUser.bio || '',
                filter: parsedUser.filter || 'not_specified'
            };
            console.log('📁 Saqlangan profil yuklandi:', parsedUser);
        } catch (e) {
            console.error('❌ Saqlangan profil yuklanmadi:', e);
        }
    }
    
    // Agar localStorage'da ma'lumot yo'q bo'lsa
    if (!userData.userId) {
        userData = {
            userId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            firstName: 'Foydalanuvchi',
            username: 'user_' + Date.now(),
            photoUrl: 'https://ui-avatars.com/api/?name=Foydalanuvchi&background=667eea&color=fff',
            gender: 'not_specified',
            hasSelectedGender: false,
            bio: 'Salom, men yangi foydalanuvchiman',
            filter: 'not_specified'
        };
        console.log('🔄 Yangi foydalanuvchi yaratildi:', userData.userId);
    }
    
    console.log('📤 Auth ma\'lumotlari yuborilmoqda:', userData);
    
    if (!socket || !socket.connected) {
        console.error('❌ Socket ulanmagan');
        showErrorModal('Serverga ulanilmagan');
        return;
    }
    
    socket.emit('auth', userData);
}

function updateProfileUI() {
    if (!currentUser) return;
    
    // Asosiy UI elementlari
    elements.userDisplayName.textContent = currentUser.firstName;
    elements.userDisplayPhoto.src = currentUser.photoUrl;
    elements.userDisplayRating.textContent = currentUser.rating;
    elements.userDisplayCoins.textContent = currentUser.coins;
    elements.userDisplayLevel.textContent = currentUser.level;
    
    // Profile modal
    elements.profilePhoto.src = currentUser.photoUrl;
    elements.profileName.textContent = currentUser.firstName;
    elements.profileUsername.textContent = '@' + (currentUser.username || 'username');
    elements.profileGender.value = currentUser.gender;
    elements.profileBio.value = currentUser.bio || '';
    elements.profileFilter.value = currentUser.filter;
    
    // Stats modal
    elements.userRating.textContent = currentUser.rating;
    elements.userCoins.textContent = currentUser.coins;
    elements.userLevel.textContent = currentUser.level;
    elements.userMatches.textContent = currentUser.matches;
    elements.userDuels.textContent = currentUser.duels;
    elements.userWins.textContent = currentUser.wins;
    elements.userWinRate.textContent = currentUser.winRate + '%';
    elements.userFriends.textContent = currentUser.friendsCount;
    elements.userLikes.textContent = currentUser.totalLikes;
    elements.dailySuperLikes.textContent = currentUser.dailySuperLikes;
}

function updateSuperLikeUI() {
    if (!currentUser) return;
    
    elements.dailySuperLikes.textContent = currentUser.dailySuperLikes;
    
    // Super like tugmasini yangilash
    if (elements.superLikeBtn) {
        if (currentUser.dailySuperLikes <= 0) {
            elements.superLikeBtn.disabled = true;
            elements.superLikeBtn.innerHTML = '🌟 SUPER LIKE (tugadi)';
        } else {
            elements.superLikeBtn.disabled = false;
            elements.superLikeBtn.innerHTML = `🌟 SUPER LIKE (${currentUser.dailySuperLikes})`;
        }
    }
}

// ==================== O'YINNI BOSHLASH ====================

function startGame() {
    console.log('🎮 O\'yinni boshlash tugmasi bosildi');
    
    if (!socket || !socket.connected) {
        showErrorModal('Serverga ulanilmagan!');
        return;
    }
    
    if (!currentUser) {
        showErrorModal('Avval profil yuklanmadi!');
        return;
    }
    
    // Agar gender tanlanmagan bo'lsa
    if (!currentUser.hasSelectedGender) {
        showGenderSelectionModal(true, 'O\'yinni boshlash uchun avval gender tanlashingiz kerak!');
        return;
    }
    
    console.log('🚀 Navbatga kirilmoqda...');
    
    // UI yangilash
    elements.playBtn.style.display = 'none';
    elements.leaveQueueBtn.style.display = 'block';
    elements.waitingStatus.style.display = 'block';
    elements.waitingStatus.innerHTML = 'Raqib qidirilmoqda...';
    
    // Serverga navbatga kirish habari
    socket.emit('enter_queue');
}

function leaveQueue() {
    console.log('🚪 Navbatdan chiqilmoqda...');
    
    // UI yangilash
    elements.playBtn.style.display = 'block';
    elements.leaveQueueBtn.style.display = 'none';
    elements.waitingStatus.style.display = 'none';
    
    // Serverga habar
    socket.emit('leave_queue');
}

// ==================== DUEL FUNKSIYALARI ====================

function showDuelScreen() {
    console.log('🖥️ Duel ekrani koʻrsatilmoqda');
    elements.duelScreen.style.display = 'block';
    
    // Tugmalarni faollashtirish
    elements.likeBtn.disabled = false;
    elements.superLikeBtn.disabled = false;
    elements.passBtn.disabled = false;
    
    // Super like tugmasini yangilash
    updateSuperLikeUI();
}

function hideDuelScreen() {
    console.log('🖥️ Duel ekrani yopilmoqda');
    elements.duelScreen.style.display = 'none';
    
    // Timer toʻxtatish
    if (duelTimer) {
        clearInterval(duelTimer);
        duelTimer = null;
    }
}

function updateOpponentInfo() {
    if (!currentOpponent) return;
    
    elements.opponentPhoto.src = currentOpponent.photo;
    elements.opponentName.textContent = currentOpponent.name;
    elements.opponentUsername.textContent = '@' + (currentOpponent.username || 'username');
    elements.opponentRating.textContent = currentOpponent.rating;
    elements.opponentMatches.textContent = currentOpponent.matches;
    elements.opponentLevel.textContent = currentOpponent.level;
    elements.opponentGender.textContent = getGenderText(currentOpponent.gender);
    
    if (currentDuel && currentDuel.duelId) {
        elements.duelIdDisplay.textContent = 'ID: ' + currentDuel.duelId.substring(0, 8);
    }
}

function getGenderText(gender) {
    switch(gender) {
        case 'male': return 'Erkak';
        case 'female': return 'Ayol';
        default: return 'Koʻrsatilmagan';
    }
}

function startDuelTimer() {
    timeLeft = 20;
    updateTimerDisplay();
    
    duelTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(duelTimer);
            // Automatik pass
            vote('pass');
        }
    }, 1000);
}

function updateTimerDisplay() {
    elements.timerDisplay.textContent = timeLeft + 's';
    elements.timerDisplay.className = 'timer';
    
    if (timeLeft <= 5) {
        elements.timerDisplay.classList.add('warning');
    }
}

function vote(choice) {
    if (!currentDuel || !socket) {
        console.error('❌ Duel yoki socket mavjud emas');
        return;
    }
    
    console.log(`🗳️ Ovoz berildi: ${choice}`);
    
    // Tugmalarni bloklash
    elements.likeBtn.disabled = true;
    elements.superLikeBtn.disabled = true;
    elements.passBtn.disabled = true;
    
    // Timer toʻxtatish
    if (duelTimer) {
        clearInterval(duelTimer);
    }
    
    // Serverga ovoz yuborish
    socket.emit('vote', {
        duelId: currentDuel.duelId,
        choice: choice
    });
    
    // Tugma holatini ko'rsatish
    const buttons = [elements.likeBtn, elements.superLikeBtn, elements.passBtn];
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.choice === choice) {
            btn.classList.add('active');
        }
    });
}

// ==================== MODAL FUNKSIYALARI ====================

function showGenderSelectionModal(mandatory, message) {
    console.log('👤 Gender tanlash modali ochilmoqda');
    elements.genderMessage.textContent = message || 'Iltimos, jinsingizni tanlang:';
    elements.genderModal.style.display = 'block';
    
    // Agar mandatory bo'lsa, boshqa modallarni yopish
    if (mandatory) {
        document.body.style.overflow = 'hidden';
    }
}

function hideGenderModal() {
    elements.genderModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function selectGender(gender) {
    console.log(`⚧️ Gender tanlandi: ${gender}`);
    
    if (!socket) {
        showErrorModal('Serverga ulanilmagan!');
        return;
    }
    
    socket.emit('select_gender', { gender: gender });
    
    // LocalStorage ga saqlash
    if (currentUser) {
        currentUser.gender = gender;
        currentUser.hasSelectedGender = true;
        localStorage.setItem('likeDuelUser', JSON.stringify({
            userId: currentUser.id,
            firstName: currentUser.firstName,
            username: currentUser.username,
            gender: gender,
            hasSelectedGender: true,
            bio: currentUser.bio,
            filter: currentUser.filter
        }));
    }
}

function showProfileModal() {
    console.log('👤 Profil modali ochilmoqda');
    updateProfileUI();
    elements.profileModal.style.display = 'block';
}

function hideProfileModal() {
    elements.profileModal.style.display = 'none';
}

function saveProfile() {
    if (!socket || !currentUser) {
        showErrorModal('Serverga ulanilmagan yoki foydalanuvchi mavjud emas!');
        return;
    }
    
    const profileData = {
        bio: elements.profileBio.value,
        gender: elements.profileGender.value,
        filter: elements.profileFilter.value
    };
    
    console.log('💾 Profil saqlanmoqda:', profileData);
    socket.emit('update_profile', profileData);
    
    // LocalStorage ga saqlash
    localStorage.setItem('likeDuelUser', JSON.stringify({
        userId: currentUser.id,
        firstName: currentUser.firstName,
        username: currentUser.username,
        gender: profileData.gender,
        hasSelectedGender: true,
        bio: profileData.bio,
        filter: profileData.filter
    }));
}

function showStatsModal() {
    console.log('📊 Stats modali ochilmoqda');
    updateProfileUI();
    elements.statsModal.style.display = 'block';
}

function hideStatsModal() {
    elements.statsModal.style.display = 'none';
}

function showFriendsModal() {
    console.log('👥 Doʻstlar modali ochilmoqda');
    
    if (!socket) {
        showErrorModal('Serverga ulanilmagan!');
        return;
    }
    
    socket.emit('get_friends_list');
    elements.friendsModal.style.display = 'block';
}

function hideFriendsModal() {
    elements.friendsModal.style.display = 'none';
}

function showFriendsList(data) {
    elements.friendsList.innerHTML = '';
    elements.friendsCount.textContent = data.total;
    elements.onlineCount.textContent = data.online;
    
    if (data.friends.length === 0) {
        elements.friendsList.innerHTML = `
            <div class="empty-friends">
                <p>Hali doʻstingiz yoʻq 😔</p>
                <p>Oʻyin oʻynab, yangi doʻstlar toping!</p>
            </div>
        `;
        return;
    }
    
    data.friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        friendElement.innerHTML = `
            <img src="${friend.photo}" alt="${friend.name}" class="friend-photo">
            <div class="friend-info">
                <h4>${friend.name}</h4>
                <p>@${friend.username || 'user'}</p>
                <div class="friend-stats">
                    <span>🏆 ${friend.rating}</span>
                    <span>🎮 ${friend.matches}</span>
                    <span class="${friend.online ? 'online' : 'offline'}">
                        ${friend.online ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
            ${friend.isMutual ? '<span class="mutual-badge">💖</span>' : ''}
        `;
        elements.friendsList.appendChild(friendElement);
    });
}

function showMatchResult(data) {
    console.log('🏆 Match natijasi koʻrsatilmoqda:', data);
    
    if (data.isMutual) {
        elements.matchTitle.textContent = '💖 O\'ZARO LIKE!';
        elements.matchMessage.textContent = 'Tabriklaymiz! Siz o\'zaro like bosdingiz!';
    } else if (data.partner) {
        elements.matchTitle.textContent = '👍 LIKE BERDINGIZ!';
        elements.matchMessage.textContent = 'Siz like bosdingiz, biroq raqib javob bermadi';
    } else {
        elements.matchTitle.textContent = '😔 MATCH YO\'Q';
        elements.matchMessage.textContent = 'Bu safar hech kim like bermadi';
    }
    
    if (data.partner) {
        elements.partnerPhoto.src = data.partner.photo;
        elements.partnerName.textContent = data.partner.name;
        elements.partnerPhoto.style.display = 'block';
        elements.partnerName.style.display = 'block';
    } else {
        elements.partnerPhoto.style.display = 'none';
        elements.partnerName.style.display = 'none';
    }
    
    if (data.rewards) {
        elements.rewardsCoins.textContent = data.rewards.coins;
        elements.rewardsXP.textContent = data.rewards.xp;
        elements.newRating.textContent = data.newRating || currentUser?.rating;
        document.getElementById('rewardsSection').style.display = 'block';
    } else {
        document.getElementById('rewardsSection').style.display = 'none';
    }
    
    elements.matchModal.style.display = 'block';
}

function hideMatchModal() {
    elements.matchModal.style.display = 'none';
    returnToQueue();
}

function returnToQueue() {
    // Duel ma'lumotlarini tozalash
    currentDuel = null;
    currentOpponent = null;
    
    // Agar user gender tanlagan bo'lsa, navbatga qaytish
    if (currentUser && currentUser.hasSelectedGender) {
        startGame();
    }
}

function showErrorModal(message) {
    console.error('❌ Xato modali:', message);
    elements.errorMessage.textContent = message;
    elements.errorModal.style.display = 'block';
}

function hideErrorModal() {
    elements.errorModal.style.display = 'none';
}

function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <span>✅ ${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showLoading(message = 'Yuklanmoqda...') {
    elements.loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

// ==================== EVENT LISTENERS ====================

// Play/Learn queue buttons
elements.playBtn.addEventListener('click', startGame);
elements.leaveQueueBtn.addEventListener('click', leaveQueue);

// Profile modal
elements.profileBtn.addEventListener('click', showProfileModal);
elements.closeProfileModal.addEventListener('click', hideProfileModal);
elements.saveProfileBtn.addEventListener('click', saveProfile);

// Stats modal
elements.statsBtn.addEventListener('click', showStatsModal);
elements.closeStatsModal.addEventListener('click', hideStatsModal);

// Friends modal
elements.friendsBtn.addEventListener('click', showFriendsModal);
elements.closeFriendsModal.addEventListener('click', hideFriendsModal);

// Gender selection
elements.maleBtn.addEventListener('click', () => selectGender('male'));
elements.femaleBtn.addEventListener('click', () => selectGender('female'));
elements.notSpecifiedBtn.addEventListener('click', () => selectGender('not_specified'));

// Duel buttons
elements.likeBtn.addEventListener('click', () => vote('like'));
elements.superLikeBtn.addEventListener('click', () => vote('super_like'));
elements.passBtn.addEventListener('click', () => vote('pass'));

// Match modal
elements.closeMatchModal.addEventListener('click', hideMatchModal);

// Error modal
elements.closeErrorModal.addEventListener('click', hideErrorModal);

// Modal tashqarisini bosganda yopish
window.addEventListener('click', (event) => {
    const modals = ['profileModal', 'statsModal', 'genderModal', 'matchModal', 'friendsModal', 'errorModal'];
    
    modals.forEach(modalId => {
        const modal = elements[modalId];
        if (modal && event.target === modal) {
            if (modalId === 'genderModal') {
                if (!currentUser?.hasSelectedGender) {
                    showErrorModal('Gender tanlash majburiy!');
                    return;
                }
            }
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});

// ==================== STYLES QO'SHISH ====================
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    }
    
    .notification.success {
        background: #4CAF50;
    }
    
    .notification.error {
        background: #f44336;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .timer.warning {
        color: #f44336;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .friend-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #eee;
    }
    
    .friend-photo {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        margin-right: 15px;
    }
    
    .friend-info h4 {
        margin: 0;
        font-size: 16px;
    }
    
    .friend-info p {
        margin: 5px 0;
        color: #666;
        font-size: 14px;
    }
    
    .friend-stats {
        display: flex;
        gap: 10px;
        font-size: 12px;
    }
    
    .mutual-badge {
        margin-left: auto;
        font-size: 20px;
    }
    
    .online {
        color: #4CAF50;
    }
    
    .offline {
        color: #999;
    }
    
    .empty-friends {
        text-align: center;
        padding: 40px;
        color: #666;
    }
    
    button.active {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }
`;
document.head.appendChild(style);

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Like Duel oʻyini yuklanmoqda...');
    showLoading('Serverga ulanilmoqda...');
    connectSocket();
});

// Offline/Online holatini kuzatish
window.addEventListener('online', () => {
    console.log('🌐 Internet ulandi');
    showSuccessNotification('Internet ulandi!');
    if (!socket?.connected) {
        connectSocket();
    }
});

window.addEventListener('offline', () => {
    console.warn('🌐 Internet uzildi');
    showErrorModal('Internet uzildi! Qayta ulanishingiz kerak.');
});