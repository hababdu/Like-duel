// ==================== LIKE DUEL SERVER - FULL MATCH SYSTEM ====================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==================== GLOBAL VARIABLES ====================
const users = {};           // Online users {userId: userObject}
const queue = [];           // Waiting queue [userId1, userId2, ...]
const activeDuels = {};     // Active duels {duelId: duelObject}
const friendships = {};     // Mutual friendships {userId: [friendId1, friendId2, ...]}
const chatRequests = {};    // Pending chat requests

// ==================== HELPER FUNCTIONS ====================
function generateDuelId() {
    return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateRequestId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Check gender compatibility
function isGenderCompatible(user1, user2) {
    if (!user1.gender || !user2.gender) return false;
    
    // If any user selects "all", they can match with anyone
    if (user1.gender === 'all' || user2.gender === 'all') return true;
    
    // Male can only match with female, female only with male
    return user1.gender !== user2.gender;
}

// Find opponent from queue
function findOpponent(userId) {
    const user = users[userId];
    if (!user) return null;
    
    for (let i = 0; i < queue.length; i++) {
        const opponentId = queue[i];
        if (opponentId === userId) continue;
        
        const opponent = users[opponentId];
        if (!opponent) continue;
        
        // Check if both are online
        if (!user.connected || !opponent.connected) continue;
        
        // Check gender compatibility
        if (!isGenderCompatible(user, opponent)) continue;
        
        // Check filters
        if (user.filter && user.filter !== 'all' && user.filter !== opponent.gender) continue;
        if (opponent.filter && opponent.filter !== 'all' && opponent.filter !== user.gender) continue;
        
        // Found compatible opponent
        return opponentId;
    }
    
    return null;
}

// Create mutual friendship
function createFriendship(userId1, userId2) {
    console.log(`🤝 Creating friendship: ${userId1} <-> ${userId2}`);
    
    // Initialize arrays if not exist
    if (!friendships[userId1]) friendships[userId1] = [];
    if (!friendships[userId2]) friendships[userId2] = [];
    
    // Add to each other's friend list
    if (!friendships[userId1].includes(userId2)) {
        friendships[userId1].push(userId2);
        console.log(` ✅ ${userId1} -> ${userId2} added`);
    }
    
    if (!friendships[userId2].includes(userId1)) {
        friendships[userId2].push(userId1);
        console.log(` ✅ ${userId2} -> ${userId1} added`);
    }
    
    // Update user stats
    if (users[userId1]) {
        users[userId1].friendsCount = friendships[userId1].length;
        users[userId1].matches++;
    }
    
    if (users[userId2]) {
        users[userId2].friendsCount = friendships[userId2].length;
        users[userId2].matches++;
    }
    
    console.log(`✅ Friendship created. ${userId1}: ${friendships[userId1].length} friends, ${userId2}: ${friendships[userId2].length} friends`);
}

// Get user's friends list
function getFriendsList(userId) {
    const friendIds = friendships[userId] || [];
    return friendIds.map(friendId => {
        const friend = users[friendId];
        return friend ? {
            id: friend.id,
            name: friend.firstName,
            username: friend.username,
            photo: friend.photoUrl,
            gender: friend.gender,
            rating: friend.rating,
            matches: friend.matches,
            online: friend.connected,
            lastActive: friend.lastActive
        } : null;
    }).filter(friend => friend !== null);
}

// Start duel between two players
function startDuel(player1Id, player2Id) {
    const duelId = generateDuelId();
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    if (!player1 || !player2) {
        console.error('❌ Users not found for duel');
        return;
    }
    
    // Remove from queue
    const index1 = queue.indexOf(player1Id);
    const index2 = queue.indexOf(player2Id);
    if (index1 > -1) queue.splice(index1, 1);
    if (index2 > -1) queue.splice(index2, 1);
    
    // Create duel object
    activeDuels[duelId] = {
        id: duelId,
        player1: player1Id,
        player2: player2Id,
        votes: {},
        startTime: new Date(),
        ended: false,
        timeout: null
    };
    
    console.log(`🎮 Duel started: ${duelId}`);
    console.log(` 👤 ${player1.firstName} (${player1.gender}) vs ${player2.firstName} (${player2.gender})`);
    
    // Send duel started to player1
    const socket1 = io.sockets.sockets.get(player1.socketId);
    if (socket1) {
        socket1.emit('duel_started', {
            duelId: duelId,
            opponent: {
                id: player2Id,
                name: player2.firstName,
                username: player2.username,
                photo: player2.photoUrl,
                rating: player2.rating,
                matches: player2.matches,
                level: player2.level || 1,
                gender: player2.gender,
                online: true
            },
            timeLeft: 20
        });
    }
    
    // Send duel started to player2
    const socket2 = io.sockets.sockets.get(player2.socketId);
    if (socket2) {
        socket2.emit('duel_started', {
            duelId: duelId,
            opponent: {
                id: player1Id,
                name: player1.firstName,
                username: player1.username,
                photo: player1.photoUrl,
                rating: player1.rating,
                matches: player1.matches,
                level: player1.level || 1,
                gender: player1.gender,
                online: true
            },
            timeLeft: 20
        });
    }
    
    // Set timeout (20 seconds)
    activeDuels[duelId].timeout = setTimeout(() => {
        if (activeDuels[duelId] && !activeDuels[duelId].ended) {
            handleDuelTimeout(duelId);
        }
    }, 20000);
}

// Process duel result
function processDuelResult(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    clearTimeout(duel.timeout);
    duel.ended = true;
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    const player1Vote = duel.votes[duel.player1];
    const player2Vote = duel.votes[duel.player2];
    
    console.log(`📊 Duel ${duelId} results:`);
    console.log(` ${player1?.firstName}: ${player1Vote || 'no vote'}`);
    console.log(` ${player2?.firstName}: ${player2Vote || 'no vote'}`);
    
    // CASE 1: MUTUAL MATCH (both liked)
    if ((player1Vote === 'like' || player1Vote === 'super_like') && 
        (player2Vote === 'like' || player2Vote === 'super_like')) {
        
        console.log(`🎉 MUTUAL MATCH! Creating friendship...`);
        
        // Create mutual friendship
        createFriendship(duel.player1, duel.player2);
        
        // Calculate rewards
        let coins1 = 50, coins2 = 50;
        let rating1 = 25, rating2 = 25;
        
        if (player1Vote === 'super_like') {
            coins1 += 20;
            rating1 += 5;
            if (player1) player1.dailySuperLikes--;
        }
        
        if (player2Vote === 'super_like') {
            coins2 += 20;
            rating2 += 5;
            if (player2) player2.dailySuperLikes--;
        }
        
        // Update stats
        if (player1) {
            player1.coins += coins1;
            player1.rating += rating1;
            player1.duels++;
            player1.wins++;
        }
        
        if (player2) {
            player2.coins += coins2;
            player2.rating += rating2;
            player2.duels++;
            player2.wins++;
        }
        
        // Send match result to both players
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        
        if (socket1) {
            socket1.emit('match_result', {
                result: 'match',
                partner: {
                    id: duel.player2,
                    name: player2.firstName,
                    username: player2.username,
                    photo: player2.photoUrl,
                    rating: player2.rating,
                    matches: player2.matches,
                    gender: player2.gender,
                    online: player2.connected
                },
                coinsEarned: coins1,
                ratingChange: rating1,
                newRating: player1?.rating || 1500
            });
            
            // Send friends list update
            socket1.emit('friends_updated', {
                friends: getFriendsList(duel.player1),
                count: friendships[duel.player1]?.length || 0
            });
        }
        
        if (socket2) {
            socket2.emit('match_result', {
                result: 'match',
                partner: {
                    id: duel.player1,
                    name: player1.firstName,
                    username: player1.username,
                    photo: player1.photoUrl,
                    rating: player1.rating,
                    matches: player1.matches,
                    gender: player1.gender,
                    online: player1.connected
                },
                coinsEarned: coins2,
                ratingChange: rating2,
                newRating: player2?.rating || 1500
            });
            
            // Send friends list update
            socket2.emit('friends_updated', {
                friends: getFriendsList(duel.player2),
                count: friendships[duel.player2]?.length || 0
            });
        }
    }
    // CASE 2: Only player1 liked
    else if (player1Vote === 'like' || player1Vote === 'super_like') {
        console.log(`❤️ Only ${player1?.firstName} liked`);
        
        if (player1) {
            player1.duels++;
            player1.coins += 10;
            if (player1Vote === 'super_like') {
                player1.coins += 10;
                player1.dailySuperLikes--;
            }
        }
        
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        
        if (socket1) socket1.emit('liked_only', {
            opponentName: player2?.firstName,
            coins: player1Vote === 'super_like' ? 20 : 10
        });
        
        if (socket2) socket2.emit('no_match', {});
    }
    // CASE 3: Only player2 liked
    else if (player2Vote === 'like' || player2Vote === 'super_like') {
        console.log(`❤️ Only ${player2?.firstName} liked`);
        
        if (player2) {
            player2.duels++;
            player2.coins += 10;
            if (player2Vote === 'super_like') {
                player2.coins += 10;
                player2.dailySuperLikes--;
            }
        }
        
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        
        if (socket2) socket2.emit('liked_only', {
            opponentName: player1?.firstName,
            coins: player2Vote === 'super_like' ? 20 : 10
        });
        
        if (socket1) socket1.emit('no_match', {});
    }
    // CASE 4: No one liked
    else {
        console.log(`❌ No one liked`);
        
        if (player1) player1.duels++;
        if (player2) player2.duels++;
        
        const socket1 = io.sockets.sockets.get(player1?.socketId);
        const socket2 = io.sockets.sockets.get(player2?.socketId);
        
        if (socket1) socket1.emit('no_match', {});
        if (socket2) socket2.emit('no_match', {});
    }
    
    // Return to queue if still online
    setTimeout(() => {
        returnToQueue(duel.player1);
        returnToQueue(duel.player2);
        delete activeDuels[duelId];
    }, 3000);
}

// Handle duel timeout
function handleDuelTimeout(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    
    console.log(`⏰ Duel ${duelId} timeout`);
    
    const socket1 = io.sockets.sockets.get(users[duel.player1]?.socketId);
    const socket2 = io.sockets.sockets.get(users[duel.player2]?.socketId);
    
    if (socket1) socket1.emit('timeout', {});
    if (socket2) socket2.emit('timeout', {});
    
    setTimeout(() => {
        returnToQueue(duel.player1);
        returnToQueue(duel.player2);
        delete activeDuels[duelId];
    }, 2000);
}

// Return user to queue
function returnToQueue(userId) {
    const user = users[userId];
    if (user && user.connected && user.hasSelectedGender && !queue.includes(userId)) {
        queue.push(userId);
        console.log(`📝 ${user.firstName} returned to queue`);
    }
}

// ==================== SOCKET.IO EVENTS ====================
io.on('connection', (socket) => {
    console.log('✅ New connection:', socket.id);
    
    // AUTHENTICATION
    socket.on('auth', (data) => {
        const userId = data.userId;
        console.log(`🔐 Auth: ${userId} (${data.firstName})`);
        
        // Create or update user
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                firstName: data.firstName || 'User',
                username: data.username || '',
                photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}`,
                gender: data.gender || null,
                hasSelectedGender: data.hasSelectedGender || false,
                filter: data.filter || 'all',
                rating: data.rating || 1500,
                coins: data.coins || 100,
                level: data.level || 1,
                matches: data.matches || 0,
                duels: data.duels || 0,
                wins: data.wins || 0,
                friendsCount: getFriendsList(userId).length,
                dailySuperLikes: 3,
                socketId: socket.id,
                connected: true,
                lastActive: new Date()
            };
            console.log(` 👤 New user created: ${data.firstName}`);
        } else {
            users[userId].socketId = socket.id;
            users[userId].connected = true;
            users[userId].lastActive = new Date();
            console.log(` 👤 User reconnected: ${users[userId].firstName}`);
        }
        
        socket.userId = userId;
        
        // Send auth success with friends list
        socket.emit('auth_ok', {
            ...users[userId],
            friends: getFriendsList(userId),
            friendsCount: friendships[userId]?.length || 0
        });
    });
    
    // GENDER SELECTION
    socket.on('select_gender', (data) => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        users[userId].gender = data.gender;
        users[userId].hasSelectedGender = true;
        users[userId].filter = data.gender;
        
        console.log(`🎯 ${users[userId].firstName} selected gender: ${data.gender}`);
        
        socket.emit('gender_selected', {
            gender: data.gender,
            message: 'Gender tanlandi!'
        });
    });
    
    // ENTER QUEUE
    socket.on('enter_queue', () => {
        const userId = socket.userId;
        if (!userId || !users[userId]) return;
        
        // Check if gender selected
        if (!users[userId].hasSelectedGender) {
            socket.emit('error', { message: 'Avval gender tanlang!' });
            return;
        }
        
        // Add to queue if not already
        if (!queue.includes(userId)) {
            queue.push(userId);
            console.log(`📝 ${users[userId].firstName} entered queue (${queue.length} in queue)`);
            
            socket.emit('queue_joined', {
                position: queue.length,
                total: queue.length
            });
            
            // Try to find opponent
            setTimeout(() => findAndStartDuels(), 100);
        }
    });
    
    // LEAVE QUEUE
    socket.on('leave_queue', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        const index = queue.indexOf(userId);
        if (index > -1) {
            queue.splice(index, 1);
            console.log(`🚪 ${users[userId]?.firstName} left queue`);
        }
    });
    
    // VOTE
    socket.on('vote', (data) => {
        const userId = socket.userId;
        const { duelId, choice } = data;
        
        console.log(`🗳️ ${users[userId]?.firstName} voted: ${choice} (duel: ${duelId})`);
        
        const duel = activeDuels[duelId];
        if (!duel || duel.ended) return;
        
        // Check if user is in this duel
        if (duel.player1 !== userId && duel.player2 !== userId) return;
        
        // Record vote
        duel.votes[userId] = choice;
        
        // If both voted, process result
        if (duel.votes[duel.player1] && duel.votes[duel.player2]) {
            processDuelResult(duelId);
        }
    });
    
    // SEND CHAT INVITE
    socket.on('send_chat_invite', (data) => {
        const userId = socket.userId;
        const { partnerId } = data;
        
        if (!userId || !partnerId || !users[userId] || !users[partnerId]) return;
        
        console.log(`💬 ${users[userId].firstName} -> ${users[partnerId].firstName} chat invite`);
        
        // Check if they are friends
        if (!friendships[userId]?.includes(partnerId)) {
            socket.emit('error', { message: 'Siz bu foydalanuvchi bilan do\'st emassiz!' });
            return;
        }
        
        const requestId = generateRequestId();
        chatRequests[requestId] = {
            id: requestId,
            from: userId,
            to: partnerId,
            status: 'pending',
            timestamp: new Date()
        };
        
        // Send invite to partner
        const partnerSocket = io.sockets.sockets.get(users[partnerId].socketId);
        if (partnerSocket) {
            partnerSocket.emit('chat_invite', {
                requestId: requestId,
                fromUserId: userId,
                fromUserName: users[userId].firstName,
                fromUserPhoto: users[userId].photoUrl,
                message: `${users[userId].firstName} siz bilan chat qilishni xohlaydi!`
            });
        }
        
        socket.emit('chat_invite_sent', {
            partnerName: users[partnerId].firstName
        });
    });
    
    // GET FRIENDS LIST
    socket.on('get_friends_list', () => {
        const userId = socket.userId;
        if (!userId) return;
        
        socket.emit('friends_list', {
            friends: getFriendsList(userId),
            count: friendships[userId]?.length || 0
        });
    });
    
    // DISCONNECT
    socket.on('disconnect', () => {
        const userId = socket.userId;
        if (userId && users[userId]) {
            console.log(`❌ ${users[userId].firstName} disconnected`);
            users[userId].connected = false;
            
            // Remove from queue
            const index = queue.indexOf(userId);
            if (index > -1) {
                queue.splice(index, 1);
                console.log(` 📝 Removed from queue`);
            }
        }
    });
});

// Find and start duels
function findAndStartDuels() {
    // Clean queue (remove offline users)
    for (let i = queue.length - 1; i >= 0; i--) {
        const userId = queue[i];
        const user = users[userId];
        if (!user || !user.connected) {
            queue.splice(i, 1);
        }
    }
    
    if (queue.length < 2) return;
    
    console.log(`🔍 Looking for duels (${queue.length} in queue)...`);
    
    for (let i = 0; i < queue.length; i++) {
        const userId = queue[i];
        const opponentId = findOpponent(userId);
        
        if (opponentId) {
            startDuel(userId, opponentId);
            break;
        }
    }
}

// ==================== SERVER START ====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 LIKE DUEL SERVER - FULL MATCH SYSTEM');
    console.log(`📍 Port: ${PORT}`);
    console.log('✅ Mutual Match System Ready');
    console.log('✅ Automatic Friend Management');
    console.log('='.repeat(50));
});