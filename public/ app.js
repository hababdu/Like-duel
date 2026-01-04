// app.js faylini yarating (asosiy initialization)
class LikeDuelApp {
    constructor() {
        this.version = '2.0.0';
        this.isInitialized = false;
        this.components = {};
    }
    
    async initialize() {
        console.log(`🚀 Like Duel App v${this.version} initializing...`);
        
        try {
            // 1. Load state manager first
            this.components.stateManager = window.gameStateManager;
            this.components.stateManager.loadState();
            
            // 2. Initialize user
            await this.initializeUser();
            
            // 3. Initialize all systems
            await this.initializeSystems();
            
            // 4. Setup event listeners
            this.setupEventListeners();
            
            // 5. Load initial data
            await this.loadInitialData();
            
            // 6. Check for updates
            this.checkForUpdates();
            
            // 7. Show welcome screen
            this.showWelcomeScreen();
            
            this.isInitialized = true;
            console.log('✅ App initialized successfully');
            
            // Send analytics
            this.sendAnalytics('app_start');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showErrorScreen(error);
        }
    }
    
    async initializeUser() {
        console.log('👤 Initializing user...');
        
        // Get Telegram user
        let tgUser = {};
        
        try {
            if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
                tgUser = Telegram.WebApp.initDataUnsafe.user || {};
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                Telegram.WebApp.enableClosingConfirmation();
                
                // Set theme colors
                this.applyTelegramTheme();
            }
        } catch (error) {
            console.log('ℹ️ Telegram not available, using test mode');
        }
        
        // Test mode fallback
        if (!tgUser.id) {
            tgUser = {
                id: 'test_' + Date.now(),
                first_name: 'Test User',
                username: 'test_user',
                photo_url: null,
                language_code: 'uz'
            };
        }
        
        // Set global user
        window.tgUserGlobal = tgUser;
        
        // Initialize user state
        this.initializeUserState(tgUser);
        
        // Update UI
        if (window.uiManager) {
            window.uiManager.initUserProfile();
        }
        
        console.log('✅ User initialized:', tgUser.first_name);
    }
    
    initializeUserState(tgUser) {
        // Load from localStorage
        const savedState = localStorage.getItem('userState');
        if (savedState) {
            window.userState = { ...window.userState, ...JSON.parse(savedState) };
        }
        
        // Set Telegram data
        window.userState.id = tgUser.id;
        window.userState.telegramUsername = tgUser.username;
        
        // Set default values if not exist
        window.userState.coins = window.userState.coins || 100;
        window.userState.level = window.userState.level || 1;
        window.userState.rating = window.userState.rating || 1500;
        window.userState.xp = window.userState.xp || 0;
        window.userState.matches = window.userState.matches || 0;
        window.userState.duels = window.userState.duels || 0;
        window.userState.wins = window.userState.wins || 0;
        window.userState.totalLikes = window.userState.totalLikes || 0;
        window.userState.dailySuperLikes = window.userState.dailySuperLikes || 3;
        window.userState.bio = window.userState.bio || '';
        window.userState.filter = window.userState.filter || 'not_specified';
        window.userState.mutualMatchesCount = window.userState.mutualMatchesCount || 0;
        window.userState.friendsCount = window.userState.friendsCount || 0;
        
        // Check gender selection
        window.userState.hasSelectedGender = window.userState.currentGender !== null;
        
        // Save back
        localStorage.setItem('userState', JSON.stringify(window.userState));
    }
    
    async initializeSystems() {
        console.log('⚙️ Initializing systems...');
        
        // Initialize quest system
        if (window.questSystem) {
            window.questSystem.checkDailyReset();
            window.questSystem.loadQuests();
            window.questSystem.updateUI();
        }
        
        // Initialize achievement system
        if (window.achievementSystem) {
            window.achievementSystem.loadAchievements();
            window.achievementSystem.updateUI();
            
            // Check existing achievements
            this.checkExistingAchievements();
        }
        
        // Initialize socket manager
        if (window.improvedSocketManager) {
            // Don't auto-connect, wait for user action
            console.log('✅ Socket manager ready');
        }
        
        // Initialize game logic
        if (window.improvedGameLogic) {
            console.log('✅ Game logic ready');
        }
        
        console.log('✅ All systems initialized');
    }
    
    checkExistingAchievements() {
        if (!window.achievementSystem) return;
        
        // Check for achievements based on current stats
        window.achievementSystem.checkAchievements('duels_10', window.userState.duels);
        window.achievementSystem.checkAchievements('likes_50', window.userState.totalLikes);
        window.achievementSystem.checkAchievements('friends_5', window.userState.friendsCount);
        window.achievementSystem.checkAchievements('rating_2000', window.userState.rating);
        window.achievementSystem.checkAchievements('superlikes_20', 
            window.userState.totalSuperLikes || 0);
    }
    
    setupEventListeners() {
        console.log('🎮 Setting up event listeners...');
        
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onPageHidden();
            } else {
                this.onPageVisible();
            }
        });
        
        // Online/offline
        window.addEventListener('online', () => {
            this.onConnectionRestored();
        });
        
        window.addEventListener('offline', () => {
            this.onConnectionLost();
        });
        
        // Before unload
        window.addEventListener('beforeunload', (e) => {
            this.onBeforeUnload(e);
        });
        
        // Resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
        
        console.log('✅ Event listeners set up');
    }
    
    async loadInitialData() {
        console.log('📊 Loading initial data...');
        
        // Load friends list
        if (window.uiManager) {
            window.uiManager.loadFriendsList();
        }
        
        // Load shop items
        if (window.uiManager) {
            window.uiManager.loadShopItems();
        }
        
        // Load leaderboard
        if (window.uiManager) {
            window.uiManager.loadLeaderboard();
        }
        
        // Load quests UI
        if (window.uiManager) {
            window.uiManager.loadProfileQuests();
        }
        
        console.log('✅ Initial data loaded');
    }
    
    showWelcomeScreen() {
        console.log('🏠 Showing welcome screen...');
        
        // Show welcome screen
        if (window.uiManager) {
            window.uiManager.showScreen('welcome');
        }
        
        // Update stats
        if (window.uiManager) {
            window.uiManager.updateUIFromUserState();
        }
        
        // Check if gender is selected
        if (!window.userState.hasSelectedGender) {
            setTimeout(() => {
                if (window.modalManager) {
                    window.modalManager.showGenderModal(true);
                }
            }, 1000);
        }
    }
    
    showErrorScreen(error) {
        console.error('🚨 Showing error screen:', error);
        
        const errorScreen = document.createElement('div');
        errorScreen.className = 'error-screen';
        errorScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            text-align: center;
        `;
        
        errorScreen.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h2 style="color: #e74c3c; margin-bottom: 15px;">Xato yuz berdi</h2>
                <p style="color: #ccc; margin-bottom: 20px;">
                    Dasturni ishga tushirishda muammo yuz berdi.
                </p>
                <p style="color: #999; font-size: 0.9rem; margin-bottom: 25px;">
                    ${error.message || 'Nomalum xato'}
                </p>
                <button onclick="location.reload()" 
                        style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); 
                               color: white; border: none; padding: 12px 24px; 
                               border-radius: 25px; font-size: 1rem; cursor: pointer;">
                    🔄 Qayta Yuklash
                </button>
                <div style="margin-top: 20px;">
                    <button onclick="window.supportEmail()" 
                            style="background: transparent; color: #3498db; 
                                   border: 1px solid #3498db; padding: 8px 16px; 
                                   border-radius: 20px; font-size: 0.9rem; cursor: pointer;">
                        📧 Yordam
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorScreen);
    }
    
    // Event handlers
    onPageHidden() {
        console.log('📱 Page hidden');
        
        // Pause timers
        if (window.gameStateManager) {
            window.gameStateManager.clearTimers();
        }
        
        // Disconnect socket if not in duel
        if (window.improvedSocketManager && 
            !window.gameStateManager.getState().isInDuel) {
            window.improvedSocketManager.disconnect();
        }
    }
    
    onPageVisible() {
        console.log('📱 Page visible');
        
        // Resume if needed
        if (window.gameStateManager.getState().isInDuel) {
            // Resume timer logic
        }
    }
    
    onConnectionLost() {
        console.log('📡 Connection lost');
        
        window.showNotification?.('Internet aloqasi uzildi', 
            'Iltimos, internet aloqasini tekshiring');
    }
    
    onConnectionRestored() {
        console.log('📡 Connection restored');
        
        window.showNotification?.('Internet aloqasi tiklandi', 
            'Dastur qayta ishga tushirilmoqda...');
        
        // Reinitialize connection
        setTimeout(() => {
            if (window.gameStateManager.getState().isInQueue) {
                if (window.improvedSocketManager) {
                    window.improvedSocketManager.connectToServer();
                }
            }
        }, 2000);
    }
    
    onBeforeUnload(e) {
        console.log('👋 Page unloading');
        
        // Save state
        if (window.gameStateManager) {
            window.gameStateManager.saveState();
        }
        
        // Send analytics
        this.sendAnalytics('app_close');
        
        // Show confirmation if in duel
        if (window.gameStateManager.getState().isInDuel) {
            e.preventDefault();
            e.returnValue = 'Duel davom etmoqda. Chiqishni istaysizmi?';
            return e.returnValue;
        }
    }
    
    onWindowResize() {
        // Handle responsive adjustments
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }
    
    // Utility methods
    applyTelegramTheme() {
        if (!Telegram.WebApp) return;
        
        const theme = Telegram.WebApp.colorScheme;
        const bgColor = Telegram.WebApp.backgroundColor;
        const textColor = Telegram.WebApp.textColor;
        
        if (bgColor) {
            document.documentElement.style.setProperty('--tg-bg-color', bgColor);
        }
        
        if (textColor) {
            document.documentElement.style.setProperty('--tg-text-color', textColor);
        }
        
        // Apply dark/light mode
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
    
    checkForUpdates() {
        // Check if new version available
        const lastVersion = localStorage.getItem('lastVersion');
        
        if (lastVersion !== this.version) {
            console.log(`🆕 New version: ${this.version}`);
            
            // Show update notification
            setTimeout(() => {
                window.showNotification?.('Yangilanish', 
                    `Dastur yangilandi! Yangi xususiyatlar qo'shildi.`);
            }, 3000);
            
            // Update stored version
            localStorage.setItem('lastVersion', this.version);
        }
    }
    
    sendAnalytics(event, data = {}) {
        // Send analytics data
        const analyticsData = {
            event,
            userId: window.userState.id,
            timestamp: Date.now(),
            version: this.version,
            ...data
        };
        
        console.log('📊 Analytics:', analyticsData);
        
        // Here you would send to your analytics server
        // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(analyticsData) });
    }
    
    supportEmail() {
        const email = 'support@likeduel.uz';
        const subject = 'Like Duel Support';
        const body = `Foydalanuvchi ID: ${window.userState.id}\n\nMuammo tavsifi:`;
        
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.openLink(mailtoLink);
        } else {
            window.open(mailtoLink, '_blank');
        }
    }
    
    // Public API
    startGame() {
        if (!this.isInitialized) {
            console.error('❌ App not initialized');
            return;
        }
        
        console.log('🎮 Starting game...');
        
        // Check gender
        if (!window.userState.hasSelectedGender) {
            window.modalManager?.showGenderModal?.(true);
            return;
        }
        
        // Connect to server and start
        if (window.improvedSocketManager) {
            window.improvedSocketManager.connectToServer().then(connected => {
                if (connected) {
                    window.improvedSocketManager.enterQueue();
                }
            });
        }
    }
    
    getStats() {
        return {
            user: { ...window.userState },
            game: window.gameStateManager?.getState().gameStats,
            quests: window.questSystem?.quests,
            achievements: window.achievementSystem?.achievements.filter(a => a.unlocked)
        };
    }
    
    resetData() {
        if (confirm('Barcha ma\'lumotlarni o\'chirishni istaysizmi? Bu amalni bekor qilib bo\'lmaydi.')) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM loaded, starting app...');
    
    // Create app instance
    window.likeDuelApp = new LikeDuelApp();
    
    // Initialize app
    await window.likeDuelApp.initialize();
    
    // Make app globally available
    console.log('✅ Like Duel App ready!');
});