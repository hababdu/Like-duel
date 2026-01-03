// server.js - Like Duel Server (Complete Version)
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

// ==================== CORS SOZLAMALARI ====================
app.use(cors({
    origin: ["https://like-duel.onrender.com", "http://localhost:3000", "http://localhost:5500", "http://127.0.0.1:5500"],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));

// ==================== STATIC FAYLLARNI SERVIS QILISH ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'index.html'));
});

app.get('/main.js', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'main.js'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'style.css'));
});

app.get('/ui.js', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'ui.js'));
});

app.get('/socket.js', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'socket.js'));
});

app.get('/gameLogic.js', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'gameLogic.js'));
});

app.get('/storage.js', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'storage.js'));
});

app.get('/utils.js', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'utils.js'));
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
        onlineUsers: Object.values(users).filter(u => u.connected).length,
        queue: queue.length,
        activeDuels: Object.keys(activeDuels).length,
        mutualMatches: Object.keys(mutualMatches).length
    });
});

app.get('/api/stats', (req, res) => {
    const totalUsers = Object.keys(users).length;
    const onlineUsers = Object.values(users).filter(u => u.connected).length;
    const usersWithGender = Object.values(users).filter(u => u.hasSelectedGender).length;
    const maleUsers = Object.values(users).filter(u => u.gender === 'male').length;
    const femaleUsers = Object.values(users).filter(u => u.gender === 'female').length;
    
    res.json({
        status: 'online',
        server: 'Like Duel Server',
        totalUsers,
        onlineUsers,
        offlineUsers: totalUsers - onlineUsers,
        usersWithGender,
        usersWithoutGender: totalUsers - usersWithGender,
        genderStats: {
            male: maleUsers,
            female: femaleUsers,
            not_specified: Object.values(users).filter(u => u.gender === 'not_specified').length
        },
        waitingQueue: queue.length,
        activeDuels: Object.keys(activeDuels).length,
        totalMutualMatches: Object.keys(mutualMatches).length,
        chatRequests: Object.keys(chatRequests).length
    });
});

app.get('/api/users', (req, res) => {
    const usersList = Object.values(users).map(user => ({
        id: user.id,
        name: user.firstName,
        username: user.username,
        gender: user.gender,
        rating: user.rating,
        matches: user.matches,
        duels: user.duels,
        wins: user.wins,
        coins: user.coins,
        online: user.connected,
        lastActive: user.lastActive,
        hasSelectedGender: user.hasSelectedGender,
        filter: user.filter
    }));
    
    res.json({
        total: usersList.length,
        online: usersList.filter(u => u.online).length,
        users: usersList
    });
});

app.get('/api/queue', (req, res) => {
    const queueInfo = queue.map((userId, index) => {
        const user = users[userId];
        return user ? {
            position: index + 1,
            userId: user.id,
            name: user.firstName,
            gender: user.gender,
            filter: user.filter,
            online: user.connected,
            waitingSince: user.lastActive,
            rating: user.rating
        } : null;
    }).filter(item => item !== null);
    
    res.json({
        count: queue.length,
        onlineInQueue: queueInfo.filter(q => q.online).length,
        estimatedWait: queue.length * 10,
        queue: queueInfo
    });
});

app.get('/api/duels', (req, res) => {
    const duelsList = Object.values(activeDuels).map(duel => {
        const player1 = users[duel.player1];
        const player2 = users[duel.player2];
        
        return {
            id: duel.id,
            started: duel.startTime,
            duration: Math.floor((new Date() - duel.startTime) / 1000),
            player1: player1 ? {
                id: player1.id,
                name: player1.firstName,
                gender: player1.gender,
                online: player1.connected,
                vote: duel.votes[player1.id] || 'waiting'
            } : null,
            player2: player2 ? {
                id: player2.id,
                name: player2.firstName,
                gender: player2.gender,
                online: player2.connected,
                vote: duel.votes[player2.id] || 'waiting'
            } : null,
            ended: duel.ended,
            isMatch: (duel.votes[duel.player1] === 'like' || duel.votes[duel.player1] === 'super_like') && 
                    (duel.votes[duel.player2] === 'like' || duel.votes[duel.player2] === 'super_like')
        };
    });
    
    res.json({
        count: duelsList.length,
        onlineDuels: duelsList.filter(d => d.player1?.online && d.player2?.online).length,
        duels: duelsList
    });
});

app.get('/api/matches', (req, res) => {
    const mutualMatchesList = Object.entries(mutualMatches).map(([userId, friends]) => {
        const user = users[userId];
        return {
            userId,
            userName: user?.firstName || 'Unknown',
            friendsCount: friends.length,
            friends: friends.map(friendId => {
                const friend = users[friendId];
                return friend ? {
                    id: friend.id,
                    name: friend.firstName,
                    username: friend.username,
                    online: friend.connected
                } : { id: friendId, name: 'Unknown' };
            })
        };
    });
    
    res.json({
        totalMutualMatches: Object.keys(mutualMatches).length,
        mutualMatches: mutualMatchesList
    });
});

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const users = {};          // Barcha foydalanuvchilar {userId: userObject}
const queue = [];         // Navbatdagi foydalanuvchilar [userId1, userId2, ...]
const activeDuels = {};   // Faol duellar {duelId: duelObject}
const mutualMatches = {}; // O'zaro matchlar {userId: [friendId1, friendId2, ...]}
const matchHistory = {};  // Match tarixi {userId: [match1, match2, ...]}
const chatRequests = {};  // Chat so'rovlari {requestId: {from, to, status}}

// ==================== YORDAMCHI FUNKSIYALAR ====================

/**
 * Duel ID generatsiya qilish
 */
function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Request ID generatsiya qilish
 */
function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Gender mosligini tekshirish
 */
function checkGenderCompatibility(user1, user2) {
    if (!user1?.gender || !user2?.gender) return false;
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

/**
 * Filter mosligini tekshirish
 */
function checkFilterCompatibility(user, opponent) {
    const userFilter = user.filter || 'not_specified';
    const opponentFilter = opponent.filter || 'not_specified';
    
    // Userning filterini tekshirish
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

/**
 * Navbatdan raqib topish (ONLY ONLINE USERS)
 */
function findOpponentFor(userId) {
    const user = users[userId];
    if (!user || !user.hasSelectedGender || !user.gender) return null;
    
    // Foydalanuvchi online emas bo'lsa, navbatdan chiqarish
    if (!user.connected) {
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            console.log(`⚠️ ${user.firstName} offline bo'lgani uchun navbatdan chiqarildi`);
        }
        return null;
    }
    
    // Faqat ONLINE bo'lgan foydalanuvchilarni qidirish
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent || !opponent.connected) continue; // OFFLINE raqibni o'tkazib yuborish
        
        if (!opponent.hasSelectedGender || !opponent.gender) continue;
        
        // Gender mosligini tekshirish
        if (!checkGenderCompatibility(user, opponent)) continue;
        
        // Userning filterini tekshirish
        if (!checkFilterCompatibility(user, opponent)) continue;
        
        // Raqibning filterini tekshirish
        if (!checkFilterCompatibility(opponent, user)) continue;
        
        console.log(`🔍 Raqib topildi: ${user.firstName} <-> ${opponent.firstName} (ikkovi ham online)`);
        return opponentId;
    }
    
    return null;
}

/**
 * Navbatdagilar sonini yangilash
 */
function updateWaitingCount() {
    const count = queue.length;
    const onlineCount = queue.filter(userId => {
        const user = users[userId];
        return user && user.connected;
    }).length;
    
    queue.forEach((userId, index) => {
        const user = users[userId];
        if (user && user.socketId) {
            const socket = io.sockets.sockets.get(user.socketId);
            if (socket) {
                socket.emit('waiting_count', {
                    count: count,
                    onlineCount: onlineCount,
                    position: index + 1,
                    estimatedTime: (index + 1) * 10
                });
            }
        }
    });
}

// ==================== MUTUAL MATCH FUNKSIYALARI ====================

/**
 * O'zaro match qo'shish va AVTOMATIK chat taklifi yuborish
 */
function addMutualMatch(userId1, userId2) {
    console.log(`🤝 O'zaro match qo'shilmoqda: ${userId1} <-> ${userId2}`);
    
    // Birinchi foydalanuvchi uchun
    if (!mutualMatches[userId1]) {
        mutualMatches[userId1] = [];
    }
    if (!mutualMatches[userId1].includes(userId2)) {
        mutualMatches[userId1].push(userId2);
        console.log(`✅ ${userId1} ga ${userId2} qo'shildi`);
    }
    
    // Ikkinchi foydalanuvchi uchun
    if (!mutualMatches[userId2]) {
        mutualMatches[userId2] = [];
    }
    if (!mutualMatches[userId2].includes(userId1)) {
        mutualMatches[userId2].push(userId1);
        console.log(`✅ ${userId2} ga ${userId1} qo'shildi`);
    }
    
    // Do'stlar sonini yangilash
    if (users[userId1]) {
        users[userId1].mutualMatchesCount = mutualMatches[userId1].length;
        users[userId1].friendsCount = mutualMatches[userId1].length;
    }
    
    if (users[userId2]) {
        users[userId2].mutualMatchesCount = mutualMatches[userId2].length;
        users[userId2].friendsCount = mutualMatches[userId2].length;
    }
    
    console.log(`✅ O'zaro match qo'shildi: ${userId1} (${mutualMatches[userId1]?.length}) <-> ${userId2} (${mutualMatches[userId2]?.length})`);
    
    // AVTOMATIK CHAT TAKLIFI YUBORISH
    createChatRequest(userId1, userId2);
    
    // Har ikki foydalanuvchiga xabar yuborish
    notifyMutualMatchAdded(userId1, userId2);
    notifyMutualMatchAdded(userId2, userId1);
}

/**
 * O'zaro match haqida xabar berish
 */
function notifyMutualMatchAdded(userId, friendId) {
    const user = users[userId];
    const friend = users[friendId];
    
    if (user && user.socketId && friend) {
        const socket = io.sockets.sockets.get(user.socketId);
        if (socket) {
            socket.emit('mutual_match', {
                partnerName: friend.firstName,
                mutualMatchesCount: mutualMatches[userId]?.length || 0,
                friendsCount: mutualMatches[userId]?.length || 0,
                message: `${friend.firstName} bilan o'zaro match! Endi siz do'st bo'ldingiz.`
            });
        }
    }
}

/**
 * O'zaro matchlarni olish
 */
function getMutualMatches(userId) {
    return mutualMatches[userId] || [];
}

/**
 * Match tarixini qo'shish
 */
function addMatchHistory(userId1, userId2) {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!matchHistory[userId1]) matchHistory[userId1] = [];
    if (!matchHistory[userId2]) matchHistory[userId2] = [];
    
    const matchData = {
        id: matchId,
        userId: userId1 === userId1 ? userId2 : userId1,
        timestamp: new Date(),
        type: 'mutual'
    };
    
    matchHistory[userId1].push(matchData);
    matchHistory[userId2].push({
        ...matchData,
        userId: userId1
    });
}

// ==================== CHAT REQUEST FUNCTIONS ====================

/**
 * Chat so'rovini yaratish
 */
function createChatRequest(fromUserId, toUserId) {
    const requestId = generateRequestId();
    
    chatRequests[requestId] = {
        id: requestId,
        from: fromUserId,
        to: toUserId,
        status: 'pending', // 'pending', 'accepted', 'rejected'
        timestamp: new Date()
    };
    
    console.log(`💬 Chat so'rovi yaratildi: ${requestId} (${fromUserId} -> ${toUserId})`);
    
    // Raqibga chat taklifi yuborish
    const toUser = users[toUserId];
    const fromUser = users[fromUserId];
    
    if (toUser && toUser.connected && fromUser) {
        const socket = io.sockets.sockets.get(toUser.socketId);
        if (socket) {
            socket.emit('chat_invite', {
                requestId: requestId,
                fromUserId: fromUserId,
                fromUserName: fromUser.firstName,
                fromUserPhoto: fromUser.photoUrl,
                message: `${fromUser.firstName} siz bilan chat qilishni taklif qildi!`
            });
            console.log(`✅ ${toUser.firstName} ga chat taklifi yuborildi`);
        }
    }
    
    return requestId;
}

/**
 * Chat so'rovini qabul qilish
 */
function acceptChatRequest(requestId, userId) {
    const request = chatRequests[requestId];
    if (!request || request.status !== 'pending') {
        console.log(`❌ Chat so'rovi topilmadi yoki allaqachon qabul qilingan`);
        return false;
    }
    
    if (request.to !== userId) {
        console.log(`❌ Ushbu chat so'rovi sizga emas`);
        return false;
    }
    
    request.status = 'accepted';
    console.log(`✅ Chat so'rovi qabul qilindi: ${requestId}`);
    
    // Ikkala foydalanuvchiga ham chat ochish imkoniyati haqida xabar yuborish
    const fromUser = users[request.from];
    const toUser = users[request.to];
    
    // Taklif yuboruvchiga xabar
    if (fromUser && fromUser.connected) {
        const fromSocket = io.sockets.sockets.get(fromUser.socketId);
        if (fromSocket) {
            fromSocket.emit('chat_accepted', {
                requestId: requestId,
                partnerId: request.to,
                partnerName: toUser.firstName,
                partnerUsername: toUser.username,
                partnerPhoto: toUser.photoUrl,
                message: `${toUser.firstName} sizning chat taklifingizni qabul qildi! Endi suhbatlashingiz mumkin.`
            });
            console.log(`✅ ${fromUser.firstName} ga chat_accepted xabari yuborildi`);
        }
    }
    
    // Taklif qabul qiluvchiga xabar
    if (toUser && toUser.connected) {
        const toSocket = io.sockets.sockets.get(toUser.socketId);
        if (toSocket) {
            toSocket.emit('chat_accepted', {
                requestId: requestId,
                partnerId: request.from,
                partnerName: fromUser.firstName,
                partnerUsername: fromUser.username,
                partnerPhoto: fromUser.photoUrl,
                message: `Siz ${fromUser.firstName} bilan chat qilishni qabul qildingiz! Endi suhbatlashingiz mumkin.`
            });
            console.log(`✅ ${toUser.firstName} ga chat_accepted xabari yuborildi`);
        }
    }
    
    return true;
}

/**
 * Chat so'rovini rad etish
 */
function rejectChatRequest(requestId, userId) {
    const request = chatRequests[requestId];
    if (!request || request.status !== 'pending') {
        console.log(`❌ Chat so'rovi topilmadi`);
        return false;
    }
    
    if (request.to !== userId) {
        console.log(`❌ Ushbu chat so'rovi sizga emas`);
        return false;
    }
    
    request.status = 'rejected';
    console.log(`❌ Chat so'rovi rad etildi: ${requestId}`);
    
    // Taklif yuboruvchiga rad etilganligi haqida xabar
    const fromUser = users[request.from];
    const toUser = users[request.to];
    
    if (fromUser && fromUser.connected) {
        const socket = io.sockets.sockets.get(fromUser.socketId);
        if (socket) {
            socket.emit('chat_rejected', {
                requestId: requestId,
                partnerName: toUser.firstName,
                message: `${toUser.firstName} sizning chat taklifingizni rad etdi.`
            });
            console.log(`✅ ${fromUser.firstName} ga chat_rejected xabari yuborildi`);
        }
    }
    
    return true;
}

// ==================== DUEL QIDIRISH VA BOSHLASH ====================

/**
 * Duel qidirish va boshlash (ONLY ONLINE USERS)
 */
function findAndStartDuels() {
    // Avval offline bo'lganlarni navbatdan chiqarish
    for (let i = queue.length - 1; i >= 0; i--) {
        const userId = queue[i];
        const user = users[userId];
        if (!user || !user.connected) {
            queue.splice(i, 1);
            if (user) {
                console.log(`⚠️ ${user.firstName} offline bo'lgani uchun navbatdan chiqarildi`);
            }
        }
    }
    
    if (queue.length < 2) {
        console.log(`📊 Navbatda ${queue.length} ta ONLINE foydalanuvchi, duel boshlash uchun yetarli emas`);
        updateWaitingCount();
        return;
    }
    
    console.log(`🔍 Duel qidirilmoqda... Navbatda ${queue.length} ta ONLINE foydalanuvchi`);
    
    for (let i = 0; i < queue.length; i++) {
        const userId = queue[i];
        const opponentId = findOpponentFor(userId);
        
        if (opponentId) {
            const userIndex = queue.indexOf(userId);
            const opponentIndex = queue.indexOf(opponentId);
            
            if (userIndex > -1) queue.splice(userIndex, 1);
            if (opponentIndex > -1) queue.splice(opponentIndex, 1);
            
            console.log(`⚔️ Duel boshlanmoqda: ${userId} vs ${opponentId} (ikkovi ham online)`);
            startDuel(userId, opponentId);
            updateWaitingCount();
            break;
        }
    }
}

/**
 * Duel boshlash
 */
function startDuel(player1Id, player2Id) {
    const duelId = generateDuelId();
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    if (!player1 || !player2) {
        console.error('❌ Duel boshlash uchun foydalanuvchilar topilmadi');
        return;
    }
    
    // Foydalanuvchilar online emas bo'lsa
    if (!player1.connected || !player2.connected) {
        console.error(`❌ Duel boshlash uchun foydalanuvchilar online emas: 
            ${player1.firstName}: ${player1.connected ? 'online' : 'offline'}
            ${player2.firstName}: ${player2.connected ? 'online' : 'offline'}`);
        
        // Navbatga qaytarish
        if (player1.connected && !queue.includes(player1Id)) {
            queue.push(player1Id);
        }
        if (player2.connected && !queue.includes(player2Id)) {
            queue.push(player2Id);
        }
        updateWaitingCount();
        return;
    }
    
    activeDuels[duelId] = {
        id: duelId,
        player1: player1Id,
        player2: player2Id,
        votes: {},
        startTime: new Date(),
        ended: false,
        resultsSent: false,
        player1Online: player1.connected,
        player2Online: player2.connected
    };
    
    console.log(`🎮 Duel boshladi: ${duelId}`);
    console.log(`   Player 1: ${player1.firstName} (${player1.gender}) - ${player1.connected ? 'online ✅' : 'offline ❌'}`);
    console.log(`   Player 2: ${player2.firstName} (${player2.gender}) - ${player2.connected ? 'online ✅' : 'offline ❌'}`);
    
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
                gender: player2.gender,
                online: player2.connected
            },
            timeLeft: 20
        });
        console.log(`   ✅ ${player1.firstName} ga ma'lumot yuborildi`);
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
                gender: player1.gender,
                online: player1.connected
            },
            timeLeft: 20
        });
        console.log(`   ✅ ${player2.firstName} ga ma'lumot yuborildi`);
    }
    
    // 20 soniya timer
    setTimeout(() => {
        if (activeDuels[duelId] && !activeDuels[duelId].ended) {
            console.log(`⏰ Duel ${duelId} vaqti tugadi`);
            handleDuelTimeout(duelId);
        }
    }, 20000);
}

/**
 * Duel natijasini qayta ishlash
 */
function processDuelResult(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended || duel.resultsSent) {
        console.log(`❌ Duel ${duelId} allaqachon tugagan`);
        return;
    }
    
    duel.ended = true;
    duel.resultsSent = true;
    
    const player1Vote = duel.votes[duel.player1];
    const player2Vote = duel.votes[duel.player2];
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    console.log(`📊 Duel natijasi ${duelId}:`);
    console.log(`   ${player1?.firstName}: ${player1Vote || 'no vote'}`);
    console.log(`   ${player2?.firstName}: ${player2Vote || 'no vote'}`);
    
    // MATCH holati - O'ZARO LIKE BERSA (LIKE yoki SUPER_LIKE)
    if ((player1Vote === 'like' || player1Vote === 'super_like') && 
        (player2Vote === 'like' || player2Vote === 'super_like')) {
        
        console.log(`🎉 O'ZARO MATCH! ${player1?.firstName} va ${player2?.firstName}`);
        
        // Statistika yangilash
        player1.matches++;
        player2.matches++;
        player1.duels++;
        player2.duels++;
        player1.wins++;
        player2.wins++;
        
        // Mukofotlar
        let player1Reward = 50;
        let player2Reward = 50;
        let player1RatingChange = 25;
        let player2RatingChange = 25;
        
        if (player1Vote === 'super_like') {
            player1Reward += 20;
            player1RatingChange += 5;
            console.log(`   ${player1?.firstName} SUPER LIKE uchun +20 coin, +5 rating`);
        }
        if (player2Vote === 'super_like') {
            player2Reward += 20;
            player2RatingChange += 5;
            console.log(`   ${player2?.firstName} SUPER LIKE uchun +20 coin, +5 rating`);
        }
        
        player1.coins += player1Reward;
        player2.coins += player2Reward;
        player1.rating += player1RatingChange;
        player2.rating += player2RatingChange;
        
        // O'ZARO MATCH QO'SHISH (AVTOMATIK CHAT TAKLIFI BILAN)
        console.log(`🤝 O'zaro match qo'shilmoqda (avtomatik chat taklifi bilan)...`);
        addMutualMatch(duel.player1, duel.player2);
        addMatchHistory(duel.player1, duel.player2);
        
        // Player1 ga xabar
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('match', {
                partner: {
                    id: duel.player2,
                    name: player2.firstName,
                    username: player2.username,
                    photo: player2.photoUrl,
                    gender: player2.gender,
                    rating: player2.rating,
                    wins: player2.wins,
                    online: player2.connected
                },
                opponent: {
                    id: duel.player2,
                    name: player2.firstName,
                    username: player2.username,
                    photo: player2.photoUrl,
                    gender: player2.gender,
                    rating: player2.rating,
                    matches: player2.matches,
                    level: player2.level,
                    online: player2.connected
                },
                rewards: {
                    coins: player1Reward,
                    xp: 30
                },
                newRating: player1.rating,
                coinsEarned: player1Reward,
                ratingChange: player1RatingChange,
                isMutual: true,
                chatInviteEnabled: true,
                message: `${player2.firstName} bilan o'zaro match! Endi siz do'st bo'ldingiz. Chat qilishni xohlaysizmi?`
            });
            console.log(`   ✅ ${player1.firstName} ga match xabari yuborildi (chat taklifi bilan)`);
        }
        
        // Player2 ga xabar
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('match', {
                partner: {
                    id: duel.player1,
                    name: player1.firstName,
                    username: player1.username,
                    photo: player1.photoUrl,
                    gender: player1.gender,
                    rating: player1.rating,
                    wins: player1.wins,
                    online: player1.connected
                },
                opponent: {
                    id: duel.player1,
                    name: player1.firstName,
                    username: player1.username,
                    photo: player1.photoUrl,
                    gender: player1.gender,
                    rating: player1.rating,
                    matches: player1.matches,
                    level: player1.level,
                    online: player1.connected
                },
                rewards: {
                    coins: player2Reward,
                    xp: 30
                },
                newRating: player2.rating,
                coinsEarned: player2Reward,
                ratingChange: player2RatingChange,
                isMutual: true,
                chatInviteEnabled: true,
                message: `${player1.firstName} bilan o'zaro match! Endi siz do'st bo'ldingiz. Chat qilishni xohlaysizmi?`
            });
            console.log(`   ✅ ${player2.firstName} ga match xabari yuborildi (chat taklifi bilan)`);
        }
        
    } else if (player1Vote === 'like' || player1Vote === 'super_like') {
        // Faqat player1 like berdi
        console.log(`❤️ Faqat ${player1?.firstName} like berdi`);
        
        player1.duels++;
        const coins = player1Vote === 'super_like' ? 30 : 10;
        player1.coins += coins;
        player1.totalLikes++;
        
        console.log(`   ${player1?.firstName} +${coins} coin oldi`);
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('liked_only', {
                opponentName: player2.firstName,
                opponentOnline: player2.connected,
                reward: { coins: coins, xp: 5 }
            });
            console.log(`   ✅ ${player1.firstName} ga liked_only xabari yuborildi`);
        }
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('no_match', {});
            console.log(`   ✅ ${player2.firstName} ga no_match xabari yuborildi`);
        }
        
    } else if (player2Vote === 'like' || player2Vote === 'super_like') {
        // Faqat player2 like berdi
        console.log(`❤️ Faqat ${player2?.firstName} like berdi`);
        
        player2.duels++;
        const coins = player2Vote === 'super_like' ? 30 : 10;
        player2.coins += coins;
        player2.totalLikes++;
        
        console.log(`   ${player2?.firstName} +${coins} coin oldi`);
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('liked_only', {
                opponentName: player1.firstName,
                opponentOnline: player1.connected,
                reward: { coins: coins, xp: 5 }
            });
            console.log(`   ✅ ${player2.firstName} ga liked_only xabari yuborildi`);
        }
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('no_match', {});
            console.log(`   ✅ ${player1.firstName} ga no_match xabari yuborildi`);
        }
        
    } else {
        // Hech kim like bermadi
        console.log(`❌ Hech kim like bermadi`);
        
        player1.duels++;
        player2.duels++;
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('no_match', {});
            console.log(`   ✅ ${player1.firstName} ga no_match xabari yuborildi`);
        }
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('no_match', {});
            console.log(`   ✅ ${player2.firstName} ga no_match xabari yuborildi`);
        }
    }
    
    // Ratinglarni yangilash
    if (player1) {
        let ratingChange = 0;
        if (player1Vote === 'like' || player1Vote === 'super_like') {
            ratingChange = 10;
        } else if (player1Vote === 'pass') {
            ratingChange = -5;
        }
        player1.rating = Math.max(1000, player1.rating + ratingChange);
        console.log(`   ${player1.firstName} rating: ${player1.rating} (${ratingChange > 0 ? '+' : ''}${ratingChange})`);
    }
    
    if (player2) {
        let ratingChange = 0;
        if (player2Vote === 'like' || player2Vote === 'super_like') {
            ratingChange = 10;
        } else if (player2Vote === 'pass') {
            ratingChange = -5;
        }
        player2.rating = Math.max(1000, player2.rating + ratingChange);
        console.log(`   ${player2.firstName} rating: ${player2.rating} (${ratingChange > 0 ? '+' : ''}${ratingChange})`);
    }
    
    // Navbatga qaytarish
    console.log(`🔄 Foydalanuvchilar navbatga qaytarilmoqda...`);
    setTimeout(() => {
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
        console.log(`🗑️ Duel ${duelId} o'chirildi`);
    }, 1000);
}

/**
 * Duel vaqti tugashi
 */
function handleDuelTimeout(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    console.log(`⏰ Duel ${duelId} vaqti tugadi`);
    
    duel.ended = true;
    duel.resultsSent = true;
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    const player1Socket = io.sockets.sockets.get(player1?.socketId);
    const player2Socket = io.sockets.sockets.get(player2?.socketId);
    
    if (player1Socket) {
        player1Socket.emit('timeout', {});
        console.log(`   ✅ ${player1?.firstName} ga timeout xabari yuborildi`);
    }
    
    if (player2Socket) {
        player2Socket.emit('timeout', {});
        console.log(`   ✅ ${player2?.firstName} ga timeout xabari yuborildi`);
    }
    
    setTimeout(() => {
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
        console.log(`🗑️ Duel ${duelId} o'chirildi`);
    }, 1000);
}

/**
 * Foydalanuvchilarni navbatga qaytarish (faqat online bo'lsa)
 */
function returnPlayersToQueue(player1Id, player2Id) {
    console.log(`🔄 Foydalanuvchilar navbatga qaytarilmoqda (faqat online): ${player1Id}, ${player2Id}`);
    
    [player1Id, player2Id].forEach(playerId => {
        const player = users[playerId];
        if (player && player.connected && player.hasSelectedGender && !queue.includes(playerId)) {
            queue.push(playerId);
            console.log(`   ✅ ${player.firstName} navbatga qo'shildi (online)`);
        }
    });
    
    updateWaitingCount();
    setTimeout(findAndStartDuels, 1000);
}

// ==================== SOCKET.IO HANDLERS ====================

io.on('connection', (socket) => {
    console.log('✅ Yangi ulanish:', socket.id);
    
    // ==================== AUTHENTICATION ====================
    socket.on('auth', (data) => {
        const userId = data.userId;
        console.log(`🔐 Autentifikatsiya: ${userId} (${data.firstName})`);
        
        if (!users[userId]) {
            // Yangi foydalanuvchi
            users[userId] = {
                id: userId,
                firstName: data.firstName || 'Foydalanuvchi',
                username: data.username || '',
                photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}&background=667eea&color=fff`,
                gender: data.gender || null,
                hasSelectedGender: data.hasSelectedGender || false,
                bio: data.bio || '',
                filter: data.filter || 'not_specified',
                rating: 1500,
                coins: 100,
                level: 1,
                xp: 0,
                matches: 0,
                duels: 0,
                wins: 0,
                totalLikes: 0,
                mutualMatchesCount: getMutualMatches(userId)?.length || 0,
                friendsCount: getMutualMatches(userId)?.length || 0,
                dailySuperLikes: 3,
                socketId: socket.id,
                connected: true,
                lastActive: new Date(),
                lastResetDate: new Date().toDateString()
            };
            console.log(`   👤 Yangi foydalanuvchi yaratildi: ${data.firstName}`);
        } else {
            // Mavjud foydalanuvchi - ONLINE statusini yangilash
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = new Date();
            
            // Yangilangan ma'lumotlarni saqlash
            if (data.gender) users[userId].gender = data.gender;
            if (data.hasSelectedGender !== undefined) users[userId].hasSelectedGender = data.hasSelectedGender;
            if (data.bio !== undefined) users[userId].bio = data.bio;
            if (data.filter !== undefined) users[userId].filter = data.filter;
            
            // Mutual matches sonini yangilash
            users[userId].mutualMatchesCount = getMutualMatches(userId)?.length || 0;
            users[userId].friendsCount = getMutualMatches(userId)?.length || 0;
            
            console.log(`   👤 Mavjud foydalanuvchi online bo'ldi: ${users[userId].firstName}`);
            
            // Eski chat so'rovlari mavjud bo'lsa
            Object.values(chatRequests).forEach(request => {
                if (request.to === userId && request.status === 'pending') {
                    console.log(`   💬 ${users[userId].firstName} ga pending chat so'rovi mavjud`);
                    
                    const fromUser = users[request.from];
                    if (fromUser) {
                        socket.emit('chat_invite', {
                            requestId: request.id,
                            fromUserId: request.from,
                            fromUserName: fromUser.firstName,
                            fromUserPhoto: fromUser.photoUrl,
                            message: `${fromUser.firstName} siz bilan chat qilishni taklif qildi!`
                        });
                    }
                }
            });
        }
        
        socket.userId = userId;
        
        // Kunlik reset tekshirish
        const today = new Date().toDateString();
        if (users[userId].lastResetDate !== today) {
            users[userId].dailySuperLikes = 3;
            users[userId].lastResetDate = today;
            console.log(`   🔄 ${users[userId].firstName} uchun kunlik SUPER LIKE lar qayta tiklandi`);
        }
        
        // Clientga ma'lumot yuborish
        socket.emit('auth_ok', {
            ...users[userId],
            winRate: users[userId].duels > 0 ? 
                Math.round((users[userId].wins / users[userId].duels) * 100) : 0
        });
        
        console.log(`   ✅ ${users[userId].firstName} ga auth_ok yuborildi`);
        
        // Agar gender tanlangan bo'lsa, navbatga qo'shish
        if (users[userId].hasSelectedGender) {
            if (!queue.includes(userId)) {
                queue.push(userId);
                console.log(`   📝 ${users[userId].firstName} navbatga qo'shildi (online)`);
            }
        } else {
            console.log(`   ⚠️ ${users[userId].firstName} gender tanlamagan`);
            setTimeout(() => {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                });
            }, 500);
        }
        
        updateWaitingCount();
        
        if (users[userId].hasSelectedGender) {
            setTimeout(() => findAndStartDuels(), 1000);
        }
    });
    
    // ==================== GENDER SELECTION ====================
    socket.on('select_gender', (data) => {
        const userId = socket.userId;
        const gender = data.gender;
        
        if (!userId || !users[userId]) {
            console.log(`❌ Gender tanlash: foydalanuvchi topilmadi`);
            return;
        }
        
        console.log(`🎯 Gender tanlash: ${users[userId].firstName} -> ${gender}`);
        
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
        
        console.log(`   ✅ ${users[userId].firstName} ga gender_selected yuborildi`);
        
        if (!queue.includes(userId)) {
            queue.push(userId);
            console.log(`   📝 ${users[userId].firstName} navbatga qo'shildi (online)`);
        }
        
        updateWaitingCount();
        setTimeout(() => findAndStartDuels(), 500);
    });
    
    // ==================== QUEUE MANAGEMENT ====================
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) {
            console.log(`❌ Navbatga kirish: foydalanuvchi topilmadi`);
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        console.log(`📝 Navbatga kirish: ${users[userId].firstName} (${users[userId].connected ? 'online ✅' : 'offline ❌'})`);
        
        if (!users[userId].connected) {
            console.log(`   ❌ ${users[userId].firstName} offline, navbatga kira olmaydi`);
            socket.emit('error', { message: 'Siz offline ekansiz. Navbatga kirish uchun internet aloqangizni tekshiring.' });
            return;
        }
        
        if (!users[userId].hasSelectedGender) {
            console.log(`   ⚠️ ${users[userId].firstName} gender tanlamagan`);
            socket.emit('show_gender_selection', {
                mandatory: true,
                message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
            });
            return;
        }
        
        if (queue.includes(userId)) {
            console.log(`   ℹ️ ${users[userId].firstName} allaqachon navbatda`);
            socket.emit('queue_joined', {
                position: queue.indexOf(userId) + 1,
                total: queue.length
            });
            return;
        }
        
        queue.push(userId);
        
        console.log(`   ✅ ${users[userId].firstName} navbatga qo'shildi (o'rin: ${queue.length})`);
        
        socket.emit('queue_joined', {
            position: queue.length,
            total: queue.length
        });
        
        setTimeout(() => findAndStartDuels(), 500);
    });
    
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        
        if (!userId) {
            console.log(`❌ Navbatdan chiqish: foydalanuvchi topilmadi`);
            return;
        }
        
        console.log(`🚪 Navbatdan chiqish: ${users[userId]?.firstName || userId}`);
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            console.log(`   ✅ ${users[userId]?.firstName || userId} navbatdan chiqdi`);
            updateWaitingCount();
        }
    });
    
    // ==================== VOTE HANDLING ====================
    socket.on('vote', (data) => {
        const userId = socket.userId;
        const { duelId, choice } = data;
        
        console.log(`🗳️ Ovoz berish: ${userId} -> ${choice} (duel: ${duelId})`);
        
        if (!activeDuels[duelId] || activeDuels[duelId].ended) {
            console.log(`   ❌ Duel ${duelId} tugagan yoki mavjud emas`);
            socket.emit('error', { message: 'Bu duel tugagan' });
            return;
        }
        
        const duel = activeDuels[duelId];
        if (duel.player1 !== userId && duel.player2 !== userId) {
            console.log(`   ❌ Foydalanuvchi ${userId} bu duelda emas`);
            socket.emit('error', { message: 'Siz bu duelda emassiz' });
            return;
        }
        
        // O'zini tekshirish - online emas bo'lsa
        if (!users[userId]?.connected) {
            console.log(`   ❌ ${users[userId]?.firstName} offline, ovoz bera olmaydi`);
            socket.emit('error', { message: 'Siz offline ekansiz. Ovoz berish uchun internet aloqangizni tekshiring.' });
            return;
        }
        
        duel.votes[userId] = choice;
        console.log(`   ✅ ${users[userId]?.firstName} ovoz berdi: ${choice}`);
        
        if (choice === 'super_like') {
            const user = users[userId];
            if (user.dailySuperLikes <= 0) {
                console.log(`   ⚠️ ${users[userId]?.firstName} da SUPER LIKE qolmagan`);
                socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                delete duel.votes[userId];
                return;
            }
            user.dailySuperLikes--;
            
            console.log(`   💎 ${users[userId]?.firstName} SUPER LIKE ishlatdi (qolgan: ${user.dailySuperLikes})`);
            
            socket.emit('super_like_used', {
                remaining: user.dailySuperLikes
            });
        }
        
        // Har ikki o'yinchi ovoz bergandan keyin natijani qayta ishlash
        if (duel.votes[duel.player1] && duel.votes[duel.player2]) {
            console.log(`   📊 Duel ${duelId} da ikkala o'yinchi ham ovoz berdi`);
            processDuelResult(duelId);
        } else {
            // Faqat bitta o'yinchi ovoz berganda, kutish holatini yuborish
            const waitingPlayerId = duel.player1 === userId ? duel.player2 : duel.player1;
            const waitingPlayer = users[waitingPlayerId];
            
            if (waitingPlayer && waitingPlayer.connected && waitingPlayer.socketId) {
                const waitingSocket = io.sockets.sockets.get(waitingPlayer.socketId);
                if (waitingSocket) {
                    waitingSocket.emit('waiting_response', {});
                    console.log(`   ⏳ ${waitingPlayer.firstName} ga waiting_response yuborildi`);
                }
            }
        }
    });
    
    // ==================== CHAT MANAGEMENT ====================
    socket.on('send_chat_invite', (data) => {
        const userId = socket.userId;
        const { partnerId } = data;
        
        if (!userId || !partnerId || !users[userId] || !users[partnerId]) {
            console.log(`❌ Chat taklifi: foydalanuvchilar topilmadi`);
            socket.emit('error', { message: 'Chat taklifi yuborishda xatolik' });
            return;
        }
        
        // Foydalanuvchi online emas bo'lsa
        if (!users[userId].connected) {
            console.log(`❌ ${users[userId]?.firstName} offline, chat taklif yubora olmaydi`);
            socket.emit('error', { message: 'Siz offline ekansiz. Chat taklifi yuborish uchun internet aloqangizni tekshiring.' });
            return;
        }
        
        // Raqib online emas bo'lsa
        if (!users[partnerId].connected) {
            console.log(`❌ ${users[partnerId]?.firstName} offline, chat taklif yuborib bo'lmaydi`);
            socket.emit('error', { message: 'Raqib hozir offline. Chat taklifi yuborish mumkin emas.' });
            return;
        }
        
        console.log(`💬 Chat taklifi: ${users[userId].firstName} -> ${users[partnerId].firstName}`);
        
        // Chat so'rovini yaratish
        createChatRequest(userId, partnerId);
        
        socket.emit('chat_invite_sent', {
            partnerName: users[partnerId].firstName,
            message: `${users[partnerId].firstName} ga chat taklifi yuborildi. Ikkalangiz ham rozilik bersangiz, chat ochiladi.`
        });
    });
    
    socket.on('accept_chat_invite', (data) => {
        const userId = socket.userId;
        const { requestId } = data;
        
        if (!userId || !requestId) {
            console.log(`❌ Chat taklifini qabul qilish: ma'lumotlar yetarli emas`);
            return;
        }
        
        console.log(`✅ Chat taklifini qabul qilish: ${users[userId]?.firstName} -> ${requestId}`);
        
        // Chat so'rovini qabul qilish
        const accepted = acceptChatRequest(requestId, userId);
        
        if (accepted) {
            socket.emit('chat_invite_accepted', {
                message: 'Chat taklifini qabul qildingiz! Endi suhbatlashingiz mumkin.'
            });
        }
    });
    
    socket.on('reject_chat_invite', (data) => {
        const userId = socket.userId;
        const { requestId } = data;
        
        if (!userId || !requestId) {
            console.log(`❌ Chat taklifini rad etish: ma'lumotlar yetarli emas`);
            return;
        }
        
        console.log(`❌ Chat taklifini rad etish: ${users[userId]?.firstName} -> ${requestId}`);
        
        // Chat so'rovini rad etish
        const rejected = rejectChatRequest(requestId, userId);
        
        if (rejected) {
            socket.emit('chat_invite_rejected', {
                message: 'Chat taklifini rad etdingiz.'
            });
        }
    });
    
    // ==================== CREATE CHAT LINK ====================
    socket.on('create_chat_link', (data) => {
        const userId = socket.userId;
        const { partnerId, partnerName, type } = data;
        
        if (!userId || !partnerId || !users[userId] || !users[partnerId]) {
            console.log(`❌ Chat link yaratish: foydalanuvchilar topilmadi`);
            socket.emit('error', { message: 'Chat link yaratishda xatolik' });
            return;
        }
        
        console.log(`🔗 Chat link yaratish so'rovi: ${users[userId].firstName} -> ${users[partnerId].firstName}`);
        
        // Foydalanuvchi online emas bo'lsa
        if (!users[userId].connected) {
            console.log(`❌ ${users[userId].firstName} offline, chat link yarata olmaydi`);
            socket.emit('error', { message: 'Siz offline ekansiz. Chat uchun internet aloqangizni tekshiring.' });
            return;
        }
        
        // Raqib online emas bo'lsa
        if (!users[partnerId].connected) {
            console.log(`❌ ${users[partnerId].firstName} offline, chat link yaratib bo'lmaydi`);
            socket.emit('error', { message: 'Raqib hozir offline. Chat ochish mumkin emas.' });
            return;
        }
        
        // Telegram username borligini tekshirish
        const partnerUsername = users[partnerId].username;
        if (!partnerUsername) {
            console.log(`❌ ${users[partnerId].firstName} ning Telegram username'i yo'q`);
            socket.emit('chat_link_error', {
                message: `${users[partnerId].firstName} ning Telegram username'i mavjud emas. Chat ochib bo'lmaydi.`,
                partnerName: users[partnerId].firstName
            });
            return;
        }
        
        // Telegram chat linkini yaratish
        const chatLink = `https://t.me/${partnerUsername}`;
        
        console.log(`✅ Telegram chat linki yaratildi: ${chatLink}`);
        
        socket.emit('chat_link_created', {
            chatLink: chatLink,
            partnerId: partnerId,
            partnerName: users[partnerId].firstName,
            partnerUsername: partnerUsername,
            message: `${users[partnerId].firstName} bilan Telegram chat ochildi. Chatga o'tish uchun linkni bosing.`
        });
    });
    
    // ==================== PROFILE MANAGEMENT ====================
    socket.on('update_profile', (data) => {
        const userId = socket.userId;
        if (!userId || !users[userId]) {
            console.log(`❌ Profil yangilash: foydalanuvchi topilmadi`);
            return;
        }
        
        console.log(`📝 Profil yangilash: ${users[userId].firstName}`);
        
        const user = users[userId];
        
        if (data.bio !== undefined) {
            user.bio = data.bio;
            console.log(`   📝 Bio yangilandi`);
        }
        
        if (data.gender !== undefined) {
            const oldGender = user.gender;
            user.gender = data.gender;
            console.log(`   👤 Gender yangilandi: ${oldGender} -> ${data.gender}`);
            
            // Gender o'zgarganda navbatdan chiqarish
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(`   📝 Navbatdan chiqarildi (gender o'zgargani uchun)`);
            }
            
            setTimeout(() => {
                if (!queue.includes(userId) && user.hasSelectedGender && user.connected) {
                    queue.push(userId);
                    updateWaitingCount();
                    findAndStartDuels();
                    console.log(`   📝 Yangi gender bilan navbatga qo'shildi`);
                }
            }, 500);
        }
        
        if (data.filter !== undefined) {
            user.filter = data.filter;
            console.log(`   🎯 Filter yangilandi: ${data.filter}`);
            
            // Filter o'zgarganda navbatdan chiqarish
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(`   📝 Navbatdan chiqarildi (filter o'zgargani uchun)`);
            }
            
            setTimeout(() => {
                if (!queue.includes(userId) && user.hasSelectedGender && user.connected) {
                    queue.push(userId);
                    updateWaitingCount();
                    findAndStartDuels();
                    console.log(`   📝 Yangi filter bilan navbatga qo'shildi`);
                }
            }, 500);
        }
        
        socket.emit('profile_updated', {
            bio: user.bio,
            gender: user.gender,
            filter: user.filter,
            hasSelectedGender: user.hasSelectedGender,
            mutualMatchesCount: user.mutualMatchesCount,
            friendsCount: user.friendsCount
        });
        
        console.log(`   ✅ ${users[userId].firstName} ga profile_updated yuborildi`);
    });
    
    // ==================== FRIENDS MANAGEMENT ====================
    socket.on('get_friends_list', () => {
        const userId = socket.userId;
        if (!userId || !users[userId]) {
            console.log(`❌ Do'stlar ro'yxati: foydalanuvchi topilmadi`);
            return;
        }
        
        console.log(`👥 Do'stlar ro'yxati so'rovi: ${users[userId].firstName}`);
        
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
                matches: friend.matches,
                isMutual: true,
                chatEnabled: friend.connected // Faqat online bo'lsa chat mumkin
            };
        }).filter(friend => friend !== null);
        
        console.log(`   📊 ${friendsList.length} ta do'st topildi, ${friendsList.filter(f => f.online).length} ta online`);
        
        socket.emit('friends_list', {
            friends: friendsList,
            total: friendsList.length,
            online: friendsList.filter(f => f.online).length
        });
        
        console.log(`   ✅ ${users[userId].firstName} ga friends_list yuborildi`);
    });
    
    // ==================== REMATCH REQUEST ====================
    socket.on('request_rematch', (data) => {
        const userId = socket.userId;
        const opponentId = data.opponentId;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) {
            console.log(`❌ Rematch so'rovi: foydalanuvchilar topilmadi`);
            return;
        }
        
        // Foydalanuvchi online emas bo'lsa
        if (!users[userId].connected) {
            console.log(`❌ ${users[userId].firstName} offline, rematch so'ra olmaydi`);
            return;
        }
        
        // Raqib online emas bo'lsa
        if (!users[opponentId].connected) {
            console.log(`❌ ${users[opponentId].firstName} offline, rematch so'rab bo'lmaydi`);
            socket.emit('error', { message: 'Raqib hozir offline. Rematch sorash mumkin emas.' });
            return;
        }
        
        console.log(`🔄 Rematch so'rovi: ${users[userId].firstName} -> ${users[opponentId].firstName} (ikkovi ham online)`);
        
        const opponentSocket = io.sockets.sockets.get(users[opponentId].socketId);
        if (opponentSocket) {
            opponentSocket.emit('rematch_request', {
                opponentId: userId,
                opponentName: users[userId].firstName,
                opponentPhoto: users[userId].photoUrl
            });
            console.log(`   ✅ ${users[opponentId].firstName} ga rematch_request yuborildi`);
        }
    });
    
    socket.on('accept_rematch', (data) => {
        const userId = socket.userId;
        const opponentId = data.opponentId;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) {
            console.log(`❌ Rematch qabul qilish: foydalanuvchilar topilmadi`);
            return;
        }
        
        // Ikkalasi ham online bo'lishi kerak
        if (!users[userId].connected || !users[opponentId].connected) {
            console.log(`❌ Rematch qabul qilish: foydalanuvchilardan biri offline`);
            socket.emit('error', { message: 'Rematch qabul qilish uchun ikkalangiz ham online bolishingiz kerak.' });
            return;
        }
        
        console.log(`🔄 Rematch qabul qilindi: ${users[userId].firstName} va ${users[opponentId].firstName} (ikkovi ham online)`);
        
        const userIndex = queue.indexOf(userId);
        const opponentIndex = queue.indexOf(opponentId);
        
        if (userIndex > -1) queue.splice(userIndex, 1);
        if (opponentIndex > -1) queue.splice(opponentIndex, 1);
        
        startDuel(userId, opponentId);
    });
    
    // ==================== PING/PONG - ONLINE STATUS ====================
    socket.on('ping', () => {
        const userId = socket.userId;
        if (userId && users[userId]) {
            users[userId].lastActive = new Date();
            socket.emit('pong', { timestamp: new Date().toISOString() });
        }
    });
    
    // ==================== DISCONNECTION ====================
    socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId && users[userId]) {
            console.log(`❌ Ulanish uzildi: ${users[userId].firstName} (${userId})`);
            
            users[userId].connected = false;
            users[userId].lastActive = new Date();
            
            // Navbatdan chiqarish
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(`   📝 ${users[userId].firstName} navbatdan chiqarildi (offline bo'ldi)`);
                updateWaitingCount();
            }
            
            // Faol duellarni tugatish
            for (const duelId in activeDuels) {
                const duel = activeDuels[duelId];
                if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
                    duel.ended = true;
                    
                    const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
                    const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
                    
                    console.log(`   ⚔️ Duel ${duelId} tugatildi (${users[userId].firstName} chiqib ketdi)`);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('opponent_left');
                        console.log(`   ✅ ${users[opponentId]?.firstName} ga opponent_left yuborildi`);
                    }
                    
                    delete activeDuels[duelId];
                    break;
                }
            }
            
            // Chat so'rovlarini yangilash
            Object.values(chatRequests).forEach(request => {
                if (request.from === userId || request.to === userId) {
                    if (request.status === 'pending') {
                        request.status = 'cancelled';
                        console.log(`   💬 ${users[userId].firstName} uchun chat so'rovi bekor qilindi`);
                    }
                }
            });
        }
    });
});

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - O\'ZARO MATCH VA CHAT TIZIMI');
    console.log('='.repeat(70));
    console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log('🌐 WebSocket URL: ws://0.0.0.0:${PORT}');
    console.log('='.repeat(70));
    console.log('✅ O\'zaro Match tizimi faollashtirildi');
    console.log('✅ Do\'stlar ro\'yxati avtomatik yangilanadi');
    console.log('✅ OFFLINE foydalanuvchilar duellarda ishtirok ETMAYDI');
    console.log('✅ Har ikki tomon like bersa - AVTOMATIK chat taklifi');
    console.log('✅ Ikkalasi ham chatni qabul qilsa - Telegram chat ochiladi');
    console.log('='.repeat(70));
    console.log('\n📈 Server statistikasi har 30 soniyada yangilanadi...\n');
});

// ==================== BACKGROUND TASKS ====================

// Kunlik limitlarni yangilash
setInterval(() => {
    const today = new Date().toDateString();
    let resetCount = 0;
    
    Object.values(users).forEach(user => {
        if (user.lastResetDate !== today) {
            user.dailySuperLikes = 3;
            user.lastResetDate = today;
            resetCount++;
            
            const userSocket = io.sockets.sockets.get(user.socketId);
            if (userSocket) {
                userSocket.emit('daily_reset', { superLikes: 3 });
            }
        }
    });
    
    if (resetCount > 0) {
        console.log(`🔄 ${resetCount} ta foydalanuvchi uchun kunlik SUPER LIKE lar qayta tiklandi`);
    }
}, 60000); // Har daqiqa tekshirish

// Server statistikasini log qilish
setInterval(() => {
    const totalUsers = Object.keys(users).length;
    const onlineUsers = Object.values(users).filter(u => u.connected).length;
    const onlineInQueue = queue.filter(userId => {
        const user = users[userId];
        return user && user.connected;
    }).length;
    
    console.log(`📊 SERVER STATS: 
    Jami foydalanuvchilar: ${totalUsers} ta
    Onlayn foydalanuvchilar: ${onlineUsers} ta
    Navbatdagilar (online): ${onlineInQueue}/${queue.length} ta
    Faol Duellar: ${Object.keys(activeDuels).length} ta
    O'zaro Matchlar: ${Object.keys(mutualMatches).length} ta
    Chat So'rovlari: ${Object.keys(chatRequests).length} ta`);
    
    // Online foydalanuvchilar ro'yxati
    const onlineList = Object.values(users)
        .filter(u => u.connected)
        .map(u => u.firstName)
        .slice(0, 5); // Faqat 5 tasini ko'rsatish
    
    if (onlineList.length > 0) {
        console.log(`   Onlaynlar: ${onlineList.join(', ')}${onlineList.length < onlineUsers ? '...' : ''}`);
    }
}, 30000); // Har 30 soniyada

// Bo'sh foydalanuvchilarni tozalash (24 soatdan keyin)
setInterval(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let removedCount = 0;
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        if (user.lastActive < twentyFourHoursAgo && !user.connected) {
            delete users[userId];
            
            // Navbatdan ham olib tashlash
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
            }
            
            // Mutual matches dan olib tashlash
            if (mutualMatches[userId]) {
                delete mutualMatches[userId];
            }
            
            removedCount++;
        }
    });
    
    if (removedCount > 0) {
        console.log(`🗑️ ${removedCount} ta eski (24 soat offline) foydalanuvchi tozalandi`);
        updateWaitingCount();
    }
}, 3600000); // Har soat

// Navbat monitoringi (faqat online foydalanuvchilar)
setInterval(() => {
    const onlineInQueue = queue.filter(userId => {
        const user = users[userId];
        return user && user.connected;
    }).length;
    
    if (queue.length > 0) {
        console.log(`📝 NAVBAT MONITORING: ${queue.length} ta foydalanuvchi (${onlineInQueue} ta online)`);
        queue.forEach((userId, index) => {
            const user = users[userId];
            if (user) {
                const status = user.connected ? '✅ online' : '❌ offline';
                console.log(`   ${index + 1}. ${user.firstName} (${user.gender}, filter: ${user.filter}) - ${status}`);
            }
        });
    }
}, 60000); 

// Automatik duel boshlash (faqat online foydalanuvchilar)
setInterval(() => {
    findAndStartDuels();
}, 5000); // Har 5 soniyada duel qidirish

// OFFLINE bo'lganlarni navbatdan avtomatik olib tashlash
setInterval(() => {
    let removedCount = 0;
    for (let i = queue.length - 1; i >= 0; i--) {
        const userId = queue[i];
        const user = users[userId];
        if (!user || !user.connected) {
            queue.splice(i, 1);
            removedCount++;
        }
    }
    
    if (removedCount > 0) {
        console.log(`⚠️ ${removedCount} ta OFFLINE foydalanuvchi navbatdan chiqarildi`);
        updateWaitingCount();
    }
}, 10000); // Har 10 soniyada

// Eski chat so'rovlarini tozalash (1 soatdan keyin)
setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let removedCount = 0;
    
    Object.keys(chatRequests).forEach(requestId => {
        const request = chatRequests[requestId];
        if (request.timestamp < oneHourAgo && request.status === 'pending') {
            delete chatRequests[requestId];
            removedCount++;
        }
    });
    
    if (removedCount > 0) {
        console.log(`🗑️ ${removedCount} ta eski (1 soat) chat so'rovi tozalandi`);
    }
}, 1800000); // Har 30 daqiqa

console.log('\n✅ Server background tasklari ishga tushdi');
console.log('📊 Automatik monitoring aktiv');
console.log('🎮 Like Duel Server to\'liq tayyor!\n');