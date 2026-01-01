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
            'https://like-duel.onrender.com',
            'https://like-duel-game.onrender.com',
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
console.log('🚀 SERVER ISHGA TUSHDI');
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
let User, MutualMatch, Duel;

if (isMongoConnected) {
    try {
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
            lastActive: { type: Date, default: Date.now }
        });

        const mutualMatchSchema = new mongoose.Schema({
            user1Id: { type: String, required: true },
            user2Id: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        });

        const duelSchema = new mongoose.Schema({
            duelId: { type: String, required: true, unique: true },
            player1Id: { type: String, required: true },
            player2Id: { type: String, required: true },
            votes: { type: Map, of: String, default: {} },
            startTime: { type: Date, default: Date.now },
            ended: { type: Boolean, default: false },
            resultsSent: { type: Boolean, default: false }
        });

        User = mongoose.model('User', userSchema);
        MutualMatch = mongoose.model('MutualMatch', mutualMatchSchema);
        Duel = mongoose.model('Duel', duelSchema);
        
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
            matches: 0,
            duels: 0,
            wins: 0,
            totalLikes: 0,
            mutualMatchesCount: 0,
            friendsCount: 0,
            dailySuperLikes: 3,
            lastResetDate: new Date().toDateString(),
            socketId: '',
            connected: false,
            lastActive: new Date()
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
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// ==================== ROUTES ====================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Like Duel Server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
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
            onlineUsers: onlineUsers.size
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
    console.log('✅ Yangi ulanish:', socket.id);
    
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
                        filter: data.filter || 'not_specified'
                    });
                    await user.save();
                } else {
                    user.firstName = data.firstName || user.firstName;
                    user.username = data.username || user.username;
                    user.photoUrl = data.photoUrl || user.photoUrl;
                    if (data.gender !== undefined) user.gender = data.gender;
                    if (data.hasSelectedGender !== undefined) user.hasSelectedGender = data.hasSelectedGender;
                    if (data.bio !== undefined) user.bio = data.bio;
                    if (data.filter !== undefined) user.filter = data.filter;
                    
                    const today = new Date().toDateString();
                    if (user.lastResetDate !== today) {
                        user.dailySuperLikes = 3;
                        user.lastResetDate = today;
                    }
                    
                    user.socketId = socket.id;
                    user.connected = true;
                    user.lastActive = new Date();
                    await user.save();
                }
                
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;
                
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
                    dailySuperLikes: user.dailySuperLikes
                });
                
            } else {
                const testUser = getTestUser(userId);
                
                testUser.firstName = data.firstName || testUser.firstName;
                testUser.username = data.username || testUser.username;
                testUser.photoUrl = data.photoUrl || testUser.photoUrl;
                testUser.gender = data.gender || testUser.gender;
                testUser.hasSelectedGender = data.hasSelectedGender !== undefined ? data.hasSelectedGender : testUser.hasSelectedGender;
                testUser.bio = data.bio || testUser.bio;
                testUser.filter = data.filter || testUser.filter;
                
                const today = new Date().toDateString();
                if (testUser.lastResetDate !== today) {
                    testUser.dailySuperLikes = 3;
                    testUser.lastResetDate = today;
                }
                
                testUser.socketId = socket.id;
                testUser.connected = true;
                testUser.lastActive = new Date();
                
                testUsersDB.set(userId, testUser);
                onlineUsers.set(userId, socket.id);
                socket.userId = userId;
                
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
                    dailySuperLikes: testUser.dailySuperLikes
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
    
    // ==================== DUEL OVOZ BERISH ====================
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
                
                if (isMongoConnected) {
                    await User.updateOne(
                        { userId },
                        {
                            $inc: { dailySuperLikes: -1 },
                            $set: { lastActive: new Date() }
                        }
                    );
                } else {
                    const testUser = getTestUser(userId);
                    testUser.dailySuperLikes -= 1;
                    testUser.lastActive = new Date();
                    testUsersDB.set(userId, testUser);
                }
                
                socket.emit('super_like_used', {
                    remaining: user.dailySuperLikes - 1
                });
            }
            
            duelData.votes[userId] = choice;
            
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
                }).select('userId firstName username photoUrl gender rating matches connected lastActive');
                
                const formattedFriends = friends.map(friend => ({
                    id: friend.userId,
                    name: friend.firstName,
                    username: friend.username,
                    photo: friend.photoUrl,
                    gender: friend.gender,
                    rating: friend.rating,
                    matches: friend.matches,
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
        
        // YANGI VA TO'G'RI GENDER FILTER LOGIKASI
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
            // Birortasi 'not_specified' bo'lsa, match qilish mumkin
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
        console.log('⚔️ Duel boshlanmoqda:', {
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
                        matches: player2.matches,
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
                        matches: player1.matches,
                        level: player1.level,
                        gender: player1.gender
                    }
                });
            }
        }
        
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
        
        // YANGI: MUTUAL MATCH SAQLASH FUNKSIYASI
        async function saveMutualMatch(user1Id, user2Id, isSuperLike = false) {
            try {
                if (isMongoConnected) {
                    const existingMatch = await MutualMatch.findOne({
                        $or: [
                            { user1Id: user1Id, user2Id: user2Id },
                            { user1Id: user2Id, user2Id: user1Id }
                        ]
                    });
                    
                    if (!existingMatch) {
                        const mutualMatch = new MutualMatch({
                            user1Id: user1Id,
                            user2Id: user2Id,
                            isSuperLike: isSuperLike,
                            createdAt: new Date()
                        });
                        await mutualMatch.save();
                        
                        await User.updateOne(
                            { userId: user1Id },
                            { 
                                $inc: { 
                                    mutualMatchesCount: 1,
                                    friendsCount: 1
                                }
                            }
                        );
                        
                        await User.updateOne(
                            { userId: user2Id },
                            { 
                                $inc: { 
                                    mutualMatchesCount: 1,
                                    friendsCount: 1
                                }
                            }
                        );
                        
                        const user1SocketId = onlineUsers.get(user1Id);
                        const user2SocketId = onlineUsers.get(user2Id);
                        
                        if (user1SocketId) {
                            const socket = io.sockets.sockets.get(user1SocketId);
                            if (socket) {
                                socket.emit('mutual_match', {
                                    partnerId: user2Id,
                                    partnerName: player2.firstName,
                                    mutualMatchesCount: player1.mutualMatchesCount + 1,
                                    friendsCount: player1.friendsCount + 1,
                                    isSuperLike: isSuperLike
                                });
                            }
                        }
                        
                        if (user2SocketId) {
                            const socket = io.sockets.sockets.get(user2SocketId);
                            if (socket) {
                                socket.emit('mutual_match', {
                                    partnerId: user1Id,
                                    partnerName: player1.firstName,
                                    mutualMatchesCount: player2.mutualMatchesCount + 1,
                                    friendsCount: player2.friendsCount + 1,
                                    isSuperLike: isSuperLike
                                });
                            }
                        }
                    }
                } else {
                    const matchKey = [user1Id, user2Id].sort().join('_');
                    if (!testMutualMatches.has(matchKey)) {
                        testMutualMatches.set(matchKey, {
                            user1Id: user1Id,
                            user2Id: user2Id,
                            isSuperLike: isSuperLike,
                            createdAt: new Date()
                        });
                        
                        const testUser1 = getTestUser(user1Id);
                        const testUser2 = getTestUser(user2Id);
                        
                        testUser1.mutualMatchesCount += 1;
                        testUser1.friendsCount += 1;
                        testUser2.mutualMatchesCount += 1;
                        testUser2.friendsCount += 1;
                        
                        testUsersDB.set(user1Id, testUser1);
                        testUsersDB.set(user2Id, testUser2);
                    }
                }
            } catch (error) {
                console.error('Mutual match saqlashda xato:', error);
            }
        }
        
        if (player1Liked && player2Liked) {
            // O'zaro like
            const isMutualSuperLike = player1SuperLike && player2SuperLike;
            const rewards1 = player1SuperLike ? 70 : 50;
            const rewards2 = player2SuperLike ? 70 : 50;
            
            // Mutual match saqlash
            await saveMutualMatch(duelData.player1, duelData.player2, isMutualSuperLike);
            
            if (isMongoConnected) {
                await User.updateOne(
                    { userId: duelData.player1 },
                    {
                        $inc: {
                            matches: 1,
                            duels: 1,
                            wins: 1,
                            coins: rewards1,
                            rating: 25,
                            totalLikes: 1
                        },
                        $set: { lastActive: new Date() }
                    }
                );
                
                await User.updateOne(
                    { userId: duelData.player2 },
                    {
                        $inc: {
                            matches: 1,
                            duels: 1,
                            wins: 1,
                            coins: rewards2,
                            rating: 25,
                            totalLikes: 1
                        },
                        $set: { lastActive: new Date() }
                    }
                );
            } else {
                player1.matches += 1;
                player1.duels += 1;
                player1.wins += 1;
                player1.coins += rewards1;
                player1.rating += 25;
                player1.totalLikes += 1;
                player1.lastActive = new Date();
                
                player2.matches += 1;
                player2.duels += 1;
                player2.wins += 1;
                player2.coins += rewards2;
                player2.rating += 25;
                player2.totalLikes += 1;
                player2.lastActive = new Date();
            }
            
            const player1SocketId = onlineUsers.get(duelData.player1);
            if (player1SocketId) {
                const socket = io.sockets.sockets.get(player1SocketId);
                if (socket) {
                    socket.emit('match', {
                        partner: {
                            id: duelData.player2,
                            name: player2.firstName,
                            username: player2.username,
                            photo: player2.photoUrl,
                            gender: player2.gender
                        },
                        rewards: { coins: rewards1, xp: 30 },
                        newRating: player1.rating + 25,
                        isMutual: true,
                        isSuperLike: player1SuperLike && player2SuperLike
                    });
                }
            }
            
            const player2SocketId = onlineUsers.get(duelData.player2);
            if (player2SocketId) {
                const socket = io.sockets.sockets.get(player2SocketId);
                if (socket) {
                    socket.emit('match', {
                        partner: {
                            id: duelData.player1,
                            name: player1.firstName,
                            username: player1.username,
                            photo: player1.photoUrl,
                            gender: player1.gender
                        },
                        rewards: { coins: rewards2, xp: 30 },
                        newRating: player2.rating + 25,
                        isMutual: true,
                        isSuperLike: player1SuperLike && player2SuperLike
                    });
                }
            }
            
        } else if (player1Liked) {
            // Faqat player1 like bosdi
            const rewards = player1SuperLike ? 30 : 10;
            
            if (isMongoConnected) {
                await User.updateOne(
                    { userId: duelData.player1 },
                    {
                        $inc: {
                            duels: 1,
                            coins: rewards,
                            totalLikes: 1,
                            rating: 10
                        },
                        $set: { lastActive: new Date() }
                    }
                );
            } else {
                player1.duels += 1;
                player1.coins += rewards;
                player1.totalLikes += 1;
                player1.rating += 10;
                player1.lastActive = new Date();
            }
            
            const player1SocketId = onlineUsers.get(duelData.player1);
            if (player1SocketId) {
                const socket = io.sockets.sockets.get(player1SocketId);
                if (socket) {
                    socket.emit('match', {
                        partner: {
                            id: duelData.player2,
                            name: player2.firstName,
                            username: player2.username,
                            photo: player2.photoUrl,
                            gender: player2.gender
                        },
                        rewards: { coins: rewards, xp: 5 },
                        newRating: player1.rating + 10,
                        isMutual: false,
                        isSuperLike: player1SuperLike
                    });
                }
            }
            
            const player2SocketId = onlineUsers.get(duelData.player2);
            if (player2SocketId) {
                const socket = io.sockets.sockets.get(player2SocketId);
                if (socket) {
                    socket.emit('no_match', {});
                }
            }
            
        } else if (player2Liked) {
            // Faqat player2 like bosdi
            const rewards = player2SuperLike ? 30 : 10;
            
            if (isMongoConnected) {
                await User.updateOne(
                    { userId: duelData.player2 },
                    {
                        $inc: {
                            duels: 1,
                            coins: rewards,
                            totalLikes: 1,
                            rating: 10
                        },
                        $set: { lastActive: new Date() }
                    }
                );
            } else {
                player2.duels += 1;
                player2.coins += rewards;
                player2.totalLikes += 1;
                player2.rating += 10;
                player2.lastActive = new Date();
            }
            
            const player2SocketId = onlineUsers.get(duelData.player2);
            if (player2SocketId) {
                const socket = io.sockets.sockets.get(player2SocketId);
                if (socket) {
                    socket.emit('match', {
                        partner: {
                            id: duelData.player1,
                            name: player1.firstName,
                            username: player1.username,
                            photo: player1.photoUrl,
                            gender: player1.gender
                        },
                        rewards: { coins: rewards, xp: 5 },
                        newRating: player2.rating + 10,
                        isMutual: false,
                        isSuperLike: player2SuperLike
                    });
                }
            }
            
            const player1SocketId = onlineUsers.get(duelData.player1);
            if (player1SocketId) {
                const socket = io.sockets.sockets.get(player1SocketId);
                if (socket) {
                    socket.emit('no_match', {});
                }
            }
            
        } else {
            // Hech kim like bermadi
            if (isMongoConnected) {
                await User.updateOne(
                    { userId: duelData.player1 },
                    { $inc: { duels: 1 }, $set: { lastActive: new Date() } }
                );
                
                await User.updateOne(
                    { userId: duelData.player2 },
                    { $inc: { duels: 1 }, $set: { lastActive: new Date() } }
                );
            } else {
                player1.duels += 1;
                player1.lastActive = new Date();
                player2.duels += 1;
                player2.lastActive = new Date();
            }
            
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
        }
        
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

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('🚀 Server ishga tushmoqda...');
    
    await connectToMongoDB();
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 LIKE DUEL SERVER');
        console.log('='.repeat(60));
        console.log(`📍 Server ishga tushdi: PORT ${PORT}`);
        console.log(`🌍 URL: http://localhost:${PORT}`);
        console.log(`🌍 Render URL: https://like-duel.onrender.com`);
        console.log(`🗄️  Database: ${isMongoConnected ? 'MongoDB Atlas' : 'TEST MODE'}`);
        console.log('='.repeat(60));
        console.log('✅ Barcha tizimlar tayyor');
        console.log('✅ Socket.io server faol');
        console.log('='.repeat(60));
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
                        lastResetDate: today 
                    } 
                }
            );
        } else {
            testUsersDB.forEach((user, userId) => {
                if (user.lastResetDate !== today) {
                    user.dailySuperLikes = 3;
                    user.lastResetDate = today;
                    testUsersDB.set(userId, user);
                }
            });
        }
        
    } catch (error) {
        console.error('Kunlik limitlarni yangilash xatosi:', error);
    }
}, 60000);