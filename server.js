const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ==================== SOCKET.IO CONFIG ====================
const io = new Server(server, {
    cors: {
        origin: [
            'https://like-duel.onrender.com',
            'https://like-duel-game.onrender.com',
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:3000',
            'https://like-duel.vercel.app',
            'https://like-duel-client.vercel.app'
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: [
        'https://like-duel.onrender.com',
        'https://like-duel-game.onrender.com',
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:3000',
        'https://like-duel.vercel.app',
        'https://like-duel-client.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster0.mongodb.net/likeduel?retryWrites=true&w=majority';
let isMongoConnected = false;

async function connectToMongoDB() {
    try {
        if (!MONGODB_URI.includes('localhost') && MONGODB_URI !== 'mongodb://localhost:27017/likeduel') {
            console.log('🔄 MongoDB ga ulanish urinilmoqda...');
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            isMongoConnected = true;
            console.log('✅ MongoDB ga ulandi');
        } else {
            console.log('ℹ️ Local MongoDB, test rejimi');
            isMongoConnected = false;
        }
    } catch (error) {
        console.error('❌ MongoDB xatosi:', error.message);
        console.log('🔄 Test rejimiga o\'tildi');
        isMongoConnected = false;
    }
}

connectToMongoDB();

// ==================== DATABASE SCHEMAS ====================
let User, MutualMatch, Duel;

if (isMongoConnected) {
    const userSchema = new mongoose.Schema({
        userId: { type: String, required: true, unique: true },
        firstName: String,
        username: String,
        photoUrl: String,
        gender: { type: String, enum: ['male', 'female', 'not_specified'], default: 'not_specified' },
        hasSelectedGender: { type: Boolean, default: false },
        bio: { type: String, default: '' },
        filter: { type: String, enum: ['male', 'female', 'not_specified'], default: 'not_specified' },
        rating: { type: Number, default: 1500 },
        coins: { type: Number, default: 100 },
        level: { type: Number, default: 1 },
        matches: { type: Number, default: 0 },
        duels: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 },
        mutualMatchesCount: { type: Number, default: 0 },
        friendsCount: { type: Number, default: 0 },
        dailySuperLikes: { type: Number, default: 3 },
        lastResetDate: { type: String, default: () => new Date().toDateString() },
        socketId: String,
        connected: { type: Boolean, default: false },
        lastActive: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    });

    const mutualMatchSchema = new mongoose.Schema({
        user1Id: { type: String, required: true },
        user2Id: { type: String, required: true },
        user1Name: String,
        user2Name: String,
        user1Photo: String,
        user2Photo: String,
        isSuperLike: { type: Boolean, default: false },
        chatEnabled: { type: Boolean, default: true },
        lastMessage: String,
        lastMessageTime: Date,
        createdAt: { type: Date, default: Date.now }
    });

    const duelSchema = new mongoose.Schema({
        duelId: { type: String, required: true, unique: true },
        player1Id: { type: String, required: true },
        player2Id: { type: String, required: true },
        player1Name: String,
        player2Name: String,
        player1Photo: String,
        player2Photo: String,
        player1Gender: String,
        player2Gender: String,
        votes: { type: Map, of: String, default: {} },
        startTime: { type: Date, default: Date.now },
        ended: { type: Boolean, default: false },
        resultsSent: { type: Boolean, default: false },
        winnerId: String,
        mutualMatch: { type: Boolean, default: false },
        superLikeUsed: { type: Boolean, default: false }
    });

    User = mongoose.model('User', userSchema);
    MutualMatch = mongoose.model('MutualMatch', mutualMatchSchema);
    Duel = mongoose.model('Duel', duelSchema);
}

// ==================== IN-MEMORY STORAGE (TEST MODE) ====================
const usersDB = new Map();
const duelsDB = new Map();
const mutualMatchesDB = new Map();
const onlineUsers = new Map();
const queue = [];
const activeDuels = new Map();

// ==================== UTILITY FUNCTIONS ====================
function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function getCompatibility(user1, user2) {
    // Jins filter tekshirish
    if (user1.filter !== 'not_specified' && user1.filter !== user2.gender) {
        return 0;
    }
    if (user2.filter !== 'not_specified' && user2.filter !== user1.gender) {
        return 0;
    }
    
    // Rating farqiga qarab match ehtimoli
    const ratingDiff = Math.abs(user1.rating - user2.rating);
    let compatibility = 50;
    
    if (ratingDiff < 100) compatibility = 70;
    if (ratingDiff < 50) compatibility = 85;
    if (ratingDiff > 200) compatibility = 30;
    if (ratingDiff > 300) compatibility = 15;
    
    return compatibility;
}

function calculateRewards(isMutual, isSuperLike, ratingDiff) {
    let coins = 10;
    let xp = 20;
    
    if (isMutual) {
        coins += 15;
        xp += 30;
    }
    
    if (isSuperLike) {
        coins += 25;
        xp += 50;
    }
    
    // Rating farqi bo'yicha bonus
    if (ratingDiff > 200) {
        coins += Math.floor(ratingDiff / 100) * 5;
        xp += Math.floor(ratingDiff / 100) * 10;
    }
    
    return { coins, xp };
}

function calculateRatingChange(playerRating, opponentRating, result) {
    // result: 1 - g'alaba, 0.5 - durang, 0 - mag'lubiyat
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const newRating = Math.round(playerRating + K * (result - expectedScore));
    return Math.max(100, newRating);
}

function resetDailySuperLikes() {
    const today = new Date().toDateString();
    
    if (isMongoConnected) {
        User.updateMany(
            { lastResetDate: { $ne: today } },
            { 
                dailySuperLikes: 3,
                lastResetDate: today 
            }
        ).exec();
    } else {
        for (const [userId, user] of usersDB.entries()) {
            if (user.lastResetDate !== today) {
                user.dailySuperLikes = 3;
                user.lastResetDate = today;
            }
        }
    }
}

// Kunlik reset
setInterval(resetDailySuperLikes, 3600000); // Har soat tekshiradi
resetDailySuperLikes();

// ==================== USER MANAGEMENT ====================
async function getOrCreateUser(userData) {
    const { userId, firstName, username, photoUrl } = userData;
    
    if (isMongoConnected) {
        try {
            let user = await User.findOne({ userId });
            
            if (!user) {
                user = new User({
                    userId,
                    firstName,
                    username,
                    photoUrl,
                    coins: 100,
                    rating: 1500,
                    level: 1,
                    dailySuperLikes: 3,
                    lastResetDate: new Date().toDateString(),
                    connected: true,
                    lastActive: new Date()
                });
                await user.save();
                console.log(`✅ Yangi foydalanuvchi yaratildi: ${firstName}`);
            } else {
                user.connected = true;
                user.lastActive = new Date();
                await user.save();
            }
            
            return user.toObject();
        } catch (error) {
            console.error('❌ Foydalanuvchi olish xatosi:', error);
            return createTestUser(userData);
        }
    } else {
        return createTestUser(userData);
    }
}

function createTestUser(userData) {
    const { userId, firstName, username, photoUrl } = userData;
    
    if (!usersDB.has(userId)) {
        const user = {
            userId,
            firstName,
            username,
            photoUrl,
            gender: 'not_specified',
            hasSelectedGender: false,
            bio: '',
            filter: 'not_specified',
            rating: 1500,
            coins: 100,
            level: 1,
            matches: 0,
            duels: 0,
            wins: 0,
            totalLikes: 0,
            mutualMatchesCount: 0,
            friendsCount: 0,
            dailySuperLikes: 3,
            lastResetDate: new Date().toDateString(),
            socketId: null,
            connected: false,
            lastActive: new Date()
        };
        usersDB.set(userId, user);
        console.log(`✅ Test rejimida yangi foydalanuvchi: ${firstName}`);
    }
    
    return usersDB.get(userId);
}

async function updateUser(userId, updateData) {
    if (isMongoConnected) {
        try {
            const user = await User.findOneAndUpdate(
                { userId },
                { ...updateData, updatedAt: new Date() },
                { new: true }
            );
            return user ? user.toObject() : null;
        } catch (error) {
            console.error('❌ Foydalanuvchi yangilash xatosi:', error);
            return null;
        }
    } else {
        if (usersDB.has(userId)) {
            const user = usersDB.get(userId);
            Object.assign(user, updateData);
            user.updatedAt = new Date();
            usersDB.set(userId, user);
            return user;
        }
        return null;
    }
}

async function getUser(userId) {
    if (isMongoConnected) {
        try {
            const user = await User.findOne({ userId });
            return user ? user.toObject() : null;
        } catch (error) {
            console.error('❌ Foydalanuvchi olish xatosi:', error);
            return usersDB.get(userId) || null;
        }
    } else {
        return usersDB.get(userId) || null;
    }
}

// ==================== QUEUE MANAGEMENT ====================
function addToQueue(socketId, userData) {
    // User allaqachon navbatda tekshirish
    const existingIndex = queue.findIndex(item => item.userId === userData.userId);
    if (existingIndex !== -1) {
        queue[existingIndex] = { socketId, ...userData, joinedAt: new Date() };
        return queue.length;
    }
    
    queue.push({ socketId, ...userData, joinedAt: new Date() });
    
    // Navbat haqida ma'lumot yuborish
    io.to(socketId).emit('queue_joined', {
        position: queue.length,
        total: queue.length
    });
    
    console.log(`📥 Navbatga qo'shildi: ${userData.firstName}. Navbatda: ${queue.length} kishi`);
    
    // Match qidirishni boshlash
    findMatch();
    
    return queue.length;
}

function removeFromQueue(userId) {
    const index = queue.findIndex(item => item.userId === userId);
    if (index !== -1) {
        queue.splice(index, 1);
        console.log(`📤 Navbatdan chiqdi: ${userId}. Navbatda: ${queue.length} kishi`);
        
        // Qolganlarni yangilash
        queue.forEach((item, idx) => {
            io.to(item.socketId).emit('waiting_count', {
                position: idx + 1,
                count: queue.length
            });
        });
    }
    return queue.length;
}

function findMatch() {
    if (queue.length < 2) return;
    
    console.log(`🔍 Match qidirilmoqda... Navbatda: ${queue.length} kishi`);
    
    // Sodda match: birinchi ikkitasini olish
    const player1 = queue[0];
    const player2 = queue[1];
    
    // Compatability tekshirish
    const compatibility = getCompatibility(player1, player2);
    const randomChance = Math.random() * 100;
    
    if (randomChance <= compatibility) {
        // Match topildi
        createDuel(player1, player2);
        return;
    }
    
    // Compatability past bo'lsa, boshqa kombinatsiyalarni sinash
    for (let i = 0; i < Math.min(queue.length, 5); i++) {
        for (let j = i + 1; j < Math.min(queue.length, 5); j++) {
            if (i === 0 && j === 1) continue; // Allaqachon tekshirilgan
            
            const p1 = queue[i];
            const p2 = queue[j];
            const comp = getCompatibility(p1, p2);
            
            if (Math.random() * 100 <= comp) {
                createDuel(p1, p2);
                return;
            }
        }
    }
}

function createDuel(player1, player2) {
    const duelId = generateDuelId();
    
    // Navbatdan olib tashlash
    removeFromQueue(player1.userId);
    removeFromQueue(player2.userId);
    
    // Duel yaratish
    const duelData = {
        duelId,
        player1Id: player1.userId,
        player2Id: player2.userId,
        player1Name: player1.firstName,
        player2Name: player2.firstName,
        player1Photo: player1.photoUrl,
        player2Photo: player2.photoUrl,
        player1Gender: player1.gender,
        player2Gender: player2.gender,
        votes: new Map(),
        startTime: new Date(),
        ended: false,
        resultsSent: false
    };
    
    if (isMongoConnected) {
        const duel = new Duel(duelData);
        duel.save().catch(err => console.error('❌ Duel saqlash xatosi:', err));
    } else {
        duelsDB.set(duelId, duelData);
    }
    
    activeDuels.set(player1.userId, duelId);
    activeDuels.set(player2.userId, duelId);
    
    // O'yinchilarga duel boshlanishini bildirish
    io.to(player1.socketId).emit('duel_started', {
        duelId,
        opponent: {
            name: player2.firstName,
            username: player2.username,
            photo: player2.photoUrl,
            rating: player2.rating,
            matches: player2.matches,
            level: player2.level,
            gender: player2.gender
        }
    });
    
    io.to(player2.socketId).emit('duel_started', {
        duelId,
        opponent: {
            name: player1.firstName,
            username: player1.username,
            photo: player1.photoUrl,
            rating: player1.rating,
            matches: player1.matches,
            level: player1.level,
            gender: player1.gender
        }
    });
    
    console.log(`⚔️ Duel yaratildi: ${player1.firstName} vs ${player2.firstName}`);
    
    // 20 soniya ichida ovoz berilmaganda timeout
    setTimeout(() => {
        checkDuelTimeout(duelId);
    }, 20000);
}

// ==================== DUEL MANAGEMENT ====================
async function processVote(duelId, userId, choice) {
    let duel;
    
    if (isMongoConnected) {
        duel = await Duel.findOne({ duelId });
    } else {
        duel = duelsDB.get(duelId);
    }
    
    if (!duel || duel.ended) return;
    
    // Ovoz qo'shish
    duel.votes.set(userId, choice);
    
    if (isMongoConnected) {
        duel.markModified('votes');
        await duel.save();
    } else {
        duelsDB.set(duelId, duel);
    }
    
    console.log(`🗳️ Ovoz berildi: ${userId} - ${choice}`);
    
    // Ikkala o'yinchi ham ovoz berganda natijani hisoblash
    if (duel.votes.size === 2) {
        await calculateDuelResult(duelId);
    }
}

async function calculateDuelResult(duelId) {
    let duel;
    
    if (isMongoConnected) {
        duel = await Duel.findOne({ duelId });
        if (!duel || duel.ended) return;
    } else {
        duel = duelsDB.get(duelId);
        if (!duel || duel.ended) return;
    }
    
    duel.ended = true;
    const player1 = await getUser(duel.player1Id);
    const player2 = await getUser(duel.player2Id);
    
    const vote1 = duel.votes.get(duel.player1Id) || 'skip';
    const vote2 = duel.votes.get(duel.player2Id) || 'skip';
    
    const ratingDiff = Math.abs(player1.rating - player2.rating);
    
    // Natijalarni aniqlash
    let isMutual = false;
    let isSuperLike = false;
    let mutualMatchCreated = false;
    
    // O'zaro like tekshirish
    if ((vote1 === 'like' || vote1 === 'super_like') && 
        (vote2 === 'like' || vote2 === 'super_like')) {
        isMutual = true;
        
        // Super like tekshirish
        if (vote1 === 'super_like' || vote2 === 'super_like') {
            isSuperLike = true;
            
            // O'zaro super like - do'st bo'lish
            await createMutualMatch(duel.player1Id, duel.player2Id, true);
            mutualMatchCreated = true;
            
            // Do'stlar sonini yangilash
            await updateUser(duel.player1Id, { 
                $inc: { friendsCount: 1, mutualMatchesCount: 1 }
            });
            await updateUser(duel.player2Id, { 
                $inc: { friendsCount: 1, mutualMatchesCount: 1 }
            });
        }
    }
    
    // Mukofotlarni hisoblash
    const rewards = calculateRewards(isMutual, isSuperLike, ratingDiff);
    
    // Foydalanuvchi ma'lumotlarini yangilash
    const updates1 = {
        $inc: { 
            duels: 1,
            totalLikes: 1,
            coins: rewards.coins
        }
    };
    
    const updates2 = {
        $inc: { 
            duels: 1,
            totalLikes: 1,
            coins: rewards.coins
        }
    };
    
    if (isMutual) {
        updates1.$inc.matches = 1;
        updates1.$inc.wins = 1;
        updates2.$inc.matches = 1;
        updates2.$inc.wins = 1;
    }
    
    // Rating o'zgarishi
    if (isMutual) {
        const player1NewRating = calculateRatingChange(player1.rating, player2.rating, 1);
        const player2NewRating = calculateRatingChange(player2.rating, player1.rating, 1);
        
        updates1.$inc.rating = player1NewRating - player1.rating;
        updates2.$inc.rating = player2NewRating - player2.rating;
    } else {
        // Bir tomonli like - durang deb hisoblaymiz
        const player1Result = vote1 === 'like' || vote1 === 'super_like' ? 0.5 : 0;
        const player2Result = vote2 === 'like' || vote2 === 'super_like' ? 0.5 : 0;
        
        const player1NewRating = calculateRatingChange(player1.rating, player2.rating, player1Result);
        const player2NewRating = calculateRatingChange(player2.rating, player1.rating, player2Result);
        
        updates1.$inc.rating = player1NewRating - player1.rating;
        updates2.$inc.rating = player2NewRating - player2.rating;
    }
    
    await updateUser(duel.player1Id, updates1);
    await updateUser(duel.player2Id, updates2);
    
    // O'yinchilarga natijalarni yuborish
    const player1Socket = onlineUsers.get(duel.player1Id);
    const player2Socket = onlineUsers.get(duel.player2Id);
    
    // Player1 uchun natija
    if (player1Socket) {
        io.to(player1Socket).emit('match', {
            partner: {
                name: duel.player2Name,
                username: player2.username,
                photo: duel.player2Photo
            },
            isMutual,
            isSuperLike,
            rewards,
            vote1,
            vote2
        });
        
        if (mutualMatchCreated) {
            io.to(player1Socket).emit('mutual_match', {
                partnerName: duel.player2Name,
                partnerId: duel.player2Id,
                mutualMatchesCount: (player1.mutualMatchesCount || 0) + 1,
                friendsCount: (player1.friendsCount || 0) + 1,
                isSuperLike
            });
        }
    }
    
    // Player2 uchun natija
    if (player2Socket) {
        io.to(player2Socket).emit('match', {
            partner: {
                name: duel.player1Name,
                username: player1.username,
                photo: duel.player1Photo
            },
            isMutual,
            isSuperLike,
            rewards,
            vote1,
            vote2
        });
        
        if (mutualMatchCreated) {
            io.to(player2Socket).emit('mutual_match', {
                partnerName: duel.player1Name,
                partnerId: duel.player1Id,
                mutualMatchesCount: (player2.mutualMatchesCount || 0) + 1,
                friendsCount: (player2.friendsCount || 0) + 1,
                isSuperLike
            });
        }
    }
    
    // Faol duellarni tozalash
    activeDuels.delete(duel.player1Id);
    activeDuels.delete(duel.player2Id);
    
    // Duel ma'lumotlarini yangilash
    duel.resultsSent = true;
    duel.winnerId = isMutual ? 'mutual' : 'none';
    duel.superLikeUsed = isSuperLike;
    duel.mutualMatch = isMutual;
    
    if (isMongoConnected) {
        await duel.save();
    } else {
        duelsDB.set(duelId, duel);
    }
    
    console.log(`🎉 Duel yakunlandi: ${duel.player1Name} vs ${duel.player2Name} - Mutual: ${isMutual}, SuperLike: ${isSuperLike}`);
}

async function createMutualMatch(user1Id, user2Id, isSuperLike = false) {
    const user1 = await getUser(user1Id);
    const user2 = await getUser(user2Id);
    
    if (!user1 || !user2) return;
    
    const matchId = `match_${user1Id}_${user2Id}_${Date.now()}`;
    
    const matchData = {
        user1Id,
        user2Id,
        user1Name: user1.firstName,
        user2Name: user2.firstName,
        user1Photo: user1.photoUrl,
        user2Photo: user2.photoUrl,
        isSuperLike,
        chatEnabled: true,
        createdAt: new Date()
    };
    
    if (isMongoConnected) {
        const existingMatch = await MutualMatch.findOne({
            $or: [
                { user1Id, user2Id },
                { user1Id: user2Id, user2Id: user1Id }
            ]
        });
        
        if (!existingMatch) {
            const match = new MutualMatch(matchData);
            await match.save();
        }
    } else {
        const matchKey = `${user1Id}_${user2Id}`;
        const reverseKey = `${user2Id}_${user1Id}`;
        
        if (!mutualMatchesDB.has(matchKey) && !mutualMatchesDB.has(reverseKey)) {
            mutualMatchesDB.set(matchKey, matchData);
        }
    }
}

function checkDuelTimeout(duelId) {
    let duel;
    
    if (isMongoConnected) {
        Duel.findOne({ duelId }).then(foundDuel => {
            if (foundDuel && !foundDuel.ended) {
                handleDuelTimeout(foundDuel);
            }
        });
    } else {
        duel = duelsDB.get(duelId);
        if (duel && !duel.ended) {
            handleDuelTimeout(duel);
        }
    }
}

async function handleDuelTimeout(duel) {
    duel.ended = true;
    
    const player1Socket = onlineUsers.get(duel.player1Id);
    const player2Socket = onlineUsers.get(duel.player2Id);
    
    // Vaqt tugagani haqida xabar berish
    if (player1Socket) {
        io.to(player1Socket).emit('timeout');
    }
    if (player2Socket) {
        io.to(player2Socket).emit('timeout');
    }
    
    // Faol duellarni tozalash
    activeDuels.delete(duel.player1Id);
    activeDuels.delete(duel.player2Id);
    
    // Navbatdan ham chiqarish (agar navbatda bo'lsa)
    removeFromQueue(duel.player1Id);
    removeFromQueue(duel.player2Id);
    
    // Duel ma'lumotlarini yangilash
    if (isMongoConnected) {
        await duel.save();
    } else {
        duelsDB.set(duel.duelId, duel);
    }
    
    console.log(`⏰ Duel vaqti tugadi: ${duel.duelId}`);
}

// ==================== SOCKET.IO EVENT HANDLERS ====================
io.on('connection', (socket) => {
    console.log(`🔌 Client ulandi: ${socket.id}`);
    
    // Auth event
    socket.on('auth', async (userData) => {
        try {
            if (!userData.userId) {
                userData.userId = generateUserId();
            }
            
            const user = await getOrCreateUser(userData);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi yaratilmadi' });
                return;
            }
            
            // Online users ro'yxatiga qo'shish
            onlineUsers.set(user.userId, socket.id);
            
            // Socket ID ni saqlash
            await updateUser(user.userId, { 
                socketId: socket.id,
                connected: true,
                lastActive: new Date()
            });
            
            // Auth javobi
            socket.emit('auth_ok', user);
            
            console.log(`✅ Foydalanuvchi auth qilindi: ${user.firstName} (${user.userId})`);
            
            // Jins tanlamagan bo'lsa, modalni ko'rsatish
            if (!user.hasSelectedGender) {
                socket.emit('show_gender_selection');
            }
            
        } catch (error) {
            console.error('❌ Auth xatosi:', error);
            socket.emit('error', { message: 'Auth jarayonida xato' });
        }
    });
    
    // Jins tanlash
    socket.on('select_gender', async (data) => {
        try {
            const { gender } = data;
            const userId = getUserIdBySocket(socket.id);
            
            if (!userId) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            await updateUser(userId, { 
                gender,
                hasSelectedGender: true 
            });
            
            socket.emit('gender_selected', { gender });
            
            // Barcha connected clientlarga yangilangan ma'lumotni yuborish
            socket.emit('auth_ok', await getUser(userId));
            
            console.log(`🎯 Jins tanlandi: ${userId} - ${gender}`);
            
        } catch (error) {
            console.error('❌ Jins tanlash xatosi:', error);
            socket.emit('error', { message: 'Jins tanlashda xato' });
        }
    });
    
    // Profil yangilash
    socket.on('update_profile', async (data) => {
        try {
            const userId = getUserIdBySocket(socket.id);
            
            if (!userId) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            await updateUser(userId, data);
            
            socket.emit('profile_updated', data);
            
            console.log(`📝 Profil yangilandi: ${userId}`);
            
        } catch (error) {
            console.error('❌ Profil yangilash xatosi:', error);
            socket.emit('error', { message: 'Profil yangilashda xato' });
        }
    });
    
    // Navbatga kirish
    socket.on('enter_queue', async () => {
        try {
            const userId = getUserIdBySocket(socket.id);
            
            if (!userId) {
                socket.emit('error', { message: 'Avval tizimga kiring' });
                return;
            }
            
            const user = await getUser(userId);
            
            if (!user.hasSelectedGender) {
                socket.emit('show_gender_selection');
                socket.emit('error', { message: 'Avval jins tanlashingiz kerak' });
                return;
            }
            
            // Aktual ma'lumotlarni olish
            const currentUser = await getOrCreateUser(user);
            
            // Navbatga qo'shish
            const queuePosition = addToQueue(socket.id, currentUser);
            
            console.log(`📥 Navbatga kirdi: ${currentUser.firstName}, O'rni: ${queuePosition}`);
            
        } catch (error) {
            console.error('❌ Navbatga kirish xatosi:', error);
            socket.emit('error', { message: 'Navbatga kirishda xato' });
        }
    });
    
    // Navbatdan chiqish
    socket.on('leave_queue', () => {
        try {
            const userId = getUserIdBySocket(socket.id);
            
            if (!userId) {
                return;
            }
            
            const newSize = removeFromQueue(userId);
            console.log(`📤 Navbatdan chiqdi: ${userId}, Navbatda: ${newSize} kishi`);
            
        } catch (error) {
            console.error('❌ Navbatdan chiqish xatosi:', error);
        }
    });
    
    // Ovoz berish
    socket.on('vote', async (data) => {
        try {
            const { duelId, choice } = data;
            const userId = getUserIdBySocket(socket.id);
            
            if (!userId) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            // Super like limitini tekshirish
            if (choice === 'super_like') {
                const user = await getUser(userId);
                if (user.dailySuperLikes <= 0) {
                    socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                    return;
                }
                
                // Super like sonini kamaytirish
                await updateUser(userId, { $inc: { dailySuperLikes: -1 } });
                socket.emit('super_like_used', { remaining: user.dailySuperLikes - 1 });
            }
            
            await processVote(duelId, userId, choice);
            
        } catch (error) {
            console.error('❌ Ovoz berish xatosi:', error);
            socket.emit('error', { message: 'Ovoz berishda xato' });
        }
    });
    
    // Do'stlar ro'yxatini olish
    socket.on('get_friends', async () => {
        try {
            const userId = getUserIdBySocket(socket.id);
            
            if (!userId) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            let mutualMatches = [];
            
            if (isMongoConnected) {
                mutualMatches = await MutualMatch.find({
                    $or: [
                        { user1Id: userId },
                        { user2Id: userId }
                    ]
                }).sort({ createdAt: -1 }).limit(50);
            } else {
                // Test rejimi
                for (const [key, match] of mutualMatchesDB.entries()) {
                    if (match.user1Id === userId || match.user2Id === userId) {
                        mutualMatches.push(match);
                    }
                }
            }
            
            // Do'stlar ma'lumotlarini to'ldirish
            const friendsWithDetails = await Promise.all(
                mutualMatches.map(async (match) => {
                    const friendId = match.user1Id === userId ? match.user2Id : match.user1Id;
                    const friend = await getUser(friendId);
                    
                    if (!friend) return null;
                    
                    return {
                        id: friend.userId,
                        name: friend.firstName,
                        username: friend.username,
                        photo: friend.photoUrl,
                        rating: friend.rating,
                        matches: friend.matches,
                        online: onlineUsers.has(friend.userId),
                        lastActive: friend.lastActive,
                        isMutual: true,
                        matchDate: match.createdAt,
                        isSuperLike: match.isSuperLike
                    };
                })
            );
            
            const validFriends = friendsWithDetails.filter(f => f !== null);
            
            socket.emit('friends_list', { friends: validFriends });
            
        } catch (error) {
            console.error('❌ Do\'stlar ro\'yxati olish xatosi:', error);
            socket.emit('error', { message: 'Do\'stlar ro\'yxatini olishda xato' });
        }
    });
    
    // Liderlar ro'yxati
    socket.on('get_leaderboard', async () => {
        try {
            let topUsers = [];
            
            if (isMongoConnected) {
                topUsers = await User.find()
                    .sort({ rating: -1 })
                    .limit(100)
                    .select('userId firstName username photoUrl rating matches duels wins friendsCount gender');
            } else {
                // Test rejimi
                topUsers = Array.from(usersDB.values())
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 100)
                    .map(user => ({
                        userId: user.userId,
                        firstName: user.firstName,
                        username: user.username,
                        photoUrl: user.photoUrl,
                        rating: user.rating,
                        matches: user.matches,
                        duels: user.duels,
                        wins: user.wins,
                        friendsCount: user.friendsCount,
                        gender: user.gender
                    }));
            }
            
            socket.emit('leaderboard_data', { 
                leaders: topUsers,
                updatedAt: new Date()
            });
            
        } catch (error) {
            console.error('❌ Liderlar ro\'yxati olish xatosi:', error);
            socket.emit('error', { message: 'Liderlar ro\'yxatini olishda xato' });
        }
    });
    
    // Chat xabarlari
    socket.on('send_chat_message', async (data) => {
        try {
            const { toUserId, message } = data;
            const fromUserId = getUserIdBySocket(socket.id);
            
            if (!fromUserId || !toUserId) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            // Do'stlik tekshirish
            let isFriends = false;
            
            if (isMongoConnected) {
                const match = await MutualMatch.findOne({
                    $or: [
                        { user1Id: fromUserId, user2Id: toUserId },
                        { user1Id: toUserId, user2Id: fromUserId }
                    ]
                });
                
                isFriends = !!match;
            } else {
                const matchKey1 = `${fromUserId}_${toUserId}`;
                const matchKey2 = `${toUserId}_${fromUserId}`;
                isFriends = mutualMatchesDB.has(matchKey1) || mutualMatchesDB.has(matchKey2);
            }
            
            if (!isFriends) {
                socket.emit('error', { message: 'Bu foydalanuvchi bilan do\'st emassiz' });
                return;
            }
            
            // Xabarni qabul qiluvchi online bo'lsa, yuborish
            const toSocketId = onlineUsers.get(toUserId);
            if (toSocketId) {
                io.to(toSocketId).emit('receive_chat_message', {
                    fromUserId,
                    message,
                    timestamp: new Date()
                });
            }
            
            // Mutual match ma'lumotlarini yangilash (oxirgi xabar)
            if (isMongoConnected) {
                await MutualMatch.findOneAndUpdate({
                    $or: [
                        { user1Id: fromUserId, user2Id: toUserId },
                        { user1Id: toUserId, user2Id: fromUserId }
                    ]
                }, {
                    lastMessage: message,
                    lastMessageTime: new Date()
                });
            }
            
            console.log(`💬 Chat xabari: ${fromUserId} -> ${toUserId}: ${message.substring(0, 50)}...`);
            
        } catch (error) {
            console.error('❌ Chat xabar yuborish xatosi:', error);
            socket.emit('error', { message: 'Xabar yuborishda xato' });
        }
    });
    
    // Do'kon xaridlari
    socket.on('purchase_item', async (data) => {
        try {
            const { itemId, itemType, amount, price } = data;
            const userId = getUserIdBySocket(socket.id);
            
            if (!userId) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }
            
            const user = await getUser(userId);
            
            // Coinlarni tekshirish
            if (user.coins < price) {
                socket.emit('error', { message: 'Yetarli coin mavjud emas' });
                return;
            }
            
            // Coinlarni ayirish
            await updateUser(userId, { $inc: { coins: -price } });
            
            // Mahsulotni berish
            if (itemType === 'super_likes') {
                await updateUser(userId, { $inc: { dailySuperLikes: amount } });
                socket.emit('purchase_success', {
                    itemId,
                    newCoins: user.coins - price,
                    newSuperLikes: user.dailySuperLikes + amount
                });
            } else if (itemType === 'premium') {
                // Premium status logikasi
                socket.emit('purchase_success', {
                    itemId,
                    newCoins: user.coins - price,
                    premiumDays: amount
                });
            }
            
            console.log(`🛒 Xarid qilindi: ${userId} - ${itemType} x${amount} - ${price} coins`);
            
        } catch (error) {
            console.error('❌ Xarid qilish xatosi:', error);
            socket.emit('error', { message: 'Xarid qilishda xato' });
        }
    });
    
    // Disconnect
    socket.on('disconnect', async () => {
        try {
            const userId = getUserIdBySocket(socket.id);
            
            if (userId) {
                // Online ro'yxatdan olib tashlash
                onlineUsers.delete(userId);
                
                // Navbatdan olib tashlash
                removeFromQueue(userId);
                
                // Faol duel bo'lsa, timeout qilish
                const activeDuelId = activeDuels.get(userId);
                if (activeDuelId) {
                    // Raqibga xabar berish
                    let duel;
                    if (isMongoConnected) {
                        duel = await Duel.findOne({ duelId: activeDuelId });
                    } else {
                        duel = duelsDB.get(activeDuelId);
                    }
                    
                    if (duel && !duel.ended) {
                        const opponentId = duel.player1Id === userId ? duel.player2Id : duel.player1Id;
                        const opponentSocket = onlineUsers.get(opponentId);
                        
                        if (opponentSocket) {
                            io.to(opponentSocket).emit('opponent_left');
                        }
                        
                        // Duelni tugatish
                        duel.ended = true;
                        if (isMongoConnected) {
                            await duel.save();
                        } else {
                            duelsDB.set(activeDuelId, duel);
                        }
                        
                        activeDuels.delete(duel.player1Id);
                        activeDuels.delete(duel.player2Id);
                    }
                }
                
                // Foydalanuvchi holatini yangilash
                await updateUser(userId, { 
                    connected: false,
                    lastActive: new Date()
                });
                
                console.log(`🔌 Client chiqib ketdi: ${userId}`);
            } else {
                console.log(`🔌 Anonim client chiqib ketdi: ${socket.id}`);
            }
            
        } catch (error) {
            console.error('❌ Disconnect xatosi:', error);
        }
    });
});

// ==================== HELPER FUNCTIONS ====================
function getUserIdBySocket(socketId) {
    for (const [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socketId) {
            return userId;
        }
    }
    return null;
}

// ==================== HTTP ROUTES ====================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Like Duel Server',
        version: '1.0.0',
        connectedUsers: onlineUsers.size,
        inQueue: queue.length,
        activeDuels: activeDuels.size / 2,
        database: isMongoConnected ? 'MongoDB' : 'Memory'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/stats', async (req, res) => {
    try {
        let totalUsers = 0;
        let totalDuels = 0;
        let totalMatches = 0;
        
        if (isMongoConnected) {
            totalUsers = await User.countDocuments();
            totalDuels = await Duel.countDocuments();
            totalMatches = await MutualMatch.countDocuments();
        } else {
            totalUsers = usersDB.size;
            totalDuels = duelsDB.size;
            totalMatches = mutualMatchesDB.size;
        }
        
        res.json({
            onlineUsers: onlineUsers.size,
            inQueue: queue.length,
            activeDuels: activeDuels.size / 2,
            totalUsers,
            totalDuels,
            totalMatches,
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portida ishga tushdi`);
    console.log(`📊 Holat: Online users: ${onlineUsers.size}, Queue: ${queue.length}`);
    console.log(`💾 Database: ${isMongoConnected ? 'MongoDB' : 'Memory (Test mode)'}`);
});

// Heartbeat to keep Render awake
setInterval(() => {
    console.log(`💓 Heartbeat - Online: ${onlineUsers.size}, Queue: ${queue.length}`);
}, 300000); // 5 daqiqa

// Navbatdagi foydalanuvchilar uchun muntazam yangilash
setInterval(() => {
    queue.forEach((user, index) => {
        const socketId = onlineUsers.get(user.userId);
        if (socketId) {
            io.to(socketId).emit('waiting_count', {
                position: index + 1,
                count: queue.length
            });
        }
    });
}, 5000); // Har 5 soniyada

// Faol duellarni timeout tekshirish
setInterval(() => {
    const now = new Date();
    const timeoutTime = 20000; // 20 soniya
    
    if (isMongoConnected) {
        Duel.find({ ended: false, resultsSent: false }).then(duels => {
            duels.forEach(duel => {
                const timeDiff = now - new Date(duel.startTime);
                if (timeDiff > timeoutTime) {
                    handleDuelTimeout(duel);
                }
            });
        });
    } else {
        for (const [duelId, duel] of duelsDB.entries()) {
            if (!duel.ended && !duel.resultsSent) {
                const timeDiff = now - new Date(duel.startTime);
                if (timeDiff > timeoutTime) {
                    handleDuelTimeout(duel);
                }
            }
        }
    }
}, 5000); // Har 5 soniyada tekshiradi