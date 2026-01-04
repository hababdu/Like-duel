// ==================== UI MANAGEMENT ====================

// ui.js
const UIManager = {
    showScreen: function(screen) {
        ['welcomeScreen', 'queueScreen', 'duelScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', id !== screen + 'Screen');
        });
    },

    updateUIFromUserState: function() {
        if (window.elements?.coinsCount) window.elements.coinsCount.textContent = window.userState.coins;
        if (window.elements?.levelCount) window.elements.levelCount.textContent = window.userState.level;
        if (window.elements?.superLikeCount) window.elements.superLikeCount.textContent = window.userState.dailySuperLikes;
        if (window.elements?.myMatches) window.elements.myMatches.textContent = window.userState.matches;
        if (window.elements?.mutualMatchesCount) window.elements.mutualMatchesCount.textContent = window.userState.mutualMatchesCount;

        // Start tugmasi
        if (window.elements?.startBtn) {
            window.elements.startBtn.disabled = !window.userState.hasSelectedGender;
            window.elements.startBtn.textContent = window.userState.hasSelectedGender 
                ? '🎮 O\'yinni Boshlash' 
                : 'Avval gender tanlang';
        }
    },

    addGenderBadge: function(element, gender) {
        if (!element || !gender || gender === 'not_specified') return;
        const badge = document.createElement('span');
        badge.className = `gender-badge gender-${gender}-badge`;
        badge.innerHTML = gender === 'male' ? '<i class="fas fa-mars"></i> Erkak' : '<i class="fas fa-venus"></i> Ayol';
        element.appendChild(badge);
    }
};

window.uiManager = UIManager;
window.showScreen = UIManager.showScreen;
window.updateUIFromUserState = UIManager.updateUIFromUserState;

// Export to global scope
window.uiManager = UIManager;