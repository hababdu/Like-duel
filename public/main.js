// ==================== IMPROVED GAME STATE ====================
const modernGameState = {
    socket: null,
    isConnected: false,
    currentScreen: 'welcome',
    userData: null,
    duelTimer: null,
    animationFrame: null,
    theme: 'dark',
    soundEnabled: true,
    hapticEnabled: true,
    spinWheelSpinning: false,
    dailySpinAvailable: true,
    currentStreak: 0,
    matchHistory: []
};

// ==================== SOUND MANAGER ====================
class SoundManager {
    constructor() {
        this.sounds = {
            like: document.getElementById('likeSound'),
            match: document.getElementById('matchSound'),
            click: document.getElementById('clickSound'),
            timer: document.getElementById('timerSound')
        };
        this.enabled = modernGameState.soundEnabled;
    }

    play(soundName) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        modernGameState.soundEnabled = this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }
}

// ==================== HAPTIC FEEDBACK ====================
class HapticManager {
    constructor() {
        this.enabled = modernGameState.hapticEnabled && 'vibrate' in navigator;
    }

    vibrate(pattern = [50]) {
        if (!this.enabled) return;
        
        try {
            if (typeof navigator.vibrate === 'function') {
                navigator.vibrate(pattern);
            }
        } catch (e) {
            console.log('Vibration not supported');
        }
    }

    likeVibration() {
        this.vibrate([30, 50, 30]);
    }

    matchVibration() {
        this.vibrate([100, 50, 100, 50, 100]);
    }

    toggle() {
        this.enabled = !this.enabled;
        modernGameState.hapticEnabled = this.enabled;
        localStorage.setItem('hapticEnabled', this.enabled);
        return this.enabled;
    }
}

// ==================== ANIMATION MANAGER ====================
class AnimationManager {
    static createBubble(x, y, text, color) {
        const bubble = document.createElement('div');
        bubble.className = 'feedback-bubble';
        bubble.textContent = text;
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        bubble.style.color = color;
        
        document.body.appendChild(bubble);
        
        // Animate bubble
        bubble.animate([
            { transform: 'translateY(0) scale(0.8)', opacity: 0 },
            { transform: 'translateY(-30px) scale(1.2)', opacity: 1 },
            { transform: 'translateY(-60px) scale(1)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
        }).onfinish = () => bubble.remove();
    }

    static animateTimerLiquid(seconds) {
        const liquidFill = document.querySelector('.liquid-fill');
        if (!liquidFill) return;
        
        const percentage = (20 - seconds) / 20 * 100;
        liquidFill.style.height = `${percentage}%`;
        
        // Change color based on time
        if (seconds <= 5) {
            liquidFill.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #c44569 100%)';
        } else if (seconds <= 10) {
            liquidFill.style.background = 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)';
        } else {
            liquidFill.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }

    static animateProgressBar(progressBar, percentage, duration = 500) {
        const fill = progressBar.querySelector('.progress-fill');
        if (!fill) return;
        
        fill.animate([
            { width: fill.style.width },
            { width: `${percentage}%` }
        ], {
            duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
    }
}

// ==================== THEME MANAGER ====================
class ThemeManager {
    static themes = {
        dark: {
            '--dark-bg': '#0f0f23',
            '--card-bg': 'rgba(255, 255, 255, 0.08)',
            '--card-border': 'rgba(255, 255, 255, 0.1)',
            '--text-primary': '#ffffff',
            '--text-secondary': 'rgba(255, 255, 255, 0.7)'
        },
        light: {
            '--dark-bg': '#f8f9fa',
            '--card-bg': 'rgba(255, 255, 255, 0.9)',
            '--card-border': 'rgba(0, 0, 0, 0.1)',
            '--text-primary': '#333333',
            '--text-secondary': 'rgba(0, 0, 0, 0.6)'
        },
        sunset: {
            '--dark-bg': '#1a1a2e',
            '--card-bg': 'rgba(253, 203, 110, 0.1)',
            '--card-border': 'rgba(253, 203, 110, 0.2)',
            '--text-primary': '#ffffff',
            '--text-secondary': 'rgba(255, 255, 255, 0.7)'
        },
        love: {
            '--dark-bg': '#2d1b2e',
            '--card-bg': 'rgba(245, 87, 108, 0.1)',
            '--card-border': 'rgba(245, 87, 108, 0.2)',
            '--text-primary': '#ffffff',
            '--text-secondary': 'rgba(255, 255, 255, 0.7)'
        }
    };

    static applyTheme(themeName) {
        const theme = this.themes[themeName] || this.themes.dark;
        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });
        modernGameState.theme = themeName;
        localStorage.setItem('appTheme', themeName);
    }

    static cycleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(modernGameState.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.applyTheme(themes[nextIndex]);
        return themes[nextIndex];
    }
}

// ==================== SPIN WHEEL ====================
class SpinWheel {
    constructor(element) {
        this.wheel = element;
        this.items = element.querySelector('.wheel-items');
        this.spinBtn = element.querySelector('.spin-btn');
        this.spinning = false;
        this.rotation = 0;
        
        this.init();
    }

    init() {
        this.spinBtn.addEventListener('click', () => this.spin());
        
        // Check daily spin availability
        const lastSpin = localStorage.getItem('lastSpinDate');
        const today = new Date().toDateString();
        if (lastSpin === today) {
            this.spinBtn.disabled = true;
            this.spinBtn.textContent = 'Ertaga kuting';
        }
    }

    spin() {
        if (this.spinning || !modernGameState.dailySpinAvailable) return;
        
        this.spinning = true;
        modernGameState.spinWheelSpinning = true;
        this.spinBtn.disabled = true;
        
        // Calculate random rotation (3-5 full rotations + random item)
        const fullRotations = 3 + Math.floor(Math.random() * 2);
        const itemAngle = 60; // 6 items = 60° each
        const randomItem = Math.floor(Math.random() * 6);
        const targetRotation = (fullRotations * 360) + (randomItem * itemAngle);
        
        // Animate wheel
        this.rotation = targetRotation;
        this.items.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.3, 1)';
        this.items.style.transform = `rotate(${this.rotation}deg)`;
        
        // Get reward
        setTimeout(() => {
            const rewardItem = this.wheel.querySelector(`.wheel-item:nth-child(${randomItem + 1})`);
            const reward = rewardItem?.dataset.value || '50';
            this.handleReward(reward);
            
            // Save spin date
            localStorage.setItem('lastSpinDate', new Date().toDateString());
            modernGameState.dailySpinAvailable = false;
            
            setTimeout(() => {
                this.spinning = false;
                this.spinBtn.textContent = 'Ertaga kuting';
            }, 1000);
        }, 4000);
    }

    handleReward(reward) {
        const soundManager = new SoundManager();
        const hapticManager = new HapticManager();
        
        soundManager.play('match');
        hapticManager.matchVibration();
        
        let message = '';
        switch(reward) {
            case 'super':
                message = '🎉 Kunlik Super Like +1!';
                userState.dailySuperLikes++;
                break;
            case 'vip':
                message = '👑 24 soatlik VIP status!';
                // Activate VIP status
                break;
            default:
                message = `🪙 ${reward} coin yutib oldingiz!`;
                userState.coins += parseInt(reward);
        }
        
        this.showRewardPopup(message);
        saveUserStateToLocalStorage();
        updateUIFromUserState();
    }

    showRewardPopup(message) {
        const popup = document.createElement('div');
        popup.className = 'reward-popup';
        popup.innerHTML = `
            <div class="reward-popup-content">
                <i class="fas fa-gift"></i>
                <h3>Tabriklaymiz!</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Auto remove after 5 seconds
        setTimeout(() => popup.remove(), 5000);
    }
}

// ==================== ENHANCED MATCH HANDLER ====================
class EnhancedMatchHandler {
    static analyzeMutualInterests(user1, user2) {
        const interests = [];
        
        // Compare ratings
        if (Math.abs(user1.rating - user2.rating) <= 100) {
            interests.push(`Reyting: ${Math.min(user1.rating, user2.rating)}+`);
        }
        
        // Compare match count
        if (user1.matches >= 5 && user2.matches >= 5) {
            interests.push('Match: 5+');
        }
        
        // Compare duel count
        if (user1.duels >= 10 && user2.duels >= 10) {
            interests.push('Duel: 10+');
        }
        
        // Add random common interests
        const randomInterests = [
            'Premium foydalanuvchi',
            'Faol o\'yinchi',
            'Do\'stlik izlovchi',
            'Tajribali duelchi'
        ];
        
        if (interests.length < 3) {
            const randomInterest = randomInterests[Math.floor(Math.random() * randomInterests.length)];
            if (!interests.includes(randomInterest)) {
                interests.push(randomInterest);
            }
        }
        
        return interests.slice(0, 3); // Max 3 interests
    }

    static displayMutualInterests(user1, user2) {
        const interests = this.analyzeMutualInterests(user1, user2);
        const container = document.getElementById('mutualInterests');
        
        if (!container) return;
        
        const tagsContainer = container.querySelector('.interest-tags');
        tagsContainer.innerHTML = interests
            .map(interest => `<span class="interest-tag">${interest}</span>`)
            .join('');
    }
}

// ==================== ENHANCED TIMER ====================
class EnhancedTimer {
    constructor(element, duration, onComplete) {
        this.element = element;
        this.duration = duration;
        this.remaining = duration;
        this.onComplete = onComplete;
        this.interval = null;
        this.running = false;
    }

    start() {
        if (this.running) return;
        
        this.running = true;
        this.remaining = this.duration;
        this.updateDisplay();
        
        this.interval = setInterval(() => {
            this.remaining--;
            this.updateDisplay();
            
            // Animate liquid timer
            AnimationManager.animateTimerLiquid(this.remaining);
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.onComplete) this.onComplete();
            }
        }, 1000);
    }

    stop() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    updateDisplay() {
        if (this.element) {
            this.element.textContent = this.remaining;
        }
        
        // Update liquid timer
        AnimationManager.animateTimerLiquid(this.remaining);
    }

    addTime(seconds) {
        this.remaining += seconds;
        if (this.remaining > this.duration) {
            this.remaining = this.duration;
        }
        this.updateDisplay();
    }
}

// ==================== ENHANCED VOTE BUTTONS ====================
function setupEnhancedVoteButtons() {
    const soundManager = new SoundManager();
    const hapticManager = new HapticManager();
    const buttons = {
        like: document.getElementById('likeBtn'),
        superLike: document.getElementById('superLikeBtn'),
        skip: document.getElementById('noBtn')
    };

    Object.entries(buttons).forEach(([type, button]) => {
        if (!button) return;
        
        button.addEventListener('click', (e) => {
            if (!modernGameState.socket || !gameState.isInDuel) return;
            
            // Play sound
            soundManager.play('click');
            
            // Haptic feedback
            if (type === 'like') hapticManager.likeVibration();
            else if (type === 'superLike') hapticManager.matchVibration();
            else hapticManager.vibrate([30]);
            
            // Create feedback bubble
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            let message = '';
            let color = '';
            
            switch(type) {
                case 'like':
                    message = 'Feeling the Spark!';
                    color = '#ff6b8b';
                    break;
                case 'superLike':
                    message = 'SUPER LIKE!';
                    color = '#f5576c';
                    break;
                case 'skip':
                    message = 'Skipped!';
                    color = '#ff6b6b';
                    break;
            }
            
            AnimationManager.createBubble(x, y, message, color);
            
            // Original vote handling
            handleVote(type === 'skip' ? 'skip' : type === 'superLike' ? 'super_like' : 'like');
        });
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
                button.style.transform = 'translateY(-8px) scale(1.1)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (!button.disabled) {
                button.style.transform = 'translateY(0) scale(1)';
            }
        });
    });
}

// ==================== STREAK SYSTEM ====================
class StreakSystem {
    static incrementStreak(opponentId) {
        const streaks = JSON.parse(localStorage.getItem('matchStreaks') || '{}');
        const lastOpponent = localStorage.getItem('lastMatchOpponent');
        
        if (lastOpponent === opponentId) {
            streaks[opponentId] = (streaks[opponentId] || 0) + 1;
        } else {
            streaks[opponentId] = 1;
        }
        
        localStorage.setItem('lastMatchOpponent', opponentId);
        localStorage.setItem('matchStreaks', JSON.stringify(streaks));
        
        modernGameState.currentStreak = streaks[opponentId] || 1;
        return modernGameState.currentStreak;
    }

    static getStreakBadge(opponentId) {
        const streaks = JSON.parse(localStorage.getItem('matchStreaks') || '{}');
        const streak = streaks[opponentId] || 0;
        
        if (streak >= 3) return `🔥${streak}`;
        if (streak >= 2) return `✨${streak}`;
        return '';
    }
}

// ==================== ENHANCED INITIALIZATION ====================
function enhancedInit() {
    console.log('🚀 Zamonaviy Like Duel yuklanmoqda...');
    
    // Initialize managers
    const soundManager = new SoundManager();
    const hapticManager = new HapticManager();
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('appTheme') || 'dark';
    ThemeManager.applyTheme(savedTheme);
    
    // Initialize spin wheel
    const spinWheel = document.getElementById('spinWheel');
    if (spinWheel) {
        new SpinWheel(spinWheel);
    }
    
    // Setup enhanced vote buttons
    setupEnhancedVoteButtons();
    
    // Initialize tab switching with animations
    setupEnhancedTabNavigation();
    
    // Load saved preferences
    loadUserPreferences();
    
    // Initialize user profile
    initUserProfile();
    
    // Setup enhanced event listeners
    setupEnhancedEventListeners();
    
    // Check for daily reward
    checkDailyReward();
    
    console.log('✅ Zamonaviy Like Duel yuklandi!');
}

function setupEnhancedTabNavigation() {
    const tabs = document.querySelectorAll('.floating-btn');
    const contents = document.querySelectorAll('.content-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to selected
            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            // Play sound
            const soundManager = new SoundManager();
            soundManager.play('click');
            
            // Haptic feedback
            const hapticManager = new HapticManager();
            hapticManager.vibrate([30]);
            
            // Load tab specific content
            switch(tabName) {
                case 'profile':
                    loadEnhancedProfile();
                    break;
                case 'friends':
                    loadEnhancedFriendsList();
                    break;
                case 'shop':
                    loadEnhancedShop();
                    break;
                case 'leaderboard':
                    loadEnhancedLeaderboard();
                    break;
            }
        });
    });
}

function loadEnhancedProfile() {
    // Update profile with animations
    const stats = document.querySelectorAll('.stat-card-lg');
    stats.forEach((stat, index) => {
        setTimeout(() => {
            stat.style.opacity = '0';
            stat.style.transform = 'translateY(20px)';
            
            stat.animate([
                { opacity: 0, transform: 'translateY(20px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], {
                duration: 300,
                delay: index * 100,
                fill: 'forwards',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });
        }, index * 100);
    });
    
    // Load enhanced quests
    loadEnhancedQuests();
}

function loadEnhancedQuests() {
    const quests = [
        { id: 1, title: '3 ta duel o\'ynash', progress: Math.min(userState.duels, 3), total: 3, reward: 50 },
        { id: 2, title: '5 ta like berish', progress: Math.min(userState.totalLikes, 5), total: 5, reward: 30 },
        { id: 3, title: '1 ta match olish', progress: Math.min(userState.matches, 1), total: 1, reward: 100 },
        { id: 4, title: '1 ta do\'st orttirish', progress: Math.min(userState.mutualMatchesCount, 1), total: 1, reward: 200 }
    ];
    
    const container = document.getElementById('profileQuestsList');
    if (!container) return;
    
    container.innerHTML = quests.map(quest => `
        <div class="quest-item enhanced" data-quest-id="${quest.id}">
            <div class="quest-info">
                <div class="quest-title">${quest.title}</div>
                <div class="quest-progress">${quest.progress}/${quest.total}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(quest.progress / quest.total) * 100}%"></div>
                </div>
            </div>
            <div class="quest-reward ${quest.progress >= quest.total ? 'completed' : ''}">
                <i class="fas fa-coins"></i> ${quest.reward}
            </div>
        </div>
    `).join('');
}

function setupEnhancedEventListeners() {
    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const newTheme = ThemeManager.cycleTheme();
            showNotification('🎨 Mavzu', `${newTheme} mavzusi aktiv`);
        });
    }
    
    // Sound toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
        const soundManager = new SoundManager();
        soundBtn.addEventListener('click', () => {
            const enabled = soundManager.toggle();
            soundBtn.innerHTML = enabled ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
            showNotification('🔊 Ovoz', enabled ? 'Yoqildi' : 'O\'chirildi');
        });
    }
    
    // Haptic toggle
    const hapticBtn = document.getElementById('hapticToggleBtn');
    if (hapticBtn) {
        const hapticManager = new HapticManager();
        hapticBtn.addEventListener('click', () => {
            const enabled = hapticManager.toggle();
            hapticBtn.innerHTML = enabled ? 
                '<i class="fas fa-vibrate"></i>' : 
                '<i class="fas fa-ban"></i>';
            showNotification('📳 Vibratsiya', enabled ? 'Yoqildi' : 'O\'chirildi');
        });
    }
}

function checkDailyReward() {
    const lastReward = localStorage.getItem('lastDailyReward');
    const today = new Date().toDateString();
    
    if (lastReward !== today) {
        // Show daily reward popup
        setTimeout(() => {
            showDailyRewardPopup();
        }, 2000);
    }
}

function showDailyRewardPopup() {
    const popup = document.createElement('div');
    popup.className = 'daily-reward-popup';
    popup.innerHTML = `
        <div class="reward-content">
            <div class="reward-icon">
                <i class="fas fa-calendar-day"></i>
            </div>
            <h3>Kunlik Sovg'a!</h3>
            <p>Bugunlik 50 bepul coin oling!</p>
            <button class="claim-reward-btn">
                <i class="fas fa-gift"></i> Olib olish
            </button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    const claimBtn = popup.querySelector('.claim-reward-btn');
    claimBtn.addEventListener('click', () => {
        userState.coins += 50;
        saveUserStateToLocalStorage();
        updateUIFromUserState();
        
        localStorage.setItem('lastDailyReward', new Date().toDateString());
        
        popup.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.5)', opacity: 0 }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        }).onfinish = () => popup.remove();
        
        showNotification('🎁 Sovg\'a', '50 coin olib olindi!');
    });
}

// ==================== ENHANCED MATCH HANDLING ====================
function enhancedHandleMatch(data) {
    const soundManager = new SoundManager();
    const hapticManager = new HapticManager();
    
    // Play celebration sounds
    soundManager.play('match');
    hapticManager.matchVibration();
    
    // Update streak
    const streak = StreakSystem.incrementStreak(data.partner.id);
    if (streak > 1) {
        data.partner.streak = streak;
    }
    
    // Show mutual interests
    EnhancedMatchHandler.displayMutualInterests(userState, data.partner);
    
    // Enhanced confetti
    if (typeof confetti === 'function') {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    angle: 60 + (i * 60),
                    spread: 70,
                    origin: { x: 0.5, y: 0.5 },
                    colors: ['#667eea', '#f5576c', '#f6d365', '#4facfe']
                });
            }, i * 300);
        }
    }
    
    // Add to match history
    modernGameState.matchHistory.unshift({
        partner: data.partner.name,
        time: new Date(),
        mutual: data.isMutual,
        streak: streak
    });
    
    // Keep only last 10 matches
    modernGameState.matchHistory = modernGameState.matchHistory.slice(0, 10);
    
    // Call original handleMatch
    handleMatch(data);
}

// ==================== ENHANCED NOTIFICATION ====================
function showEnhancedNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `enhanced-notification ${type}`;
    
    const icons = {
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-times-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const container = document.getElementById('notificationCenter') || createNotificationContainer();
    container.appendChild(notification);
    
    // Animate in
    notification.animate([
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
    ], {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => closeNotification(notification));
    
    return notification;
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationCenter';
    container.className = 'notification-center';
    document.body.appendChild(container);
    return container;
}

function closeNotification(notification) {
    notification.animate([
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0 }
    ], {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
    }).onfinish = () => notification.remove();
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modern features
    enhancedInit();
    
    // Also initialize original functionality
    initUserProfile();
    
    // Override original functions with enhanced versions
    const originalHandleMatch = handleMatch;
    window.handleMatch = function(data) {
        enhancedHandleMatch(data);
    };
    
    // Add CSS for new elements
    addEnhancedStyles();
});

function addEnhancedStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced notification styles */
        .notification-center {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        }
        
        .enhanced-notification {
            background: rgba(15, 15, 35, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 15px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .enhanced-notification.success {
            border-color: rgba(46, 204, 113, 0.3);
        }
        
        .enhanced-notification.warning {
            border-color: rgba(241, 196, 15, 0.3);
        }
        
        .enhanced-notification.error {
            border-color: rgba(231, 76, 60, 0.3);
        }
        
        .notification-icon {
            font-size: 1.5rem;
        }
        
        .notification-icon .fa-info-circle { color: #667eea; }
        .notification-icon .fa-check-circle { color: #2ecc71; }
        .notification-icon .fa-exclamation-triangle { color: #f1c40f; }
        .notification-icon .fa-times-circle { color: #e74c3c; }
        
        .notification-content {
            flex: 1;
        }
        
        .notification-title {
            font-weight: 700;
            margin-bottom: 5px;
            font-size: 0.95rem;
        }
        
        .notification-message {
            font-size: 0.85rem;
            opacity: 0.9;
            line-height: 1.4;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            padding: 5px;
            font-size: 0.9rem;
            transition: color 0.3s;
        }
        
        .notification-close:hover {
            color: white;
        }
        
        /* Feedback bubbles */
        .feedback-bubble {
            position: fixed;
            z-index: 9998;
            font-weight: 700;
            font-size: 0.9rem;
            pointer-events: none;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            white-space: nowrap;
        }
        
        /* Daily reward popup */
        .daily-reward-popup {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        }
        
        .reward-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            border-radius: 25px;
            text-align: center;
            max-width: 300px;
            width: 100%;
            box-shadow: 0 20px 50px rgba(102, 126, 234, 0.5);
            animation: popupAppear 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes popupAppear {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        
        .reward-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        
        .reward-content h3 {
            font-size: 1.8rem;
            margin-bottom: 10px;
            color: white;
        }
        
        .reward-content p {
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 30px;
            font-size: 1.1rem;
        }
        
        .claim-reward-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 18px 40px;
            border-radius: 20px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
        }
        
        .claim-reward-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(255, 255, 255, 0.3);
        }
        
        /* Enhanced quest items */
        .quest-item.enhanced {
            transition: all 0.3s;
            border: 2px solid transparent;
        }
        
        .quest-item.enhanced:hover {
            transform: translateY(-3px);
            border-color: rgba(102, 126, 234, 0.3);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .quest-reward.completed {
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            animation: pulse 2s infinite;
        }
    `;
    document.head.appendChild(style);
}