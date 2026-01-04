// shop.js ga qo'shing
const shopItems = [
    {
        id: 'coin_pack_1',
        name: 'Kichik tanga to\'plami',
        description: 'Darhol 500 tanga oling',
        price: 4.99,
        currency: 'USD',
        reward: { coins: 500 },
        icon: '💰',
        popular: false
    },
    {
        id: 'coin_pack_2',
        name: 'Katta tanga to\'plami',
        description: 'Darhol 1500 tanga + 200 bonus',
        price: 9.99,
        currency: 'USD',
        reward: { coins: 1700 },
        icon: '💎',
        popular: true
    },
    {
        id: 'vip_pass',
        name: 'VIP Pass (30 kun)',
        description: 'VIP status, kundalik bonus, maxsus ramzlar',
        price: 14.99,
        currency: 'USD',
        reward: { vip: true, days: 30, dailyBonus: 100 },
        icon: '👑',
        popular: false
    },
    {
        id: 'super_like_pack',
        name: 'Super Like paketi',
        description: '30 ta Super Like + cheksiz kunlik limit',
        price: 7.99,
        currency: 'USD',
        reward: { superLikes: 30, unlimitedDaily: true },
        icon: '💖',
        popular: false
    },
    {
        id: 'profile_booster',
        name: 'Profil ko\'taruvchi',
        description: 'Profilingizni reklama qiling (1 hafta)',
        price: 12.99,
        currency: 'USD',
        reward: { profileBoost: true, duration: 7 },
        icon: '🚀',
        popular: true
    },
    {
        id: 'remove_ads',
        name: 'Reklamalarni olib tashlash',
        description: 'Doimiy ravishda reklamalarni olib tashlang',
        price: 19.99,
        currency: 'USD',
        reward: { adsRemoved: true },
        icon: '🚫',
        popular: false
    }
];