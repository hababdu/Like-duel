// achievements.js faylini yarating
class AchievementSystem {
    constructor() {
        this.achievements = [
            {
                id: 1, type: 'first_match', title: "Birinchi Match", 
                description: "Birinchi matchingizni qiling", reward: 100, 
                icon: "🎯", unlocked: false, hidden: false
            },
            {
                id: 2, type: 'duels_10', title: "Duelchi", 
                description: "10 ta duel o'ynang", reward: 200, 
                icon: "⚔️", unlocked: false, hidden: false
            },
            {
                id: 3, type: 'likes_50', title: "Sevimli", 
                description: "50 ta like bering", reward: 300, 
                icon: "❤️", unlocked: false, hidden: false
            },
            {
                id: 4, type: 'friends_5', title: "Ijtimoiy", 
                description: "5 ta do'stingiz bo'lsin", reward: 500, 
                icon: "👥", unlocked: false, hidden: false
            },
            {
                id: 5, type: 'win_streak_5', title: "G'olib", 
                description: "Ketma-ket 5 ta duel yutishingiz kerak", 
                reward: 800, icon: "🏆", unlocked: false, hidden: false
            },
            {
                id: 6, type: 'superlikes_20', title: "Super Sevar", 
                description: "20 ta Super Like bering", reward: 700, 
                icon: "💎", unlocked: false, hidden: false
            },
            {
                id: 7, type: 'rating_2000', title: "Pro Gamer", 
                description: "2000+ reytingga erishing", reward: 1000, 
                icon: "🌟", unlocked: false, hidden: false
            },
            {
                id: 8, type: 'daily_login_30', title: "Sodiq", 
                description: "30 kun ketma-ket tizimga kiring", 
                reward: 1500, icon: "📅", unlocked: false, hidden: false
            }
        ];
        this.loadAchievements();
    }

    loadAchievements() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            this.achievements = this.achievements.map(ach => {
                const saved = savedAchievements.find(s => s.id === ach.id);
                return saved ? { ...ach, ...saved } : ach;
            });
        }
    }

    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    checkAchievements(type, value) {
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.type === type) {
                let unlocked = false;
                
                switch(type) {
                    case 'first_match':
                        unlocked = value > 0;
                        break;
                    case 'duels_10':
                        unlocked = value >= 10;
                        break;
                    case 'likes_50':
                        unlocked = value >= 50;
                        break;
                    case 'friends_5':
                        unlocked = value >= 5;
                        break;
                    case 'win_streak_5':
                        unlocked = value >= 5;
                        break;
                    case 'superlikes_20':
                        unlocked = value >= 20;
                        break;
                    case 'rating_2000':
                        unlocked = value >= 2000;
                        break;
                    case 'daily_login_30':
                        unlocked = value >= 30;
                        break;
                }
                
                if (unlocked) {
                    this.unlockAchievement(achievement.id);
                }
            }
        });
    }

    unlockAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            
            // Reward berish
            window.userState.coins += achievement.reward;
            
            // Notification
            this.showAchievementPopup(achievement);
            
            // Saqlash
            this.saveAchievements();
            
            return true;
        }
        return false;
    }

    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.5s ease-out, slideOut 0.5s ease-in 2.5s;
            min-width: 300px;
            max-width: 350px;
        `;
        
        popup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 2.5rem;">${achievement.icon}</div>
                <div>
                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">
                        ${achievement.title}
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 8px;">
                        ${achievement.description}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 20px; font-size: 0.8rem;">
                            <i class="fas fa-coins"></i> +${achievement.reward}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Audio efekti
        this.playAchievementSound();
        
        // Confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.2, x: 0.9 }
        });
        
        // Auto remove
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 3000);
    }

    playAchievementSound() {
        try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch (e) {
            console.log('Audio error:', e);
        }
    }

    getUnlockedCount() {
        return this.achievements.filter(a => a.unlocked).length;
    }

    updateUI() {
        const container = document.getElementById('achievementsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="achievements-grid">
                ${this.achievements.map(achievement => `
                    <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-reward">
                            <i class="fas fa-coins"></i> ${achievement.reward}
                        </div>
                        <div class="achievement-status">
                            ${achievement.unlocked ? 
                                '<span class="status-unlocked"><i class="fas fa-check-circle"></i> Olingan</span>' : 
                                '<span class="status-locked"><i class="fas fa-lock"></i> Qulf</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

window.achievementSystem = new AchievementSystem();