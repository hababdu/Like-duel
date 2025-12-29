const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://like-duel.onrender.com", "http://localhost:3000", "http://localhost:5500", "http://127.0.0.1:5500"],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

app.use(cors({
    origin: ["https://like-duel.onrender.com", "http://localhost:3000", "http://localhost:5500"],
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// ==================== STATIC FAYLLARNI SERVIS QILISH ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/main.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.js'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

// ==================== API ENDPOINTLAR ====================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        message: 'Like Duel Server - Sovg\'a Tizimi',
        timestamp: new Date().toISOString(),
        platform: 'Render.com',
        websocket: 'Active',
        users: Object.keys(users).length,
        queue: queue.length,
        activeDuels: Object.keys(activeDuels).length,
        totalGifts: Object.keys(gifts).length,
        shopItems: Object.keys(shopItems).length
    });
});

app.get('/api/shop', (req, res) => {
    res.json({
        shopItems: Object.values(shopItems),
        giftTypes: giftTypes,
        stats: {
            totalUsers: Object.keys(users).length,
            premiumUsers: Object.values(users).filter(u => u.premium).length,
            totalGiftsSent: Object.values(gifts).length,
            giftsToday: Object.values(gifts).filter(g => 
                new Date(g.createdAt).toDateString() === new Date().toDateString()
            ).length
        }
    });
});

// ==================== SOVG'A VA DO'KON TIZIMI ====================
const shopItems = {
    // SOVG'A LIMITLARINI OSHIRISH PAKETLARI
    gift_hearts_10: { 
        id: 'gift_hearts_10', 
        name: '10 ta ❤️ Sovg\'a Limit', 
        price: 100, 
        type: 'gift_limit', 
        giftType: 'hearts', 
        quantity: 10, 
        description: '❤️ sovg\'a limitini 10 taga oshiradi',
        icon: '❤️',
        category: 'gift_limits'
    },
    gift_hearts_50: { 
        id: 'gift_hearts_50', 
        name: '50 ta ❤️ Sovg\'a Limit', 
        price: 450, 
        type: 'gift_limit', 
        giftType: 'hearts', 
        quantity: 50, 
        description: '❤️ sovg\'a limitini 50 taga oshiradi',
        icon: '❤️',
        category: 'gift_limits'
    },
    gift_hearts_100: { 
        id: 'gift_hearts_100', 
        name: '100 ta ❤️ Sovg\'a Limit', 
        price: 800, 
        type: 'gift_limit', 
        giftType: 'hearts', 
        quantity: 100, 
        description: '❤️ sovg\'a limitini 100 taga oshiradi',
        icon: '❤️',
        category: 'gift_limits'
    },
    
    gift_stars_10: { 
        id: 'gift_stars_10', 
        name: '10 ta ⭐ Sovg\'a Limit', 
        price: 150, 
        type: 'gift_limit', 
        giftType: 'stars', 
        quantity: 10, 
        description: '⭐ sovg\'a limitini 10 taga oshiradi',
        icon: '⭐',
        category: 'gift_limits'
    },
    gift_stars_50: { 
        id: 'gift_stars_50', 
        name: '50 ta ⭐ Sovg\'a Limit', 
        price: 700, 
        type: 'gift_limit', 
        giftType: 'stars', 
        quantity: 50, 
        description: '⭐ sovg\'a limitini 50 taga oshiradi',
        icon: '⭐',
        category: 'gift_limits'
    },
    
    gift_crown_5: { 
        id: 'gift_crown_5', 
        name: '5 ta 👑 Sovg\'a Limit', 
        price: 500, 
        type: 'gift_limit', 
        giftType: 'crown', 
        quantity: 5, 
        description: '👑 sovg\'a limitini 5 taga oshiradi',
        icon: '👑',
        category: 'gift_limits'
    },
    gift_crown_20: { 
        id: 'gift_crown_20', 
        name: '20 ta 👑 Sovg\'a Limit', 
        price: 1800, 
        type: 'gift_limit', 
        giftType: 'crown', 
        quantity: 20, 
        description: '👑 sovg\'a limitini 20 taga oshiradi',
        icon: '👑',
        category: 'gift_limits'
    },
    
    gift_fire_10: { 
        id: 'gift_fire_10', 
        name: '10 ta 🔥 Sovg\'a Limit', 
        price: 200, 
        type: 'gift_limit', 
        giftType: 'fire', 
        quantity: 10, 
        description: '🔥 sovg\'a limitini 10 taga oshiradi',
        icon: '🔥',
        category: 'gift_limits'
    },
    
    gift_diamond_5: { 
        id: 'gift_diamond_5', 
        name: '5 ta 💎 Sovg\'a Limit', 
        price: 1000, 
        type: 'gift_limit', 
        giftType: 'diamond', 
        quantity: 5, 
        description: '💎 sovg\'a limitini 5 taga oshiradi',
        icon: '💎',
        category: 'gift_limits'
    },
    
    // SUPER LIKE PAKETLARI
    super_likes_10: { 
        id: 'super_likes_10', 
        name: '10 ta 💖 Super Like', 
        price: 300, 
        type: 'super_like', 
        quantity: 10, 
        description: '10 ta kunlik SUPER LIKE',
        icon: '💖',
        category: 'super_likes'
    },
    super_likes_50: { 
        id: 'super_likes_50', 
        name: '50 ta 💖 Super Like', 
        price: 1200, 
        type: 'super_like', 
        quantity: 50, 
        description: '50 ta kunlik SUPER LIKE',
        icon: '💖',
        category: 'super_likes'
    },
    super_likes_100: { 
        id: 'super_likes_100', 
        name: '100 ta 💖 Super Like', 
        price: 2000, 
        type: 'super_like', 
        quantity: 100, 
        description: '100 ta kunlik SUPER LIKE',
        icon: '💖',
        category: 'super_likes'
    },
    
    // PREMIUM STATUS
    premium_7: { 
        id: 'premium_7', 
        name: '7 kun Premium', 
        price: 500, 
        type: 'premium', 
        days: 7, 
        description: '7 kunlik premium status + limitlar 2x',
        icon: '👑',
        category: 'premium',
        benefits: ['2x sovg\'a limitlari', 'Eksklyuziv sovg\'alar', 'Reklamalarsiz']
    },
    premium_30: { 
        id: 'premium_30', 
        name: '30 kun Premium', 
        price: 1500, 
        type: 'premium', 
        days: 30, 
        description: '30 kunlik premium status + limitlar 3x',
        icon: '👑',
        category: 'premium',
        benefits: ['3x sovg\'a limitlari', 'Barcha sovg\'alar ochiq', 'Premium badge']
    },
    premium_90: { 
        id: 'premium_90', 
        name: '90 kun Premium', 
        price: 3500, 
        type: 'premium', 
        days: 90, 
        description: '90 kunlik premium status + cheksiz sovg\'alar',
        icon: '👑',
        category: 'premium',
        benefits: ['Cheksiz sovg\'alar', 'VIP support', 'Maxsus avatar']
    },
    
    // COIN PAKETLARI
    coins_100: { 
        id: 'coins_100', 
        name: '100 Coin', 
        price: 100, 
        type: 'coins', 
        quantity: 100, 
        description: '100 ta coin',
        icon: '🪙',
        category: 'coins'
    },
    coins_500: { 
        id: 'coins_500', 
        name: '500 Coin (+50 bonus)', 
        price: 450, 
        type: 'coins', 
        quantity: 550, 
        description: '500 coin + 50 bonus',
        icon: '🪙',
        category: 'coins'
    },
    coins_1000: { 
        id: 'coins_1000', 
        name: '1000 Coin (+200 bonus)', 
        price: 800, 
        type: 'coins', 
        quantity: 1200, 
        description: '1000 coin + 200 bonus',
        icon: '🪙',
        category: 'coins'
    },
    coins_5000: { 
        id: 'coins_5000', 
        name: '5000 Coin (+1500 bonus)', 
        price: 3500, 
        type: 'coins', 
        quantity: 6500, 
        description: '5000 coin + 1500 bonus',
        icon: '🪙',
        category: 'coins'
    }
};

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const users = {};
const queue = [];
const activeDuels = {};
const mutualMatches = {};
const gifts = {};
const dailyGiftLimits = {};
const giftInventory = {};

// SOVG'A TURLARI VA STANDART LIMITLARI
const giftTypes = {
    hearts: { 
        name: '❤️ Yurak', 
        dailyFreeLimit: 5, 
        price: 10,
        description: 'Sevgi va mehr sovg\'asi',
        color: '#ff6b6b',
        bonus: { coins: 5, xp: 10 }
    },
    stars: { 
        name: '⭐ Yulduz', 
        dailyFreeLimit: 3, 
        price: 15,
        description: 'Yulduzli sovg\'a',
        color: '#ffd700',
        bonus: { coins: 10, xp: 20 }
    },
    crown: { 
        name: '👑 Toj', 
        dailyFreeLimit: 1, 
        price: 50,
        description: 'Qirollik sovg\'asi',
        color: '#f39c12',
        bonus: { coins: 50, xp: 100 }
    },
    fire: { 
        name: '🔥 Olov', 
        dailyFreeLimit: 2, 
        price: 20,
        description: 'Issiqlik va g\'ayrat sovg\'asi',
        color: '#e74c3c',
        bonus: { coins: 15, xp: 30 }
    },
    diamond: { 
        name: '💎 Brilliant', 
        dailyFreeLimit: 1, 
        price: 100,
        description: 'Qimmatbaho sovg\'a',
        color: '#3498db',
        bonus: { coins: 100, xp: 200 }
    },
    rocket: { 
        name: '🚀 Raketa', 
        dailyFreeLimit: 0, 
        price: 75,
        description: 'Premium sovg\'a - faqat premium foydalanuvchilar',
        color: '#9b59b6',
        bonus: { coins: 75, xp: 150 },
        premiumOnly: true
    },
    trophy: { 
        name: '🏆 Kubok', 
        dailyFreeLimit: 0, 
        price: 150,
        description: 'Eksklyuziv sovg\'a - faqat premium foydalanuvchilar',
        color: '#2ecc71',
        bonus: { coins: 150, xp: 300 },
        premiumOnly: true
    }
};

// ==================== YORDAMCHI FUNKSIYALAR ====================
function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateGiftId() {
    return 'gift_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateTransactionId() {
    return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Gender va filter tekshirish
function checkGenderCompatibility(user1, user2) {
    if (!user1?.gender || !user2?.gender) return false;
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

function checkFilterCompatibility(user, opponent) {
    const userFilter = user.filter || 'not_specified';
    const opponentFilter = opponent.filter || 'not_specified';
    
    if (userFilter === 'male') {
        return opponent.gender === 'male';
    }
    
    if (userFilter === 'female') {
        return opponent.gender === 'female';
    }
    
    if (userFilter === 'not_specified') {
        return true;
    }
    
    return false;
}

// Sovg'a limitini hisoblash
function getUserGiftLimit(userId, giftType) {
    const user = users[userId];
    if (!user) return { dailyLimit: 0, purchasedLimit: 0, totalLimit: 0 };
    
    const giftInfo = giftTypes[giftType];
    if (!giftInfo) return { dailyLimit: 0, purchasedLimit: 0, totalLimit: 0 };
    
    // Asosiy limit
    let baseLimit = giftInfo.dailyFreeLimit;
    
    // Agar premium bo'lsa, limitni ko'paytirish
    if (user.premium && user.premiumExpiry > new Date()) {
        if (user.premiumDays >= 90) {
            baseLimit = 9999; // Cheksiz
        } else if (user.premiumDays >= 30) {
            baseLimit *= 3;
        } else if (user.premiumDays >= 7) {
            baseLimit *= 2;
        }
    }
    
    // Sotib olingan limit
    const purchasedLimit = giftInventory[userId]?.[giftType] || 0;
    
    // Premium sovg'alarni tekshirish
    if (giftInfo.premiumOnly && !user.premium) {
        return { dailyLimit: 0, purchasedLimit: 0, totalLimit: 0 };
    }
    
    return {
        dailyLimit: baseLimit,
        purchasedLimit: purchasedLimit,
        totalLimit: baseLimit + purchasedLimit
    };
}

// Sovg'a limitini tekshirish
function checkGiftLimit(userId, giftType) {
    const today = new Date().toDateString();
    const user = users[userId];
    
    if (!user) {
        return { 
            canSend: false, 
            reason: 'Foydalanuvchi topilmadi',
            code: 'USER_NOT_FOUND'
        };
    }
    
    // Premium sovg'alarni tekshirish
    const giftInfo = giftTypes[giftType];
    if (giftInfo.premiumOnly && !user.premium) {
        return { 
            canSend: false, 
            reason: 'Bu sovg\'a faqat premium foydalanuvchilar uchun',
            code: 'PREMIUM_REQUIRED'
        };
    }
    
    // Joriy limitni olish
    const limits = getUserGiftLimit(userId, giftType);
    
    // Bugungi yuborilgan sovg'alar soni
    const userLimits = dailyGiftLimits[userId] || {};
    const todayLimits = userLimits[today] || {};
    const sentToday = todayLimits[giftType] || 0;
    
    // Limitni tekshirish
    if (sentToday >= limits.totalLimit) {
        return { 
            canSend: false, 
            reason: `Kunlik limit tugadi. ${giftInfo.name} sovg\'asidan faqat ${limits.totalLimit} ta yuborish mumkin.`,
            code: 'DAILY_LIMIT_EXCEEDED',
            limit: limits.totalLimit,
            sent: sentToday,
            remaining: 0,
            baseLimit: limits.dailyLimit,
            purchasedLimit: limits.purchasedLimit
        };
    }
    
    // Coin tekshirish
    if (user.coins < giftInfo.price) {
        return { 
            canSend: false, 
            reason: `Sovg\'a yuborish uchun yetarli coin yo'q. Kerak: ${giftInfo.price} coin`,
            code: 'INSUFFICIENT_COINS',
            required: giftInfo.price,
            current: user.coins
        };
    }
    
    return { 
        canSend: true, 
        limit: limits.totalLimit,
        sent: sentToday,
        remaining: limits.totalLimit - sentToday,
        baseLimit: limits.dailyLimit,
        purchasedLimit: limits.purchasedLimit,
        price: giftInfo.price
    };
}

// Sovg'ani yuborish
function sendGift(senderId, receiverId, giftType, message = '') {
    const sender = users[senderId];
    const receiver = users[receiverId];
    
    if (!sender || !receiver) {
        return { success: false, message: 'Foydalanuvchi topilmadi' };
    }
    
    // Limitni tekshirish
    const limitCheck = checkGiftLimit(senderId, giftType);
    if (!limitCheck.canSend) {
        return { 
            success: false, 
            message: limitCheck.reason,
            code: limitCheck.code
        };
    }
    
    // Coinlarni hisobdan olib tashlash
    sender.coins -= limitCheck.price;
    
    // Bugungi limitni yangilash
    const today = new Date().toDateString();
    if (!dailyGiftLimits[senderId]) dailyGiftLimits[senderId] = {};
    if (!dailyGiftLimits[senderId][today]) dailyGiftLimits[senderId][today] = {};
    
    dailyGiftLimits[senderId][today][giftType] = 
        (dailyGiftLimits[senderId][today][giftType] || 0) + 1;
    
    // Sovg'ani yaratish
    const giftId = generateGiftId();
    const giftInfo = giftTypes[giftType];
    
    gifts[giftId] = {
        id: giftId,
        senderId: senderId,
        receiverId: receiverId,
        giftType: giftType,
        giftName: giftInfo.name,
        giftIcon: giftType === 'hearts' ? '❤️' : 
                 giftType === 'stars' ? '⭐' : 
                 giftType === 'crown' ? '👑' : 
                 giftType === 'fire' ? '🔥' : 
                 giftType === 'diamond' ? '💎' : 
                 giftType === 'rocket' ? '🚀' : '🏆',
        price: giftInfo.price,
        bonus: giftInfo.bonus,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 soat
        message: message || null
    };
    
    // Transaction yaratish
    const transactionId = generateTransactionId();
    
    return {
        success: true,
        giftId: giftId,
        transactionId: transactionId,
        senderCoins: sender.coins,
        giftInfo: {
            type: giftType,
            name: giftInfo.name,
            price: giftInfo.price,
            icon: giftTypes[giftType].icon || '🎁'
        },
        limits: {
            sent: dailyGiftLimits[senderId][today][giftType],
            remaining: limitCheck.limit - dailyGiftLimits[senderId][today][giftType],
            totalLimit: limitCheck.limit
        }
    };
}

// Sovg'ani qabul qilish
function acceptGift(giftId, receiverId) {
    const gift = gifts[giftId];
    if (!gift) {
        return { success: false, message: 'Sovg\'a topilmadi', code: 'GIFT_NOT_FOUND' };
    }
    
    if (gift.receiverId !== receiverId) {
        return { success: false, message: 'Bu sovg\'a sizga emas', code: 'NOT_YOUR_GIFT' };
    }
    
    if (gift.status !== 'pending') {
        return { 
            success: false, 
            message: gift.status === 'accepted' ? 'Sovg\'a allaqachon qabul qilingan' : 'Sovg\'a muddati tugagan',
            code: gift.status === 'accepted' ? 'ALREADY_ACCEPTED' : 'EXPIRED'
        };
    }
    
    // Muddati tugaganligini tekshirish
    if (new Date() > gift.expiresAt) {
        gift.status = 'expired';
        return { success: false, message: 'Sovg\'a muddati tugagan', code: 'EXPIRED' };
    }
    
    const receiver = users[receiverId];
    const sender = users[gift.senderId];
    
    if (!receiver) {
        return { success: false, message: 'Qabul qiluvchi topilmadi', code: 'RECEIVER_NOT_FOUND' };
    }
    
    // Sovg'ani qabul qilish
    gift.status = 'accepted';
    gift.acceptedAt = new Date();
    
    // Bonuslarni berish
    receiver.coins += gift.bonus.coins;
    receiver.xp = (receiver.xp || 0) + gift.bonus.xp;
    
    // Jo'natuvchiga ham bonus (agar u hali o'chirilmagan bo'lsa)
    if (sender) {
        const senderBonus = Math.floor(gift.bonus.coins * 0.3); // 30% bonus
        sender.coins += senderBonus;
        sender.totalGiftsSent = (sender.totalGiftsSent || 0) + 1;
        
        // Jo'natuvchiga xabar
        const senderSocket = io.sockets.sockets.get(sender.socketId);
        if (senderSocket) {
            senderSocket.emit('gift_bonus_received', {
                giftId: giftId,
                receiverName: receiver.firstName,
                giftType: gift.giftType,
                giftName: gift.giftName,
                bonus: senderBonus,
                totalGiftsSent: sender.totalGiftsSent
            });
        }
    }
    
    // Qabul qiluvchiga xabar
    const receiverSocket = io.sockets.sockets.get(receiver.socketId);
    if (receiverSocket) {
        receiverSocket.emit('gift_accepted_success', {
            giftId: giftId,
            senderName: sender ? sender.firstName : 'Anonim',
            giftType: gift.giftType,
            giftName: gift.giftName,
            giftIcon: gift.giftIcon,
            bonus: gift.bonus,
            newCoins: receiver.coins,
            newXP: receiver.xp
        });
    }
    
    return { 
        success: true, 
        message: 'Sovg\'a muvaffaqiyatli qabul qilindi!',
        gift: {
            id: giftId,
            type: gift.giftType,
            name: gift.giftName,
            icon: gift.giftIcon
        },
        bonuses: {
            coins: gift.bonus.coins,
            xp: gift.bonus.xp,
            senderBonus: sender ? Math.floor(gift.bonus.coins * 0.3) : 0
        }
    };
}

// Do'kon mahsulotini sotib olish
function buyShopItem(userId, itemId) {
    const user = users[userId];
    if (!user) {
        return { success: false, message: 'Foydalanuvchi topilmadi', code: 'USER_NOT_FOUND' };
    }
    
    const item = shopItems[itemId];
    if (!item) {
        return { success: false, message: 'Mahsulot topilmadi', code: 'ITEM_NOT_FOUND' };
    }
    
    // Coin tekshirish
    if (user.coins < item.price) {
        return { 
            success: false, 
            message: `Mahsulotni sotib olish uchun yetarli coin yo'q. Kerak: ${item.price} coin`,
            code: 'INSUFFICIENT_COINS',
            required: item.price,
            current: user.coins
        };
    }
    
    // Coinlarni hisobdan olib tashlash
    user.coins -= item.price;
    
    // Transaction yaratish
    const transactionId = generateTransactionId();
    
    // Mahsulot turiga qarab ishlov berish
    switch(item.type) {
        case 'gift_limit':
            // Sovg'a limitini oshirish
            if (!giftInventory[userId]) giftInventory[userId] = {};
            giftInventory[userId][item.giftType] = 
                (giftInventory[userId][item.giftType] || 0) + item.quantity;
            
            return {
                success: true,
                transactionId: transactionId,
                itemType: 'gift_limit',
                giftType: item.giftType,
                quantity: item.quantity,
                newLimit: giftInventory[userId][item.giftType],
                coinsSpent: item.price,
                remainingCoins: user.coins
            };
            
        case 'super_like':
            // Super like lar sonini oshirish
            user.dailySuperLikes += item.quantity;
            
            return {
                success: true,
                transactionId: transactionId,
                itemType: 'super_like',
                quantity: item.quantity,
                newSuperLikes: user.dailySuperLikes,
                coinsSpent: item.price,
                remainingCoins: user.coins
            };
            
        case 'premium':
            // Premium status berish
            const premiumExpiry = new Date();
            premiumExpiry.setDate(premiumExpiry.getDate() + item.days);
            
            user.premium = true;
            user.premiumExpiry = premiumExpiry;
            user.premiumDays = item.days;
            user.premiumSince = new Date();
            
            return {
                success: true,
                transactionId: transactionId,
                itemType: 'premium',
                days: item.days,
                premiumExpiry: premiumExpiry,
                coinsSpent: item.price,
                remainingCoins: user.coins,
                benefits: item.benefits || []
            };
            
        case 'coins':
            // Coin paketini qo'shish
            user.coins += item.quantity; // Hisobdan olib tashlash bilan birga qo'shamiz
            
            return {
                success: true,
                transactionId: transactionId,
                itemType: 'coins',
                quantity: item.quantity,
                totalCoins: user.coins,
                coinsSpent: item.price
            };
            
        default:
            return { success: false, message: 'Noma\'lum mahsulot turi', code: 'UNKNOWN_ITEM_TYPE' };
    }
}

// ==================== DUEL TIZIMI FUNKSIYALARI ====================

// O'zaro matchlarni olish
function getMutualMatches(userId) {
    const matches = [];
    Object.keys(mutualMatches).forEach(key => {
        if (key.includes(userId)) {
            const [user1, user2] = key.split('_');
            const otherUserId = user1 === userId ? user2 : user1;
            if (users[otherUserId]) {
                matches.push(otherUserId);
            }
        }
    });
    return matches;
}

// Duel natijasini hal qilish
function resolveDuel(duelId) {
    const duel = activeDuels[duelId];
    if (!duel) return;
    
    const [player1Id, player2Id] = duel.players;
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    if (!player1 || !player2) {
        delete activeDuels[duelId];
        return;
    }
    
    const player1Vote = duel.votes[player1Id]?.choice || 'skip';
    const player2Vote = duel.votes[player2Id]?.choice || 'skip';
    
    const player1Socket = io.sockets.sockets.get(player1.socketId);
    const player2Socket = io.sockets.sockets.get(player2.socketId);
    
    // Agar o'zaro like bo'lsa - MATCH
    if ((player1Vote === 'like' || player1Vote === 'super_like') && 
        (player2Vote === 'like' || player2Vote === 'super_like')) {
        
        // Mutual match yaratish
        const matchKey = [player1Id, player2Id].sort().join('_');
        mutualMatches[matchKey] = {
            users: [player1Id, player2Id],
            createdAt: new Date(),
            votes: duel.votes
        };
        
        // Match bonuslari
        const bonusCoins = 50;
        const bonusXP = 30;
        const ratingChange = 25;
        
        player1.matches++;
        player2.matches++;
        player1.rating += ratingChange;
        player2.rating += ratingChange;
        player1.coins += bonusCoins;
        player2.coins += bonusCoins;
        player1.xp = (player1.xp || 0) + bonusXP;
        player2.xp = (player2.xp || 0) + bonusXP;
        
        // Super like bonuslari
        if (player1Vote === 'super_like') {
            player1.coins += 20;
        }
        if (player2Vote === 'super_like') {
            player2.coins += 20;
        }
        
        // O'yinchilarga xabar berish
        if (player1Socket) {
            player1Socket.emit('match', {
                partner: {
                    id: player2.id,
                    name: player2.firstName,
                    username: player2.username,
                    photo: player2.photoUrl,
                    gender: player2.gender,
                    rating: player2.rating,
                    matches: player2.matches
                },
                rewards: {
                    coins: bonusCoins + (player1Vote === 'super_like' ? 20 : 0),
                    xp: bonusXP
                },
                newRating: player1.rating,
                isRematch: false
            });
        }
        
        if (player2Socket) {
            player2Socket.emit('match', {
                partner: {
                    id: player1.id,
                    name: player1.firstName,
                    username: player1.username,
                    photo: player1.photoUrl,
                    gender: player1.gender,
                    rating: player1.rating,
                    matches: player1.matches
                },
                rewards: {
                    coins: bonusCoins + (player2Vote === 'super_like' ? 20 : 0),
                    xp: bonusXP
                },
                newRating: player2.rating,
                isRematch: false
            });
        }
        
        console.log(`🎉 MATCH! ${player1.firstName} ↔ ${player2.firstName}`);
        
    } else {
        // Agar match bo'lmasa
        const player1Reward = { coins: 0, xp: 0 };
        const player2Reward = { coins: 0, xp: 0 };
        
        // Like berganlarga kichik bonus
        if (player1Vote === 'like' || player1Vote === 'super_like') {
            player1Reward.coins = 10;
            player1Reward.xp = 5;
            player1.coins += player1Reward.coins;
            player1.xp = (player1.xp || 0) + player1Reward.xp;
            player1.totalLikes++;
        }
        
        if (player2Vote === 'like' || player2Vote === 'super_like') {
            player2Reward.coins = 10;
            player2Reward.xp = 5;
            player2.coins += player2Reward.coins;
            player2.xp = (player2.xp || 0) + player2Reward.xp;
            player2.totalLikes++;
        }
        
        // Super like uchun qo'shimcha bonus
        if (player1Vote === 'super_like') {
            player1Reward.coins += 20;
            player1.coins += 20;
        }
        if (player2Vote === 'super_like') {
            player2Reward.coins += 20;
            player2.coins += 20;
        }
        
        // O'yinchilarga natijalarni yuborish
        if (player1Socket) {
            if (player1Vote === 'like' || player1Vote === 'super_like') {
                player1Socket.emit('liked_only', {
                    opponentName: player2.firstName,
                    reward: player1Reward,
                    coins: player1.coins,
                    xp: player1.xp
                });
            } else {
                player1Socket.emit('no_match');
            }
        }
        
        if (player2Socket) {
            if (player2Vote === 'like' || player2Vote === 'super_like') {
                player2Socket.emit('liked_only', {
                    opponentName: player1.firstName,
                    reward: player2Reward,
                    coins: player2.coins,
                    xp: player2.xp
                });
            } else {
                player2Socket.emit('no_match');
            }
        }
        
        console.log(`❌ No match: ${player1.firstName} (${player1Vote}) vs ${player2.firstName} (${player2Vote})`);
    }
    
    player1.duels++;
    player2.duels++;
    
    // Duelni o'chirish
    delete activeDuels[duelId];
}

// Navbat sonini yangilash
function updateWaitingCount() {
    io.emit('waiting_count', {
        count: queue.length,
        position: queue.length > 0 ? queue.length : 0
    });
}

// Duel qidirish va boshlash
function findAndStartDuels() {
    if (queue.length < 2) return;
    
    console.log('🔄 Duel qidirilmoqda... Navbat:', queue.length);
    
    for (let i = 0; i < queue.length; i++) {
        for (let j = i + 1; j < queue.length; j++) {
            const player1Id = queue[i];
            const player2Id = queue[j];
            
            const player1 = users[player1Id];
            const player2 = users[player2Id];
            
            if (!player1 || !player2 || !player1.connected || !player2.connected) continue;
            
            // Gender mosligini tekshirish
            if (!checkGenderCompatibility(player1, player2)) continue;
            
            // Filter mosligini tekshirish
            if (!checkFilterCompatibility(player1, player2)) continue;
            if (!checkFilterCompatibility(player2, player1)) continue;
            
            // Duel yaratish
            const duelId = generateDuelId();
            
            activeDuels[duelId] = {
                id: duelId,
                players: [player1Id, player2Id],
                votes: {},
                startedAt: Date.now(),
                timeout: Date.now() + 20000
            };
            
            // Navbatdan olib tashlash
            const index1 = queue.indexOf(player1Id);
            if (index1 > -1) queue.splice(index1, 1);
            const index2 = queue.indexOf(player2Id);
            if (index2 > -1) queue.splice(index2, 1);
            
            // Socketlarni olish
            const player1Socket = io.sockets.sockets.get(player1.socketId);
            const player2Socket = io.sockets.sockets.get(player2.socketId);
            
            if (player1Socket && player2Socket) {
                // Player 1 uchun ma'lumot
                player1Socket.emit('duel_started', {
                    duelId: duelId,
                    opponent: {
                        id: player2.id,
                        name: player2.firstName,
                        username: player2.username,
                        photo: player2.photoUrl,
                        gender: player2.gender,
                        rating: player2.rating,
                        matches: player2.matches,
                        level: player2.level || 1
                    },
                    yourRating: player1.rating
                });
                
                // Player 2 uchun ma'lumot
                player2Socket.emit('duel_started', {
                    duelId: duelId,
                    opponent: {
                        id: player1.id,
                        name: player1.firstName,
                        username: player1.username,
                        photo: player1.photoUrl,
                        gender: player1.gender,
                        rating: player1.rating,
                        matches: player1.matches,
                        level: player1.level || 1
                    },
                    yourRating: player2.rating
                });
                
                console.log(`⚔️ Duel boshlandi: ${player1.firstName} vs ${player2.firstName}`);
                
                updateWaitingCount();
                return; // Bir vaqtning o'zida bitta duel
            }
        }
    }
}

// Kunlik limitlarni yangilash
function resetDailyLimits() {
    const today = new Date().toDateString();
    console.log(`🔄 Kunlik limitlar yangilanmoqda: ${today}`);
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        if (!user) return;
        
        // Premium muddati tugaganligini tekshirish
        if (user.premium && user.premiumExpiry && new Date() > user.premiumExpiry) {
            user.premium = false;
            user.premiumExpiry = null;
            user.premiumDays = 0;
            
            const userSocket = io.sockets.sockets.get(user.socketId);
            if (userSocket) {
                userSocket.emit('premium_expired', {
                    message: 'Premium status muddati tugadi'
                });
            }
        }
        
        // Kunlik reset
        if (user.lastResetDate !== today) {
            // Super like larni yangilash
            user.dailySuperLikes = 3;
            
            // Premium bo'lsa, ko'proq super like
            if (user.premium) {
                if (user.premiumDays >= 90) {
                    user.dailySuperLikes = 20;
                } else if (user.premiumDays >= 30) {
                    user.dailySuperLikes = 10;
                } else if (user.premiumDays >= 7) {
                    user.dailySuperLikes = 5;
                }
            }
            
            user.lastResetDate = today;
            
            const userSocket = io.sockets.sockets.get(user.socketId);
            if (userSocket) {
                userSocket.emit('daily_reset', {
                    superLikes: user.dailySuperLikes,
                    date: today,
                    isPremium: user.premium
                });
            }
        }
    });
}

// Eski sovg'alarni tozalash
function cleanupOldGifts() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    Object.keys(gifts).forEach(giftId => {
        const gift = gifts[giftId];
        if (gift.createdAt < thirtyDaysAgo) {
            delete gifts[giftId];
            cleanedCount++;
        }
    });
    
    console.log(`🧹 Eski sovg'alar tozalandi: ${cleanedCount} ta`);
}

// Do'kon ma'lumotlarini olish
function getShopDataForUser(userId) {
    const user = users[userId];
    if (!user) return null;
    
    const userGiftLimits = {};
    Object.keys(giftTypes).forEach(giftType => {
        const limits = getUserGiftLimit(userId, giftType);
        userGiftLimits[giftType] = limits;
    });
    
    // Bugungi limitlar
    const today = new Date().toDateString();
    const todayLimits = dailyGiftLimits[userId]?.[today] || {};
    
    // Kategoriyalar bo'yicha mahsulotlar
    const itemsByCategory = {};
    Object.values(shopItems).forEach(item => {
        if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
        }
        
        // Foydalanuvchi uchun mahsulot ma'lumotlari
        const userItem = {
            ...item,
            canAfford: user.coins >= item.price,
            userCoins: user.coins,
            isRecommended: false
        };
        
        // Premium mahsulotlar uchun tekshirish
        if (item.category === 'premium' && user.premium) {
            userItem.canAfford = false;
            userItem.disabledReason = 'Sizda allaqachon premium status mavjud';
        }
        
        itemsByCategory[item.category].push(userItem);
    });
    
    return {
        user: {
            coins: user.coins,
            premium: user.premium,
            premiumExpiry: user.premiumExpiry,
            premiumDays: user.premiumDays,
            dailySuperLikes: user.dailySuperLikes
        },
        giftLimits: userGiftLimits,
        todayLimits: todayLimits,
        itemsByCategory: itemsByCategory,
        categories: ['coins', 'gift_limits', 'super_likes', 'premium'],
        giftTypes: giftTypes
    };
}

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
    console.log('✅ Yangi ulanish:', socket.id);
    
    // ==================== AUTHENTICATION ====================
    socket.on('auth', (data) => {
        const userId = data.userId;
        
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                firstName: data.firstName || 'Foydalanuvchi',
                lastName: data.lastName || '',
                username: data.username || '',
                photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}&background=667eea&color=fff`,
                language: data.language || 'uz',
                gender: data.gender || null,
                hasSelectedGender: data.hasSelectedGender || false,
                bio: data.bio || '',
                filter: data.filter || 'not_specified',
                rating: 1500,
                coins: data.coins || 100,
                level: 1,
                xp: 0,
                matches: 0,
                duels: 0,
                wins: 0,
                totalLikes: 0,
                dailySuperLikes: data.dailySuperLikes || 3,
                socketId: socket.id,
                connected: true,
                lastActive: new Date(),
                lastResetDate: new Date().toDateString(),
                totalGiftsSent: 0,
                totalGiftsReceived: 0,
                premium: data.premium || false,
                premiumExpiry: data.premiumExpiry || null,
                premiumDays: data.premiumDays || 0,
                premiumSince: data.premiumSince || null,
                giftStats: {
                    hearts: 0,
                    stars: 0,
                    crown: 0,
                    fire: 0,
                    diamond: 0,
                    rocket: 0,
                    trophy: 0
                }
            };
        } else {
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = new Date();
            
            // Yangilangan maydonlar
            if (data.gender !== undefined) users[userId].gender = data.gender;
            if (data.hasSelectedGender !== undefined) users[userId].hasSelectedGender = data.hasSelectedGender;
            if (data.bio !== undefined) users[userId].bio = data.bio;
            if (data.filter !== undefined) users[userId].filter = data.filter;
            if (data.coins !== undefined) users[userId].coins = data.coins;
            if (data.dailySuperLikes !== undefined) users[userId].dailySuperLikes = data.dailySuperLikes;
            if (data.premium !== undefined) users[userId].premium = data.premium;
            if (data.premiumExpiry !== undefined) users[userId].premiumExpiry = data.premiumExpiry;
            if (data.premiumDays !== undefined) users[userId].premiumDays = data.premiumDays;
        }
        
        socket.userId = userId;
        
        // Kunlik reset tekshirish
        const today = new Date().toDateString();
        if (users[userId].lastResetDate !== today) {
            users[userId].dailySuperLikes = 3;
            users[userId].lastResetDate = today;
        }
        
        // Clientga ma'lumot yuborish
        const winRate = users[userId].duels > 0 ? 
            Math.round((users[userId].wins / users[userId].duels) * 100) : 0;
        
        socket.emit('auth_ok', {
            ...users[userId],
            winRate: winRate,
            giftStats: users[userId].giftStats || {}
        });
        
        // Agar gender tanlangan bo'lsa, navbatga qo'shish
        if (users[userId].hasSelectedGender) {
            if (!queue.includes(userId)) {
                queue.push(userId);
            }
            updateWaitingCount();
            findAndStartDuels();
        } else {
            setTimeout(() => {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                });
            }, 500);
        }
    });
    
    // ==================== GENDER TANLASH ====================
    socket.on('select_gender', (data) => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        users[userId].gender = data.gender;
        users[userId].hasSelectedGender = true;
        
        socket.emit('gender_selected', {
            gender: data.gender,
            message: 'Gender muvaffaqiyatli tanlandi!'
        });
        
        // Navbatga qo'shish
        if (!queue.includes(userId)) {
            queue.push(userId);
        }
        updateWaitingCount();
        findAndStartDuels();
    });
    
    // ==================== NAVBAT TIZIMI ====================
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        if (!users[userId].hasSelectedGender) {
            socket.emit('error', { message: 'Avval gender tanlashingiz kerak!' });
            return;
        }
        
        if (!queue.includes(userId)) {
            queue.push(userId);
        }
        
        socket.emit('queue_joined', {
            position: queue.length,
            total: queue.length
        });
        
        updateWaitingCount();
        findAndStartDuels();
    });
    
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
        }
        
        updateWaitingCount();
        
        socket.emit('menu_returned');
    });
    
    socket.on('skip_to_next', () => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        // Navbatga qo'shish
        if (!queue.includes(userId)) {
            queue.push(userId);
        }
        
        updateWaitingCount();
        findAndStartDuels();
        
        socket.emit('return_to_queue');
    });
    
    socket.on('return_to_menu', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        // Navbatdan chiqarish
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
        }
        
        updateWaitingCount();
        
        socket.emit('menu_returned');
    });
    
    // ==================== DUEL VOTING ====================
    socket.on('vote', (data) => {
        const userId = socket.userId;
        const { duelId, choice } = data;
        
        if (!userId || !duelId || !choice) {
            socket.emit('error', { message: 'Noto\'g\'ri ma\'lumot' });
            return;
        }
        
        const duel = activeDuels[duelId];
        if (!duel) {
            socket.emit('error', { message: 'Duel topilmadi' });
            return;
        }
        
        // Agar o'yinchi bu duelda emas bo'lsa
        if (!duel.players.includes(userId)) {
            socket.emit('error', { message: 'Siz bu duelda emassiz' });
            return;
        }
        
        // SUPER LIKE uchun limit tekshirish
        if (choice === 'super_like') {
            const user = users[userId];
            if (user && user.dailySuperLikes <= 0) {
                socket.emit('error', { 
                    message: 'Kunlik SUPER LIKE limitingiz tugadi',
                    code: 'SUPER_LIKE_LIMIT' 
                });
                return;
            }
        }
        
        // Ovoz berish
        duel.votes[userId] = {
            choice: choice,
            timestamp: Date.now()
        };
        
        // SUPER LIKE ishlatilgan bo'lsa, limitni kamaytirish
        if (choice === 'super_like') {
            const user = users[userId];
            if (user && user.dailySuperLikes > 0) {
                user.dailySuperLikes--;
                socket.emit('super_like_used', {
                    remaining: user.dailySuperLikes
                });
            }
        }
        
        console.log(`🗳️ Ovoz berildi: ${users[userId]?.firstName} - ${choice}`);
        
        // Agar ikkala o'yinchi ham ovoz berga bo'lsa, natijani hal qilish
        if (Object.keys(duel.votes).length === 2) {
            setTimeout(() => resolveDuel(duelId), 500);
        }
    });
    
    // ==================== PROFIL YANGILASH ====================
    socket.on('update_profile', (data) => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        if (data.bio !== undefined) users[userId].bio = data.bio;
        if (data.gender !== undefined) {
            users[userId].gender = data.gender;
            users[userId].hasSelectedGender = true;
        }
        
        socket.emit('profile_updated', {
            bio: users[userId].bio,
            gender: users[userId].gender,
            hasSelectedGender: users[userId].hasSelectedGender,
            coins: users[userId].coins,
            rating: users[userId].rating,
            matches: users[userId].matches
        });
    });
    
    // ==================== SOVG'A TIZIMI ====================
    socket.on('send_gift', (data) => {
        const userId = socket.userId;
        const { receiverId, giftType, message } = data;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling', code: 'AUTH_REQUIRED' });
            return;
        }
        
        if (!receiverId || !users[receiverId]) {
            socket.emit('error', { message: 'Qabul qiluvchi topilmadi', code: 'RECEIVER_NOT_FOUND' });
            return;
        }
        
        // Do'st ekanligini tekshirish (mutual match)
        const mutualMatchIds = getMutualMatches(userId);
        if (!mutualMatchIds.includes(receiverId)) {
            socket.emit('error', { 
                message: 'Faqat o\'zaro match bo\'lgan do\'stlarga sovg\'a yuborish mumkin', 
                code: 'NOT_FRIEND' 
            });
            return;
        }
        
        // Sovg'ani yuborish
        const result = sendGift(userId, receiverId, giftType, message);
        
        if (result.success) {
            // Jo'natuvchiga xabar
            socket.emit('gift_sent_success', {
                giftId: result.giftId,
                transactionId: result.transactionId,
                receiverName: users[receiverId].firstName,
                giftInfo: result.giftInfo,
                coinsSpent: result.giftInfo.price,
                remainingCoins: result.senderCoins,
                limits: result.limits
            });
            
            // Foydalanuvchi ma'lumotlarini yangilash
            users[userId].coins = result.senderCoins;
            users[userId].giftStats[giftType] = (users[userId].giftStats[giftType] || 0) + 1;
            users[userId].totalGiftsSent = (users[userId].totalGiftsSent || 0) + 1;
            
            // Qabul qiluvchiga xabar
            const receiverSocket = io.sockets.sockets.get(users[receiverId].socketId);
            if (receiverSocket) {
                receiverSocket.emit('new_gift_notification', {
                    giftId: result.giftId,
                    senderId: userId,
                    senderName: users[userId].firstName,
                    giftType: giftType,
                    giftName: giftTypes[giftType].name,
                    giftIcon: giftType === 'hearts' ? '❤️' : 
                             giftType === 'stars' ? '⭐' : 
                             giftType === 'crown' ? '👑' : 
                             giftType === 'fire' ? '🔥' : 
                             giftType === 'diamond' ? '💎' : 
                             giftType === 'rocket' ? '🚀' : '🏆',
                    message: message,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                });
            }
            
            // Do'kon ma'lumotlarini yangilash
            updateShopDataForUser(userId);
            updateShopDataForUser(receiverId);
            
        } else {
            socket.emit('gift_error', {
                message: result.message,
                code: result.code,
                details: result
            });
        }
    });
    
    socket.on('accept_gift', (data) => {
        const userId = socket.userId;
        const { giftId } = data;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        const result = acceptGift(giftId, userId);
        
        if (result.success) {
            socket.emit('gift_accepted_confirmation', result);
            
            // Foydalanuvchi ma'lumotlarini yangilash
            users[userId].totalGiftsReceived = (users[userId].totalGiftsReceived || 0) + 1;
            
            // Do'kon ma'lumotlarini yangilash
            updateShopDataForUser(userId);
            
        } else {
            socket.emit('gift_error', {
                message: result.message,
                code: result.code
            });
        }
    });
    
    socket.on('reject_gift', (data) => {
        const userId = socket.userId;
        const { giftId } = data;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        const gift = gifts[giftId];
        if (!gift || gift.receiverId !== userId) {
            socket.emit('error', { message: 'Sovg\'a topilmadi' });
            return;
        }
        
        if (gift.status !== 'pending') {
            socket.emit('error', { message: 'Sovg\'a allaqachon qabul qilingan' });
            return;
        }
        
        // Sovg'ani rad etish
        gift.status = 'rejected';
        gift.rejectedAt = new Date();
        
        // Jo'natuvchiga xabar (agar online bo'lsa)
        const senderSocket = io.sockets.sockets.get(users[gift.senderId]?.socketId);
        if (senderSocket) {
            senderSocket.emit('gift_rejected', {
                giftId: giftId,
                receiverName: users[userId].firstName,
                giftType: gift.giftType
            });
        }
        
        socket.emit('gift_rejected_success', {
            giftId: giftId,
            message: 'Sovg\'a rad etildi'
        });
    });
    
    socket.on('get_gifts', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        // Qabul qilingan sovg'alar
        const receivedGifts = Object.values(gifts)
            .filter(gift => gift.receiverId === userId)
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(gift => ({
                id: gift.id,
                senderId: gift.senderId,
                senderName: users[gift.senderId]?.firstName || 'Anonim',
                senderPhoto: users[gift.senderId]?.photoUrl,
                giftType: gift.giftType,
                giftName: gift.giftName,
                giftIcon: gift.giftIcon,
                status: gift.status,
                message: gift.message,
                createdAt: gift.createdAt,
                expiresAt: gift.expiresAt,
                isExpired: new Date() > gift.expiresAt,
                canAccept: gift.status === 'pending' && new Date() <= gift.expiresAt,
                acceptedAt: gift.acceptedAt
            }));
        
        // Yuborilgan sovg'alar
        const sentGifts = Object.values(gifts)
            .filter(gift => gift.senderId === userId)
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(gift => ({
                id: gift.id,
                receiverId: gift.receiverId,
                receiverName: users[gift.receiverId]?.firstName || 'Anonim',
                receiverPhoto: users[gift.receiverId]?.photoUrl,
                giftType: gift.giftType,
                giftName: gift.giftName,
                giftIcon: gift.giftIcon,
                status: gift.status,
                message: gift.message,
                createdAt: gift.createdAt,
                acceptedAt: gift.acceptedAt,
                rejectedAt: gift.rejectedAt,
                price: gift.price
            }));
        
        // Kunlik limitlar
        const today = new Date().toDateString();
        const userLimits = dailyGiftLimits[userId] || {};
        const todayLimits = userLimits[today] || {};
        
        const dailyLimits = {};
        Object.keys(giftTypes).forEach(type => {
            const giftInfo = giftTypes[type];
            const limits = getUserGiftLimit(userId, type);
            const sentToday = todayLimits[type] || 0;
            
            dailyLimits[type] = {
                name: giftInfo.name,
                icon: giftInfo.icon || (type === 'hearts' ? '❤️' : 
                      type === 'stars' ? '⭐' : 
                      type === 'crown' ? '👑' : 
                      type === 'fire' ? '🔥' : 
                      type === 'diamond' ? '💎' : 
                      type === 'rocket' ? '🚀' : '🏆'),
                color: giftInfo.color,
                dailyFreeLimit: giftInfo.dailyFreeLimit,
                purchasedLimit: limits.purchasedLimit,
                totalLimit: limits.totalLimit,
                price: giftInfo.price,
                sent: sentToday,
                remaining: limits.totalLimit - sentToday,
                premiumOnly: giftInfo.premiumOnly || false,
                canSend: limits.totalLimit > sentToday && 
                        (!giftInfo.premiumOnly || users[userId].premium)
            };
        });
        
        socket.emit('gifts_data', {
            received: receivedGifts,
            sent: sentGifts,
            dailyLimits: dailyLimits,
            stats: {
                totalReceived: receivedGifts.length,
                totalSent: sentGifts.length,
                pending: receivedGifts.filter(g => g.status === 'pending' && !g.isExpired).length,
                accepted: receivedGifts.filter(g => g.status === 'accepted').length
            },
            user: {
                coins: users[userId].coins,
                premium: users[userId].premium,
                giftStats: users[userId].giftStats || {}
            }
        });
    });
    
    socket.on('get_shop_data', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        const shopData = getShopDataForUser(userId);
        if (shopData) {
            socket.emit('shop_data', shopData);
        } else {
            socket.emit('error', { message: 'Do\'kon ma\'lumotlari topilmadi' });
        }
    });
    
    socket.on('buy_shop_item', (data) => {
        const userId = socket.userId;
        const { itemId } = data;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        const result = buyShopItem(userId, itemId);
        
        if (result.success) {
            socket.emit('shop_purchase_success', result);
            
            // Mahsulot turiga qarab qo'shimcha amallar
            if (result.itemType === 'premium') {
                socket.emit('premium_activated', {
                    days: result.days,
                    expiry: result.premiumExpiry,
                    benefits: result.benefits
                });
            }
            
            // Do'kon ma'lumotlarini yangilash
            updateShopDataForUser(userId);
            
        } else {
            socket.emit('shop_purchase_error', {
                message: result.message,
                code: result.code,
                details: result
            });
        }
    });
    
    // ==================== DISCONNECT HANDLER ====================
    socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId && users[userId]) {
            users[userId].connected = false;
            users[userId].lastActive = new Date();
            
            // Navbatdan olib tashlash
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                updateWaitingCount();
            }
            
            // Faol duelda bo'lsa, duelni tugatish
            for (const duelId in activeDuels) {
                const duel = activeDuels[duelId];
                if (duel.players.includes(userId)) {
                    // Qolgan o'yinchi uchun xabar
                    const otherPlayerId = duel.players.find(id => id !== userId);
                    const otherPlayerSocket = otherPlayerId ? 
                        io.sockets.sockets.get(users[otherPlayerId]?.socketId) : null;
                    
                    if (otherPlayerSocket) {
                        otherPlayerSocket.emit('opponent_left');
                    }
                    
                    delete activeDuels[duelId];
                    break;
                }
            }
            
            console.log('❌ Ulanish uzildi:', userId, users[userId]?.firstName);
        }
    });
    
    // ==================== QO'SHIMCHA HANDLERS ====================
    socket.on('get_friends_for_gifts', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) return;
        
        const mutualMatchIds = getMutualMatches(userId);
        const friendsList = mutualMatchIds.map(friendId => {
            const friend = users[friendId];
            if (!friend) return null;
            
            return {
                id: friend.id,
                name: friend.firstName,
                username: friend.username,
                photo: friend.photoUrl,
                online: friend.connected,
                lastActive: friend.lastActive,
                gender: friend.gender,
                rating: friend.rating,
                premium: friend.premium,
                lastGiftSent: getLastGiftSent(userId, friendId)
            };
        }).filter(friend => friend !== null);
        
        socket.emit('friends_gift_list', {
            friends: friendsList,
            total: friendsList.length,
            online: friendsList.filter(f => f.online).length
        });
    });
    
    socket.on('rematch_request', (data) => {
        const userId = socket.userId;
        const { opponentId } = data;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) return;
        
        const opponentSocket = io.sockets.sockets.get(users[opponentId].socketId);
        if (opponentSocket) {
            opponentSocket.emit('rematch_request', {
                opponentName: users[userId].firstName,
                opponentId: userId
            });
        }
    });
    
    socket.on('accept_rematch', (data) => {
        const userId = socket.userId;
        const { opponentId } = data;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) return;
        
        // Ikki o'yinchini navbatga qo'shish
        if (!queue.includes(userId)) queue.push(userId);
        if (!queue.includes(opponentId)) queue.push(opponentId);
        
        updateWaitingCount();
        findAndStartDuels();
    });
});

// Oxirgi sovg'ani olish
function getLastGiftSent(senderId, receiverId) {
    const sentGifts = Object.values(gifts).filter(
        gift => gift.senderId === senderId && gift.receiverId === receiverId
    );
    
    if (sentGifts.length === 0) return null;
    
    const lastGift = sentGifts.sort((a, b) => b.createdAt - a.createdAt)[0];
    return {
        giftType: lastGift.giftType,
        giftName: lastGift.giftName,
        createdAt: lastGift.createdAt,
        status: lastGift.status
    };
}

// Do'kon ma'lumotlarini yangilash
function updateShopDataForUser(userId) {
    const user = users[userId];
    if (!user) return;
    
    const userSocket = io.sockets.sockets.get(user.socketId);
    if (!userSocket) return;
    
    const shopData = getShopDataForUser(userId);
    if (shopData) {
        userSocket.emit('shop_data_updated', shopData);
    }
}

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🎁 LIKE DUEL - TO\'LIQ SOVG\'A TIZIMI');
    console.log('='.repeat(70));
    console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🛒 Do\'kon: http://0.0.0.0:${PORT}/api/shop`);
    console.log('='.repeat(70));
    console.log('✅ Sovg\'a turlari: ❤️ ⭐ 👑 🔥 💎 🚀 🏆');
    console.log('✅ Do\'kon mahsulotlari: 15+ turdagi paketlar');
    console.log('✅ Premium tizimi: 3 darajali premium status');
    console.log('✅ Duel tizimi: Gender filter + rating tizimi');
    console.log('='.repeat(70));
});

// Har soatda kunlik limitlarni yangilash
setInterval(resetDailyLimits, 60 * 60 * 1000);

// Har 6 soatda eski sovg'alarni tozalash
setInterval(cleanupOldGifts, 6 * 60 * 60 * 1000);

// Har 30 soniyada stats log
setInterval(() => {
    console.log(`📊 Stats: Users: ${Object.keys(users).length}, Queue: ${queue.length}, Gifts: ${Object.keys(gifts).length}, Active Duels: ${Object.keys(activeDuels).length}`);
}, 30000);