// public/ui.js
import { gameState, userState, elements } from './state.js';
import { saveUserStateToLocalStorage } from './storage.js';

// ==================== UI YANGILASH ====================
export function updateUIFromUserState() {
    console.log('🎨 UI yangilanmoqda...');

    // Gender badge qo'shish
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(elements.myName, userState.currentGender);
        addGenderBadge(elements.profileName, userState.currentGender);
    }

    // Statistikalarni yangilash
    elements.coinsCount.textContent = userState.coins;
    elements.levelCount.textContent = userState.level;
    elements.shopCoinsCount.textContent = userState.coins;

    elements.statRating.textContent = userState.rating;
    elements.statMatches.textContent = userState.matches;
    elements.myMatches.textContent = userState.matches;
    elements.statDuels.textContent = userState.duels;

    elements.mutualMatchesCount.textContent = userState.mutualMatchesCount;
    elements.mutualMatchesProfile.textContent = userState.mutualMatchesCount;
    elements.statFriends.textContent = userState.friendsCount;

    const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
    elements.statWinRate.textContent = winRate + '%';

    elements.myLikes.textContent = userState.totalLikes;
    elements.superLikeCount.textContent = userState.dailySuperLikes;

    // Bio
    if (elements.profileBio) {
        elements.profileBio.textContent = userState.bio || 'Bio kiritilmagan';
    }

    // Start tugmasi holati
    if (elements.startBtn) {
        if (userState.hasSelectedGender) {
            elements.startBtn.disabled = false;
            elements.startBtn.textContent = '🎮 O\'yinni Boshlash';
            elements.startBtn.classList.remove('disabled');
        } else {
            elements.startBtn.disabled = true;
            elements.startBtn.textContent = 'Avval gender tanlang';
            elements.startBtn.classList.add('disabled');
        }
    }

    // Filter holatini saqlash
    gameState.currentFilter = userState.filter;
}

// ==================== GENDER BADGE ====================
export function addGenderBadge(element, gender) {
    if (!element || !gender) return;

    // Eski badge larni o'chirish
    const oldBadges = element.querySelectorAll('.gender-badge');
    oldBadges.forEach(b => b.remove());

    const badge = document.createElement('span');
    badge.className = `gender-badge gender-${gender}-badge`;

    if (gender === 'male') {
        badge.innerHTML = '<i class="fas fa-mars"></i> Erkak';
    } else if (gender === 'female') {
        badge.innerHTML = '<i class="fas fa-venus"></i> Ayol';
    } else {
        badge.innerHTML = '<i class="fas fa-users"></i> Hammasi';
    }

    element.appendChild(badge);
}

// ==================== FILTER OPSIYALARI ====================
export function createFilterOptions() {
    const container = document.createElement('div');
    container.className = 'gender-filter-container';
    container.innerHTML = `
        <div class="gender-filter-options">
            <div class="gender-filter-option ${gameState.currentFilter === 'male' ? 'active' : ''}" data-filter="male">
                <div class="gender-filter-icon male"><i class="fas fa-mars"></i></div>
            </div>
            <div class="gender-filter-option ${gameState.currentFilter === 'female' ? 'active' : ''}" data-filter="female">
                <div class="gender-filter-icon female"><i class="fas fa-venus"></i></div>
            </div>
            <div class="gender-filter-option ${gameState.currentFilter === 'not_specified' ? 'active' : ''}" data-filter="not_specified">
                <div class="gender-filter-icon all"><i class="fas fa-users"></i></div>
            </div>
        </div>
    `;

    // Klik hodisalari
    container.querySelectorAll('.gender-filter-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const filter = opt.dataset.filter;
            selectFilter(filter);
        });
    });

    return container;
}

export function selectFilter(filter) {
    console.log(`🎯 Filter o'zgartirildi: ${filter}`);

    gameState.currentFilter = filter;
    userState.filter = filter;
    localStorage.setItem('userFilter', filter);

    // Aktiv klassni o'zgartirish
    document.querySelectorAll('.gender-filter-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.filter === filter);
    });

    // Xabar
    showNotification('Filter o\'zgartirildi',
        filter === 'male' ? 'Endi faqat erkaklar bilan duel!' :
        filter === 'female' ? 'Endi faqat ayollar bilan duel!' :
        'Endi hamma bilan duel!'
    );

    // Serverga yangilash
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('update_profile', { filter });

        if (gameState.isInQueue) {
            gameState.socket.emit('leave_queue');
            setTimeout(() => gameState.socket.emit('enter_queue'), 500);
        }
    }
}

export function addFilterToWelcomeScreen() {
    const profileCard = document.getElementById('profileCard');
    if (!profileCard) return;

    // Eski filterni o'chirish
    const existing = profileCard.querySelector('.gender-filter-container');
    if (existing) existing.remove();

    const filterElement = createFilterOptions();
    const startBtn = profileCard.querySelector('.start-btn');

    if (startBtn && startBtn.parentNode) {
        startBtn.parentNode.insertBefore(filterElement, startBtn);
    }
}

// ==================== MODALLAR ====================
export function showGenderModal(mandatory = true) {
    console.log('⚠️ Gender modal ochilmoqda');
    elements.genderModal.classList.add('active');

    if (mandatory && elements.genderWarning) {
        elements.genderWarning.classList.remove('hidden');
    }
}

export function hideGenderModal() {
    elements.genderModal.classList.remove('active');
    if (elements.genderWarning) {
        elements.genderWarning.classList.add('hidden');
    }
}

// ==================== NOTIFIKATSIYA ====================
export function showNotification(title, message) {
    if (!elements.notification) return;

    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('active');

    setTimeout(() => {
        elements.notification.classList.remove('active');
    }, 3000);
}

// ==================== EKRAN ALMASHISH ====================
export function showScreen(screen) {
    console.log(`📱 Ekran: ${screen}`);

    [elements.welcomeScreen, elements.queueScreen, elements.duelScreen, elements.matchScreen]
        .forEach(s => s?.classList.add('hidden'));

    if (screen === 'welcome') elements.welcomeScreen.classList.remove('hidden');
    if (screen === 'queue') elements.queueScreen.classList.remove('hidden');
    if (screen === 'duel') elements.duelScreen.classList.remove('hidden');
    if (screen === 'match') elements.matchScreen.classList.remove('hidden');
}

// ==================== TAB NAVIGATSIYASI ====================
export function initTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Aktiv tabni o'zgartirish
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Kontentni ko'rsatish
            contents.forEach(c => {
                c.classList.remove('active');
                if (c.id === tabName + 'Tab') {
                    c.classList.add('active');
                }
            });

            gameState.currentTab = tabName;
        });
    });
}

// ==================== STATUS MATNLARI ====================
export function updateQueueStatus(msg) {
    if (elements.queueStatus) {
        elements.queueStatus.textContent = msg;
    }
}

export function updateDuelStatus(msg) {
    if (elements.duelStatus) {
        elements.duelStatus.textContent = msg;
    }
}

// ==================== SERVERDAN KELGAN STATISTIKA YANGILASH ====================
export function updateStats(data) {
    console.log('📊 Serverdan statistika yangilandi:', data);

    if (data.gender !== undefined) userState.currentGender = data.gender;
    if (data.hasSelectedGender !== undefined) userState.hasSelectedGender = data.hasSelectedGender;
    if (data.coins !== undefined) userState.coins = data.coins;
    if (data.level !== undefined) userState.level = data.level;
    if (data.rating !== undefined) userState.rating = data.rating;
    if (data.matches !== undefined) userState.matches = data.matches;
    if (data.duels !== undefined) userState.duels = data.duels;
    if (data.wins !== undefined) userState.wins = data.wins;
    if (data.totalLikes !== undefined) userState.totalLikes = data.totalLikes;
    if (data.dailySuperLikes !== undefined) userState.dailySuperLikes = data.dailySuperLikes;
    if (data.bio !== undefined) userState.bio = data.bio;
    if (data.filter !== undefined) userState.filter = data.filter;
    if (data.mutualMatchesCount !== undefined) userState.mutualMatchesCount = data.mutualMatchesCount;
    if (data.friendsCount !== undefined) userState.friendsCount = data.friendsCount;

    saveUserStateToLocalStorage();
    updateUIFromUserState();
}