const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

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

// ==================== MONGODB MODELLARI ====================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/likeduel', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    telegramId: { type: String, unique: true, sparse: true },
    firstName: String,
    lastName: String,
    username: String,
    photoUrl: String,
    
    // Asosiy ma'lumotlar
    gender: { type: String, enum: ['male', 'female', 'not_specified'], default: 'not_specified' },
    hasSelectedGender: { type: Boolean, default: false },
    bio: { type: String, default: '' },
    filter: { type: String, enum: ['male', 'female', 'not_specified'], default: 'not_specified' },
    
    // O'yin statistikasi
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
    
    // Kunlik limitlar
    dailySuperLikes: { type: Number, default: 3 },
    dailySuperLikesUsed: { type: Number, default: 0 },
    lastResetDate: { type: String, default: () => new Date().toDateString() },
    
    // Tizim ma'lumotlari
    socketId: String,
    connected: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const mutualMatchSchema = new mongoose.Schema({
    user1Id: { type: String, required: true },
    user2Id: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isSuperLike: { type: Boolean, default: true } // FAQAT SUPER LIKE uchun
});

const MutualMatch = mongoose.model('MutualMatch', mutualMatchSchema);

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

const Duel = mongoose.model('Duel', duelSchema);

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: ["https://like-duel.onrender.com", "http://localhost:3000", "http://localhost:5500"],
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// ==================== ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/main.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.js'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

app.get('/api/health', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMatches = await MutualMatch.countDocuments();
        
        res.json({
            status: 'online',
            message: 'Like Duel Server is running with MongoDB',
            timestamp: new Date().toISOString(),
            database: 'MongoDB',
            totalUsers,
            totalMatches,
            activeDuels: duels.size,
            queue: queue.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }
        
        const mutualFriends = await MutualMatch.find({
            $or: [
                { user1Id: req.params.userId },
                { user2Id: req.params.userId }
            ]
        });
        
        res.json({
            userId: user.userId,
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
            mutualFriends: mutualFriends.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reset-daily', async (req, res) => {
    try {
        const today = new Date().toDateString();
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
        
        res.json({ message: 'Kunlik limitlar yangilandi' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const queue = [];
const activeDuels = new Map();
const onlineUsers = new Map();

// ==================== YORDAMCHI FUNKSIYALAR ====================
async function findOpponentFor(userId) {
    const user = await User.findOne({ userId });
    if (!user || !user.hasSelectedGender || !user.gender) return null;
    
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = await User.findOne({ userId: opponentId });
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

// ==================== MUTUAL SUPER LIKE FUNKSIYALARI ====================
async function addMutualMatch(userId1, userId2) {
    try {
        // Tekshirish: allaqachon do'st bo'lishganmi?
        const existingMatch = await MutualMatch.findOne({
            $or: [
                { user1Id: userId1, user2Id: userId2 },
                { user1Id: userId2, user2Id: userId1 }
            ]
        });
        
        if (existingMatch) {
            console.log(`ℹ️ ${userId1} va ${userId2} allaqachon do'st`);
            return;
        }
        
        // Yangi mutual match yaratish
        const mutualMatch = new MutualMatch({
            user1Id: userId1,
            user2Id: userId2,
            isSuperLike: true
        });
        await mutualMatch.save();
        
        // Foydalanuvchilarni yangilash
        await User.updateOne(
            { userId: userId1 },
            { 
                $inc: { 
                    mutualMatchesCount: 1,
                    friendsCount: 1 
                },
                $set: { updatedAt: new Date() }
            }
        );
        
        await User.updateOne(
            { userId: userId2 },
            { 
                $inc: { 
                    mutualMatchesCount: 1,
                    friendsCount: 1 
                },
                $set: { updatedAt: new Date() }
            }
        );
        
        console.log(`💖 O'ZARO SUPER LIKE: ${userId1} <-> ${userId2} do'st bo'lishdi`);
        
        // Notification yuborish
        notifyMutualMatchAdded(userId1, userId2);
        notifyMutualMatchAdded(userId2, userId1);
        
    } catch (error) {
        console.error('Mutual match qo\'shishda xato:', error);
    }
}

async function notifyMutualMatchAdded(userId, friendId) {
    try {
        const friend = await User.findOne({ userId: friendId });
        const userSocketId = onlineUsers.get(userId);
        
        if (friend && userSocketId) {
            const socket = io.sockets.sockets.get(userSocketId);
            if (socket) {
                socket.emit('mutual_match', {
                    partnerName: friend.firstName,
                    message: `${friend.firstName} bilan o'zaro SUPER LIKE! Endi siz do'st bo'ldingiz.`
                });
            }
        }
    } catch (error) {
        console.error('Notification yuborishda xato:', error);
    }
}

async function getMutualMatches(userId) {
    try {
        const matches = await MutualMatch.find({
            $or: [
                { user1Id: userId },
                { user2Id: userId }
            ]
        });
        
        return matches.map(match => 
            match.user1Id === userId ? match.user2Id : match.user1Id
        );
    } catch (error) {
        console.error('Mutual matches olishda xato:', error);
        return [];
    }
}

// ==================== DUEL FUNKSIYALARI ====================
function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function startDuel(player1Id, player2Id) {
    try {
        const player1 = await User.findOne({ userId: player1Id });
        const player2 = await User.findOne({ userId: player2Id });
        
        if (!player1 || !player2) {
            console.error('Foydalanuvchilar topilmadi');
            return;
        }
        
        const duelId = generateDuelId();
        
        // Duelni MongoDB ga saqlash
        const duel = new Duel({
            duelId,
            player1Id,
            player2Id,
            startTime: new Date()
        });
        await duel.save();
        
        // Active duels ga qo'shish
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
        
        const player1 = await User.findOne({ userId: duelData.player1 });
        const player2 = await User.findOne({ userId: duelData.player2 });
        
        if (!player1 || !player2) return;
        
        const player1Liked = player1Vote === 'like' || player1Vote === 'super_like';
        const player2Liked = player2Vote === 'like' || player2Vote === 'super_like';
        
        const player1SuperLike = player1Vote === 'super_like';
        const player2SuperLike = player2Vote === 'super_like';
        
        // Duel natijasini yangilash
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
        
        if (player1Liked && player2Liked) {
            // Har ikki tomon like bosdi
            const updatePromises = [];
            
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
            
            // Agar O'ZARO SUPER LIKE bo'lsa
            if (player1SuperLike && player2SuperLike) {
                await addMutualMatch(duelData.player1, duelData.player2);
            }
            
            await Promise.all(updatePromises);
            
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
            await User.updateOne(
                { userId: duelData.player1 },
                { $inc: { duels: 1 }, $set: { updatedAt: new Date() } }
            );
            
            await User.updateOne(
                { userId: duelData.player2 },
                { $inc: { duels: 1 }, $set: { updatedAt: new Date() } }
            );
            
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
        
        // Duelni timeout bilan belgilash
        await Duel.updateOne(
            { duelId },
            {
                $set: {
                    ended: true,
                    resultsSent: true
                }
            }
        );
        
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

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', async (socket) => {
    console.log('✅ Yangi ulanish:', socket.id);
    
    socket.on('auth', async (data) => {
        try {
            const userId = data.userId;
            
            // Foydalanuvchini topish yoki yaratish
            let user = await User.findOne({ userId });
            
            if (!user) {
                // Yangi foydalanuvchi yaratish
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
            } else {
                // Mavjud foydalanuvchini yangilash
                user.firstName = data.firstName || user.firstName;
                user.username = data.username || user.username;
                user.photoUrl = data.photoUrl || user.photoUrl;
                if (data.gender) user.gender = data.gender;
                if (data.hasSelectedGender !== undefined) user.hasSelectedGender = data.hasSelectedGender;
                if (data.bio !== undefined) user.bio = data.bio;
                if (data.filter !== undefined) user.filter = data.filter;
            }
            
            // Kunlik limitlarni yangilash
            const today = new Date().toDateString();
            if (user.lastResetDate !== today) {
                user.dailySuperLikes = 3;
                user.dailySuperLikesUsed = 0;
                user.lastResetDate = today;
            }
            
            // Online holatini yangilash
            user.socketId = socket.id;
            user.connected = true;
            user.lastActive = new Date();
            user.updatedAt = new Date();
            
            await user.save();
            
            // Online users ro'yxatiga qo'shish
            onlineUsers.set(userId, socket.id);
            socket.userId = userId;
            
            // Mutual matches sonini yangilash
            const mutualMatches = await getMutualMatches(userId);
            user.mutualMatchesCount = mutualMatches.length;
            user.friendsCount = mutualMatches.length;
            await user.save();
            
            // Clientga ma'lumot yuborish
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
            
            // Agar gender tanlangan bo'lsa, navbatga qo'shish
            if (user.hasSelectedGender) {
                if (!queue.includes(userId)) {
                    queue.push(userId);
                    updateWaitingCount();
                }
            } else {
                setTimeout(() => {
                    socket.emit('show_gender_selection', {
                        mandatory: true,
                        message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                    });
                }, 500);
            }
            
            // Duel qidirish
            if (user.hasSelectedGender) {
                setTimeout(() => findAndStartDuels(), 1000);
            }
            
        } catch (error) {
            console.error('Auth xatosi:', error);
            socket.emit('error', { message: 'Server xatosi' });
        }
    });
    
    socket.on('select_gender', async (data) => {
        try {
            const userId = socket.userId;
            const gender = data.gender;
            
            if (!userId) return;
            
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
            
            socket.emit('gender_selected', {
                gender: gender,
                hasSelectedGender: true,
                message: `Gender tanlandi!`
            });
            
            // Navbatga qo'shish
            if (!queue.includes(userId)) {
                queue.push(userId);
                updateWaitingCount();
            }
            
            setTimeout(() => findAndStartDuels(), 500);
            
        } catch (error) {
            console.error('Gender tanlash xatosi:', error);
        }
    });
    
    socket.on('enter_queue', async () => {
        try {
            const userId = socket.userId;
            if (!userId) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }
            
            const user = await User.findOne({ userId });
            if (!user || !user.hasSelectedGender) {
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
    
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            updateWaitingCount();
        }
    });
    
    socket.on('vote', async (data) => {
        try {
            const userId = socket.userId;
            const { duelId, choice } = data;
            
            if (!userId) return;
            
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
                const user = await User.findOne({ userId });
                if (user.dailySuperLikes <= 0) {
                    socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                    return;
                }
                
                // SUPER LIKE ni kamaytirish
                await User.updateOne(
                    { userId },
                    {
                        $inc: { dailySuperLikes: -1 },
                        $set: { updatedAt: new Date() }
                    }
                );
                
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
    
    socket.on('update_profile', async (data) => {
        try {
            const userId = socket.userId;
            if (!userId) return;
            
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
            
            socket.emit('profile_updated', {
                bio: data.bio,
                gender: data.gender,
                filter: data.filter
            });
            
        } catch (error) {
            console.error('Profil yangilash xatosi:', error);
        }
    });
    
    socket.on('get_friends_list', async () => {
        try {
            const userId = socket.userId;
            if (!userId) return;
            
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
            }).select('userId firstName username photoUrl rating matches');
            
            const friendsList = friends.map(friend => ({
                id: friend.userId,
                name: friend.firstName,
                username: friend.username,
                photo: friend.photoUrl,
                online: onlineUsers.has(friend.userId),
                lastActive: friend.lastActive,
                rating: friend.rating,
                matches: friend.matches,
                isMutual: true
            }));
            
            socket.emit('friends_list', {
                friends: friendsList,
                total: friendsList.length,
                online: friendsList.filter(f => f.online).length
            });
            
        } catch (error) {
            console.error('Do\'stlar ro\'yxatini olish xatosi:', error);
        }
    });
    
    socket.on('disconnect', async () => {
        try {
            const userId = socket.userId;
            
            if (userId) {
                // Online users ro'yxatidan o'chirish
                onlineUsers.delete(userId);
                
                // Navbatdan chiqarish
                const index = queue.indexOf(userId);
                if (index > -1) {
                    queue.splice(index, 1);
                    updateWaitingCount();
                }
                
                // Foydalanuvchi holatini yangilash
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

// ==================== KUNLIK LIMITLARNI YANGILASH ====================
setInterval(async () => {
    try {
        const today = new Date().toDateString();
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
        
        console.log('🔄 Kunlik limitlar yangilandi');
    } catch (error) {
        console.error('Kunlik limitlarni yangilash xatosi:', error);
    }
}, 60000); // Har 1 daqiqa

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

mongoose.connection.once('open', () => {
    console.log('✅ MongoDB ga ulandi');
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 LIKE DUEL SERVER - REAL DATABASE TIZIMI');
        console.log('='.repeat(70));
        console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
        console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
        console.log('🗄️  Database: MongoDB');
        console.log('='.repeat(70));
        console.log('✅ Barcha ma\'lumotlar doimiy saqlanadi');
        console.log('✅ Reyting, coin, limitlar saqlanib qoladi');
        console.log('✅ Do\'stlar ro\'yxati serverda saqlanadi');
        console.log('✅ Kunlik limitlar avtomatik yangilanadi');
        console.log('='.repeat(70));
    });
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB ulanish xatosi:', err);
    
    // Agar MongoDB bo'lmasa ham server ishlashi uchun
    server.listen(PORT, '0.0.0.0', () => {
        console.log('⚠️ MongoDB ga ulanilmadi, lekin server ishga tushdi');
        console.log(`📍 Server: http://0.0.0.0:${PORT}`);
    });
});