// analytics.js faylini yarating
class Analytics {
    constructor() {
        this.sessionStart = Date.now();
        this.events = [];
    }

    trackEvent(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties,
            timestamp: Date.now(),
            sessionDuration: Date.now() - this.sessionStart
        };
        
        this.events.push(event);
        
        // Backendga yuborish (agar backend bo'lsa)
        if (window.ANALYTICS_ENDPOINT) {
            this.sendToBackend(event);
        }
        
        // Consolega log (development uchun)
        if (process.env.NODE_ENV === 'development') {
            console.log('Analytics Event:', event);
        }
    }

    sendToBackend(event) {
        fetch(window.ANALYTICS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }).catch(console.error);
    }

    trackSession() {
        this.trackEvent('session_start', {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`
        });
    }

    trackDuelComplete(result, opponentId) {
        this.trackEvent('duel_complete', {
            result,
            opponent_id: opponentId,
            rating: gameState.user.rating,
            level: gameState.user.level
        });
    }

    trackPurchase(itemId, price) {
        this.trackEvent('purchase', {
            item_id: itemId,
            price,
            coins_after: gameState.user.coins
        });
    }

    getSessionStats() {
        const duration = Date.now() - this.sessionStart;
        const duels = this.events.filter(e => e.name === 'duel_complete').length;
        const matches = this.events.filter(e => e.name === 'match').length;
        
        return {
            duration: Math.floor(duration / 1000),
            duels,
            matches,
            events: this.events.length
        };
    }
}

const analytics = new Analytics();