// server.js - LIKE DUEL MUKAMMAL SERVER
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 3000;
const DUEL_TIMEOUT = 20000; // 20 seconds

// ==================== SOCKET.IO CONFIG ====================
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// ==================== DATA STRUCTURES ====================
const users = new Map();
const queue = new Set();
const activeDuels = new Map();
const activeChats = new Map();
const userSockets = new Map();
const userVoteHistory = new Map(); // Foydalanuvchilarning ovoz tarixi

// ==================== USER CLASS ====================
class User {
    constructor(data) {
        this.id = data.id;
        this.firstName = data.firstName || 'Foydalanuvchi';
        this.username = data.username || '';
        this.photoUrl = data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}&background=667eea&color=fff`;
        this.gender = data.gender || null;
        this.hasSelectedGender = data.hasSelectedGender || false;
        this.rating = data.rating || 1500;
        this.coins = data.coins || 100;
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.matches = data.matches || 0;
        this.duels = data.duels || 0;
        this.wins = data.wins || 0;
        this.totalLikes = data.totalLikes || 0;
        this.dailySuperLikes = data.dailySuperLikes || 3;
        this.bio = data.bio || '';
        this.socketId = data.socketId || null;
        this.connected = data.connected || true;
        this.lastActive = data.lastActive || new Date();
        this.joinedAt = data.joinedAt || new Date();
        this.isTelegramUser = data.isTelegramUser || false;
        
        // O'yin tarixi
        this.previousOpponents = new Map(); // userId -> {votes: {myVote, opponentVote}, timestamp}
        
        // Statistika
        this.updateStats();
    }

    updateStats() {
        this.stats = {
            winRate: this.duels > 0 ? Math.round((this.wins / this.duels) * 100) : 0,
            avgRating: this.rating,
            totalMatches: this.matches,
            streak: 0
        };
    }

    addOpponent(opponentId, myVote, opponentVote) {
        this.previousOpponents.set(opponentId, {
            myVote: myVote,
            opponentVote: opponentVote,
            timestamp: new Date(),
            match: (myVote === 'like' || myVote === 'super_like') && 
                   (opponentVote === 'like' || opponentVote === 'super_like')
        });
    }

    getPreviousVote(opponentId) {
        const history = this.previousOpponents.get(opponentId);
        return history ? {
            myVote: history.myVote,
            opponentVote: history.opponentVote,
            wasMatch: history.match
        } : null;
    }

    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            username: this.username,
            photoUrl: this.photoUrl,
            gender: this.gender,
            hasSelectedGender: this.hasSelectedGender,
            rating: this.rating,
            coins: this.coins,
            level: this.level,
            xp: this.xp,
            matches: this.matches,
            duels: this.duels,
            wins: this.wins,
            totalLikes: this.totalLikes,
            dailySuperLikes: this.dailySuperLikes,
            bio: this.bio,
            stats: this.stats,
            isTelegramUser: this.isTelegramUser
        };
    }
}

// ==================== DUEL CLASS ====================
class Duel {
    constructor(player1Id, player2Id) {
        this.id = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.player1 = player1Id;
        this.player2 = player2Id;
        this.votes = new Map([
            [player1Id, null],
            [player2Id, null]
        ]);
        this.startTime = new Date();
        this.ended = false;
        this.isMatch = false;
        this.chatRequests = new Map([
            [player1Id, false],
            [player2Id, false]
        ]);
        this.timeoutId = null;
        this.result = null;
        this.voteTimestamps = new Map();
    }

    addVote(playerId, choice) {
        this.votes.set(playerId, choice);
        this.voteTimestamps.set(playerId, new Date());
        
        // Ovoz bergan foydalanuvchini history ga qo'shish
        const user = users.get(playerId);
        if (user) {
            const opponentId = this.getOpponent(playerId);
            // History keyinchalik qo'shiladi, chunki hali ikkinchi ovoz yo'q
        }
        
        return this.checkIfBothVoted();
    }

    getOpponent(playerId) {
        return this.player1 === playerId ? this.player2 : this.player1;
    }

    checkIfBothVoted() {
        return this.votes.get(this.player1) !== null && 
               this.votes.get(this.player2) !== null;
    }

    getVotes() {
        return {
            player1: this.votes.get(this.player1),
            player2: this.votes.get(this.player2)
        };
    }

    toJSON() {
        return {
            id: this.id,
            player1: this.player1,
            player2: this.player2,
            votes: Object.fromEntries(this.votes),
            startTime: this.startTime,
            ended: this.ended,
            isMatch: this.isMatch,
            chatRequests: Object.fromEntries(this.chatRequests),
            result: this.result
        };
    }
}

// ==================== CHAT CLASS ====================
class Chat {
    constructor(duelId, player1Id, player2Id) {
        this.id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.duelId = duelId;
        this.player1 = player1Id;
        this.player2 = player2Id;
        this.messages = [];
        this.startedAt = new Date();
        this.lastActivity = new Date();
        this.active = true;
    }

    addMessage(senderId, message) {
        const messageObj = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            senderId: senderId,
            senderName: users.get(senderId)?.firstName || 'Noma\'lum',
            message: message.trim(),
            timestamp: new Date()
        };
        
        this.messages.push(messageObj);
        this.lastActivity = new Date();
        
        return messageObj;
    }

    getPartnerId(userId) {
        return this.player1 === userId ? this.player2 : this.player1;
    }

    toJSON() {
        return {
            id: this.id,
            duelId: this.duelId,
            player1: this.player1,
            player2: this.player2,
            messageCount: this.messages.length,
            startedAt: this.startedAt,
            lastActivity: this.lastActivity,
            active: this.active
        };
    }
}

// ==================== MATCHMAKING SYSTEM ====================
class MatchmakingSystem {
    constructor() {
        this.queue = queue;
        this.users = users;
    }

    findOpponentFor(userId) {
        const user = this.users.get(userId);
        if (!user || !user.hasSelectedGender || !user.gender) {
            console.log(`❌ ${userId} uchun opponent topilmaydi: gender tanlanmagan`);
            return null;
        }

        console.log(`🔍 ${user.firstName} (${user.gender}, Rating: ${user.rating}) uchun opponent qidirilmoqda...`);

        let bestMatch = null;
        let bestScore = -Infinity;

        for (const opponentId of this.queue) {
            if (opponentId === userId) continue;

            const opponent = this.users.get(opponentId);
            if (!opponent || !opponent.hasSelectedGender || !opponent.gender) continue;

            // Gender mosligini tekshirish
            if (!checkGenderCompatibility(user, opponent)) {
                continue;
            }

            // Bir-birlari bilan oldin o'ynagan bo'lsa, ularni o'rtasida ustunlik berish
            const previousHistory = user.getPreviousVote(opponentId);
            let historyScore = 0;
            
            if (previousHistory) {
                if (previousHistory.wasMatch) {
                    // Oldin match bo'lgan bo'lsa, yana match bo'lish ehtimoli yuqori
                    historyScore = 100;
                } else if (previousHistory.myVote === 'like' && previousHistory.opponentVote === 'skip') {
                    // Faqat men like bergan bo'lsam, yana urinib ko'rish
                    historyScore = 50;
                } else if (previousHistory.myVote === 'skip' && previousHistory.opponentVote === 'like') {
                    // Faqat opponent like bergan bo'lsa, bu safar like berish imkoniyati
                    historyScore = 30;
                }
            }

            // Rating farqini hisoblash
            const ratingDiff = Math.abs(user.rating - opponent.rating);
            const ratingScore = Math.max(0, 1000 - ratingDiff);
            
            // Level farqi
            const levelDiff = Math.abs(user.level - opponent.level);
            const levelScore = Math.max(0, 500 - (levelDiff * 10));
            
            const totalScore = ratingScore + levelScore + historyScore;
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMatch = opponentId;
            }
        }

        if (bestMatch) {
            const opponent = this.users.get(bestMatch);
            console.log(`✅ JUFT TOPILDI: ${user.firstName} (${user.rating}) + ${opponent.firstName} (${opponent.rating})`);
            return bestMatch;
        }

        console.log(`❌ ${user.firstName} uchun mos opponent topilmadi`);
        return null;
    }

    startDuel(player1Id, player2Id) {
        const player1 = users.get(player1Id);
        const player2 = users.get(player2Id);

        if (!player1 || !player2) {
            console.log(`❌ Duel boshlanmadi: foydalanuvchi ma'lumotlari yo'q`);
            return;
        }

        const duel = new Duel(player1Id, player2Id);
        activeDuels.set(duel.id, duel);

        console.log(`\n⚔️ DUEL BOSHLANDI: ${duel.id}`);
        console.log(`   👤 ${player1.firstName} (${player1.gender}, Rating: ${player1.rating})`);
        console.log(`   vs`);
        console.log(`   👤 ${player2.firstName} (${player2.gender}, Rating: ${player2.rating})`);

        // O'yin tarixini tekshirish
        const player1History = player1.getPreviousVote(player2Id);
        const player2History = player2.getPreviousVote(player1Id);

        // Socket orqali duel ma'lumotlarini yuborish
        this.sendDuelStarted(duel, player1, player2, player1History, player2History);

        // Timeout sozlash
        duel.timeoutId = setTimeout(() => {
            if (activeDuels.get(duel.id) && !duel.ended) {
                this.handleDuelTimeout(duel.id);
            }
        }, DUEL_TIMEOUT);

        return duel.id;
    }

    sendDuelStarted(duel, player1, player2, player1History, player2History) {
        const player1Socket = io.sockets.sockets.get(player1.socketId);
        const player2Socket = io.sockets.sockets.get(player2.socketId);

        if (player1Socket) {
            player1Socket.emit('duel_started', {
                duelId: duel.id,
                opponent: {
                    id: player2.id,
                    name: player2.firstName,
                    username: player2.username,
                    photo: player2.photoUrl,
                    rating: player2.rating,
                    matches: player2.matches,
                    level: player2.level,
                    gender: player2.gender,
                    bio: player2.bio
                },
                timeLeft: DUEL_TIMEOUT / 1000,
                previousHistory: player1History
            });
        }

        if (player2Socket) {
            player2Socket.emit('duel_started', {
                duelId: duel.id,
                opponent: {
                    id: player1.id,
                    name: player1.firstName,
                    username: player1.username,
                    photo: player1.photoUrl,
                    rating: player1.rating,
                    matches: player1.matches,
                    level: player1.level,
                    gender: player1.gender,
                    bio: player1.bio
                },
                timeLeft: DUEL_TIMEOUT / 1000,
                previousHistory: player2History
            });
        }
    }

    handleDuelTimeout(duelId) {
        const duel = activeDuels.get(duelId);
        if (!duel || duel.ended) return;

        duel.ended = true;
        console.log(`⏰ Duel vaqti tugadi: ${duelId}`);

        const player1 = users.get(duel.player1);
        const player2 = users.get(duel.player2);

        // O'yin tarixini saqlash (ikkalasi ham ovoz bermagan)
        if (player1 && player2) {
            player1.addOpponent(player2.id, null, null);
            player2.addOpponent(player1.id, null, null);
        }

        if (player1?.socketId) {
            const socket = io.sockets.sockets.get(player1.socketId);
            if (socket) socket.emit('timeout');
        }

        if (player2?.socketId) {
            const socket = io.sockets.sockets.get(player2.socketId);
            if (socket) socket.emit('timeout');
        }

        // 3 soniyadan keyin navbatga qaytarish
        setTimeout(() => {
            this.returnPlayersToQueue([duel.player1, duel.player2]);
            activeDuels.delete(duelId);
        }, 3000);
    }

    returnPlayersToQueue(playerIds) {
        console.log(`\n🔄 Navbatga qaytarish boshlanmoqda...`);
        
        playerIds.forEach(playerId => {
            if (playerId) {
                const player = users.get(playerId);
                if (player && player.hasSelectedGender && player.connected) {
                    if (!queue.has(playerId)) {
                        queue.add(playerId);
                        console.log(`✅ ${player.firstName} navbatga qayta qo'shildi`);
                        
                        if (player.socketId) {
                            const socket = io.sockets.sockets.get(player.socketId);
                            if (socket) {
                                socket.emit('return_to_queue', {
                                    position: Array.from(queue).indexOf(playerId) + 1,
                                    total: queue.size
                                });
                            }
                        }
                    }
                }
            }
        });

        // Navbat holatini yangilash
        this.updateWaitingCount();
    }

    updateWaitingCount() {
        const count = queue.size;
        console.log(`📊 Navbat holati: ${count} ta foydalanuvchi`);
        
        queue.forEach(userId => {
            const user = users.get(userId);
            if (user?.socketId) {
                const socket = io.sockets.sockets.get(user.socketId);
                if (socket) {
                    const position = Array.from(queue).indexOf(userId) + 1;
                    socket.emit('waiting_count', {
                        count: count,
                        position: position,
                        estimatedTime: Math.max(5, position * 3)
                    });
                }
            }
        });
    }

    processQueue() {
        if (this.queue.size < 2) {
            console.log(`⚠️ Juftlashish uchun kamida 2 ta foydalanuvchi kerak (${this.queue.size} ta)`);
            return 0;
        }

        console.log(`\n🔄 DUEL QIDIRISH (Navbatda: ${this.queue.size} ta)`);
        
        const processedUsers = new Set();
        let duelCount = 0;
        const queueArray = Array.from(this.queue);

        for (const userId of queueArray) {
            if (processedUsers.has(userId) || !this.queue.has(userId)) continue;

            const opponentId = this.findOpponentFor(userId);
            
            if (opponentId && this.queue.has(opponentId) && !processedUsers.has(opponentId)) {
                // Navbatdan olib tashlash
                this.queue.delete(userId);
                this.queue.delete(opponentId);
                
                // Duelni boshlash
                this.startDuel(userId, opponentId);
                
                processedUsers.add(userId);
                processedUsers.add(opponentId);
                duelCount++;
                
                // Bir vaqtning o'zida maksimal 10 duel
                if (duelCount >= 10) break;
            }
        }

        if (duelCount > 0) {
            console.log(`✅ ${duelCount} ta duel boshlandi`);
        }

        return duelCount;
    }
}

// ==================== HELPER FUNCTIONS ====================
function checkGenderCompatibility(user1, user2) {
    if (!user1?.gender || !user2?.gender) return false;
    if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
    return user1.gender !== user2.gender;
}

function calculateEloRating(rating1, rating2, winner) {
    const K = 32;
    const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
    const expected2 = 1 / (1 + Math.pow(10, (rating1 - rating2) / 400));
    
    let newRating1, newRating2;
    
    if (winner === 1) {
        newRating1 = rating1 + K * (1 - expected1);
        newRating2 = rating2 + K * (0 - expected2);
    } else if (winner === 2) {
        newRating1 = rating1 + K * (0 - expected1);
        newRating2 = rating2 + K * (1 - expected2);
    } else {
        newRating1 = rating1 + K * (0.5 - expected1);
        newRating2 = rating2 + K * (0.5 - expected2);
    }
    
    return {
        player1: Math.round(newRating1),
        player2: Math.round(newRating2)
    };
}

// ==================== REWARD SYSTEM ====================
class RewardSystem {
    static calculateRewards(duel, user1, user2) {
        const votes = duel.getVotes();
        
        // O'yin tarixini saqlash
        user1.addOpponent(user2.id, votes.player1, votes.player2);
        user2.addOpponent(user1.id, votes.player2, votes.player1);
        
        const isMatch = (votes.player1 === 'like' || votes.player1 === 'super_like') && 
                       (votes.player2 === 'like' || votes.player2 === 'super_like');

        if (isMatch) {
            return this.calculateMatchRewards(duel, user1, user2, votes);
        } else if (votes.player1 === 'like' || votes.player1 === 'super_like') {
            return this.calculateSingleLikeRewards(user1, votes.player1, user2, votes.player2);
        } else if (votes.player2 === 'like' || votes.player2 === 'super_like') {
            return this.calculateSingleLikeRewards(user2, votes.player2, user1, votes.player1);
        } else {
            return this.calculateNoLikeRewards(user1, user2);
        }
    }

    static calculateMatchRewards(duel, user1, user2, votes) {
        const baseCoins = 50;
        const baseXP = 30;
        
        const rewards = {
            player1: { coins: baseCoins, xp: baseXP },
            player2: { coins: baseCoins, xp: baseXP }
        };

        // SUPER LIKE bonus
        if (votes.player1 === 'super_like') {
            rewards.player1.coins += 20;
            rewards.player1.xp += 15;
            user1.dailySuperLikes = Math.max(0, user1.dailySuperLikes - 1);
        }
        if (votes.player2 === 'super_like') {
            rewards.player2.coins += 20;
            rewards.player2.xp += 15;
            user2.dailySuperLikes = Math.max(0, user2.dailySuperLikes - 1);
        }

        // Rating hisoblash (match bo'lsa ikkalasi ham g'olib)
        const newRatings = calculateEloRating(user1.rating, user2.rating, 0);
        user1.rating = newRatings.player1;
        user2.rating = newRatings.player2;

        // Statistikani yangilash
        user1.matches++;
        user2.matches++;
        user1.wins++;
        user2.wins++;
        user1.duels++;
        user2.duels++;
        user1.totalLikes++;
        user2.totalLikes++;

        // Coins va XP qo'shish
        user1.coins += rewards.player1.coins;
        user2.coins += rewards.player2.coins;
        user1.xp += rewards.player1.xp;
        user2.xp += rewards.player2.xp;

        // Level tekshirish
        this.checkLevelUp(user1);
        this.checkLevelUp(user2);

        return {
            isMatch: true,
            rewards: {
                player1: rewards.player1,
                player2: rewards.player2
            },
            newRatings: {
                player1: user1.rating,
                player2: user2.rating
            },
            votes: votes
        };
    }

    static calculateSingleLikeRewards(user, vote, opponent, opponentVote) {
        const coins = vote === 'super_like' ? 30 : 10;
        const xp = vote === 'super_like' ? 15 : 5;

        if (vote === 'super_like') {
            user.dailySuperLikes = Math.max(0, user.dailySuperLikes - 1);
        }

        user.coins += coins;
        user.xp += xp;
        user.duels++;
        user.totalLikes++;

        // Agar opponent like bermagan bo'lsa, opponent ham duellar sonini oshiramiz
        if (opponent) {
            opponent.duels++;
        }

        this.checkLevelUp(user);

        return {
            isMatch: false,
            singleLike: true,
            voter: user.id,
            voterVote: vote,
            opponentVote: opponentVote,
            rewards: { coins, xp },
            opponentName: opponent?.firstName || 'Raqib'
        };
    }

    static calculateNoLikeRewards(user1, user2) {
        user1.duels++;
        user2.duels++;

        return {
            isMatch: false,
            singleLike: false,
            votes: {
                player1: 'skip',
                player2: 'skip'
            }
        };
    }

    static checkLevelUp(user) {
        const neededXP = user.level * 100;
        if (user.xp >= neededXP) {
            user.level++;
            user.xp -= neededXP;
            console.log(`🎊 ${user.firstName} yangi levelga ko'tarildi: ${user.level}`);
            return true;
        }
        return false;
    }
}

// ==================== INITIALIZE SYSTEMS ====================
const matchmakingSystem = new MatchmakingSystem();

// ==================== EXPRESS MIDDLEWARE ====================
app.use(express.static('public'));
app.use(express.json());

// ==================== API ROUTES ====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        server: 'Like Duel',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        stats: {
            totalUsers: users.size,
            onlineUsers: Array.from(users.values()).filter(u => u.connected).length,
            inQueue: queue.size,
            activeDuels: activeDuels.size,
            activeChats: activeChats.size
        }
    });
});

// ==================== SOCKET.IO EVENT HANDLERS ====================
io.on('connection', (socket) => {
    console.log('\n' + '='.repeat(50));
    console.log('✅ Yangi WebSocket ulanishi:', socket.id);
    console.log('='.repeat(50));

    // ==================== AUTHENTICATION ====================
    socket.on('auth', (data) => {
        try {
            const userId = data.userId;
            if (!userId) {
                socket.emit('error', { message: 'User ID yo\'q' });
                return;
            }

            let user = users.get(userId);
            
            if (user) {
                // Mavjud foydalanuvchini yangilash
                user.socketId = socket.id;
                user.connected = true;
                user.lastActive = new Date();
                console.log(`👤 Foydalanuvchi qayta ulandi: ${user.firstName}`);
            } else {
                // Yangi foydalanuvchi yaratish
                user = new User({
                    id: userId,
                    firstName: data.firstName || 'Foydalanuvchi',
                    username: data.username || '',
                    photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName || 'User')}&background=667eea&color=fff`,
                    gender: data.gender || null,
                    hasSelectedGender: data.hasSelectedGender || false,
                    socketId: socket.id
                });
                users.set(userId, user);
                console.log(`👤 Yangi foydalanuvchi yaratildi: ${user.firstName}`);
            }

            socket.userId = userId;
            userSockets.set(userId, socket.id);

            // Clientga javob yuborish
            socket.emit('auth_ok', user.toJSON());

            console.log(`📊 ${user.firstName} gender holati: ${user.hasSelectedGender ? `Tanlangan (${user.gender})` : 'Tanlanmagan'}`);

            // Agar gender tanlanmagan bo'lsa
            if (!user.hasSelectedGender) {
                console.log(`⚠️ ${user.firstName} gender tanlamagan, modal ko'rsatish`);
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
                });
            } else {
                // Agar gender tanlagan bo'lsa, navbatga qo'shish
                if (!queue.has(userId)) {
                    queue.add(userId);
                    console.log(`✅ ${user.firstName} navbatga qo'shildi`);
                    matchmakingSystem.updateWaitingCount();
                }
            }

        } catch (error) {
            console.error('❌ Auth xatosi:', error);
            socket.emit('error', { message: 'Autentifikatsiya xatosi' });
        }
    });

    // ==================== GENDER SELECTION ====================
    socket.on('select_gender', (data) => {
        try {
            const userId = socket.userId;
            if (!userId) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }

            const user = users.get(userId);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }

            console.log(`\n🎯 GENDER TANLASH: ${user.firstName} -> ${data.gender}`);

            user.gender = data.gender;
            user.hasSelectedGender = true;

            socket.emit('gender_selected', {
                gender: data.gender,
                hasSelectedGender: true,
                message: `Gender tanlandi! ${
                    data.gender === 'male' ? 'Faqat ayollar bilan duel' :
                    data.gender === 'female' ? 'Faqat erkaklar bilan duel' :
                    'Hamma bilan duel'
                }`
            });

            // Navbatga qo'shish
            if (!queue.has(userId)) {
                queue.add(userId);
                console.log(`✅ ${user.firstName} navbatga qo'shildi`);
                matchmakingSystem.updateWaitingCount();
            }

            // Duel qidirish
            setTimeout(() => {
                matchmakingSystem.processQueue();
            }, 1000);

        } catch (error) {
            console.error('❌ Gender selection xatosi:', error);
            socket.emit('error', { message: 'Gender tanlash xatosi' });
        }
    });

    // ==================== QUEUE MANAGEMENT ====================
    socket.on('enter_queue', () => {
        try {
            const userId = socket.userId;
            if (!userId) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }

            const user = users.get(userId);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }

            console.log(`\n🚀 NAVBATGA KIRISH: ${user.firstName}`);

            // Gender tekshirish
            if (!user.hasSelectedGender) {
                console.log(`❌ ${user.firstName} navbatga kira olmaydi - gender tanlanmagan!`);
                socket.emit('show_gender_selection', {
                    mandatory: true,
                    message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
                });
                return;
            }

            // Agar allaqachon navbatda bo'lsa
            if (queue.has(userId)) {
                const position = Array.from(queue).indexOf(userId) + 1;
                console.log(`ℹ️ ${user.firstName} allaqachon navbatda (o'rni: ${position})`);
                socket.emit('queue_joined', {
                    position: position,
                    total: queue.size
                });
                return;
            }

            // Navbatga qo'shish
            queue.add(userId);
            const position = queue.size;
            console.log(`✅ ${user.firstName} navbatga qo'shildi. O'rni: ${position}`);

            matchmakingSystem.updateWaitingCount();

            socket.emit('queue_joined', {
                position: position,
                total: queue.size
            });

            // Duel qidirish
            setTimeout(() => {
                matchmakingSystem.processQueue();
            }, 500);

        } catch (error) {
            console.error('❌ Enter queue xatosi:', error);
            socket.emit('error', { message: 'Navbatga kirish xatosi' });
        }
    });

    socket.on('leave_queue', () => {
        try {
            const userId = socket.userId;
            if (!userId) return;

            if (queue.has(userId)) {
                const user = users.get(userId);
                if (user) {
                    console.log(`🚪 ${user.firstName} navbatdan chiqdi`);
                }
                queue.delete(userId);
                matchmakingSystem.updateWaitingCount();
                socket.emit('left_queue');
            }
        } catch (error) {
            console.error('❌ Leave queue xatosi:', error);
        }
    });

    // ==================== DUEL VOTING ====================
    socket.on('vote', (data) => {
        try {
            const userId = socket.userId;
            const { duelId, choice } = data;

            if (!userId) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }

            const duel = activeDuels.get(duelId);
            if (!duel) {
                socket.emit('error', { message: 'Duel topilmadi' });
                return;
            }

            if (duel.ended) {
                socket.emit('error', { message: 'Bu duel tugagan' });
                return;
            }

            const user = users.get(userId);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }

            console.log(`🗳️ VOTE: ${user.firstName} -> ${choice} (duel: ${duelId.substring(0, 10)}...)`);

            // SUPER LIKE limit tekshirish
            if (choice === 'super_like' && user.dailySuperLikes <= 0) {
                socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
                return;
            }

            // Ovozni qo'shish
            const bothVoted = duel.addVote(userId, choice);

            if (bothVoted) {
                console.log(`📊 Ikkala ovoz ham to'plandi, natija hisoblanmoqda...`);
                processDuelResult(duelId);
            } else {
                const opponentId = duel.getOpponent(userId);
                const opponent = users.get(opponentId);
                console.log(`⏳ ${opponent?.firstName} ovozini kutish...`);
                
                // Ovoz berganligini bildirish (lekin qaysi ovoz ekanligini aytmaslik)
                socket.emit('vote_registered');
            }

        } catch (error) {
            console.error('❌ Vote xatosi:', error);
            socket.emit('error', { message: 'Ovoz berish xatosi' });
        }
    });

    // ==================== CHAT SYSTEM ====================
    socket.on('chat_request', (data) => {
        try {
            const userId = socket.userId;
            const { duelId } = data;

            if (!userId) {
                socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
                return;
            }

            const duel = activeDuels.get(duelId);
            if (!duel || !duel.isMatch || duel.ended) {
                socket.emit('error', { message: 'Chat mumkin emas' });
                return;
            }

            const user = users.get(userId);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }

            console.log(`💬 CHAT REQUEST: ${user.firstName} -> ${duelId.substring(0, 10)}...`);

            duel.chatRequests.set(userId, true);

            const opponentId = duel.getOpponent(userId);
            const opponent = users.get(opponentId);

            console.log(`   ${user.firstName} chat so'radi. Opponent: ${opponent?.firstName}`);

            // Agar ikkinchi o'yinchi ham chat so'ragan bo'lsa
            if (duel.chatRequests.get(duel.player1) && duel.chatRequests.get(duel.player2)) {
                console.log(`✅ IKKALASI HAM CHAT SO'RADI! Chat boshlanmoqda...`);
                
                // Chatni boshlash
                const chat = new Chat(duelId, duel.player1, duel.player2);
                activeChats.set(chat.id, chat);
                
                // Duelni o'chirish
                activeDuels.delete(duelId);
                if (duel.timeoutId) clearTimeout(duel.timeoutId);

                // Ikkala o'yinchiga ham chat boshlanganini bildirish
                sendChatStarted(chat, duel.player1, duel.player2);
                
            } else {
                // Faqat biri so'ragan, ikkinchisiga so'rov yuborish
                const opponentSocketId = userSockets.get(opponentId);
                if (opponentSocketId) {
                    const opponentSocket = io.sockets.sockets.get(opponentSocketId);
                    if (opponentSocket) {
                        opponentSocket.emit('chat_request_received', {
                            from: userId,
                            name: user.firstName,
                            duelId: duelId
                        });
                    }
                }
            }

        } catch (error) {
            console.error('❌ Chat request xatosi:', error);
            socket.emit('error', { message: 'Chat so\'rovi xatosi' });
        }
    });

    socket.on('send_chat_message', (data) => {
        try {
            const userId = socket.userId;
            const { chatId, message } = data;

            if (!userId || !message?.trim()) {
                socket.emit('error', { message: 'Xabar bo\'sh bo\'lmasligi kerak' });
                return;
            }

            const chat = activeChats.get(chatId);
            if (!chat || !chat.active) {
                socket.emit('error', { message: 'Chat topilmadi yoki faol emas' });
                return;
            }

            const user = users.get(userId);
            if (!user) {
                socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
                return;
            }

            console.log(`📨 CHAT MESSAGE: ${user.firstName} -> "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);

            const messageObj = chat.addMessage(userId, message);
            
            // Xabarni yuborgan foydalanuvchiga
            socket.emit('chat_message_sent', {
                chatId: chatId,
                message: messageObj
            });
            
            // Xabarni qabul qiluvchiga
            const receiverId = chat.getPartnerId(userId);
            const receiverSocketId = userSockets.get(receiverId);
            if (receiverSocketId) {
                const receiverSocket = io.sockets.sockets.get(receiverSocketId);
                if (receiverSocket) {
                    receiverSocket.emit('chat_message_received', {
                        chatId: chatId,
                        message: messageObj
                    });
                }
            }

        } catch (error) {
            console.error('❌ Send chat message xatosi:', error);
            socket.emit('error', { message: 'Xabar yuborish xatosi' });
        }
    });

    socket.on('skip_chat', (data) => {
        try {
            const userId = socket.userId;
            const { duelId } = data;

            if (!userId) return;

            const duel = activeDuels.get(duelId);
            if (!duel) return;

            const user = users.get(userId);
            console.log(`🚪 SKIP CHAT: ${user?.firstName || userId} -> ${duelId.substring(0, 10)}...`);

            // Navbatga qaytarish
            matchmakingSystem.returnPlayersToQueue([duel.player1, duel.player2]);
            activeDuels.delete(duelId);
            if (duel.timeoutId) clearTimeout(duel.timeoutId);

            // Ikkinchi o'yinchiga ham chat o'tkazib yuborilganini bildirish
            const opponentId = duel.getOpponent(userId);
            const opponentSocketId = userSockets.get(opponentId);
            if (opponentSocketId) {
                const opponentSocket = io.sockets.sockets.get(opponentSocketId);
                if (opponentSocket) {
                    opponentSocket.emit('chat_skipped', {
                        by: user?.firstName || 'Raqib'
                    });
                }
            }

        } catch (error) {
            console.error('❌ Skip chat xatosi:', error);
        }
    });

    socket.on('leave_chat', (data) => {
        try {
            const userId = socket.userId;
            const { chatId } = data;

            if (!userId) return;

            const chat = activeChats.get(chatId);
            if (!chat) return;

            const user = users.get(userId);
            console.log(`👋 LEAVE CHAT: ${user?.firstName || userId} -> ${chatId.substring(0, 10)}...`);

            chat.active = false;

            // Ikkinchi o'yinchiga ham chat tugaganini bildirish
            const opponentId = chat.getPartnerId(userId);
            const opponentSocketId = userSockets.get(opponentId);
            if (opponentSocketId) {
                const opponentSocket = io.sockets.sockets.get(opponentSocketId);
                if (opponentSocket) {
                    opponentSocket.emit('chat_ended', {
                        by: user?.firstName || 'Raqib',
                        reason: 'left'
                    });
                }
            }

            // Navbatga qaytarish
            matchmakingSystem.returnPlayersToQueue([chat.player1, chat.player2]);

            // 5 soniyadan keyin chatni o'chirish
            setTimeout(() => {
                activeChats.delete(chatId);
                console.log(`🧹 Chat o'chirildi: ${chatId}`);
            }, 5000);

        } catch (error) {
            console.error('❌ Leave chat xatosi:', error);
        }
    });

    // ==================== DISCONNECTION ====================
    socket.on('disconnect', () => {
        try {
            const userId = socket.userId;
            if (!userId) {
                console.log('❌ WebSocket ulanishi uzildi (auth qilinmagan)');
                return;
            }

            const user = users.get(userId);
            const userName = user?.firstName || userId;

            console.log(`\n🔌 DISCONNECT: ${userName}`);
            
            if (user) {
                user.connected = false;
                user.lastActive = new Date();
                user.socketId = null;
                
                // Navbatdan olish
                if (queue.has(userId)) {
                    queue.delete(userId);
                    console.log(`   🚪 ${userName} navbatdan chiqdi`);
                    matchmakingSystem.updateWaitingCount();
                }
                
                // User sockets map'dan olish
                userSockets.delete(userId);
                
                // Faol duelda bo'lsa
                for (const [duelId, duel] of activeDuels) {
                    if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
                        duel.ended = true;
                        
                        const opponentId = duel.getOpponent(userId);
                        const opponent = users.get(opponentId);
                        const opponentSocketId = userSockets.get(opponentId);
                        
                        if (opponentSocketId) {
                            const opponentSocket = io.sockets.sockets.get(opponentSocketId);
                            if (opponentSocket) {
                                opponentSocket.emit('opponent_left', {
                                    name: userName
                                });
                            }
                        }
                        
                        // Navbatga qaytarish
                        if (opponent && opponent.hasSelectedGender && opponent.connected) {
                            if (!queue.has(opponentId)) {
                                queue.add(opponentId);
                                console.log(`   ✅ ${opponent.firstName} navbatga qayta qo'shildi`);
                            }
                        }
                        
                        activeDuels.delete(duelId);
                        if (duel.timeoutId) clearTimeout(duel.timeoutId);
                        
                        console.log(`   ❌ ${userName} duelni tark etdi: ${duelId.substring(0, 10)}...`);
                        break;
                    }
                }
                
                // Faol chatda bo'lsa
                for (const [chatId, chat] of activeChats) {
                    if ((chat.player1 === userId || chat.player2 === userId) && chat.active) {
                        chat.active = false;
                        
                        const opponentId = chat.getPartnerId(userId);
                        const opponentSocketId = userSockets.get(opponentId);
                        
                        if (opponentSocketId) {
                            const opponentSocket = io.sockets.sockets.get(opponentSocketId);
                            if (opponentSocket) {
                                opponentSocket.emit('chat_ended', {
                                    by: userName,
                                    reason: 'disconnected'
                                });
                            }
                        }
                        
                        console.log(`   💬 ${userName} chatni tark etdi: ${chatId.substring(0, 10)}...`);
                        
                        // 5 soniyadan keyin chatni o'chirish
                        setTimeout(() => {
                            activeChats.delete(chatId);
                        }, 5000);
                        break;
                    }
                }
            }
            
            console.log('='.repeat(50));

        } catch (error) {
            console.error('❌ Disconnect xatosi:', error);
        }
    });
});

// ==================== DUEL RESULT PROCESSING ====================
function processDuelResult(duelId) {
    try {
        const duel = activeDuels.get(duelId);
        if (!duel || duel.ended) return;

        duel.ended = true;
        if (duel.timeoutId) clearTimeout(duel.timeoutId);

        const player1 = users.get(duel.player1);
        const player2 = users.get(duel.player2);

        if (!player1 || !player2) {
            console.log(`❌ Foydalanuvchi ma'lumotlari yo'q, duel bekor qilindi`);
            activeDuels.delete(duelId);
            return;
        }

        console.log(`\n🏁 DUEL NATIJASI: ${duelId}`);
        console.log(`   ${player1.firstName}: ${duel.votes.get(duel.player1)}`);
        console.log(`   ${player2.firstName}: ${duel.votes.get(duel.player2)}`);

        // Mukofotlarni hisoblash
        const result = RewardSystem.calculateRewards(duel, player1, player2);

        // Natijani saqlash
        duel.result = result;
        duel.isMatch = result.isMatch;

        // Foydalanuvchi statistikasini yangilash
        player1.updateStats();
        player2.updateStats();

        // Natijalarni foydalanuvchilarga yuborish
        sendDuelResults(duel, player1, player2, result);

        // Agar match bo'lsa, chat so'rovlarini sozlash
        if (result.isMatch) {
            duel.chatRequests = new Map([
                [duel.player1, false],
                [duel.player2, false]
            ]);
            
            // 30 soniyadan keyin navbatga qaytarish (agar chat boshlanmasa)
            duel.timeoutId = setTimeout(() => {
                if (activeDuels.get(duelId) && !duel.chatRequests.get(duel.player1) && !duel.chatRequests.get(duel.player2)) {
                    matchmakingSystem.returnPlayersToQueue([duel.player1, duel.player2]);
                    activeDuels.delete(duelId);
                }
            }, 30000);
            
        } else {
            // Match bo'lmagan holatda, 3 soniyadan keyin navbatga qaytarish
            setTimeout(() => {
                matchmakingSystem.returnPlayersToQueue([duel.player1, duel.player2]);
                activeDuels.delete(duelId);
            }, 3000);
        }

    } catch (error) {
        console.error('❌ Duel result processing xatosi:', error);
    }
}

function sendDuelResults(duel, player1, player2, result) {
    try {
        if (result.isMatch) {
            // MATCH holati
            const player1Socket = io.sockets.sockets.get(player1.socketId);
            const player2Socket = io.sockets.sockets.get(player2.socketId);

            if (player1Socket) {
                player1Socket.emit('match', {
                    duelId: duel.id,
                    partner: {
                        id: player2.id,
                        name: player2.firstName,
                        username: player2.username,
                        photo: player2.photoUrl,
                        gender: player2.gender,
                        bio: player2.bio
                    },
                    rewards: result.rewards.player1,
                    newRating: result.newRatings.player1,
                    isRematch: player1.getPreviousVote(player2.id)?.wasMatch || false,
                    mutualLike: true,
                    votes: result.votes
                });
            }

            if (player2Socket) {
                player2Socket.emit('match', {
                    duelId: duel.id,
                    partner: {
                        id: player1.id,
                        name: player1.firstName,
                        username: player1.username,
                        photo: player1.photoUrl,
                        gender: player1.gender,
                        bio: player1.bio
                    },
                    rewards: result.rewards.player2,
                    newRating: result.newRatings.player2,
                    isRematch: player2.getPreviousVote(player1.id)?.wasMatch || false,
                    mutualLike: true,
                    votes: result.votes
                });
            }

        } else if (result.singleLike) {
            // Faqat biri like bergan holat
            const voterId = result.voter;
            const voter = users.get(voterId);
            const opponentId = voterId === duel.player1 ? duel.player2 : duel.player1;
            const opponent = users.get(opponentId);

            const voterSocket = io.sockets.sockets.get(voter?.socketId);
            const opponentSocket = io.sockets.sockets.get(opponent?.socketId);

            if (voterSocket) {
                voterSocket.emit('liked_only', {
                    opponentName: opponent?.firstName || 'Raqib',
                    reward: result.rewards,
                    yourVote: result.voterVote,
                    opponentVote: result.opponentVote
                });
            }

            if (opponentSocket) {
                opponentSocket.emit('no_match', {
                    opponentVote: result.opponentVote,
                    yourVote: result.voterVote
                });
            }

        } else {
            // Hech kim like bermagan holat
            const player1Socket = io.sockets.sockets.get(player1.socketId);
            const player2Socket = io.sockets.sockets.get(player2.socketId);

            if (player1Socket) {
                player1Socket.emit('no_match', {
                    yourVote: 'skip',
                    opponentVote: 'skip'
                });
            }
            if (player2Socket) {
                player2Socket.emit('no_match', {
                    yourVote: 'skip',
                    opponentVote: 'skip'
                });
            }
        }

    } catch (error) {
        console.error('❌ Send duel results xatosi:', error);
    }
}

function sendChatStarted(chat, player1Id, player2Id) {
    try {
        const player1 = users.get(player1Id);
        const player2 = users.get(player2Id);

        const player1Socket = io.sockets.sockets.get(player1?.socketId);
        const player2Socket = io.sockets.sockets.get(player2?.socketId);

        if (player1Socket) {
            player1Socket.emit('chat_started', {
                chatId: chat.id,
                partner: {
                    id: player2Id,
                    name: player2?.firstName || 'Raqib',
                    username: player2?.username,
                    photo: player2?.photoUrl,
                    gender: player2?.gender,
                    bio: player2?.bio
                }
            });
        }

        if (player2Socket) {
            player2Socket.emit('chat_started', {
                chatId: chat.id,
                partner: {
                    id: player1Id,
                    name: player1?.firstName || 'Raqib',
                    username: player1?.username,
                    photo: player1?.photoUrl,
                    gender: player1?.gender,
                    bio: player1?.bio
                }
            });
        }

    } catch (error) {
        console.error('❌ Send chat started xatosi:', error);
    }
}

// ==================== PERIODIC TASKS ====================
setInterval(() => {
    if (queue.size >= 2) {
        matchmakingSystem.processQueue();
    }
}, 3000); // 3 soniyada bir matchmaking

// ==================== SERVER STARTUP ====================
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 LIKE DUEL SERVER - PRODUCTION READY');
    console.log('='.repeat(70));
    console.log(`📍 Server ishga tushdi: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log('='.repeat(70));
    console.log('✅ Smart matchmaking system');
    console.log('✅ Voting history tracking');
    console.log('✅ Rematch algorithm');
    console.log('✅ Real-time chat system');
    console.log('✅ Automatic queue management');
    console.log('='.repeat(70));
});