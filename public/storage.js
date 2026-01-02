// public/storage.js
// Bu fayl foydalanuvchi ma'lumotlarini localStorage ga saqlaydi va o'qiyadi

import { userState } from './state.js';

/**
 * Barcha userState maydonlarini localStorage ga saqlaydi
 * Har safar coins, rating, gender, bio va boshqa ma'lumotlar o'zgarganda chaqiriladi
 */
export function saveUserStateToLocalStorage() {
    try {
        localStorage.setItem('userGender', userState.currentGender || '');
        localStorage.setItem('hasSelectedGender', userState.hasSelectedGender.toString());
        localStorage.setItem('userCoins', userState.coins.toString());
        localStorage.setItem('userLevel', userState.level.toString());
        localStorage.setItem('userRating', userState.rating.toString());
        localStorage.setItem('userMatches', userState.matches.toString());
        localStorage.setItem('userDuels', userState.duels.toString());
        localStorage.setItem('userWins', userState.wins.toString());
        localStorage.setItem('userTotalLikes', userState.totalLikes.toString());
        localStorage.setItem('userDailySuperLikes', userState.dailySuperLikes.toString());
        localStorage.setItem('userBio', userState.bio || '');
        localStorage.setItem('userFilter', userState.filter || 'not_specified');
        localStorage.setItem('mutualMatchesCount', userState.mutualMatchesCount.toString());
        localStorage.setItem('friendsCount', userState.friendsCount.toString());

        console.log('💾 User state localStorage ga saqlandi');
    } catch (error) {
        console.error('❌ localStorage ga saqlashda xato:', error);
    }
}

/**
 * localStorage dan ma'lumotlarni o'qib, userState ni to'ldiradi
 * (Bu funksiya odatda state.js da allaqachon ishlatilgan, lekin qo'shimcha xavfsizlik uchun qoldirdim)
 */
export function loadUserStateFromLocalStorage() {
    try {
        const keys = [
            'userGender', 'hasSelectedGender', 'userCoins', 'userLevel', 'userRating',
            'userMatches', 'userDuels', 'userWins', 'userTotalLikes', 'userDailySuperLikes',
            'userBio', 'userFilter', 'mutualMatchesCount', 'friendsCount'
        ];

        let hasChanges = false;

        if (localStorage.getItem('userGender') !== null) {
            userState.currentGender = localStorage.getItem('userGender') || null;
            hasChanges = true;
        }
        if (localStorage.getItem('hasSelectedGender') !== null) {
            userState.hasSelectedGender = localStorage.getItem('hasSelectedGender') === 'true';
            hasChanges = true;
        }
        if (localStorage.getItem('userCoins') !== null) {
            userState.coins = parseInt(localStorage.getItem('userCoins')) || 100;
            hasChanges = true;
        }
        if (localStorage.getItem('userLevel') !== null) {
            userState.level = parseInt(localStorage.getItem('userLevel')) || 1;
            hasChanges = true;
        }
        if (localStorage.getItem('userRating') !== null) {
            userState.rating = parseInt(localStorage.getItem('userRating')) || 1500;
            hasChanges = true;
        }
        if (localStorage.getItem('userMatches') !== null) {
            userState.matches = parseInt(localStorage.getItem('userMatches')) || 0;
            hasChanges = true;
        }
        if (localStorage.getItem('userDuels') !== null) {
            userState.duels = parseInt(localStorage.getItem('userDuels')) || 0;
            hasChanges = true;
        }
        if (localStorage.getItem('userWins') !== null) {
            userState.wins = parseInt(localStorage.getItem('userWins')) || 0;
            hasChanges = true;
        }
        if (localStorage.getItem('userTotalLikes') !== null) {
            userState.totalLikes = parseInt(localStorage.getItem('userTotalLikes')) || 0;
            hasChanges = true;
        }
        if (localStorage.getItem('userDailySuperLikes') !== null) {
            userState.dailySuperLikes = parseInt(localStorage.getItem('userDailySuperLikes')) || 3;
            hasChanges = true;
        }
        if (localStorage.getItem('userBio') !== null) {
            userState.bio = localStorage.getItem('userBio') || '';
            hasChanges = true;
        }
        if (localStorage.getItem('userFilter') !== null) {
            userState.filter = localStorage.getItem('userFilter') || 'not_specified';
            hasChanges = true;
        }
        if (localStorage.getItem('mutualMatchesCount') !== null) {
            userState.mutualMatchesCount = parseInt(localStorage.getItem('mutualMatchesCount')) || 0;
            hasChanges = true;
        }
        if (localStorage.getItem('friendsCount') !== null) {
            userState.friendsCount = parseInt(localStorage.getItem('friendsCount')) || 0;
            hasChanges = true;
        }

        if (hasChanges) {
            console.log('📂 localStorage dan user state yuklandi');
        }
    } catch (error) {
        console.error('❌ localStorage dan o\'qishda xato:', error);
    }
}

/**
 * localStorage ni tozalash (test yoki logout uchun foydali)
 */
export function clearUserStateFromLocalStorage() {
    const keys = [
        'userGender', 'hasSelectedGender', 'userCoins', 'userLevel', 'userRating',
        'userMatches', 'userDuels', 'userWins', 'userTotalLikes', 'userDailySuperLikes',
        'userBio', 'userFilter', 'mutualMatchesCount', 'friendsCount'
    ];

    keys.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ localStorage tozalandi');
}