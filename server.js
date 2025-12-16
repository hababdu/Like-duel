// server.js - Render.com uchun FINAL VERSIYA
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// ==================== MUHIM: Socket.IO sozlamalari ====================
const io = new Server(server, {
    cors: {
        origin: "*", // Barcha domainlarga ruxsat berish
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'], // Ikkala transport ham
    allowEIO3: true, // Eski versiyalar uchun
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 daqiqa
        skipMiddlewares: true
    }
});

// ==================== STATIC FAYLLAR ====================
app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== API ENDPOINTLAR ====================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        message: 'Like Duel Server is running',
        timestamp: new Date().toISOString(),
        platform: 'Render.com',
        websocket: 'Active',
        users: Object.keys(users).length,
        queue: queue.length,
        activeDuels: Object.keys(activeDuels).length
    });
});

app.get('/api/debug', (req, res) => {
    const queueDetails = queue.map(id => ({
        id: id,
        name: users[id]?.firstName || 'Noma\'lum',
        gender: users[id]?.gender || 'none',
        hasGender: users[id]?.hasSelectedGender || false
    }));
    
    res.json({
        server: 'like-duel.onrender.com',
        port: process.env.PORT || 3000,
        totalUsers: Object.keys(users).length,
        usersWithGender: Object.values(users).filter(u => u.hasSelectedGender).length,
        usersWithoutGender: Object.values(users).filter(u => !u.hasSelectedGender).length,
        queueCount: queue.length,
        queue: queueDetails,
        activeDuels: Object.keys(activeDuels).length,
        socketConnections: io.engine.clientsCount
    });
});

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const users = {};
const queue = [];
const activeDuels = {};

// ==================== GENDER FILTER FUNKSIYASI ====================
function checkGenderCompatibility(user1, user2) {
    if (!user1?.gender || !user2?.gender) return false;
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

// ==================== OPPONENT QIDIRISH ====================
function findOpponentFor(userId) {
    const user = users[userId];
    if (!user || !user.hasSelectedGender || !user.gender) {
        console.log(`❌ ${userId} uchun opponent topilmaydi: gender tanlanmagan`);
        return null;
    }
    
    console.log(`🔍 ${user.firstName} (${user.gender}) uchun opponent qidirilmoqda...`);
    
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent) continue;
        
        // Opponent ham gender tanlagan bo'lishi kerak
        if (!opponent.hasSelectedGender || !opponent.gender) {
            console.log(`⚠️ ${opponentId} gender tanlamagan, o'tkazib yuborildi`);
            continue;
        }
        
        // Gender mos kelishini tekshirish
        if (checkGenderCompatibility(user, opponent)) {
            console.log(`✅ JUFT TOPILDI: ${user.firstName} (${user.gender}) + ${opponent.firstName} (${opponent.gender})`);
            return opponentId;
        } else {
            console.log(`❌ Gender mos emas: ${user.gender} vs ${opponent.gender}`);
        }
    }
    
    console.log(`❌ ${user.firstName} uchun mos opponent topilmadi`);
    return null;
}

// ==================== DUEL QIDIRISH ====================
function findAndStartDuels() {
    console.log(`\n🔄 DUEL QIDIRISH (Navbatda: ${queue.length} ta)`);
    
    // Queue'dan nusxa olish
    const queueCopy = [...queue];
    
    for (let i = 0; i < queueCopy.length; i++) {
        const userId = queueCopy[i];
        
        // Foydalanuvchi hali queue'da bo'lsa
        if (queue.includes(userId)) {
            const opponentId = findOpponentFor(userId);
            
            if (opponentId) {
                // Queue'dan olib tashlash
                const userIndex = queue.indexOf(userId);
                const opponentIndex = queue.indexOf(opponentId);
                
                if (userIndex > -1) queue.splice(userIndex, 1);
                if (opponentIndex > -1) queue.splice(opponentIndex, 1);
                
                // Duelni boshlash
                startDuel(userId, opponentId);
                console.log(`🎮 DUEL BOSHLANDI: ${users[userId].firstName} vs ${users[opponentId].firstName}`);
                
                // Bir juft topib, davom etish
                return true;
            }
        }
    }
    
    // Agar juft topilmasa
    console.log(`⚠️ Hozircha mos juft topilmadi. Navbatda: ${queue.length} ta`);
    return false;
}

// ==================== DUEL BOSHLASH ====================
function startDuel(player1Id, player2Id) {
    const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    
    console.log(`\n⚔️ DUEL BOSHLANDI: ${duelId}`);
    console.log(`   👤 ${player1.firstName} (${player1.gender})`);
    console.log(`   vs`);
    console.log(`   👤 ${player2.firstName} (${player2.gender})`);
    
    // Player1 ga ma'lumot yuborish
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
    
    // Player2 ga ma'lumot yuborish
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

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
    console.log('✅ Yangi WebSocket ulanishi:', socket.id);
    
    socket.on('auth', (data) => {
        const userId = data.userId;
        console.log(`🔐 Auth: ${userId} - ${data.firstName}`);
        
        // Foydalanuvchini yaratish yoki yangilash
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
        
        console.log(`📊 ${userId} gender holati: ${users[userId].hasSelectedGender ? `Tanlangan (${users[userId].gender})` : 'Tanlanmagan'}`);
        
        // Agar gender tanlanmagan bo'lsa, bildirishnoma
        if (!users[userId].hasSelectedGender) {
            console.log(`⚠️ ${userId} gender tanlamagan, modal ko'rsatish`);
            setTimeout(() => {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                });
            }, 500);
        } else {
            // Agar gender tanlagan bo'lsa, navbatga qo'shish
            if (!queue.includes(userId)) {
                queue.push(userId);
                console.log(`✅ ${userId} navbatga qo'shildi`);
            }
        }
        
        // Navbat holatini yangilash
        updateWaitingCount();
        
        // Agar gender tanlagan bo'lsa, duel qidirish
        if (users[userId].hasSelectedGender) {
            setTimeout(() => findAndStartDuels(), 1000);
        }
    });
    
    socket.on('select_gender', (data) => {
        const userId = socket.userId;
        const gender = data.gender;
        
        console.log(`\n🎯 GENDER TANLASH: ${userId} -> ${gender}`);
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
            return;
        }
        
        // Gender ni saqlash
        users[userId].gender = gender;
        users[userId].hasSelectedGender = true;
        
        console.log(`✅ ${users[userId].firstName} gender tanladi: ${gender}`);
        
        // Clientga gender tanlanganini bildirish
        socket.emit('gender_selected', {
            gender: gender,
            hasSelectedGender: true,
            message: `Gender tanlandi! ${
                gender === 'male' ? 'Faqat ayollar bilan duel' :
                gender === 'female' ? 'Faqat erkaklar bilan duel' :
                'Hamma bilan duel'
            }`
        });
        
        // Navbatga qo'shish (agar yo'q bo'lsa)
        if (!queue.includes(userId)) {
            queue.push(userId);
            console.log(`✅ ${userId} navbatga qo'shildi`);
        }
        
        // Navbat holatini yangilash
        updateWaitingCount();
        
        // Duel qidirishni boshlash
        setTimeout(() => {
            findAndStartDuels();
        }, 1000);
    });
    
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        console.log(`\n🚀 NAVBATGA KIRISH: ${userId}`);
        
        // MAJBURIY TEKSHIRISH: Gender tanlanmagan bo'lsa
        if (!users[userId].hasSelectedGender) {
            console.log(`❌ ${userId} navbatga kira olmaydi - gender tanlanmagan!`);
            socket.emit('show_gender_selection', {
                mandatory: true,
                message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
            });
            return;
        }
        
        // Agar allaqachon navbatda bo'lsa
        if (queue.includes(userId)) {
            console.log(`ℹ️ ${userId} allaqachon navbatda`);
            socket.emit('queue_joined', {
                position: queue.indexOf(userId) + 1,
                total: queue.length
            });
            return;
        }
        
        // Navbatga qo'shish
        queue.push(userId);
        console.log(`✅ ${users[userId].firstName} navbatga qo'shildi. O'rni: ${queue.length}`);
        
        // Navbat holatini yangilash
        updateWaitingCount();
        
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
            console.log(`🚪 ${userId} navbatdan chiqdi`);
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
        console.log(`🗳️ ${users[userId].firstName} ovoz berdi: ${choice}`);
        
        // SUPER LIKE uchun limit tekshirish
        if (choice === 'super_like') {
            const user = users[userId];
            if (user.dailySuperLikes <= 0) {
                socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                delete duel.votes[userId];
                return;
            }
            user.dailySuperLikes--;
            
            // Clientga super like sonini yangilash
            socket.emit('super_like_used', {
                remaining: user.dailySuperLikes
            });
        }
        
        // Agar ikkala o'yinchi ham ovoz berganda
        if (duel.votes[duel.player1] && duel.votes[duel.player2]) {
            processDuelResult(duelId);
        }
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
                console.log(`🔌 ${userId} navbatdan chiqdi (disconnect)`);
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
        
        console.log('❌ WebSocket ulanishi uzildi:', socket.id);
    });
    
    // ==================== YORDAMCHI FUNKSIYALAR ====================
    function updateWaitingCount() {
        const count = queue.length;
        console.log(`📊 Navbat holati: ${count} ta foydalanuvchi`);
        
        // Har bir navbatdagiga o'z pozitsiyasini yuborish
        queue.forEach((userId, index) => {
            const userSocket = io.sockets.sockets.get(users[userId]?.socketId);
            if (userSocket) {
                userSocket.emit('waiting_count', {
                    count: count,
                    position: index + 1,
                    estimatedTime: (index + 1) * 10
                });
            }
        });
    }
    
    function processDuelResult(duelId) {
        const duel = activeDuels[duelId];
        if (!duel || duel.ended) return;
        
        duel.ended = true;
        
        const player1Vote = duel.votes[duel.player1];
        const player2Vote = duel.votes[duel.player2];
        
        const player1 = users[duel.player1];
        const player2 = users[duel.player2];
        
        console.log(`\n🏁 DUEL NATIJASI: ${duelId}`);
        console.log(`   ${player1.firstName}: ${player1Vote}`);
        console.log(`   ${player2.firstName}: ${player2Vote}`);
        
        // MATCH holati (ikkalasi ham like yoki super like bergan)
        if ((player1Vote === 'like' || player1Vote === 'super_like') && 
            (player2Vote === 'like' || player2Vote === 'super_like')) {
            
            console.log(`🎉 MATCH! ${player1.firstName} & ${player2.firstName}`);
            
            // Statistikani yangilash
            player1.matches++;
            player2.matches++;
            player1.wins++;
            player2.wins++;
            
            // Mukofotlar
            const baseCoins = 50;
            const baseXP = 30;
            
            player1.coins += baseCoins;
            player2.coins += baseCoins;
            player1.xp += baseXP;
            player2.xp += baseXP;
            
            // SUPER LIKE bonus
            if (player1Vote === 'super_like') {
                player1.coins += 20;
                player1.xp += 15;
            }
            if (player2Vote === 'super_like') {
                player2.coins += 20;
                player2.xp += 15;
            }
            
            // Level tekshirish
            const neededXP1 = player1.level * 100;
            if (player1.xp >= neededXP1) {
                player1.level++;
                player1.xp -= neededXP1;
            }
            
            const neededXP2 = player2.level * 100;
            if (player2.xp >= neededXP2) {
                player2.level++;
                player2.xp -= neededXP2;
            }
            
            // Player1 ga match haqida xabar
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
                        coins: player1Vote === 'super_like' ? baseCoins + 20 : baseCoins,
                        xp: player1Vote === 'super_like' ? baseXP + 15 : baseXP
                    },
                    newRating: player1.rating,
                    isRematch: false,
                    mutualLike: true
                });
            }
            
            // Player2 ga match haqida xabar
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
                        coins: player2Vote === 'super_like' ? baseCoins + 20 : baseCoins,
                        xp: player2Vote === 'super_like' ? baseXP + 15 : baseXP
                    },
                    newRating: player2.rating,
                    isRematch: false,
                    mutualLike: true
                });
            }
            
        } else if (player1Vote === 'like' || player1Vote === 'super_like') {
            // Faqat player1 like berdi
            console.log(`❤️ Faqat ${player1.firstName} like berdi`);
            
            const coins = player1Vote === 'super_like' ? 30 : 10;
            const xp = player1Vote === 'super_like' ? 15 : 5;
            
            player1.coins += coins;
            player1.xp += xp;
            
            const player1Socket = io.sockets.sockets.get(player1.socketId);
            if (player1Socket) {
                player1Socket.emit('liked_only', {
                    opponentName: player2.firstName,
                    reward: { coins, xp }
                });
            }
            
            const player2Socket = io.sockets.sockets.get(player2.socketId);
            if (player2Socket) {
                player2Socket.emit('no_match');
            }
            
        } else if (player2Vote === 'like' || player2Vote === 'super_like') {
            // Faqat player2 like berdi
            console.log(`❤️ Faqat ${player2.firstName} like berdi`);
            
            const coins = player2Vote === 'super_like' ? 30 : 10;
            const xp = player2Vote === 'super_like' ? 15 : 5;
            
            player2.coins += coins;
            player2.xp += xp;
            
            const player2Socket = io.sockets.sockets.get(player2.socketId);
            if (player2Socket) {
                player2Socket.emit('liked_only', {
                    opponentName: player1.firstName,
                    reward: { coins, xp }
                });
            }
            
            const player1Socket = io.sockets.sockets.get(player1.socketId);
            if (player1Socket) {
                player1Socket.emit('no_match');
            }
            
        } else {
            // Hech kim like bermadi
            console.log(`❌ Hech kim like bermadi`);
            
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
        console.log(`⏰ Duel vaqti tugadi: ${duelId}`);
        
        const player1Socket = io.sockets.sockets.get(users[duel.player1]?.socketId);
        const player2Socket = io.sockets.sockets.get(users[duel.player2]?.socketId);
        
        if (player1Socket) player1Socket.emit('timeout');
        if (player2Socket) player2Socket.emit('timeout');
        
        // 2 soniyadan keyin navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duel.player1, duel.player2);
            delete activeDuels[duelId];
        }, 2000);
    }
    
    function returnPlayersToQueue(player1Id, player2Id) {
        console.log(`\n🔄 Navbatga qaytarish: ${player1Id}, ${player2Id}`);
        
        [player1Id, player2Id].forEach(playerId => {
            const player = users[playerId];
            if (player && player.hasSelectedGender && player.connected) {
                if (!queue.includes(playerId)) {
                    queue.push(playerId);
                    console.log(`✅ ${player.firstName} navbatga qayta qo'shildi`);
                    
                    const playerSocket = io.sockets.sockets.get(player.socketId);
                    if (playerSocket) {
                        playerSocket.emit('return_to_queue');
                    }
                }
            }
        });
        
        // Navbat holatini yangilash
        updateWaitingCount();
        
        // Yangi duel qidirish
        setTimeout(() => findAndStartDuels(), 1000);
    }
});

// ==================== SERVER ISHGA TUSHIRISH ====================
// Render.com PORT ni o'zi belgilaydi
const PORT = process.env.PORT || 3000;

// MUHIM: app.listen EMAS, server.listen ishlatish kerak
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - FINAL RENDER.COM VERSION');
    console.log('='.repeat(70));
    console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🔍 Debug: http://0.0.0.0:${PORT}/api/debug`);
    console.log('🌐 WebSocket URL: wss://like-duel.onrender.com');
    console.log('='.repeat(70));
    console.log('✅ Render.com uchun to\'liq optimallashtirildi');
    console.log('✅ WebSocket connection ishlaydi');
    console.log('✅ CORS: * (barcha domainlar)');
    console.log('='.repeat(70));
});

// Har 10 soniyada duel qidirish
setInterval(() => {
    if (queue.length >= 2) {
        findAndStartDuels();
    }
}, 10000);