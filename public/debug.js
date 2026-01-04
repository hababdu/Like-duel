// debug.js faylini yarating
class DebugTools {
    constructor() {
        this.enabled = localStorage.getItem('debug_enabled') === 'true';
        this.init();
    }
    
    init() {
        if (this.enabled) {
            this.enableDebugMode();
        }
    }
    
    enableDebugMode() {
        console.log('🔧 Debug mode enabled');
        
        // Add debug panel
        this.createDebugPanel();
        
        // Override showNotification for debugging
        const originalShowNotification = window.showNotification;
        window.showNotification = function(title, message) {
            console.log(`📢 Notification: ${title} - ${message}`);
            if (originalShowNotification) {
                originalShowNotification(title, message);
            }
        };
        
        // Log all socket events
        if (window.improvedSocketManager?.socket) {
            const originalEmit = window.improvedSocketManager.socket.emit;
            window.improvedSocketManager.socket.emit = function(event, data) {
                console.log(`📤 Socket emit: ${event}`, data);
                return originalEmit.call(this, event, data);
            };
            
            const originalListeners = {};
            const originalOn = window.improvedSocketManager.socket.on;
            window.improvedSocketManager.socket.on = function(event, callback) {
                console.log(`📥 Socket listening: ${event}`);
                
                originalListeners[event] = function(data) {
                    console.log(`📥 Socket event received: ${event}`, data);
                    callback(data);
                };
                
                return originalOn.call(this, event, originalListeners[event]);
            };
        }
    }
    
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 300px;
            max-height: 400px;
            overflow: auto;
        `;
        
        panel.innerHTML = `
            <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                <strong>Debug Panel</strong>
                <button onclick="debugTools.togglePanel()" style="background: #e74c3c; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;">X</button>
            </div>
            <div id="debugContent"></div>
            <div style="margin-top: 10px; display: flex; gap: 5px;">
                <button onclick="debugTools.testMatch()" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Test Match</button>
                <button onclick="debugTools.resetData()" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Reset</button>
                <button onclick="debugTools.toggleDebug()" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Debug ${this.enabled ? 'Off' : 'On'}</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.updateDebugInfo();
        
        // Update every 5 seconds
        setInterval(() => {
            this.updateDebugInfo();
        }, 5000);
    }
    
    togglePanel() {
        const panel = document.getElementById('debugPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    updateDebugInfo() {
        const content = document.getElementById('debugContent');
        if (!content) return;
        
        const state = window.gameStateManager?.getState();
        const user = window.userState;
        
        const info = `
            <div style="margin-bottom: 5px;">
                <strong>Connection:</strong> ${state?.isConnected ? '✅' : '❌'}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Queue:</strong> ${state?.isInQueue ? '✅' : '❌'}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Duel:</strong> ${state?.isInDuel ? '✅' : '❌'}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Coins:</strong> ${user?.coins || 0}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Rating:</strong> ${user?.rating || 0}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Matches:</strong> ${user?.matches || 0}
            </div>
            <div style="margin-bottom: 5px;">
                <strong>Duels:</strong> ${user?.duels || 0}
            </div>
        `;
        
        content.innerHTML = info;
    }
    
    testMatch() {
        console.log('🧪 Test match triggered');
        
        const testData = {
            partner: {
                id: 'test_partner_123',
                name: 'Test Partner',
                username: 'test_partner',
                photo: 'https://ui-avatars.com/api/?name=Test+Partner&background=667eea&color=fff',
                rating: 1650,
                matches: 12,
                level: 3
            },
            coinsEarned: 50,
            ratingChange: 15,
            xpEarned: 30
        };
        
        if (window.improvedGameLogic) {
            window.improvedGameLogic.handleMatch(testData);
        } else if (window.gameLogic) {
            window.gameLogic.handleMatch(testData);
        }
    }
    
    resetData() {
        if (confirm('Barcha test ma\'lumotlarni o\'chirishni istaysizmi?')) {
            localStorage.clear();
            location.reload();
        }
    }
    
    toggleDebug() {
        this.enabled = !this.enabled;
        localStorage.setItem('debug_enabled', this.enabled);
        location.reload();
    }
}

window.debugTools = new DebugTools();

// Debug command for console
window.debug = {
    quests: window.questSystem,
    achievements: window.achievementSystem,
    state: window.gameStateManager,
    user: window.userState,
    app: window.likeDuelApp,
    simulateMatch: () => window.debugTools.testMatch(),
    addCoins: (amount) => {
        window.userState.coins += amount;
        localStorage.setItem('userState', JSON.stringify(window.userState));
        window.updateUIFromUserState?.();
        console.log(`💰 Added ${amount} coins`);
    },
    setLevel: (level) => {
        window.userState.level = level;
        localStorage.setItem('userState', JSON.stringify(window.userState));
        window.updateUIFromUserState?.();
        console.log(`⭐ Set level to ${level}`);
    }
};