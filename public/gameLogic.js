export function startGame() {
    console.log('🎮 O\'yinni boshlash');
   
    if (!userState.hasSelectedGender) {
        showGenderModal(true);
        showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
        return;
    }
   
    connectToServer();
}

export function leaveQueue() {
    console.log('🚪 Navbatdan chiqish');
   
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
   
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    clearInterval(gameState.timerInterval);
   
    showScreen('welcome');
   
    showNotification('Navbatdan chiqdingiz', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
}

export function handleVote(choice) {
    if (!gameState.socket || !gameState.isInDuel) {
        showNotification('Xato', 'Siz hozir duelda emassiz');
        return;
    }
   
    console.log(`🗳️ Ovoz berish: ${choice}`);
   
    // Tugmalarni vaqtincha disable qilamiz
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = true;
            b.style.opacity = '0.6';
            b.style.cursor = 'not-allowed';
        }
    });
   
    // Super like limitini tekshirish
    if (choice === 'super_like' && userState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        resetVoteButtons();
        return;
    }
   
    // Serverga ovozni yuboramiz
    gameState.socket.emit('vote', {
        duelId: gameState.currentDuelId,
        choice: choice
    });
   
    // Taymerni to'xtatamiz
    clearInterval(gameState.timerInterval);
   
    // UI yangilash
    if (choice === 'like') {
        if (elements.timer) elements.timer.textContent = '❤️';
        updateDuelStatus('LIKE berdingiz. Raqib javobini kutish...');
    } else if (choice === 'super_like') {
        if (elements.timer) elements.timer.textContent = '💖';
        updateDuelStatus('SUPER LIKE! Raqib javobini kutish...');
        userState.dailySuperLikes--;
        if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
        saveUserStateToLocalStorage();
    } else {
        if (elements.timer) elements.timer.textContent = '✖';
        updateDuelStatus('O\'tkazib yubordingiz...');
        gameState.matchCompleted = true;
       
        // O'tkazib yuborilganda, 2 soniyadan keyin keyingi duel yoki bosh menyu tanlash imkoniyati
        setTimeout(() => {
            showNoMatchOptions();
        }, 2000);
    }
}

export function handleWaitingResponse(data) {
    console.log('⏳ Raqib javobini kutish...');
   
    clearInterval(gameState.timerInterval);
    gameState.waitingForOpponent = true;
   
    // 2 daqiqa (120 soniya) kutish taymerini boshlaymiz
    gameState.timeLeft = 120;
   
    if (elements.timer) {
        elements.timer.textContent = '2:00';
        elements.timer.style.color = '#ff9500';
        elements.timer.style.animation = 'pulse 2s infinite';
    }
   
    updateDuelStatus('⏳ Raqib javobini kutish... (2 daqiqa)');
   
    // Like/Super Like tugmalarini disable qilamiz
    if (elements.likeBtn) {
        elements.likeBtn.disabled = true;
        elements.likeBtn.style.opacity = '0.5';
    }
   
    if (elements.superLikeBtn) {
        elements.superLikeBtn.disabled = true;
        elements.superLikeBtn.style.opacity = '0.5';
    }
   
    // O'tkazib yuborish tugmasini yoqamiz va matnini o'zgartiramiz
    if (elements.noBtn) {
        elements.noBtn.disabled = false;
        elements.noBtn.style.opacity = '1';
        elements.noBtn.textContent = '⏭️ Keyingisi';
        elements.noBtn.style.background = 'linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%)';
    }
   
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
       
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
       
        if (elements.timer) {
            elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
       
        if (gameState.timeLeft <= 30) {
            if (elements.timer) {
                elements.timer.style.color = '#ff4444';
                elements.timer.style.animation = 'pulse 0.5s infinite';
            }
        }
       
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            handleOpponentTimeout();
        }
    }, 1000);
}

function handleOpponentTimeout() {
    console.log('⏰ Raqib javob bermadi');
   
    if (elements.timer) elements.timer.textContent = '⏰';
   
    updateDuelStatus('Raqib javob bermadi. O\'yinni tugatish?');
   
    // O'yinni tugatish modalini ko'rsatish
    showOpponentTimeoutModal();
}

export function showOpponentTimeoutModal() {
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
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Keyingi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
   
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
   
    modalContainer.innerHTML = modalHTML;
}

export function showOpponentLeftModal() {
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
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Keyingi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
   
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
   
    modalContainer.innerHTML = modalHTML;
}

export function showNoMatchOptions() {
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
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Keyingi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
   
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
   
    modalContainer.innerHTML = modalHTML;
}

export function hideAllModals() {
    const modals = ['timeoutModal', 'opponentLeftModal', 'noMatchModal', 'likedOnlyModal', 'matchModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    });
   
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer && modalContainer.children.length === 0) {
        modalContainer.remove();
    }
}

export function handleMatch(data) {
    console.log('🎉 MATCH!', data);
   
    clearInterval(gameState.timerInterval);
   
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.currentPartner = data.partner;
    gameState.lastOpponent = data.partner.id;
    gameState.waitingForOpponent = false;
   
    // Tugmalarni reset qilish
    resetVoteButtons();
   
    showScreen('match');
   
    if (elements.partnerName) elements.partnerName.textContent = data.partner.name;
   
    if (data.isMutual) {
        if (elements.matchText) elements.matchText.innerHTML = `
            <div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold;">🎉 O'ZARO MATCH!</div>
            <div style="margin-top: 10px; color: #fff;">${data.partner.name} bilan do'st bo'ldingiz!</div>
            <div style="margin-top: 5px; color: #ccc; font-size: 0.9rem;">
                Endi siz bir-biringizning do'stlaringiz ro'yxatidasiz!
            </div>
        `;
    } else {
        if (elements.matchText) elements.matchText.innerHTML = `
            <div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold;">🎉 MATCH!</div>
            <div style="margin-top: 10px; color: #fff;">${data.partner.name} bilan bir-biringizni yoqtirdingiz!</div>
        `;
    }
   
    if (elements.rewardCoins) elements.rewardCoins.textContent = data.rewards.coins;
    if (elements.rewardXP) elements.rewardXP.textContent = data.rewards.xp;
   
    userState.coins += data.rewards.coins;
    userState.rating = data.newRating;
    userState.matches++;
    saveUserStateToLocalStorage();
    updateUIFromUserState();
   
    // Match option tugmalarini ko'rsatish
    if (elements.matchOptions) {
        elements.matchOptions.innerHTML = '';
       
        const options = [
            {action: 'open_chat', label: '💬 Chatga o\'tish', style: 'background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);'},
            {action: 'show_next_duel_confirm', label: '➡️ Yangi duel', style: 'background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);'},
            {action: 'return_to_menu', label: '🏠 Bosh menyu', style: 'background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);'}
        ];
       
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'match-option-btn';
            btn.innerHTML = opt.label;
            btn.style.cssText = opt.style;
            btn.onclick = () => handleMatchOption(opt.action, data.partner);
            elements.matchOptions.appendChild(btn);
        });
    }
   
    // Confetti efekti
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 300,
            spread: 100,
            origin: { y: 0.6 }
        });
       
        if (data.isMutual) {
            setTimeout(() => {
                confetti({
                    particleCount: 200,
                    angle: 60,
                    spread: 80,
                    origin: { x: 0, y: 0.6 }
                });
                confetti({
                    particleCount: 200,
                    angle: 120,
                    spread: 80,
                    origin: { x: 1, y: 0.6 }
                });
            }, 300);
        }
    }
}

export function handleMatchOption(action, partner) {
    console.log(`Match option: ${action} for partner:`, partner);
   
    switch(action) {
        case 'open_chat':
            openChat(partner);
            // Chat ochilganda, avtomatik navbatga o'tmaslik
            return;
        case 'show_next_duel_confirm':
            showNextDuelConfirmModal(partner);
            break;
        case 'return_to_menu':
            returnToMenu();
            break;
        default:
            returnToMenu();
    }
}

export function showNextDuelConfirmModal(partner) {
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
                    <button class="modal-btn cancel-btn" onclick="startNewDuelFromMatch()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
                        <i class="fas fa-play"></i> Ha, Yangi Duel
                    </button>
                    <button class="modal-btn confirm-btn" onclick="hideNextDuelConfirmModal()" style="background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);">
                        <i class="fas fa-times"></i> Bekor qilish
                    </button>
                </div>
            </div>
        </div>
    `;
   
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
   
    modalContainer.innerHTML = modalHTML;
}

export function hideNextDuelConfirmModal() {
    const modal = document.getElementById('nextDuelConfirmModal');
    if (modal) modal.remove();
}

export function startNewDuelFromMatch() {
    console.log('🔄 Matchdan yangi duelga o\'tish');
   
    // Modalni yopish
    hideNextDuelConfirmModal();
   
    // Match ekranini yopish
    showScreen('queue');
   
    // Serverga navbatga kirish so'rovini yuborish
    if (gameState.socket && gameState.isConnected) {
        gameState.isInQueue = true;
        gameState.socket.emit('enter_queue');
        showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
    }
}

export function handleLikedOnly(data) {
    console.log('❤️ Faqat siz like berdidingiz:', data);
   
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
   
    // Tugmalarni reset qilish
    resetVoteButtons();
   
    if (elements.timer) elements.timer.textContent = '❤️';
   
    if (data.reward) {
        userState.coins += data.reward.coins;
        userState.totalLikes++;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
       
        showNotification('Like uchun mukofot', `+${data.reward.coins} coin, +${data.reward.xp} XP`);
    }
   
    // Keyingi duel yoki bosh menyu tanlash imkoniyati
    setTimeout(() => {
        showLikedOnlyOptions(data.opponentName);
    }, 1500);
}

export function handleNoMatch(data) {
    console.log('❌ Match bo\'lmadi');
   
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
   
    // Tugmalarni reset qilish
    resetVoteButtons();
   
    if (elements.timer) elements.timer.textContent = '✖';
   
    // Keyingi duel yoki bosh menyu tanlash imkoniyati
    setTimeout(() => {
        showNoMatchModal();
    }, 1500);
}

export function handleTimeout(data) {
    console.log('⏰ Vaqt tugadi');
   
    clearInterval(gameState.timerInterval);
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
   
    // Tugmalarni reset qilish
    resetVoteButtons();
   
    if (elements.timer) elements.timer.textContent = '⏰';
   
    // Keyingi duel yoki bosh menyu tanlash imkoniyati
    setTimeout(() => {
        showTimeoutOptions();
    }, 1500);
}

export function showLikedOnlyOptions(opponentName) {
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
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Yangi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
   
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
   
    modalContainer.innerHTML = modalHTML;
}

export function showNoMatchModal() {
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
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Yangi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
   
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
   
    modalContainer.innerHTML = modalHTML;
}

export function showTimeoutOptions() {
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
                    <button class="modal-btn cancel-btn" onclick="skipToNextDuel()" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">➡️ Yangi duel</button>
                    <button class="modal-btn confirm-btn" onclick="returnToMenu()" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">🏠 Bosh menyu</button>
                </div>
            </div>
        </div>
    `;
   
    const modalContainer = document.getElementById('modalContainer') || (() => {
        const container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
        return container;
    })();
   
    modalContainer.innerHTML = modalHTML;
}

export function openChat(partner) {
    if (!partner) return;
   
    gameState.isChatModalOpen = true;
   
    if (elements.chatPartnerAvatar) {
        elements.chatPartnerAvatar.src = partner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=3498db&color=fff`;
    }
    if (elements.chatPartnerName) {
        elements.chatPartnerName.textContent = partner.name;
    }
    if (elements.chatUsername && partner.username) {
        elements.chatUsername.textContent = `@${partner.username}`;
    } else if (elements.chatUsername) {
        elements.chatUsername.textContent = '';
    }
   
    if (elements.chatTitle) {
        elements.chatTitle.textContent = `${partner.name} bilan chat`;
    }
   
    if (elements.chatModal) {
        elements.chatModal.classList.add('active');
    }
}

export function openTelegramChat(username) {
    if (!username) {
        showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        return;
    }
   
    const telegramUrl = `https://t.me/${username.replace('@', '')}`;
   
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(telegramUrl);
    } else {
        window.open(telegramUrl, '_blank');
    }
}

export function closeChatModal() {
    console.log('💬 Chat modali yopilmoqda');
   
    gameState.isChatModalOpen = false;
    if (elements.chatModal) {
        elements.chatModal.classList.remove('active');
    }
   
    // Chat yopilganda, match ekraniga qaytamiz
    if (gameState.currentPartner) {
        showScreen('match');
    } else {
        returnToMenu();
    }
}

export function resetVoteButtons() {
    console.log('🔄 Tugmalar reset qilinmoqda...');
   
    [elements.noBtn, elements.likeBtn, elements.superLikeBtn].forEach(b => {
        if (b) {
            b.disabled = false;
            b.style.opacity = '1';
            b.style.cursor = 'pointer';
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

export function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    if (elements.timer) {
        elements.timer.textContent = 20;
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
   
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        if (elements.timer) elements.timer.textContent = gameState.timeLeft;
       
        if (gameState.timeLeft <= 5 && elements.timer) {
            elements.timer.style.color = '#e74c3c';
            elements.timer.style.animation = 'pulse 1s infinite';
        }
       
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            if (gameState.socket && gameState.isInDuel) {
                gameState.socket.emit('vote', {
                    duelId: gameState.currentDuelId,
                    choice: 'skip'
                });
                if (elements.timer) {
                    elements.timer.textContent = '⏰';
                }
                updateDuelStatus('Vaqt tugadi...');
            }
        }
    }, 1000);
}

export function skipToNextDuel() {
    console.log('🔄 Keyingi duelga o\'tish');
   
    // Barcha modallarni yopamiz
    hideAllModals();
    closeChatModal();
   
    // Barcha taymerlarni to'xtatamiz
    clearInterval(gameState.timerInterval);
   
    // UI elementlarini reset qilamiz
    if (elements.timer) {
        elements.timer.textContent = '20';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
   
    // Tugmalarni reset qilamiz
    resetVoteButtons();
   
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    gameState.skipToNextRequested = true;
   
    // Match ekranini yopamiz
    showScreen('queue');
   
    if (gameState.socket && gameState.isConnected) {
        if (userState.hasSelectedGender) {
            gameState.isInQueue = true;
            gameState.isInDuel = false;
            gameState.currentDuelId = null;
           
            // Serverga navbatga kirish so'rovini yuboramiz
            gameState.socket.emit('enter_queue');
            showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
        } else {
            showScreen('welcome');
        }
    } else {
        showScreen('welcome');
    }
}

export function returnToMenu() {
    console.log('🏠 Bosh menyuga qaytish');
   
    // Barcha modallarni yopamiz
    hideAllModals();
    closeChatModal();
   
    // Barcha taymerlarni to'xtatamiz
    clearInterval(gameState.timerInterval);
   
    // Serverdan navbatdan chiqish
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('leave_queue');
    }
   
    // Holatni reset qilamiz
    gameState.isInQueue = false;
    gameState.isInDuel = false;
    gameState.currentDuelId = null;
    gameState.waitingForOpponent = false;
    gameState.matchCompleted = false;
    gameState.skipToNextRequested = false;
   
    // UI ni reset qilamiz
    if (elements.timer) {
        elements.timer.textContent = '20';
        elements.timer.style.color = '#fff';
        elements.timer.style.animation = '';
    }
   
    // Tugmalarni reset qilamiz
    resetVoteButtons();
   
    showScreen('welcome');
   
    showNotification('Bosh menyuga qaytildi', 'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
}

export function loadFriendsList() {
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('get_friends_list');
    } else {
        // Test ma'lumotlari
        const testFriends = [
            {
                id: 'test_1',
                name: 'Ali',
                username: 'ali_test',
                photo: 'https://ui-avatars.com/api/?name=Ali&background=3498db&color=fff',
                online: true,
                lastActive: new Date(),
                gender: 'male',
                rating: 1600,
                matches: 15,
                isMutual: true
            }
        ];
       
        updateFriendsListUI({
            friends: testFriends,
            total: testFriends.length,
            online: testFriends.filter(f => f.online).length
        });
    }
}

export function updateFriendsListUI(data) {
    const friends = data.friends;
    const mutualFriends = friends.filter(f => f.isMutual);
   
    if (elements.friendsList) {
        if (friends.length === 0) {
            elements.friendsList.innerHTML = '';
            if (elements.noFriends) elements.noFriends.classList.remove('hidden');
        } else {
            if (elements.noFriends) elements.noFriends.classList.add('hidden');
           
            elements.friendsList.innerHTML = friends.map(friend => `
                <div class="friend-item ${friend.isMutual ? 'mutual' : ''}">
                    <img src="${friend.photo}"
                         alt="${friend.name}" class="friend-avatar">
                    <div class="friend-info">
                        <div class="friend-name">
                            ${friend.name}
                            ${friend.isMutual ? '<span class="mutual-badge">❤️ Do\'st</span>' : ''}
                        </div>
                        <div class="friend-username">@${friend.username}</div>
                        <div class="friend-stats">
                            <span><i class="fas fa-trophy"></i> ${friend.rating}</span>
                            <span><i class="fas fa-heart"></i> ${friend.matches}</span>
                        </div>
                        <div class="friend-status ${friend.online ? 'status-online' : 'status-offline'}">
                            ${friend.online ? 'Onlayn' : 'Oxirgi faol: ' + formatDate(friend.lastActive)}
                        </div>
                    </div>
                    ${friend.isMutual ?
                        `<button class="match-option-btn" style="padding: 8px 12px; min-width: 80px;"
                                onclick="openChatFromFriend(${JSON.stringify(friend).replace(/"/g, '&quot;')})">
                            💬 Chat
                        </button>` :
                        `<button class="match-option-btn" style="padding: 8px 12px; min-width: 80px; background: #95a5a6;"
                                onclick="showNotification('Xabar', 'Match bo\'lmaganingiz uchun chat ochib bo\'lmaydi')">
                            ⏳
                        </button>`
                    }
                </div>
            `).join('');
        }
    }
   
    if (elements.friendsCount) elements.friendsCount.textContent = mutualFriends.length;
    if (elements.onlineFriendsCount) {
        const onlineCount = mutualFriends.filter(f => f.online).length;
        elements.onlineFriendsCount.textContent = onlineCount;
    }
}

export function openChatFromFriend(friend) {
    openChat(friend);
}

export function formatDate(date) {
    if (!date) return 'noma\'lum';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
   
    if (diff < 60000) return 'hozir';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' daqiqa oldin';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' soat oldin';
    if (diff < 604800000) return Math.floor(diff / 86400000) + ' kun oldin';
    return d.toLocaleDateString('uz-UZ');
}

export function loadShopItems() {
    const items = [
        { id: 1, name: '10 Super Like', price: 100, icon: '💖', description: '10 ta kunlik SUPER LIKE' },
        { id: 2, name: '50 Super Like', price: 450, icon: '💎', description: '50 ta kunlik SUPER LIKE' },
        { id: 3, name: '100 Super Like', price: 800, icon: '👑', description: '100 ta kunlik SUPER LIKE' },
        { id: 4, name: 'Premium Profil', price: 300, icon: '⭐', description: '30 kunlik premium status' }
    ];
   
    if (elements.shopItemsList) {
        elements.shopItemsList.innerHTML = items.map(item => `
            <div class="shop-item">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                </div>
                <button class="shop-item-buy" onclick="buyItem(${item.id})"
                        ${userState.coins < item.price ? 'disabled' : ''}>
                    <i class="fas fa-coins"></i> ${item.price}
                </button>
            </div>
        `).join('');
    }
}

export function buyItem(itemId) {
    const items = [
        { id: 1, price: 100 },
        { id: 2, price: 450 },
        { id: 3, price: 800 },
        { id: 4, price: 300 }
    ];
   
    const item = items.find(i => i.id === itemId);
    if (!item) return;
   
    if (userState.coins >= item.price) {
        userState.coins -= item.price;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        showNotification('✅ Xarid qilindi', 'Mahsulot muvaffaqiyatli sotib olindi!');
    } else {
        showNotification('⚠️ Yetarli emas', 'Coinlaringiz yetarli emas!');
    }
}

export function loadLeaderboard() {
    const leaders = [
        // Liderlar ma'lumotlari (test uchun bo'sh)
    ];
   
    if (elements.leaderboardList) {
        elements.leaderboardList.innerHTML = leaders.map(leader => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${leader.rank}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">
                        ${leader.name}
                        <span class="gender-badge gender-${leader.gender}-badge">
                            <i class="fas fa-${leader.gender === 'male' ? 'mars' : 'venus'}"></i>
                            ${leader.gender === 'male' ? 'Erkak' : 'Ayol'}
                        </span>
                    </div>
                    <div class="leaderboard-stats">
                        <span><i class="fas fa-trophy"></i> ${leader.rating}</span>
                        <span><i class="fas fa-heart"></i> ${leader.matches}</span>
                        <span><i class="fas fa-users"></i> ${leader.friends}</span>
                    </div>
                </div>
                <div class="leaderboard-value">${leader.rating}</div>
            </div>
        `).join('');
    }
   
    if (elements.leaderboardUpdated) {
        elements.leaderboardUpdated.textContent = 'hozir';
    }
}

export function loadProfileQuests() {
    const quests = [
        { id: 1, title: '3 ta duel o\'ynash', progress: Math.min(userState.duels, 3), total: 3, reward: 50 },
        { id: 2, title: '5 ta like berish', progress: Math.min(userState.totalLikes, 5), total: 5, reward: 30 },
        { id: 3, title: '1 ta match olish', progress: Math.min(userState.matches, 1), total: 1, reward: 100 },
        { id: 4, title: '1 ta do\'st orttirish', progress: Math.min(userState.mutualMatchesCount, 1), total: 1, reward: 200 }
    ];
   
    if (elements.profileQuestsList) {
        elements.profileQuestsList.innerHTML = quests.map(quest => `
            <div class="quest-item">
                <div class="quest-info">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-progress">${quest.progress}/${quest.total}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(quest.progress / quest.total) * 100}%"></div>
                    </div>
                </div>
                <div class="quest-reward">
                    <i class="fas fa-coins"></i> ${quest.reward}
                </div>
            </div>
        `).join('');
    }
}