// public/storage.js - To'liq funksionallik bilan LocalStorage boshqaruvi

window.storage = {
    // ==================== ASOSIY USER STATE ====================
    /**
     * Foydalanuvchi ma'lumotlarini saqlash
     */
    saveUserState: function() {
        try {
            const userData = {
                // Asosiy statistika
                coins: window.userState.coins || 100,
                level: window.userState.level || 1,
                rating: window.userState.rating || 1500,
                matches: window.userState.matches || 0,
                duels: window.userState.duels || 0,
                wins: window.userState.wins || 0,
                totalLikes: window.userState.totalLikes || 0,
                dailySuperLikes: window.userState.dailySuperLikes || 3,

                // Profil ma'lumotlari
                bio: window.userState.bio || '',
                currentGender: window.userState.currentGender || null,
                filter: window.userState.filter || 'not_specified',

                // Flaglar
                hasSelectedGender: window.userState.hasSelectedGender || false,

                // Do'stlar va match soni
                mutualMatchesCount: window.userState.mutualMatchesCount || 0,
                friendsCount: window.userState.friendsCount || 0,

                // Kunlik reset sanasi
                lastResetDate: window.userState.lastResetDate || new Date().toDateString()
            };

            localStorage.setItem('likeDuelUserState', JSON.stringify(userData));
            console.log('💾 User state localStorage ga saqlandi');
        } catch (error) {
            console.error('❌ User state saqlashda xatolik:', error);
        }
    },

    /**
     * Foydalanuvchi ma'lumotlarini yuklash
     */
    loadUserState: function() {
        try {
            const saved = localStorage.getItem('likeDuelUserState');
            if (!saved) {
                console.log('📄 Saqlangan user state topilmadi, yangi yaratilmoqda');
                return false;
            }

            const parsed = JSON.parse(saved);

            // window.userState ga yuklash
            Object.assign(window.userState, {
                coins: parsed.coins ?? 100,
                level: parsed.level ?? 1,
                rating: parsed.rating ?? 1500,
                matches: parsed.matches ?? 0,
                duels: parsed.duels ?? 0,
                wins: parsed.wins ?? 0,
                totalLikes: parsed.totalLikes ?? 0,
                dailySuperLikes: parsed.dailySuperLikes ?? 3,

                bio: parsed.bio || '',
                currentGender: parsed.currentGender || null,
                filter: parsed.filter || 'not_specified',

                hasSelectedGender: parsed.hasSelectedGender || false,

                mutualMatchesCount: parsed.mutualMatchesCount || 0,
                friendsCount: parsed.friendsCount || 0,

                lastResetDate: parsed.lastResetDate || new Date().toDateString()
            });

            console.log('📥 User state localStorage dan muvaffaqiyatli yuklandi:', window.userState);
            return true;
        } catch (error) {
            console.error('❌ User state yuklashda xatolik:', error);
            return false;
        }
    },

    // ==================== DO'STLAR RO'YXATI ====================
    /**
     * Do'stlar ro'yxatini saqlash
     */
    saveFriendsList: function(friendsArray) {
        try {
            if (!Array.isArray(friendsArray)) {
                console.warn('⚠️ saveFriendsList: friendsArray array emas');
                return false;
            }

            localStorage.setItem('likeDuelFriends', JSON.stringify(friendsArray));
            console.log(`👥 ${friendsArray.length} ta do'st saqlandi`);

            // User state dagi sonlarni yangilash
            if (window.userState) {
                window.userState.mutualMatchesCount = friendsArray.length;
                window.userState.friendsCount = friendsArray.length;
                window.uiManager?.updateUIFromUserState();
            }

            return true;
        } catch (error) {
            console.error('❌ Do\'stlar saqlashda xatolik:', error);
            return false;
        }
    },

    /**
     * Do'stlar ro'yxatini yuklash
     */
    loadFriendsList: function() {
        try {
            const saved = localStorage.getItem('likeDuelFriends');
            if (!saved) {
                console.log('📄 Saqlangan do\'stlar topilmadi');
                return [];
            }

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                console.warn('⚠️ Saqlangan do\'stlar formati noto\'g\'ri');
                return [];
            }

            console.log(`👥 ${parsed.length} ta do'st yuklandi`);
            return parsed;
        } catch (error) {
            console.error('❌ Do\'stlar yuklashda xatolik:', error);
            return [];
        }
    },

    // ==================== QO'SHIMCHA SAQLASH ====================
    /**
     * Har qanday ma'lumotni key bo'yicha saqlash
     */
    setItem: function(key, value) {
        try {
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`❌ ${key} saqlashda xatolik:`, error);
            return false;
        }
    },

    /**
     * Key bo'yicha ma'lumot olish
     */
    getItem: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;

            // JSON parse qilishga urinish
            try {
                return JSON.parse(item);
            } catch {
                return item; // oddiy string bo'lsa
            }
        } catch (error) {
            console.error(`❌ ${key} o'qishda xatolik:`, error);
            return defaultValue;
        }
    },

    /**
     * Key bo'yicha o'chirish
     */
    removeItem: function(key) {
        try {
            localStorage.removeItem(key);
            console.log(`🗑️ ${key} o'chirildi`);
            return true;
        } catch (error) {
            console.error(`❌ ${key} o'chirishda xatolik:`, error);
            return false;
        }
    },

    /**
     * Barcha ma'lumotlarni tozalash (reset)
     */
    clearAll: function() {
        try {
            localStorage.clear();
            console.log('🧹 LocalStorage tozalandi');

            // Default qiymatlarga qaytarish
            Object.assign(window.userState, {
                coins: 100,
                level: 1,
                rating: 1500,
                matches: 0,
                duels: 0,
                wins: 0,
                totalLikes: 0,
                dailySuperLikes: 3,
                bio: '',
                currentGender: null,
                filter: 'not_specified',
                hasSelectedGender: false,
                mutualMatchesCount: 0,
                friendsCount: 0
            });

            window.uiManager?.updateUIFromUserState();
            window.utils?.showNotification('Reset', 'Barcha maʼlumotlar tozalandi');
        } catch (error) {
            console.error('❌ Tozalashda xatolik:', error);
        }
    },

    /**
     * Storage hajmini ko'rish (debug uchun)
     */
    getStorageSize: function() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return (total / 1024).toFixed(2) + ' KB';
    }
};

// ==================== AVTO YUKLASH ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 storage.js yuklandi');

    // User state yuklash
    const loaded = window.storage?.loadUserState();

    // Do'stlar yuklash va UI yangilash
    const friends = window.storage?.loadFriendsList();
    if (friends.length > 0 && window.uiManager) {
        window.uiManager.loadFriendsList(); // agar funksiya mavjud bo'lsa
    }

    console.log(`✅ Storage holati: ${loaded ? 'yuklandi' : 'yangi'} | Hajm: ${window.storage?.getStorageSize()}`);
});

// ==================== EXPORT (agar module bo'lsa) ====================
// Agar boshqa fayllarda import qilish kerak bo'lsa
// export default window.storage;

console.log('💾 storage.js toʻliq ishga tushdi');