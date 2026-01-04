// ==================== MODAL MANAGEMENT ====================

// modal.js
const ModalManager = {
    initAllModals: function() {
        this.initGenderModal();
        this.initChatModal();
    },

    initGenderModal: function() {
        document.getElementById('selectMaleBtn')?.addEventListener('click', () => this.selectGender('male'));
        document.getElementById('selectFemaleBtn')?.addEventListener('click', () => this.selectGender('female'));
        document.getElementById('selectAllBtn')?.addEventListener('click', () => this.selectGender('all'));
    },

    selectGender: function(gender) {
        let serverGender = gender === 'all' ? 'not_specified' : gender;
        window.userState.currentGender = serverGender;
        window.userState.hasSelectedGender = true;
        window.userState.filter = gender === 'male' ? 'female' : gender === 'female' ? 'male' : 'not_specified';

        window.storage?.saveUserState?.();
        window.updateUIFromUserState?.();
        this.hideGenderModal();

        if (window.gameState.socket?.connected) {
            window.gameState.socket.emit('select_gender', { gender: serverGender });
        }

        window.utils?.showNotification('✅ Gender tanlandi', 'Endi duel o\'ynashingiz mumkin!');
        setTimeout(() => window.gameLogic?.startDuelFlow?.(), 1000);
    },

    showGenderModal: function(mandatory = true) {
        const modal = document.getElementById('genderModal');
        if (modal) modal.classList.add('active');
        document.body.classList.add('modal-open');
    },

    hideGenderModal: function() {
        const modal = document.getElementById('genderModal');
        if (modal) modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    },

    showChatModal: function(partner) {
        const modal = document.getElementById('chatModal');
        if (!modal || !partner) return;

        document.getElementById('chatPartnerAvatar').src = partner.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}`;
        document.getElementById('chatPartnerName').textContent = partner.name;
        document.getElementById('chatUsername').textContent = partner.username ? `@${partner.username}` : '';
        document.getElementById('chatTitle').textContent = `${partner.name} bilan chat`;

        modal.classList.add('active');
        document.body.classList.add('modal-open');

        document.getElementById('chatOpenTelegramBtn').onclick = () => {
            const url = partner.username ? `https://t.me/${partner.username}` : null;
            if (url && Telegram?.WebApp) {
                Telegram.WebApp.openTelegramLink(url);
            } else if (url) {
                window.open(url, '_blank');
            } else {
                window.utils?.showNotification('Xato', 'Username mavjud emas');
            }
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        };
    },

    hideChatModal: function() {
        const modal = document.getElementById('chatModal');
        if (modal) modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
};

window.modalManager = ModalManager;

// Export to global scope
window.modalManager = ModalManager;