const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ==================== SOCKET.IO SOZLAMALARI ====================
const io = new Server(server, {
    cors: {
        origin: [
            'https://rock-paper-scissors-duel.onrender.com',
            'https://rps-duel.onrender.com',
            'http://localhost:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:3000'
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// ==================== DEBUG ====================
console.log('🚀 TO\'SH-QAYCHI-QOG\'OZ DUEL SERVERI ISHGA TUSHDI');
console.log('📅 Sana:', new Date().toISOString());
console.log('🔧 Node version:', process.version);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'production');
console.log('📍 PORT:', process.env.PORT || 3000);

// ==================== MONGODB ULASH ====================
const MONGODB_URI = process.env.MONGODB_URI;
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
        });
        
        isMongoConnected = true;
        console.log('✅ MongoDB Atlas ga muvaffaqiyatli ulandi');
        return true;
        
    } catch (error) {
        console.error('❌ MongoDB ulanish xatosi:', error.message);
        console.log('🔄 Test rejimiga o\'tildi');
        return false;
    }
}

// MongoDB modellari
let User, MutualMatch, Duel, Achievement, DailyQuest;

if (isMongoConnected) {
    try {
        // User modeli
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
            totalGames: { type: Number, default: 0 },
            wins: { type: Number, default: 0 },
            draws: { type: Number, default: 0 },
            losses: { type: Number, default: 0 },
            winStreak: { type: Number, default: 0 },
            maxWinStreak: { type: Number, default: 0 },
            mutualMatchesCount: { type: Number, default: 0 },
            friendsCount: { type: Number, default: 0 },
            lastResetDate: { type: String, default: () => new Date().toDateString() },
            socketId: String,
            connected: { type: Boolean, default: false },
            lastActive: { type: Date, default: Date.now },
            streakDays: { type: Number, default: 0 },
            lastLogin: { type: Date, default: Date.now },
            totalPlayTime: { type: Number, default: 0 }
        });

        // MutualMatch modeli
        const mutualMatchSchema = new mongoose.Schema({
            user1Id: { type: String, required: true },
            user2Id: { type: String, required: true },
            isSuperLike: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        });

        // Duel modeli
        const duelSchema = new mongoose.Schema({
            duelId: { type: String, required: true, unique: true },
            player1Id: { type: String, required: true },
            player2Id: { type: String, required: true },
            player1Choice: { type: String, enum: ['rock', 'scissors', 'paper', 'skip'], default: null },
            player2Choice: { type: String, enum: ['rock', 'scissors', 'paper', 'skip'], default: null },
            result: { type: String, enum: ['player1_win', 'player2_win', 'draw', 'pending'], default: 'pending' },
            startTime: { type: Date, default: Date.now },
            endTime: { type: Date, default: null },
            ended: { type: Boolean, default: false },
            rewardsGiven: { type: Boolean, default: false }
        });

        // Achievement modeli
        const achievementSchema = new mongoose.Schema({
            userId: { type: String, required: true },
            achievementId: { type: String, required: true },
            title: String,
            description: String,
            icon: String,
            unlockedAt: { type: Date, default: Date.now },
            progress: { type: Number, default: 0 },
            required: { type: Number, default: 1 },
            unlocked: { type: Boolean, default: false }
        });

        // DailyQuest modeli
        const dailyQuestSchema = new mongoose.Schema({
            userId: { type: String, required: true },
            questId: { type: String, required: true },
            title: String,
            description: String,
            progress: { type: Number, default: 0 },
            total: { type: Number, default: 1 },
            reward: { type: Number, default: 0 },
            type: String,
            completed: { type: Boolean, default: false },
            claimed: { type: Boolean, default: false },
            date: { type: String, default: () => new Date().toDateString() }
        });

        User = mongoose.model('User', userSchema);
        MutualMatch = mongoose.model('MutualMatch', mutualMatchSchema);
        Duel = mongoose.model('Duel', duelSchema);
        Achievement = mongoose.model('Achievement', achievementSchema);
        DailyQuest = mongoose.model('DailyQuest', dailyQuestSchema);
        
        console.log('✅ MongoDB modellari yaratildi');
    } catch (error) {
        console.error('❌ MongoDB modellarini yaratishda xato:', error);
        isMongoConnected = false;
    }
}

// ==================== TEST REJIMI ====================
const testUsersDB = new Map();
const testDuelsDB = new Map();
const testMutualMatches = new Map();
const testAchievementsDB = new Map();
const testDailyQuestsDB = new Map();
const onlineUsers = new Map();
const queue = [];
const activeDuels = new Map();

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
            totalGames: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            winStreak: 0,
            maxWinStreak: 0,
            mutualMatchesCount: 0,
            friendsCount: 0,
            lastResetDate: new Date().toDateString(),
            socketId: '',
            connected: false,
            lastActive: new Date(),
            streakDays: 0,
            lastLogin: new Date(),
            totalPlayTime: 0
        });
    }
    return testUsersDB.get(userId);
}

function getTestAchievements(userId) {
    if (!testAchievementsDB.has(userId)) {
        testAchievementsDB.set(userId, []);
    }
    return testAchievementsDB.get(userId);
}

function getTestDailyQuests(userId) {
    if (!testDailyQuestsDB.has(userId)) {
        const defaultQuests = [
            {
                questId: 'play_3_duels',
                title: '3 ta duel o\'ynash',
                progress: 0,
                total: 3,
                reward: 50,
                type: 'play',
                completed: false,
                claimed: false,
                date: new Date().toDateString()
            },
            {
                questId: 'win_1_duel',
                title: '1 ta duel yutish',
                progress: 0,
                total: 1,
                reward: 100,
                type: 'win',
                completed: false,
                claimed: false,
                date: new Date().toDateString()
            },
            {
                questId: 'make_1_friend',
                title: '1 ta do\'st orttirish',
                progress: 0,
                total: 1,
                reward: 200,
                type: 'friend',
                completed: false,
                claimed: false,
                date: new Date().toDateString()
            }
        ];
        testDailyQuestsDB.set(userId, defaultQuests);
    }
    return testDailyQuestsDB.get(userId);
}

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: [
        'https://rock-paper-scissors-duel.onrender.com',
        'https://rps-duel.onrender.com',
        'http://localhost:3000',
        'http://localhost:5500'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// ==================== ROUTES ====================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Tosh-Qaychi-Qog\'oz Duel Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        game: 'Rock Paper Scissors Duel'
    });
});

app.get('/api/health', async (req, res) => {
    try {
        res.json({
            status: 'online',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            database: isMongoConnected ? 'MongoDB Atlas' : 'Test Mode',
            totalUsers: isMongoConnected ? await User.countDocuments() : testUsersDB.size,
            activeDuels: activeDuels.size,
            queue: queue.length,
            onlineUsers: onlineUsers.size,
            game: 'Tosh-Qaychi-Qog\'oz Duel'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            totalGamesPlayed: 0,
            totalUsers: isMongoConnected ? await User.countDocuments() : testUsersDB.size,
            averageRating: 1500,
            mostWins: 0,
            longestWinStreak: 0
        };

        if (isMongoConnected) {
            const users = await User.find();
            if (users.length > 0) {
                stats.totalGamesPlayed = users.reduce((sum, user) => sum + user.totalGames, 0);
                stats.averageRating = Math.round(users.reduce((sum, user) => sum + user.rating, 0) / users.length);
                stats.mostWins = Math.max(...users.map(user => user.wins));
                stats.longestWinStreak = Math.max(...users.map(user => user.maxWinStreak));
            }
        } else {
            const users = Array.from(testUsersDB.values());
            if (users.length > 0) {
                stats.totalGamesPlayed = users.reduce((sum, user) => sum + user.totalGames, 0);
                stats.averageRating = Math.round(users.reduce((sum, user) => sum + user.rating, 0) / users.length);
                stats.mostWins = Math.max(...users.map(user => user.wins));
                stats.longestWinStreak = Math.max(...users.map(user => user.maxWinStreak));
            }
        }

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== TO'SH-QAYCHI-QOG'OZ QOIDALARI ====================
function determineWinner(choice1, choice2) {
    if (choice1 === choice2) return 'draw';
    
    const rules = {
        'rock': 'scissors',     // Tosh qaychini yengadi
        'scissors': 'paper',    // Qaychi qog'ozni yengadi
        'paper': 'rock'         // Qog'oz toshni yengadi
    };
    
    if (rules[choice1] === choice2) {
        return 'player1';
    } else {
        return 'player2';
    }
}

function calculateRPSRewards(player1Choice, player2Choice, player1Rating, player2Rating) {
    const result = determineWinner(player1Choice, player2Choice);
    
    let player1Reward = {
        coins: 10,
        xp: 5,
        ratingChange: -5
    };
    
    let player2Reward = {
        coins: 10,
        xp: 5,
        ratingChange: -5
    };
    
    if (result === 'draw') {
        // Durang uchun mukofotlar
        player1Reward = {
            coins: 25,
            xp: 15,
            ratingChange: 10
        };
        player2Reward = {
            coins: 25,
            xp: 15,
            ratingChange: 10
        };
    } else if (result === 'player1') {
        // Player1 g'alaba uchun mukofotlar
        player1Reward = {
            coins: 50,
            xp: 30,
            ratingChange: 20
        };
        player2Reward = {
            coins: 10,
            xp: 5,
            ratingChange: -5
        };
    } else if (result === 'player2') {
        // Player2 g'alaba uchun mukofotlar
        player1Reward = {
            coins: 10,
            xp: 5,
            ratingChange: -5
        };
        player2Reward = {
            coins: 50,
            xp: 30,
            ratingChange: 20
        };
    }
    
    return {
        player1: player1Reward,
        player2: player2Reward,
        result: result
    };
}

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
    console.log('✅ Yangi ulanish:', socket.id);
    
    // ==================== PING ====================
    socket.on('ping', (data) => {
        socket.emit('ping', data);
    });
    
    // ==================== AUTH HANDLER ====================
    socket.on('auth', async (data) => {
        try {
            if (!data || !data.userId) {
                socket.emit('error', { message: 'userId talab qilinadi' });
                return;
            }
            
            const userId = data.userId.toString();
            console.log('🔐 Auth:', userId.substring(0, 10) + '...');
            
            if (isMongoConnected) {
                let user = await User.findOne({ userId });
                
                if (!user) {
                    user = new User({
                        userId: userId,
                        firstName: data.firstName || 'Foydalanuvchi',
                        username: data.username || '',
                        photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}&background=667eea&color=fff`,
                        gender: data.gender || 'not_specified',
                        hasSelectedGender: data.hasSelectedGender || false,
                        bio: data.bio || '',
                        filter: data.filter || 'not_specified',
                        streakDays: 1,
                        lastLogin: new Date()
                    });
                    await user.save();
                    
                    // Achievement yaratish
                    await createDefaultAchievements(userId);
                    await createDefaultDailyQuests(userId);
                } else {
                    // Streak hisoblash
                    const today = new Date().toDateString();
                    const lastLoginDate = user.lastLogin ? new Date(user.lastLogin).toDateString() : null;
                    
                    if (lastLoginDate !== today) {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toDateString();
                        
                        if (lastLoginDate === yesterdayStr) {
                            user.streakDays += 1;
                        } else if (lastLoginDate && lastLoginDate !== yesterdayStr) {
                            user.streakDays = 1;
                        }
                        user.lastLogin = new Date();
                    }
                    
                    user.firstName = data.firstName || user.firstName;
                    user.username = data.username || user.username;
                    user.photoUrl = data.photoUrl || user.photoUrl;
                    if (data.gender !== undefined) user.gender = data.gender;
                    if (data.hasSelectedGender !== undefined) user.hasSelectedGender = data.hasSelectedGender;
                    if (data.bio !== undefined) user.bio = data.bio;
                    if (data.filter !== undefined) user.filter = data.filter;
                    
                    const todayDate = new Date().toDateString();
                    if (user.lastResetDate !== todayDate) {
                        user.lastResetDate = todayDate;
                    }
                    
                    user.socketId = socket.id;
                    user.connected = true;
                    user.lastActive = new Date();
                    await user.save();
                }
                
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;
                
                // Achievement va questlarni olish
                const achievements = await Achievement.find({ userId, unlocked: true });
                const dailyQuests = await DailyQuest.find({ userId, date: new Date().toDateString() });
                
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
                    totalGames: user.totalGames,
                    wins: user.wins,
                    draws: user.draws,
                    losses: user.losses,
                    winStreak: user.winStreak,
                    maxWinStreak: user.maxWinStreak,
                    mutualMatchesCount: user.mutualMatchesCount,
                    friendsCount: user.friendsCount,
                    streakDays: user.streakDays,
                    achievements: achievements,
                    dailyQuests: dailyQuests
                });
                
            } else {
                // TEST MODE
                const testUser = getTestUser(userId);
                
                testUser.firstName = data.firstName || testUser.firstName;
                testUser.username = data.username || testUser.username;
                testUser.photoUrl = data.photoUrl || testUser.photoUrl;
                testUser.gender = data.gender || testUser.gender;
                testUser.hasSelectedGender = data.hasSelectedGender !== undefined ? data.hasSelectedGender : testUser.hasSelectedGender;
                testUser.bio = data.bio || testUser.bio;
                testUser.filter = data.filter || testUser.filter;
                
                // Streak hisoblash
                const today = new Date().toDateString();
                const lastLoginDate = testUser.lastLogin ? new Date(testUser.lastLogin).toDateString() : null;
                
                if (lastLoginDate !== today) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toDateString();
                    
                    if (lastLoginDate === yesterdayStr) {
                        testUser.streakDays += 1;
                    } else if (lastLoginDate && lastLoginDate !== yesterdayStr) {
                        testUser.streakDays = 1;
                    }
                    testUser.lastLogin = new Date();
                }
                
                const todayDate = new Date().toDateString();
                if (testUser.lastResetDate !== todayDate) {
                    testUser.lastResetDate = todayDate;
                }
                
                testUser.socketId = socket.id;
                testUser.connected = true;
                testUser.lastActive = new Date();
                
                testUsersDB.set(userId, testUser);
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;
                
                const achievements = getTestAchievements(userId);
                const dailyQuests = getTestDailyQuests(userId);
                
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
                    totalGames: testUser.totalGames,
                    wins: testUser.wins,
                    draws: testUser.draws,
                    losses: testUser.losses,
                    winStreak: testUser.winStreak,
                    maxWinStreak: testUser.maxWinStreak,
                    mutualMatchesCount: testUser.mutualMatchesCount,
                    friendsCount: testUser.friendsCount,
                    streakDays: testUser.streakDays,
                    achievements: achievements,
                    dailyQuests: dailyQuests
                });
            }
            
            console.log('✅ Auth OK:', userId.substring(0, 10) + '...');
            
            let hasSelectedGender;
            if (isMongoConnected) {
                const user = await User.findOne({ userId });
                hasSelectedGender = user ? user.hasSelectedGender : false;
            } else {
                hasSelectedGender = testUsersDB.get(userId)?.hasSelectedGender || false;
            }
            
            if (!hasSelectedGender) {
                setTimeout(() => {
                    socket.emit('show_gender_selection', {
                        mandatory: true,
                        message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                    });
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ AUTH XATO:', error.message);
            socket.emit('error', { message: 'Server ichki xatosi' });
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
            
            console.log('⚧️ Gender tanlash:', userId.substring(0, 10) + '...', gender);
            
            if (isMongoConnected) {
                await User.updateOne(
                    { userId },
                    {
                        $set: {
                            gender: gender,
                            hasSelectedGender: true,
                            lastActive: new Date()
                        }
                    }
                );
            } else {
                const testUser = getTestUser(userId);
                testUser.gender = gender;
                testUser.hasSelectedGender = true;
                testUser.lastActive = new Date();
                testUsersDB.set(userId, testUser);
            }
            
            socket.emit('gender_selected', {
                gender: gender,
                hasSelectedGender: true,
                message: `Gender tanlandi! Endi "Navbatga Kirish" tugmasini bosing.`
            });
            
            console.log('✅ Gender tanlandi, foydalanuvchi o\'zi navbatga kirishi mumkin');
            
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
            
            console.log('🚀 Navbatga kirish:', userId.substring(0, 10) + '...');
            
            let hasSelectedGender = false;
            if (isMongoConnected) {
                const user = await User.findOne({ userId });
                hasSelectedGender = user ? user.hasSelectedGender : false;
            } else {
                hasSelectedGender = testUsersDB.get(userId)?.hasSelectedGender || false;
            }
            
            if (!hasSelectedGender) {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
                });
                return;
            }
            
            if (queue.includes(userId)) {
                const position = queue.indexOf(userId) + 1;
                socket.emit('queue_joined', {
                    position: position,
                    total: queue.length
                });
                return;
            }
            
            queue.push(userId);
            
            socket.emit('queue_joined', {
                position: queue.length,
                total: queue.length
            });
            
            updateWaitingCount();
            
            setTimeout(() => findAndStartDuels(), 500);
            
        } catch (error) {
            console.error('Navbatga kirish xatosi:', error);
        }
    });
    
    // ==================== NAVBATDAN CHIQISH ====================
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        console.log('🚪 Navbatdan chiqish:', userId.substring(0, 10) + '...');
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            updateWaitingCount();
        }
    });
    
    // ==================== TO'SH-QAYCHI-QOG'OZ OVOZ BERISH ====================
    socket.on('vote', async (data) => {
        try {
            const userId = socket.userId;
            const { duelId, choice } = data;
            
            if (!userId) return;
            
            console.log('🗳️ Ovoz berish:', userId.substring(0, 10) + '...', choice);
            
            const duelData = activeDuels.get(duelId);
            if (!duelData || duelData.ended) {
                socket.emit('error', { message: 'Bu duel tugagan' });
                return;
            }
            
            if (duelData.player1 !== userId && duelData.player2 !== userId) {
                socket.emit('error', { message: 'Siz bu duelda emassiz' });
                return;
            }
            
            // Tanlovni saqlash
            if (duelData.player1 === userId) {
                duelData.player1Choice = choice;
            } else {
                duelData.player2Choice = choice;
            }
            
            // Raqib tanlovini bildirish
            const opponentId = duelData.player1 === userId ? duelData.player2 : duelData.player1;
            const opponentSocketId = onlineUsers.get(opponentId);
            if (opponentSocketId) {
                const opponentSocket = io.sockets.sockets.get(opponentSocketId);
                if (opponentSocket) {
                    opponentSocket.emit('opponent_choice', {
                        choice: choice
                    });
                }
            }
            
            // Ikkala o'yinchi ham tanlagan bo'lsa
            if (duelData.player1Choice && duelData.player2Choice) {
                await processRPSDuelResult(duelId);
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
            
            console.log('📝 Profil yangilash:', userId.substring(0, 10) + '...');
            
            if (isMongoConnected) {
                await User.updateOne(
                    { userId },
                    {
                        $set: {
                            bio: data.bio || '',
                            gender: data.gender || 'not_specified',
                            filter: data.filter || 'not_specified',
                            lastActive: new Date()
                        }
                    }
                );
            } else {
                const testUser = getTestUser(userId);
                testUser.bio = data.bio || '';
                testUser.gender = data.gender || 'not_specified';
                testUser.filter = data.filter || 'not_specified';
                testUser.lastActive = new Date();
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
            
            console.log('👥 Do\'stlar ro\'yxati so\'rovi:', userId.substring(0, 10) + '...');
            
            if (isMongoConnected) {
                const user = await User.findOne({ userId });
                if (!user) {
                    socket.emit('friends_list', {
                        friends: [],
                        total: 0,
                        online: 0
                    });
                    return;
                }
                
                const mutualMatches = await MutualMatch.find({
                    $or: [
                        { user1Id: userId },
                        { user2Id: userId }
                    ]
                });
                
                const friendIds = mutualMatches.map(match => 
                    match.user1Id === userId ? match.user2Id : match.user1Id
                );
                
                const friends = await User.find({
                    userId: { $in: friendIds }
                }).select('userId firstName username photoUrl gender rating totalGames connected lastActive');
                
                const formattedFriends = friends.map(friend => ({
                    id: friend.userId,
                    name: friend.firstName,
                    username: friend.username,
                    photo: friend.photoUrl,
                    gender: friend.gender,
                    rating: friend.rating,
                    games: friend.totalGames,
                    online: friend.connected,
                    lastActive: friend.lastActive,
                    isMutual: true
                }));
                
                socket.emit('friends_list', {
                    friends: formattedFriends,
                    total: formattedFriends.length,
                    online: formattedFriends.filter(f => f.online).length
                });
                
            } else {
                socket.emit('friends_list', {
                    friends: [],
                    total: 0,
                    online: 0
                });
            }
            
        } catch (error) {
            console.error('Do\'stlar ro\'yxatini olish xatosi:', error);
        }
    });
    
    // ==================== QUEST UPDATE ====================
    socket.on('update_quest', async (data) => {
        try {
            const userId = socket.userId;
            const { questType, value = 1 } = data;
            
            if (!userId) return;
            
            console.log('🎯 Quest yangilash:', userId.substring(0, 10) + '...', questType);
            
            if (isMongoConnected) {
                const today = new Date().toDateString();
                let quest = await DailyQuest.findOne({ 
                    userId, 
                    type: questType,
                    date: today 
                });
                
                if (!quest) {
                    // Quest topilmasa, yangi yaratish
                    const questData = getQuestData(questType);
                    quest = new DailyQuest({
                        userId,
                        questId: questType + '_' + Date.now(),
                        title: questData.title,
                        description: questData.description,
                        progress: value,
                        total: questData.total,
                        reward: questData.reward,
                        type: questType,
                        date: today
                    });
                } else {
                    quest.progress += value;
                    if (quest.progress >= quest.total) {
                        quest.completed = true;
                    }
                }
                
                await quest.save();
                
                // Barcha questlarni qaytarish
                const dailyQuests = await DailyQuest.find({ userId, date: today });
                socket.emit('quest_updated', {
                    quests: dailyQuests,
                    completed: quest.completed,
                    reward: quest.reward
                });
                
            } else {
                // Test mode
                const quests = getTestDailyQuests(userId);
                const today = new Date().toDateString();
                
                quests.forEach(quest => {
                    if (quest.type === questType && quest.date === today) {
                        quest.progress += value;
                        if (quest.progress >= quest.total) {
                            quest.completed = true;
                        }
                    }
                });
                
                testDailyQuestsDB.set(userId, quests);
                socket.emit('quest_updated', {
                    quests: quests,
                    completed: quests.some(q => q.type === questType && q.completed)
                });
            }
            
        } catch (error) {
            console.error('Quest yangilash xatosi:', error);
        }
    });
    
    // ==================== QUEST REWARD ====================
    socket.on('claim_quest_reward', async (data) => {
        try {
            const userId = socket.userId;
            const { questId } = data;
            
            if (!userId) return;
            
            console.log('🏆 Quest mukofoti olish:', userId.substring(0, 10) + '...', questId);
            
            if (isMongoConnected) {
                const quest = await DailyQuest.findOne({ userId, questId });
                if (!quest || !quest.completed || quest.claimed) {
                    socket.emit('error', { message: 'Quest mukofotini olish mumkin emas' });
                    return;
                }
                
                quest.claimed = true;
                await quest.save();
                
                await User.updateOne(
                    { userId },
                    { $inc: { coins: quest.reward } }
                );
                
                socket.emit('quest_reward_claimed', {
                    questId: questId,
                    reward: quest.reward,
                    message: `${quest.reward} coin qo'shildi!`
                });
                
            } else {
                const quests = getTestDailyQuests(userId);
                const quest = quests.find(q => q.questId === questId);
                
                if (!quest || !quest.completed || quest.claimed) {
                    socket.emit('error', { message: 'Quest mukofotini olish mumkin emas' });
                    return;
                }
                
                quest.claimed = true;
                const testUser = getTestUser(userId);
                testUser.coins += quest.reward;
                testUsersDB.set(userId, testUser);
                
                socket.emit('quest_reward_claimed', {
                    questId: questId,
                    reward: quest.reward,
                    message: `${quest.reward} coin qo'shildi!`
                });
            }
            
        } catch (error) {
            console.error('Quest mukofoti olish xatosi:', error);
        }
    });
    
    // ==================== ACHIEVEMENT CHECK ====================
    socket.on('check_achievement', async (data) => {
        try {
            const userId = socket.userId;
            const { achievementId } = data;
            
            if (!userId) return;
            
            console.log('🏆 Achievement tekshirish:', userId.substring(0, 10) + '...', achievementId);
            
            let user;
            if (isMongoConnected) {
                user = await User.findOne({ userId });
            } else {
                user = getTestUser(userId);
            }
            
            const achievementData = getAchievementData(achievementId, user);
            
            if (!achievementData) return;
            
            if (isMongoConnected) {
                let achievement = await Achievement.findOne({ userId, achievementId });
                
                if (!achievement) {
                    achievement = new Achievement({
                        userId,
                        achievementId,
                        title: achievementData.title,
                        description: achievementData.description,
                        icon: achievementData.icon,
                        progress: achievementData.progress,
                        required: achievementData.required,
                        unlocked: achievementData.progress >= achievementData.required
                    });
                    await achievement.save();
                } else {
                    achievement.progress = achievementData.progress;
                    if (achievement.progress >= achievement.required && !achievement.unlocked) {
                        achievement.unlocked = true;
                        achievement.unlockedAt = new Date();
                    }
                    await achievement.save();
                }
                
                if (achievement.unlocked && achievement.progress >= achievement.required) {
                    // Mukofot berish
                    await User.updateOne(
                        { userId },
                        { $inc: { coins: achievementData.reward } }
                    );
                    
                    socket.emit('achievement_unlocked', {
                        achievement: {
                            id: achievement.achievementId,
                            title: achievement.title,
                            description: achievement.description,
                            icon: achievement.icon,
                            reward: achievementData.reward
                        },
                        achievements: await Achievement.find({ userId, unlocked: true })
                    });
                }
                
            } else {
                const achievements = getTestAchievements(userId);
                let achievement = achievements.find(a => a.achievementId === achievementId);
                
                if (!achievement) {
                    achievement = {
                        userId,
                        achievementId,
                        title: achievementData.title,
                        description: achievementData.description,
                        icon: achievementData.icon,
                        progress: achievementData.progress,
                        required: achievementData.required,
                        unlocked: achievementData.progress >= achievementData.required,
                        unlockedAt: new Date()
                    };
                    achievements.push(achievement);
                } else {
                    achievement.progress = achievementData.progress;
                    if (achievement.progress >= achievement.required && !achievement.unlocked) {
                        achievement.unlocked = true;
                        achievement.unlockedAt = new Date();
                    }
                }
                
                if (achievement.unlocked && achievement.progress >= achievement.required) {
                    // Mukofot berish
                    const testUser = getTestUser(userId);
                    testUser.coins += achievementData.reward;
                    testUsersDB.set(userId, testUser);
                    
                    socket.emit('achievement_unlocked', {
                        achievement: {
                            id: achievement.achievementId,
                            title: achievement.title,
                            description: achievement.description,
                            icon: achievement.icon,
                            reward: achievementData.reward
                        },
                        achievements: achievements.filter(a => a.unlocked)
                    });
                }
                
                testAchievementsDB.set(userId, achievements);
            }
            
        } catch (error) {
            console.error('Achievement tekshirish xatosi:', error);
        }
    });
    
    // ==================== DUELDAN CHIQISH ====================
    socket.on('leave_duel', async (data) => {
        try {
            const userId = socket.userId;
            const { duelId } = data;
            
            if (!userId) return;
            
            console.log('🚪 Dueldan chiqish:', userId.substring(0, 10) + '...', duelId);
            
            const duelData = activeDuels.get(duelId);
            if (!duelData) return;
            
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
            
        } catch (error) {
            console.error('Dueldan chiqish xatosi:', error);
        }
    });
    
    // ==================== DISCONNECT ====================
    socket.on('disconnect', async () => {
        try {
            const userId = socket.userId;
            
            if (userId) {
                console.log('❌ Ulanish uzildi:', userId.substring(0, 10) + '...');
                
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
                                lastActive: new Date()
                            }
                        }
                    );
                } else {
                    const testUser = getTestUser(userId);
                    testUser.connected = false;
                    testUser.lastActive = new Date();
                    testUsersDB.set(userId, testUser);
                }
                
                // Dueldan chiqish
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
                    position: index + 1
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
        
        // Gender filter logikasi
        const userGender = user.gender;
        const userFilter = user.filter;
        const opponentGender = opponent.gender;
        const opponentFilter = opponent.filter;
        
        // 1. Foydalanuvchi filterini tekshirish
        if (userFilter !== 'not_specified' && userFilter !== opponentGender) {
            continue;
        }
        
        // 2. Opponent filterini tekshirish
        if (opponentFilter !== 'not_specified' && opponentFilter !== userGender) {
            continue;
        }
        
        // 3. Gender mosligini tekshirish
        if (userGender === 'not_specified' || opponentGender === 'not_specified') {
            return opponentId;
        }
        
        // 4. Genderlar farqli bo'lishi kerak
        if (userGender !== opponentGender) {
            return opponentId;
        }
    }
    
    return null;
}

async function startDuel(player1Id, player2Id) {
    try {
        console.log('⚔️ Tosh-Qaychi-Qog\'oz Duel boshlanmoqda:', {
            player1: player1Id.substring(0, 10) + '...',
            player2: player2Id.substring(0, 10) + '...'
        });
        
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
                player2Id
            });
            await duel.save();
        } else {
            testDuelsDB.set(duelId, {
                duelId,
                player1Id,
                player2Id,
                player1Choice: null,
                player2Choice: null,
                ended: false,
                resultsSent: false
            });
        }
        
        activeDuels.set(duelId, {
            id: duelId,
            player1: player1Id,
            player2: player2Id,
            player1Choice: null,
            player2Choice: null,
            ended: false,
            resultsSent: false
        });
        
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
                        totalGames: player2.totalGames,
                        level: player2.level,
                        gender: player2.gender
                    }
                });
            }
        }
        
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
                        totalGames: player1.totalGames,
                        level: player1.level,
                        gender: player1.gender
                    }
                });
            }
        }
        
        // Timeout
        setTimeout(async () => {
            const duelData = activeDuels.get(duelId);
            if (duelData && !duelData.ended) {
                await handleDuelTimeout(duelId);
            }
        }, 30000);
        
    } catch (error) {
        console.error('Duel boshlashda xato:', error);
    }
}

async function processRPSDuelResult(duelId) {
    try {
        const duelData = activeDuels.get(duelId);
        if (!duelData || duelData.ended || duelData.resultsSent) return;
        
        duelData.ended = true;
        duelData.resultsSent = true;
        
        let player1, player2;
        if (isMongoConnected) {
            player1 = await User.findOne({ userId: duelData.player1 });
            player2 = await User.findOne({ userId: duelData.player2 });
        } else {
            player1 = getTestUser(duelData.player1);
            player2 = getTestUser(duelData.player2);
        }
        
        if (!player1 || !player2) return;
        
        // Natijani hisoblash
        const result = determineWinner(duelData.player1Choice, duelData.player2Choice);
        const rewards = calculateRPSRewards(
            duelData.player1Choice, 
            duelData.player2Choice, 
            player1.rating, 
            player2.rating
        );
        
        // Foydalanuvchilarni yangilash
        if (isMongoConnected) {
            // Player1 yangilash
            await User.updateOne(
                { userId: duelData.player1 },
                {
                    $inc: {
                        totalGames: 1,
                        coins: rewards.player1.coins,
                        rating: rewards.player1.ratingChange,
                        wins: result === 'player1' ? 1 : 0,
                        draws: result === 'draw' ? 1 : 0,
                        losses: result === 'player2' ? 1 : 0
                    },
                    $set: {
                        winStreak: result === 'player1' ? (player1.winStreak || 0) + 1 : 0,
                        maxWinStreak: result === 'player1' ? Math.max(player1.maxWinStreak || 0, (player1.winStreak || 0) + 1) : player1.maxWinStreak,
                        lastActive: new Date()
                    }
                }
            );
            
            // Player2 yangilash
            await User.updateOne(
                { userId: duelData.player2 },
                {
                    $inc: {
                        totalGames: 1,
                        coins: rewards.player2.coins,
                        rating: rewards.player2.ratingChange,
                        wins: result === 'player2' ? 1 : 0,
                        draws: result === 'draw' ? 1 : 0,
                        losses: result === 'player1' ? 1 : 0
                    },
                    $set: {
                        winStreak: result === 'player2' ? (player2.winStreak || 0) + 1 : 0,
                        maxWinStreak: result === 'player2' ? Math.max(player2.maxWinStreak || 0, (player2.winStreak || 0) + 1) : player2.maxWinStreak,
                        lastActive: new Date()
                    }
                }
            );
            
        } else {
            // Test mode
            player1.totalGames += 1;
            player1.coins += rewards.player1.coins;
            player1.rating += rewards.player1.ratingChange;
            
            player2.totalGames += 1;
            player2.coins += rewards.player2.coins;
            player2.rating += rewards.player2.ratingChange;
            
            if (result === 'player1') {
                player1.wins += 1;
                player2.losses += 1;
                player1.winStreak = (player1.winStreak || 0) + 1;
                player1.maxWinStreak = Math.max(player1.maxWinStreak || 0, player1.winStreak);
                player2.winStreak = 0;
            } else if (result === 'player2') {
                player2.wins += 1;
                player1.losses += 1;
                player2.winStreak = (player2.winStreak || 0) + 1;
                player2.maxWinStreak = Math.max(player2.maxWinStreak || 0, player2.winStreak);
                player1.winStreak = 0;
            } else {
                player1.draws += 1;
                player2.draws += 1;
            }
            
            player1.lastActive = new Date();
            player2.lastActive = new Date();
            
            testUsersDB.set(duelData.player1, player1);
            testUsersDB.set(duelData.player2, player2);
        }
        
        // Natijani o'yinchilarga yuborish
        const player1SocketId = onlineUsers.get(duelData.player1);
        if (player1SocketId) {
            const socket = io.sockets.sockets.get(player1SocketId);
            if (socket) {
                const player1Result = result === 'player1' ? 'win' : result === 'player2' ? 'lose' : 'draw';
                socket.emit('match', {
                    result: player1Result,
                    yourChoice: duelData.player1Choice,
                    opponentChoice: duelData.player2Choice,
                    partner: {
                        id: duelData.player2,
                        name: player2.firstName,
                        username: player2.username,
                        photo: player2.photoUrl,
                        gender: player2.gender
                    },
                    rewards: {
                        coins: rewards.player1.coins,
                        xp: rewards.player1.xp
                    },
                    newRating: player1.rating + rewards.player1.ratingChange
                });
            }
        }
        
        const player2SocketId = onlineUsers.get(duelData.player2);
        if (player2SocketId) {
            const socket = io.sockets.sockets.get(player2SocketId);
            if (socket) {
                const player2Result = result === 'player2' ? 'win' : result === 'player1' ? 'lose' : 'draw';
                socket.emit('match', {
                    result: player2Result,
                    yourChoice: duelData.player2Choice,
                    opponentChoice: duelData.player1Choice,
                    partner: {
                        id: duelData.player1,
                        name: player1.firstName,
                        username: player1.username,
                        photo: player1.photoUrl,
                        gender: player1.gender
                    },
                    rewards: {
                        coins: rewards.player2.coins,
                        xp: rewards.player2.xp
                    },
                    newRating: player2.rating + rewards.player2.ratingChange
                });
            }
        }
        
        // Questlarni yangilash
        if (player1SocketId) {
            const socket = io.sockets.sockets.get(player1SocketId);
            if (socket) {
                socket.emit('update_quest', {
                    questType: 'play_duel',
                    value: 1
                });
                if (result === 'player1') {
                    socket.emit('update_quest', {
                        questType: 'win_duel',
                        value: 1
                    });
                }
            }
        }
        
        if (player2SocketId) {
            const socket = io.sockets.sockets.get(player2SocketId);
            if (socket) {
                socket.emit('update_quest', {
                    questType: 'play_duel',
                    value: 1
                });
                if (result === 'player2') {
                    socket.emit('update_quest', {
                        questType: 'win_duel',
                        value: 1
                    });
                }
            }
        }
        
        // Ketma-ket g'alaba uchun bonus
        if (result === 'player1' && player1.winStreak >= 3) {
            const streakBonus = Math.min(100, player1.winStreak * 10);
            if (player1SocketId) {
                const socket = io.sockets.sockets.get(player1SocketId);
                if (socket) {
                    socket.emit('streak_bonus', {
                        streak: player1.winStreak,
                        bonus: streakBonus
                    });
                }
            }
        }
        
        if (result === 'player2' && player2.winStreak >= 3) {
            const streakBonus = Math.min(100, player2.winStreak * 10);
            if (player2SocketId) {
                const socket = io.sockets.sockets.get(player2SocketId);
                if (socket) {
                    socket.emit('streak_bonus', {
                        streak: player2.winStreak,
                        bonus: streakBonus
                    });
                }
            }
        }
        
        setTimeout(() => {
            returnPlayersToQueue(duelData.player1, duelData.player2);
            activeDuels.delete(duelId);
        }, 1000);
        
    } catch (error) {
        console.error('Tosh-Qaychi-Qog\'oz duel natijasini qayta ishlashda xato:', error);
    }
}

async function handleDuelTimeout(duelId) {
    try {
        const duelData = activeDuels.get(duelId);
        if (!duelData || duelData.ended) return;
        
        duelData.ended = true;
        
        // Agar biror o'yinchi tanlamagan bo'lsa, avtomatik skip deb hisoblaymiz
        if (!duelData.player1Choice) duelData.player1Choice = 'skip';
        if (!duelData.player2Choice) duelData.player2Choice = 'skip';
        
        // Skip uchun hech qanday mukofot yo'q
        const player1SocketId = onlineUsers.get(duelData.player1);
        const player2SocketId = onlineUsers.get(duelData.player2);
        
        if (player1SocketId) {
            const socket = io.sockets.sockets.get(player1SocketId);
            if (socket) socket.emit('no_match', {});
        }
        
        if (player2SocketId) {
            const socket = io.sockets.sockets.get(player2SocketId);
            if (socket) socket.emit('no_match', {});
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
    console.log('🔄 Duel tugadi, oyinchilar oz navbatlariga qaytishi mumkin');
}

async function findAndStartDuels() {
    if (queue.length < 2) return;
    
    console.log('🔍 Duel qidirilmoqda... Navbat:', queue.length);
    
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

// ==================== ACHIEVEMENT FUNKSIYALARI ====================

async function createDefaultAchievements(userId) {
    const defaultAchievements = [
        {
            achievementId: 'first_duel',
            title: 'Birinchi Duel',
            description: 'Birinchi duelni o\'ynash',
            icon: '🎮',
            required: 1,
            reward: 100
        },
        {
            achievementId: 'first_win',
            title: 'Birinchi G\'alaba',
            description: 'Birinchi g\'alabani qo\'lga kiriting',
            icon: '🏆',
            required: 1,
            reward: 200
        },
        {
            achievementId: 'win_streak_3',
            title: '3 ketma-ket g\'alaba',
            description: '3 marta ketma-ket g\'alaba qozoning',
            icon: '🔥',
            required: 3,
            reward: 150
        },
        {
            achievementId: 'win_streak_5',
            title: '5 ketma-ket g\'alaba',
            description: '5 marta ketma-ket g\'alaba qozoning',
            icon: '⚡',
            required: 5,
            reward: 300
        },
        {
            achievementId: 'play_10_games',
            title: '10 ta duel',
            description: '10 ta duel o\'ynang',
            icon: '🎯',
            required: 10,
            reward: 250
        },
        {
            achievementId: 'play_50_games',
            title: '50 ta duel',
            description: '50 ta duel o\'ynang',
            icon: '💎',
            required: 50,
            reward: 500
        },
        {
            achievementId: 'max_streak_10',
            title: 'Rekordchi',
            description: '10 martadan ko\'p ketma-ket g\'alaba qozoning',
            icon: '👑',
            required: 10,
            reward: 1000
        }
    ];
    
    if (isMongoConnected) {
        for (const achievementData of defaultAchievements) {
            const achievement = new Achievement({
                userId,
                achievementId: achievementData.achievementId,
                title: achievementData.title,
                description: achievementData.description,
                icon: achievementData.icon,
                progress: 0,
                required: achievementData.required,
                unlocked: false
            });
            await achievement.save();
        }
    } else {
        testAchievementsDB.set(userId, defaultAchievements.map(achievementData => ({
            userId,
            achievementId: achievementData.achievementId,
            title: achievementData.title,
            description: achievementData.description,
            icon: achievementData.icon,
            progress: 0,
            required: achievementData.required,
            unlocked: false
        })));
    }
}

function getAchievementData(achievementId, user) {
    const achievementMap = {
        'first_duel': {
            progress: user.totalGames || 0,
            required: 1,
            title: 'Birinchi Duel',
            description: 'Birinchi duelni o\'ynash',
            icon: '🎮',
            reward: 100
        },
        'first_win': {
            progress: user.wins || 0,
            required: 1,
            title: 'Birinchi G\'alaba',
            description: 'Birinchi g\'alabani qo\'lga kiriting',
            icon: '🏆',
            reward: 200
        },
        'win_streak_3': {
            progress: user.winStreak || 0,
            required: 3,
            title: '3 ketma-ket g\'alaba',
            description: '3 marta ketma-ket g\'alaba qozoning',
            icon: '🔥',
            reward: 150
        },
        'win_streak_5': {
            progress: user.winStreak || 0,
            required: 5,
            title: '5 ketma-ket g\'alaba',
            description: '5 marta ketma-ket g\'alaba qozoning',
            icon: '⚡',
            reward: 300
        },
        'play_10_games': {
            progress: user.totalGames || 0,
            required: 10,
            title: '10 ta duel',
            description: '10 ta duel o\'ynang',
            icon: '🎯',
            reward: 250
        },
        'play_50_games': {
            progress: user.totalGames || 0,
            required: 50,
            title: '50 ta duel',
            description: '50 ta duel o\'ynang',
            icon: '💎',
            reward: 500
        },
        'max_streak_10': {
            progress: user.maxWinStreak || 0,
            required: 10,
            title: 'Rekordchi',
            description: '10 martadan ko\'p ketma-ket g\'alaba qozoning',
            icon: '👑',
            reward: 1000
        }
    };
    
    return achievementMap[achievementId];
}

// ==================== QUEST FUNKSIYALARI ====================

async function createDefaultDailyQuests(userId) {
    const today = new Date().toDateString();
    
    const defaultQuests = [
        {
            questId: 'play_3_duels_' + Date.now(),
            title: '3 ta duel o\'ynash',
            description: '3 ta duel o\'ynang',
            progress: 0,
            total: 3,
            reward: 50,
            type: 'play_duel',
            date: today
        },
        {
            questId: 'win_1_duel_' + Date.now(),
            title: '1 ta duel yutish',
            description: '1 ta duel yuting',
            progress: 0,
            total: 1,
            reward: 100,
            type: 'win_duel',
            date: today
        },
        {
            questId: 'make_1_friend_' + Date.now(),
            title: '1 ta do\'st orttirish',
            description: 'Mutual match orqali do\'st orttiring',
            progress: 0,
            total: 1,
            reward: 200,
            type: 'make_friend',
            date: today
        }
    ];
    
    if (isMongoConnected) {
        for (const questData of defaultQuests) {
            const quest = new DailyQuest({
                userId,
                ...questData
            });
            await quest.save();
        }
    }
}

function getQuestData(questType) {
    const questMap = {
        'play_duel': {
            title: 'Duel o\'ynash',
            description: 'Duel o\'ynang',
            total: 3,
            reward: 50
        },
        'win_duel': {
            title: 'Duel yutish',
            description: 'Duel yuting',
            total: 1,
            reward: 100
        },
        'make_friend': {
            title: 'Do\'st orttirish',
            description: 'Mutual match orqali do\'st orttiring',
            total: 1,
            reward: 200
        },
        'earn_coins': {
            title: 'Coin yig\'ish',
            description: 'Coin yig\'ing',
            total: 100,
            reward: 50
        }
    };
    
    return questMap[questType] || {
        title: 'Yangilik',
        description: 'Yangi quest',
        total: 1,
        reward: 10
    };
}

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('🚀 Tosh-Qaychi-Qog\'oz Duel Server ishga tushmoqda...');
    
    await connectToMongoDB();
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + '='.repeat(60));
        console.log('⚔️ TO\'SH-QAYCHI-QOG\'OZ DUEL SERVER');
        console.log('='.repeat(60));
        console.log(`📍 Server ishga tushdi: PORT ${PORT}`);
        console.log(`🌍 URL: http://localhost:${PORT}`);
        console.log(`🗄️  Database: ${isMongoConnected ? 'MongoDB Atlas' : 'TEST MODE'}`);
        console.log('🎮 O\'yin: Tosh (🪨) - Qaychi (✂️) - Qog\'oz (📄)');
        console.log('='.repeat(60));
        console.log('✅ Barcha tizimlar tayyor');
        console.log('✅ Socket.io server faol');
        console.log('✅ O\'yin logikasi yoqilgan');
        console.log('='.repeat(60));
    });
}

startServer();

// Kunlik reset
setInterval(async () => {
    try {
        const today = new Date().toDateString();
        
        if (isMongoConnected) {
            // Eski questlarni o'chirish
            await DailyQuest.deleteMany({
                date: { $ne: today }
            });
        } else {
            // Test mode: barcha questlarni yangilash
            testDailyQuestsDB.clear();
        }
        
    } catch (error) {
        console.error('Kunlik reset xatosi:', error);
    }
}, 60000); // Har daqiqa