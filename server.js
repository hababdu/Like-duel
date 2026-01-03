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

// ==================== CORS CONFIGURATION ====================
app.use(cors({
    origin: ["https://like-duel.onrender.com", "http://localhost:3000", "http://localhost:5500", "http://127.0.0.1:5500"],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));

// ==================== STATIC FILES ====================
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

// ==================== API ENDPOINTS ====================
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
        mutualMatches: Object.keys(mutualMatches).length,
        chatRequests: Object.keys(chatRequests).length
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

// ==================== GLOBAL VARIABLES ====================
const users = {};          // All users {userId: userObject}
const queue = [];         // Users in queue [userId1, userId2, ...]
const activeDuels = {};   // Active duels {duelId: duelObject}
const mutualMatches = {}; // Mutual matches {userId: [friendId1, friendId2, ...]}
const matchHistory = {};  // Match history {userId: [match1, match2, ...]}
const chatRequests = {};  // Chat requests {requestId: {from, to, status}}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate Duel ID
 */
function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate Request ID
 */
function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Check gender compatibility
 */
function checkGenderCompatibility(user1, user2) {
    if (!user1?.gender || !user2?.gender) return false;
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

/**
 * Check filter compatibility
 */
function checkFilterCompatibility(user, opponent) {
    const userFilter = user.filter || 'not_specified';
    const opponentFilter = opponent.filter || 'not_specified';
    
    // Check user's filter
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
 * Find opponent from queue (ONLY ONLINE USERS)
 */
function findOpponentFor(userId) {
    const user = users[userId];
    if (!user || !user.hasSelectedGender || !user.gender) return null;
    
    // If user is offline, remove from queue
    if (!user.connected) {
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            console.log(`⚠️ ${user.firstName} removed from queue (offline)`);
        }
        return null;
    }
    
    // Search only ONLINE users
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent || !opponent.connected) continue; // Skip OFFLINE opponents
        
        if (!opponent.hasSelectedGender || !opponent.gender) continue;
        
        // Check gender compatibility
        if (!checkGenderCompatibility(user, opponent)) continue;
        
        // Check user's filter
        if (!checkFilterCompatibility(user, opponent)) continue;
        
        // Check opponent's filter
        if (!checkFilterCompatibility(opponent, user)) continue;
        
        console.log(`🔍 Opponent found: ${user.firstName} <-> ${opponent.firstName} (both online)`);
        return opponentId;
    }
    
    return null;
}

/**
 * Update waiting count
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

// ==================== MUTUAL MATCH FUNCTIONS ====================

/**
 * Add mutual match (WITHOUT automatic chat invite)
 */
function addMutualMatch(userId1, userId2) {
    console.log(`🤝 Mutual match added: ${userId1} <-> ${userId2}`);
    
    // For first user
    if (!mutualMatches[userId1]) {
        mutualMatches[userId1] = [];
    }
    if (!mutualMatches[userId1].includes(userId2)) {
        mutualMatches[userId1].push(userId2);
        console.log(`✅ ${userId2} added to ${userId1}'s friends`);
    }
    
    // For second user
    if (!mutualMatches[userId2]) {
        mutualMatches[userId2] = [];
    }
    if (!mutualMatches[userId2].includes(userId1)) {
        mutualMatches[userId2].push(userId1);
        console.log(`✅ ${userId1} added to ${userId2}'s friends`);
    }
    
    // Update friends count
    if (users[userId1]) {
        users[userId1].mutualMatchesCount = mutualMatches[userId1].length;
        users[userId1].friendsCount = mutualMatches[userId1].length;
    }
    
    if (users[userId2]) {
        users[userId2].mutualMatchesCount = mutualMatches[userId2].length;
        users[userId2].friendsCount = mutualMatches[userId2].length;
    }
    
    console.log(`✅ Mutual match added: ${userId1} (${mutualMatches[userId1]?.length}) <-> ${userId2} (${mutualMatches[userId2]?.length})`);
}

/**
 * Get mutual matches
 */
function getMutualMatches(userId) {
    return mutualMatches[userId] || [];
}

/**
 * Add match history
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
 * Create chat request
 */
function createChatRequest(fromUserId, toUserId) {
    const requestId = generateRequestId();
    
    chatRequests[requestId] = {
        id: requestId,
        from: fromUserId,
        to: toUserId,
        status: 'pending', // 'pending', 'accepted', 'rejected', 'cancelled', 'timeout'
        timestamp: new Date(),
        createdAt: new Date()
    };
    
    console.log(`💬 Chat request created: ${requestId} (${fromUserId} -> ${toUserId})`);
    
    // Send chat invite to opponent
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
                message: `${fromUser.firstName} wants to chat with you!`
            });
            console.log(`✅ Chat invite sent to ${toUser.firstName}`);
            
            // Start timeout timer (30 seconds)
            setTimeout(() => {
                if (chatRequests[requestId] && chatRequests[requestId].status === 'pending') {
                    console.log(`⏰ Chat request ${requestId} timed out`);
                    chatRequests[requestId].status = 'timeout';
                    
                    // Notify both users
                    const fromSocket = io.sockets.sockets.get(fromUser.socketId);
                    const toSocket = io.sockets.sockets.get(toUser.socketId);
                    
                    if (fromSocket) {
                        fromSocket.emit('chat_timeout', {
                            requestId: requestId,
                            partnerName: toUser.firstName,
                            message: `${toUser.firstName} didn't respond to your chat invite.`
                        });
                    }
                    
                    if (toSocket) {
                        toSocket.emit('chat_timeout', {
                            requestId: requestId,
                            partnerName: fromUser.firstName,
                            message: `Chat invite from ${fromUser.firstName} has expired.`
                        });
                    }
                }
            }, 30000); // 30 seconds timeout
        }
    } else {
        console.log(`⚠️ ${toUser?.firstName || 'User'} is offline, can't send chat invite`);
        chatRequests[requestId].status = 'cancelled';
    }
    
    return requestId;
}

/**
 * Accept chat request
 */
function acceptChatRequest(requestId, userId) {
    const request = chatRequests[requestId];
    if (!request || request.status !== 'pending') {
        console.log(`❌ Chat request not found or already processed`);
        return false;
    }
    
    if (request.to !== userId) {
        console.log(`❌ This chat request is not for you`);
        return false;
    }
    
    request.status = 'accepted';
    console.log(`✅ Chat request accepted: ${requestId}`);
    
    const fromUser = users[request.from];
    const toUser = users[request.to];
    
    // Add mutual match if not already added
    if (!mutualMatches[request.from]?.includes(request.to)) {
        addMutualMatch(request.from, request.to);
    }
    
    // Notify the user who sent the invite
    if (fromUser && fromUser.connected) {
        const fromSocket = io.sockets.sockets.get(fromUser.socketId);
        if (fromSocket) {
            fromSocket.emit('chat_accepted', {
                requestId: requestId,
                partnerId: request.to,
                partnerName: toUser.firstName,
                partnerUsername: toUser.username,
                partnerPhoto: toUser.photoUrl,
                message: `${toUser.firstName} accepted your chat invite! You can now chat.`
            });
            console.log(`✅ ${fromUser.firstName} notified about chat acceptance`);
        }
    }
    
    // Notify the user who accepted the invite
    if (toUser && toUser.connected) {
        const toSocket = io.sockets.sockets.get(toUser.socketId);
        if (toSocket) {
            toSocket.emit('chat_accepted', {
                requestId: requestId,
                partnerId: request.from,
                partnerName: fromUser.firstName,
                partnerUsername: fromUser.username,
                partnerPhoto: fromUser.photoUrl,
                message: `You accepted chat invite from ${fromUser.firstName}! You can now chat.`
            });
            console.log(`✅ ${toUser.firstName} notified about chat acceptance`);
        }
    }
    
    return true;
}

/**
 * Reject chat request
 */
function rejectChatRequest(requestId, userId) {
    const request = chatRequests[requestId];
    if (!request || request.status !== 'pending') {
        console.log(`❌ Chat request not found`);
        return false;
    }
    
    if (request.to !== userId) {
        console.log(`❌ This chat request is not for you`);
        return false;
    }
    
    request.status = 'rejected';
    console.log(`❌ Chat request rejected: ${requestId}`);
    
    const fromUser = users[request.from];
    const toUser = users[request.to];
    
    // Notify the user who sent the invite
    if (fromUser && fromUser.connected) {
        const socket = io.sockets.sockets.get(fromUser.socketId);
        if (socket) {
            socket.emit('chat_rejected', {
                requestId: requestId,
                partnerName: toUser.firstName,
                message: `${toUser.firstName} rejected your chat invite.`
            });
            console.log(`✅ ${fromUser.firstName} notified about chat rejection`);
        }
    }
    
    return true;
}

/**
 * Cancel chat request
 */
function cancelChatRequest(requestId, userId) {
    const request = chatRequests[requestId];
    if (!request) {
        console.log(`❌ Chat request not found`);
        return false;
    }
    
    if (request.from !== userId) {
        console.log(`❌ You didn't send this chat request`);
        return false;
    }
    
    if (request.status !== 'pending') {
        console.log(`❌ Chat request already processed`);
        return false;
    }
    
    request.status = 'cancelled';
    console.log(`❌ Chat request cancelled: ${requestId}`);
    
    const fromUser = users[request.from];
    const toUser = users[request.to];
    
    // Notify the user who was invited
    if (toUser && toUser.connected) {
        const socket = io.sockets.sockets.get(toUser.socketId);
        if (socket) {
            socket.emit('chat_cancelled', {
                requestId: requestId,
                partnerName: fromUser.firstName,
                message: `${fromUser.firstName} cancelled the chat invite.`
            });
            console.log(`✅ ${toUser.firstName} notified about chat cancellation`);
        }
    }
    
    return true;
}

/**
 * Cancel all pending chat requests for user
 */
function cancelAllPendingChatRequests(userId) {
    let cancelledCount = 0;
    
    Object.values(chatRequests).forEach(request => {
        if ((request.from === userId || request.to === userId) && request.status === 'pending') {
            request.status = 'cancelled';
            cancelledCount++;
            
            // Notify the other user if online
            const otherUserId = request.from === userId ? request.to : request.from;
            const otherUser = users[otherUserId];
            
            if (otherUser && otherUser.connected) {
                const socket = io.sockets.sockets.get(otherUser.socketId);
                if (socket) {
                    socket.emit('chat_cancelled', {
                        requestId: request.id,
                        partnerName: users[userId]?.firstName,
                        message: `${users[userId]?.firstName} cancelled the chat invite.`
                    });
                }
            }
        }
    });
    
    console.log(`✅ ${cancelledCount} pending chat requests cancelled for ${users[userId]?.firstName}`);
    return cancelledCount;
}

// ==================== DUEL FINDING AND STARTING ====================

/**
 * Find and start duels (ONLY ONLINE USERS)
 */
function findAndStartDuels() {
    // First remove offline users from queue
    for (let i = queue.length - 1; i >= 0; i--) {
        const userId = queue[i];
        const user = users[userId];
        if (!user || !user.connected) {
            queue.splice(i, 1);
            if (user) {
                console.log(`⚠️ ${user.firstName} removed from queue (offline)`);
            }
        }
    }
    
    if (queue.length < 2) {
        console.log(`📊 ${queue.length} ONLINE users in queue, not enough for duel`);
        updateWaitingCount();
        return;
    }
    
    console.log(`🔍 Searching for duels... ${queue.length} ONLINE users in queue`);
    
    for (let i = 0; i < queue.length; i++) {
        const userId = queue[i];
        const opponentId = findOpponentFor(userId);
        
        if (opponentId) {
            const userIndex = queue.indexOf(userId);
            const opponentIndex = queue.indexOf(opponentId);
            
            if (userIndex > -1) queue.splice(userIndex, 1);
            if (opponentIndex > -1) queue.splice(opponentIndex, 1);
            
            console.log(`⚔️ Starting duel: ${userId} vs ${opponentId} (both online)`);
            startDuel(userId, opponentId);
            updateWaitingCount();
            break;
        }
    }
}

/**
 * Start duel
 */
function startDuel(player1Id, player2Id) {
    const duelId = generateDuelId();
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    if (!player1 || !player2) {
        console.error('❌ Users not found for duel');
        return;
    }
    
    // If users are not online
    if (!player1.connected || !player2.connected) {
        console.error(`❌ Users not online for duel: 
            ${player1.firstName}: ${player1.connected ? 'online' : 'offline'}
            ${player2.firstName}: ${player2.connected ? 'online' : 'offline'}`);
        
        // Return to queue if online
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
    
    console.log(`🎮 Duel started: ${duelId}`);
    console.log(`   Player 1: ${player1.firstName} (${player1.gender}) - ${player1.connected ? 'online ✅' : 'offline ❌'}`);
    console.log(`   Player 2: ${player2.firstName} (${player2.gender}) - ${player2.connected ? 'online ✅' : 'offline ❌'}`);
    
    // Send data to Player1
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
        console.log(`   ✅ Data sent to ${player1.firstName}`);
    }
    
    // Send data to Player2
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
        console.log(`   ✅ Data sent to ${player2.firstName}`);
    }
    
    // 20 second timer
    setTimeout(() => {
        if (activeDuels[duelId] && !activeDuels[duelId].ended) {
            console.log(`⏰ Duel ${duelId} time expired`);
            handleDuelTimeout(duelId);
        }
    }, 20000);
}

/**
 * Process duel result
 */
function processDuelResult(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended || duel.resultsSent) {
        console.log(`❌ Duel ${duelId} already ended`);
        return;
    }
    
    duel.ended = true;
    duel.resultsSent = true;
    
    const player1Vote = duel.votes[duel.player1];
    const player2Vote = duel.votes[duel.player2];
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    console.log(`📊 Duel result ${duelId}:`);
    console.log(`   ${player1?.firstName}: ${player1Vote || 'no vote'}`);
    console.log(`   ${player2?.firstName}: ${player2Vote || 'no vote'}`);
    
    // MATCH - BOTH LIKED (LIKE or SUPER_LIKE)
    if ((player1Vote === 'like' || player1Vote === 'super_like') && 
        (player2Vote === 'like' || player2Vote === 'super_like')) {
        
        console.log(`🎉 MUTUAL MATCH! ${player1?.firstName} and ${player2?.firstName}`);
        
        // Update statistics
        player1.matches++;
        player2.matches++;
        player1.duels++;
        player2.duels++;
        player1.wins++;
        player2.wins++;
        
        // Rewards
        let player1Reward = 50;
        let player2Reward = 50;
        let player1RatingChange = 25;
        let player2RatingChange = 25;
        
        if (player1Vote === 'super_like') {
            player1Reward += 20;
            player1RatingChange += 5;
            console.log(`   ${player1?.firstName} SUPER LIKE +20 coins, +5 rating`);
        }
        if (player2Vote === 'super_like') {
            player2Reward += 20;
            player2RatingChange += 5;
            console.log(`   ${player2?.firstName} SUPER LIKE +20 coins, +5 rating`);
        }
        
        player1.coins += player1Reward;
        player2.coins += player2Reward;
        player1.rating += player1RatingChange;
        player2.rating += player2RatingChange;
        
        // Add mutual match (WITHOUT automatic chat invite)
        console.log(`🤝 Adding mutual match (no auto chat invite)...`);
        addMutualMatch(duel.player1, duel.player2);
        addMatchHistory(duel.player1, duel.player2);
        
        // Send match data to Player1 (NO AUTO CHAT INVITE)
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
                message: `${player2.firstName} bilan o'zaro match! Endi siz do'st bo'ldingiz. Chat qilishni xohlaysizmi?`
            });
            console.log(`   ✅ ${player1.firstName} notified about match`);
        }
        
        // Send match data to Player2
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
                message: `${player1.firstName} bilan o'zaro match! Endi siz do'st bo'ldingiz. Chat qilishni xohlaysizmi?`
            });
            console.log(`   ✅ ${player2.firstName} notified about match`);
        }
        
    } else if (player1Vote === 'like' || player1Vote === 'super_like') {
        // Only player1 liked
        console.log(`❤️ Only ${player1?.firstName} liked`);
        
        player1.duels++;
        const coins = player1Vote === 'super_like' ? 30 : 10;
        player1.coins += coins;
        player1.totalLikes++;
        
        console.log(`   ${player1?.firstName} +${coins} coins`);
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('liked_only', {
                opponentName: player2.firstName,
                opponentOnline: player2.connected,
                reward: { coins: coins, xp: 5 }
            });
            console.log(`   ✅ ${player1.firstName} notified about liked_only`);
        }
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('no_match', {});
            console.log(`   ✅ ${player2.firstName} notified about no_match`);
        }
        
    } else if (player2Vote === 'like' || player2Vote === 'super_like') {
        // Only player2 liked
        console.log(`❤️ Only ${player2?.firstName} liked`);
        
        player2.duels++;
        const coins = player2Vote === 'super_like' ? 30 : 10;
        player2.coins += coins;
        player2.totalLikes++;
        
        console.log(`   ${player2?.firstName} +${coins} coins`);
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('liked_only', {
                opponentName: player1.firstName,
                opponentOnline: player1.connected,
                reward: { coins: coins, xp: 5 }
            });
            console.log(`   ✅ ${player2.firstName} notified about liked_only`);
        }
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('no_match', {});
            console.log(`   ✅ ${player1.firstName} notified about no_match`);
        }
        
    } else {
        // No one liked
        console.log(`❌ No one liked`);
        
        player1.duels++;
        player2.duels++;
        
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        if (player1Socket) {
            player1Socket.emit('no_match', {});
            console.log(`   ✅ ${player1.firstName} notified about no_match`);
        }
        
        const player2Socket = io.sockets.sockets.get(player2.socketId);
        if (player2Socket) {
            player2Socket.emit('no_match', {});
            console.log(`   ✅ ${player2.firstName} notified about no_match`);
        }
    }
    
    // Update ratings
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
    
    // Return players to queue
    console.log(`🔄 Returning players to queue...`);
    setTimeout(() => {
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
        console.log(`🗑️ Duel ${duelId} deleted`);
    }, 1000);
}

/**
 * Handle duel timeout
 */
function handleDuelTimeout(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    console.log(`⏰ Duel ${duelId} timeout`);
    
    duel.ended = true;
    duel.resultsSent = true;
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    const player1Socket = io.sockets.sockets.get(player1?.socketId);
    const player2Socket = io.sockets.sockets.get(player2?.socketId);
    
    if (player1Socket) {
        player1Socket.emit('timeout', {});
        console.log(`   ✅ ${player1?.firstName} notified about timeout`);
    }
    
    if (player2Socket) {
        player2Socket.emit('timeout', {});
        console.log(`   ✅ ${player2?.firstName} notified about timeout`);
    }
    
    setTimeout(() => {
        returnPlayersToQueue(duel.player1, duel.player2);
        delete activeDuels[duelId];
        console.log(`🗑️ Duel ${duelId} deleted`);
    }, 1000);
}

/**
 * Return players to queue (only if online)
 */
function returnPlayersToQueue(player1Id, player2Id) {
    console.log(`🔄 Returning players to queue (online only): ${player1Id}, ${player2Id}`);
    
    [player1Id, player2Id].forEach(playerId => {
        const player = users[playerId];
        if (player && player.connected && player.hasSelectedGender && !queue.includes(playerId)) {
            queue.push(playerId);
            console.log(`   ✅ ${player.firstName} added to queue (online)`);
        }
    });
    
    updateWaitingCount();
    setTimeout(findAndStartDuels, 1000);
}

// ==================== SOCKET.IO HANDLERS ====================

io.on('connection', (socket) => {
    console.log('✅ New connection:', socket.id);
    
    // ==================== AUTHENTICATION ====================
    socket.on('auth', (data) => {
        const userId = data.userId;
        console.log(`🔐 Authentication: ${userId} (${data.firstName})`);
        
        if (!users[userId]) {
            // New user
            users[userId] = {
                id: userId,
                firstName: data.firstName || 'User',
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
            console.log(`   👤 New user created: ${data.firstName}`);
        } else {
            // Existing user - update online status
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = new Date();
            
            // Update data
            if (data.gender) users[userId].gender = data.gender;
            if (data.hasSelectedGender !== undefined) users[userId].hasSelectedGender = data.hasSelectedGender;
            if (data.bio !== undefined) users[userId].bio = data.bio;
            if (data.filter !== undefined) users[userId].filter = data.filter;
            
            // Update mutual matches count
            users[userId].mutualMatchesCount = getMutualMatches(userId)?.length || 0;
            users[userId].friendsCount = getMutualMatches(userId)?.length || 0;
            
            console.log(`   👤 Existing user online: ${users[userId].firstName}`);
            
            // Check for pending chat requests
            Object.values(chatRequests).forEach(request => {
                if (request.to === userId && request.status === 'pending') {
                    console.log(`   💬 ${users[userId].firstName} has pending chat request`);
                    
                    const fromUser = users[request.from];
                    if (fromUser) {
                        socket.emit('chat_invite', {
                            requestId: request.id,
                            fromUserId: request.from,
                            fromUserName: fromUser.firstName,
                            fromUserPhoto: fromUser.photoUrl,
                            message: `${fromUser.firstName} wants to chat with you!`
                        });
                    }
                }
            });
        }
        
        socket.userId = userId;
        
        // Daily reset check
        const today = new Date().toDateString();
        if (users[userId].lastResetDate !== today) {
            users[userId].dailySuperLikes = 3;
            users[userId].lastResetDate = today;
            console.log(`   🔄 Daily SUPER LIKES reset for ${users[userId].firstName}`);
        }
        
        // Send data to client
        socket.emit('auth_ok', {
            ...users[userId],
            winRate: users[userId].duels > 0 ? 
                Math.round((users[userId].wins / users[userId].duels) * 100) : 0
        });
        
        console.log(`   ✅ ${users[userId].firstName} received auth_ok`);
        
        // If gender selected, add to queue
        if (users[userId].hasSelectedGender) {
            if (!queue.includes(userId)) {
                queue.push(userId);
                console.log(`   📝 ${users[userId].firstName} added to queue (online)`);
            }
        } else {
            console.log(`   ⚠️ ${users[userId].firstName} gender not selected`);
            setTimeout(() => {
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'You must select gender to duel!'
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
            console.log(`❌ Gender selection: user not found`);
            return;
        }
        
        console.log(`🎯 Gender selection: ${users[userId].firstName} -> ${gender}`);
        
        users[userId].gender = gender;
        users[userId].hasSelectedGender = true;
        
        socket.emit('gender_selected', {
            gender: gender,
            hasSelectedGender: true,
            message: `Gender selected! ${
                gender === 'male' ? 'Only duel with females' :
                gender === 'female' ? 'Only duel with males' :
                'Duel with everyone'
            }`
        });
        
        console.log(`   ✅ ${users[userId].firstName} received gender_selected`);
        
        if (!queue.includes(userId)) {
            queue.push(userId);
            console.log(`   📝 ${users[userId].firstName} added to queue (online)`);
        }
        
        updateWaitingCount();
        setTimeout(() => findAndStartDuels(), 500);
    });
    
    // ==================== QUEUE MANAGEMENT ====================
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        
        if (!userId || !users[userId]) {
            console.log(`❌ Enter queue: user not found`);
            socket.emit('error', { message: 'Authenticate first' });
            return;
        }
        
        console.log(`📝 Enter queue: ${users[userId].firstName} (${users[userId].connected ? 'online ✅' : 'offline ❌'})`);
        
        if (!users[userId].connected) {
            console.log(`   ❌ ${users[userId].firstName} offline, cannot enter queue`);
            socket.emit('error', { message: 'You are offline. Check your internet connection.' });
            return;
        }
        
        if (!users[userId].hasSelectedGender) {
            console.log(`   ⚠️ ${users[userId].firstName} gender not selected`);
            socket.emit('show_gender_selection', {
                mandatory: true,
                message: 'You must select gender to enter queue!'
            });
            return;
        }
        
        if (queue.includes(userId)) {
            console.log(`   ℹ️ ${users[userId].firstName} already in queue`);
            socket.emit('queue_joined', {
                position: queue.indexOf(userId) + 1,
                total: queue.length
            });
            return;
        }
        
        queue.push(userId);
        
        console.log(`   ✅ ${users[userId].firstName} added to queue (position: ${queue.length})`);
        
        socket.emit('queue_joined', {
            position: queue.length,
            total: queue.length
        });
        
        setTimeout(() => findAndStartDuels(), 500);
    });
    
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        
        if (!userId) {
            console.log(`❌ Leave queue: user not found`);
            return;
        }
        
        console.log(`🚪 Leave queue: ${users[userId]?.firstName || userId}`);
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            console.log(`   ✅ ${users[userId]?.firstName || userId} left queue`);
            updateWaitingCount();
        }
    });
    
    // ==================== VOTE HANDLING ====================
    socket.on('vote', (data) => {
        const userId = socket.userId;
        const { duelId, choice } = data;
        
        console.log(`🗳️ Vote: ${userId} -> ${choice} (duel: ${duelId})`);
        
        if (!activeDuels[duelId] || activeDuels[duelId].ended) {
            console.log(`   ❌ Duel ${duelId} ended or not found`);
            socket.emit('error', { message: 'This duel has ended' });
            return;
        }
        
        const duel = activeDuels[duelId];
        if (duel.player1 !== userId && duel.player2 !== userId) {
            console.log(`   ❌ User ${userId} not in this duel`);
            socket.emit('error', { message: 'You are not in this duel' });
            return;
        }
        
        // Check if user is online
        if (!users[userId]?.connected) {
            console.log(`   ❌ ${users[userId]?.firstName} offline, cannot vote`);
            socket.emit('error', { message: 'You are offline. Check your internet connection.' });
            return;
        }
        
        duel.votes[userId] = choice;
        console.log(`   ✅ ${users[userId]?.firstName} voted: ${choice}`);
        
        if (choice === 'super_like') {
            const user = users[userId];
            if (user.dailySuperLikes <= 0) {
                console.log(`   ⚠️ ${users[userId]?.firstName} no SUPER LIKES left`);
                socket.emit('error', { message: 'Daily SUPER LIKE limit reached' });
                delete duel.votes[userId];
                return;
            }
            user.dailySuperLikes--;
            
            console.log(`   💎 ${users[userId]?.firstName} used SUPER LIKE (remaining: ${user.dailySuperLikes})`);
            
            socket.emit('super_like_used', {
                remaining: user.dailySuperLikes
            });
        }
        
        // Process result if both voted
        if (duel.votes[duel.player1] && duel.votes[duel.player2]) {
            console.log(`   📊 Both players voted in duel ${duelId}`);
            processDuelResult(duelId);
        } else {
            // Send waiting response to other player
            const waitingPlayerId = duel.player1 === userId ? duel.player2 : duel.player1;
            const waitingPlayer = users[waitingPlayerId];
            
            if (waitingPlayer && waitingPlayer.connected && waitingPlayer.socketId) {
                const waitingSocket = io.sockets.sockets.get(waitingPlayer.socketId);
                if (waitingSocket) {
                    waitingSocket.emit('waiting_response', {});
                    console.log(`   ⏳ ${waitingPlayer.firstName} notified about waiting response`);
                }
            }
        }
    });
    
    // ==================== CHAT MANAGEMENT ====================
    socket.on('send_chat_invite', (data) => {
        const userId = socket.userId;
        const { partnerId } = data;
        
        if (!userId || !partnerId || !users[userId] || !users[partnerId]) {
            console.log(`❌ Chat invite: users not found`);
            socket.emit('error', { message: 'Error sending chat invite' });
            return;
        }
        
        console.log(`💬 Chat invite: ${users[userId].firstName} -> ${users[partnerId].firstName}`);
        
        // Check if user is online
        if (!users[userId].connected) {
            console.log(`❌ ${users[userId]?.firstName} offline, cannot send chat invite`);
            socket.emit('error', { message: 'You are offline. Check your internet connection.' });
            return;
        }
        
        // Check if opponent is online
        if (!users[partnerId].connected) {
            console.log(`❌ ${users[partnerId]?.firstName} offline, cannot send chat invite`);
            socket.emit('error', { message: 'Opponent is offline. Cannot send chat invite.' });
            return;
        }
        
        // Check if they are already friends
        if (mutualMatches[userId]?.includes(partnerId)) {
            console.log(`ℹ️ ${users[userId].firstName} and ${users[partnerId].firstName} are already friends`);
            socket.emit('error', { message: 'You are already friends with this user!' });
            return;
        }
        
        // Check if there's already a pending request
        const existingRequest = Object.values(chatRequests).find(
            req => (req.from === userId && req.to === partnerId && req.status === 'pending') ||
                   (req.from === partnerId && req.to === userId && req.status === 'pending')
        );
        
        if (existingRequest) {
            console.log(`ℹ️ There is already a pending chat request between these users`);
            socket.emit('error', { message: 'There is already a pending chat request' });
            return;
        }
        
        // Create chat request
        const requestId = createChatRequest(userId, partnerId);
        
        socket.emit('chat_invite_sent', {
            requestId: requestId,
            partnerName: users[partnerId].firstName,
            message: `${users[partnerId].firstName} ga chat taklifi yuborildi. Ikkalangiz ham rozilik bersangiz, chat ochiladi.`
        });
    });
    
    socket.on('accept_chat_invite', (data) => {
        const userId = socket.userId;
        const { requestId } = data;
        
        if (!userId || !requestId) {
            console.log(`❌ Accept chat invite: insufficient data`);
            return;
        }
        
        console.log(`✅ Accept chat invite: ${users[userId]?.firstName} -> ${requestId}`);
        
        // Accept chat request
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
            console.log(`❌ Reject chat invite: insufficient data`);
            return;
        }
        
        console.log(`❌ Reject chat invite: ${users[userId]?.firstName} -> ${requestId}`);
        
        // Reject chat request
        const rejected = rejectChatRequest(requestId, userId);
        
        if (rejected) {
            socket.emit('chat_invite_rejected', {
                message: 'Chat taklifini rad etdingiz.'
            });
        }
    });
    
    socket.on('cancel_chat_invite', (data) => {
        const userId = socket.userId;
        
        if (!userId) {
            console.log(`❌ Cancel chat invite: user not found`);
            return;
        }
        
        console.log(`❌ Cancel chat invite: ${users[userId]?.firstName}`);
        
        // Cancel all pending chat requests
        const cancelledCount = cancelAllPendingChatRequests(userId);
        
        socket.emit('chat_invite_cancelled', {
            count: cancelledCount,
            message: `Barcha chat takliflaringiz bekor qilindi.`
        });
    });
    
    // ==================== CREATE CHAT LINK ====================
    socket.on('create_chat_link', (data) => {
        const userId = socket.userId;
        const { partnerId, partnerName, type } = data;
        
        if (!userId || !partnerId || !users[userId] || !users[partnerId]) {
            console.log(`❌ Create chat link: users not found`);
            socket.emit('error', { message: 'Error creating chat link' });
            return;
        }
        
        console.log(`🔗 Create chat link request: ${users[userId].firstName} -> ${users[partnerId].firstName}`);
        
        // Check if user is online
        if (!users[userId].connected) {
            console.log(`❌ ${users[userId].firstName} offline, cannot create chat link`);
            socket.emit('error', { message: 'You are offline. Check your internet connection.' });
            return;
        }
        
        // Check if opponent is online
        if (!users[partnerId].connected) {
            console.log(`❌ ${users[partnerId].firstName} offline, cannot create chat link`);
            socket.emit('error', { message: 'Opponent is offline. Cannot create chat.' });
            return;
        }
        
        // Check if they are friends
        if (!mutualMatches[userId]?.includes(partnerId)) {
            console.log(`❌ ${users[userId].firstName} and ${users[partnerId].firstName} are not friends`);
            socket.emit('chat_link_error', {
                message: `Siz ${users[partnerId].firstName} bilan do'st emassiz. Chat uchun avval o'zaro match bo'lishingiz kerak.`,
                partnerName: users[partnerId].firstName
            });
            return;
        }
        
        // Check Telegram username
        const partnerUsername = users[partnerId].username;
        if (!partnerUsername) {
            console.log(`❌ ${users[partnerId].firstName} has no Telegram username`);
            socket.emit('chat_link_error', {
                message: `${users[partnerId].firstName} ning Telegram username'i mavjud emas. Chat ochib bo'lmaydi.`,
                partnerName: users[partnerId].firstName
            });
            return;
        }
        
        // Create Telegram chat link
        const chatLink = `https://t.me/${partnerUsername}`;
        
        console.log(`✅ Telegram chat link created: ${chatLink}`);
        
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
            console.log(`❌ Update profile: user not found`);
            return;
        }
        
        console.log(`📝 Update profile: ${users[userId].firstName}`);
        
        const user = users[userId];
        
        if (data.bio !== undefined) {
            user.bio = data.bio;
            console.log(`   📝 Bio updated`);
        }
        
        if (data.gender !== undefined) {
            const oldGender = user.gender;
            user.gender = data.gender;
            console.log(`   👤 Gender updated: ${oldGender} -> ${data.gender}`);
            
            // Remove from queue if gender changed
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(`   📝 Removed from queue (gender changed)`);
            }
            
            setTimeout(() => {
                if (!queue.includes(userId) && user.hasSelectedGender && user.connected) {
                    queue.push(userId);
                    updateWaitingCount();
                    findAndStartDuels();
                    console.log(`   📝 Added to queue with new gender`);
                }
            }, 500);
        }
        
        if (data.filter !== undefined) {
            user.filter = data.filter;
            console.log(`   🎯 Filter updated: ${data.filter}`);
            
            // Remove from queue if filter changed
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(`   📝 Removed from queue (filter changed)`);
            }
            
            setTimeout(() => {
                if (!queue.includes(userId) && user.hasSelectedGender && user.connected) {
                    queue.push(userId);
                    updateWaitingCount();
                    findAndStartDuels();
                    console.log(`   📝 Added to queue with new filter`);
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
        
        console.log(`   ✅ ${users[userId].firstName} profile updated`);
    });
    
    // ==================== FRIENDS MANAGEMENT ====================
    socket.on('get_friends_list', () => {
        const userId = socket.userId;
        if (!userId || !users[userId]) {
            console.log(`❌ Friends list: user not found`);
            return;
        }
        
        console.log(`👥 Friends list request: ${users[userId].firstName}`);
        
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
                chatEnabled: friend.connected
            };
        }).filter(friend => friend !== null);
        
        console.log(`   📊 ${friendsList.length} friends found, ${friendsList.filter(f => f.online).length} online`);
        
        socket.emit('friends_list', {
            friends: friendsList,
            total: friendsList.length,
            online: friendsList.filter(f => f.online).length
        });
        
        console.log(`   ✅ ${users[userId].firstName} received friends list`);
    });
    
    // ==================== REMATCH REQUEST ====================
    socket.on('request_rematch', (data) => {
        const userId = socket.userId;
        const opponentId = data.opponentId;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) {
            console.log(`❌ Rematch request: users not found`);
            return;
        }
        
        console.log(`🔄 Rematch request: ${users[userId].firstName} -> ${users[opponentId].firstName}`);
        
        // Check if user is online
        if (!users[userId].connected) {
            console.log(`❌ ${users[userId].firstName} offline, cannot request rematch`);
            return;
        }
        
        // Check if opponent is online
        if (!users[opponentId].connected) {
            console.log(`❌ ${users[opponentId].firstName} offline, cannot request rematch`);
            socket.emit('error', { message: 'Opponent is offline. Cannot request rematch.' });
            return;
        }
        
        const opponentSocket = io.sockets.sockets.get(users[opponentId].socketId);
        if (opponentSocket) {
            opponentSocket.emit('rematch_request', {
                opponentId: userId,
                opponentName: users[userId].firstName,
                opponentPhoto: users[userId].photoUrl
            });
            console.log(`   ✅ ${users[opponentId].firstName} received rematch request`);
        }
    });
    
    socket.on('accept_rematch', (data) => {
        const userId = socket.userId;
        const opponentId = data.opponentId;
        
        if (!userId || !opponentId || !users[userId] || !users[opponentId]) {
            console.log(`❌ Accept rematch: users not found`);
            return;
        }
        
        // Both must be online
        if (!users[userId].connected || !users[opponentId].connected) {
            console.log(`❌ Accept rematch: one of the users is offline`);
            socket.emit('error', { message: 'Both players must be online for rematch.' });
            return;
        }
        
        console.log(`🔄 Rematch accepted: ${users[userId].firstName} and ${users[opponentId].firstName}`);
        
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
            console.log(`❌ Disconnected: ${users[userId].firstName} (${userId})`);
            
            users[userId].connected = false;
            users[userId].lastActive = new Date();
            
            // Remove from queue
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(`   📝 ${users[userId].firstName} removed from queue (disconnected)`);
                updateWaitingCount();
            }
            
            // End active duels
            for (const duelId in activeDuels) {
                const duel = activeDuels[duelId];
                if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
                    duel.ended = true;
                    
                    const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
                    const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
                    
                    console.log(`   ⚔️ Duel ${duelId} ended (${users[userId].firstName} disconnected)`);
                    
                    if (opponentSocket) {
                        opponentSocket.emit('opponent_left');
                        console.log(`   ✅ ${users[opponentId]?.firstName} notified about opponent left`);
                    }
                    
                    delete activeDuels[duelId];
                    break;
                }
            }
            
            // Update chat requests
            Object.values(chatRequests).forEach(request => {
                if (request.from === userId || request.to === userId) {
                    if (request.status === 'pending') {
                        request.status = 'cancelled';
                        console.log(`   💬 Chat request for ${users[userId].firstName} cancelled`);
                    }
                }
            });
        }
    });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - MUTUAL MATCH AND CHAT SYSTEM');
    console.log('='.repeat(70));
    console.log(`📍 Server started: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log('🌐 WebSocket URL: ws://0.0.0.0:${PORT}');
    console.log('='.repeat(70));
    console.log('✅ Mutual Match system activated');
    console.log('✅ Friends list automatically updates');
    console.log('✅ OFFLINE users do NOT participate in duels');
    console.log('✅ NO automatic chat invites on mutual match');
    console.log('✅ Manual chat invite system (user-initiated)');
    console.log('✅ Both must accept chat invite to open Telegram chat');
    console.log('='.repeat(70));
    console.log('\n📈 Server statistics updated every 30 seconds...\n');
});

// ==================== BACKGROUND TASKS ====================

// Daily limit reset
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
        console.log(`🔄 Daily SUPER LIKES reset for ${resetCount} users`);
    }
}, 60000); // Check every minute

// Server statistics logging
setInterval(() => {
    const totalUsers = Object.keys(users).length;
    const onlineUsers = Object.values(users).filter(u => u.connected).length;
    const onlineInQueue = queue.filter(userId => {
        const user = users[userId];
        return user && user.connected;
    }).length;
    
    console.log(`📊 SERVER STATS: 
    Total users: ${totalUsers}
    Online users: ${onlineUsers}
    In queue (online): ${onlineInQueue}/${queue.length}
    Active Duels: ${Object.keys(activeDuels).length}
    Mutual Matches: ${Object.keys(mutualMatches).length}
    Chat Requests: ${Object.keys(chatRequests).length}`);
    
    // Online users list
    const onlineList = Object.values(users)
        .filter(u => u.connected)
        .map(u => u.firstName)
        .slice(0, 5);
    
    if (onlineList.length > 0) {
        console.log(`   Online: ${onlineList.join(', ')}${onlineList.length < onlineUsers ? '...' : ''}`);
    }
}, 30000); // Every 30 seconds

// Clean old users (after 24 hours)
setInterval(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let removedCount = 0;
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        if (user.lastActive < twentyFourHoursAgo && !user.connected) {
            delete users[userId];
            
            // Remove from queue
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
            }
            
            // Remove from mutual matches
            if (mutualMatches[userId]) {
                delete mutualMatches[userId];
            }
            
            removedCount++;
        }
    });
    
    if (removedCount > 0) {
        console.log(`🗑️ ${removedCount} old (24 hours offline) users cleaned`);
        updateWaitingCount();
    }
}, 3600000); // Every hour

// Queue monitoring (only online users)
setInterval(() => {
    const onlineInQueue = queue.filter(userId => {
        const user = users[userId];
        return user && user.connected;
    }).length;
    
    if (queue.length > 0) {
        console.log(`📝 QUEUE MONITORING: ${queue.length} users (${onlineInQueue} online)`);
        queue.forEach((userId, index) => {
            const user = users[userId];
            if (user) {
                const status = user.connected ? '✅ online' : '❌ offline';
                console.log(`   ${index + 1}. ${user.firstName} (${user.gender}, filter: ${user.filter}) - ${status}`);
            }
        });
    }
}, 60000); // Every minute

// Automatic duel starting (only online users)
setInterval(() => {
    findAndStartDuels();
}, 5000); // Search for duels every 5 seconds

// Remove offline users from queue automatically
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
        console.log(`⚠️ ${removedCount} OFFLINE users removed from queue`);
        updateWaitingCount();
    }
}, 10000); // Every 10 seconds

// Clean old chat requests (after 1 hour)
setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let removedCount = 0;
    
    Object.keys(chatRequests).forEach(requestId => {
        const request = chatRequests[requestId];
        if (request.createdAt < oneHourAgo && request.status === 'pending') {
            delete chatRequests[requestId];
            removedCount++;
        }
    });
    
    if (removedCount > 0) {
        console.log(`🗑️ ${removedCount} old (1 hour) chat requests cleaned`);
    }
}, 1800000); // Every 30 minutes

console.log('\n✅ Server background tasks started');
console.log('📊 Automatic monitoring active');
console.log('🎮 Like Duel Server fully ready!\n');