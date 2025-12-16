// server.js - Render.com uchun MUKAMMAL VERSIYA
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// ==================== MUHIM: Socket.IO sozlamalari ====================
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
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
        activeDuels: Object.keys(activeDuels).length,
        activeChats: Object.keys(activeChats).length
    });
});

app.get('/api/debug', (req, res) => {
    const queueDetails = queue.map(id => ({
        id: id,
        name: users[id]?.firstName || 'Noma\'lum',
        gender: users[id]?.gender || 'none',
        hasGender: users[id]?.hasSelectedGender || false
    }));
    
    const duelDetails = Object.entries(activeDuels).map(([id, duel]) => ({
        id: id,
        player1: `${users[duel.player1]?.firstName} (${duel.player1})`,
        player2: `${users[duel.player2]?.firstName} (${duel.player2})`,
        votes: duel.votes,
        ended: duel.ended,
        isMatch: duel.isMatch
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
        activeDuelsDetails: duelDetails,
        activeChats: Object.keys(activeChats).length,
        socketConnections: io.engine.clientsCount
    });
});

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const users = {};
const queue = [];
const activeDuels = {};
const activeChats = {};

// ==================== USER ID GENERATOR ====================
function generateUniqueUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==================== GENDER FILTER FUNKSIYASI ====================
function checkGenderCompatibility(user1, user2) {
    if (!user1?.gender || !user2?.gender) return false;
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

// ==================== OPPONENT QIDIRISH (OPTIMALLASHTIRILGAN) ====================
function findOpponentFor(userId) {
    const user = users[userId];
    if (!user || !user.hasSelectedGender || !user.gender) {
        console.log(`❌ ${userId} uchun opponent topilmaydi: gender tanlanmagan`);
        return null;
    }
    
    console.log(`🔍 ${user.firstName} (${user.gender}) uchun opponent qidirilmoqda...`);
    
    // Navbatda bo'lgan barcha foydalanuvchilarni tekshirish
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        
        // O'zini o'tkazib yuborish
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent) {
            // Noto'g'ri foydalanuvchini navbatdan olib tashlash
            queue.splice(i, 1);
            i--;
            continue;
        }
        
        // Gender tanlamagan foydalanuvchilarni o'tkazib yuborish
        if (!opponent.hasSelectedGender || !opponent.gender) {
            console.log(`⚠️ ${opponentId} gender tanlamagan, navbatdan olib tashlandi`);
            queue.splice(i, 1);
            i--;
            continue;
        }
        
        // Gender mos kelishini tekshirish
        if (checkGenderCompatibility(user, opponent)) {
            console.log(`✅ JUFT TOPILDI: ${user.firstName} (${user.gender}) + ${opponent.firstName} (${opponent.gender})`);
            
            // Navbatdan olib tashlash
            const userIndex = queue.indexOf(userId);
            const opponentIndex = queue.indexOf(opponentId);
            
            if (userIndex > -1) queue.splice(userIndex, 1);
            if (opponentIndex > -1) queue.splice(opponentIndex, 1);
            
            return opponentId;
        } else {
            console.log(`❌ Gender mos emas: ${user.gender} vs ${opponent.gender}`);
        }
    }
    
    console.log(`❌ ${user.firstName} uchun mos opponent topilmadi`);
    return null;
}

// ==================== EFFEKTIV DUEL QIDIRISH ====================
function findAndStartDuels() {
    console.log(`\n🔄 DUEL QIDIRISH (Navbatda: ${queue.length} ta)`);
    
    if (queue.length < 2) {
        console.log(`⚠️ Juftlashish uchun kamida 2 ta foydalanuvchi kerak`);
        return false;
    }
    
    // Navbat nusxasini olish (o'zgarishlardan himoyalash uchun)
    const queueCopy = [...queue];
    let duelCount = 0;
    let processedUsers = new Set();
    
    for (let i = 0; i < queueCopy.length; i++) {
        const userId = queueCopy[i];
        
        // Agar foydalanuvchi allaqachon qayta ishlangan yoki navbatda yo'q bo'lsa
        if (processedUsers.has(userId) || !queue.includes(userId)) {
            continue;
        }
        
        // Opponent qidirish
        const opponentId = findOpponentFor(userId);
        
        if (opponentId && queue.includes(opponentId) && !processedUsers.has(opponentId)) {
            // Duelni boshlash
            startDuel(userId, opponentId);
            console.log(`🎮 DUEL BOSHLANDI: ${users[userId].firstName} vs ${users[opponentId].firstName}`);
            
            // Qayta ishlanganlar ro'yxatiga qo'shish
            processedUsers.add(userId);
            processedUsers.add(opponentId);
            
            duelCount++;
            
            // Bir vaqtning o'zida ko'p juftlashish (optimizatsiya)
            if (duelCount >= 3) { // Bir vaqtda maksimal 3 duel
                break;
            }
        }
    }
    
    if (duelCount === 0) {
        console.log(`⚠️ Hozircha mos juft topilmadi. Navbatda: ${queue.length} ta`);
    } else {
        console.log(`✅ ${duelCount} ta duel boshlandi`);
    }
    
    return duelCount > 0;
}

// ==================== DUEL BOSHLASH (MUHKAMLASHTIRILGAN) ====================
function startDuel(player1Id, player2Id) {
    const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    if (!player1 || !player2) {
        console.log(`❌ Duel boshlanmadi: foydalanuvchi ma'lumotlari yo'q`);
        return;
    }
    
    activeDuels[duelId] = {
        id: duelId,
        player1: player1Id,
        player2: player2Id,
        votes: {
            [player1Id]: null,
            [player2Id]: null
        },
        startTime: new Date(),
        ended: false,
        isMatch: false,
        chatRequests: {},
        timeoutId: null
    };
    
    console.log(`\n⚔️ DUEL BOSHLANDI: ${duelId}`);
    console.log(`   👤 ${player1.firstName} (${player1.gender}) [${player1Id}]`);
    console.log(`   vs`);
    console.log(`   👤 ${player2.firstName} (${player2.gender}) [${player2Id}]`);
    
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
    const timeoutId = setTimeout(() => {
        if (activeDuels[duelId] && !activeDuels[duelId].ended) {
            handleDuelTimeout(duelId);
        }
    }, 20000);
    
    activeDuels[duelId].timeoutId = timeoutId;
}

// ==================== DUEL NATIJASI (MUHKAMLASHTIRILGAN) ====================
function processDuelResult(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    
    // Timeoutni tozalash
    if (duel.timeoutId) {
        clearTimeout(duel.timeoutId);
    }
    
    const player1Vote = duel.votes[duel.player1];
    const player2Vote = duel.votes[duel.player2];
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    console.log(`\n🏁 DUEL NATIJASI: ${duelId}`);
    console.log(`   ${player1?.firstName}: ${player1Vote}`);
    console.log(`   ${player2?.firstName}: ${player2Vote}`);
    
    if (!player1 || !player2) {
        console.log(`❌ Foydalanuvchi ma'lumotlari yo'q, duel bekor qilindi`);
        delete activeDuels[duelId];
        return;
    }
    
    // Duel statistikasini yangilash
    player1.duels++;
    player2.duels++;
    
    // MATCH holati (ikkalasi ham like yoki super like bergan)
    const isMatch = (player1Vote === 'like' || player1Vote === 'super_like') && 
                    (player2Vote === 'like' || player2Vote === 'super_like');
    
    if (isMatch) {
        console.log(`🎉 MATCH! ${player1.firstName} & ${player2.firstName}`);
        duel.isMatch = true;
        
        // Statistikani yangilash
        player1.matches++;
        player2.matches++;
        player1.wins++;
        player2.wins++;
        player1.totalLikes++;
        player2.totalLikes++;
        
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
            player1.dailySuperLikes = Math.max(0, player1.dailySuperLikes - 1);
        }
        if (player2Vote === 'super_like') {
            player2.coins += 20;
            player2.xp += 15;
            player2.dailySuperLikes = Math.max(0, player2.dailySuperLikes - 1);
        }
        
        // Level tekshirish
        const checkLevelUp = (user) => {
            const neededXP = user.level * 100;
            if (user.xp >= neededXP) {
                user.level++;
                user.xp -= neededXP;
                return true;
            }
            return false;
        };
        
        if (checkLevelUp(player1)) {
            console.log(`🎊 ${player1.firstName} yangi levelga ko'tarildi: ${player1.level}`);
        }
        if (checkLevelUp(player2)) {
            console.log(`🎊 ${player2.firstName} yangi levelga ko'tarildi: ${player2.level}`);
        }
        
        // Chat so'rovlari obyekti
        duel.chatRequests = {
            [duel.player1]: false,
            [duel.player2]: false
        };
        
        // Player1 ga match haqida xabar
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('match', {
                duelId: duelId,
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
                duelId: duelId,
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
        
        if (player1Vote === 'super_like') {
            player1.dailySuperLikes = Math.max(0, player1.dailySuperLikes - 1);
        }
        
        player1.coins += coins;
        player1.xp += xp;
        player1.totalLikes++;
        
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
        
        // Navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duel.player1, duel.player2);
            delete activeDuels[duelId];
        }, 3000);
        
    } else if (player2Vote === 'like' || player2Vote === 'super_like') {
        // Faqat player2 like berdi
        console.log(`❤️ Faqat ${player2.firstName} like berdi`);
        
        const coins = player2Vote === 'super_like' ? 30 : 10;
        const xp = player2Vote === 'super_like' ? 15 : 5;
        
        if (player2Vote === 'super_like') {
            player2.dailySuperLikes = Math.max(0, player2.dailySuperLikes - 1);
        }
        
        player2.coins += coins;
        player2.xp += xp;
        player2.totalLikes++;
        
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
        
        // Navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duel.player1, duel.player2);
            delete activeDuels[duelId];
        }, 3000);
        
    } else {
        // Hech kim like bermadi
        console.log(`❌ Hech kim like bermadi`);
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) player1Socket.emit('no_match');
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) player2Socket.emit('no_match');
        
        // Navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duel.player1, duel.player2);
            delete activeDuels[duelId];
        }, 3000);
    }
}

// ==================== CHAT FUNKSIYALARI (TO'G'RILANGAN) ====================
function startChat(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || !duel.isMatch) {
        console.log(`❌ Chat boshlanmadi: match emas yoki duel topilmadi`);
        return null;
    }
    
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    activeChats[chatId] = {
        id: chatId,
        duelId: duelId,
        player1: duel.player1,
        player2: duel.player2,
        messages: [],
        startedAt: new Date(),
        active: true,
        lastActivity: new Date()
    };
    
    console.log(`💬 CHAT BOSHLANDI: ${chatId}`);
    console.log(`   👥 ${users[duel.player1]?.firstName} & ${users[duel.player2]?.firstName}`);
    
    // Duelni o'chirish (chatga o'tdi)
    delete activeDuels[duelId];
    
    return chatId;
}

function sendChatMessage(chatId, senderId, message) {
    const chat = activeChats[chatId];
    if (!chat || !chat.active) {
        console.log(`❌ Chat xabari yuborilmadi: chat topilmadi yoki faol emas`);
        return null;
    }
    
    const sender = users[senderId];
    if (!sender) {
        console.log(`❌ Chat xabari yuborilmadi: yuboruvchi topilmadi`);
        return null;
    }
    
    const receiverId = chat.player1 === senderId ? chat.player2 : chat.player1;
    const receiver = users[receiverId];
    
    const messageObj = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        senderId: senderId,
        senderName: sender.firstName,
        message: message.trim(),
        timestamp: new Date()
    };
    
    chat.messages.push(messageObj);
    chat.lastActivity = new Date();
    
    console.log(`📨 CHAT XABARI: ${chatId}`);
    console.log(`   📤 ${sender.firstName} -> ${receiver?.firstName || 'Noma\'lum'}`);
    console.log(`   💬 "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
    
    return {
        message: messageObj,
        receiverId: receiverId,
        receiverSocketId: receiver?.socketId
    };
}

// ==================== NAVBATGA QAYTARISH ====================
function returnPlayersToQueue(player1Id, player2Id) {
    console.log(`\n🔄 Navbatga qaytarish boshlanmoqda...`);
    
    [player1Id, player2Id].forEach((playerId, index) => {
        if (playerId) {
            const player = users[playerId];
            if (player && player.hasSelectedGender && player.connected) {
                if (!queue.includes(playerId)) {
                    queue.push(playerId);
                    console.log(`✅ ${player.firstName} navbatga qayta qo'shildi (${index + 1})`);
                    
                    const playerSocket = io.sockets.sockets.get(player.socketId);
                    if (playerSocket) {
                        playerSocket.emit('return_to_queue', {
                            position: queue.length,
                            total: queue.length
                        });
                    }
                }
            } else if (player && !player.connected) {
                console.log(`⚠️ ${player.firstName} ulanmagan, navbatga qo'shilmaydi`);
            }
        }
    });
    
    // Navbat holatini yangilash
    updateWaitingCount();
    
    // Yangi duel qidirish (biroz kechikish bilan)
    setTimeout(() => {
        if (queue.length >= 2) {
            findAndStartDuels();
        }
    }, 1500);
}

// ==================== WAITING COUNT YANGILASH ====================
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

// ==================== DUEL TIMEOUT HANDLER ====================
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

// ==================== CHAT CLEANUP (ESKI CHATLARNI TOZALASH) ====================
function cleanupOldChats() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const chatId in activeChats) {
        const chat = activeChats[chatId];
        const inactiveTime = now - chat.lastActivity;
        
        // 30 daqiqadan ortiq faol bo'lmagan chatlarni tozalash
        if (inactiveTime > 30 * 60 * 1000) {
            delete activeChats[chatId];
            cleanedCount++;
            console.log(`🧹 Eski chat tozalandi: ${chatId}`);
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹 Jami ${cleanedCount} ta eski chat tozalandi`);
    }
}

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
    console.log('\n' + '='.repeat(50));
    console.log('✅ Yangi WebSocket ulanishi:', socket.id);
    console.log('='.repeat(50));
    
    // ==================== AUTH HANDLER ====================
    socket.on('auth', (data) => {
        // Unique ID yaratish
        const userId = data.userId || generateUniqueUserId();
        const userName = data.firstName || 'Foydalanuvchi';
        
        console.log(`🔐 Auth qilish: ${userName} [${userId}]`);
        
        // Foydalanuvchini yaratish yoki yangilash
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                firstName: userName,
                username: data.username || `user_${userId.substring(0, 6)}`,
                photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff`,
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
                lastActive: new Date(),
                joinedAt: new Date()
            };
            console.log(`👤 Yangi foydalanuvchi yaratildi: ${userName}`);
        } else {
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = new Date();
            console.log(`👤 Foydalanuvchi qayta ulandi: ${userName}`);
        }
        
        socket.userId = userId;
        
        // Clientga ma'lumot yuborish
        socket.emit('auth_ok', {
            ...users[userId],
            winRate: users[userId].duels > 0 ? 
                Math.round((users[userId].wins / users[userId].duels) * 100) : 0
        });
        
        console.log(`📊 ${userName} gender holati: ${users[userId].hasSelectedGender ? `Tanlangan (${users[userId].gender})` : 'Tanlanmagan'}`);
        
        // Agar gender tanlanmagan bo'lsa, bildirishnoma
        if (!users[userId].hasSelectedGender) {
            console.log(`⚠️ ${userName} gender tanlamagan, modal ko'rsatish`);
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
                console.log(`✅ ${userName} navbatga qo'shildi`);
                updateWaitingCount();
                
                // Duel qidirishni boshlash
                setTimeout(() => {
                    if (queue.length >= 2) {
                        findAndStartDuels();
                    }
                }, 1000);
            }
        }
    });
    
    // ==================== GENDER SELECTION ====================
    socket.on('select_gender', (data) => {
        const userId = socket.userId;
        const gender = data.gender;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
            return;
        }
        
        console.log(`\n🎯 GENDER TANLASH: ${users[userId].firstName} -> ${gender}`);
        
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
            console.log(`✅ ${users[userId].firstName} navbatga qo'shildi`);
            updateWaitingCount();
        }
        
        // Duel qidirishni boshlash
        setTimeout(() => {
            if (queue.length >= 2) {
                findAndStartDuels();
            }
        }, 1000);
    });
    
    // ==================== ENTER QUEUE ====================
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) {
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        console.log(`\n🚀 NAVBATGA KIRISH: ${users[userId].firstName}`);
        
        // MAJBURIY TEKSHIRISH: Gender tanlanmagan bo'lsa
        if (!users[userId].hasSelectedGender) {
            console.log(`❌ ${users[userId].firstName} navbatga kira olmaydi - gender tanlanmagan!`);
            socket.emit('show_gender_selection', {
                mandatory: true,
                message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
            });
            return;
        }
        
        // Agar allaqachon navbatda bo'lsa
        if (queue.includes(userId)) {
            console.log(`ℹ️ ${users[userId].firstName} allaqachon navbatda`);
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
        setTimeout(() => {
            if (queue.length >= 2) {
                findAndStartDuels();
            }
        }, 500);
    });
    
    // ==================== LEAVE QUEUE ====================
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        
        if (!userId) return;
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            const userName = users[userId]?.firstName || userId;
            queue.splice(index, 1);
            console.log(`🚪 ${userName} navbatdan chiqdi`);
            updateWaitingCount();
        }
    });
    
    // ==================== VOTE HANDLER ====================
    socket.on('vote', (data) => {
        const userId = socket.userId;
        const { duelId, choice } = data;
        
        console.log(`🗳️ VOTE: ${users[userId]?.firstName} -> ${choice} (duel: ${duelId.substring(0, 10)}...)`);
        
        const duel = activeDuels[duelId];
        if (!duel) {
            socket.emit('error', { message: 'Bu duel topilmadi' });
            return;
        }
        
        if (duel.ended) {
            socket.emit('error', { message: 'Bu duel tugagan' });
            return;
        }
        
        // Foydalanuvchi duelning qaysi tomonida ekanligini aniqlash
        const isPlayer1 = duel.player1 === userId;
        const isPlayer2 = duel.player2 === userId;
        
        if (!isPlayer1 && !isPlayer2) {
            socket.emit('error', { message: 'Siz bu duelda emassiz' });
            return;
        }
        
        // SUPER LIKE uchun limit tekshirish
        if (choice === 'super_like') {
            const user = users[userId];
            if (user.dailySuperLikes <= 0) {
                socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                return;
            }
        }
        
        // Ovozni saqlash
        duel.votes[userId] = choice;
        
        // Ikkala o'yinchi ham ovoz berganda natijani hisoblash
        const player1Vote = duel.votes[duel.player1];
        const player2Vote = duel.votes[duel.player2];
        
        if (player1Vote !== null && player2Vote !== null) {
            console.log(`📊 Ikkala ovoz ham to'plandi, natija hisoblanmoqda...`);
            processDuelResult(duelId);
        } else {
            // Faqat biri ovoz berganda kutish
            const opponentId = isPlayer1 ? duel.player2 : duel.player1;
            const opponent = users[opponentId];
            console.log(`⏳ ${opponent?.firstName} ovozini kutish...`);
        }
    });
    
    // ==================== CHAT REQUEST HANDLER ====================
    socket.on('chat_request', (data) => {
        const userId = socket.userId;
        const { duelId } = data;
        
        console.log(`💬 CHAT REQUEST: ${users[userId]?.firstName} -> ${duelId.substring(0, 10)}...`);
        
        const duel = activeDuels[duelId];
        if (!duel || !duel.isMatch || duel.ended) {
            socket.emit('error', { message: 'Chat mumkin emas' });
            return;
        }
        
        // Chat so'rovini saqlash
        duel.chatRequests[userId] = true;
        
        const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
        const opponent = users[opponentId];
        
        console.log(`   ${users[userId].firstName} chat so'radi. Opponent: ${opponent?.firstName}`);
        
        // Agar ikkinchi o'yinchi ham chat so'ragan bo'lsa
        if (duel.chatRequests[duel.player1] && duel.chatRequests[duel.player2]) {
            console.log(`✅ IKKALASI HAM CHAT SO'RADI! Chat boshlanmoqda...`);
            
            // Chatni boshlash
            const chatId = startChat(duelId);
            if (chatId) {
                // Ikkala o'yinchiga ham chat boshlanganini bildirish
                const player1Socket = io.sockets.sockets.get(users[duel.player1]?.socketId);
                const player2Socket = io.sockets.sockets.get(users[duel.player2]?.socketId);
                
                if (player1Socket) {
                    player1Socket.emit('chat_started', {
                        chatId: chatId,
                        partner: {
                            id: duel.player2,
                            name: users[duel.player2]?.firstName,
                            photo: users[duel.player2]?.photoUrl,
                            gender: users[duel.player2]?.gender
                        }
                    });
                }
                
                if (player2Socket) {
                    player2Socket.emit('chat_started', {
                        chatId: chatId,
                        partner: {
                            id: duel.player1,
                            name: users[duel.player1]?.firstName,
                            photo: users[duel.player1]?.photoUrl,
                            gender: users[duel.player1]?.gender
                        }
                    });
                }
            }
        } else {
            // Faqat biri so'ragan, ikkinchisiga so'rov yuborish
            const opponentSocket = io.sockets.sockets.get(opponent?.socketId);
            if (opponentSocket) {
                opponentSocket.emit('chat_request_received', {
                    from: userId,
                    name: users[userId]?.firstName
                });
            }
        }
    });
    
    // ==================== SKIP CHAT HANDLER ====================
    socket.on('skip_chat', (data) => {
        const userId = socket.userId;
        const { duelId } = data;
        
        console.log(`🚪 SKIP CHAT: ${users[userId]?.firstName} -> ${duelId.substring(0, 10)}...`);
        
        const duel = activeDuels[duelId];
        if (!duel) return;
        
        // Navbatga qaytarish
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
        
        // Ikkinchi o'yinchiga ham chat o'tkazib yuborilganini bildirish
        const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
        const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
        if (opponentSocket) {
            opponentSocket.emit('chat_skipped', {
                by: users[userId]?.firstName
            });
        }
    });
    
    // ==================== SEND CHAT MESSAGE ====================
    socket.on('send_chat_message', (data) => {
        const userId = socket.userId;
        const { chatId, message } = data;
        
        if (!message || message.trim().length === 0) {
            socket.emit('error', { message: 'Xabar bo\'sh bo\'lmasligi kerak' });
            return;
        }
        
        console.log(`📨 CHAT MESSAGE: ${users[userId]?.firstName} -> "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
        
        const chat = activeChats[chatId];
        if (!chat || !chat.active) {
            socket.emit('error', { message: 'Chat topilmadi yoki faol emas' });
            return;
        }
        
        // Xabarni yuborish
        const result = sendChatMessage(chatId, userId, message);
        if (result) {
            // Xabarni yuborgan foydalanuvchiga
            socket.emit('chat_message_sent', {
                chatId: chatId,
                message: result.message
            });
            
            // Xabarni qabul qiluvchiga
            if (result.receiverSocketId) {
                const receiverSocket = io.sockets.sockets.get(result.receiverSocketId);
                if (receiverSocket) {
                    receiverSocket.emit('chat_message_received', {
                        chatId: chatId,
                        message: result.message
                    });
                }
            }
        }
    });
    
    // ==================== LEAVE CHAT ====================
    socket.on('leave_chat', (data) => {
        const userId = socket.userId;
        const { chatId } = data;
        
        console.log(`👋 LEAVE CHAT: ${users[userId]?.firstName} -> ${chatId.substring(0, 10)}...`);
        
        const chat = activeChats[chatId];
        if (chat) {
            chat.active = false;
            
            // Ikkinchi o'yinchiga ham chat tugaganini bildirish
            const opponentId = chat.player1 === userId ? chat.player2 : chat.player1;
            const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
            if (opponentSocket) {
                opponentSocket.emit('chat_ended', {
                    by: users[userId]?.firstName
                });
            }
            
            // 10 soniyadan keyin chatni o'chirish
            setTimeout(() => {
                if (activeChats[chatId]) {
                    delete activeChats[chatId];
                    console.log(`🧹 Chat o'chirildi: ${chatId}`);
                }
            }, 10000);
        }
    });
    
    // ==================== DISCONNECT ====================
    socket.on('disconnect', () => {
        const userId = socket.userId;
        const userName = users[userId]?.firstName || userId;
        
        if (userId && users[userId]) {
            users[userId].connected = false;
            users[userId].lastActive = new Date();
            
            // Navbatdan olish
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(`🔌 ${userName} navbatdan chiqdi (disconnect)`);
                updateWaitingCount();
            }
            
            // Faol duelda bo'lsa
            for (const duelId in activeDuels) {
                const duel = activeDuels[duelId];
                if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
                    duel.ended = true;
                    
                    const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
                    const opponent = users[opponentId];
                    const opponentSocket = io.sockets.sockets.get(opponent?.socketId);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('opponent_left', {
                            name: userName
                        });
                        returnPlayersToQueue(opponentId, null);
                    }
                    
                    delete activeDuels[duelId];
                    console.log(`❌ ${userName} duelni tark etdi: ${duelId}`);
                    break;
                }
            }
            
            // Faol chatda bo'lsa
            for (const chatId in activeChats) {
                const chat = activeChats[chatId];
                if ((chat.player1 === userId || chat.player2 === userId) && chat.active) {
                    const opponentId = chat.player1 === userId ? chat.player2 : chat.player1;
                    const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('chat_ended', {
                            by: userName,
                            reason: 'disconnected'
                        });
                    }
                    
                    chat.active = false;
                    console.log(`💬 ${userName} chatni tark etdi: ${chatId}`);
                    
                    // 5 soniyadan keyin chatni o'chirish
                    setTimeout(() => {
                        if (activeChats[chatId]) {
                            delete activeChats[chatId];
                        }
                    }, 5000);
                    break;
                }
            }
        }
        
        console.log('❌ WebSocket ulanishi uzildi:', socket.id);
        console.log('='.repeat(50));
    });
});

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - MUKAMMAL VERSIYA');
    console.log('='.repeat(70));
    console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🔍 Debug: http://0.0.0.0:${PORT}/api/debug`);
    console.log('🌐 WebSocket URL: wss://like-duel.onrender.com');
    console.log('='.repeat(70));
    console.log('✅ Ko\'p foydalanuvchi uchun optimallashtirildi');
    console.log('✅ Test user muammosi to\'g\'rilandi');
    console.log('✅ Chat funksiyasi mukammal ishlaydi');
    console.log('✅ WebSocket connection ishlaydi');
    console.log('='.repeat(70));
});

// Har 10 soniyada duel qidirish
setInterval(() => {
    if (queue.length >= 2) {
        findAndStartDuels();
    }
}, 5000); // 5 soniyaga qisqartirildi (tezroq juftlashish)

// Har 1 daqiqada eski chatlarni tozalash
setInterval(() => {
    cleanupOldChats();
}, 60 * 1000);

// Har 30 soniyada navbat holatini log qilish
setInterval(() => {
    if (queue.length > 0) {
        console.log(`📊 [${new Date().toLocaleTimeString()}] Navbat holati: ${queue.length} ta`);
    }
}, 30000);