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
     * Handle match result (with chat invitation)
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
        
        // Match variantlarini yaratish (CHAT INVITE bilan)
        this.createMatchOptions(data.partner, data.chatInviteEnabled, data.message);
        
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
     * Create match options (with chat invitation)
     */
    createMatchOptions: function(partner, chatInviteEnabled = false, message = '') {
        console.log(`🎮 Match variantlari yaratilmoqda (chat taklifi: ${chatInviteEnabled})`);
        
        const options = [];
        
        if (chatInviteEnabled && partner.online !== false) {
            // Chat taklifi qilish tugmasi
            options.push({
                text: '💬 Chat taklifi yuborish',
                color: '#3498db',
                action: () => this.sendChatInvite(partner),
                note: 'Ikkalangiz ham rozilik bersangiz, chat ochiladi'
            });
        }
        
        // Standart tugmalar
        options.push(
            {
                text: '➡️ Yangi duel',
                color: '#2ecc71',
                action: () => window.showNextDuelConfirmModal?.(partner)
            },
            {
                text: '🏠 Bosh menyu',
                color: '#e74c3c',
                action: () => window.returnToMenu?.()
            }
        );
        
        // UI ga joylash
        if (window.elements?.matchOptions) {
            let optionsHTML = '';
            
            if (message) {
                optionsHTML += `
                    <div style="background: rgba(52, 152, 219, 0.1); border: 1px solid rgba(52, 152, 219, 0.3); 
                           border-radius: 15px; padding: 15px; margin-bottom: 20px;">
                        <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i> ${message}
                        </p>
                    </div>
                `;
            }
            
            optionsHTML += options.map(opt => `
                <button class="match-option-btn" 
                        onclick="${opt.action.toString()}"
                        style="background: linear-gradient(135deg, ${opt.color} 0%, ${this.darkenColor(opt.color, 20)} 100%);">
                    ${opt.text}
                </button>
            `).join('');
            
            window.elements.matchOptions.innerHTML = optionsHTML;
        }
        
        console.log(`✅ ${options.length} ta match variantlari yaratildi`);
    },
    
    /**
     * Darken color for gradient
     */
    darkenColor: function(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                     (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                     (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    },
    
    /**
     * Send chat invitation
     */
    sendChatInvite: function(partner) {
        console.log(`💬 Chat taklifi yuborilmoqda: ${partner.name}`);
        
        if (!window.gameState.socket || !window.gameState.isConnected) {
            window.utils?.showNotification('Xato', 'Serverga ulanilmagan');
            return;
        }
        
        if (!partner.online) {
            window.utils?.showNotification('Raqib offline', `${partner.name} hozir online emas. Chat taklifini keyinroq yuboring.`);
            return;
        }
        
        // Serverga chat taklifi yuborish
        window.gameState.socket.emit('send_chat_invite', {
            partnerId: partner.id
        });
        
        // UI yangilash
        window.elements.matchOptions.innerHTML = `
            <div style="background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.3); 
                   border-radius: 15px; padding: 20px; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                <div style="color: #fff; font-weight: bold; margin-bottom: 10px;">
                    Chat taklifi yuborildi
                </div>
                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">
                    ${partner.name} taklifingizni kutmoqda...
                </div>
                <div style="color: #f1c40f; font-size: 0.8rem;">
                    <i class="fas fa-info-circle"></i> 
                    Agar ${partner.name} taklifingizni qabul qilsa, chat ochiladi
                </div>
            </div>
        `;
        
        console.log(`✅ ${partner.name} ga chat taklifi yuborildi`);
    },
    
    /**
     * Handle chat invitation received
     */
    handleChatInvite: function(data) {
        console.log(`💬 Chat taklifi olindi: ${data.fromUserName}`);
        
        // Modal yaratish
        const modalHTML = `
            <div class="modal active" id="chatInviteModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="color: #fff;">💬 Chat Taklifi</h3>
                    </div>
                    <div class="modal-body" style="text-align: center;">
                        <img src="${data.fromUserPhoto}" 
                             style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #3498db; margin-bottom: 15px;">
                        <div style="color: #fff; font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">
                            ${data.fromUserName}
                        </div>
                        <div style="color: #ccc; margin-bottom: 20px;">
                            ${data.message || 'Siz bilan chat qilishni taklif qildi!'}
                        </div>
                        <div style="background: rgba(52, 152, 219, 0.1); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                            <div style="color: #fff; font-weight: bold; margin-bottom: 5px;">
                                <i class="fas fa-info-circle"></i> Chat qanday ishlaydi?
                            </div>
                            <div style="color: #ccc; font-size: 0.8rem;">
                                • Ikkalangiz ham rozilik bersangiz, chat ochiladi<br>
                                • Telegram username orqali suhbatlashingiz mumkin<br>
                                • Match bo'lganingiz uchun endi do'stsiz!
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn cancel-btn" 
                                onclick="window.gameLogic?.rejectChatInvite('${data.requestId}')"
                                style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">
                            ❌ Rad etish
                        </button>
                        <button class="modal-btn confirm-btn" 
                                onclick="window.gameLogic?.acceptChatInvite('${data.requestId}')"
                                style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);">
                            ✅ Qabul qilish
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        window.showModal?.(modalHTML);
    },
    
    /**
     * Accept chat invitation
     */
    acceptChatInvite: function(requestId) {
        console.log(`✅ Chat taklifini qabul qilish: ${requestId}`);
        
        if (!window.gameState.socket || !window.gameState.isConnected) {
            window.utils?.showNotification('Xato', 'Serverga ulanilmagan');
            return;
        }
        
        // Serverga qabul qilish haqida xabar yuborish
        window.gameState.socket.emit('accept_chat_invite', {
            requestId: requestId
        });
        
        // Modalni yopish
        const modal = document.getElementById('chatInviteModal');
        if (modal) modal.remove();
        
        // Xabar ko'rsatish
        window.utils?.showNotification('✅ Chat taklifi qabul qilindi', 
            'Endi siz do\'st bilan suhbatlashingiz mumkin!');
        
        // Chat modalini ochish
        setTimeout(() => {
            if (window.gameState.currentPartner) {
                window.openChat?.(window.gameState.currentPartner);
            }
        }, 1000);
    },
    
    /**
     * Reject chat invitation
     */
    rejectChatInvite: function(requestId) {
        console.log(`❌ Chat taklifini rad etish: ${requestId}`);
        
        if (!window.gameState.socket || !window.gameState.isConnected) {
            window.utils?.showNotification('Xato', 'Serverga ulanilmagan');
            return;
        }
        
        // Serverga rad etish haqida xabar yuborish
        window.gameState.socket.emit('reject_chat_invite', {
            requestId: requestId
        });
        
        // Modalni yopish
        const modal = document.getElementById('chatInviteModal');
        if (modal) modal.remove();
        
        // Xabar ko'rsatish
        window.utils?.showNotification('Chat taklifi rad etildi', 
            'Siz chat taklifini rad etdingiz');
    },
    
    /**
     * Handle chat accepted (both sides)
     */
    handleChatAccepted: function(data) {
        console.log(`✅ Chat qabul qilindi: ${data.partnerName}`);
        
        // Modalni yopish (agar ochiq bo'lsa)
        const modal = document.getElementById('chatInviteModal');
        if (modal) modal.remove();
        
        // Do'stlar ro'yxatini yangilash
        if (window.uiManager) {
            window.uiManager.loadFriendsList();
        }
        
        // Xabar ko'rsatish
        window.utils?.showNotification('🎉 Chat ochildi!', 
            `${data.partnerName} bilan endi suhbatlashingiz mumkin!`);
        
        // Avtomatik chat modalini ochish
        setTimeout(() => {
            const partner = {
                id: data.partnerId,
                name: data.partnerName,
                username: data.partnerUsername,
                photo: data.partnerPhoto
            };
            window.openChat?.(partner);
        }, 1500);
    },
    
    /**
     * Handle chat rejected
     */
    handleChatRejected: function(data) {
        console.log(`❌ Chat rad etildi: ${data.partnerName}`);
        
        // Modalni yopish (agar ochiq bo'lsa)
        const modal = document.getElementById('chatInviteModal');
        if (modal) modal.remove();
        
        // Xabar ko'rsatish
        window.utils?.showNotification('Chat rad etildi', 
            `${data.partnerName} sizning chat taklifingizni rad etdi`);
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
        
        // Chat functions
        window.sendChatInvite = (partner) => this.sendChatInvite(partner);
        window.acceptChatInvite = (requestId) => this.acceptChatInvite(requestId);
        window.rejectChatInvite = (requestId) => this.rejectChatInvite(requestId);
        
        // Event handlers
        window.handleMatch = (data) => this.handleMatch(data);
        window.handleLikedOnly = (data) => this.handleLikedOnly(data);
        window.handleNoMatch = (data) => this.handleNoMatch(data);
        window.handleTimeout = (data) => this.handleTimeout(data);
        window.handleWaitingResponse = (data) => this.handleWaitingResponse(data);
        window.handleOpponentVotedFirst = () => this.handleOpponentVotedFirst();
        window.handleChatInvite = (data) => this.handleChatInvite(data);
        window.handleChatAccepted = (data) => this.handleChatAccepted(data);
        window.handleChatRejected = (data) => this.handleChatRejected(data);
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