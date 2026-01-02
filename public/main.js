// public/main.js
// type="module" bo'lgani uchun import/export ishlaydi

import { gameState, userState, elements, setTgUserGlobal } from './state.js';
import { 
    updateUIFromUserState, 
    addGenderBadge, 
    addFilterToWelcomeScreen, 
    showGenderModal, 
    hideGenderModal, 
    showNotification, 
    showScreen, 
    initTabNavigation, 
    updateQueueStatus, 
    updateDuelStatus 
} from './ui.js';

import { connectToServer } from './socket.js';

import { 
    startGame, 
    leaveQueue, 
    handleVote, 
    loadFriendsList, 
    loadShopItems, 
    loadLeaderboard, 
    loadProfileQuests 
} from './gameLogic.js';

import { saveUserStateToLocalStorage } from './storage.js';

// ==================== PROFILNI YUKLASH ====================
function initUserProfile() {
    console.log('👤 Profil yuklanmoqda...');

    let tgUser = {};

    try {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            tgUser = Telegram.WebApp.initDataUnsafe.user || {};
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    } catch (e) {
        console.log('ℹ️ Telegram WebApp mavjud emas – test rejimi');
    }

    // Test foydalanuvchi, agar Telegram ma'lumotlari bo'lmasa
    if (!tgUser.id) {
        tgUser = {
            id: 'test_' + Date.now(),
            first_name: 'Test Foydalanuvchi',
            username: 'test_user',
            photo_url: null
        };
    }

    const userPhoto = tgUser.photo_url || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`;
    const userName = tgUser.first_name || 'Foydalanuvchi';
    const userUsername = tgUser.username ? '@' + tgUser.username : '@foydalanuvchi';

    // Avatar va ismni yangilash
    elements.myAvatar.src = userPhoto;
    elements.myName.textContent = userName;
    elements.myUsername.textContent = userUsername;
    elements.profileAvatar.src = userPhoto;
    elements.profileName.textContent = userName;
    elements.profileUsername.textContent = userUsername;

    // Global o'zgaruvchiga saqlash
    setTgUserGlobal(tgUser);

    // UI ni yangilash
    updateUIFromUserState();
    addFilterToWelcomeScreen();

    // Agar gender tanlanmagan bo'lsa – modal ko'rsatish
    if (!userState.hasSelectedGender) {
        setTimeout(() => showGenderModal(true), 1000);
    }
}

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM yuklandi, ilova ishga tushmoqda...');

    initUserProfile();
    initTabNavigation();

    // ==================== GENDER TANLASH TUGMALARI ====================
    elements.selectMaleBtn.onclick   = () => window.selectGender('male');
    elements.selectFemaleBtn.onclick = () => window.selectGender('female');
    elements.selectAllBtn.onclick    = () => window.selectGender('not_specified');

    // ==================== ASOSIY TUGMALAR ====================
    elements.startBtn.addEventListener('click', startGame);
    elements.leaveQueueBtn.addEventListener('click', leaveQueue);

    elements.noBtn.addEventListener('click', () => handleVote('skip'));
    elements.likeBtn.addEventListener('click', () => handleVote('like'));
    elements.superLikeBtn.addEventListener('click', () => handleVote('super_like'));

    elements.selectGenderNowBtn.addEventListener('click', () => showGenderModal(true));

    // ==================== PROFIL TAHRIRLASH ====================
    elements.editProfileBtn.addEventListener('click', () => {
        elements.editBio.value = userState.bio || '';
        elements.editGender.value = userState.currentGender || 'not_specified';
        elements.editFilter.value = userState.filter || 'not_specified';
        elements.profileEditModal.classList.add('active');
    });

    elements.closeProfileEditBtn.addEventListener('click', () => {
        elements.profileEditModal.classList.remove('active');
    });

    elements.saveProfileBtn.addEventListener('click', () => {
        const bio    = elements.editBio.value.trim();
        const gender = elements.editGender.value;
        const filter = elements.editFilter.value;

        // Serverga yangilash yuborish (agar ulangan bo'lsa)
        if (gameState.socket && gameState.isConnected) {
            gameState.socket.emit('update_profile', { bio, gender, filter });
        }

        // Local holatni yangilash
        userState.bio = bio;
        if (gender !== userState.currentGender) {
            userState.currentGender = gender;
            userState.hasSelectedGender = true;
        }
        userState.filter = filter;

        saveUserStateToLocalStorage();
        updateUIFromUserState();

        if (elements.profileBio) {
            elements.profileBio.textContent = bio || 'Bio kiritilmagan';
        }

        elements.profileEditModal.classList.remove('active');
        showNotification('✅ Profil yangilandi', 'Oʻzgarishlar saqlandi');
    });

    // ==================== CHAT MODAL ====================
    elements.closeChatBtn.addEventListener('click', window.closeChatModal);

    elements.chatOpenTelegramBtn.addEventListener('click', () => {
        if (gameState.currentPartner && gameState.currentPartner.username) {
            window.openTelegramChat(gameState.currentPartner.username);
        } else {
            showNotification('Xato', 'Foydalanuvchi username topilmadi');
        }
    });

    // ==================== QO'SHIMCHA TUGMALAR ====================
    elements.refreshFriendsBtn.addEventListener('click', loadFriendsList);

    if (elements.viewStatsBtn) {
        elements.viewStatsBtn.addEventListener('click', () => {
            const stats = `
Reyting: ${userState.rating}
Matchlar: ${userState.matches}
Duellar: ${userState.duels}
G'alaba %: ${userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0}%
Total Like: ${userState.totalLikes}
O'zaro Match: ${userState.mutualMatchesCount}
Do'stlar: ${userState.friendsCount}
Coin: ${userState.coins}
Level: ${userState.level}
Kunlik Super Like: ${userState.dailySuperLikes}/3
Filter: ${userState.filter === 'male' ? 'Faqat erkaklar' : userState.filter === 'female' ? 'Faqat ayollar' : 'Hamma'}
            `.trim();
            alert('Batafsil statistika:\n\n' + stats);
        });
    }

    // ==================== BOSHQA TABLAR YUKLASH ====================
    loadProfileQuests();
    loadShopItems();
    loadLeaderboard();
    loadFriendsList();

    console.log('✅ main.js toʻliq ishga tushdi – barcha funksiyalar faol');
});

// ==================== GLOBAL (WINDOW) FUNKSIYALAR ====================
// Bu funksiyalar HTML onclick yoki boshqa fayllardan chaqirilishi uchun window ga bog'lanadi

window.selectGender = function(gender) {
    console.log(`🎯 Gender tanlandi: ${gender}`);

    userState.currentGender = gender;
    userState.hasSelectedGender = true;

    saveUserStateToLocalStorage();
    updateUIFromUserState();
    hideGenderModal();

    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel' :
        gender === 'female' ? 'Faqat erkaklar bilan duel' :
        'Hamma bilan duel!'
    );

    // Serverga xabar berish
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { gender });
    } else {
        connectToServer(); // Avtomatik ulanish
    }
};

window.openTelegramChat = function(username) {
    if (!username) {
        showNotification('Xato', 'Username mavjud emas');
        return;
    }
    const url = `https://t.me/${username.replace('@', '')}`;
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
};

window.closeChatModal = function() {
    gameState.isChatModalOpen = false;
    elements.chatModal.classList.remove('active');

    // Match ekraniga qaytish (agar match bo'lsa)
    if (gameState.currentPartner) {
        showScreen('match');
    } else {
        showScreen('welcome');
    }
};

// Qo'shimcha global funksiyalar kerak bo'lsa shu yerga qo'shing
// Masalan: window.skipToNextDuel, window.returnToMenu va h.k. gameLogic.js da bo'lsa, shu yerga ham qo'shishingiz mumkin.