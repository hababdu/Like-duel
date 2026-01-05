// public/payment.js - Telegram Stars orqali real pul bilan coin sotib olish

window.payment = {
    // Coin paketlari (Stars narxida)
    packages: [
        {
            id: 'pack_500',
            name: 'Boshlang‘ich',
            stars: 99,          // ~$0.99
            coins: 500,
            bonus: 0,
            popular: false
        },
        {
            id: 'pack_1500',
            name: 'Ommabop',
            stars: 249,         // ~$2.49
            coins: 1650,        // +10% bonus
            bonus: 10,
            popular: true
        },
        {
            id: 'pack_3500',
            name: 'Katta',
            stars: 499,         // ~$4.99
            coins: 4200,        // +20% bonus
            bonus: 20,
            popular: false
        },
        {
            id: 'pack_8000',
            name: 'Super',
            stars: 999,         // ~$9.99
            coins: 10400,       // +30% bonus + 5 Super Like
            bonus: 30,
            superLikes: 5,
            popular: false
        }
    ],

    /**
     * Paketni sotib olish jarayonini boshlash
     */
    buyPackage: function(packageId) {
        const pkg = this.packages.find(p => p.id === packageId);
        if (!pkg) {
            window.utils?.showNotification('Xato', 'Paket topilmadi');
            return;
        }

        // Telegram Stars mavjudligini tekshirish
        if (!window.Telegram?.WebApp?.openInvoice) {
            window.utils?.showNotification('Xato', 'To‘lov tizimi mavjud emas');
            return;
        }

        const invoice = {
            title: `${pkg.name} paket`,
            description: `${pkg.coins} tanga${pkg.bonus > 0 ? ` (+${pkg.bonus}% bonus)` : ''}${pkg.superLikes ? ` + ${pkg.superLikes} Super Like` : ''}`,
            payload: JSON.stringify({
                type: 'coin_purchase',
                packageId: pkg.id,
                userId: window.Telegram.WebApp.initDataUnsafe.user.id,
                timestamp: Date.now()
            }),
            provider_token: '', // Stars uchun bo'sh
            currency: 'XTR',    // Telegram Stars
            prices: [
                { label: 'Tanga paketi', amount: pkg.stars * 100 } // 1 Star = 100 "kopeyka"
            ]
        };

        console.log('💳 To‘lov oynasi ochilmoqda:', invoice);

        window.Telegram.WebApp.openInvoice(invoice, (status) => {
            if (status === 'paid') {
                this.onPurchaseSuccess(pkg);
            } else if (status === 'cancelled') {
                window.utils?.showNotification('Bekor qilindi', 'To‘lov bekor qilindi');
            } else if (status === 'failed') {
                window.utils?.showNotification('Xato', 'To‘lov amalga oshmadi');
            }
        });
    },

    /**
     * To‘lov muvaffaqiyatli bo‘lganda coinlarni qo‘shish
     */
    onPurchaseSuccess: function(pkg) {

        const bonusMultiplier = 1 + (pkg.bonus / 100);
        const totalCoins = Math.round(pkg.coins * bonusMultiplier);

        // Coin qo'shish
        window.userState.coins += totalCoins;
// payment.js da onPurchaseSuccess ichiga
// Serverga ham yuborish
if (window.socketManager?.socket?.connected) {
    window.socketManager.socket.emit('purchase_completed', {
        packageId: pkg.id,
        coinsAdded: totalCoins,
        starsSpent: pkg.stars
    });
}
        // Super Like bonus (faqat super paketda)
        if (pkg.superLikes) {
            window.userState.dailySuperLikes += pkg.superLikes;
        }

        // Saqlash
        window.storage?.saveUserState();
        window.uiManager?.updateUIFromUserState();

        // Confetti!
        if (window.confetti) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
            });
        }

        window.utils?.showNotification(
            '🎉 Sotib olindi!',
            `${totalCoins} tanga qo‘shildi!${pkg.bonus > 0 ? ` (+${pkg.bonus}% bonus)` : ''}${pkg.superLikes ? ` + ${pkg.superLikes} Super Like` : ''}`
        );

        // Serverga xabar berish (statistika uchun)
        if (window.socketManager?.socket?.connected) {
            window.socketManager.socket.emit('purchase_completed', {
                packageId: pkg.id,
                coinsAdded: totalCoins,
                starsSpent: pkg.stars
            });
        }
    },

    /**
     * Do'kon sahifasida paketlarni ko'rsatish
     */
    renderShop: function() {
        const container = document.getElementById('shopItemsList');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center; margin:30px 0;">
                <h2>💰 Real pul bilan tanga sotib oling</h2>
                <p style="opacity:0.8; margin-top:10px;">Telegram Stars orqali xavfsiz to‘lov</p>
            </div>
        `;

        this.packages.forEach(pkg => {
            const isPopular = pkg.popular ? 'popular-package' : '';

            const card = document.createElement('div');
            card.className = `shop-package-card ${isPopular}`;
            card.innerHTML = `
                ${pkg.popular ? '<div class="popular-badge">OMMABOP</div>' : ''}
                <h3>${pkg.name}</h3>
                <div class="package-price">
                    <span class="stars">${pkg.stars}</span>
                    <span class="currency">⭐ Stars</span>
                </div>
                <div class="package-coins">
                    <strong>${pkg.coins.toLocaleString()} tanga</strong>
                    ${pkg.bonus > 0 ? `<span class="bonus">+${pkg.bonus}% bonus</span>` : ''}
                </div>
                ${pkg.superLikes ? `<div class="extra">+${pkg.superLikes} Super Like 💎</div>` : ''}
                <button class="buy-btn" onclick="payment.buyPackage('${pkg.id}')">
                    Sotib olish
                </button>
            `;
            container.appendChild(card);
        });
    }
};

// Do'kon ochilganda paketlarni ko'rsatish
document.addEventListener('DOMContentLoaded', () => {
    // Tab ochilganda render qilish
    const shopTab = document.getElementById('shopTab');
    if (shopTab) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (shopTab.classList.contains('active')) {
                    window.payment?.renderShop();
                }
            });
        });
        observer.observe(shopTab, { attributes: true, attributeFilter: ['class'] });
    }
});

console.log('💳 payment.js – Real pul integratsiyasi tayyor');