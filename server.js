// server.js - Render.com uchun maxsus optimallashtirilgan
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app); // MUHIM: http server yaratish
const io = new Server(server, { // MUHIM: io'ni serverga ulash
    cors: {
        origin: ["https://like-duel.onrender.com", "http://localhost:3000", "http://localhost:5500", "http://127.0.0.1:5500"],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// ==================== CORS SOZLAMALARI ====================
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
        message: 'Like Duel Server is running on Render',
        timestamp: new Date().toISOString(),
        platform: 'Render.com',
        websocket: 'Active',
        users: Object.keys(users).length,
        queue: queue.length,
        activeDuels: Object.keys(activeDuels).length
    });
});

app.get('/api/stats', (req, res) => {
    const totalUsers = Object.keys(users).length;
    const usersWithGender = Object.values(users).filter(u => u.hasSelectedGender).length;
    const maleUsers = Object.values(users).filter(u => u.gender === 'male').length;
    const femaleUsers = Object.values(users).filter(u => u.gender === 'female').length;
    
    res.json({
        status: 'online',
        server: 'Render.com',
        totalUsers,
        usersWithGender,
        usersWithoutGender: totalUsers - usersWithGender,
        genderStats: {
            male: maleUsers,
            female: femaleUsers,
            all: Object.values(users).filter(u => u.gender === 'not_specified').length
        },
        waitingQueue: queue.length,
        activeDuels: Object.keys(activeDuels).length
    });
});

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const users = {};
const queue = [];
const activeDuels = {};
const mutualLikes = {};

// ==================== YORDAMCHI FUNKSIYALAR ====================
function calculateRatingChange(playerRating, opponentRating, result) {
    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    
    if (result === 'win') return Math.round(K * (1 - expected));
    if (result === 'loss') return Math.round(K * (0 - expected));
    return 0;
}

function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function checkGenderCompatibility(user1, user2) {
    if (!user1?.gender || !user2?.gender) return false;
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

function findOpponentFor(userId) {
    const user = users[userId];
    if (!user || !user.hasSelectedGender || !user.gender) return null;
    
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent) continue;
        
        if (!opponent.hasSelectedGender || !opponent.gender) continue;
        
        if (checkGenderCompatibility(user, opponent)) {
            return opponentId;
        }
    }
    
    return null;
}

function updateWaitingCount() {
    const count = queue.length;
    
    queue.forEach((userId, index) => {
        const user = users[userId];
        if (user && user.socketId) {
            const socket = io.sockets.sockets.get(user.socketId);
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

// ==================== DUEL QIDIRISH VA BOSHLASH ====================
function findAndStartDuels() {
    if (queue.length < 2) return;
    
    for (let i = 0; i < queue.length; i++) {
        const userId = queue[i];
        const opponentId = findOpponentFor(userId);
        
        if (opponentId) {
            const userIndex = queue.indexOf(userId);
            const opponentIndex = queue.indexOf(opponentId);
            
            if (userIndex > -1) queue.splice(userIndex, 1);
            if (opponentIndex > -1) queue.splice(opponentIndex, 1);
            
            startDuel(userId, opponentId);
            updateWaitingCount();
            break;
        }
    }
}

function startDuel(player1Id, player2Id) {
    const duelId = generateDuelId();
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    activeDuels[duelId] = {
        id: duelId,
        player1: player1Id,
        player2: player2Id,
        votes: {},
        startTime: new Date(),
        ended: false
    };
    
    // Player1 ga ma'lumot
    const player1Socket = io.sockets.sockets.get(player1.socketId);
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
    
    // Player2 ga ma'lumot
    const player2Socket = io.sockets.sockets.get(player2.socketId);
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
    
    // 20 soniya timer
    setTimeout(() => {
        if (activeDuels[duelId] && !activeDuels[duelId].ended) {
            handleDuelTimeout(duelId);
        }
    }, 20000);
}

function processDuelResult(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    
    const player1Vote = duel.votes[duel.player1];
    const player2Vote = duel.votes[duel.player2];
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    // MATCH holati
    if ((player1Vote === 'like' || player1Vote === 'super_like') && 
        (player2Vote === 'like' || player2Vote === 'super_like')) {
        
        player1.matches++;
        player2.matches++;
        player1.coins += 50;
        player2.coins += 50;
        
        // SUPER LIKE bonus
        if (player1Vote === 'super_like') {
            player1.coins += 20;
        }
        if (player2Vote === 'super_like') {
            player2.coins += 20;
        }
        
        // Player1 ga xabar
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('match', {
                partner: {
                    id: duel.player2,
                    name: player2.firstName,
                    photo: player2.photoUrl,
                    gender: player2.gender
                },
                rewards: {
                    coins: player1Vote === 'super_like' ? 70 : 50,
                    xp: 30
                },
                newRating: player1.rating,
                isRematch: false
            });
        }
        
        // Player2 ga xabar
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('match', {
                partner: {
                    id: duel.player1,
                    name: player1.firstName,
                    photo: player1.photoUrl,
                    gender: player1.gender
                },
                rewards: {
                    coins: player2Vote === 'super_like' ? 70 : 50,
                    xp: 30
                },
                newRating: player2.rating,
                isRematch: false
            });
        }
        
    } else if (player1Vote === 'like' || player1Vote === 'super_like') {
        // Faqat player1 like berdi
        const coins = player1Vote === 'super_like' ? 30 : 10;
        player1.coins += coins;
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('liked_only', {
                opponentName: player2.firstName,
                reward: { coins: coins, xp: 5 }
            });
        }
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('no_match');
        }
        
    } else if (player2Vote === 'like' || player2Vote === 'super_like') {
        // Faqat player2 like berdi
        const coins = player2Vote === 'super_like' ? 30 : 10;
        player2.coins += coins;
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('liked_only', {
                opponentName: player1.firstName,
                reward: { coins: coins, xp: 5 }
            });
        }
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('no_match');
        }
        
    } else {
        // Hech kim like bermadi
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) player1Socket.emit('no_match');
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) player2Socket.emit('no_match');
    }
    
    // 3 soniyadan keyin navbatga qaytarish
    setTimeout(() => {
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
    }, 3000);
}

function handleDuelTimeout(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    
    const player1Socket = io.sockets.sockets.get(users[duel.player1]?.socketId);
    const player2Socket = io.sockets.sockets.get(users[duel.player2]?.socketId);
    
    if (player1Socket) player1Socket.emit('timeout');
    if (player2Socket) player2Socket.emit('timeout');
    
    setTimeout(() => {
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
    }, 2000);
}

function returnPlayersToQueue(player1Id, player2Id) {
    [player1Id, player2Id].forEach(playerId => {
        const player = users[playerId];
        if (player && player.hasSelectedGender && !queue.includes(playerId)) {
            queue.push(playerId);
            
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
                playerSocket.emit('return_to_queue');
            }
        }
    });
    
    updateWaitingCount();
    setTimeout(findAndStartDuels, 1000);
}

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
    console.log('✅ Yangi ulanish:', socket.id);
    
    socket.on('auth', (data) => {
        const userId = data.userId;
        
        // Foydalanuvchini saqlash yoki yangilash
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                firstName: data.firstName || 'Foydalanuvchi',
                username: data.username || '',
                photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}&background=667eea&color=fff`,
                gender: data.gender || null,
                hasSelectedGender: data.hasSelectedGender || false,
                rating: 1500,
                coins: 100,
                level: 1,
                xp: 0,
                matches: 0,
                duels: 0,
                wins: 0,
                totalLikes: 0,
                dailySuperLikes: 3,
                bio: '',
                socketId: socket.id,
                connected: true,
                lastActive: new Date()
            };
        } else {
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = new Date();
        }
        
        socket.userId = userId;
        
        // Clientga ma'lumot yuborish
        socket.emit('auth_ok', {
            ...users[userId],
            winRate: users[userId].duels > 0 ? 
                Math.round((users[userId].wins / users[userId].duels) * 100) : 0
        });
        
        // Agar gender tanlangan bo'lsa, navbatga qo'shish
        if (users[userId].hasSelectedGender) {
            if (!queue.includes(userId)) {
                queue.push(userId);
            }
        } else {
            // Gender tanlanmagan bo'lsa, bildirishnoma
            setTimeout(() => {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                });
            }, 500);
        }
        
        updateWaitingCount();
        
        // Agar gender tanlagan bo'lsa, duel qidirish
        if (users[userId].hasSelectedGender) {
            setTimeout(() => findAndStartDuels(), 1000);
        }
    });
    
    socket.on('select_gender', (data) => {
        const userId = socket.userId;
        const gender = data.gender;
        
        if (!userId || !users[userId]) return;
        
        users[userId].gender = gender;
        users[userId].hasSelectedGender = true;
        
        socket.emit('gender_selected', {
            gender: gender,
            hasSelectedGender: true,
            message: `Gender tanlandi! ${
                gender === 'male' ? 'Faqat ayollar bilan duel' :
                gender === 'female' ? 'Faqat erkaklar bilan duel' :
                'Hamma bilan duel'
            }`
        });
        
        // Navbatga qo'shish
        if (!queue.includes(userId)) {
            queue.push(userId);
        }
        
        updateWaitingCount();
        setTimeout(() => findAndStartDuels(), 500);
    });
    
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        // MAJBURIY TEKSHIRISH: Gender tanlanmagan bo'lsa
        if (!users[userId].hasSelectedGender) {
            socket.emit('show_gender_selection', {
                mandatory: true,
                message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
            });
            return;
        }
        
        // Agar allaqachon navbatda bo'lsa
        if (queue.includes(userId)) {
            socket.emit('queue_joined', {
                position: queue.indexOf(userId) + 1,
                total: queue.length
            });
            return;
        }
        
        // Navbatga qo'shish
        queue.push(userId);
        
        socket.emit('queue_joined', {
            position: queue.length,
            total: queue.length
        });
        
        // Duel qidirish
        setTimeout(() => findAndStartDuels(), 500);
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
    
    socket.on('vote', (data) => {
        const userId = socket.userId;
        const { duelId, choice } = data;
        
        if (!activeDuels[duelId] || activeDuels[duelId].ended) {
            socket.emit('error', { message: 'Bu duel tugagan' });
            return;
        }
        
        const duel = activeDuels[duelId];
        if (duel.player1 !== userId && duel.player2 !== userId) {
            socket.emit('error', { message: 'Siz bu duelda emassiz' });
            return;
        }
        
        // Ovozni saqlash
        duel.votes[userId] = choice;
        
        // SUPER LIKE uchun limit tekshirish
        if (choice === 'super_like') {
            const user = users[userId];
            if (user.dailySuperLikes <= 0) {
                socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                delete duel.votes[userId];
                return;
            }
            user.dailySuperLikes--;
            
            socket.emit('super_like_used', {
                remaining: user.dailySuperLikes
            });
        }
        
        // Agar ikkala o'yinchi ham ovoz berganda
        if (duel.votes[duel.player1] && duel.votes[duel.player2]) {
            processDuelResult(duelId);
        }
    });
    
    socket.on('update_profile', (data) => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        const user = users[userId];
        
        if (data.bio !== undefined) {
            user.bio = data.bio;
        }
        
        if (data.gender !== undefined) {
            const oldGender = user.gender;
            user.gender = data.gender;
            
            // Navbatdan chiqarish va qayta qo'shish (gender o'zgarganda)
            const index = queue.indexOf(userId);
            if (index > -1) queue.splice(index, 1);
            
            setTimeout(() => {
                if (!queue.includes(userId) && user.hasSelectedGender) {
                    queue.push(userId);
                    updateWaitingCount();
                    findAndStartDuels();
                }
            }, 500);
        }
        
        socket.emit('profile_updated', {
            bio: user.bio,
            gender: user.gender,
            hasSelectedGender: user.hasSelectedGender
        });
    });
    
    socket.on('request_rematch', (data) => {
        const userId = socket.userId;
        const opponentId = data.opponentId;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) return;
        
        const opponentSocket = io.sockets.sockets.get(users[opponentId].socketId);
        if (opponentSocket) {
            opponentSocket.emit('rematch_request', {
                opponentId: userId,
                opponentName: users[userId].firstName,
                opponentPhoto: users[userId].photoUrl
            });
        }
    });
    
    socket.on('accept_rematch', (data) => {
        const userId = socket.userId;
        const opponentId = data.opponentId;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) return;
        
        // Navbatdan olish (agar bo'lsa)
        const userIndex = queue.indexOf(userId);
        const opponentIndex = queue.indexOf(opponentId);
        
        if (userIndex > -1) queue.splice(userIndex, 1);
        if (opponentIndex > -1) queue.splice(opponentIndex, 1);
        
        // Qayta duel boshlash
        startDuel(userId, opponentId);
    });
    
    socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId && users[userId]) {
            users[userId].connected = false;
            users[userId].lastActive = new Date();
            
            // Navbatdan olish
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                updateWaitingCount();
            }
            
            // Faol duelda bo'lsa
            for (const duelId in activeDuels) {
                const duel = activeDuels[duelId];
                if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
                    duel.ended = true;
                    
                    const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
                    const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('opponent_left');
                        returnPlayersToQueue(opponentId, null);
                    }
                    
                    delete activeDuels[duelId];
                    break;
                }
            }
        }
    });
});

// ==================== SERVER ISHGA TUSHIRISH ====================
// Render.com PORT ni o'zi belgilaydi
const PORT = process.env.PORT || 3000;

// MUHIM: app.listen EMAS, server.listen ishlatish kerak
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - RENDER.COM OPTIMIZATION');
    console.log('='.repeat(70));
    console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log('🌐 WebSocket URL: wss://like-duel.onrender.com');
    console.log('='.repeat(70));
    console.log('✅ Render.com uchun optimallashtirildi');
    console.log('✅ WebSocket connection faol');
    console.log('✅ CORS sozlamalari to\'g\'ri');
    console.log('='.repeat(70));
});

// Kunlik limitlarni yangilash
setInterval(() => {
    const today = new Date().toDateString();
    Object.values(users).forEach(user => {
        if (user.lastResetDate !== today) {
            user.dailySuperLikes = 3;
            user.lastResetDate = today;
            
            const userSocket = io.sockets.sockets.get(user.socketId);
            if (userSocket) {
                userSocket.emit('daily_reset', { superLikes: 3 });
            }
        }
    });
}, 60000);