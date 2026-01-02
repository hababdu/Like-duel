export function connectToServer() {
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
        timeout: 20000,
        forceNew: true
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
        showScreen('queue');
        updateQueueStatus(`Navbatdasiz. O'rningiz: ${data.position}/${data.total}`);
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
        gameState.matchCompleted = false;
        gameState.currentDuelId = data.duelId;
        showScreen('duel');
       
        // Oldingi taymerlarni to'xtatamiz
        clearInterval(gameState.timerInterval);
       
        // Tugmalarni reset qilamiz
        resetVoteButtons();
       
        if (elements.opponentAvatar) {
            elements.opponentAvatar.src = data.opponent.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.opponent.name || 'O')}&background=${data.opponent.gender === 'female' ? 'f5576c' : '667eea'}&color=fff`;
            elements.opponentAvatar.style.borderColor = data.opponent.gender === 'female' ? '#f5576c' : '#667eea';
        }
        if (elements.opponentName) {
            elements.opponentName.innerHTML = data.opponent.name;
            addGenderBadge(elements.opponentName, data.opponent.gender);
        }
        if (elements.opponentUsername) elements.opponentUsername.textContent = data.opponent.username || '';
        if (elements.opponentRating) elements.opponentRating.textContent = data.opponent.rating || 1500;
        if (elements.opponentMatches) elements.opponentMatches.textContent = data.opponent.matches || 0;
        if (elements.opponentLevel) elements.opponentLevel.textContent = data.opponent.level || 1;
       
        // 20 soniyalik taymerni boshlaymiz
        startTimer();
        updateDuelStatus('Ovoz bering: ❤️ yoki 💖 yoki ✖');
    });
   
    gameState.socket.on('match', (data) => {
        console.log('🎉 MATCH!', data);
        gameState.matchCompleted = true;
        handleMatch(data);
    });
   
    gameState.socket.on('mutual_match', (data) => {
        console.log('🤝 O\'zaro Match qo\'shildi:', data);
       
        userState.mutualMatchesCount = data.mutualMatchesCount;
        userState.friendsCount = data.friendsCount;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
       
        showNotification('🎉 DO\'ST BO\'LDINGIZ!',
            `${data.partnerName} bilan o'zaro match! Endi siz bir-biringizning do'stlaringiz ro'yxatidasiz.`);
    });
   
    gameState.socket.on('liked_only', (data) => {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        gameState.matchCompleted = true;
        handleLikedOnly(data);
    });
   
    gameState.socket.on('no_match', (data) => {
        console.log('❌ Match bo\'lmadi');
        gameState.matchCompleted = true;
        handleNoMatch(data);
    });
   
    gameState.socket.on('timeout', (data) => {
        console.log('⏰ Vaqt tugadi');
        gameState.matchCompleted = true;
        handleTimeout(data);
    });
   
    gameState.socket.on('waiting_response', (data) => {
        console.log('⏳ Raqib javobini kutish:', data);
        handleWaitingResponse(data);
    });
   
    gameState.socket.on('friends_list', (data) => {
        console.log('👥 Dostlar royxati:', data);
        gameState.friendsList = data.friends;
        updateFriendsListUI(data);
    });
   
    gameState.socket.on('profile_updated', (data) => {
        console.log('📊 Profil yangilandi:', data);
        updateStats(data);
    });
   
    gameState.socket.on('super_like_used', (data) => {
        console.log('💖 Super like ishlatildi:', data);
        if (elements.superLikeCount) elements.superLikeCount.textContent = data.remaining;
        userState.dailySuperLikes = data.remaining;
        saveUserStateToLocalStorage();
    });
   
    gameState.socket.on('daily_reset', (data) => {
        console.log('🔄 Kunlik limitlar yangilandi:', data);
        if (elements.superLikeCount) elements.superLikeCount.textContent = data.superLikes;
        userState.dailySuperLikes = data.superLikes;
        saveUserStateToLocalStorage();
        showNotification('Kun yangilandi', 'Kunlik SUPER LIKE lar qayta tiklandi!');
    });
   
    gameState.socket.on('opponent_left', () => {
        console.log('🚪 Raqib chiqib ketdi');
        clearInterval(gameState.timerInterval);
        updateDuelStatus('Raqib chiqib ketdi. Keyingi duelga tayyormisiz?');
       
        showOpponentLeftModal();
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
       
        if (reason === 'io server disconnect') {
            updateQueueStatus('Server tomonidan uzildi. Qayta ulanmoqda...');
        } else {
            updateQueueStatus('Ulanish uzildi. Qayta ulanmoqda...');
        }
       
        setTimeout(() => {
            if (!gameState.isConnected) {
                console.log('🔄 Qayta ulanmoqda...');
                connectToServer();
            }
        }, 5000);
    });
}