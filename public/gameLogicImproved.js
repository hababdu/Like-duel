// gameLogicImproved.js faylini yarating
class ImprovedGameLogic {
    constructor() {
        this.voteLock = false;
        this.autoQueueDelay = 3000; // 3 seconds
        this.matchCooldown = 5000; // 5 seconds
    }
    
    // Fixed handleVote with better error handling
    async handleVote(choice) {
        console.log('🗳️ Improved vote handling:', choice);
        
        // Check if we can vote
        if (this.voteLock) {
            console.log('⚠️ Vote lock active, skipping');
            return false;
        }
        
        if (!window.gameStateManager.getState().isInDuel) {
            console.error('❌ Not in duel');
            window.showNotification?.('Xato', 'Siz duelda emassiz');
            return false;
        }
        
        const duelId = window.gameStateManager.getState().currentDuelId;
        if (!duelId) {
            console.error('❌ No duel ID');
            return false;
        }
        
        // Lock voting
        this.voteLock = true;
        
        try {
            // Disable buttons
            this.disableVoteButtons();
            
            // Update status
            window.updateDuelStatus?.(`Siz ${this.getChoiceText(choice)} berdingiz...`);
            
            // Send vote through socket
            if (window.socketManager && window.socketManager.sendVote) {
                const success = await window.socketManager.sendVote(duelId, choice);
                
                if (!success) {
                    throw new Error('Vote sending failed');
                }
                
                // Update super like count
                if (choice === 'super_like' && window.userState.dailySuperLikes > 0) {
                    window.userState.dailySuperLikes--;
                    window.updateUIFromUserState?.();
                    
                    // Update quests
                    window.questSystem?.updateProgress?.('superlikes', 1);
                }
                
                // Update quests
                if (choice === 'like' || choice === 'super_like') {
                    window.questSystem?.updateProgress?.('likes', 1);
                }
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Vote error:', error);
            
            // Re-enable buttons on error
            this.enableVoteButtons();
            this.voteLock = false;
            
            window.showNotification?.('Xato', 'Ovoz yuborib bo\'lmadi');
            return false;
        }
    }
    
    // Improved match handling
    async handleMatch(data) {
        console.log('🎉 Improved match handling:', data);
        
        try {
            // 1. State transition
            window.gameStateManager.transitionToMatch(data.partner || data.opponent);
            
            // 2. Stop all timers
            window.gameStateManager.clearTimers();
            
            // 3. Update user stats
            this.updateMatchStats(data);
            
            // 4. Update quests
            window.questSystem?.updateProgress?.('matches', 1);
            window.questSystem?.updateProgress?.('friends', 1);
            
            // 5. Check achievements
            window.achievementSystem?.checkAchievements?.('first_match', 1);
            window.achievementSystem?.checkAchievements?.('friends_5', window.userState.friendsCount);
            
            // 6. Show match screen with delay for better UX
            setTimeout(() => {
                this.showEnhancedMatchScreen(data);
            }, 500);
            
            // 7. Game stats
            window.gameStateManager.updateGameStats('match', data);
            
            return true;
            
        } catch (error) {
            console.error('❌ Match handling error:', error);
            return false;
        }
    }
    
    showEnhancedMatchScreen(data) {
        console.log('🎮 Enhanced match screen');
        
        // Hide duel UI
        this.hideDuelUI();
        
        // Create enhanced match screen
        const matchScreenHTML = `
            <div class="enhanced-match-screen">
                <!-- Celebration particles -->
                <div class="celebration-particles"></div>
                
                <!-- Main content -->
                <div class="match-content">
                    <div class="match-header">
                        <div class="match-title">
                            <span class="title-text">🎉 MATCH!</span>
                            <span class="title-sparkle">✨</span>
                        </div>
                        <div class="match-subtitle">
                            O'zaro like bosdingiz!
                        </div>
                    </div>
                    
                    <div class="partner-info">
                        <div class="partner-avatar-container">
                            <img src="${data.partner?.photo || data.opponent?.photo}" 
                                 class="partner-avatar"
                                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(data.partner?.name || 'User')}&background=667eea&color=fff'">
                            <div class="avatar-ring"></div>
                            <div class="avatar-sparkles">
                                <div class="sparkle"></div>
                                <div class="sparkle"></div>
                                <div class="sparkle"></div>
                            </div>
                        </div>
                        
                        <div class="partner-details">
                            <div class="partner-name">
                                ${data.partner?.name || data.opponent?.name}
                                <span class="partner-badge">🤝</span>
                            </div>
                            <div class="partner-username">
                                @${data.partner?.username || data.opponent?.username}
                            </div>
                            <div class="partner-rating">
                                <i class="fas fa-trophy"></i> 
                                ${data.partner?.rating || data.opponent?.rating} reyting
                            </div>
                        </div>
                    </div>
                    
                    <!-- Rewards with animation -->
                    <div class="match-rewards">
                        <div class="rewards-title">
                            <i class="fas fa-gift"></i> Sizning mukofotlaringiz
                        </div>
                        <div class="rewards-grid">
                            <div class="reward-item coin-reward">
                                <div class="reward-icon">💰</div>
                                <div class="reward-info">
                                    <div class="reward-value">+${data.coinsEarned || 50}</div>
                                    <div class="reward-label">Tanga</div>
                                </div>
                            </div>
                            <div class="reward-item xp-reward">
                                <div class="reward-icon">⭐</div>
                                <div class="reward-info">
                                    <div class="reward-value">+${data.xpEarned || 30}</div>
                                    <div class="reward-label">XP</div>
                                </div>
                            </div>
                            <div class="reward-item friend-reward">
                                <div class="reward-icon">🤝</div>
                                <div class="reward-info">
                                    <div class="reward-value">+1</div>
                                    <div class="reward-label">Do'st</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action buttons -->
                    <div class="match-actions">
                        <button class="action-btn chat-action" id="enhancedChatBtn">
                            <div class="btn-icon">💬</div>
                            <div class="btn-text">
                                <div class="btn-main">CHAT QILISH</div>
                                <div class="btn-sub">Taklif yuborish</div>
                            </div>
                        </button>
                        
                        <button class="action-btn next-action" id="enhancedNextBtn">
                            <div class="btn-icon">🎮</div>
                            <div class="btn-text">
                                <div class="btn-main">KEYINGI DUEL</div>
                                <div class="btn-sub">Chat qilmasdan</div>
                            </div>
                        </button>
                    </div>
                    
                    <!-- Stats info -->
                    <div class="match-stats">
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-users"></i></div>
                            <div class="stat-info">
                                <div class="stat-value">${window.userState.friendsCount + 1}</div>
                                <div class="stat-label">Jami do'stlar</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon"><i class="fas fa-heart"></i></div>
                            <div class="stat-info">
                                <div class="stat-value">${window.userState.matches + 1}</div>
                                <div class="stat-label">Jami match</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Continue suggestion -->
                <div class="continue-suggestion">
                    <p>
                        <i class="fas fa-lightbulb"></i>
                        Do'stingiz bilan chat qilib, keyin yangi duel o'ynashingiz mumkin!
                    </p>
                </div>
            </div>
        `;
        
        // Insert into container
        const container = document.querySelector('.duel-container');
        if (container) {
            container.innerHTML = matchScreenHTML;
            
            // Add event listeners
            document.getElementById('enhancedChatBtn')?.addEventListener('click', () => {
                this.startChatInvite(data);
            });
            
            document.getElementById('enhancedNextBtn')?.addEventListener('click', () => {
                this.proceedToNextDuel();
            });
            
            // Start celebration animation
            this.startCelebration();
        }
    }
    
    startCelebration() {
        // Confetti
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.3 }
        });
        
        // Additional effects after delay
        setTimeout(() => {
            confetti({
                particleCount: 100,
                angle: 60,
                spread: 80,
                origin: { x: 0 }
            });
            
            confetti({
                particleCount: 100,
                angle: 120,
                spread: 80,
                origin: { x: 1 }
            });
        }, 300);
    }
    
    // Improved proceedToNextDuel
    async proceedToNextDuel() {
        console.log('🔄 Improved proceed to next duel');
        
        // Check if already processing
        if (window.gameStateManager.getState().isProcessing) {
            console.log('⚠️ Already processing, skipping');
            return;
        }
        
        window.gameStateManager.state.isProcessing = true;
        
        try {
            // 1. Cleanup current state
            this.cleanupCurrentDuel();
            
            // 2. Reset UI
            this.resetDuelUI();
            
            // 3. Show queue screen
            window.showScreen?.('queue');
            window.updateQueueStatus?.('Yangi duel izlanmoqda...');
            
            // 4. Enter queue after delay
            setTimeout(() => {
                if (window.socketManager) {
                    window.socketManager.enterQueue();
                }
                window.gameStateManager.state.isProcessing = false;
            }, this.autoQueueDelay);
            
        } catch (error) {
            console.error('❌ Proceed to next duel error:', error);
            window.gameStateManager.state.isProcessing = false;
            
            // Fallback to welcome screen
            window.showScreen?.('welcome');
        }
    }
    
    cleanupCurrentDuel() {
        // Clear all timers
        window.gameStateManager.clearTimers();
        
        // Reset state
        window.gameStateManager.reset();
        
        // Clear any pending chat invites
        if (window.enhancedChatSystem) {
            window.enhancedChatSystem.cancelVoiceChat();
        }
        
        // Remove any modals
        const modals = document.querySelectorAll('.modal, .chat-modal');
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        
        // Unlock voting
        this.voteLock = false;
    }
    
    // Improved duel initialization
    async initializeDuel(duelData) {
        console.log('⚔️ Improved duel initialization:', duelData);
        
        try {
            // State transition
            window.gameStateManager.transitionToDuel(duelData.duelId);
            
            // Update opponent UI
            this.updateOpponentUI(duelData.opponent);
            
            // Start timer
            window.gameStateManager.startTimer(20);
            
            // Enable vote buttons
            this.enableVoteButtons();
            
            // Show duel screen
            window.showScreen?.('duel');
            
            // Update status
            window.updateDuelStatus?.('Raqibingizni baholang...');
            
            // Play sound
            this.playDuelStartSound();
            
            return true;
            
        } catch (error) {
            console.error('❌ Duel initialization error:', error);
            return false;
        }
    }
    
    updateOpponentUI(opponent) {
        const elements = window.elements;
        
        if (!elements) return;
        
        // Avatar
        if (elements.opponentAvatar) {
            elements.opponentAvatar.src = opponent.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name)}&background=e74c3c&color=fff`;
            elements.opponentAvatar.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(opponent.name)}&background=e74c3c&color=fff`;
            };
        }
        
        // Name and username
        if (elements.opponentName) {
            elements.opponentName.textContent = opponent.name || 'Foydalanuvchi';
        }
        
        if (elements.opponentUsername) {
            elements.opponentUsername.textContent = opponent.username ? 
                `@${opponent.username}` : '';
        }
        
        // Stats
        if (elements.opponentRating) {
            elements.opponentRating.textContent = opponent.rating || 1500;
        }
        
        if (elements.opponentMatches) {
            elements.opponentMatches.textContent = opponent.matches || 0;
        }
        
        if (elements.opponentLevel) {
            elements.opponentLevel.textContent = opponent.level || 1;
        }
    }
    
    playDuelStartSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 523.25; // C5
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
        } catch (e) {
            console.log('Audio context not available');
        }
    }
    
    // Helper methods
    disableVoteButtons() {
        ['likeBtn', 'superLikeBtn', 'noBtn'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.style.transform = 'scale(0.95)';
            }
        });
    }
    
    enableVoteButtons() {
        ['likeBtn', 'superLikeBtn', 'noBtn'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.style.transform = 'scale(1)';
            }
        });
    }
    
    hideDuelUI() {
        const elements = [
            'opponentAvatar', 'opponentName', 'opponentUsername',
            'opponentRating', 'opponentMatches', 'opponentLevel',
            'timer', 'voteButtons'
        ];
        
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.opacity = '0';
                element.style.transition = 'opacity 0.3s ease';
            }
        });
        
        // Hide status after delay
        setTimeout(() => {
            const duelStatus = document.getElementById('duelStatus');
            if (duelStatus) {
                duelStatus.style.opacity = '0';
            }
        }, 500);
    }
    
    resetDuelUI() {
        const elements = [
            'opponentAvatar', 'opponentName', 'opponentUsername',
            'opponentRating', 'opponentMatches', 'opponentLevel',
            'timer', 'duelStatus', 'voteButtons'
        ];
        
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.opacity = '1';
                element.style.transition = 'opacity 0.3s ease';
            }
        });
        
        // Reset timer
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = '20';
            timerElement.style.color = '#2ecc71';
        }
        
        // Reset status
        const duelStatus = document.getElementById('duelStatus');
        if (duelStatus) {
            duelStatus.textContent = 'Raqibingizni baholang...';
            duelStatus.style.color = '#ccc';
        }
    }
    
    getChoiceText(choice) {
        const choices = {
            'like': '❤️ LIKE',
            'super_like': '💖 SUPER LIKE',
            'skip': '✖ PASS',
            'pass': '✖ PASS',
            'no': '✖ PASS'
        };
        
        return choices[choice] || choice;
    }
    
    updateMatchStats(data) {
        // Basic stats
        window.userState.matches++;
        window.userState.duels++;
        window.userState.wins++;
        window.userState.totalLikes++;
        window.userState.mutualMatchesCount++;
        window.userState.friendsCount++;
        
        // Coins and rating from data
        if (data.coinsEarned) {
            window.userState.coins += data.coinsEarned;
        } else {
            window.userState.coins += 50; // Default reward
        }
        
        if (data.ratingChange) {
            window.userState.rating += data.ratingChange;
        } else {
            window.userState.rating += 15; // Default rating increase
        }
        
        // XP gain
        window.userState.xp = (window.userState.xp || 0) + 30;
        
        // Save and update UI
        localStorage.setItem('userState', JSON.stringify(window.userState));
        window.updateUIFromUserState?.();
        
        // Update achievements
        window.achievementSystem?.checkAchievements?.('rating_2000', window.userState.rating);
    }
}

window.improvedGameLogic = new ImprovedGameLogic();