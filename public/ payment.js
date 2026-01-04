// payment.js faylini yarating
class PaymentSystem {
    constructor() {
        this.telegram = window.Telegram.WebApp;
    }
    
    async purchaseItem(itemId) {
        const item = shopItems.find(i => i.id === itemId);
        if (!item) return false;
        
        try {
            // Telegram Payments
            const result = await this.telegram.openInvoice({
                title: item.name,
                description: item.description,
                payload: itemId,
                currency: item.currency,
                prices: [
                    { label: item.name, amount: item.price * 100 }
                ]
            });
            
            if (result.status === 'paid') {
                this.deliverItem(item);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Payment error:', error);
            return false;
        }
    }
    
    deliverItem(item) {
        // Mukofotlarni berish
        if (item.reward.coins) {
            gameState.user.coins += item.reward.coins;
        }
        
        if (item.reward.vip) {
            this.activateVIP(item.reward.days);
        }
        
        if (item.reward.superLikes) {
            gameState.user.superLikes += item.reward.superLikes;
        }
        
        if (item.reward.profileBoost) {
            this.boostProfile(item.reward.duration);
        }
        
        if (item.reward.adsRemoved) {
            storage.set('ads_removed', true);
        }
        
        updateUserStats();
        showNotification('✅ Xarid muvaffaqiyatli!', 'Mukofotlar hisobingizga qo\'shildi');
        
        // Analytics
        analytics.trackPurchase(item.id, item.price);
    }
    
    activateVIP(days) {
        const vipUntil = new Date();
        vipUntil.setDate(vipUntil.getDate() + days);
        
        storage.set('vip_status', {
            active: true,
            until: vipUntil.getTime(),
            dailyBonus: true
        });
        
        showNotification('👑 VIP Status faollashtirildi!', 
            `${days} kun davomida VIP imtiyozlaridan foydalaning`);
    }
    
    boostProfile(days) {
        const boostUntil = new Date();
        boostUntil.setDate(boostUntil.getDate() + days);
        
        storage.set('profile_boost', {
            active: true,
            until: boostUntil.getTime(),
            multiplier: 1.5
        });
        
        showNotification('🚀 Profilingiz reklama qilindi!', 
            `${days} kun davomida ko'proq foydalanuvchilar sizni ko'radi`);
    }
}

const paymentSystem = new PaymentSystem();
