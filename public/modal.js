// public/modal.js - To'liq funksionallik bilan Modal Manager

window.modalManager = {
    // ==================== INITIALIZATION ====================
    initAllModals: function() {
        console.log('🎯 Modal Manager ishga tushmoqda...');

        this.initGenderModal();
        this.initProfileEditModal();
        this.initChatModal();
        this.initDynamicModalContainer();

        console.log('✅ Modal Manager toʻliq ishga tushdi');
    },

    // ==================== DYNAMIC MODAL CONTAINER ====================
    initDynamicModalContainer: function() {
        let container = document.getElementById('modalContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modalContainer';
            container.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                z-index: 2000;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.7);
            `;
            document.body.appendChild(container);
        }
    },

    showDynamicModal: function(html) {
        const container = document.getElementById('modalContainer');
        if (!container) return;

        container.innerHTML = html;
        container.style.display = 'flex';

        // Background click bilan yopish
        container.addEventListener('click', (e) => {
            if (e.target === container) {
                this.hideDynamicModal();
            }
        });
    },

    hideDynamicModal: function() {
        const container = document.getElementById('modalContainer');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    },

    // ==================== GENDER MODAL ====================
    initGenderModal: function() {
        const modal = document.getElementById('genderModal');
        if (!modal) return;

        const options = document.querySelectorAll('.gender-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Faol klassni o'chirish
                options.forEach(o => o.classList.remove('active'));
                // Tanlanganiga qo'shish
                option.classList.add('active');

                const gender = option.dataset.gender;
                const title = option.querySelector('.gender-title').textContent;

                // Serverga yuborish
                window.socketManager?.socket?.emit('select_gender', { gender });

                // Local saqlash
                window.userState.currentGender = gender;
                window.userState.hasSelectedGender = true;
                window.storage?.saveUserState();

                window.utils?.showNotification('Gender tanlandi', title + ' tanlandi');

                // Modalni yopish
                this.hideGenderModal();
            });
        });
    },

    showGenderModal: function(mandatory = false) {
        const modal = document.getElementById('genderModal');
        if (!modal) return;

        modal.classList.add('active');
        document.body.classList.add('modal-open');

        if (mandatory) {
            // Majburiy bo'lsa, background click ishlamasin
            modal.style.pointerEvents = 'auto';
        }

        // Background click yopish (faqat mandatory bo'lmasa)
        const closeHandler = (e) => {
            if (e.target === modal && !mandatory) {
                this.hideGenderModal();
            }
        };
        modal.addEventListener('click', closeHandler);

        // Escape tugmasi
        const escHandler = (e) => {
            if (e.key === 'Escape' && !mandatory) {
                this.hideGenderModal();
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    hideGenderModal: function() {
        const modal = document.getElementById('genderModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    },

    // ==================== PROFILE EDIT MODAL ====================
    initProfileEditModal: function() {
        const openBtn = document.getElementById('editProfileBtn');
        const closeBtn = document.getElementById('closeProfileEditBtn');
        const saveBtn = document.getElementById('saveProfileBtn');
        const modal = document.getElementById('profileEditModal');

        if (!modal) return;

        if (openBtn) {
            openBtn.addEventListener('click', () => this.showProfileEditModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideProfileEditModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfileChanges());
        }

        // Background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideProfileEditModal();
        });
    },

    showProfileEditModal: function() {
        const modal = document.getElementById('profileEditModal');
        if (!modal) return;

        // Joriy ma'lumotlarni yuklash
        document.getElementById('editBio').value = window.userState.bio || '';
        document.getElementById('editGender').value = window.userState.currentGender || 'not_specified';
        document.getElementById('editFilter').value = window.userState.filter || 'not_specified';

        modal.classList.add('active');
        document.body.classList.add('modal-open');
    },

    hideProfileEditModal: function() {
        const modal = document.getElementById('profileEditModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    },

    saveProfileChanges: function() {
        const bio = document.getElementById('editBio').value.trim();
        const gender = document.getElementById('editGender').value;
        const filter = document.getElementById('editFilter').value;

        // Local yangilash
        window.userState.bio = bio;
        window.userState.currentGender = gender;
        window.userState.filter = filter;
        if (gender !== 'not_specified') {
            window.userState.hasSelectedGender = true;
        }

        window.storage?.saveUserState();
        window.uiManager?.updateUserProfile();
        window.uiManager?.updateUIFromUserState();

        // Serverga yuborish
        window.socketManager?.socket?.emit('update_profile', { bio, gender, filter });

        window.utils?.showNotification('Profil yangilandi', 'Oʻzgarishlar saqlandi');
        this.hideProfileEditModal();
    },

    // ==================== CHAT MODAL ====================
    initChatModal: function() {
        const modal = document.getElementById('chatModal');
        const closeBtn = document.getElementById('closeChatBtn');
        const openTgBtn = document.getElementById('chatOpenTelegramBtn');

        if (!modal) return;

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideChatModal());
        }

        if (openTgBtn) {
            openTgBtn.addEventListener('click', () => {
                const username = document.getElementById('chatUsername')?.textContent.replace('@', '');
                if (username) {
                    window.open(`https://t.me/${username}`, '_blank');
                    window.utils?.showNotification('Telegram ochildi', `@${username} bilan chat`);
                }
            });
        }

        // Background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideChatModal();
        });
    },

    showChatModal: function(partner) {
        if (!partner) return;

        const modal = document.getElementById('chatModal');
        if (!modal) return;

        // Ma'lumotlarni to'ldirish
        const avatar = document.getElementById('chatPartnerAvatar');
        const nameEl = document.getElementById('chatPartnerName');
        const usernameEl = document.getElementById('chatUsername');
        const titleEl = document.getElementById('chatTitle');

        if (avatar) {
            avatar.src = partner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=667eea&color=fff`;
            avatar.onerror = function() {
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=667eea&color=fff`;
            };
        }

        if (nameEl) nameEl.textContent = partner.name || 'Foydalanuvchi';
        if (usernameEl) usernameEl.textContent = '@' + (partner.username || 'username');
        if (titleEl) titleEl.textContent = `${partner.name} bilan chat`;

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

    // ==================== EXTRA MODALS ====================
    showLoadingModal: function(message = 'Yuklanmoqda...') {
        const html = `
            <div class="modal active">
                <div class="modal-content loading-modal">
                    <div class="loader"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;
        this.showDynamicModal(html);
    },

    hideLoadingModal: function() {
        this.hideDynamicModal();
    },

    showConfirmModal: function(title, message, onConfirm, onCancel) {
        const html = `
            <div class="modal active">
                <div class="modal-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="${onCancel || 'modalManager.hideDynamicModal'}()">Bekor qilish</button>
                        <button class="btn-primary" onclick="${onConfirm}(); modalManager.hideDynamicModal()">Tasdiqlash</button>
                    </div>
                </div>
            </div>
        `;
        this.showDynamicModal(html);
    }
};

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 modal.js yuklandi');
    setTimeout(() => {
        window.modalManager?.initAllModals();
        console.log('✅ Modal Manager toʻliq ishga tushdi');
    }, 800);
});

console.log('🎯 modal.js tayyor');