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
        activeDuels: Object.keys(activeDuels).length,
        mutualMatches: Object.keys(mutualMatches).length
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
        activeDuels: Object.keys(activeDuels).length,
        totalMutualMatches: Object.keys(mutualMatches).length
    });
});

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const users = {};
const queue = [];
const activeDuels = {};
const mutualMatches = {};
const matchHistory = {};

// ==================== YORDAMCHI FUNKSIYALAR ====================
function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

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

function findOpponentFor(userId) {
    const user = users[userId];
    if (!user || !user.hasSelectedGender || !user.gender) return null;
    
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent) continue;
        
        if (!opponent.hasSelectedGender || !opponent.gender) continue;
        
        if (!checkGenderCompatibility(user, opponent)) continue;
        
        if (!checkFilterCompatibility(user, opponent)) continue;
        
        if (!checkFilterCompatibility(opponent, user)) continue;
        
        return opponentId;
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

// ==================== MUTUAL MATCH FUNKSIYALARI ====================
function addMutualMatch(userId1, userId2) {
    if (!mutualMatches[userId1]) {
        mutualMatches[userId1] = [];
    }
    if (!mutualMatches[userId1].includes(userId2)) {
        mutualMatches[userId1].push(userId2);
    }
    
    if (!mutualMatches[userId2]) {
        mutualMatches[userId2] = [];
    }
    if (!mutualMatches[userId2].includes(userId1)) {
        mutualMatches[userId2].push(userId1);
    }
    
    console.log(`✅ O'zaro match qo'shildi: ${userId1} <-> ${userId2}`);
    
    // Do'stlar sonini yangilash
    if (users[userId1]) {
        users[userId1].mutualMatchesCount = mutualMatches[userId1].length;
        users[userId1].friendsCount = mutualMatches[userId1].length;
    }
    
    if (users[userId2]) {
        users[userId2].mutualMatchesCount = mutualMatches[userId2].length;
        users[userId2].friendsCount = mutualMatches[userId2].length;
    }
    
    // Har ikki foydalanuvchiga xabar yuborish
    notifyMutualMatchAdded(userId1, userId2);
    notifyMutualMatchAdded(userId2, userId1);
}

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

function getMutualMatches(userId) {
    return mutualMatches[userId] || [];
}

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
        ended: false,
        resultsSent: false,
        matchResult: false // Yangi: match natijasi bo'lsa true
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
    if (!duel || duel.ended || duel.resultsSent) return;
    
    duel.ended = true;
    duel.resultsSent = true;
    
    const player1Vote = duel.votes[duel.player1];
    const player2Vote = duel.votes[duel.player2];
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    // MATCH holati - O'ZARO LIKE BERSA
    if ((player1Vote === 'like' || player1Vote === 'super_like') && 
        (player2Vote === 'like' || player2Vote === 'super_like')) {
        
        console.log(`🎉 Match natijasi: ${duel.player1} va ${duel.player2} bir-birini yoqtirdi!`);
        
        duel.matchResult = true; // Match natijasi borligini belgilaymiz
        
        player1.matches++;
        player2.matches++;
        player1.duels++;
        player2.duels++;
        player1.wins++;
        player2.wins++;
        
        // Mukofotlar
        let player1Reward = 50;
        let player2Reward = 50;
        
        if (player1Vote === 'super_like') {
            player1Reward += 20;
        }
        if (player2Vote === 'super_like') {
            player2Reward += 20;
        }
        
        player1.coins += player1Reward;
        player2.coins += player2Reward;
        
        // O'ZARO MATCH QO'SHISH
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
                    gender: player2.gender
                },
                rewards: {
                    coins: player1Reward,
                    xp: 30
                },
                newRating: player1.rating,
                isMutual: true
            });
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
                    gender: player1.gender
                },
                rewards: {
                    coins: player2Reward,
                    xp: 30
                },
                newRating: player2.rating,
                isMutual: true
            });
        }
        
        // MATCH BO'LGANDAN KEYIN NAVBATGA QO'SHMAYMIZ!
        // Faqat duelni o'chirib tashlaymiz
        setTimeout(() => {
            delete activeDuels[duelId];
            console.log(`✅ Duel ${duelId} o'chirildi. O'yinchilar navbatga qo'shilmaydi!`);
        }, 500);
        
    } else if (player1Vote === 'like' || player1Vote === 'super_like') {
        // Faqat player1 like berdi
        console.log(`❤️ Faqat ${duel.player1} like berdi`);
        
        player1.duels++;
        const coins = player1Vote === 'super_like' ? 30 : 10;
        player1.coins += coins;
        player1.totalLikes++;
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('liked_only', {
                opponentName: player2.firstName,
                reward: { coins: coins, xp: 5 }
            });
        }
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('no_match', {});
        }
        
        // Navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duel.player1, duel.player2);
            delete activeDuels[duelId];
        }, 1000);
        
    } else if (player2Vote === 'like' || player2Vote === 'super_like') {
        // Faqat player2 like berdi
        console.log(`❤️ Faqat ${duel.player2} like berdi`);
        
        player2.duels++;
        const coins = player2Vote === 'super_like' ? 30 : 10;
        player2.coins += coins;
        player2.totalLikes++;
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('liked_only', {
                opponentName: player1.firstName,
                reward: { coins: coins, xp: 5 }
            });
        }
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('no_match', {});
        }
        
        // Navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duel.player1, duel.player2);
            delete activeDuels[duelId];
        }, 1000);
        
    } else {
        // Hech kim like bermadi
        console.log(`❌ Hech kim like bermadi: ${duel.player1} va ${duel.player2}`);
        
        player1.duels++;
        player2.duels++;
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) player1Socket.emit('no_match', {});
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) player2Socket.emit('no_match', {});
        
        // Navbatga qaytarish
        setTimeout(() => {
            returnPlayersToQueue(duel.player1, duel.player2);
            delete activeDuels[duelId];
        }, 1000);
    }
}

function handleDuelTimeout(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    duel.resultsSent = true;
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    const player1Socket = io.sockets.sockets.get(player1?.socketId);
    const player2Socket = io.sockets.sockets.get(player2?.socketId);
    
    if (player1Socket) player1Socket.emit('timeout', {});
    if (player2Socket) player2Socket.emit('timeout', {});
    
    // Navbatga qaytarish
    setTimeout(() => {
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
    }, 1000);
}

function returnPlayersToQueue(player1Id, player2Id) {
    [player1Id, player2Id].forEach(playerId => {
        const player = users[playerId];
        if (player && player.hasSelectedGender && !queue.includes(playerId)) {
            queue.push(playerId);
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
        
        if (!users[userId]) {
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
        } else {
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = new Date();
            
            if (data.gender) users[userId].gender = data.gender;
            if (data.hasSelectedGender !== undefined) users[userId].hasSelectedGender = data.hasSelectedGender;
            if (data.bio !== undefined) users[userId].bio = data.bio;
            if (data.filter !== undefined) users[userId].filter = data.filter;
            
            // Mutual matches sonini yangilash
            users[userId].mutualMatchesCount = getMutualMatches(userId)?.length || 0;
            users[userId].friendsCount = getMutualMatches(userId)?.length || 0;
        }
        
        socket.userId = userId;
        
        // Kunlik reset tekshirish
        const today = new Date().toDateString();
        if (users[userId].lastResetDate !== today) {
            users[userId].dailySuperLikes = 3;
            users[userId].lastResetDate = today;
        }
        
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
        
        if (!users[userId].hasSelectedGender) {
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
        
        duel.votes[userId] = choice;
        
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
        
        if (data.filter !== undefined) {
            user.filter = data.filter;
            
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
            filter: user.filter,
            hasSelectedGender: user.hasSelectedGender,
            mutualMatchesCount: user.mutualMatchesCount,
            friendsCount: user.friendsCount
        });
    });
    
    socket.on('get_friends_list', () => {
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
                matches: friend.matches,
                isMutual: true
            };
        }).filter(friend => friend !== null);
        
        socket.emit('friends_list', {
            friends: friendsList,
            total: friendsList.length,
            online: friendsList.filter(f => f.online).length
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
        
        const userIndex = queue.indexOf(userId);
        const opponentIndex = queue.indexOf(opponentId);
        
        if (userIndex > -1) queue.splice(userIndex, 1);
        if (opponentIndex > -1) queue.splice(opponentIndex, 1);
        
        startDuel(userId, opponentId);
    });
    
    socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId && users[userId]) {
            users[userId].connected = false;
            users[userId].lastActive = new Date();
            
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                updateWaitingCount();
            }
            
            for (const duelId in activeDuels) {
                const duel = activeDuels[duelId];
                if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
                    duel.ended = true;
                    
                    const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
                    const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('opponent_left');
                    }
                    
                    delete activeDuels[duelId];
                    break;
                }
            }
        }
    });
});

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - O\'ZARO MATCH TIZIMI (TUZATILGAN)');
    console.log('='.repeat(70));
    console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log('🌐 WebSocket URL: wss://like-duel.onrender.com');
    console.log('='.repeat(70));
    console.log('✅ O\'zaro Match tizimi faollashtirildi');
    console.log('✅ Ikkala tomon like bersa - navbatga O\'TMAYDI');
    console.log('✅ Do\'stlar ro\'yxati avtomatik yangilanadi');
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

// Har 30 soniyada faol duel va navbat holatini log qilish
setInterval(() => {
    console.log(`📊 Stats: Users: ${Object.keys(users).length}, Queue: ${queue.length}, Active Duels: ${Object.keys(activeDuels).length}, Mutual Matches: ${Object.keys(mutualMatches).length}`);
}, 30000);