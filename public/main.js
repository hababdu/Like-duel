// main.js - FIXED DISPLAY ISSUE
console.log('🚀 Like Duel - FIXED VERSION');

// ==================== O'YIN HOLATLARI ====================
const gameState = {
    socket: null,
    isConnected: false,
    isInQueue: false,
    isInDuel: false,
    isInChat: false,
    timeLeft: 20,
    timerInterval: null,
    playerData: null,
    currentDuelId: null,
    currentPartner: null,
    currentChatId: null,
    uniqueUserId: null,
    currentOpponent: null
};

// ==================== USER STATE ====================
const userState = {
    currentGender: localStorage.getItem('userGender') || null,
    hasSelectedGender: localStorage.getItem('hasSelectedGender') === 'true',
    coins: parseInt(localStorage.getItem('userCoins')) || 100,
    level: parseInt(localStorage.getItem('userLevel')) || 1,
    rating: parseInt(localStorage.getItem('userRating')) || 1500,
    xp: parseInt(localStorage.getItem('userXP')) || 0,
    matches: parseInt(localStorage.getItem('userMatches')) || 0,
    duels: parseInt(localStorage.getItem('userDuels')) || 0,
    wins: parseInt(localStorage.getItem('userWins')) || 0,
    totalLikes: parseInt(localStorage.getItem('userTotalLikes')) || 0,
    dailySuperLikes: parseInt(localStorage.getItem('userDailySuperLikes')) || 3,
    userName: localStorage.getItem('userName') || null,
    userPhoto: localStorage.getItem('userPhoto') || null,
    userBio: localStorage.getItem('userBio') || ''
};

// ==================== DOM YUKLANGANDA ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM yuklandi');
    
    // Avval UI elementlarini tekshirib ko'ramiz
    const elementsExist = [
        'myAvatar', 'myName', 'myUsername',
        'profileAvatar', 'profileName', 'profileUsername',
        'startBtn', 'coinsCount', 'levelCount'
    ];
    
    elementsExist.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`❌ Element topilmadi: ${id}`);
        }
    });
    
    // Profilni yuklash
    initUserProfile();
    
    // Event listenerlarni qo'shish
    setupEventListeners();
    
    // Serverga ulanmasdan oldin test qilamiz
    setTimeout(() => {
        // Test: UI to'g'ri yuklanganligini tekshirish
        const myName = document.getElementById('myName');
        console.log('Test: myName content:', myName?.textContent);
        
        // Agar hali UI yangilanmagan bo'lsa, force update qilamiz
        if (!myName?.textContent || myName.textContent === 'Foydalanuvchi') {
            console.log('⚠️ UI yangilanmagan, force update...');
            forceUpdateUI();
        }
    }, 1000);
});

function forceUpdateUI() {
    console.log('🔄 UI ni force update qilish...');
    
    // Avatar rasmini yangilash
    const avatars = document.querySelectorAll('.profile-avatar, .profile-tab-avatar');
    avatars.forEach(avatar => {
        if (userState.userPhoto) {
            avatar.src = userState.userPhoto;
        } else {
            avatar.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Date.now();
        }
    });
    
    // Ismni yangilash
    const nameElements = document.querySelectorAll('#myName, #profileName');
    nameElements.forEach(el => {
        if (userState.userName) {
            el.textContent = userState.userName;
        } else {
            el.textContent = 'Foydalanuvchi';
        }
    });
    
    // Statistika yangilash
    updateStats();
    
    // Gender badge qo'shish
    if (userState.hasSelectedGender && userState.currentGender) {
        addGenderBadge(document.getElementById('myName'), userState.currentGender);
        addGenderBadge(document.getElementById('profileName'), userState.currentGender);
    }
    
    // Start tugmasini sozlash
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        if (userState.hasSelectedGender) {
            startBtn.disabled = false;
            startBtn.textContent = '🎮 O\'yinni Boshlash';
            startBtn.classList.remove('disabled');
        } else {
            startBtn.disabled = true;
            startBtn.textContent = 'Avval gender tanlang';
            startBtn.classList.add('disabled');
        }
    }
}

// ==================== PROFILNI YUKLASH ====================
function initUserProfile() {
    console.log('👤 Profil yuklanmoqda...');
    
    let userData;
    
    try {
        // Telegram WebApp test qilish
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            console.log('✅ Telegram WebApp mavjud');
            
            const tg = Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            const tgUser = tg.initDataUnsafe?.user;
            console.log('Telegram user:', tgUser);
            
            if (tgUser) {
                // Telegram foydalanuvchisi
                userData = {
                    id: tgUser.id.toString(),
                    firstName: tgUser.first_name || 'Telegram User',
                    username: tgUser.username || `tg_${tgUser.id}`,
                    photoUrl: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}`,
                    isTelegramUser: true
                };
                console.log('✅ Telegram foydalanuvchisi:', userData.firstName);
            } else {
                throw new Error('Telegram user ma\'lumotlari yo\'q');
            }
        } else {
            throw new Error('Telegram WebApp mavjud emas');
        }
    } catch (error) {
        console.log('ℹ️ Test foydalanuvchi yaratilmoqda:', error.message);
        
        // Test foydalanuvchi yaratish
        const maleNames = ['Ali', 'Vali', 'Hasan', 'Husan', 'Bekzod'];
        const femaleNames = ['Malika', 'Dilnoza', 'Sevara', 'Madina', 'Zarina'];
        const lastNames = ['Alimov', 'Valiyev', 'Hasanov', 'Husanov'];
        
        const isMale = Math.random() > 0.5;
        const firstName = isMale 
            ? maleNames[Math.floor(Math.random() * maleNames.length)]
            : femaleNames[Math.floor(Math.random() * femaleNames.length)];
        
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const username = `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;
        
        userData = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            firstName: userState.userName || fullName,
            username: username,
            photoUrl: userState.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
            isTelegramUser: false
        };
        
        // Test user ma'lumotlarini saqlash
        if (!userState.userName) {
            userState.userName = userData.firstName;
            userState.userPhoto = userData.photoUrl;
            localStorage.setItem('userName', userData.firstName);
            localStorage.setItem('userPhoto', userData.photoUrl);
        }
        
        console.log('✅ Test foydalanuvchi:', userData.firstName);
    }
    
    // UI elementlarini yangilash
    updateUIWithUserData(userData);
    
    // Statistika yangilash
    updateStats();
    
    // Agar gender tanlanmagan bo'lsa
    if (!userState.hasSelectedGender) {
        setTimeout(() => {
            showGenderModal(true);
        }, 1500);
    }
    
    return userData;
}

function updateUIWithUserData(userData) {
    console.log('🔄 UI yangilanmoqda...', userData);
    
    try {
        // Avatar rasmlari
        const myAvatar = document.getElementById('myAvatar');
        const profileAvatar = document.getElementById('profileAvatar');
        
        if (myAvatar) {
            myAvatar.src = userData.photoUrl;
            console.log('✅ myAvatar yangilandi:', userData.photoUrl);
        }
        if (profileAvatar) {
            profileAvatar.src = userData.photoUrl;
            console.log('✅ profileAvatar yangilandi');
        }
        
        // Ismlar
        const myName = document.getElementById('myName');
        const profileName = document.getElementById('profileName');
        
        if (myName) {
            myName.textContent = userData.firstName;
            console.log('✅ myName yangilandi:', userData.firstName);
        }
        if (profileName) {
            profileName.textContent = userData.firstName;
            console.log('✅ profileName yangilandi');
        }
        
        // Usernamelar
        const myUsername = document.getElementById('myUsername');
        const profileUsername = document.getElementById('profileUsername');
        
        if (myUsername) {
            myUsername.textContent = userData.username ? `@${userData.username}` : `@${userData.firstName.toLowerCase().replace(' ', '_')}`;
            console.log('✅ myUsername yangilandi');
        }
        if (profileUsername) {
            profileUsername.textContent = userData.username ? `@${userData.username}` : `@${userData.firstName.toLowerCase().replace(' ', '_')}`;
            console.log('✅ profileUsername yangilandi');
        }
        
        // Gender badge qo'shish
        if (userState.hasSelectedGender && userState.currentGender) {
            addGenderBadge(myName, userState.currentGender);
            addGenderBadge(profileName, userState.currentGender);
            console.log('✅ Gender badge qo\'shildi');
        }
        
        // Start tugmasini sozlash
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            if (userState.hasSelectedGender) {
                startBtn.disabled = false;
                startBtn.textContent = '🎮 O\'yinni Boshlash';
                startBtn.classList.remove('disabled');
                console.log('✅ Start tugmasi yoqildi');
            } else {
                startBtn.disabled = true;
                startBtn.textContent = 'Avval gender tanlang';
                startBtn.classList.add('disabled');
                console.log('⚠️ Start tugmasi gender kutilmoqda');
            }
        }
        
    } catch (error) {
        console.error('❌ UI yangilash xatosi:', error);
    }
}

// ==================== STATISTIKANI YANGILASH ====================
function updateStats() {
    console.log('📊 Statistika yangilanmoqda...');
    
    try {
        // Header statistikasi
        const coinsCount = document.getElementById('coinsCount');
        const levelCount = document.getElementById('levelCount');
        const superLikeCount = document.getElementById('superLikeCount');
        
        if (coinsCount) coinsCount.textContent = userState.coins;
        if (levelCount) levelCount.textContent = userState.level;
        if (superLikeCount) superLikeCount.textContent = userState.dailySuperLikes;
        
        // Profile statistikasi
        const shopCoinsCount = document.getElementById('shopCoinsCount');
        const statRating = document.getElementById('statRating');
        const statMatches = document.getElementById('statMatches');
        const myMatches = document.getElementById('myMatches');
        const statDuels = document.getElementById('statDuels');
        const myDuels = document.getElementById('myDuels');
        
        if (shopCoinsCount) shopCoinsCount.textContent = userState.coins;
        if (statRating) statRating.textContent = userState.rating;
        if (statMatches) statMatches.textContent = userState.matches;
        if (myMatches) myMatches.textContent = userState.matches;
        if (statDuels) statDuels.textContent = userState.duels;
        if (myDuels) myDuels.textContent = userState.duels;
        
        // Win rate
        const statWinRate = document.getElementById('statWinRate');
        if (statWinRate) {
            const winRate = userState.duels > 0 ? Math.round((userState.wins / userState.duels) * 100) : 0;
            statWinRate.textContent = winRate + '%';
        }
        
        // Likes
        const myLikes = document.getElementById('myLikes');
        if (myLikes) myLikes.textContent = userState.totalLikes;
        
        // XP
        const profileXP = document.getElementById('profileXP');
        if (profileXP) profileXP.textContent = `${userState.xp}/${userState.level * 100}`;
        
        // Bio
        const profileBioText = document.getElementById('profileBioText');
        if (profileBioText) profileBioText.textContent = userState.userBio || 'Bio kiritilmagan';
        
        console.log('✅ Statistika yangilandi');
        
    } catch (error) {
        console.error('❌ Statistika yangilash xatosi:', error);
    }
}

// ==================== GENDER BADGE QO'SHISH ====================
function addGenderBadge(element, gender) {
    if (!element || !gender) return;
    
    try {
        // Avvalgi badge larni o'chirish
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
        console.log('✅ Gender badge qo\'shildi:', gender);
        
    } catch (error) {
        console.error('❌ Gender badge qo\'shish xatosi:', error);
    }
}

// ==================== SERVERGA ULANISH ====================
function connectToServer() {
    console.log('🔗 Serverga ulanmoqda...');
    
    if (gameState.socket && gameState.isConnected) {
        console.log('⚠️ Allaqachon ulangan');
        return;
    }
    
    // URL aniqlash
    const socketUrl = 'http://localhost:3000'; // Local test uchun
    
    console.log('🔌 Socket URL:', socketUrl);
    
    try {
        // Socket.IO ulanishini yaratish
        gameState.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });
        
        // ==================== SOCKET EVENTLARI ====================
        gameState.socket.on('connect', () => {
            console.log('✅ Serverga ulandi! Socket ID:', gameState.socket.id);
            gameState.isConnected = true;
            
            // Foydalanuvchi ma'lumotlarini yuborish
            const myName = document.getElementById('myName')?.textContent || 'Foydalanuvchi';
            const myUsername = document.getElementById('myUsername')?.textContent?.replace('@', '') || 'foydalanuvchi';
            const myAvatar = document.getElementById('myAvatar')?.src || 'https://api.dicebear.com/7.x/avataaars/svg?name=User';
            
            // Autentifikatsiya
            gameState.socket.emit('auth', {
                userId: `test_${Date.now()}`,
                firstName: myName,
                username: myUsername,
                photoUrl: myAvatar,
                gender: userState.currentGender,
                hasSelectedGender: userState.hasSelectedGender
            });
            
            console.log(`🔐 Auth yuborildi: ${myName}`);
        });
        
        gameState.socket.on('auth_ok', (data) => {
            console.log('✅ Autentifikatsiya muvaffaqiyatli', data);
            gameState.playerData = data;
            
            // UserState yangilash
            userState.currentGender = data.gender;
            userState.hasSelectedGender = data.hasSelectedGender;
            
            saveUserStateToLocalStorage();
            
            // Gender badge qo'shish
            if (userState.hasSelectedGender && userState.currentGender) {
                addGenderBadge(document.getElementById('myName'), userState.currentGender);
                addGenderBadge(document.getElementById('profileName'), userState.currentGender);
            }
            
            // Start tugmasini yoqish
            const startBtn = document.getElementById('startBtn');
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = '🎮 O\'yinni Boshlash';
                startBtn.classList.remove('disabled');
            }
            
            // Welcome screen ni ko'rsatish
            showScreen('welcome');
            showNotification('✅ Ulanish', 'Serverga muvaffaqiyatli ulandik!');
            
        });
        
        gameState.socket.on('show_gender_selection', (data) => {
            console.log('⚠️ Gender tanlash talab qilinmoqda');
            showGenderModal(true);
        });
        
        gameState.socket.on('error', (data) => {
            console.error('❌ Xato:', data);
            showNotification('Xato', data.message || 'Noma\'lum xato');
        });
        
        gameState.socket.on('disconnect', () => {
            console.log('❌ Serverdan uzildi');
            gameState.isConnected = false;
            showNotification('🔌 Ulanish uzildi', 'Serverga qayta ulanmoqda...');
        });
        
    } catch (error) {
        console.error('❌ Socket ulanish xatosi:', error);
        showNotification('Xato', 'Serverga ulanib bo\'lmadi. Local test rejimida ishlaymiz.');
        
        // Local test rejimi
        simulateLocalTest();
    }
}

// ==================== LOCAL TEST FUNCTIONS ====================
function simulateLocalTest() {
    console.log('🔄 Local test rejimi ishga tushirilmoqda...');
    
    // UI ni yangilash
    showScreen('welcome');
    
    // Start tugmasini sozlash
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.onclick = () => {
            if (!userState.hasSelectedGender) {
                showGenderModal(true);
                return;
            }
            
            // Simulate queue
            gameState.isInQueue = true;
            showScreen('queue');
            document.getElementById('queueStatus').textContent = 'Raqib izlanmoqda...';
            
            // Simulate finding opponent
            setTimeout(() => {
                gameState.isInQueue = false;
                gameState.isInDuel = true;
                showScreen('duel');
                
                // Random opponent
                const opponents = [
                    { name: 'Ali Valiyev', rating: 1520, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali' },
                    { name: 'Malika Alimova', rating: 1480, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Malika' },
                    { name: 'Bekzod Hasanov', rating: 1550, photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bekzod' }
                ];
                
                const opponent = opponents[Math.floor(Math.random() * opponents.length)];
                
                document.getElementById('opponentAvatar').src = opponent.photo;
                document.getElementById('opponentName').textContent = opponent.name;
                document.getElementById('opponentRating').textContent = opponent.rating;
                
                // Timer
                startTimer();
                
            }, 2000);
        };
        
        startBtn.disabled = false;
        startBtn.textContent = '🎮 O\'yinni Boshlash';
        startBtn.classList.remove('disabled');
    }
    
    // Voting buttons
    document.getElementById('noBtn').onclick = () => simulateVote('skip');
    document.getElementById('likeBtn').onclick = () => simulateVote('like');
    document.getElementById('superLikeBtn').onclick = () => simulateVote('super_like');
    
    showNotification('ℹ️ Local Test', 'Server ulanmagan. Local test rejimida ishlaymiz.');
}

function simulateVote(choice) {
    if (!gameState.isInDuel) return;
    
    console.log(`🗳️ Ovoz berish: ${choice}`);
    
    // Tugmalarni bloklash
    ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
    
    // Simulate response
    setTimeout(() => {
        gameState.isInDuel = false;
        
        if (Math.random() > 0.5) { // 50% match bo'lish ehtimoli
            // MATCH
            showScreen('match');
            document.getElementById('partnerName').textContent = 'Test Opponent';
            document.getElementById('partnerNameText').textContent = 'Test Opponent';
            document.getElementById('partnerAvatar').src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Opponent';
            
            // Update stats
            userState.coins += 50;
            userState.xp += 30;
            userState.matches++;
            userState.duels++;
            userState.wins++;
            userState.totalLikes++;
            updateStats();
            saveUserStateToLocalStorage();
            
            showNotification('🎉 MATCH!', 'Raqib ham sizni like berdi! +50 coin');
        } else {
            // No match
            showScreen('queue');
            userState.duels++;
            updateStats();
            saveUserStateToLocalStorage();
            
            if (choice === 'like' || choice === 'super_like') {
                showNotification('❤️ Like berdidingiz', 'Raqib sizni like bermadi');
            } else {
                showNotification('😔 O\'tkazib yubordingiz', 'Keyingi duelga tayyorlanaylik!');
            }
        }
    }, 1000);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('🔌 Event listenerlar o\'rnatilmoqda...');
    
    try {
        // Start button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('🎮 Start bosildi');
                
                if (!userState.hasSelectedGender) {
                    showGenderModal(true);
                    showNotification('Diqqat', 'Avval gender tanlashingiz kerak!');
                    return;
                }
                
                if (!gameState.isConnected) {
                    connectToServer();
                } else {
                    gameState.socket.emit('enter_queue');
                    showScreen('queue');
                }
            });
        }
        
        // Gender tanlash tugmalari
        document.querySelectorAll('.gender-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const gender = btn.getAttribute('data-gender');
                selectGender(gender);
            });
        });
        
        // Gender option cardlar
        document.querySelectorAll('.gender-option-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const gender = card.getAttribute('data-gender');
                selectGender(gender);
            });
        });
        
        // Close gender modal
        const closeGenderModal = document.getElementById('closeGenderModal');
        if (closeGenderModal) {
            closeGenderModal.addEventListener('click', hideGenderModal);
        }
        
        // Ovoz berish tugmalari
        const noBtn = document.getElementById('noBtn');
        const likeBtn = document.getElementById('likeBtn');
        const superLikeBtn = document.getElementById('superLikeBtn');
        
        if (noBtn) noBtn.addEventListener('click', () => handleVote('skip'));
        if (likeBtn) likeBtn.addEventListener('click', () => handleVote('like'));
        if (superLikeBtn) superLikeBtn.addEventListener('click', () => handleVote('super_like'));
        
        // Leave queue button
        const leaveQueueBtn = document.getElementById('leaveQueueBtn');
        if (leaveQueueBtn) {
            leaveQueueBtn.addEventListener('click', () => {
                gameState.isInQueue = false;
                showScreen('welcome');
                showNotification('🚪', 'Navbatdan chiqdingiz');
            });
        }
        
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (gameState.isInDuel || gameState.isInChat) {
                    showNotification('Diqqat', 'Duel yoki chat davom etayotganida menyu o\'zgartirib bo\'lmaydi');
                    return;
                }
                
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId + 'Tab').classList.add('active');
            });
        });
        
        console.log('✅ Event listenerlar o\'rnatildi');
        
    } catch (error) {
        console.error('❌ Event listenerlarni o\'rnatish xatosi:', error);
    }
}

// ==================== GENDER TANLASH ====================
function selectGender(gender) {
    console.log(`🎯 Gender tanlash: ${gender}`);
    
    userState.currentGender = gender;
    userState.hasSelectedGender = true;
    
    saveUserStateToLocalStorage();
    
    // Gender badge qo'shish
    addGenderBadge(document.getElementById('myName'), gender);
    addGenderBadge(document.getElementById('profileName'), gender);
    
    // Start tugmasini yoqish
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = '🎮 O\'yinni Boshlash';
        startBtn.classList.remove('disabled');
    }
    
    hideGenderModal();
    
    // Serverga bildirish
    if (gameState.socket && gameState.isConnected) {
        gameState.socket.emit('select_gender', { gender: gender });
    }
    
    showNotification('🎉 Jins tanlandi', 
        gender === 'male' ? 'Faqat ayollar bilan duel!' : 
        gender === 'female' ? 'Faqat erkaklar bilan duel!' : 
        'Hamma bilan duel!');
}

// ==================== MODAL FUNKSIYALARI ====================
function showGenderModal(mandatory = true) {
    console.log('🔄 Gender modalni ko\'rsatish');
    document.getElementById('genderModal').classList.add('active');
}

function hideGenderModal() {
    console.log('🔄 Gender modalni yashirish');
    document.getElementById('genderModal').classList.remove('active');
}

// ==================== EKRANLARNI ALMASHTIRISH ====================
function showScreen(screen) {
    console.log(`🔄 Ekran o'zgartirish: ${screen}`);
    
    const screens = ['welcomeScreen', 'queueScreen', 'duelScreen', 'matchScreen'];
    
    screens.forEach(screenId => {
        const element = document.getElementById(screenId);
        if (element) element.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screen + 'Screen');
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        console.log(`✅ ${screen} ekrani ko'rsatildi`);
    } else {
        console.error(`❌ Ekran topilmadi: ${screen}Screen`);
    }
}

// ==================== TIMER FUNKSIYASI ====================
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timeLeft = 20;
    
    const timer = document.getElementById('timer');
    if (timer) {
        timer.textContent = 20;
        timer.style.color = '#fff';
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        if (timer) timer.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 5 && timer) {
            timer.style.color = '#ff4444';
        }
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
            // Timeout handler
            if (gameState.isInDuel) {
                gameState.isInDuel = false;
                showScreen('queue');
                showNotification('⏰ Vaqt tugadi', 'Duel vaqti tugadi');
            }
        }
    }, 1000);
}

// ==================== OVOZ BERISH ====================
function handleVote(choice) {
    if (!gameState.isInDuel) {
        console.log('❌ Vote qilish mumkin emas: duel emas');
        return;
    }
    
    console.log(`🗳️ Ovoz berish: ${choice}`);
    
    // Tugmalarni bloklash
    ['noBtn', 'likeBtn', 'superLikeBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
    
    // SUPER LIKE limit tekshirish
    if (choice === 'super_like' && userState.dailySuperLikes <= 0) {
        showNotification('Limit tugadi', 'Kunlik SUPER LIKE limitingiz tugadi');
        return;
    }
    
    // Serverga yuborish
    if (gameState.socket && gameState.isConnected && gameState.currentDuelId) {
        gameState.socket.emit('vote', { 
            duelId: gameState.currentDuelId, 
            choice: choice 
        });
    } else {
        // Local test uchun
        simulateVote(choice);
    }
    
    // Timer textni o'zgartirish
    const timer = document.getElementById('timer');
    const duelStatus = document.getElementById('duelStatus');
    
    if (timer) {
        if (choice === 'like') timer.textContent = '❤️';
        else if (choice === 'super_like') timer.textContent = '💖';
        else timer.textContent = '✖';
    }
}

// ==================== NOTIFIKATSIYA ====================
function showNotification(title, message) {
    console.log(`📢 ${title}: ${message}`);
    
    // Oddiy alert orqali (browser notification ishlamasa)
    alert(`${title}\n${message}`);
}

// ==================== LOCALSTORAGE FUNCTIONS ====================
function saveUserStateToLocalStorage() {
    localStorage.setItem('userGender', userState.currentGender || '');
    localStorage.setItem('hasSelectedGender', userState.hasSelectedGender.toString());
    localStorage.setItem('userCoins', userState.coins.toString());
    localStorage.setItem('userLevel', userState.level.toString());
    localStorage.setItem('userRating', userState.rating.toString());
    localStorage.setItem('userXP', userState.xp.toString());
    localStorage.setItem('userMatches', userState.matches.toString());
    localStorage.setItem('userDuels', userState.duels.toString());
    localStorage.setItem('userWins', userState.wins.toString());
    localStorage.setItem('userTotalLikes', userState.totalLikes.toString());
    localStorage.setItem('userDailySuperLikes', userState.dailySuperLikes.toString());
    localStorage.setItem('userName', userState.userName || '');
    localStorage.setItem('userPhoto', userState.userPhoto || '');
    localStorage.setItem('userBio', userState.userBio || '');
}

console.log('✅ main.js yuklandi');