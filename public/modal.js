// ==================== MODAL MANAGEMENT ====================

const ModalManager = {
    // ==================== GENDER MODAL ====================
    
    /**
     * Initialize gender modal event listeners
     */
    initGenderModal: function() {
        console.log('🎯 Gender modal event listenerlar o\'rnatilmoqda...');
        
        // Gender tanlash tugmalari
        const genderButtons = {
            male: document.getElementById('selectMaleBtn'),
            female: document.getElementById('selectFemaleBtn'),
            all: document.getElementById('selectAllBtn')
        };
        
        // Tugmalarga click event qo'shish
        Object.entries(genderButtons).forEach(([gender, button]) => {
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`🎯 Gender tanlash: ${gender}`);
                    this.selectGender(gender);
                });
            } else {
                console.error(`❌ Gender tugmasi topilmadi: ${gender}`);
            }
        });
        
        // Queue ekranidagi gender tanlash tugmasi
        const selectGenderNowBtn = document.getElementById('selectGenderNowBtn');
        if (selectGenderNowBtn) {
            selectGenderNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Queue ekranida gender tanlash tugmasi bosildi');
                this.showGenderModal(true);
            });
        } else {
            console.error('❌ selectGenderNowBtn topilmadi');
        }
        
        console.log('✅ Gender modal event listenerlar o\'rnatildi');
    },
    
    /**
     * Select gender
     */
    selectGender: function(gender) {
        console.log(`🎯 Gender tanlash: ${gender}`);
        
        // Convert gender to server format
        let serverGender = gender;
        if (gender === 'all') {
            serverGender = 'not_specified';
        }
        
        // Update user state
        window.userState.currentGender = serverGender;
        window.userState.hasSelectedGender = true;
        window.userState.filter = this.getFilterFromGender(serverGender);
        
        // Save to storage
        window.storage?.saveUserState?.();
        
        // Update UI
        window.uiManager?.updateUIFromUserState?.();
        
        // Hide modal
        this.hideGenderModal();
        
        // Send to server
        if (window.gameState?.socket && window.gameState?.isConnected) {
            window.gameState.socket.emit('select_gender', { 
                gender: serverGender 
            });
        } else {
            console.log('⚠️ Socket ulanmagan, gender tanlash serverga yuborilmadi');
        }
        
        // Show notification
        window.utils?.showNotification('🎉 Jins tanlandi', 
            serverGender === 'male' ? 'Faqat ayollar bilan duel!' : 
            serverGender === 'female' ? 'Faqat erkaklar bilan duel!' : 
            'Hamma bilan duel!');
        
        // Auto connect to queue
        setTimeout(() => {
            if (window.gameState?.socket && window.gameState?.isConnected) {
                window.gameState.isInQueue = true;
                window.gameState.socket.emit('enter_queue');
                window.uiManager?.showScreen?.('queue');
                console.log('🔄 Gender tanlagandan keyin avtomatik navbatga kirdi');
            }
        }, 1000);
    },
    
    /**
     * Get filter from gender
     */
    getFilterFromGender: function(gender) {
        if (gender === 'male') {
            return 'female'; // Erkak faqat ayollar bilan
        } else if (gender === 'female') {
            return 'male'; // Ayol faqat erkaklar bilan
        } else {
            return 'not_specified'; // Hammasi
        }
    },
    
    /**
     * Show gender modal
     */
    showGenderModal: function(mandatory = true) {
        console.log(`🎯 Gender modali ko'rsatilmoqda (majburiy: ${mandatory})`);
        
        const modal = document.getElementById('genderModal');
        const warning = document.getElementById('genderWarning');
        
        if (!modal) {
            console.error('❌ Gender modal elementi topilmadi');
            return;
        }
        
        modal.classList.add('active');
        document.body.classList.add('modal-open'); // Scrollni block qilish
        
        if (mandatory && warning) {
            warning.classList.remove('hidden');
        }
        
        // Background click yopish uchun event listener qo'shamiz
        modal.addEventListener('click', this.handleModalBackgroundClick);
        
        // Escape key yopish
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                if (!mandatory || window.userState.hasSelectedGender) {
                    this.hideGenderModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        console.log('✅ Gender modal ko\'rsatildi');
    },
    
    /**
     * Handle modal background click
     */
    handleModalBackgroundClick: function(e) {
        console.log('🎯 Modal background click');
        
        if (e.target.id === 'genderModal' || e.target.classList.contains('gender-modal')) {
            console.log('🎯 Gender modal background bosildi');
            
            if (window.userState.hasSelectedGender) {
                window.modalManager?.hideGenderModal?.();
            } else {
                window.utils?.showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
            }
        }
    },
    
    /**
     * Hide gender modal
     */
    hideGenderModal: function() {
        console.log('🎯 Gender modali yopilmoqda');
        
        const modal = document.getElementById('genderModal');
        const warning = document.getElementById('genderWarning');
        
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open'); // Scrollni qayta yoqish
            modal.removeEventListener('click', this.handleModalBackgroundClick);
            console.log('✅ Gender modal yopildi');
        } else {
            console.error('❌ Gender modal elementi topilmadi yopishda');
        }
        
        if (warning) {
            warning.classList.add('hidden');
        }
        
        // Enable start button if needed
        const startBtn = document.getElementById('startBtn');
        if (startBtn && window.userState.hasSelectedGender) {
            startBtn.disabled = false;
            startBtn.textContent = '🎮 O\'yinni Boshlash';
            startBtn.classList.remove('disabled');
        }
    },
    
    // ==================== CHAT MODAL ====================
    
    /**
     * Initialize chat modal event listeners
     */
    initChatModal: function() {
        console.log('🎯 Chat modal event listenerlar o\'rnatilmoqda...');
        
        const closeChatBtn = document.getElementById('closeChatBtn');
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideChatModal();
            });
        } else {
            console.error('❌ closeChatBtn topilmadi');
        }
        
        const chatOpenTelegramBtn = document.getElementById('chatOpenTelegramBtn');
        if (chatOpenTelegramBtn) {
            chatOpenTelegramBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openTelegramChatFromModal();
            });
        } else {
            console.error('❌ chatOpenTelegramBtn topilmadi');
        }
        
        console.log('✅ Chat modal event listenerlar o\'rnatildi');
    },
    
    /**
     * Show chat modal
     */
    showChatModal: function(partner) {
        if (!partner) {
            console.error('❌ Chat modal uchun partner ma\'lumotlari yo\'q');
            return;
        }
        
        console.log('🎯 Chat modali ko\'rsatilmoqda:', partner.name);
        
        window.gameState.isChatModalOpen = true;
        
        const modal = document.getElementById('chatModal');
        const avatar = document.getElementById('chatPartnerAvatar');
        const name = document.getElementById('chatPartnerName');
        const username = document.getElementById('chatUsername');
        const title = document.getElementById('chatTitle');
        
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open'); // Scrollni block qilish
            
            // Background click yopish
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('chat-modal')) {
                    console.log('🎯 Chat modal background bosildi');
                    this.hideChatModal();
                }
            });
            
            // Escape key yopish
            const escapeHandler = (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.hideChatModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
        
        if (avatar) avatar.src = partner.photo || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=3498db&color=fff`;
        if (name) name.textContent = partner.name;
        if (username) username.textContent = partner.username ? `@${partner.username}` : '';
        if (title) title.textContent = `${partner.name} bilan chat`;
        
        console.log('✅ Chat modal ko\'rsatildi');
    },
    
    /**
     * Hide chat modal
     */
    hideChatModal: function() {
        console.log('🎯 Chat modali yopilmoqda');
        
        window.gameState.isChatModalOpen = false;
        const modal = document.getElementById('chatModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open'); // Scrollni qayta yoqish
            console.log('✅ Chat modal yopildi');
        } else {
            console.error('❌ Chat modal elementi topilmadi yopishda');
        }
        
        // Return to appropriate screen
        if (window.gameState.currentPartner) {
            window.uiManager?.showScreen?.('match');
        } else {
            window.uiManager?.showScreen?.('welcome');
        }
    },
    
    /**
     * Open Telegram chat from modal
     */
    openTelegramChatFromModal: function() {
        const username = document.getElementById('chatUsername')?.textContent?.replace('@', '');
        
        if (username && username !== '') {
            const telegramUrl = `https://t.me/${username}`;
            
            if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
                Telegram.WebApp.openTelegramLink(telegramUrl);
            } else {
                window.open(telegramUrl, '_blank');
            }
            
            // Chatni yopish
            setTimeout(() => {
                this.hideChatModal();
            }, 500);
        } else {
            window.utils?.showNotification('Xato', 'Bu foydalanuvchining Telegram username\'i mavjud emas');
        }
    },
    
    // ==================== PROFILE EDIT MODAL ====================
    
    /**
     * Initialize profile edit modal
     */
    initProfileEditModal: function() {
        console.log('🎯 Profile edit modal event listenerlar o\'rnatilmoqda...');
        
        const editProfileBtn = document.getElementById('editProfileBtn');
        const closeProfileEditBtn = document.getElementById('closeProfileEditBtn');
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showProfileEditModal();
            });
        } else {
            console.error('❌ editProfileBtn topilmadi');
        }
        
        if (closeProfileEditBtn) {
            closeProfileEditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideProfileEditModal();
            });
        } else {
            console.error('❌ closeProfileEditBtn topilmadi');
        }
        
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveProfile();
            });
        } else {
            console.error('❌ saveProfileBtn topilmadi');
        }
        
        console.log('✅ Profile edit modal event listenerlar o\'rnatildi');
    },
    
    /**
     * Show profile edit modal
     */
    showProfileEditModal: function() {
        console.log('🎯 Profile edit modali ko\'rsatilmoqda');
        
        const modal = document.getElementById('profileEditModal');
        const bio = document.getElementById('editBio');
        const gender = document.getElementById('editGender');
        const filter = document.getElementById('editFilter');
        
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open'); // Scrollni block qilish
            
            // Background click yopish
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('chat-modal')) {
                    console.log('🎯 Profile edit modal background bosildi');
                    this.hideProfileEditModal();
                }
            });
            
            // Escape key yopish
            const escapeHandler = (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.hideProfileEditModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
        
        if (bio) bio.value = window.userState.bio || '';
        if (gender) gender.value = window.userState.currentGender || 'not_specified';
        if (filter) filter.value = window.userState.filter || 'not_specified';
        
        console.log('✅ Profile edit modal ko\'rsatildi');
    },
    
    /**
     * Hide profile edit modal
     */
    hideProfileEditModal: function() {
        console.log('🎯 Profile edit modali yopilmoqda');
        
        const modal = document.getElementById('profileEditModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open'); // Scrollni qayta yoqish
            console.log('✅ Profile edit modal yopildi');
        } else {
            console.error('❌ Profile edit modal elementi topilmadi yopishda');
        }
    },
    
    /**
     * Save profile
     */
    saveProfile: function() {
        console.log('🎯 Profil saqlanmoqda...');
        
        const bio = document.getElementById('editBio')?.value.trim() || '';
        const gender = document.getElementById('editGender')?.value || 'not_specified';
        const filter = document.getElementById('editFilter')?.value || 'not_specified';
        
        // Update user state
        window.userState.bio = bio;
        window.userState.currentGender = gender;
        window.userState.filter = filter;
        window.userState.hasSelectedGender = true; // Profilni tahrirlash gender tanlangan deb hisoblanadi
        
        // Save to storage
        window.storage?.saveUserState?.();
        
        // Update UI
        window.uiManager?.updateUIFromUserState?.();
        
        // Update specific elements
        if (window.elements?.profileBio) {
            window.elements.profileBio.textContent = bio || 'Bio kiritilmagan';
        }
        
        // Add gender badge
        if (window.elements?.profileName && gender !== 'not_specified') {
            window.uiManager?.addGenderBadge?.(window.elements.profileName, gender);
        }
        
        // Send to server
        if (window.gameState?.socket && window.gameState?.isConnected) {
            window.gameState.socket.emit('update_profile', {
                bio: bio,
                gender: gender,
                filter: filter
            });
        }
        
        // Hide modal
        this.hideProfileEditModal();
        
        // Show notification
        window.utils?.showNotification('✅ Profil yangilandi', 'O\'zgarishlar muvaffaqiyatli saqlandi');
    },
    
    // ==================== OTHER MODALS ====================
    
    /**
     * Hide all modals
     */
    hideAllModals: function() {
        console.log('🎯 Barcha modallar yopilmoqda');
        
        this.hideGenderModal();
        this.hideChatModal();
        this.hideProfileEditModal();
        
        // Hide other modals if they exist
        const modals = document.querySelectorAll('.modal.active, .chat-modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Restore scroll
        document.body.classList.remove('modal-open');
        
        console.log('✅ Barcha modallar yopildi');
    },
    
    /**
     * Initialize all modals
     */
    initAllModals: function() {
        console.log('🎯 Barcha modallar o\'rnatilmoqda...');
        
        this.initGenderModal();
        this.initChatModal();
        this.initProfileEditModal();
        
        console.log('✅ Barcha modallar o\'rnatildi');
    }
};

// Export to global scope
window.modalManager = ModalManager;