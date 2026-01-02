// ==================== GAME LOGIC ====================

const GameLogic = {
    // ==================== TIMER FUNCTIONS ====================
    
    /**
     * Start duel timer
     */
    startTimer: function() {
        clearInterval(window.gameState.timerInterval);
        window.gameState.timeLeft = 20;
        
        if (window.elements?.timer) {
            window.elements.timer.textContent = 20;
            window.elements.timer.style.color = '#fff';
            window.elements.timer.style.animation = '';
        }
        
        window.gameState.timerInterval = setInterval(() => {
            window.gameState.timeLeft--;
            
            if (window.elements?.timer) {
                window.elements.timer.textContent = window.gameState.timeLeft;
            }
            
            if (window.gameState.timeLeft <= 5 && window.elements?.timer) {
                window.elements.timer.style.color = '#e74c3c';
                window.elements.timer.style.animation = 'pulse 1s infinite';
            }
            
            if (window.gameState.timeLeft <= 0) {
                clearInterval(window.gameState.timerInterval);
                if (window.gameState.socket && window.gameState.isInDuel) {
                    window.gameState.socket.emit('vote', { 
                        duelId: window.gameState.currentDuelId, 
                        choice: 'skip' 
                    });
                    
                    if (window.elements?.timer) {
                        window.elements.timer.textContent = '⏰';
                    }
                    
                    window.updateDuelStatus?.('Vaqt tugadi...');
                }
            }
        }, 1000);
    },
    
    /**
     * Start waiting timer (2 minutes)
     */
    startWaitingTimer: function() {
        clearInterval(window.gameState.timerInterval);
        window.gameState.timeLeft = 120; // 2 minutes
        
        if (window.elements?.timer) {
            const minutes = Math.floor(window.gameState.timeLeft / 60);
            const seconds = window.gameState.timeLeft % 60;
            window.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            window.elements.timer.style.color = '#ff9500';
            window.elements.timer.style.animation = 'pulse 2s infinite';
        }
        
        window.gameState.timerInterval = setInterval(() => {
            window.gameState.timeLeft--;
            
            const minutes = Math.floor(window.gameState.timeLeft / 60);
            const seconds = window.gameState.timeLeft % 60;
            
            if (window.elements?.timer) {
                window.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (window.gameState.timeLeft <= 30) {
                if (window.elements?.timer) {
                    window.elements.timer.style.color = '#ff4444';
                    window.elements.timer.style.animation = 'pulse 0.5s infinite';
                }
            }
            
            if (window.gameState.timeLeft <= 0) {
                clearInterval(window.gameState.timerInterval);
                this.handleOpponentTimeout();
            }
        }, 1000);
    },
    
    // ==================== VOTE HANDLING ====================
    
    /**
     * Handle vote
     */
    handleVote: function(choice) {
        if (!window.gameState.socket || !window.gameState.isInDuel) {
            window.utils?.showNotification('Xato', 'Siz hozir duelda emassiz');
            return;
        }
        
        console.log(`🗳️ Ovoz berish: ${choice}`);
        
        // Disable buttons temporarily
        [window.elements?.noBtn, window.elements?.likeBtn, window.elements?.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = true;
                b.style.opacity = '0.6';
                b.style.cursor = 'not-allowed';
            }
        });
        
        // Check super like limit
        if (choice === 'super_like' && window.userState.dailySuperLikes <= 0) {
            window.utils?.showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
            window.resetVoteButtons?.();
            return;
        }
        
        // Send vote to server
        window.socketManager?.sendVote?.(window.gameState.currentDuelId, choice);
        
        // Stop timer
        clearInterval(window.gameState.timerInterval);
        
        // Update UI
        if (choice === 'like') {
            if (window.elements?.timer) window.elements.timer.textContent = '❤️';
            window.updateDuelStatus?.('LIKE berdingiz. Raqib javobini kutish...');
        } else if (choice === 'super_like') {
            if (window.elements?.timer) window.elements.timer.textContent = '💖';
            window.updateDuelStatus?.('SUPER LIKE! Raqib javobini kutish...');
            
            // Update super like count
            window.userState.dailySuperLikes--;
            if (window.elements?.superLikeCount) {
                window.elements.superLikeCount.textContent = window.userState.dailySuperLikes;
            }
            window.storage?.saveUserState?.();
        } else {
            if (window.elements?.timer) window.elements.timer.textContent = '✖';
            window.updateDuelStatus?.('O\'tkazib yubordingiz...');
            window.gameState.matchCompleted = true;
            
            // Show options after 2 seconds
            setTimeout(() => {
                window.showNoMatchOptions?.();
            }, 2000);
        }
    },
    
    /**
     * Reset vote buttons
     */
    resetVoteButtons: function() {
        console.log('🔄 Tugmalar reset qilinmoqda...');
        
        [window.elements?.noBtn, window.elements?.likeBtn, window.elements?.superLikeBtn].forEach(b => {
            if (b) {
                b.disabled = false;
                b.style.opacity = '1';
                b.style.cursor = 'pointer';
            }
        });
        
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
    },
    
    // ==================== MATCH HANDLING ====================
    
    /**
     * Handle match result
     */
    handleMatch: function(data) {
        console.log('🎉 MATCH!', data);
        
        clearInterval(window.gameState.timerInterval);
        
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.currentPartner = data.partner;
        window.gameState.lastOpponent = data.partner.id;
        window.gameState.waitingForOpponent = false;
        
        // Reset buttons
        window.resetVoteButtons?.();
        
        window.showScreen?.('match');
        
        // Update UI
        if (window.elements?.partnerName) {
            window.elements.partnerName.textContent = data.partner.name;
        }
        
        if (data.isMutual) {
            if (window.elements?.matchText) {
                window.elements.matchText.innerHTML = `
                    <div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold;">🎉 O'ZARO MATCH!</div>
                    <div style="margin-top: 10px; color: #fff;">${data.partner.name} bilan do'st bo'ldingiz!</div>
                    <div style="margin-top: 5px; color: #ccc; font-size: 0.9rem;">
                        Endi siz bir-biringizning do'stlaringiz ro'yxatidasiz!
                    </div>
                `;
            }
        } else {
            if (window.elements?.matchText) {
                window.elements.matchText.innerHTML = `
                    <div style="font-size: 1.5rem; color: #f1c40f; font-weight: bold;">🎉 MATCH!</div>
                    <div style="margin-top: 10px; color: #fff;">${data.partner.name} bilan bir-biringizni yoqtirdingiz!</div>
                `;
            }
        }
        
        if (window.elements?.rewardCoins) {
            window.elements.rewardCoins.textContent = data.rewards.coins;
        }
        
        if (window.elements?.rewardXP) {
            window.elements.rewardXP.textContent = data.rewards.xp;
        }
        
        // Update user state
        window.userState.coins += data.rewards.coins;
        window.userState.rating = data.newRating;
        window.userState.matches++;
        window.storage?.saveUserState?.();
        window.updateUIFromUserState?.();
        
        // Create match options
        this.createMatchOptions(data.partner);
        
        // Confetti effect
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
    },
    
    /**
     * Create match options buttons
     */
    createMatchOptions: function(partner) {
        if (!window.elements?.matchOptions) return;
        
        window.elements.matchOptions.innerHTML = '';
        
        const options = [
            {
                action: 'open_chat',
                label: '💬 Chatga o\'tish',
                style: 'background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);'
            },
            {
                action: 'show_next_duel_confirm',
                label: '➡️ Yangi duel',
                style: 'background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);'
            },
            {
                action: 'return_to_menu',
                label: '🏠 Bosh menyu',
                style: 'background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);'
            }
        ];
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'match-option-btn';
            btn.innerHTML = opt.label;
            btn.style.cssText = opt.style;
            btn.onclick = () => this.handleMatchOption(opt.action, partner);
            window.elements.matchOptions.appendChild(btn);
        });
    },
    
    /**
     * Handle match option selection
     */
    handleMatchOption: function(action, partner) {
        console.log(`Match option: ${action} for partner:`, partner);
        
        switch(action) {
            case 'open_chat':
                window.openChat?.(partner);
                break;
            case 'show_next_duel_confirm':
                window.showNextDuelConfirmModal?.(partner);
                break;
            case 'return_to_menu':
                window.returnToMenu?.();
                break;
            default:
                window.returnToMenu?.();
        }
    },
    
    /**
     * Handle liked only result
     */
    handleLikedOnly: function(data) {
        console.log('❤️ Faqat siz like berdidingiz:', data);
        
        clearInterval(window.gameState.timerInterval);
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        
        // Reset buttons
        window.resetVoteButtons?.();
        
        if (window.elements?.timer) {
            window.elements.timer.textContent = '❤️';
        }
        
        // Update rewards
        if (data.reward) {
            window.userState.coins += data.reward.coins;
            window.userState.totalLikes++;
            window.storage?.saveUserState?.();
            window.updateUIFromUserState?.();
            
            window.utils?.showNotification('Like uchun mukofot', 
                `+${data.reward.coins} coin, +${data.reward.xp} XP`);
        }
        
        // Show options after delay
        setTimeout(() => {
            window.showLikedOnlyOptions?.(data.opponentName);
        }, 1500);
    },
    
    /**
     * Handle no match result
     */
    handleNoMatch: function(data) {
        console.log('❌ Match bo\'lmadi');
        
        clearInterval(window.gameState.timerInterval);
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        
        // Reset buttons
        window.resetVoteButtons?.();
        
        if (window.elements?.timer) {
            window.elements.timer.textContent = '✖';
        }
        
        // Show options after delay
        setTimeout(() => {
            window.showNoMatchModal?.();
        }, 1500);
    },
    
    /**
     * Handle timeout result
     */
    handleTimeout: function(data) {
        console.log('⏰ Vaqt tugadi');
        
        clearInterval(window.gameState.timerInterval);
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        
        // Reset buttons
        window.resetVoteButtons?.();
        
        if (window.elements?.timer) {
            window.elements.timer.textContent = '⏰';
        }
        
        // Show options after delay
        setTimeout(() => {
            window.showTimeoutOptions?.();
        }, 1500);
    },
    
    /**
     * Handle waiting for opponent response
     */
    handleWaitingResponse: function(data) {
        console.log('⏳ Raqib javobini kutish...');
        
        clearInterval(window.gameState.timerInterval);
        window.gameState.waitingForOpponent = true;
        
        // Start 2-minute waiting timer
        this.startWaitingTimer();
        
        window.updateDuelStatus?.('⏳ Raqib javobini kutish... (2 daqiqa)');
        
        // Disable like/super like buttons
        if (window.elements?.likeBtn) {
            window.elements.likeBtn.disabled = true;
            window.elements.likeBtn.style.opacity = '0.5';
        }
        
        if (window.elements?.superLikeBtn) {
            window.elements.superLikeBtn.disabled = true;
            window.elements.superLikeBtn.style.opacity = '0.5';
        }
        
        // Enable skip button with new text
        if (window.elements?.noBtn) {
            window.elements.noBtn.disabled = false;
            window.elements.noBtn.style.opacity = '1';
            window.elements.noBtn.textContent = '⏭️ Keyingisi';
            window.elements.noBtn.style.background = 'linear-gradient(135deg, #ff9500 0%, #ff5e3a 100%)';
        }
    },
    
    /**
     * Handle opponent timeout
     */
    handleOpponentTimeout: function() {
        console.log('⏰ Raqib javob bermadi');
        
        if (window.elements?.timer) {
            window.elements.timer.textContent = '⏰';
        }
        
        window.updateDuelStatus?.('Raqib javob bermadi. O\'yinni tugatish?');
        
        // Show timeout modal
        window.showOpponentTimeoutModal?.();
    },
    
    // ==================== GAME FLOW ====================
    
    /**
     * Start new duel from match screen
     */
    startNewDuelFromMatch: function() {
        console.log('🔄 Matchdan yangi duelga o\'tish');
        
        // Close modal
        window.hideNextDuelConfirmModal?.();
        
        // Close match screen
        window.showScreen?.('queue');
        
        // Enter queue
        if (window.gameState.socket && window.gameState.isConnected) {
            window.gameState.isInQueue = true;
            window.gameState.socket.emit('enter_queue');
            window.utils?.showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
        }
    },
    
    /**
     * Skip to next duel
     */
    skipToNextDuel: function() {
        console.log('🔄 Keyingi duelga o\'tish');
        
        // Close all modals
        window.hideAllModals?.();
        window.closeChatModal?.();
        
        // Stop all timers
        clearInterval(window.gameState.timerInterval);
        
        // Reset UI
        if (window.elements?.timer) {
            window.elements.timer.textContent = '20';
            window.elements.timer.style.color = '#fff';
            window.elements.timer.style.animation = '';
        }
        
        // Reset buttons
        window.resetVoteButtons?.();
        
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = false;
        window.gameState.skipToNextRequested = true;
        
        // Show queue screen
        window.showScreen?.('queue');
        
        if (window.gameState.socket && window.gameState.isConnected) {
            if (window.userState.hasSelectedGender) {
                window.gameState.isInQueue = true;
                window.gameState.isInDuel = false;
                window.gameState.currentDuelId = null;
                
                // Enter queue
                window.gameState.socket.emit('enter_queue');
                window.utils?.showNotification('Navbatda', 'Yangi duel qidirilmoqda...');
            } else {
                window.showScreen?.('welcome');
            }
        } else {
            window.showScreen?.('welcome');
        }
    },
    
    /**
     * Return to main menu
     */
    returnToMenu: function() {
        console.log('🏠 Bosh menyuga qaytish');
        
        // Close all modals
        window.hideAllModals?.();
        window.closeChatModal?.();
        
        // Stop all timers
        clearInterval(window.gameState.timerInterval);
        
        // Leave queue
        if (window.gameState.socket && window.gameState.isConnected) {
            window.gameState.socket.emit('leave_queue');
        }
        
        // Reset game state
        window.gameState.isInQueue = false;
        window.gameState.isInDuel = false;
        window.gameState.currentDuelId = null;
        window.gameState.waitingForOpponent = false;
        window.gameState.matchCompleted = false;
        window.gameState.skipToNextRequested = false;
        
        // Reset UI
        if (window.elements?.timer) {
            window.elements.timer.textContent = '20';
            window.elements.timer.style.color = '#fff';
            window.elements.timer.style.animation = '';
        }
        
        // Reset buttons
        window.resetVoteButtons?.();
        
        // Show welcome screen
        window.showScreen?.('welcome');
        
        window.utils?.showNotification('Bosh menyuga qaytildi', 
            'Yana o\'ynash uchun "O\'yinni Boshlash" tugmasini bosing');
    },
    
    // ==================== PROFILE MANAGEMENT ====================
    
    /**
     * Update user stats
     */
    updateStats: function(data) {
        if (data.gender) window.userState.currentGender = data.gender;
        if (data.hasSelectedGender !== undefined) window.userState.hasSelectedGender = data.hasSelectedGender;
        if (data.coins !== undefined) window.userState.coins = data.coins;
        if (data.level !== undefined) window.userState.level = data.level;
        if (data.rating !== undefined) window.userState.rating = data.rating;
        if (data.matches !== undefined) window.userState.matches = data.matches;
        if (data.duels !== undefined) window.userState.duels = data.duels;
        if (data.wins !== undefined) window.userState.wins = data.wins;
        if (data.totalLikes !== undefined) window.userState.totalLikes = data.totalLikes;
        if (data.dailySuperLikes !== undefined) window.userState.dailySuperLikes = data.dailySuperLikes;
        if (data.bio !== undefined) window.userState.bio = data.bio;
        if (data.filter !== undefined) window.userState.filter = data.filter;
        if (data.mutualMatchesCount !== undefined) window.userState.mutualMatchesCount = data.mutualMatchesCount;
        if (data.friendsCount !== undefined) window.userState.friendsCount = data.friendsCount;
        
        window.storage?.saveUserState?.();
        window.updateUIFromUserState?.();
    }
};

// Export to global scope
window.gameLogic = GameLogic;