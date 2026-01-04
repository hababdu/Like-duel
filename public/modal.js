// ==================== MODAL MANAGER ====================
window.modalManager = {
    /**
     * Initialize all modals
     */
    initAllModals: function() {
        console.log('🎯 Modal manager initializing...');
        
        // Gender modal
        this.initGenderModal();
        
        // Profile edit modal
        this.initProfileEditModal();
        
        // Chat modal
        this.initChatModal();
        
        // Dynamic modal container
        this.initModalContainer();
        
        console.log('✅ Modal manager initialized');
    },
    
    /**
     * Initialize gender modal
     */
    initGenderModal: function() {
        console.log('🎯 Gender modal initializing...');
        
        const genderModal = document.getElementById('genderModal');
        if (!genderModal) {
            console.error('❌ Gender modal element not found');
            return;
        }
        
        // Gender options
        const genderOptions = document.querySelectorAll('.gender-option');
        genderOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                genderOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                option.classList.add('active');
                
                const gender = option.getAttribute('data-gender');
                console.log(`🎯 Gender selected: ${gender}`);
                
                // Update UI immediately
                option.querySelector('.gender-check').style.opacity = '1';
            });
        });
        
        // Gender modal open/close (if opened from somewhere else)
        const genderWarning = document.getElementById('genderWarning');
        if (genderWarning) {
            genderWarning.addEventListener('click', () => {
                this.showGenderModal(true);
            });
        }
        
        // Select gender now button
        const selectGenderNowBtn = document.getElementById('selectGenderNowBtn');
        if (selectGenderNowBtn) {
            selectGenderNowBtn.addEventListener('click', () => {
                this.showGenderModal(true);
            });
        }
        
        console.log('✅ Gender modal initialized');
    },
    
    /**
     * Show gender modal
     */
    showGenderModal: function(mandatory = false) {
        console.log(`🎯 Gender modal ko'rsatilmoqda (mandatory: ${mandatory})`);
        
        const genderModal = document.getElementById('genderModal');
        if (!genderModal) {
            console.error('❌ Gender modal element not found');
            return;
        }
        
        // Show modal
        genderModal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // If mandatory, disable close on background click
        if (mandatory) {
            const modalContent = genderModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.pointerEvents = 'auto';
            }
        }
        
        // Background click handler
        const closeOnBackground = (e) => {
            if (e.target === genderModal && !mandatory) {
                this.hideGenderModal();
            }
        };
        
        genderModal.addEventListener('click', closeOnBackground);
        
        // Escape key handler
        const closeOnEscape = (e) => {
            if (e.key === 'Escape' && !mandatory) {
                this.hideGenderModal();
            }
        };
        
        document.addEventListener('keydown', closeOnEscape);
        
        console.log('✅ Gender modal shown');
    },
    
    /**
     * Hide gender modal
     */
    hideGenderModal: function() {
        console.log('🎯 Gender modal yopilmoqda');
        
        const genderModal = document.getElementById('genderModal');
        if (genderModal) {
            genderModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            console.log('✅ Gender modal hidden');
        }
    },
    
    /**
     * Select gender (called from UI)
     */
    selectGender: function(gender) {
        console.log(`🎯 Gender tanlash funksiyasi: ${gender}`);
        
        // Hide modal
        this.hideGenderModal();
        
        // Update UI selection
        const genderOptions = document.querySelectorAll('.gender-option');
        genderOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-gender') === gender) {
                option.classList.add('active');
            }
        });
        
        // Call UI manager to save gender
        if (window.uiManager && window.uiManager.selectGender) {
            window.uiManager.selectGender(gender);
        }
        
        // Show notification
        window.utils?.showNotification?.('Gender Tanlandi', 
            gender === 'male' ? 'Siz erkak sifatida qayd etildingiz' :
            gender === 'female' ? 'Siz ayol sifatida qayd etildingiz' :
            'Siz hamma bilan duel qilishingiz mumkin');
        
        console.log(`✅ Gender selected: ${gender}`);
    },
    
    /**
     * Initialize profile edit modal
     */
    initProfileEditModal: function() {
        console.log('🎯 Profile edit modal initializing...');
        
        const editProfileBtn = document.getElementById('editProfileBtn');
        const closeProfileEditBtn = document.getElementById('closeProfileEditBtn');
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        const profileEditModal = document.getElementById('profileEditModal');
        
        if (!editProfileBtn || !profileEditModal) {
            console.error('❌ Profile edit modal elements not found');
            return;
        }
        
        // Open modal
        editProfileBtn.addEventListener('click', () => {
            this.showProfileEditModal();
        });
        
        // Close modal
        if (closeProfileEditBtn) {
            closeProfileEditBtn.addEventListener('click', () => {
                this.hideProfileEditModal();
            });
        }
        
        // Save profile
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                this.saveProfile();
            });
        }
        
        // Background click to close
        profileEditModal.addEventListener('click', (e) => {
            if (e.target === profileEditModal) {
                this.hideProfileEditModal();
            }
        });
        
        console.log('✅ Profile edit modal initialized');
    },
    
    /**
     * Show profile edit modal
     */
    showProfileEditModal: function() {
        console.log('🎯 Profile edit modal ko\'rsatilmoqda');
        
        const profileEditModal = document.getElementById('profileEditModal');
        if (!profileEditModal) return;
        
        // Load current data
        const editBio = document.getElementById('editBio');
        const editGender = document.getElementById('editGender');
        const editFilter = document.getElementById('editFilter');
        
        if (editBio) editBio.value = window.userState.bio || '';
        if (editGender) editGender.value = window.userState.currentGender || 'not_specified';
        if (editFilter) editFilter.value = window.userState.filter || 'not_specified';
        
        // Show modal
        profileEditModal.classList.add('active');
        document.body.classList.add('modal-open');
        
        console.log('✅ Profile edit modal shown');
    },
    
    /**
     * Hide profile edit modal
     */
    hideProfileEditModal: function() {
        console.log('🎯 Profile edit modal yopilmoqda');
        
        const profileEditModal = document.getElementById('profileEditModal');
        if (profileEditModal) {
            profileEditModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            console.log('✅ Profile edit modal hidden');
        }
    },
    
    /**
     * Save profile
     */
    saveProfile: function() {
        console.log('💾 Profil saqlanmoqda...');
        
        const editBio = document.getElementById('editBio');
        const editGender = document.getElementById('editGender');
        const editFilter = document.getElementById('editFilter');
        
        if (!editBio || !editGender || !editFilter) {
            console.error('❌ Profile edit elements not found');
            return;
        }
        
        // Get values
        const newBio = editBio.value.trim();
        const newGender = editGender.value;
        const newFilter = editFilter.value;
        
        // Update user state
        window.userState.bio = newBio;
        window.userState.currentGender = newGender;
        window.userState.filter = newFilter;
        
        if (newGender !== 'not_specified') {
            window.userState.hasSelectedGender = true;
        }
        
        // Save to storage
        if (window.storage && window.storage.saveUserState) {
            window.storage.saveUserState();
        }
        
        // Send to server
        if (window.socketManager && window.socketManager.updateProfile) {
            window.socketManager.updateProfile({
                bio: newBio,
                gender: newGender,
                filter: newFilter
            });
        }
        
        // Update UI
        if (window.uiManager && window.uiManager.updateUIFromUserState) {
            window.uiManager.updateUIFromUserState();
        }
        
        // Close modal
        this.hideProfileEditModal();
        
        // Show notification
        window.utils?.showNotification?.('Profil Yangilandi', 'Profil muvaffaqiyatli saqlandi');
        
        console.log('✅ Profile saved');
    },
    
    /**
     * Initialize chat modal
     */
    initChatModal: function() {
        console.log('🎯 Chat modal initializing...');
        
        const chatModal = document.getElementById('chatModal');
        const closeChatBtn = document.getElementById('closeChatBtn');
        const chatOpenTelegramBtn = document.getElementById('chatOpenTelegramBtn');
        
        if (!chatModal) {
            console.error('❌ Chat modal element not found');
            return;
        }
        
        // Close modal button
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => {
                this.closeChatModal();
            });
        }
        
        // Open Telegram button
        if (chatOpenTelegramBtn) {
            chatOpenTelegramBtn.addEventListener('click', () => {
                const username = document.getElementById('chatUsername')?.textContent?.replace('@', '') || '';
                if (username) {
                    window.openTelegramChat?.(username);
                }
            });
        }
        
        // Background click to close
        chatModal.addEventListener('click', (e) => {
            if (e.target === chatModal) {
                this.closeChatModal();
            }
        });
        
        console.log('✅ Chat modal initialized');
    },
    
    /**
     * Show chat modal
     */
    showChatModal: function(partner) {
        console.log('💬 Chat modal ko\'rsatilmoqda:', partner);
        
        const chatModal = document.getElementById('chatModal');
        if (!chatModal) {
            console.error('❌ Chat modal element not found');
            return;
        }
        
        // Update modal content
        const chatPartnerAvatar = document.getElementById('chatPartnerAvatar');
        const chatPartnerName = document.getElementById('chatPartnerName');
        const chatUsername = document.getElementById('chatUsername');
        const chatTitle = document.getElementById('chatTitle');
        
        if (chatPartnerAvatar) {
            chatPartnerAvatar.src = partner.photo || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=667eea&color=fff`;
            chatPartnerAvatar.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=667eea&color=fff`;
            };
        }
        
        if (chatPartnerName) {
            chatPartnerName.textContent = partner.name || 'Foydalanuvchi';
        }
        
        if (chatUsername) {
            chatUsername.textContent = '@' + (partner.username || 'username');
        }
        
        if (chatTitle) {
            chatTitle.textContent = `${partner.name} bilan chat`;
        }
        
        // Store partner data for later use
        window.gameState.currentPartner = partner;
        
        // Show modal
        chatModal.classList.add('active');
        document.body.classList.add('modal-open');
        
        console.log('✅ Chat modal shown');
    },
    
    /**
     * Close chat modal
     */
    closeChatModal: function() {
        console.log('❌ Chat modal yopilmoqda');
        
        const chatModal = document.getElementById('chatModal');
        if (chatModal) {
            chatModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            console.log('✅ Chat modal closed');
        }
    },
    
    /**
     * Initialize modal container (for dynamic modals)
     */
    initModalContainer: function() {
        console.log('🎯 Dynamic modal container initializing...');
        
        // Create modal container if it doesn't exist
        let modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modalContainer';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.right = '0';
            modalContainer.style.bottom = '0';
            modalContainer.style.zIndex = '2000';
            modalContainer.style.display = 'none';
            document.body.appendChild(modalContainer);
        }
        
        console.log('✅ Dynamic modal container initialized');
    },
    
    /**
     * Show custom modal
     */
    showCustomModal: function(title, message, buttons = []) {
        console.log('🎯 Custom modal ko\'rsatilmoqda:', title);
        
        const modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) {
            console.error('❌ Modal container not found');
            return;
        }
        
        // Create modal HTML
        let buttonsHTML = '';
        buttons.forEach((btn, index) => {
            buttonsHTML += `
                <button class="modal-btn ${btn.class || ''}" 
                        onclick="${btn.onclick || 'window.modalManager.hideCustomModal()'}"
                        style="${btn.style || ''}">
                    ${btn.icon ? `<i class="${btn.icon}"></i>` : ''}
                    ${btn.text}
                </button>
            `;
        });
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="color: #fff;">${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p style="color: #ccc;">${message}</p>
                    </div>
                    <div class="modal-footer">
                        ${buttonsHTML}
                    </div>
                </div>
            </div>
        `;
        
        // Show modal
        modalContainer.innerHTML = modalHTML;
        modalContainer.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        // Add background click handler
        const modal = modalContainer.querySelector('.modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCustomModal();
                }
            });
        }
        
        console.log('✅ Custom modal shown');
    },
    
    /**
     * Hide custom modal
     */
    hideCustomModal: function() {
        console.log('🎯 Custom modal yopilmoqda');
        
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer) {
            modalContainer.style.display = 'none';
            modalContainer.innerHTML = '';
            document.body.classList.remove('modal-open');
            console.log('✅ Custom modal hidden');
        }
    },
    
    /**
     * Show confirmation modal
     */
    showConfirmModal: function(title, message, onConfirm, onCancel = null) {
        console.log('🎯 Confirmation modal ko\'rsatilmoqda:', title);
        
        this.showCustomModal(title, message, [
            {
                text: 'Bekor qilish',
                class: 'cancel-btn',
                onclick: onCancel ? onCancel.name + '()' : 'window.modalManager.hideCustomModal()',
                style: 'background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);'
            },
            {
                text: 'Tasdiqlash',
                class: 'confirm-btn',
                onclick: onConfirm ? onConfirm.name + '()' : 'window.modalManager.hideCustomModal()',
                style: 'background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);'
            }
        ]);
    },
    
    /**
     * Show error modal
     */
    showErrorModal: function(title, message) {
        console.log('❌ Error modal ko\'rsatilmoqda:', title);
        
        this.showCustomModal(title, message, [
            {
                text: 'OK',
                class: 'confirm-btn',
                onclick: 'window.modalManager.hideCustomModal()',
                style: 'background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);'
            }
        ]);
    },
    
    /**
     * Show success modal
     */
    showSuccessModal: function(title, message) {
        console.log('✅ Success modal ko\'rsatilmoqda:', title);
        
        this.showCustomModal(title, message, [
            {
                text: 'OK',
                class: 'confirm-btn',
                onclick: 'window.modalManager.hideCustomModal()',
                style: 'background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);'
            }
        ]);
    },
    
    /**
     * Show loading modal
     */
    showLoadingModal: function(message = 'Yuklanmoqda...') {
        console.log('⏳ Loading modal ko\'rsatilmoqda');
        
        const modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) return;
        
        const modalHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-body" style="text-align: center; padding: 40px 20px;">
                        <div class="loader" style="margin: 0 auto 20px;"></div>
                        <p style="color: #ccc;">${message}</p>
                    </div>
                </div>
            </div>
        `;
        
        modalContainer.innerHTML = modalHTML;
        modalContainer.style.display = 'flex';
        document.body.classList.add('modal-open');
    },
    
    /**
     * Hide loading modal
     */
    hideLoadingModal: function() {
        console.log('⏳ Loading modal yopilmoqda');
        this.hideCustomModal();
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM yuklandi, Modal Manager ishga tushmoqda...');
    
    // Delay to ensure all elements are loaded
    setTimeout(() => {
        if (window.modalManager && window.modalManager.initAllModals) {
            window.modalManager.initAllModals();
            console.log('✅ Modal Manager to\'liq ishga tushdi');
        }
    }, 1000);
});