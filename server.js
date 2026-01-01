const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ==================== RENDER.COM SOCKET.IO SOZLAMALARI ====================
const io = new Server(server, {
    cors: {
        origin: [
            'https://like-duel.onrender.com',
            'https://like-duel-game.onrender.com',
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:3000'
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
});

// ==================== RENDER.COM DEBUG ====================
console.log('🚀 SERVER ISHGA TUSHDI - RENDER.COM');
console.log('📅 Sana:', new Date().toISOString());
console.log('🔧 Node version:', process.version);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'production');
console.log('📍 PORT:', process.env.PORT || 3000);
console.log('🔗 MONGODB_URI borligi:', !!process.env.MONGODB_URI);
console.log('🔗 MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'Yo\'q');

// ==================== MONGODB ULASH (RENDER UCHUN) ====================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI muhit o\'zgaruvchisi topilmadi!');
    console.error('⚠️ Iltimos, Render.com -> Environment Variables -> MONGODB_URI qo\'shing');
    console.log('🔄 Test rejimida ishlayapmiz...');
}

let isMongoConnected = false;

async function connectToMongoDB() {
    try {
        if (!MONGODB_URI) {
            console.log('ℹ️ MONGODB_URI yo\'q, test rejimi faollashtirildi');
            return false;
        }
        
        console.log('🔄 MongoDB ga ulanish urinilmoqda...');
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
            maxPoolSize: 10,
            minPoolSize: 2,
            retryWrites: true,
            w: 'majority'
        });
        
        isMongoConnected = true;
        console.log('✅ MongoDB Atlas ga muvaffaqiyatli ulandi');
        console.log('📊 Database:', MONGODB_URI.split('@')[1]?.split('/')[0] || 'Unknown');
        
        return true;
        
    } catch (error) {
        console.error('❌ MongoDB ulanish xatosi:', error.name);
        console.error('❌ Xato xabari:', error.message);
        
        if (error.name === 'MongoParseError') {
            console.error('⚠️ MONGODB_URI formatida xato. Format: mongodb+srv://username:password@cluster.mongodb.net/dbname');
        } else if (error.name === 'MongooseServerSelectionError') {
            console.error('⚠️ MongoDB server topilmadi. IP ruxsatnomasini tekshiring.');
        } else if (error.name === 'MongoNetworkError') {
            console.error('⚠️ Tarmoq xatosi. Internet ulanishini tekshiring.');
        } else if (error.name === 'MongoError' && error.code === 8000) {
            console.error('⚠️ Autentifikatsiya xatosi. Username/Password noto\'g\'ri.');
        }
        
        console.log('🔄 Test rejimiga o\'tildi');
        return false;
    }
}

// MongoDB event listeners
mongoose.connection.on('connecting', () => {
    console.log('🔄 MongoDB ga ulanmoqda...');
});
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB ga ulandi');
    isMongoConnected = true;
});
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB dan uzildi');
    isMongoConnected = false;
});
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB xatosi:', err.message);
    isMongoConnected = false;
});

// ==================== MONGODB MODELLARI (Test rejimi uchun ham) ====================
let User, MutualMatch, Duel;

try {
    const userSchema = new mongoose.Schema({
        userId: { type: String, required: true, unique: true },
        telegramId: { type: String, unique: true, sparse: true },
        firstName: String,
        lastName: String,
        username: String,
        photoUrl: String,
        
        gender: { type: String, enum: ['male', 'female', 'not_specified'], default: 'not_specified' },
        hasSelectedGender: { type: Boolean, default: false },
        bio: { type: String, default: '' },
        filter: { type: String, enum: ['male', 'female', 'not_specified'], default: 'not_specified' },
        
        rating: { type: Number, default: 1500 },
        coins: { type: Number, default: 100 },
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        matches: { type: Number, default: 0 },
        duels: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 },
        mutualMatchesCount: { type: Number, default: 0 },
        friendsCount: { type: Number, default: 0 },
        
        dailySuperLikes: { type: Number, default: 3 },
        dailySuperLikesUsed: { type: Number, default: 0 },
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
        createdAt: { type: Date, default: Date.now },
        isSuperLike: { type: Boolean, default: true }
    });

    const duelSchema = new mongoose.Schema({
        duelId: { type: String, required: true, unique: true },
        player1Id: { type: String, required: true },
        player2Id: { type: String, required: true },
        votes: {
            type: Map,
            of: String,
            default: {}
        },
        startTime: { type: Date, default: Date.now },
        ended: { type: Boolean, default: false },
        resultsSent: { type: Boolean, default: false },
        winnerId: String,
        isMutual: { type: Boolean, default: false },
        isSuperLike: { type: Boolean, default: false }
    });

    User = mongoose.model('User', userSchema);
    MutualMatch = mongoose.model('MutualMatch', mutualMatchSchema);
    Duel = mongoose.model('Duel', duelSchema);
    
    console.log('✅ MongoDB modellari yaratildi');
    
} catch (error) {
    console.error('❌ MongoDB modellarini yaratishda xato:', error);
    console.log('🔄 Test modellar ishlatilmoqda...');
}

// ==================== TEST REJIMI (MongoDB ulanmasa) ====================
const testUsersDB = new Map(); // userId -> userData
const testDuelsDB = new Map(); // duelId -> duelData
const testMutualMatches = new Map(); // user1Id_user2Id -> matchData
const onlineUsers = new Map(); // userId -> socketId
const queue = []; // Navbat
const activeDuels = new Map(); // duelId -> duelData

// Test rejimi funksiyalari
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getTestUser(userId) {
    if (!testUsersDB.has(userId)) {
        testUsersDB.set(userId, {
            userId: userId,
            firstName: 'Test User',
            username: 'testuser',
            photoUrl: 'https://ui-avatars.com/api/?name=Test+User&background=667eea&color=fff',
            gender: 'not_specified',
            hasSelectedGender: false,
            bio: 'Test foydalanuvchi',
            filter: 'not_specified',
            rating: 1500,
            coins: 100,
            level: 1,
            xp: 0,
            matches: 0,
            duels: 0,
            wins: 0,
            totalLikes: 0,
            mutualMatchesCount: 0,
            friendsCount: 0,
            dailySuperLikes: 3,
            dailySuperLikesUsed: 0,
            lastResetDate: new Date().toDateString(),
            socketId: '',
            connected: false,
            lastActive: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    return testUsersDB.get(userId);
}

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: [
        'https://like-duel.onrender.com',
        'https://like-duel-game.onrender.com',
        'http://localhost:3000',
        'http://localhost:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));

// CORS preflight so'rovlarini qayta ishlash
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// ==================== ROUTES ====================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Like Duel Server',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        mongoDB: isMongoConnected ? 'connected' : 'disconnected',
        mode: isMongoConnected ? 'MongoDB' : 'Test Mode',
        timestamp: new Date().toISOString(),
        message: 'Server ishga tushdi!'
    });
});

app.get('/api/health', async (req, res) => {
    try {
        let totalUsers = 0;
        let totalMatches = 0;
        let totalDuels = 0;
        
        if (isMongoConnected) {
            totalUsers = await User.countDocuments();
            totalMatches = await MutualMatch.countDocuments();
            totalDuels = await Duel.countDocuments();
        } else {
            totalUsers = testUsersDB.size;
            totalDuels = testDuelsDB.size;
        }
        
        res.json({
            status: 'online',
            message: 'Like Duel Server is running on Render.com',
            timestamp: new Date().toISOString(),
            database: isMongoConnected ? 'MongoDB Atlas' : 'Test Mode',
            mongoDB: isMongoConnected ? 'connected' : 'disconnected',
            totalUsers,
            totalMatches,
            totalDuels,
            activeDuels: activeDuels.size,
            queue: queue.length,
            onlineUsers: onlineUsers.size,
            server: 'Render.com',
            port: process.env.PORT || 3000
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        let user;
        
        if (isMongoConnected) {
            user = await User.findOne({ userId });
        } else {
            user = getTestUser(userId);
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }
        
        let mutualFriends = 0;
        if (isMongoConnected) {
            const matches = await MutualMatch.find({
                $or: [{ user1Id: userId }, { user2Id: userId }]
            });
            mutualFriends = matches.length;
        } else {
            // Test rejimida
            mutualFriends = 0;
        }
        
        res.json({
            userId: user.userId,
            firstName: user.firstName,
            rating: user.rating,
            coins: user.coins,
            level: user.level,
            matches: user.matches,
            duels: user.duels,
            wins: user.wins,
            totalLikes: user.totalLikes,
            mutualMatchesCount: user.mutualMatchesCount,
            friendsCount: user.friendsCount,
            dailySuperLikes: user.dailySuperLikes,
            winRate: user.duels > 0 ? Math.round((user.wins / user.duels) * 100) : 0,
            mutualFriends: mutualFriends
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
    console.log('✅ Yangi ulanish:', socket.id);
    console.log('🌍 Client origin:', socket.handshake.headers.origin);
    
    // ==================== AUTH HANDLER ====================
    socket.on('auth', async (data) => {
        console.log('🔐 AUTH qabul qilindi:', {
            hasData: !!data,
            userId: data?.userId ? data.userId.substring(0, 10) + '...' : 'Yo\'q',
            firstName: data?.firstName || 'Yo\'q'
        });
        
        try {
            // 1. Ma'lumotlarni tekshirish
            if (!data || !data.userId) {
                console.error('❌ AUTH XATO: userId mavjud emas');
                socket.emit('error', { 
                    message: 'userId talab qilinadi',
                    code: 'NO_USER_ID'
                });
                return;
            }
            
            const userId = data.userId.toString();
            
            // 2. MongoDB ulanmagan bo'lsa, test rejimi
            if (!isMongoConnected) {
                console.log('🔄 TEST REJIMI: Foydalanuvchi autentifikatsiyasi');
                
                const testUser = getTestUser(userId);
                
                // Yangilash
                testUser.firstName = data.firstName || testUser.firstName;
                testUser.username = data.username || testUser.username;
                testUser.photoUrl = data.photoUrl || testUser.photoUrl;
                testUser.gender = data.gender || testUser.gender;
                testUser.hasSelectedGender = data.hasSelectedGender !== undefined ? data.hasSelectedGender : testUser.hasSelectedGender;
                testUser.bio = data.bio || testUser.bio;
                testUser.filter = data.filter || testUser.filter;
                
                // Kunlik limitlar
                const today = new Date().toDateString();
                if (testUser.lastResetDate !== today) {
                    testUser.dailySuperLikes = 3;
                    testUser.dailySuperLikesUsed = 0;
                    testUser.lastResetDate = today;
                }
                
                // Online holat
                testUser.socketId = socket.id;
                testUser.connected = true;
                testUser.lastActive = new Date();
                testUser.updatedAt = new Date();
                
                testUsersDB.set(userId, testUser);
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;
                
                console.log('✅ TEST AUTH OK:', userId);
                
                socket.emit('auth_ok', {
                    userId: testUser.userId,
                    firstName: testUser.firstName,
                    username: testUser.username,
                    photoUrl: testUser.photoUrl,
                    gender: testUser.gender,
                    hasSelectedGender: testUser.hasSelectedGender,
                    bio: testUser.bio,
                    filter: testUser.filter,
                    rating: testUser.rating,
                    coins: testUser.coins,
                    level: testUser.level,
                    matches: testUser.matches,
                    duels: testUser.duels,
                    wins: testUser.wins,
                    totalLikes: testUser.totalLikes,
                    mutualMatchesCount: testUser.mutualMatchesCount,
                    friendsCount: testUser.friendsCount,
                    dailySuperLikes: testUser.dailySuperLikes,
                    winRate: testUser.duels > 0 ? Math.round((testUser.wins / testUser.duels) * 100) : 0
                });
                
                // Gender tanlamagan bo'lsa
                if (!testUser.hasSelectedGender) {
                    setTimeout(() => {
                        socket.emit('show_gender_selection', {
                            mandatory: true,
                            message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                        });
                    }, 500);
                } else {
                    // Navbatga qo'shish
                    if (!queue.includes(userId)) {
                        queue.push(userId);
                        updateWaitingCount();
                    }
                }
                
                return;
            }
            
            // 3. MONGODB bilan ishlash
            console.log('🔄 MONGODB: Foydalanuvchi qidirilmoqda:', userId);
            
            let user = await User.findOne({ userId });
            
            if (!user) {
                console.log('✅ MONGODB: Yangi foydalanuvchi yaratilmoqda');
                user = new User({
                    userId: userId,
                    firstName: data.firstName || 'Foydalanuvchi',
                    username: data.username || '',
                    photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}&background=667eea&color=fff`,
                    gender: data.gender || 'not_specified',
                    hasSelectedGender: data.hasSelectedGender || false,
                    bio: data.bio || '',
                    filter: data.filter || 'not_specified'
                });
                await user.save();
                console.log('✅ MONGODB: Yangi foydalanuvchi saqlandi');
            } else {
                console.log('✅ MONGODB: Mavjud foydalanuvchi topildi');
                user.firstName = data.firstName || user.firstName;
                user.username = data.username || user.username;
                user.photoUrl = data.photoUrl || user.photoUrl;
                if (data.gender !== undefined) user.gender = data.gender;
                if (data.hasSelectedGender !== undefined) user.hasSelectedGender = data.hasSelectedGender;
                if (data.bio !== undefined) user.bio = data.bio;
                if (data.filter !== undefined) user.filter = data.filter;
            }
            
            // Kunlik limitlar
            const today = new Date().toDateString();
            if (user.lastResetDate !== today) {
                user.dailySuperLikes = 3;
                user.dailySuperLikesUsed = 0;
                user.lastResetDate = today;
            }
            
            // Online holat
            user.socketId = socket.id;
            user.connected = true;
            user.lastActive = new Date();
            user.updatedAt = new Date();
            await user.save();
            
            onlineUsers.set(userId, socket.id);
            socket.userId = userId;
            
            console.log('✅ MONGODB AUTH OK:', userId);
            
            socket.emit('auth_ok', {
                userId: user.userId,
                firstName: user.firstName,
                username: user.username,
                photoUrl: user.photoUrl,
                gender: user.gender,
                hasSelectedGender: user.hasSelectedGender,
                bio: user.bio,
                filter: user.filter,
                rating: user.rating,
                coins: user.coins,
                level: user.level,
                matches: user.matches,
                duels: user.duels,
                wins: user.wins,
                totalLikes: user.totalLikes,
                mutualMatchesCount: user.mutualMatchesCount,
                friendsCount: user.friendsCount,
                dailySuperLikes: user.dailySuperLikes,
                winRate: user.duels > 0 ? Math.round((user.wins / user.duels) * 100) : 0
            });
            
            // Gender tanlamagan bo'lsa
            if (!user.hasSelectedGender) {
                console.log('⚠️ Gender tanlanmagan, modal yuborilmoqda');
                setTimeout(() => {
                    socket.emit('show_gender_selection', {
                        mandatory: true,
                        message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                    });
                }, 500);
            } else {
                // Navbatga qo'shish
                if (!queue.includes(userId)) {
                    queue.push(userId);
                    updateWaitingCount();
                }
                console.log('🎯 Gender tanlangan, navbatga qo\'shildi');
            }
            
        } catch (error) {
            console.error('❌ AUTH XATO:', error.message);
            console.error('❌ Stack:', error.stack);
            
            socket.emit('error', { 
                message: 'Server ichki xatosi',
                code: 'INTERNAL_SERVER_ERROR',
                details: error.message
            });
        }
    });
    
    // ==================== GENDER TANLASH ====================
    socket.on('select_gender', async (data) => {
        try {
            const userId = socket.userId;
            const gender = data.gender;
            
            if (!userId) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }
            
            console.log('⚧️ Gender tanlash:', { userId, gender });
            
            if (isMongoConnected) {
                await User.updateOne(
                    { userId },
                    {
                        $set: {
                            gender: gender,
                            hasSelectedGender: true,
                            updatedAt: new Date()
                        }
                    }
                );
            } else {
                const testUser = getTestUser(userId);
                testUser.gender = gender;
                testUser.hasSelectedGender = true;
                testUser.updatedAt = new Date();
                testUsersDB.set(userId, testUser);
            }
            
            socket.emit('gender_selected', {
                gender: gender,
                hasSelectedGender: true,
                message: `Gender tanlandi! Endi duel o'ynashingiz mumkin.`
            });
            
            // Navbatga qo'shish
            if (!queue.includes(userId)) {
                queue.push(userId);
                updateWaitingCount();
            }
            
            // Duel qidirish
            setTimeout(() => findAndStartDuels(), 500);
            
        } catch (error) {
            console.error('Gender tanlash xatosi:', error);
        }
    });
    
    // ==================== NAVBATGA KIRISH ====================
    socket.on('enter_queue', async () => {
        try {
            const userId = socket.userId;
            if (!userId) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }
            
            console.log('🚀 Navbatga kirish:', userId);
            
            let hasSelectedGender = false;
            if (isMongoConnected) {
                const user = await User.findOne({ userId });
                hasSelectedGender = user ? user.hasSelectedGender : false;
            } else {
                const testUser = getTestUser(userId);
                hasSelectedGender = testUser.hasSelectedGender;
            }
            
            if (!hasSelectedGender) {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
                });
                return;
            }
            
            if (queue.includes(userId)) {
                socket.emit('queue_joined', {
                    position: queue.indexOf(userId) + 1,
                    total: queue.length
                });
                return;
            }
            
            queue.push(userId);
            
            socket.emit('queue_joined', {
                position: queue.length,
                total: queue.length
            });
            
            setTimeout(() => findAndStartDuels(), 500);
            
        } catch (error) {
            console.error('Navbatga kirish xatosi:', error);
        }
    });
    
    // ==================== NAVBATDAN CHIQISH ====================
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        console.log('🚪 Navbatdan chiqish:', userId);
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            updateWaitingCount();
        }
    });
    
    // ==================== DUEL OVOZ BERISH ====================
    socket.on('vote', async (data) => {
        try {
            const userId = socket.userId;
            const { duelId, choice } = data;
            
            if (!userId) return;
            
            console.log('🗳️ Ovoz berish:', { userId, duelId, choice });
            
            const duelData = activeDuels.get(duelId);
            if (!duelData || duelData.ended) {
                socket.emit('error', { message: 'Bu duel tugagan' });
                return;
            }
            
            if (duelData.player1 !== userId && duelData.player2 !== userId) {
                socket.emit('error', { message: 'Siz bu duelda emassiz' });
                return;
            }
            
            // SUPER LIKE limitini tekshirish
            if (choice === 'super_like') {
                let user;
                if (isMongoConnected) {
                    user = await User.findOne({ userId });
                } else {
                    user = getTestUser(userId);
                }
                
                if (user.dailySuperLikes <= 0) {
                    socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                    return;
                }
                
                // SUPER LIKE ni kamaytirish
                if (isMongoConnected) {
                    await User.updateOne(
                        { userId },
                        {
                            $inc: { dailySuperLikes: -1 },
                            $set: { updatedAt: new Date() }
                        }
                    );
                } else {
                    const testUser = getTestUser(userId);
                    testUser.dailySuperLikes -= 1;
                    testUser.updatedAt = new Date();
                    testUsersDB.set(userId, testUser);
                }
                
                socket.emit('super_like_used', {
                    remaining: user.dailySuperLikes - 1
                });
            }
            
            // Ovozni qo'shish
            duelData.votes[userId] = choice;
            
            // Agar ikkala o'yinchi ham ovoz bersa
            if (duelData.votes[duelData.player1] && duelData.votes[duelData.player2]) {
                await processDuelResult(duelId);
            }
            
        } catch (error) {
            console.error('Ovoz berish xatosi:', error);
        }
    });
    
    // ==================== PROFIL YANGILASH ====================
    socket.on('update_profile', async (data) => {
        try {
            const userId = socket.userId;
            if (!userId) return;
            
            console.log('📝 Profil yangilash:', { userId, data });
            
            if (isMongoConnected) {
                await User.updateOne(
                    { userId },
                    {
                        $set: {
                            bio: data.bio || '',
                            gender: data.gender || 'not_specified',
                            filter: data.filter || 'not_specified',
                            updatedAt: new Date()
                        }
                    }
                );
            } else {
                const testUser = getTestUser(userId);
                testUser.bio = data.bio || '';
                testUser.gender = data.gender || 'not_specified';
                testUser.filter = data.filter || 'not_specified';
                testUser.updatedAt = new Date();
                testUsersDB.set(userId, testUser);
            }
            
            socket.emit('profile_updated', {
                bio: data.bio,
                gender: data.gender,
                filter: data.filter
            });
            
        } catch (error) {
            console.error('Profil yangilash xatosi:', error);
        }
    });
    
    // ==================== DO'STLAR RO'YXATI ====================
    socket.on('get_friends_list', async () => {
        try {
            const userId = socket.userId;
            if (!userId) return;
            
            console.log('👥 Do\'stlar ro\'yxati so\'rovi:', userId);
            
            // Test rejimida bo'sh ro'yxat qaytarish
            socket.emit('friends_list', {
                friends: [],
                total: 0,
                online: 0
            });
            
        } catch (error) {
            console.error('Do\'stlar ro\'yxatini olish xatosi:', error);
        }
    });
    
    // ==================== DISCONNECT ====================
    socket.on('disconnect', async () => {
        try {
            const userId = socket.userId;
            
            if (userId) {
                console.log('❌ Ulanish uzildi:', { userId, socketId: socket.id });
                
                onlineUsers.delete(userId);
                
                const index = queue.indexOf(userId);
                if (index > -1) {
                    queue.splice(index, 1);
                    updateWaitingCount();
                }
                
                if (isMongoConnected) {
                    await User.updateOne(
                        { userId },
                        {
                            $set: {
                                connected: false,
                                lastActive: new Date(),
                                updatedAt: new Date()
                            }
                        }
                    );
                } else {
                    const testUser = getTestUser(userId);
                    testUser.connected = false;
                    testUser.lastActive = new Date();
                    testUser.updatedAt = new Date();
                    testUsersDB.set(userId, testUser);
                }
                
                // Active duellar bilan ishlash
                for (const [duelId, duelData] of activeDuels.entries()) {
                    if ((duelData.player1 === userId || duelData.player2 === userId) && !duelData.ended) {
                        duelData.ended = true;
                        
                        const opponentId = duelData.player1 === userId ? duelData.player2 : duelData.player1;
                        const opponentSocketId = onlineUsers.get(opponentId);
                        
                        if (opponentSocketId) {
                            const opponentSocket = io.sockets.sockets.get(opponentSocketId);
                            if (opponentSocket) {
                                opponentSocket.emit('opponent_left');
                            }
                        }
                        
                        activeDuels.delete(duelId);
                        break;
                    }
                }
            }
            
        } catch (error) {
            console.error('Disconnect xatosi:', error);
        }
    });
});

// ==================== YORDAMCHI FUNKSIYALAR ====================
function updateWaitingCount() {
    const count = queue.length;
    
    queue.forEach((userId, index) => {
        const socketId = onlineUsers.get(userId);
        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('waiting_count', {
                    count: count,
                    position: index + 1,
                    estimatedTime: (index + 1) * 10
                });
            }
        }
    });
}

async function findOpponentFor(userId) {
    let user;
    if (isMongoConnected) {
        user = await User.findOne({ userId });
    } else {
        user = getTestUser(userId);
    }
    
    if (!user || !user.hasSelectedGender || !user.gender) return null;
    
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        let opponent;
        if (isMongoConnected) {
            opponent = await User.findOne({ userId: opponentId });
        } else {
            opponent = getTestUser(opponentId);
        }
        
        if (!opponent || !opponent.hasSelectedGender || !opponent.gender) continue;
        
        if (!checkGenderCompatibility(user, opponent)) continue;
        if (!checkFilterCompatibility(user, opponent)) continue;
        if (!checkFilterCompatibility(opponent, user)) continue;
        
        return opponentId;
    }
    
    return null;
}

function checkGenderCompatibility(user1, user2) {
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

function checkFilterCompatibility(user, opponent) {
    const userFilter = user.filter || 'not_specified';
    
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

async function startDuel(player1Id, player2Id) {
    try {
        console.log('⚔️ Duel boshlanmoqda:', { player1Id, player2Id });
        
        let player1, player2;
        if (isMongoConnected) {
            player1 = await User.findOne({ userId: player1Id });
            player2 = await User.findOne({ userId: player2Id });
        } else {
            player1 = getTestUser(player1Id);
            player2 = getTestUser(player2Id);
        }
        
        if (!player1 || !player2) {
            console.error('Foydalanuvchilar topilmadi');
            return;
        }
        
        const duelId = generateDuelId();
        
        if (isMongoConnected) {
            const duel = new Duel({
                duelId,
                player1Id,
                player2Id,
                startTime: new Date()
            });
            await duel.save();
        } else {
            testDuelsDB.set(duelId, {
                duelId,
                player1Id,
                player2Id,
                startTime: new Date(),
                votes: {},
                ended: false,
                resultsSent: false
            });
        }
        
        activeDuels.set(duelId, {
            id: duelId,
            player1: player1Id,
            player2: player2Id,
            votes: {},
            startTime: new Date(),
            ended: false,
            resultsSent: false
        });
        
        // Player1 ga ma'lumot
        const player1SocketId = onlineUsers.get(player1Id);
        if (player1SocketId) {
            const player1Socket = io.sockets.sockets.get(player1SocketId);
            if (player1Socket) {
                player1Socket.emit('duel_started', {
                    duelId: duelId,
                    opponent: {
                        id: player2Id,
                        name: player2.firstName,
                        username: player2.username,
                        photo: player2.photoUrl,
                        rating: player2.rating,
                        matches: player2.matches,
                        level: player2.level,
                        gender: player2.gender
                    },
                    timeLeft: 20
                });
            }
        }
        
        // Player2 ga ma'lumot
        const player2SocketId = onlineUsers.get(player2Id);
        if (player2SocketId) {
            const player2Socket = io.sockets.sockets.get(player2SocketId);
            if (player2Socket) {
                player2Socket.emit('duel_started', {
                    duelId: duelId,
                    opponent: {
                        id: player1Id,
                        name: player1.firstName,
                        username: player1.username,
                        photo: player1.photoUrl,
                        rating: player1.rating,
                        matches: player1.matches,
                        level: player1.level,
                        gender: player1.gender
                    },
                    timeLeft: 20
                });
            }
        }
        
        // 20 soniya timer
        setTimeout(async () => {
            const duelData = activeDuels.get(duelId);
            if (duelData && !duelData.ended) {
                await handleDuelTimeout(duelId);
            }
        }, 20000);
        
    } catch (error) {
        console.error('Duel boshlashda xato:', error);
    }
}

async function processDuelResult(duelId) {
    try {
        const duelData = activeDuels.get(duelId);
        if (!duelData || duelData.ended || duelData.resultsSent) return;
        
        duelData.ended = true;
        duelData.resultsSent = true;
        
        const player1Vote = duelData.votes[duelData.player1];
        const player2Vote = duelData.votes[duelData.player2];
        
        let player1, player2;
        if (isMongoConnected) {
            player1 = await User.findOne({ userId: duelData.player1 });
            player2 = await User.findOne({ userId: duelData.player2 });
        } else {
            player1 = getTestUser(duelData.player1);
            player2 = getTestUser(duelData.player2);
        }
        
        if (!player1 || !player2) return;
        
        const player1Liked = player1Vote === 'like' || player1Vote === 'super_like';
        const player2Liked = player2Vote === 'like' || player2Vote === 'super_like';
        
        const player1SuperLike = player1Vote === 'super_like';
        const player2SuperLike = player2Vote === 'super_like';
        
        // Duel natijasini yangilash
        if (isMongoConnected) {
            await Duel.updateOne(
                { duelId },
                {
                    $set: {
                        ended: true,
                        resultsSent: true,
                        votes: duelData.votes,
                        isMutual: player1Liked && player2Liked,
                        isSuperLike: player1SuperLike && player2SuperLike
                    }
                }
            );
        } else {
            const testDuel = testDuelsDB.get(duelId);
            if (testDuel) {
                testDuel.ended = true;
                testDuel.resultsSent = true;
                testDuel.votes = duelData.votes;
                testDuel.isMutual = player1Liked && player2Liked;
                testDuel.isSuperLike = player1SuperLike && player2SuperLike;
                testDuelsDB.set(duelId, testDuel);
            }
        }
        
        if (player1Liked && player2Liked) {
            // Har ikki tomon like bosdi
            const updatePromises = [];
            
            if (isMongoConnected) {
                // Player1 yangilash
                updatePromises.push(
                    User.updateOne(
                        { userId: duelData.player1 },
                        {
                            $inc: {
                                matches: 1,
                                duels: 1,
                                wins: 1,
                                coins: player1SuperLike ? 70 : 50,
                                rating: 25
                            },
                            $set: { updatedAt: new Date() }
                        }
                    )
                );
                
                // Player2 yangilash
                updatePromises.push(
                    User.updateOne(
                        { userId: duelData.player2 },
                        {
                            $inc: {
                                matches: 1,
                                duels: 1,
                                wins: 1,
                                coins: player2SuperLike ? 70 : 50,
                                rating: 25
                            },
                            $set: { updatedAt: new Date() }
                        }
                    )
                );
            } else {
                // Test rejimida
                player1.matches += 1;
                player1.duels += 1;
                player1.wins += 1;
                player1.coins += player1SuperLike ? 70 : 50;
                player1.rating += 25;
                player1.updatedAt = new Date();
                
                player2.matches += 1;
                player2.duels += 1;
                player2.wins += 1;
                player2.coins += player2SuperLike ? 70 : 50;
                player2.rating += 25;
                player2.updatedAt = new Date();
            }
            
            if (isMongoConnected) {
                await Promise.all(updatePromises);
            }
            
            // Player1 ga xabar
            const player1SocketId = onlineUsers.get(duelData.player1);
            if (player1SocketId) {
                const player1Socket = io.sockets.sockets.get(player1SocketId);
                if (player1Socket) {
                    player1Socket.emit('match', {
                        partner: {
                            id: duelData.player2,
                            name: player2.firstName,
                            username: player2.username,
                            photo: player2.photoUrl,
                            gender: player2.gender
                        },
                        rewards: {
                            coins: player1SuperLike ? 70 : 50,
                            xp: 30
                        },
                        newRating: player1.rating + 25,
                        isMutual: true,
                        isSuperLike: player1SuperLike && player2SuperLike
                    });
                }
            }
            
            // Player2 ga xabar
            const player2SocketId = onlineUsers.get(duelData.player2);
            if (player2SocketId) {
                const player2Socket = io.sockets.sockets.get(player2SocketId);
                if (player2Socket) {
                    player2Socket.emit('match', {
                        partner: {
                            id: duelData.player1,
                            name: player1.firstName,
                            username: player1.username,
                            photo: player1.photoUrl,
                            gender: player1.gender
                        },
                        rewards: {
                            coins: player2SuperLike ? 70 : 50,
                            xp: 30
                        },
                        newRating: player2.rating + 25,
                        isMutual: true,
                        isSuperLike: player1SuperLike && player2SuperLike
                    });
                }
            }
            
        } else if (player1Liked) {
            // Faqat player1 like bosdi
            if (isMongoConnected) {
                await User.updateOne(
                    { userId: duelData.player1 },
                    {
                        $inc: {
                            duels: 1,
                            coins: player1SuperLike ? 30 : 10,
                            totalLikes: 1,
                            rating: 10
                        },
                        $set: { updatedAt: new Date() }
                    }
                );
            } else {
                player1.duels += 1;
                player1.coins += player1SuperLike ? 30 : 10;
                player1.totalLikes += 1;
                player1.rating += 10;
                player1.updatedAt = new Date();
            }
            
            const player1SocketId = onlineUsers.get(duelData.player1);
            if (player1SocketId) {
                const player1Socket = io.sockets.sockets.get(player1SocketId);
                if (player1Socket) {
                    player1Socket.emit('match', {
                        partner: {
                            id: duelData.player2,
                            name: player2.firstName,
                            username: player2.username,
                            photo: player2.photoUrl,
                            gender: player2.gender
                        },
                        rewards: {
                            coins: player1SuperLike ? 30 : 10,
                            xp: 5
                        },
                        newRating: player1.rating + 10,
                        isMutual: false,
                        isSuperLike: player1SuperLike
                    });
                }
            }
            
            const player2SocketId = onlineUsers.get(duelData.player2);
            if (player2SocketId) {
                const player2Socket = io.sockets.sockets.get(player2SocketId);
                if (player2Socket) {
                    player2Socket.emit('no_match', {});
                }
            }
            
        } else if (player2Liked) {
            // Faqat player2 like bosdi
            if (isMongoConnected) {
                await User.updateOne(
                    { userId: duelData.player2 },
                    {
                        $inc: {
                            duels: 1,
                            coins: player2SuperLike ? 30 : 10,
                            totalLikes: 1,
                            rating: 10
                        },
                        $set: { updatedAt: new Date() }
                    }
                );
            } else {
                player2.duels += 1;
                player2.coins += player2SuperLike ? 30 : 10;
                player2.totalLikes += 1;
                player2.rating += 10;
                player2.updatedAt = new Date();
            }
            
            const player2SocketId = onlineUsers.get(duelData.player2);
            if (player2SocketId) {
                const player2Socket = io.sockets.sockets.get(player2SocketId);
                if (player2Socket) {
                    player2Socket.emit('match', {
                        partner: {
                            id: duelData.player1,
                            name: player1.firstName,
                            username: player1.username,
                            photo: player1.photoUrl,
                            gender: player1.gender
                        },
                        rewards: {
                            coins: player2SuperLike ? 30 : 10,
                            xp: 5
                        },
                        newRating: player2.rating + 10,
                        isMutual: false,
                        isSuperLike: player2SuperLike
                    });
                }
            }
            
            const player1SocketId = onlineUsers.get(duelData.player1);
            if (player1SocketId) {
                const player1Socket = io.sockets.sockets.get(player1SocketId);
                if (player1Socket) {
                    player1Socket.emit('no_match', {});
                }
            }
            
        } else {
            // Hech kim like bermadi
            if (isMongoConnected) {
                await User.updateOne(
                    { userId: duelData.player1 },
                    { $inc: { duels: 1 }, $set: { updatedAt: new Date() } }
                );
                
                await User.updateOne(
                    { userId: duelData.player2 },
                    { $inc: { duels: 1 }, $set: { updatedAt: new Date() } }
                );
            } else {
                player1.duels += 1;
                player1.updatedAt = new Date();
                player2.duels += 1;
                player2.updatedAt = new Date();
            }
            
            const player1SocketId = onlineUsers.get(duelData.player1);
            if (player1SocketId) {
                const player1Socket = io.sockets.sockets.get(player1SocketId);
                if (player1Socket) player1Socket.emit('no_match', {});
            }
            
            const player2SocketId = onlineUsers.get(duelData.player2);
            if (player2SocketId) {
                const player2Socket = io.sockets.sockets.get(player2SocketId);
                if (player2Socket) player2Socket.emit('no_match', {});
            }
        }
        
        // Navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duelData.player1, duelData.player2);
            activeDuels.delete(duelId);
        }, 1000);
        
    } catch (error) {
        console.error('Duel natijasini qayta ishlashda xato:', error);
    }
}

async function handleDuelTimeout(duelId) {
    try {
        const duelData = activeDuels.get(duelId);
        if (!duelData || duelData.ended) return;
        
        duelData.ended = true;
        
        if (isMongoConnected) {
            await Duel.updateOne(
                { duelId },
                {
                    $set: {
                        ended: true,
                        resultsSent: true
                    }
                }
            );
        } else {
            const testDuel = testDuelsDB.get(duelId);
            if (testDuel) {
                testDuel.ended = true;
                testDuel.resultsSent = true;
                testDuelsDB.set(duelId, testDuel);
            }
        }
        
        // Foydalanuvchilarga xabar
        const player1SocketId = onlineUsers.get(duelData.player1);
        const player2SocketId = onlineUsers.get(duelData.player2);
        
        if (player1SocketId) {
            const socket = io.sockets.sockets.get(player1SocketId);
            if (socket) socket.emit('timeout', {});
        }
        
        if (player2SocketId) {
            const socket = io.sockets.sockets.get(player2SocketId);
            if (socket) socket.emit('timeout', {});
        }
        
        setTimeout(() => {
            returnPlayersToQueue(duelData.player1, duelData.player2);
            activeDuels.delete(duelId);
        }, 1000);
        
    } catch (error) {
        console.error('Duel timeoutda xato:', error);
    }
}

function returnPlayersToQueue(player1Id, player2Id) {
    [player1Id, player2Id].forEach(playerId => {
        const index = queue.indexOf(playerId);
        if (index === -1) {
            queue.push(playerId);
        }
    });
    
    updateWaitingCount();
    setTimeout(findAndStartDuels, 1000);
}

async function findAndStartDuels() {
    if (queue.length < 2) return;
    
    for (let i = 0; i < queue.length; i++) {
        const userId = queue[i];
        const opponentId = await findOpponentFor(userId);
        
        if (opponentId) {
            const userIndex = queue.indexOf(userId);
            const opponentIndex = queue.indexOf(opponentId);
            
            if (userIndex > -1) queue.splice(userIndex, 1);
            if (opponentIndex > -1) queue.splice(opponentIndex, 1);
            
            await startDuel(userId, opponentId);
            updateWaitingCount();
            break;
        }
    }
}

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('🚀 Server ishga tushmoqda...');
    
    // MongoDB ga ulanishni urinish
    const mongoConnected = await connectToMongoDB();
    
    if (!mongoConnected) {
        console.log('🔄 Server TEST REJIMIDA ishlaydi');
        console.log('ℹ️ MongoDB ulanmadi, lekin o\'yin ishlaydi');
        console.log('ℹ️ Ma\'lumotlar faqat server ishlaganda saqlanadi');
    }
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 LIKE DUEL SERVER - RENDER.COM');
        console.log('='.repeat(70));
        console.log(`📍 Server ishga tushdi: PORT ${PORT}`);
        console.log(`🌍 URL: https://like-duel.onrender.com`);
        console.log(`📊 Health check: https://like-duel.onrender.com/api/health`);
        console.log(`🗄️  Database: ${isMongoConnected ? 'MongoDB Atlas' : 'TEST MODE'}`);
        console.log('='.repeat(70));
        console.log('✅ Barcha tizimlar tayyor');
        console.log('✅ Socket.io server faol');
        console.log('✅ CORS sozlamalari yoqilgan');
        console.log('='.repeat(70));
    });
}

startServer();

// Kunlik limitlarni yangilash
setInterval(async () => {
    try {
        const today = new Date().toDateString();
        
        if (isMongoConnected) {
            await User.updateMany(
                { lastResetDate: { $ne: today } },
                { 
                    $set: { 
                        dailySuperLikes: 3,
                        dailySuperLikesUsed: 0,
                        lastResetDate: today 
                    } 
                }
            );
            console.log('🔄 Kunlik limitlar yangilandi (MongoDB)');
        } else {
            // Test rejimida
            testUsersDB.forEach((user, userId) => {
                if (user.lastResetDate !== today) {
                    user.dailySuperLikes = 3;
                    user.dailySuperLikesUsed = 0;
                    user.lastResetDate = today;
                    testUsersDB.set(userId, user);
                }
            });
            console.log('🔄 Kunlik limitlar yangilandi (Test Mode)');
        }
        
    } catch (error) {
        console.error('Kunlik limitlarni yangilash xatosi:', error);
    }
}, 60000); // Har 1 daqiq"'
// 
// 
