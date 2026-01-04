// ==================== main.js ====================
// Ilovani ishga tushirish va barcha modullarni bog'lash

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Like Duel ilovasi yuklanmoqda...');

    // ------------------- ELEMENT REFERENSLARI -------------------
    window.elements = {
        // Asosiy ekranlar
        welcomeScreen: document.getElementById('welcomeScreen'),
        queueScreen:   document.getElementById('queueScreen'),
        duelScreen:    document.getElementById('duelScreen'),

        // Profil elementlari
        myAvatar:      document.getElementById('myAvatar'),
        myName:        document.getElementById('myName'),
        myUsername:    document.getElementById('myUsername'),
        myMatches:     document.getElementById('myMatches'),
        myLikes:       document.getElementById('myLikes'),
        mutualMatchesCount: document.getElementById('mutualMatchesCount'),

        // Tugmalar
        startBtn:      document.getElementById('startBtn'),
        leaveQueueBtn: document.getElementById('leaveQueueBtn'),

        // Statistikalar
        coinsCount:    document.getElementById('coinsCount'),
        levelCount:    document.getElementById('levelCount'),
        superLikeCount:document.getElementById('superLikeCount'),

        // Queue elementlari
        queueStatus:   document.getElementById('queueStatus'),

        // Duel elementlari
        duelStatus:    document.getElementById('duelStatus'),
        timer:         document.getElementById('timer'),

        // Notification
        notification:  document.getElementById('notification'),
        notificationTitle: document.getElementById('notificationTitle'),
        notificationMessage: document.getElementById('notificationMessage')
    };

    // ------------------- TELEGRAM WEB APP INTEGRATSIYASI -------------------
    let tgUser = null;
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();

        tgUser = Telegram.WebApp.initDataUnsafe.user || {};

        if (tgUser) {
            console.log('👤 Telegram foydalanuvchi maʼlumotlari olindi:', tgUser);

            // Profilni toʻldirish
            if (window.elements.myAvatar && tgUser.photo_url) {
                window.elements.myAvatar.src = tgUser.photo_url;
                window.elements.myAvatar.onerror = () => {
                    window.elements.myAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'User')}&background=667eea&color=fff`;
                };
            }

            if (window.elements.myName) {
                window.elements.myName.textContent = tgUser.first_name || 'Foydalanuvchi';
            }

            if (window.elements.myUsername) {
                window.elements.myUsername.textContent = tgUser.username ? `@${tgUser.username}` : '@foydalanuvchi';
            }

            // Global saqlash
            window.tgUserGlobal = tgUser;
        }
    } else {
        console.log('ℹ️ Telegram WebApp mavjud emas – test rejimi');
        // Test foydalanuvchi
        tgUser = {
            id: 'test_' + Date.now(),
            first_name: 'Test Foydalanuvchi',
            username: 'test_user'
        };
        window.tgUserGlobal = tgUser;
    }

    // Avatar fallback (agar rasm boʻlmasa)
    if (window.elements.myAvatar && !window.elements.myAvatar.src) {
        const name = tgUser.first_name || 'User';
        window.elements.myAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`;
    }

    // ------------------- STORAGE YUKLASH -------------------
    if (window.storage && typeof window.storage.loadUserState === 'function') {
        window.storage.loadUserState();
        console.log('💾 User state localStorage dan yuklandi');
    } else {
        console.warn('⚠️ Storage manager mavjud emas');
    }

    // ------------------- UI YANGILASH -------------------
    if (typeof window.updateUIFromUserState === 'function') {
        window.updateUIFromUserState();
    }

    // ------------------- EVENT LISTENERLAR -------------------
    // Start tugmasi
    if (window.elements.startBtn) {
        window.elements.startBtn.addEventListener('click', () => {
            console.log('🎮 Oʻyinni boshlash tugmasi bosildi');
            if (window.gameLogic && typeof window.gameLogic.startDuelFlow === 'function') {
                window.gameLogic.startDuelFlow();
            }
        });
    }

    // Navbatdan chiqish tugmasi
    if (window.elements.leaveQueueBtn) {
        window.elements.leaveQueueBtn.addEventListener('click', () => {
            console.log('🚪 Navbatdan chiqish');
            if (window.socketManager && typeof window.socketManager.leaveQueue === 'function') {
                window.socketManager.leaveQueue();
            }
            window.gameState.isInQueue = false;
            window.showScreen('welcome');
        });
    }

    // ------------------- SOCKET ULANISH -------------------
    if (window.socketManager && typeof window.socketManager.connectToServer === 'function') {
        setTimeout(() => {
            window.socketManager.connectToServer();
        }, 500);
    }

    // ------------------- GAME LOGIC INIT -------------------
    if (window.gameLogic && typeof window.gameLogic.initGameLogic === 'function') {
        window.gameLogic.initGameLogic();
    }

    // ------------------- MODAL MANAGER INIT -------------------
    if (window.modalManager && typeof window.modalManager.initAllModals === 'function') {
        window.modalManager.initAllModals();
    }

    // ------------------- GENDER MODAL (agar tanlanmagan boʻlsa) -------------------
    if (!window.userState.hasSelectedGender) {
        console.log('⚠️ Gender tanlanmagan – modal koʻrsatilmoqda');
        setTimeout(() => {
            if (window.modalManager && typeof window.modalManager.showGenderModal === 'function') {
                window.modalManager.showGenderModal(true);
            }
        }, 1500);
    } else {
        console.log('✅ Gender allaqachon tanlangan');
    }

    // ------------------- EKRANLAR BOSHQARUVI -------------------
    window.showScreen = function(screenName) {
        console.log(`📱 Ekran oʻzgartirildi: ${screenName}`);

        const screens = ['welcomeScreen', 'queueScreen', 'duelScreen'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === screenName + 'Screen') {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        });

        // Match yoki boshqa overlaylarni tozalash
        ['matchOptionsContainer', 'newDuelInviteContainer', 'chatInviteModal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    };

    // Dastlab welcome ekran
    window.showScreen('welcome');

    // ------------------- QUEUE VA DUEL STATUS YANGILASH -------------------
    window.updateQueueStatus = function(msg) {
        if (window.elements.queueStatus) {
            window.elements.queueStatus.textContent = msg;
        }
    };

    window.updateDuelStatus = function(msg) {
        if (window.elements.duelStatus) {
            window.elements.duelStatus.textContent = msg;
        }
    };

    // ------------------- NOTIFICATION FUNKSİYASI -------------------
    window.utils = window.utils || {};
    window.utils.showNotification = function(title, message = '') {
        if (!window.elements.notification) return;

        window.elements.notificationTitle.textContent = title;
        window.elements.notificationMessage.textContent = message;
        window.elements.notification.classList.add('active');

        setTimeout(() => {
            window.elements.notification.classList.remove('active');
        }, 3500);
    };

    // ------------------- TAMOM -------------------
    console.log('✅ main.js – Ilova toʻliq ishga tushdi!');
    console.log('🎉 Like Duel tayyor! Oʻyinni boshlashingiz mumkin.');
});