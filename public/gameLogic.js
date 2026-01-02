// ==================== GAME LOGIC ====================

const GameLogic = {
    // ==================== TIMER FUNCTIONS ====================
    
    /**
     * Start duel timer
     */
    startTimer: function() {
        // Old timerlarni to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Timer qiymatini 20 soniya qilish
        window.gameState.timeLeft = 20;
        
        // Timer elementini yangilash
        if (window.elements?.timer) {
            window.elements.timer.textContent = window.gameState.timeLeft;
            window.elements.timer.style.color = '#fff';
            window.elements.timer.style.animation = '';
            window.elements.timer.classList.remove('danger');
        }
        
        // Yangi timer boshlash
        window.gameState.timerInterval = setInterval(() => {
            window.gameState.timeLeft--;
            
            // Timer elementini yangilash
            if (window.elements?.timer) {
                window.elements.timer.textContent = window.gameState.timeLeft;
                
                // 5 soniyadan kam qolganida qizil rang va animatsiya
                if (window.gameState.timeLeft <= 5) {
                    window.elements.timer.style.color = '#e74c3c';
                    window.elements.timer.style.animation = 'pulse 1s infinite';
                    window.elements.timer.classList.add('danger');
                }
            }
            
            // Vaqt tugaganda
            if (window.gameState.timeLeft <= 0) {
                clearInterval(window.gameState.timerInterval);
                
                // Agar duel davom etayotgan bo'lsa
                if (window.gameState.socket && window.gameState.isInDuel) {
                    // Serverga ovoz yuborish
                    window.gameState.socket.emit('vote', { 
                        duelId: window.gameState.currentDuelId, 
                        choice: 'skip' 
                    });
                    
                    // Timer elementini yangilash
                    if (window.elements?.timer) {
                        window.elements.timer.textContent = '⏰';
                        window.elements.timer.style.color = '#e74c3c';
                    }
                    
                    // Statusni yangilash
                    window.updateDuelStatus?.('⏰ Vaqt tugadi...');
                    
                    // Match holatini o'zgartirish
                    window.gameState.matchCompleted = true;
                    
                    // No match modalini ko'rsatish
                    setTimeout(() => {
                        window.showTimeoutOptions?.();
                    }, 1000);
                }
            }
        }, 1000);
        
        console.log('⏰ Duel timer boshlandi: 20 soniya');
    },
    
    /**
     * Start waiting timer (2 minutes)
     */
    startWaitingTimer: function() {
        // Old timerlarni to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Timer qiymatini 2 daqiqa (120 soniya) qilish
        window.gameState.timeLeft = 120;
        
        // Timer elementini formatlash
        if (window.elements?.timer) {
            const minutes = Math.floor(window.gameState.timeLeft / 60);
            const seconds = window.gameState.timeLeft % 60;
            window.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            window.elements.timer.style.color = '#ff9500';
            window.elements.timer.style.animation = 'pulse 2s infinite';
        }
        
        // Yangi timer boshlash
        window.gameState.timerInterval = setInterval(() => {
            window.gameState.timeLeft--;
            
            // Timer elementini formatlash va yangilash
            const minutes = Math.floor(window.gameState.timeLeft / 60);
            const seconds = window.gameState.timeLeft % 60;
            
            if (window.elements?.timer) {
                window.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // 30 soniyadan kam qolganida qizil rang va tez animatsiya
                if (window.gameState.timeLeft <= 30) {
                    window.elements.timer.style.color = '#ff4444';
                    window.elements.timer.style.animation = 'pulse 0.5s infinite';
                }
            }
            
            // Vaqt tugaganda
            if (window.gameState.timeLeft <= 0) {
                clearInterval(window.gameState.timerInterval);
                
                // Raqib javob bermaganligi uchun modal ko'rsatish
                setTimeout(() => {
                    this.handleOpponentTimeout();
                }, 500);
            }
        }, 1000);
        
        console.log('⏰ Kutish timer boshlandi: 2 daqiqa');
    },
    
    // ==================== VOTE HANDLING ====================
    
    /**
     * Handle vote
     */
    handleVote: function(choice) {
        console.log(`🗳️ Ovoz berish boshlandi: ${choice}`);
        
        // Duel holatini tekshirish
        if (!window.gameState.socket || !window.gameState.isInDuel) {
            console.error('❌ Ovoz berish: Duel holati noto\'g\'ri');
            window.utils?.showNotification('Xato', 'Siz hozir duelda emassiz');
            return;
        }
        
        // Duel ID ni tekshirish
        if (!window.gameState.currentDuelId) {
            console.error('❌ Ovoz berish: Duel ID topilmadi');
            window.utils?.showNotification('Xato', 'Duel ma\'lumotlari topilmadi');
            return;
        }
        
        console.log(`🗳️ Ovoz berish: ${choice}, duel: ${window.gameState.currentDuelId}`);
        
        // Tugmalarni vaqtincha o'chirish
        [window.elements?.noBtn, window.elements?.likeBtn, window.elements?.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = true;
                b.style.opacity = '0.6';
                b.style.cursor = 'not-allowed';
                b.classList.add('disabled');
            }
        });
        
        // Super like limitini tekshirish
        if (choice === 'super_like') {
            if (window.userState.dailySuperLikes <= 0) {
                console.warn('⚠️ Super like limiti tugagan');
                window.utils?.showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
                
                // Tugmalarni qayta yoqish
                setTimeout(() => {
                    window.resetVoteButtons?.();
                }, 1000);
                
                return;
            }
            
            // Super like hisobini kamaytirish
            window.userState.dailySuperLikes--;
            if (window.elements?.superLikeCount) {
                window.elements.superLikeCount.textContent = window.userState.dailySuperLikes;
            }
            window.storage?.saveUserState?.();
            
            console.log(`💖 Super like ishlatildi, qolgan: ${window.userState.dailySuperLikes}`);
        }
        
        // Timer to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Ovoz turiga qarab UI yangilash
        if (choice === 'like') {
            if (window.elements?.timer) {
                window.elements.timer.textContent = '❤️';
                window.elements.timer.style.color = '#e74c3c';
            }
            window.updateDuelStatus?.('LIKE berdingiz. Raqib javobini kutish...');
            console.log('❤️ Like berildi');
            
        } else if (choice === 'super_like') {
            if (window.elements?.timer) {
                window.elements.timer.textContent = '💖';
                window.elements.timer.style.color = '#9b59b6';
            }
            window.updateDuelStatus?.('SUPER LIKE! Raqib javobini kutish...');
            console.log('💖 Super like berildi');
            
        } else if (choice === 'skip') {
            if (window.elements?.timer) {
                window.elements.timer.textContent = '✖';
                window.elements.timer.style.color = '#e74c3c';
            }
            window.updateDuelStatus?.('O\'tkazib yubordingiz...');
            window.gameState.matchCompleted = true;
            console.log('✖ O\'tkazib yuborildi');
            
            // No match modalini ko'rsatish
            setTimeout(() => {
                window.showNoMatchOptions?.();
            }, 1500);
        }
        
        // Serverga ovoz yuborish
        window.socketManager?.sendVote?.(window.gameState.currentDuelId, choice);
        
        return true;
    },
    
    /**
     * Reset vote buttons
     */
    resetVoteButtons: function() {
        console.log('🔄 Tugmalar reset qilinmoqda...');
        
        // Barcha ovoz berish tugmalarini yoqish
        [window.elements?.noBtn, window.elements?.likeBtn, window.elements?.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
                b.style.cursor = 'pointer';
                b.classList.remove('disabled');
            }
        });
        
        // Tugma matnlarini va ranglarini tiklash
        if (window.elements?.noBtn) {
            window.elements.noBtn.textContent = '✖';
            window.elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        }
        
        if (window.elements?.likeBtn) {
            window.elements.likeBtn.textContent = '❤️';
            window.elements.likeBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        }
        
        if (window.elements?.superLikeBtn) {
            window.elements.superLikeBtn.textContent = '💖';
            window.elements.superLikeBtn.style.background = 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)';
        }
        
        console.log('✅ Tugmalar reset qilindi');
    },
    
    // ==================== MATCH HANDLING ====================
    
    /**
     * Handle match result
     */
    handleMatch: function(data) {
        console.log('🎉 MATCH boshlandi!', data);
        
        // Timer to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Game state yangilash
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.currentPartner = data.partner;
        window.gameState.lastOpponent = data.partner.id;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = true;
        
        // Tugmalarni reset qilish
        window.resetVoteButtons?.();
        
        // Match ekraniga o'tish
        window.showScreen?.('match');
        
        // UI yangilash
        if (window.elements?.partnerName) {
            window.elements.partnerName.textContent = data.partner.name;
        }
        
        // Match turiga qarab matn
        if (data.isMutual) {
            console.log('🤝 O\'zaro match!');
            
            if (window.elements?.matchText) {
                window.elements.matchText.innerHTML = `
                    <div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold; margin-bottom: 10px;">🎉 O'ZARO MATCH!</div>
                    <div style="font-size: 1.2rem; color: #fff; margin-bottom: 5px;">${data.partner.name} bilan do'st bo'ldingiz!</div>
                    <div style="color: #ccc; font-size: 0.9rem;">
                        Endi siz bir-biringizning do'stlaringiz ro'yxatidasiz!
                    </div>
                `;
            }
            
            // O'zaro match sonini yangilash
            window.userState.mutualMatchesCount++;
            window.userState.friendsCount++;
            
        } else {
            console.log('❤️ Oddiy match');
            
            if (window.elements?.matchText) {
                window.elements.matchText.innerHTML = `
                    <div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold; margin-bottom: 10px;">🎉 MATCH!</div>
                    <div style="font-size: 1.2rem; color: #fff;">
                        ${data.partner.name} bilan bir-biringizni yoqtirdingiz!
                    </div>
                `;
            }
        }
        
        // Mukofotlarni ko'rsatish
        if (window.elements?.rewardCoins) {
            window.elements.rewardCoins.textContent = data.rewards?.coins || 50;
        }
        
        if (window.elements?.rewardXP) {
            window.elements.rewardXP.textContent = data.rewards?.xp || 30;
        }
        
        // User state yangilash
        if (data.rewards?.coins) {
            window.userState.coins += data.rewards.coins;
        }
        
        if (data.newRating) {
            window.userState.rating = data.newRating;
        }
        
        window.userState.matches++;
        
        // Storage ga saqlash
        window.storage?.saveUserState?.();
        
        // UI ni yangilash
        window.updateUIFromUserState?.();
        
        // Match variantlarini yaratish
        this.createMatchOptions(data.partner);
        
        // Konfet efektini ishga tushirish
        if (typeof confetti === 'function') {
            try {
                confetti({ 
                    particleCount: 150, 
                    spread: 70, 
                    origin: { y: 0.6 } 
                });
                
                // O'zaro match bo'lsa qo'shimcha konfet
                if (data.isMutual) {
                    setTimeout(() => {
                        confetti({ 
                            particleCount: 100,
                            angle: 60,
                            spread: 55,
                            origin: { x: 0.2, y: 0.6 }
                        });
                        confetti({ 
                            particleCount: 100,
                            angle: 120,
                            spread: 55,
                            origin: { x: 0.8, y: 0.6 }
                        });
                    }, 300);
                }
            } catch (e) {
                console.log('⚠️ Konfet efekti ishlamadi:', e);
            }
        }
        
        // Ogohlantirish
        window.utils?.showNotification('🎉 MATCH!', 
            data.isMutual ? `${data.partner.name} bilan do'st bo'ldingiz!` : 
                           `${data.partner.name} bilan match!`);
        
        console.log('✅ Match muvaffaqiyatli qayta ishlandi');
    },
    
    /**
     * Create match options buttons
     */
    createMatchOptions: function(partner) {
        if (!window.elements?.matchOptions) {
            console.error('❌ Match options elementi topilmadi');
            return;
        }
        
        console.log('🎯 Match variantlari yaratilmoqda...');
        
        // Oldingi variantlarni tozalash
        window.elements.matchOptions.innerHTML = '';
        
        const options = [
            {
                action: 'open_chat',
                label: '💬 Chatga o\'tish',
                style: 'background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);',
                icon: 'fas fa-comments'
            },
            {
                action: 'show_next_duel_confirm',
                label: '➡️ Yangi duel',
                style: 'background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);',
                icon: 'fas fa-gamepad'
            },
            {
                action: 'return_to_menu',
                label: '🏠 Bosh menyu',
                style: 'background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);',
                icon: 'fas fa-home'
            }
        ];
        
        // Har bir variant uchun tugma yaratish
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'match-option-btn';
            btn.innerHTML = `<i class="${opt.icon}"></i> ${opt.label}`;
            btn.style.cssText = opt.style + ' margin: 5px 0;';
            
            // Click handler qo'shish
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMatchOption(opt.action, partner);
            });
            
            window.elements.matchOptions.appendChild(btn);
        });
        
        console.log('✅ Match variantlari yaratildi');
    },
    
    /**
     * Handle match option selection
     */
    handleMatchOption: function(action, partner) {
        console.log(`🎯 Match variant tanlandi: ${action}`, partner);
        
        switch(action) {
            case 'open_chat':
                console.log('💬 Chat ochish');
                window.openChat?.(partner);
                break;
                
            case 'show_next_duel_confirm':
                console.log('🎮 Yangi duelni tasdiqlash modali');
                window.showNextDuelConfirmModal?.(partner);
                break;
                
            case 'return_to_menu':
                console.log('🏠 Bosh menyuga qaytish');
                this.returnToMenu();
                break;
                
            default:
                console.log('⚠️ Noma\'lum variant, bosh menyuga qaytish');
                this.returnToMenu();
        }
    },
    
    /**
     * Handle liked only result
     */
    handleLikedOnly: function(data) {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        
        // Timer to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Game state yangilash
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = true;
        
        // Tugmalarni reset qilish
        window.resetVoteButtons?.();
        
        // Timer elementini yangilash
        if (window.elements?.timer) {
            window.elements.timer.textContent = '❤️';
            window.elements.timer.style.color = '#e74c3c';
        }
        
        // Mukofotlarni yangilash
        if (data.reward) {
            window.userState.coins += data.reward.coins || 0;
            window.userState.totalLikes++;
            window.storage?.saveUserState?.();
            window.updateUIFromUserState?.();
            
            console.log(`💰 Mukofot: +${data.reward.coins} coin, +${data.reward.xp || 0} XP`);
            
            // Ogohlantirish
            window.utils?.showNotification('Like uchun mukofot', 
                `+${data.reward.coins} coin, +${data.reward.xp || 0} XP`);
        }
        
        // Variantlarni ko'rsatish
        setTimeout(() => {
            window.showLikedOnlyOptions?.(data.opponentName || 'Raqib');
        }, 1500);
    },
    
    /**
     * Handle no match result
     */
    handleNoMatch: function(data) {
        console.log('❌ Match bo\'lmadi');
        
        // Timer to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Game state yangilash
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = true;
        
        // Tugmalarni reset qilish
        window.resetVoteButtons?.();
        
        // Timer elementini yangilash
        if (window.elements?.timer) {
            window.elements.timer.textContent = '✖';
            window.elements.timer.style.color = '#e74c3c';
        }
        
        // Variantlarni ko'rsatish
        setTimeout(() => {
            window.showNoMatchModal?.();
        }, 1500);
    },
    
    /**
     * Handle timeout result
     */
    handleTimeout: function(data) {
        console.log('⏰ Vaqt tugadi');
        
        // Timer to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Game state yangilash
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = true;
        
        // Tugmalarni reset qilish
        window.resetVoteButtons?.();
        
        // Timer elementini yangilash
        if (window.elements?.timer) {
            window.elements.timer.textContent = '⏰';
            window.elements.timer.style.color = '#e74c3c';
        }
        
        // Variantlarni ko'rsatish
        setTimeout(() => {
            window.showTimeoutOptions?.();
        }, 1500);
    },
    
    /**
     * Handle waiting for opponent response
     */
    handleWaitingResponse: function(data) {
        console.log('⏳ Raqib javobini kutish...');
        
        // Old timerlarni to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Kutish holatini yoqish
        window.gameState.waitingForOpponent = true;
        
        // 2 daqiqa kutish timerini boshlash
        this.startWaitingTimer();
        
        // Statusni yangilash
        window.updateDuelStatus?.('⏳ Raqib javobini kutish... (2 daqiqa)');
        
        // Like tugmalarini o'chirish
        if (window.elements?.likeBtn) {
            window.elements.likeBtn.disabled = true;
            window.elements.likeBtn.style.opacity = '0.5';
            window.elements.likeBtn.classList.add('disabled');
        }
        
        if (window.elements?.superLikeBtn) {
            window.elements.superLikeBtn.disabled = true;
            window.elements.superLikeBtn.style.opacity = '0.5';
            window.elements.superLikeBtn.classList.add('disabled');
        }
        
        // Skip tugmasini yoqish va matnini o'zgartirish
        if (window.elements?.noBtn) {
            window.elements.noBtn.disabled = false;
            window.elements.noBtn.style.opacity = '1';
            window.elements.noBtn.textContent = '⏭️ Keyingisi';
            window.elements.noBtn.style.background = 'linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%)';
            window.elements.noBtn.classList.remove('disabled');
            
            // Click handler qo'shish
            window.elements.noBtn.onclick = () => {
                console.log('⏭️ Keyingi duelga o\'tish tugmasi bosildi');
                this.skipToNextDuel();
            };
        }
    },
    
    /**
     * Handle opponent timeout
     */
    handleOpponentTimeout: function() {
        console.log('⏰ Raqib javob bermadi');
        
        // Timer elementini yangilash
        if (window.elements?.timer) {
            window.elements.timer.textContent = '⏰';
            window.elements.timer.style.color = '#e74c3c';
        }
        
        // Statusni yangilash
        window.updateDuelStatus?.('Raqib javob bermadi. O\'yinni tugatish?');
        
        // Timeout modali ko'rsatish
        window.showOpponentTimeoutModal?.();
    },
    
    // ==================== GAME FLOW ====================
    
    /**
     * Start new duel from match screen
     */
    startNewDuelFromMatch: function() {
        console.log('🔄 Matchdan yangi duelga o\'tish');
        
        // Modal yopish
        window.hideNextDuelConfirmModal?.();
        
        // Match ekranini yopish
        window.showScreen?.('queue');
        
        // Navbatga kirish
        if (window.gameState.socket && window.gameState.isConnected) {
            window.gameState.isInQueue = true;
            window.gameState.isInDuel = false;
            window.gameState.currentDuelId = null;
            window.gameState.matchCompleted = false;
            window.gameState.currentPartner = null;
            
            window.gameState.socket.emit('enter_queue');
            window.utils?.showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
            
            console.log('✅ Yangi duel uchun navbatga kirdi');
        } else {
            console.error('❌ Socket ulanmagan, yangi duel boshlab bo\'lmadi');
            window.showScreen?.('welcome');
        }
    },
    
    /**
     * Skip to next duel
     */
    skipToNextDuel: function() {
        console.log('🔄 Keyingi duelga o\'tish');
        
        // Barcha modallarni yopish
        window.hideAllModals?.();
        window.closeChatModal?.();
        
        // Barcha timerlarni to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // UI reset
        if (window.elements?.timer) {
            window.elements.timer.textContent = '20';
            window.elements.timer.style.color = '#fff';
            window.elements.timer.style.animation = '';
            window.elements.timer.classList.remove('danger');
        }
        
        // Tugmalarni reset qilish
        window.resetVoteButtons?.();
        
        // Game state yangilash
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = false;
        window.gameState.skipToNextRequested = true;
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        
        // Queue ekraniga o'tish
        window.showScreen?.('queue');
        
        // Navbatga kirish
        if (window.gameState.socket && window.gameState.isConnected) {
            if (window.userState.hasSelectedGender) {
                window.gameState.isInQueue = true;
                window.gameState.socket.emit('enter_queue');
                window.utils?.showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
                console.log('✅ Keyingi duel uchun navbatga kirdi');
            } else {
                console.error('❌ Gender tanlanmagan, welcome ekraniga qaytish');
                window.showScreen?.('welcome');
            }
        } else {
            console.error('❌ Socket ulanmagan, welcome ekraniga qaytish');
            window.showScreen?.('welcome');
        }
    },
    
    /**
     * Return to main menu
     */
    returnToMenu: function() {
        console.log('🏠 Bosh menyuga qaytish');
        
        // Barcha modallarni yopish
        window.hideAllModals?.();
        window.closeChatModal?.();
        
        // Barcha timerlarni to'xtatish
        clearInterval(window.gameState.timerInterval);
        
        // Navbatdan chiqish
        if (window.gameState.socket && window.gameState.isConnected) {
            window.gameState.socket.emit('leave_queue');
        }
        
        // Game state reset
        window.gameState.isInQueue = false;
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = false;
        window.gameState.skipToNextRequested = false;
        window.gameState.currentPartner = null;
        
        // UI reset
        if (window.elements?.timer) {
            window.elements.timer.textContent = '20';
            window.elements.timer.style.color = '#fff';
            window.elements.timer.style.animation = '';
            window.elements.timer.classList.remove('danger');
        }
        
        // Tugmalarni reset qilish
        window.resetVoteButtons?.();
        
        // Welcome ekraniga qaytish
        window.showScreen?.('welcome');
        
        // Ogohlantirish
        window.utils?.showNotification('Bosh menyuga qaytildi', 
            'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
        
        console.log('✅ Bosh menyuga muvaffaqiyatli qaytildi');
    },
    
    // ==================== PROFILE MANAGEMENT ====================
    
    /**
     * Update user stats
     */
    updateStats: function(data) {
        console.log('📊 User stats yangilanmoqda:', data);
        
        // Yangilanishlarni qo'llash
        const updates = {
            'gender': data.gender,
            'hasSelectedGender': data.hasSelectedGender,
            'coins': data.coins,
            'level': data.level,
            'rating': data.rating,
            'matches': data.matches,
            'duels': data.duels,
            'wins': data.wins,
            'totalLikes': data.totalLikes,
            'dailySuperLikes': data.dailySuperLikes,
            'bio': data.bio,
            'filter': data.filter,
            'mutualMatchesCount': data.mutualMatchesCount,
            'friendsCount': data.friendsCount
        };
        
        // Faqat berilgan qiymatlarni yangilash
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && window.userState[key] !== undefined) {
                window.userState[key] = value;
                console.log(`   ${key}: ${value}`);
            }
        });
        
        // Storage ga saqlash
        window.storage?.saveUserState?.();
        
        // UI yangilash
        window.updateUIFromUserState?.();
        
        console.log('✅ User stats yangilandi');
    },
    
    // ==================== INITIALIZATION ====================
    
    /**
     * Initialize game logic
     */
    initGameLogic: function() {
        console.log('🎮 Game logic ishga tushmoqda...');
        
        // Global funksiyalarni eksport qilish
        this.exportGlobalFunctions();
        
        console.log('✅ Game logic ishga tushdi');
    },
    
    /**
     * Export global functions
     */
    exportGlobalFunctions: function() {
        console.log('🌍 Game logic global funksiyalar export qilinmoqda...');
        
        // Timer functions
        window.startTimer = () => this.startTimer();
        window.resetVoteButtons = () => this.resetVoteButtons();
        
        // Game flow functions
        window.skipToNextDuel = () => this.skipToNextDuel();
        window.returnToMenu = () => this.returnToMenu();
        window.startNewDuelFromMatch = () => this.startNewDuelFromMatch();
        
        // Event handlers
        window.handleMatch = (data) => this.handleMatch(data);
        window.handleLikedOnly = (data) => this.handleLikedOnly(data);
        window.handleNoMatch = (data) => this.handleNoMatch(data);
        window.handleTimeout = (data) => this.handleTimeout(data);
        window.handleWaitingResponse = (data) => this.handleWaitingResponse(data);
        window.updateStats = (data) => this.updateStats(data);
        
        console.log('✅ Game logic global funksiyalar export qilindi');
    }
};

// ==================== INITIALIZATION ====================

// DOM yuklanganda ishga tushirish
document.addEventListener('DOMContentLoaded', function() {
    if (window.gameLogic) {
        window.gameLogic.initGameLogic();
    }
});

// Agar DOM allaqachon yuklangan bo'lsa
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        if (window.gameLogic) {
            window.gameLogic.initGameLogic();
        }
    }, 100);
}

// Export to global scope
window.gameLogic = GameLogic;