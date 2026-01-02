export function updateUIFromUserState() {
    console.log('🎨 UI yangilanmoqda...');
   
    // Gender badge qo'shish
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(elements.myName, userState.currentGender);
        addGenderBadge(elements.profileName, userState.currentGender);
    }
   
    // Statistika yangilash
    if (elements.coinsCount) elements.coinsCount.textContent = userState.coins;
    if (elements.levelCount) elements.levelCount.textContent = userState.level;
    if (elements.shopCoinsCount) elements.shopCoinsCount.textContent = userState.coins;
    if (elements.statRating) elements.statRating.textContent = userState.rating;
    if (elements.statMatches) elements.statMatches.textContent = userState.matches;
    if (elements.myMatches) elements.myMatches.textContent = userState.matches;
    if (elements.statDuels) elements.statDuels.textContent = userState.duels;
    if (elements.mutualMatchesCount) elements.mutualMatchesCount.textContent = userState.mutualMatchesCount;
    if (elements.mutualMatchesProfile) elements.mutualMatchesProfile.textContent = userState.mutualMatchesCount;
    if (elements.statFriends) elements.statFriends.textContent = userState.friendsCount;
   
    const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
    if (elements.statWinRate) elements.statWinRate.textContent = winRate + '%';
   
    if (elements.myLikes) elements.myLikes.textContent = userState.totalLikes;
    if (elements.superLikeCount) elements.superLikeCount.textContent = userState.dailySuperLikes;
   
    if (elements.profileBio && userState.bio) {
        elements.profileBio.textContent = userState.bio;
    }
   
    // Start tugmasini yangilash
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
   
    // Filter sozlamasini yangilash
    gameState.currentFilter = userState.filter;
}

export function addGenderBadge(element, gender) {
    if (!element || !gender) return;
   
    const oldBadges = element.querySelectorAll('.gender-badge');
    oldBadges.forEach(badge => badge.remove());
   
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

export function createFilterOptions() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'gender-filter-container';
    filterContainer.innerHTML = `
        <div class="gender-filter-options">
            <div class="gender-filter-option ${gameState.currentFilter === 'male' ? 'active' : ''}" data-filter="male">
                <div class="gender-filter-icon male">
                    <i class="fas fa-mars"></i>
                </div>
            </div>
           
            <div class="gender-filter-option ${gameState.currentFilter === 'female' ? 'active' : ''}" data-filter="female">
                <div class="gender-filter-icon female">
                    <i class="fas fa-venus"></i>
                </div>
            </div>
           
            <div class="gender-filter-option ${gameState.currentFilter === 'not_specified' ? 'active' : ''}" data-filter="not_specified">
                <div class="gender-filter-icon all">
                    <i class="fas fa-users"></i>
                </div>
            </div>
        </div>
    `;
   
    const filterOptions = filterContainer.querySelectorAll('.gender-filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            const filter = option.dataset.filter;
            selectFilter(filter);
        });
    });
   
    return filterContainer;
}

export function selectFilter(filter) {
    console.log(`🎯 Filter tanlash: ${filter}`);
   
    gameState.currentFilter = filter;
    userState.filter = filter;
    localStorage.setItem('userFilter', filter);
   
    const filterOptions = document.querySelectorAll('.gender-filter-option');
    filterOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.filter === filter) {
            option.classList.add('active');
        }
    });
   
    showNotification('Filter o\'zgartirildi',
        filter === 'male' ? 'Endi faqat erkaklar bilan duel!' :
        filter === 'female' ? 'Endi faqat ayollar bilan duel!' :
        'Endi hamma bilan duel!');
   
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('update_profile', { filter: filter });
       
        if (gameState.isInQueue) {
            gameState.socket.emit('leave_queue');
            setTimeout(() => {
                gameState.socket.emit('enter_queue');
            }, 500);
        }
    }
}

export function addFilterToWelcomeScreen() {
    const profileCard = document.getElementById('profileCard');
    if (!profileCard) return;
   
    const existingFilter = profileCard.querySelector('.gender-filter-container');
    if (existingFilter) {
        existingFilter.remove();
    }
   
    const startBtn = profileCard.querySelector('.start-btn');
    const filterElement = createFilterOptions();
   
    if (startBtn && startBtn.parentNode) {
        startBtn.parentNode.insertBefore(filterElement, startBtn);
    }
}

export function showGenderModal(mandatory = true) {
    console.log(`🎯 Gender modali ko'rsatilmoqda`);
   
    if (!elements.genderModal) return;
   
    elements.genderModal.classList.add('active');
   
    if (mandatory && elements.genderWarning) {
        elements.genderWarning.classList.remove('hidden');
    }
}

export function hideGenderModal() {
    if (elements.genderModal) {
        elements.genderModal.classList.remove('active');
    }
    if (elements.genderWarning) {
        elements.genderWarning.classList.add('hidden');
    }
}

export function showNotification(title, message) {
    if (!elements.notification) return;
   
    elements.notificationTitle.textContent = title;
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('active');
   
    setTimeout(() => {
        elements.notification.classList.remove('active');
    }, 3000);
}

export function showScreen(screen) {
    console.log(`📱 Ekran o'zgartirildi: ${screen}`);
   
    [elements.welcomeScreen, elements.queueScreen, elements.duelScreen, elements.matchScreen]
        .forEach(s => {
            if (s) s.classList.add('hidden');
        });
   
    if (screen === 'welcome' && elements.welcomeScreen) {
        elements.welcomeScreen.classList.remove('hidden');
    }
    if (screen === 'queue' && elements.queueScreen) {
        elements.queueScreen.classList.remove('hidden');
    }
    if (screen === 'duel' && elements.duelScreen) {
        elements.duelScreen.classList.remove('hidden');
    }
    if (screen === 'match' && elements.matchScreen) {
        elements.matchScreen.classList.remove('hidden');
    }
}

export function initTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
   
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
           
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
           
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName + 'Tab') {
                    content.classList.add('active');
                }
            });
           
            gameState.currentTab = tabName;
           
            switch(tabName) {
                case 'friends':
                    loadFriendsList();
                    break;
                case 'shop':
                    loadShopItems();
                    break;
                case 'leaderboard':
                    loadLeaderboard();
                    break;
                case 'profile':
                    loadProfileQuests();
                    break;
            }
        });
    });
}

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

export function updateStats(data) {
    if (data.gender) userState.currentGender = data.gender;
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