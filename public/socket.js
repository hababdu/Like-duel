// public/socket.js
import { gameState, userState, elements, tgUserGlobal } from './state.js';
import { updateUIFromUserState, showNotification, showScreen, updateQueueStatus, updateDuelStatus, addGenderBadge, showGenderModal, hideGenderModal } from './ui.js';
import { saveUserStateToLocalStorage } from './storage.js';
import { 
    handleMatch, 
    handleLikedOnly, 
    handleNoMatch, 
    handleTimeout, 
    handleWaitingResponse, 
    resetVoteButtons, 
    startTimer,
    loadFriendsList 
} from './gameLogic.js'; // gameLogic.js dan kerakli funksiyalarni import qiling

export function connectToServer() {
    if (!tgUserGlobal) {
        showNotification('Xato', 'Foydalanuvchi maʼlumotlari topilmadi');
        return;
    }

    // Allaqachon ulangan bo'lsa – qayta ulanmaslik
    if (gameState.socket && gameState.isConnected) {
        console.log('ℹ️ Allaqachon serverga ulanilgan');
        return;
    }

    console.log('🔗 Serverga ulanmoqda...');
    updateQueueStatus('Serverga ulanmoqda...');

    // URL aniqlash (local yoki production)
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '';
    const socketUrl = isLocalhost ? 'http://localhost:3000' : 'https://like-duel.onrender.com';

    console.log('🔌 Socket URL:', socketUrl);

    gameState.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true
    });

    // ==================== SOCKET EVENTLARI ====================

    gameState.socket.on('connect', () => {
        console.log('✅ Serverga muvaffaqiyatli ulandi');
        gameState.isConnected = true;
        gameState.reconnectAttempts = 0;
        updateQueueStatus('Serverga ulandi...');

        // Autentifikatsiya ma'lumotlarini yuborish
        gameState.socket.emit('auth', {
            userId: tgUserGlobal.id,
            firstName: tgUserGlobal.first_name || 'Foydalanuvchi',
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

        // Serverdan kelgan ma'lumotlarni yangilash
        userState.currentGender = data.gender ?? userState.currentGender;
        userState.hasSelectedGender = data.hasSelectedGender ?? userState.hasSelectedGender;
        userState.coins = data.coins ?? userState.coins;
        userState.level = data.level ?? userState.level;
        userState.rating = data.rating ?? userState.rating;
        userState.matches = data.matches ?? userState.matches;
        userState.duels = data.duels ?? userState.duels;
        userState.wins = data.wins ?? userState.wins;
        userState.totalLikes = data.totalLikes ?? userState.totalLikes;
        userState.dailySuperLikes = data.dailySuperLikes ?? userState.dailySuperLikes;
        userState.bio = data.bio ?? userState.bio;
        userState.filter = data.filter ?? userState.filter;
        userState.mutualMatchesCount = data.mutualMatchesCount ?? userState.mutualMatchesCount;
        userState.friendsCount = data.friendsCount ?? userState.friendsCount;

        saveUserStateToLocalStorage();
        updateUIFromUserState();

        showScreen('queue');

        if (userState.hasSelectedGender) {
            gameState.isInQueue = true;
            gameState.socket.emit('enter_queue');
        } else {
            updateQueueStatus('Gender tanlash kerak...');
            showGenderModal(true);
        }
    });

    gameState.socket.on('show_gender_selection', () => {
        showGenderModal(true);
        updateQueueStatus('Gender tanlash kerak...');
    });

    gameState.socket.on('gender_selected', (data) => {
        console.log('✅ Gender server tomonidan tasdiqlandi:', data);
        userState.currentGender = data.gender;
        userState.hasSelectedGender = true;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        hideGenderModal();

        gameState.isInQueue = true;
        gameState.socket.emit('enter_queue');

        showNotification('🎉 Jins tanlandi', data.message || 'Endi duel oʻynashingiz mumkin!');
    });

    gameState.socket.on('queue_joined', (data) => {
        console.log('✅ Navbatga kirdingiz:', data);
        gameState.isInQueue = true;
        showScreen('queue');
        updateQueueStatus(`Navbatdasiz. Oʻrningiz: ${data.position}/${data.total}`);
    });

    gameState.socket.on('waiting_count', (data) => {
        elements.waitingCount.textContent = data.count;
        if (data.position > 0) {
            elements.position.textContent = data.position;
            elements.positionInfo.style.display = 'block';
            updateQueueStatus(`Navbatdasiz. Oʻrningiz: ${data.position}/${data.count}`);
        } else {
            elements.positionInfo.style.display = 'none';
            updateQueueStatus('Navbatda...');
        }
    });

    gameState.socket.on('duel_started', (data) => {
        console.log('⚔️ Duel boshlandi:', data);
        gameState.isInDuel = true;
        gameState.waitingForOpponent = false;
        gameState.matchCompleted = false;
        gameState.currentDuelId = data.duelId;
        showScreen('duel');

        clearInterval(gameState.timerInterval);
        resetVoteButtons();

        // Raqib ma'lumotlarini ko'rsatish
        elements.opponentAvatar.src = data.opponent.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.opponent.name || 'O')}&background=${data.opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
        elements.opponentAvatar.style.borderColor = data.opponent.gender === 'female' ? '#f5576c' : '#667eea';

        elements.opponentName.innerHTML = data.opponent.name;
        addGenderBadge(elements.opponentName, data.opponent.gender);

        elements.opponentUsername.textContent = data.opponent.username || '';
        elements.opponentRating.textContent = data.opponent.rating || 1500;
        elements.opponentMatches.textContent = data.opponent.matches || 0;
        elements.opponentLevel.textContent = data.opponent.level || 1;

        startTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
    });

    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        gameState.matchCompleted = true;
        handleMatch(data);
    });

    gameState.socket.on('mutual_match', (data) => {
        console.log('🤝 Oʻzaro match qoʻshildi:', data);
        userState.mutualMatchesCount = data.mutualMatchesCount;
        userState.friendsCount = data.friendsCount;
        saveUserStateToLocalStorage();
        updateUIFromUserState();

        showNotification('🎉 DOʻST BOʻLDINGIZ!', `${data.partnerName} bilan o'zaro match!`);
    });

    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdingiz:', data);
        gameState.matchCompleted = true;
        handleLikedOnly(data);
    });

    gameState.socket.on('no_match', (data) => {
        console.log('❌ Match boʻlmadi');
        gameState.matchCompleted = true;
        handleNoMatch(data);
    });

    gameState.socket.on('timeout', (data) => {
        console.log('⏰ Vaqt tugadi');
        gameState.matchCompleted = true;
        handleTimeout(data);
    });

    gameState.socket.on('waiting_response', (data) => {
        console.log('⏳ Raqib javobini kutish...');
        handleWaitingResponse(data);
    });

    gameState.socket.on('friends_list', (data) => {
        console.log('👥 Doʻstlar roʻyxati yangilandi:', data);
        gameState.friendsList = data.friends;
        loadFriendsList(); // gameLogic.js da updateFriendsListUI chaqiriladi
    });

    gameState.socket.on('profile_updated', (data) => {
        console.log('📊 Profil server tomonidan yangilandi:', data);
        // updateStats funksiyasi ui.js da mavjud
        if (typeof updateStats === 'function') updateStats(data);
    });

    gameState.socket.on('super_like_used', (data) => {
        console.log('💖 Super like ishlatildi:', data);
        elements.superLikeCount.textContent = data.remaining;
        userState.dailySuperLikes = data.remaining;
        saveUserStateToLocalStorage();
    });

    gameState.socket.on('daily_reset', (data) => {
        console.log('🔄 Kunlik reset:', data);
        elements.superLikeCount.textContent = data.superLikes;
        userState.dailySuperLikes = data.superLikes;
        saveUserStateToLocalStorage();
        showNotification('Kun yangilandi', 'Kunlik SUPER LIKE lar tiklandi!');
    });

    gameState.socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        clearInterval(gameState.timerInterval);
        updateDuelStatus('Raqib chiqib ketdi...');
        // Modalni gameLogic.js da ko'rsatish mumkin
        showNotification('Raqib chiqdi', 'Yangi duel qidirilmoqda...');
    });

    gameState.socket.on('error', (data) => {
        console.error('❌ Server xatosi:', data);
        showNotification('Xato', data.message || 'Nomaʼlum xato');
    });

    gameState.socket.on('connect_error', (error) => {
        console.error('❌ Ulanish xatosi:', error);
        gameState.reconnectAttempts++;
        if (gameState.reconnectAttempts > gameState.maxReconnectAttempts) {
            showNotification('Ulanish muvaffaqiyatsiz', 'Serverga ulanib boʻlmadi');
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

        updateQueueStatus('Ulanish uzildi. Qayta ulanmoqda...');

        setTimeout(() => {
            if (!gameState.isConnected) connectToServer();
        }, 5000);
    });
}