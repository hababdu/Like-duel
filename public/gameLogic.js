// ==================== GAME LOGIC ====================

const GameLogic = {
    // ==================== TIMER FUNCTIONS ====================
    
    /**
     * Start duel timer
     */
    startTimer: function() {
        // Old timerlarni to'xtatish
        if (window.gameState.timerInterval) {
            clearInterval(window.gameState.timerInterval);
            window.gameState.timerInterval = null;
        }
        
        // Timer qiymatini 20 soniya qilish
        window.gameState.timeLeft = 20;
        
        // Timer elementini yangilash
        if (window.elements?.timer) {
            window.elements.timer.textContent = '20';
            window.elements.timer.style.color = '#2ecc71';
            window.elements.timer.style.fontSize = '3rem';
            window.elements.timer.style.fontWeight = 'bold';
            window.elements.timer.style.animation = '';
        }
        
        // Status yangilash
        window.updateDuelStatus?.('Raqibingizni baholang...');
        
        console.log('⏰ Duel timer boshlandi: 20 soniya');
        
        // Yangi timer boshlash
        window.gameState.timerInterval = setInterval(() => {
            window.gameState.timeLeft--;
            
            // Timer elementini yangilash
            if (window.elements?.timer) {
                window.elements.timer.textContent = window.gameState.timeLeft;
                
                // 10 soniyadan kam qolganida sariq rang
                if (window.gameState.timeLeft <= 10 && window.gameState.timeLeft > 5) {
                    window.elements.timer.style.color = '#f1c40f';
                }
                
                // 5 soniyadan kam qolganida qizil rang va animatsiya
                if (window.gameState.timeLeft <= 5) {
                    window.elements.timer.style.color = '#e74c3c';
                    window.elements.timer.style.animation = 'pulse 0.5s infinite';
                }
            }
            
            // Vaqt tugaganda
            if (window.gameState.timeLeft <= 0) {
                clearInterval(window.gameState.timerInterval);
                window.gameState.timerInterval = null;
                
                // Agar duel davom etayotgan bo'lsa
                if (window.gameState.socket && window.gameState.isInDuel && window.gameState.currentDuelId) {
                    console.log('⏰ Vaqt tugadi, skip avtomatik yuborilmoqda...');
                    
                    // Serverga skip ovoz yuborish
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
                    window.updateDuelStatus?.('Vaqt tugadi...');
                    
                    // Tugmalarni o'chirish
                    this.disableVoteButtons();
                    
                    // Timeout modalini ko'rsatish
                    setTimeout(() => {
                        window.showTimeoutOptions?.();
                    }, 1500);
                }
            }
        }, 1000);
    },
    
    /**
     * Start waiting timer (30 soniya)
     */
    startWaitingTimer: function() {
        // Old timerlarni to'xtatish
        if (window.gameState.waitingTimerInterval) {
            clearInterval(window.gameState.waitingTimerInterval);
            window.gameState.waitingTimerInterval = null;
        }
        
        // Timer qiymatini 30 soniya qilish
        window.gameState.waitingTimeLeft = 30;
        
        console.log('⏳ Raqib javobini kutish timer boshlandi: 30 soniya');
        
        // Yangi timer boshlash
        window.gameState.waitingTimerInterval = setInterval(() => {
            window.gameState.waitingTimeLeft--;
            
            // Timer elementini yangilash
            if (window.elements?.timer) {
                window.elements.timer.textContent = window.gameState.waitingTimeLeft;
                window.elements.timer.style.color = '#ff9500';
                
                // 10 soniyadan kam qolganida qizil rang
                if (window.gameState.waitingTimeLeft <= 10) {
                    window.elements.timer.style.color = '#ff4444';
                    window.elements.timer.style.animation = 'pulse 0.5s infinite';
                }
            }
            
            // Statusni yangilash
            if (window.elements?.duelStatus) {
                window.elements.duelStatus.textContent = 
                    `Raqib javobini kutish... (${window.gameState.waitingTimeLeft}s)`;
            }
            
            // Vaqt tugaganda
            if (window.gameState.waitingTimeLeft <= 0) {
                clearInterval(window.gameState.waitingTimerInterval);
                window.gameState.waitingTimerInterval = null;
                
                console.log('⏰ Raqib javob bermadi, timeout...');
                
                // Timeout modalini ko'rsatish
                setTimeout(() => {
                    window.showOpponentTimeoutModal?.();
                }, 500);
            }
        }, 1000);
    },
    
    /**
     * Stop all timers
     */
    stopAllTimers: function() {
        if (window.gameState.timerInterval) {
            clearInterval(window.gameState.timerInterval);
            window.gameState.timerInterval = null;
        }
        
        if (window.gameState.waitingTimerInterval) {
            clearInterval(window.gameState.waitingTimerInterval);
            window.gameState.waitingTimerInterval = null;
        }
        
        window.gameState.timeLeft = 20;
        window.gameState.waitingTimeLeft = 30;
        
        console.log('⏹️ Barcha timerlar to\'xtatildi');
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
            return false;
        }
        
        // Duel ID ni tekshirish
        if (!window.gameState.currentDuelId) {
            console.error('❌ Ovoz berish: Duel ID topilmadi');
            window.utils?.showNotification('Xato', 'Duel ma\'lumotlari topilmadi');
            return false;
        }
        
        // Super like limitini tekshirish
        if (choice === 'super_like' && window.userState.dailySuperLikes <= 0) {
            console.warn('⚠️ Super like limiti tugagan');
            window.utils?.showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
            return false;
        }
        
        console.log(`🗳️ Ovoz berish: ${choice}, duel: ${window.gameState.currentDuelId}`);
        
        // Tugmalarni o'chirish
        this.disableVoteButtons();
        
        // Timer to'xtatish
        this.stopAllTimers();
        
        // Ovoz turiga qarab UI yangilash
        switch(choice) {
            case 'like':
                if (window.elements?.timer) {
                    window.elements.timer.textContent = '❤️';
                    window.elements.timer.style.color = '#e74c3c';
                }
                window.updateDuelStatus?.('LIKE berdingiz. Raqib javobini kutish...');
                console.log('❤️ Like berildi');
                break;
                
            case 'super_like':
                // Super like hisobini kamaytirish
                window.userState.dailySuperLikes--;
                if (window.elements?.superLikeCount) {
                    window.elements.superLikeCount.textContent = window.userState.dailySuperLikes;
                }
                window.storage?.saveUserState?.();
                
                if (window.elements?.timer) {
                    window.elements.timer.textContent = '💖';
                    window.elements.timer.style.color = '#9b59b6';
                }
                window.updateDuelStatus?.('SUPER LIKE! Raqib javobini kutish...');
                console.log(`💖 Super like berildi, qolgan: ${window.userState.dailySuperLikes}`);
                break;
                
            case 'skip':
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
                break;
        }
        
        // Serverga ovoz yuborish
        window.socketManager?.sendVote?.(window.gameState.currentDuelId, choice);
        
        // Kutish timerini boshlash (faqat like yoki super_like uchun)
        if (choice === 'like' || choice === 'super_like') {
            setTimeout(() => {
                this.startWaitingTimer();
            }, 500);
        }
        
        return true;
    },
    
    /**
     * Disable vote buttons
     */
    disableVoteButtons: function() {
        console.log('🔒 Tugmalar o\'chirilmoqda...');
        
        [window.elements?.noBtn, window.elements?.likeBtn, window.elements?.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = true;
                b.style.opacity = '0.6';
                b.style.cursor = 'not-allowed';
                b.classList.add('disabled');
            }
        });
        
        console.log('✅ Tugmalar o\'chirildi');
    },
    
    /**
     * Reset vote buttons
     */
    resetVoteButtons: function() {
        console.log('🔄 Tugmalar reset qilinmoqda...');
        
        // Original onclick handler'lar qayta o'rnatish
        if (window.elements?.noBtn) {
            window.elements.noBtn.disabled = false;
            window.elements.noBtn.style.opacity = '1';
            window.elements.noBtn.style.cursor = 'pointer';
            window.elements.noBtn.classList.remove('disabled');
            window.elements.noBtn.textContent = '✖';
            window.elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
            
            // Original handler
            window.elements.noBtn.onclick = () => {
                console.log('✖ Skip tugmasi bosildi');
                window.gameLogic?.handleVote?.('skip');
            };
        }
        
        if (window.elements?.likeBtn) {
            window.elements.likeBtn.disabled = false;
            window.elements.likeBtn.style.opacity = '1';
            window.elements.likeBtn.style.cursor = 'pointer';
            window.elements.likeBtn.classList.remove('disabled');
            window.elements.likeBtn.textContent = '❤️';
            window.elements.likeBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
            
            // Original handler
            window.elements.likeBtn.onclick = () => {
                console.log('❤️ Like tugmasi bosildi');
                window.gameLogic?.handleVote?.('like');
            };
        }
        
        if (window.elements?.superLikeBtn) {
            window.elements.superLikeBtn.disabled = false;
            window.elements.superLikeBtn.style.opacity = '1';
            window.elements.superLikeBtn.style.cursor = 'pointer';
            window.elements.superLikeBtn.classList.remove('disabled');
            window.elements.superLikeBtn.textContent = '💖';
            window.elements.superLikeBtn.style.background = 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)';
            
            // Original handler
            window.elements.superLikeBtn.onclick = () => {
                console.log('💖 Super like tugmasi bosildi');
                window.gameLogic?.handleVote?.('super_like');
            };
        }
        
        console.log('✅ Tugmalar reset qilindi');
    },
    
    // ==================== MATCH HANDLING ====================
    
    /**
     * Handle match result
     */
    handleMatch: function(data) {
        console.log('🎉 MATCH boshlandi!', data);
        
        // Barcha timerlarni to'xtatish
        this.stopAllTimers();
        
        // Game state yangilash
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.currentPartner = data.partner;
        window.gameState.lastOpponent = data.partner.id;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = true;
        
        // Tugmalarni reset qilish
        this.resetVoteButtons();
        
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
     * Handle waiting for opponent response
     */
    handleWaitingResponse: function(data) {
        console.log('⏳ Raqib javobini kutish...');
        
        // Biz ovoz berganmiz, kutish holatida
        window.gameState.waitingForOpponent = true;
        
        // Statusni yangilash
        window.updateDuelStatus?.('Raqib javobini kutish...');
        
        // LIKE va SUPER LIKE tugmalarini o'chirish
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
        
        // SKIP tugmasini yoqish (lekin o'zgartirmaymiz)
        if (window.elements?.noBtn) {
            window.elements.noBtn.disabled = false;
            window.elements.noBtn.style.opacity = '1';
            window.elements.noBtn.textContent = '✖'; // O'zgartirmaymiz!
            window.elements.noBtn.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'; // O'zgartirmaymiz!
            window.elements.noBtn.classList.remove('disabled');
            
            // SKIP uchun original handler
            window.elements.noBtn.onclick = () => {
                console.log('✖ Skip tugmasi bosildi (kutish paytida)');
                window.gameLogic?.handleVote?.('skip');
            };
        }
        
        console.log('✅ Kutish rejimi yoqildi');
    },
    
    /**
     * Handle opponent voted first
     */
    handleOpponentVotedFirst: function() {
        console.log('⚠️ Raqib avval ovoz berdi, siz ovoz berishingiz kerak');
        
        // Raqib ovoz bergani uchun bizga maxsus "Keyingisi" tugmasi CHIQMAYDI!
        // Faqat LIKE, SUPER LIKE, SKIP tugmalari bo'ladi
        
        // Statusni yangilash
        window.updateDuelStatus?.('Raqib ovoz berdi. Siz ovoz bering...');
        
        // Barcha tugmalarni yoqish
        this.resetVoteButtons();
        
        // Timer yangilash (agar kerak bo'lsa)
        if (window.elements?.timer) {
            window.elements.timer.style.color = '#2ecc71';
        }
        
        console.log('✅ Raqib avval ovoz bergan holat ishlatildi');
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
            window.gameState.waitingForOpponent = false;
            
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
        this.stopAllTimers();
        
        // UI reset
        if (window.elements?.timer) {
            window.elements.timer.textContent = '20';
            window.elements.timer.style.color = '#2ecc71';
            window.elements.timer.style.animation = '';
        }
        
        // Tugmalarni reset qilish
        this.resetVoteButtons();
        
        // Game state yangilash
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = false;
        window.gameState.skipToNextRequested = true;
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.currentPartner = null;
        
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
        this.stopAllTimers();
        
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
            window.elements.timer.style.color = '#2ecc71';
            window.elements.timer.style.animation = '';
        }
        
        // Tugmalarni reset qilish
        this.resetVoteButtons();
        
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
        window.startWaitingTimer = () => this.startWaitingTimer();
        window.stopAllTimers = () => this.stopAllTimers();
        window.resetVoteButtons = () => this.resetVoteButtons();
        window.disableVoteButtons = () => this.disableVoteButtons();
        
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
        window.handleOpponentVotedFirst = () => this.handleOpponentVotedFirst();
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