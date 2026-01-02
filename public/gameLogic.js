// public/gameLogic.js
import { gameState, userState, elements } from './state.js';
import { showNotification, showScreen, updateDuelStatus, updateUIFromUserState } from './ui.js';
import { saveUserStateToLocalStorage } from './storage.js';

// ==================== TUGMALARNI RESET QILISH ====================
export function resetVoteButtons() {
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });

    if (elements.noBtn) {
        elements.noBtn.textContent = '✖';
        elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    }
    if (elements.likeBtn) {
        elements.likeBtn.textContent = '❤️';
        elements.likeBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    }
    if (elements.superLikeBtn) {
        elements.superLikeBtn.textContent = '💖';
        elements.superLikeBtn.style.background = 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)';
    }
}

// ==================== TIMER ====================
export function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;

    if (elements.timer) {
        elements.timer.textContent = '20';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        if (elements.timer) elements.timer.textContent = gameState.timeLeft;

        if (gameState.timeLeft <= 5) {
            elements.timer.style.color = '#e74c3c';
            elements.timer.style.animation = 'pulse 1s infinite';
        }

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            if (gameState.socket && gameState.isInDuel) {
                gameState.socket.emit('vote', { duelId: gameState.currentDuelId, choice: 'skip' });
                elements.timer.textContent = '⏰';
                updateDuelStatus('Vaqt tugadi...');
            }
        }
    }, 1000);
}

// ==================== OVOZ BERISH ====================
export function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Duelda emassiz');
        return;
    }

    console.log(`🗳️ Ovoz: ${choice}`);

    // Tugmalarni bloklash
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.6';
        }
    });

    // Super like limiti
    if (choice === 'super_like' && userState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE lar tugadi');
        resetVoteButtons();
        return;
    }

    gameState.socket.emit('vote', { duelId: gameState.currentDuelId, choice });

    clearInterval(gameState.timerInterval);

    if (choice === 'like') {
        elements.timer.textContent = '❤️';
        updateDuelStatus('LIKE berdingiz. Kutilyapti...');
    } else if (choice === 'super_like') {
        elements.timer.textContent = '💖';
        updateDuelStatus('SUPER LIKE! Kutilyapti...');
        userState.dailySuperLikes--;
        elements.superLikeCount.textContent = userState.dailySuperLikes;
        saveUserStateToLocalStorage();
    } else {
        elements.timer.textContent = '✖';
        updateDuelStatus('O\'tkazib yubordingiz...');
        setTimeout(() => showNoMatchOptions(), 2000);
    }
}

// ==================== RAQIB JAVOBINI KUTISH ====================
export function handleWaitingResponse() {
    clearInterval(gameState.timerInterval);
    gameState.waitingForOpponent = true;
    gameState.timeLeft = 120;

    elements.timer.textContent = '2:00';
    elements.timer.style.color = '#ff9500';
    elements.timer.style.animation = 'pulse 2s infinite';

    updateDuelStatus('⏳ Raqib javobini kutish... (2 daqiqa)');

    elements.likeBtn.disabled = true;
    elements.superLikeBtn.disabled = true;
    elements.noBtn.disabled = false;
    elements.noBtn.textContent = '⏭️ Keyingisi';
    elements.noBtn.style.background = 'linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%)';

    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        const min = Math.floor(gameState.timeLeft / 60);
        const sec = gameState.timeLeft % 60;
        elements.timer.textContent = `${min}:${sec.toString().padStart(2, '0')}`;

        if (gameState.timeLeft <= 30) {
            elements.timer.style.color = '#ff4444';
            elements.timer.style.animation = 'pulse 0.5s infinite';
        }

        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            showNotification('⏰ Vaqt tugadi', 'Raqib javob bermadi');
            skipToNextDuel();
        }
    }, 1000);
}

// ==================== MATCH NATIJALARI ====================
export function handleMatch(data) {
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentPartner = data.partner;

    showScreen('match');
    elements.partnerName.textContent = data.partner.name;

    const isSuperMutual = data.isSuperMutual || false;

    elements.matchText.innerHTML = isSuperMutual
        ? `<div style="font-size: 1.8rem; color: #ffd700;">💎 SUPER MUTUAL MATCH!</div>
           <div>${data.partner.name} bilan o'zaro SUPER LIKE!</div>`
        : `<div style="font-size: 1.8rem; color: #f1c40f;">🎉 O'ZARO MATCH!</div>
           <div>${data.partner.name} bilan do'st bo'ldingiz!</div>`;

    elements.rewardCoins.textContent = data.rewards.coins;
    elements.rewardXP.textContent = data.rewards.xp;

    userState.coins += data.rewards.coins;
    userState.rating = data.newRating || userState.rating;
    userState.matches++;
    saveUserStateToLocalStorage();
    updateUIFromUserState();

    // Tugmalar
    elements.matchOptions.innerHTML = '';
    const buttons = [
        { label: '💬 Suhbatlashish', action: 'chat' },
        { label: '➡️ Yangi Duel', action: 'next' },
        { label: '🏠 Bosh Menyu', action: 'menu' }
    ];

    buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = 'match-option-btn';
        el.textContent = btn.label;
        el.style.margin = '8px';
        el.onclick = () => {
            if (btn.action === 'chat') openChat(data.partner);
            else if (btn.action === 'next') skipToNextDuel();
            else returnToMenu();
        };
        elements.matchOptions.appendChild(el);
    });

    // Confetti
    if (typeof confetti === 'function') {
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
        if (isSuperMutual) {
            setTimeout(() => {
                confetti({ particleCount: 200, angle: 60, spread: 80, origin: { x: 0, y: 0.6 } });
                confetti({ particleCount: 200, angle: 120, spread: 80, origin: { x: 1, y: 0.6 } });
            }, 300);
        }
    }
}

export function handleLikedOnly(data) {
    clearInterval(gameState.timerInterval);
    elements.timer.textContent = '❤️';

    userState.coins += data.reward.coins;
    userState.totalLikes++;
    saveUserStateToLocalStorage();
    updateUIFromUserState();

    showNotification('❤️ Yoqtirdingiz', `+${data.reward.coins} coin oldingiz`);

    setTimeout(() => showLikedOnlyOptions(data.opponentName), 1500);
}

export function handleNoMatch() {
    clearInterval(gameState.timerInterval);
    elements.timer.textContent = '✖';
    setTimeout(() => showNoMatchOptions(), 1500);
}

export function handleTimeout() {
    clearInterval(gameState.timerInterval);
    elements.timer.textContent = '⏰';
    setTimeout(() => showTimeoutOptions(), 1500);
}

// ==================== MODALLAR ====================
function createModal(id, title, body, buttons) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = id;
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3>${title}</h3></div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">${buttons}</div>
        </div>
    `;
    document.body.appendChild(modal);
}

export function showLikedOnlyOptions(name) {
    createModal('likedOnlyModal', '❤️ Faqat siz yoqtirdingiz', `<p>${name} sizga like bermadi</p>`, `
        <button onclick="skipToNextDuel()">➡️ Yangi duel</button>
        <button onclick="returnToMenu()">🏠 Bosh menyu</button>
    `);
}

export function showNoMatchOptions() {
    createModal('noMatchModal', '❌ Match boʻlmadi', '<p>Hech kim like bermadi</p>', `
        <button onclick="skipToNextDuel()">➡️ Yangi duel</button>
        <button onclick="returnToMenu()">🏠 Bosh menyu</button>
    `);
}

export function showTimeoutOptions() {
    createModal('timeoutModal', '⏰ Vaqt tugadi', '<p>Ikkalangiz ham ovoz bermadingiz</p>', `
        <button onclick="skipToNextDuel()">➡️ Yangi duel</button>
        <button onclick="returnToMenu()">🏠 Bosh menyu</button>
    `);
}

// ==================== NAVIGATSIYA ====================
export function skipToNextDuel() {
    hideAllModals();
    clearInterval(gameState.timerInterval);
    resetVoteButtons();

    gameState.isInDuel = false;
    gameState.currentDuelId = null;

    showScreen('queue');
    if (gameState.socket && gameState.isConnected) {
        gameState.isInQueue = true;
        gameState.socket.emit('enter_queue');
        showNotification('Navbatda', 'Yangi raqib qidirilmoqda...');
    }
}

export function returnToMenu() {
    hideAllModals();
    clearInterval(gameState.timerInterval);
    resetVoteButtons();

    if (gameState.socket) gameState.socket.emit('leave_queue');

    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;

    showScreen('welcome');
    showNotification('Bosh menyuga qaytildi', 'Yana oʻynash uchun bosing');
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.remove());
}

// ==================== CHAT ====================
export function openChat(partner) {
    gameState.currentPartner = partner;
    gameState.isChatModalOpen = true;

    elements.chatPartnerAvatar.src = partner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}`;
    elements.chatPartnerName.textContent = partner.name;
    elements.chatUsername.textContent = partner.username ? `@${partner.username}` : '';

    elements.chatModal.classList.add('active');
}

// ==================== O'YINNI BOSHLASH VA CHIQISH ====================
export function startGame() {
    if (!userState.hasSelectedGender) {
        showNotification('⚠️ Gender tanlanmagan', 'Avval jinsingizni tanlang');
        return;
    }
    // socket.js da connectToServer() chaqiriladi
    if (gameState.socket) gameState.socket.emit('enter_queue');
}

export function leaveQueue() {
    if (gameState.socket) gameState.socket.emit('leave_queue');
    gameState.isInQueue = false;
    showScreen('welcome');
}

// ==================== DO'KON ====================
export function loadShopItems() {
    const items = [
        { id: 1, name: '10 Super Like', price: 100, icon: '💖' },
        { id: 2, name: '50 Super Like', price: 450, icon: '💎' },
        { id: 3, name: '100 Super Like', price: 800, icon: '👑' },
        { id: 4, name: 'Premium Profil', price: 300, icon: '⭐' }
    ];

    elements.shopItemsList.innerHTML = items.map(item => `
        <div class="shop-item">
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
            </div>
            <button class="shop-item-buy" ${userState.coins < item.price ? 'disabled' : ''} onclick="buyItem(${item.id})">
                <i class="fas fa-coins"></i> ${item.price}
            </button>
        </div>
    `).join('');
}

window.buyItem = function(id) {
    const prices = { 1: 100, 2: 450, 3: 800, 4: 300 };
    const price = prices[id];
    if (userState.coins >= price) {
        userState.coins -= price;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        showNotification('✅ Xarid muvaffaqiyatli', 'Mahsulot sotib olindi!');
    } else {
        showNotification('⚠️ Coin yetarli emas', 'Koʻproq coin toʻplang');
    }
};

// ==================== VAZIFALAR ====================
export function loadProfileQuests() {
    const quests = [
        { title: '3 ta duel oʻynash', progress: Math.min(userState.duels, 3), total: 3, reward: 50 },
        { title: '5 ta like berish', progress: Math.min(userState.totalLikes, 5), total: 5, reward: 30 },
        { title: '1 ta match olish', progress: Math.min(userState.matches, 1), total: 1, reward: 100 },
        { title: '1 ta doʻst orttirish', progress: Math.min(userState.mutualMatchesCount, 1), total: 1, reward: 200 }
    ];

    elements.profileQuestsList.innerHTML = quests.map(q => `
        <div class="quest-item">
            <div class="quest-info">
                <div class="quest-title">${q.title}</div>
                <div class="quest-progress">${q.progress}/${q.total}</div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${(q.progress/q.total)*100}%"></div></div>
            </div>
            <div class="quest-reward"><i class="fas fa-coins"></i> +${q.reward}</div>
        </div>
    `).join('');
}

// ==================== DO'STLAR RO'YXATI ====================
export function loadFriendsList() {
    // Agar serverdan kelgan bo'lsa – gameState.friendsList ishlatiladi
    // Test rejimida
    if (gameState.friendsList.length === 0) {
        elements.noFriends.classList.remove('hidden');
        elements.friendsList.innerHTML = '';
    } else {
        elements.noFriends.classList.add('hidden');
        elements.friendsList.innerHTML = gameState.friendsList.map(f => `
            <div class="friend-item">
                <img src="${f.photo}" class="friend-avatar">
                <div class="friend-info">
                    <div class="friend-name">${f.name} ${f.isMutual ? '<span class="mutual-badge">❤️ Doʻst</span>' : ''}</div>
                    <div class="friend-username">@${f.username}</div>
                    <div class="friend-status ${f.online ? 'status-online' : 'status-offline'}">
                        ${f.online ? 'Onlayn' : 'Oxirgi faol: hozir'}
                    </div>
                </div>
                <button onclick="openChat(${JSON.stringify(f).replace(/"/g, '&quot;')})">💬 Chat</button>
            </div>
        `).join('');
    }

    elements.friendsCount.textContent = userState.friendsCount;
    elements.onlineFriendsCount.textContent = gameState.friendsList.filter(f => f.online).length;
}

// ==================== LIDERLAR DOSKASI ====================
export function loadLeaderboard() {
    // Test ma'lumotlar (realda serverdan keladi)
    const leaders = [
        { rank: 1, name: 'Ali', rating: 2100, matches: 150, friends: 45 },
        { rank: 2, name: 'Vali', rating: 2050, matches: 140, friends: 40 },
        { rank: 3, name: 'Sardor', rating: 2000, matches: 130, friends: 38 }
    ];

    elements.leaderboardList.innerHTML = leaders.map(l => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">#${l.rank}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${l.name}</div>
                <div class="leaderboard-stats">
                    <span><i class="fas fa-trophy"></i> ${l.rating}</span>
                    <span><i class="fas fa-heart"></i> ${l.matches}</span>
                    <span><i class="fas fa-users"></i> ${l.friends}</span>
                </div>
            </div>
        </div>
    `).join('');
}