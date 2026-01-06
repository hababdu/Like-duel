// public/modal.js - FULL MODAL MANAGER WITH GENDER MODAL FIX
window.modalManager = {
    
    // ==================== INITIALIZATION ====================
    initAllModals: function() {
        console.log('🎯 Modal Manager starting...');
        
        this.initGenderModal();
        this.initProfileEditModal();
        this.initChatModal();
        this.setupGlobalClickHandler();
        
        console.log('✅ Modal Manager ready');
    },
    
    // ==================== GENDER MODAL (FIXED) ====================
    initGenderModal: function() {
        console.log('🎯 Initializing gender modal...');
        
        const modal = document.getElementById('genderModal');
        if (!modal) {
            console.error('❌ Gender modal not found');
            return;
        }
        
        // Gender option buttons
        const genderOptions = document.querySelectorAll('.gender-option');
        genderOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation(); // Modal yopilishiga yo'l qo'ymaslik
                
                const gender = option.dataset.gender;
                const title = option.querySelector('.gender-title').textContent;
                
                console.log(`🎯 Gender selected: ${gender} (${title})`);
                
                // Remove active class from all options
                genderOptions.forEach(opt => opt.classList.remove('active'));
                // Add active to clicked option
                option.classList.add('active');
                
                // Update user state
                window.userState.currentGender = gender;
                window.userState.hasSelectedGender = true;
                window.userState.filter = gender;
                
                // Save to storage
                window.storage?.saveUserState();
                
                // Update UI
                window.uiManager?.updateUIFromUserState();
                
                // Send to server
                if (window.socketManager?.socket?.connected) {
                    window.socketManager.socket.emit('select_gender', { gender: gender });
                }
                
                // Show notification
                window.utils?.showNotification('Gender tanlandi', 
                    gender === 'male' ? 'Erkak tanlandi (faqat ayollar bilan)' :
                    gender === 'female' ? 'Ayol tanlandi (faqat erkaklar bilan)' :
                    'Hamma bilan duel');
                
                // Close modal after delay
                setTimeout(() => {
                    this.hideGenderModal();
                }, 800);
            });
        });
        
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideGenderModal();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.hideGenderModal();
            }
        });
        
        console.log('✅ Gender modal initialized');
    },
    
    showGenderModal: function(mandatory = false) {
        console.log('👁️ Showing gender modal (mandatory:', mandatory, ')');
        
        const modal = document.getElementById('genderModal');
        if (!modal) {
            console.error('❌ Gender modal element not found');
            return;
        }
        
        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // If mandatory, disable background click
        if (mandatory) {
            modal.style.pointerEvents = 'auto';
            // Hide close button if exists
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) closeBtn.style.display = 'none';
            
            console.log('⚠️ Modal is mandatory - cannot be closed by clicking background');
        }
        
        // Set focus
        setTimeout(() => {
            const firstOption = modal.querySelector('.gender-option');
            if (firstOption) firstOption.focus();
        }, 100);
    },
    
    hideGenderModal: function() {
        console.log('❌ Hiding gender modal');
        
        const modal = document.getElementById('genderModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            
            // Reset active selection
            const activeOptions = modal.querySelectorAll('.gender-option.active');
            activeOptions.forEach(opt => opt.classList.remove('active'));
            
            console.log('✅ Gender modal hidden');
        }
    },
    
    // ==================== PROFILE EDIT MODAL ====================
    initProfileEditModal: function() {
        const modal = document.getElementById('profileEditModal');
        if (!modal) return;
        
        // Open button
        const openBtn = document.getElementById('editProfileBtn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.showProfileEditModal());
        }
        
        // Close button
        const closeBtn = document.getElementById('closeProfileEditBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideProfileEditModal());
        }
        
        // Save button
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfileChanges());
        }
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideProfileEditModal();
            }
        });
    },
    
    showProfileEditModal: function() {
        const modal = document.getElementById('profileEditModal');
        if (!modal) return;
        
        // Load current data
        const bioInput = document.getElementById('editBio');
        const genderSelect = document.getElementById('editGender');
        const filterSelect = document.getElementById('editFilter');
        
        if (bioInput) bioInput.value = window.userState.bio || '';
        if (genderSelect) genderSelect.value = window.userState.currentGender || 'not_specified';
        if (filterSelect) filterSelect.value = window.userState.filter || 'not_specified';
        
        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Focus on bio input
        setTimeout(() => {
            if (bioInput) bioInput.focus();
        }, 100);
    },
    
    hideProfileEditModal: function() {
        const modal = document.getElementById('profileEditModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    },
    
    saveProfileChanges: function() {
        const bio = document.getElementById('editBio')?.value || '';
        const gender = document.getElementById('editGender')?.value || 'not_specified';
        const filter = document.getElementById('editFilter')?.value || 'not_specified';
        
        // Update user state
        window.userState.bio = bio;
        window.userState.currentGender = gender;
        window.userState.filter = filter;
        
        if (gender !== 'not_specified') {
            window.userState.hasSelectedGender = true;
        }
        
        // Save to storage
        window.storage?.saveUserState();
        
        // Update UI
        window.uiManager?.updateUserProfile();
        window.uiManager?.updateUIFromUserState();
        
        // Send to server
        if (window.socketManager?.socket?.connected) {
            window.socketManager.socket.emit('update_profile', {
                bio: bio,
                gender: gender,
                filter: filter
            });
        }
        
        // Show notification
        window.utils?.showNotification('Profil yangilandi', 'Oʻzgarishlar saqlandi');
        
        // Close modal
        this.hideProfileEditModal();
    },
    
    // ==================== CHAT MODAL ====================
    initChatModal: function() {
        const modal = document.getElementById('chatModal');
        if (!modal) return;
        
        // Close button
        const closeBtn = document.getElementById('closeChatBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideChatModal());
        }
        
        // Telegram button
        const tgBtn = document.getElementById('chatOpenTelegramBtn');
        if (tgBtn) {
            tgBtn.addEventListener('click', () => {
                const username = document.getElementById('chatUsername')?.textContent.replace('@', '');
                if (username && username !== 'username') {
                    window.open(`https://t.me/${username}`, '_blank');
                }
            });
        }
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideChatModal();
            }
        });
    },
    
    showChatModal: function(partner) {
        if (!partner) return;
        
        const modal = document.getElementById('chatModal');
        if (!modal) return;
        
        // Update partner info
        const avatar = document.getElementById('chatPartnerAvatar');
        const name = document.getElementById('chatPartnerName');
        const username = document.getElementById('chatUsername');
        const title = document.getElementById('chatTitle');
        
        if (avatar) {
            avatar.src = partner.photo || `https://ui-avatars.com/api/?name=${partner.name}`;
        }
        
        if (name) name.textContent = partner.name || 'Foydalanuvchi';
        if (username) username.textContent = '@' + (partner.username || 'username');
        if (title) title.textContent = partner.name + ' bilan chat';
        
        // Show modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    },
    
    hideChatModal: function() {
        const modal = document.getElementById('chatModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    },
    
    // ==================== DYNAMIC MODALS ====================
    showDynamicModal: function(html, onClose = null) {
        let container = document.getElementById('modalContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modalContainer';
            container.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(container);
        }
        
        container.innerHTML = html;
        container.style.display = 'flex';
        
        // Fade in
        setTimeout(() => {
            container.style.opacity = '1';
        }, 10);
        
        // Close on background click
        container.onclick = (e) => {
            if (e.target === container) {
                this.hideDynamicModal();
                if (onClose) onClose();
            }
        };
        
        // Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideDynamicModal();
                if (onClose) onClose();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },
    
    hideDynamicModal: function() {
        const container = document.getElementById('modalContainer');
        if (container) {
            container.style.opacity = '0';
            setTimeout(() => {
                container.style.display = 'none';
                container.innerHTML = '';
            }, 300);
        }
    },
    
    // ==================== SPECIAL MODALS ====================
    showLoadingModal: function(message = 'Yuklanmoqda...') {
        const html = `
            <div class="modal-content" style="background: rgba(30,30,46,0.95); padding: 30px; border-radius: 15px;">
                <div style="text-align: center;">
                    <div class="loader" style="width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.2); 
                          border-top-color: #667eea; border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite;"></div>
                    <p style="color: #fff; font-size: 1.1rem;">${message}</p>
                </div>
            </div>
        `;
        this.showDynamicModal(html);
    },
    
    showConfirmModal: function(title, message, onConfirm, onCancel = null) {
        const html = `
            <div class="modal-content" style="background: #1e1e2e; padding: 25px; border-radius: 15px; max-width: 400px;">
                <h3 style="color: #fff; margin-bottom: 15px;">${title}</h3>
                <p style="color: #ccc; margin-bottom: 25px;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="modalManager.hideDynamicModal(); ${onCancel ? onCancel + '()' : ''}" 
                            style="padding: 10px 20px; background: rgba(255,255,255,0.1); color: #ccc; border: none; border-radius: 8px; cursor: pointer;">
                        Bekor qilish
                    </button>
                    <button onclick="modalManager.hideDynamicModal(); ${onConfirm}()" 
                            style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                        Tasdiqlash
                    </button>
                </div>
            </div>
        `;
        this.showDynamicModal(html);
    },
    
    // ==================== GLOBAL HANDLER ====================
    setupGlobalClickHandler: function() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            // Check if click is outside any active modal
            const activeModals = document.querySelectorAll('.modal.active, .chat-modal.active');
            activeModals.forEach(modal => {
                if (!modal.contains(e.target) && e.target !== modal) {
                    // Don't close if mandatory
                    if (!modal.classList.contains('mandatory')) {
                        modal.classList.remove('active');
                        document.body.classList.remove('modal-open');
                    }
                }
            });
        });
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 modal.js loaded');
    setTimeout(() => {
        window.modalManager?.initAllModals();
    }, 500);
});

// Add CSS for spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal.active {
        display: flex;
        animation: fadeIn 0.3s;
    }
    
    .modal-content {
        background: #1e1e2e;
        border-radius: 15px;
        padding: 25px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .modal-open {
        overflow: hidden;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .gender-option {
        display: flex;
        align-items: center;
        padding: 15px;
        margin: 10px 0;
        background: rgba(255,255,255,0.05);
        border: 2px solid transparent;
        border-radius: 10px;
        color: #ccc;
        cursor: pointer;
        transition: all 0.3s;
        width: 100%;
        text-align: left;
    }
    
    .gender-option:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.2);
    }
    
    .gender-option.active {
        background: rgba(102, 126, 234, 0.2);
        border-color: #667eea;
        color: #fff;
    }
    
    .gender-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        font-size: 1.2rem;
    }
    
    .gender-icon.male { background: rgba(52, 152, 219, 0.2); color: #3498db; }
    .gender-icon.female { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
    .gender-icon.all { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
    
    .gender-info { flex: 1; }
    .gender-title { font-weight: bold; font-size: 1.1rem; }
    .gender-description { font-size: 0.9rem; opacity: 0.8; margin-top: 5px; }
    
    .gender-check {
        opacity: 0;
        color: #2ecc71;
        font-size: 1.2rem;
    }
    
    .gender-option.active .gender-check {
        opacity: 1;
    }
`;
document.head.appendChild(style);