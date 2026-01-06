// server.js - FULL WORKING LIKE DUEL SERVER
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for testing
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
});

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// ==================== ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    const stats = {
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: {
            total: Object.keys(users).length,
            online: Object.values(users).filter(u => u.connected).length,
            inQueue: queue.length,
            inDuels: Object.keys(activeDuels).length
        }
    };
    res.json(stats);
});

app.get('/api/stats', (req, res) => {
    res.json({
        server: 'Like Duel Server',
        version: '1.0.0',
        users: Object.keys(users).length,
        online: Object.values(users).filter(u => u.connected).length,
        queue: queue.length,
        activeDuels: Object.keys(activeDuels).length,
        friendships: Object.keys(friendships).length
    });
});

// Serve static files
app.use(express.static('public'));

// ==================== GLOBAL VARIABLES ====================
const users = {};           // {userId: userObject}
const queue = [];          // [userId1, userId2, ...]
const activeDuels = {};    // {duelId: duelObject}
const friendships = {};    // {userId: [friendId1, friendId2, ...]}
const chatRequests = {};   // {requestId: requestObject}

// ==================== HELPER FUNCTIONS ====================
function generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function isGenderCompatible(user1, user2) {
    if (!user1 || !user2) return false;
    
    // Agar gender tanlanmagan bo'lsa, har qanday bilan duel
    if (!user1.gender || !user2.gender) return true;
    
    // Agar "all" tanlangan bo'lsa, har qanday bilan
    if (user1.gender === 'all' || user2.gender === 'all') return true;
    
    // Erkak faqat ayol bilan, ayol faqat erkak bilan
    return user1.gender !== user2.gender;
}

function findOpponentFor(userId) {
    const user = users[userId];
    if (!user || !user.connected) return null;
    
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent || !opponent.connected) continue;
        
        // Gender compatibility check
        if (!isGenderCompatible(user, opponent)) continue;
        
        // Filter check
        if (user.filter && user.filter !== 'all') {
            if (user.filter !== opponent.gender) continue;
        }
        
        if (opponent.filter && opponent.filter !== 'all') {
            if (opponent.filter !== user.gender) continue;
        }
        
        return opponentId;
    }
    
    return null;
}

function startDuel(player1Id, player2Id) {
    const duelId = generateId('duel_');
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    if (!player1 || !player2) {
        console.error('❌ Cannot start duel, players not found');
        return;
    }
    
    // Remove from queue
    const index1 = queue.indexOf(player1Id);
    const index2 = queue.indexOf(player2Id);
    if (index1 > -1) queue.splice(index1, 1);
    if (index2 > -1) queue.splice(index2, 1);
    
    console.log(`🎮 Starting duel ${duelId}: ${player1.name} vs ${player2.name}`);
    
    // Create duel object
    activeDuels[duelId] = {
        id: duelId,
        player1: player1Id,
        player2: player2Id,
        votes: {},
        startTime: Date.now(),
        ended: false,
        resultSent: false
    };
    
    // Send duel started to player1
    const socket1 = io.sockets.sockets.get(player1.socketId);
    if (socket1) {
        socket1.emit('duel_started', {
            duelId: duelId,
            opponent: {
                id: player2Id,
                name: player2.name,
                username: player2.username,
                photo: player2.photo,
                rating: player2.rating,
                matches: player2.matches,
                level: player2.level || 1,
                gender: player2.gender,
                online: player2.connected
            },
            timeLeft: 20
        });
        console.log(` ✅ Duel data sent to ${player1.name}`);
    }
    
    // Send duel started to player2
    const socket2 = io.sockets.sockets.get(player2.socketId);
    if (socket2) {
        socket2.emit('duel_started', {
            duelId: duelId,
            opponent: {
                id: player1Id,
                name: player1.name,
                username: player1.username,
                photo: player1.photo,
                rating: player1.rating,
                matches: player1.matches,
                level: player1.level || 1,
                gender: player1.gender,
                online: player1.connected
            },
            timeLeft: 20
        });
        console.log(` ✅ Duel data sent to ${player2.name}`);
    }
    
    // Set timeout
    setTimeout(() => {
        if (activeDuels[duelId] && !activeDuels[duelId].ended) {
            console.log(`⏰ Duel ${duelId} timeout`);
            handleDuelTimeout(duelId);
        }
    }, 20000);
}

function processDuelResult(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended || duel.resultSent) return;
    
    duel.ended = true;
    duel.resultSent = true;
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    const vote1 = duel.votes[duel.player1];
    const vote2 = duel.votes[duel.player2];
    
    console.log(`📊 Processing duel ${duelId} results:`);
    console.log(` ${player1?.name}: ${vote1 || 'no vote'}`);
    console.log(` ${player2?.name}: ${vote2 || 'no vote'}`);
    
    // CASE 1: MUTUAL MATCH (both liked)
    if ((vote1 === 'like' || vote1 === 'super_like') && 
        (vote2 === 'like' || vote2 === 'super_like')) {
        
        console.log(`🎉 MUTUAL MATCH! ${player1.name} & ${player2.name}`);
        
        // Create friendship
        if (!friendships[duel.player1]) friendships[duel.player1] = [];
        if (!friendships[duel.player2]) friendships[duel.player2] = [];
        
        if (!friendships[duel.player1].includes(duel.player2)) {
            friendships[duel.player1].push(duel.player2);
            console.log(` ✅ ${player1.name} -> ${player2.name} friendship added`);
        }
        
        if (!friendships[duel.player2].includes(duel.player1)) {
            friendships[duel.player2].push(duel.player1);
            console.log(` ✅ ${player2.name} -> ${player1.name} friendship added`);
        }
        
        // Update stats
        const reward1 = vote1 === 'super_like' ? 70 : 50;
        const reward2 = vote2 === 'super_like' ? 70 : 50;
        const ratingChange1 = vote1 === 'super_like' ? 30 : 25;
        const ratingChange2 = vote2 === 'super_like' ? 30 : 25;
        
        if (player1) {
            player1.matches++;
            player1.duels++;
            player1.wins++;
            player1.coins += reward1;
            player1.rating += ratingChange1;
            player1.totalLikes = (player1.totalLikes || 0) + 1;
            if (vote1 === 'super_like') player1.dailySuperLikes--;
        }
        
        if (player2) {
            player2.matches++;
            player2.duels++;
            player2.wins++;
            player2.coins += reward2;
            player2.rating += ratingChange2;
            player2.totalLikes = (player2.totalLikes || 0) + 1;
            if (vote2 === 'super_like') player2.dailySuperLikes--;
        }
        
        // Send match result to player1
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        if (socket1) {
            socket1.emit('match_result', {
                result: 'match',
                partner: {
                    id: duel.player2,
                    name: player2.name,
                    username: player2.username,
                    photo: player2.photo,
                    rating: player2.rating,
                    matches: player2.matches,
                    level: player2.level || 1,
                    gender: player2.gender,
                    online: player2.connected
                },
                coinsEarned: reward1,
                ratingChange: ratingChange1,
                newRating: player1.rating,
                message: `${player2.name} bilan o'zaro match!`
            });
            console.log(` ✅ Match result sent to ${player1.name}`);
        }
        
        // Send match result to player2
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        if (socket2) {
            socket2.emit('match_result', {
                result: 'match',
                partner: {
                    id: duel.player1,
                    name: player1.name,
                    username: player1.username,
                    photo: player1.photo,
                    rating: player1.rating,
                    matches: player1.matches,
                    level: player1.level || 1,
                    gender: player1.gender,
                    online: player1.connected
                },
                coinsEarned: reward2,
                ratingChange: ratingChange2,
                newRating: player2.rating,
                message: `${player1.name} bilan o'zaro match!`
            });
            console.log(` ✅ Match result sent to ${player2.name}`);
        }
        
        // Send friends update
        setTimeout(() => {
            if (socket1) {
                socket1.emit('friends_updated', {
                    friends: getFriendsList(duel.player1),
                    count: friendships[duel.player1]?.length || 0
                });
            }
            if (socket2) {
                socket2.emit('friends_updated', {
                    friends: getFriendsList(duel.player2),
                    count: friendships[duel.player2]?.length || 0
                });
            }
        }, 1000);
    }
    // CASE 2: Only player1 liked
    else if (vote1 === 'like' || vote1 === 'super_like') {
        console.log(`❤️ Only ${player1?.name} liked`);
        
        const reward = vote1 === 'super_like' ? 20 : 10;
        
        if (player1) {
            player1.duels++;
            player1.coins += reward;
            player1.totalLikes = (player1.totalLikes || 0) + 1;
            if (vote1 === 'super_like') player1.dailySuperLikes--;
        }
        
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        
        if (socket1) {
            socket1.emit('liked_only', {
                opponentName: player2?.name,
                coins: reward,
                message: `${player2?.name} sizga like bermadi`
            });
        }
        
        if (socket2) {
            socket2.emit('no_match', {
                message: 'Siz like bermadingiz'
            });
        }
    }
    // CASE 3: Only player2 liked
    else if (vote2 === 'like' || vote2 === 'super_like') {
        console.log(`❤️ Only ${player2?.name} liked`);
        
        const reward = vote2 === 'super_like' ? 20 : 10;
        
        if (player2) {
            player2.duels++;
            player2.coins += reward;
            player2.totalLikes = (player2.totalLikes || 0) + 1;
            if (vote2 === 'super_like') player2.dailySuperLikes--;
        }
        
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        
        if (socket2) {
            socket2.emit('liked_only', {
                opponentName: player1?.name,
                coins: reward,
                message: `${player1?.name} sizga like bermadi`
            });
        }
        
        if (socket1) {
            socket1.emit('no_match', {
                message: 'Siz like bermadingiz'
            });
        }
    }
    // CASE 4: No one liked
    else {
        console.log(`❌ No match`);
        
        if (player1) player1.duels++;
        if (player2) player2.duels++;
        
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        
        if (socket1) socket1.emit('no_match', { message: 'Hech kim like bermadi' });
        if (socket2) socket2.emit('no_match', { message: 'Hech kim like bermadi' });
    }
    
    // Cleanup
    setTimeout(() => {
        returnToQueue(duel.player1);
        returnToQueue(duel.player2);
        delete activeDuels[duelId];
        console.log(`🗑️ Duel ${duelId} cleaned up`);
    }, 3000);
}

function handleDuelTimeout(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    duel.resultSent = true;
    
    console.log(`⏰ Duel ${duelId} timeout`);
    
    const socket1 = io.sockets.sockets.get(users[duel.player1]?.socketId);
    const socket2 = io.sockets.sockets.get(users[duel.player2]?.socketId);
    
    if (socket1) socket1.emit('timeout', { message: 'Vaqt tugadi' });
    if (socket2) socket2.emit('timeout', { message: 'Vaqt tugadi' });
    
    setTimeout(() => {
        returnToQueue(duel.player1);
        returnToQueue(duel.player2);
        delete activeDuels[duelId];
    }, 2000);
}

function returnToQueue(userId) {
    const user = users[userId];
    if (user && user.connected && !queue.includes(userId)) {
        queue.push(userId);
        console.log(`📝 ${user.name} returned to queue`);
        
        // Update waiting count
        updateWaitingCount();
    }
}

function getFriendsList(userId) {
    const friendIds = friendships[userId] || [];
    return friendIds.map(friendId => {
        const friend = users[friendId];
        if (!friend) return null;
        
        return {
            id: friend.id,
            name: friend.name,
            username: friend.username,
            photo: friend.photo,
            gender: friend.gender,
            rating: friend.rating,
            matches: friend.matches,
            online: friend.connected,
            lastActive: friend.lastActive
        };
    }).filter(friend => friend !== null);
}

function updateWaitingCount() {
    const total = queue.length;
    const onlineCount = queue.filter(id => users[id]?.connected).length;
    
    queue.forEach((userId, index) => {
        const user = users[userId];
        if (user && user.socketId) {
            const socket = io.sockets.sockets.get(user.socketId);
            if (socket) {
                socket.emit('waiting_count', {
                    position: index + 1,
                    total: total,
                    onlineCount: onlineCount
                });
            }
        }
    });
}

// ==================== SOCKET.IO EVENTS ====================
io.on('connection', (socket) => {
    console.log('✅ New connection:', socket.id);
    
    // ===== AUTHENTICATION =====
    socket.on('auth', (data) => {
        const userId = data.userId || 'user_' + Date.now();
        
        console.log(`🔐 Auth request: ${data.firstName || 'User'} (${userId})`);
        
        // Create or update user
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                name: data.firstName || 'User',
                username: data.username || 'user_' + Math.floor(Math.random() * 1000),
                photo: data.photoUrl || `https://ui-avatars.com/api/?name=${data.firstName || 'User'}`,
                gender: data.gender || null,
                hasSelectedGender: data.hasSelectedGender || false,
                filter: data.filter || 'all',
                rating: data.rating || 1500,
                coins: data.coins || 100,
                level: data.level || 1,
                xp: 0,
                matches: data.matches || 0,
                duels: data.duels || 0,
                wins: data.wins || 0,
                totalLikes: data.totalLikes || 0,
                friendsCount: 0,
                dailySuperLikes: 3,
                socketId: socket.id,
                connected: true,
                lastActive: Date.now()
            };
            console.log(` 👤 New user created: ${users[userId].name}`);
        } else {
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = Date.now();
            
            // Update data
            if (data.gender) users[userId].gender = data.gender;
            if (data.hasSelectedGender !== undefined) users[userId].hasSelectedGender = data.hasSelectedGender;
            if (data.filter) users[userId].filter = data.filter;
            
            console.log(` 👤 User reconnected: ${users[userId].name}`);
        }
        
        socket.userId = userId;
        
        // Calculate friends count
        users[userId].friendsCount = friendships[userId]?.length || 0;
        
        // Send auth success with friends list
        socket.emit('auth_ok', {
            ...users[userId],
            friends: getFriendsList(userId),
            winRate: users[userId].duels > 0 ? 
                Math.round((users[userId].wins / users[userId].duels) * 100) : 0
        });
        
        console.log(` ✅ ${users[userId].name} authenticated successfully`);
    });
    
    // ===== GENDER SELECTION =====
    socket.on('select_gender', (data) => {
        const userId = socket.userId;
        if (!userId || !users[userId]) {
            console.log('❌ Gender selection: user not found');
            return;
        }
        
        const gender = data.gender;
        console.log(`🎯 ${users[userId].name} selected gender: ${gender}`);
        
        users[userId].gender = gender;
        users[userId].hasSelectedGender = true;
        users[userId].filter = gender === 'all' ? 'all' : gender;
        
        socket.emit('gender_selected', {
            gender: gender,
            message: `Gender tanlandi! ${gender === 'male' ? 'Erkak' : gender === 'female' ? 'Ayol' : 'Hamma'} tanlandi`
        });
        
        console.log(` ✅ ${users[userId].name} gender updated`);
    });
    
    // ===== QUEUE MANAGEMENT =====
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        if (!userId || !users[userId]) {
            console.log('❌ Enter queue: user not authenticated');
            socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
            return;
        }
        
        const user = users[userId];
        
        console.log(`📝 ${user.name} wants to enter queue`);
        
        // Check gender
        if (!user.hasSelectedGender) {
            console.log(`⚠️ ${user.name} has no gender selected`);
            socket.emit('show_gender_selection', {
                mandatory: true,
                message: 'Queue ga kirish uchun gender tanlang!'
            });
            return;
        }
        
        // Check if already in queue
        if (queue.includes(userId)) {
            console.log(`ℹ️ ${user.name} already in queue`);
            socket.emit('queue_joined', {
                position: queue.indexOf(userId) + 1,
                total: queue.length
            });
            return;
        }
        
        // Add to queue
        queue.push(userId);
        
        console.log(` ✅ ${user.name} added to queue (position: ${queue.length})`);
        
        socket.emit('queue_joined', {
            position: queue.length,
            total: queue.length
        });
        
        // Try to find opponent
        setTimeout(() => {
            const opponentId = findOpponentFor(userId);
            if (opponentId) {
                startDuel(userId, opponentId);
            }
        }, 500);
    });
    
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        console.log(`🚪 ${users[userId]?.name || userId} leaving queue`);
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            console.log(` ✅ Removed from queue`);
            updateWaitingCount();
        }
    });
    
    // ===== VOTING =====
    socket.on('vote', (data) => {
        const userId = socket.userId;
        const { duelId, choice } = data;
        
        console.log(`🗳️ Vote from ${users[userId]?.name}: ${choice} (duel: ${duelId})`);
        
        const duel = activeDuels[duelId];
        if (!duel || duel.ended) {
            console.log(`❌ Duel ${duelId} not found or ended`);
            socket.emit('error', { message: 'Bu duel tugagan' });
            return;
        }
        
        // Check if user is in this duel
        if (duel.player1 !== userId && duel.player2 !== userId) {
            console.log(`❌ ${users[userId]?.name} not in this duel`);
            socket.emit('error', { message: 'Siz bu duelda emassiz' });
            return;
        }
        
        // Record vote
        duel.votes[userId] = choice;
        console.log(` ✅ ${users[userId]?.name} vote recorded: ${choice}`);
        
        // Super like check
        if (choice === 'super_like') {
            const user = users[userId];
            if (user && user.dailySuperLikes <= 0) {
                console.log(`⚠️ ${user.name} has no super likes left`);
                socket.emit('error', { message: 'Kunlik SUPER LIKE limiti tugadi' });
                delete duel.votes[userId];
                return;
            }
        }
        
        // If both voted, process result
        if (duel.votes[duel.player1] && duel.votes[duel.player2]) {
            console.log(`📊 Both players voted, processing result...`);
            processDuelResult(duelId);
        }
    });
    
    // ===== FRIENDS MANAGEMENT =====
    socket.on('get_friends_list', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        console.log(`👥 ${users[userId]?.name} requesting friends list`);
        
        const friendsList = getFriendsList(userId);
        
        socket.emit('friends_list', {
            friends: friendsList,
            count: friendsList.length,
            message: 'Do\'stlar ro\'yxati'
        });
        
        console.log(` ✅ Sent ${friendsList.length} friends to ${users[userId]?.name}`);
    });
    
    // ===== CHAT MANAGEMENT =====
    socket.on('send_chat_invite', (data) => {
        const userId = socket.userId;
        const { partnerId } = data;
        
        if (!userId || !partnerId || !users[userId] || !users[partnerId]) {
            socket.emit('error', { message: 'Chat taklifi yuborib bo\'lmadi' });
            return;
        }
        
        console.log(`💬 ${users[userId].name} -> ${users[partnerId].name} chat invite`);
        
        // Check if they are friends
        if (!friendships[userId]?.includes(partnerId)) {
            socket.emit('error', { message: 'Siz bu foydalanuvchi bilan do\'st emassiz!' });
            return;
        }
        
        const requestId = generateId('chat_');
        chatRequests[requestId] = {
            id: requestId,
            from: userId,
            to: partnerId,
            status: 'pending',
            timestamp: Date.now()
        };
        
        // Send to partner
        const partnerSocket = io.sockets.sockets.get(users[partnerId].socketId);
        if (partnerSocket) {
            partnerSocket.emit('chat_invite', {
                requestId: requestId,
                fromUserId: userId,
                fromUserName: users[userId].name,
                fromUserPhoto: users[userId].photo,
                message: `${users[userId].name} siz bilan chat qilishni xohlaydi!`
            });
        }
        
        socket.emit('chat_invite_sent', {
            partnerName: users[partnerId].name,
            message: 'Chat taklifi yuborildi'
        });
    });
    
    // ===== PROFILE MANAGEMENT =====
    socket.on('update_profile', (data) => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        console.log(`📝 ${users[userId].name} updating profile`);
        
        if (data.bio !== undefined) users[userId].bio = data.bio;
        if (data.gender !== undefined) users[userId].gender = data.gender;
        if (data.filter !== undefined) users[userId].filter = data.filter;
        
        socket.emit('profile_updated', {
            bio: users[userId].bio,
            gender: users[userId].gender,
            filter: users[userId].filter,
            hasSelectedGender: users[userId].hasSelectedGender
        });
    });
    
    // ===== PING/PONG =====
    socket.on('ping', () => {
        const userId = socket.userId;
        if (userId && users[userId]) {
            users[userId].lastActive = Date.now();
            socket.emit('pong', { timestamp: Date.now() });
        }
    });
    
    // ===== DISCONNECTION =====
    socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId && users[userId]) {
            console.log(`❌ ${users[userId].name} disconnected`);
            
            users[userId].connected = false;
            users[userId].lastActive = Date.now();
            
            // Remove from queue
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(` 📝 Removed from queue`);
                updateWaitingCount();
            }
            
            // End active duels
            for (const duelId in activeDuels) {
                const duel = activeDuels[duelId];
                if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
                    console.log(` ⚔️ Ending duel ${duelId} due to disconnect`);
                    duel.ended = true;
                    
                    const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
                    const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('opponent_left', {
                            message: 'Raqibingiz chiqib ketdi'
                        });
                    }
                    
                    delete activeDuels[duelId];
                    break;
                }
            }
        }
    });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - FULLY WORKING');
    console.log('='.repeat(70));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📍 WebSocket: ws://localhost:${PORT}`);
    console.log('='.repeat(70));
    console.log('✅ Authentication system ready');
    console.log('✅ Gender selection system ready');
    console.log('✅ Queue system ready');
    console.log('✅ Duel system ready');
    console.log('✅ Match system with mutual friendship');
    console.log('✅ Friends list system');
    console.log('✅ Chat system');
    console.log('='.repeat(70));
    console.log('\n📡 Server is now accepting connections...\n');
});

// ==================== BACKGROUND TASKS ====================
// Cleanup offline users from queue every 10 seconds
setInterval(() => {
    let removed = 0;
    for (let i = queue.length - 1; i >= 0; i--) {
        const userId = queue[i];
        const user = users[userId];
        if (!user || !user.connected) {
            queue.splice(i, 1);
            removed++;
        }
    }
    
    if (removed > 0) {
        console.log(`🗑️ Cleaned ${removed} offline users from queue`);
        updateWaitingCount();
    }
}, 10000);

// Daily reset for super likes
setInterval(() => {
    const today = new Date().toDateString();
    let resetCount = 0;
    
    Object.values(users).forEach(user => {
        const lastReset = user.lastResetDate || new Date(0).toDateString();
        if (lastReset !== today) {
            user.dailySuperLikes = 3;
            user.lastResetDate = today;
            resetCount++;
            
            // Notify if online
            const socket = io.sockets.sockets.get(user.socketId);
            if (socket) {
                socket.emit('daily_reset', { superLikes: 3 });
            }
        }
    });
    
    if (resetCount > 0) {
        console.log(`🔄 Daily SUPER LIKES reset for ${resetCount} users`);
    }
}, 60000);

// Log server stats every 30 seconds
setInterval(() => {
    const stats = {
        users: Object.keys(users).length,
        online: Object.values(users).filter(u => u.connected).length,
        queue: queue.length,
        duels: Object.keys(activeDuels).length,
        friendships: Object.keys(friendships).length
    };
    
    console.log('\n📊 SERVER STATISTICS:');
    console.log(` 👥 Users: ${stats.users} (${stats.online} online)`);
    console.log(` 📝 Queue: ${stats.queue} waiting`);
    console.log(` ⚔️ Active duels: ${stats.duels}`);
    console.log(` 🤝 Friendships: ${stats.friendships}`);
}, 30000);

// Auto matchmaking every 5 seconds
setInterval(() => {
    if (queue.length < 2) return;
    
    // Try to match users
    for (let i = 0; i < queue.length; i++) {
        const userId = queue[i];
        const opponentId = findOpponentFor(userId);
        
        if (opponentId) {
            console.log(`🔍 Found match: ${users[userId]?.name} vs ${users[opponentId]?.name}`);
            startDuel(userId, opponentId);
            break;
        }
    }
}, 5000);

console.log('✅ Server background tasks started');