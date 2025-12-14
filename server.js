// server.js - MAJBURIY GENDER TANLASH & O'ZARO DO'STLIK
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// ==================== MAJBURIY GENDER KLASSI ====================
class Player {
  constructor(socket, userData) {
    this.socket = socket;
    this.id = userData.userId || 'user_' + Date.now();
    this.telegramId = userData.telegramId || userData.userId || this.id;
    this.username = userData.username || 'user_' + this.id;
    this.firstName = userData.firstName || userData.first_name || 'Foydalanuvchi';
    this.lastName = userData.lastName || userData.last_name || '';
    this.name = userData.name || userData.firstName || 'Foydalanuvchi';
    this.photo = userData.photo || userData.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=667eea&color=fff`;
    this.bio = userData.bio || '';
    this.gender = userData.gender || null;
    this.level = 1;
    this.xp = 0;
    this.coins = 100;
    this.rating = 1500;
    this.matches = 0;
    this.duelsPlayed = 0;
    this.duelsWon = 0;
    this.currentWinStreak = 0;
    this.bestWinStreak = 0;
    this.dailySuperLikes = 0;
    this.lastResetDate = new Date().toDateString();
    this.friends = [];
    this.friendRequests = [];
    this.blockedUsers = [];
    this.achievements = [];
    this.shopItems = [];
    this.dailyQuests = [];
    this.currentMatch = null;
    this.lastSeen = new Date();
    this.online = true;
    this.hasSelectedGender = userData.hasSelectedGender || false; // MAJBURIY GENDER
    this.mutualLikes = [];
    this.settings = {
      notifications: true,
      sound: true,
      theme: 'default'
    };
  }
  
  addXP(amount) {
    this.xp += amount;
    const neededXP = this.level * 100;
    if (this.xp >= neededXP) {
      this.level++;
      this.xp -= neededXP;
      this.coins += this.level * 50;
      return { leveledUp: true, newLevel: this.level };
    }
    return { leveledUp: false };
  }
  
  canUseSuperLike() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySuperLikes = 0;
      this.lastResetDate = today;
    }
    return this.dailySuperLikes < 3;
  }
  
  useSuperLike() {
    if (this.canUseSuperLike()) {
      this.dailySuperLikes++;
      return true;
    }
    return false;
  }
  
  addFriend(friendId) {
    if (!this.friends.includes(friendId) && friendId !== this.id) {
      this.friends.push(friendId);
      return true;
    }
    return false;
  }
  
  addMutualLike(userId) {
    if (!this.mutualLikes.includes(userId) && userId !== this.id) {
      this.mutualLikes.push(userId);
      return true;
    }
    return false;
  }
  
  getMutualLikesCount() {
    return this.mutualLikes.length;
  }
}

class RatingSystem {
  calculateElo(winnerRating, loserRating) {
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
    
    return {
      winner: Math.round(winnerRating + K * (1 - expectedWinner)),
      loser: Math.round(loserRating + K * (0 - expectedLoser))
    };
  }
}

class MatchHistory {
  constructor() {
    this.history = new Map();
    this.mutualMatches = new Map();
  }
  
  addMatch(userId, opponentId, result, votes = {}) {
    if (!this.history.has(userId)) this.history.set(userId, []);
    
    this.history.get(userId).push({
      opponentId,
      result,
      votes,
      timestamp: new Date()
    });
  }
  
  addMutualMatch(userId, opponentId) {
    if (!this.mutualMatches.has(userId)) this.mutualMatches.set(userId, []);
    if (!this.mutualMatches.has(opponentId)) this.mutualMatches.set(opponentId, []);
    
    const userMatches = this.mutualMatches.get(userId);
    const opponentMatches = this.mutualMatches.get(opponentId);
    
    if (!userMatches.includes(opponentId)) userMatches.push(opponentId);
    if (!opponentMatches.includes(userId)) opponentMatches.push(userId);
  }
  
  hasMetBefore(userId, opponentId) {
    if (!this.history.has(userId)) return false;
    return this.history.get(userId).some(match => match.opponentId === opponentId);
  }
  
  getPreviousResult(userId, opponentId) {
    if (!this.history.has(userId)) return null;
    const matches = this.history.get(userId).filter(m => m.opponentId === opponentId);
    return matches.length > 0 ? matches[matches.length - 1].result : null;
  }
  
  getPreviousVotes(userId, opponentId) {
    if (!this.history.has(userId)) return null;
    const matches = this.history.get(userId).filter(m => m.opponentId === opponentId);
    return matches.length > 0 ? matches[matches.length - 1].votes : null;
  }
}

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const gameState = {
  waitingPlayers: [],
  activeDuels: new Map(),
  playerSockets: new Map(),
  activeUsers: new Map(),
  ratingSystem: new RatingSystem(),
  matchHistory: new MatchHistory(),
  leaderboard: {
    rating: [],
    matches: [],
    coins: [],
    updatedAt: null
  }
};

// ==================== DO'KON VA VAZIFALAR ====================
const SHOP_ITEMS = [
  { id: 1, name: "Bronza Ramka", description: "Profil ramkasi", price: 100, type: "avatar_frame", icon: "🟤" },
  { id: 2, name: "3 ta SUPER LIKE", description: "Kunlik limitni oshirish", price: 300, type: "super_like_boost", icon: "💖" },
  { id: 3, name: "30 soniya Duel", description: "Vaqtni oshirish", price: 150, type: "time_boost", icon: "⏱️" },
  { id: 4, name: "VIP Profil", description: "1 kunlik VIP", price: 500, type: "vip_badge", icon: "👑" }
];

const DAILY_QUESTS = [
  { id: 1, title: "3 ta duel", description: "3 ta duel o'ynang", target: 3, type: 'duels_played', reward: { coins: 50, xp: 100 }, progress: 0, icon: '⚔️' },
  { id: 2, title: "5 ta LIKE", description: "5 ta odamga LIKE bering", target: 5, type: 'likes_given', reward: { coins: 75, xp: 150 }, progress: 0, icon: '❤️' },
  { id: 3, title: "1 ta SUPER LIKE", description: "Kunlik SUPER LIKE ishlating", target: 1, type: 'super_likes', reward: { coins: 30, xp: 50 }, progress: 0, icon: '💖' },
  { id: 4, title: "3 ta g'alaba", description: "3 ta duelda yuting", target: 3, type: 'duels_won', reward: { coins: 100, xp: 200 }, progress: 0, icon: '🏆' }
];

// ==================== YORDAMCHI FUNKSIYALAR ====================
function resetDailyCounters() {
  const today = new Date().toDateString();
  gameState.playerSockets.forEach((player, socketId) => {
    if (player.lastResetDate !== today && player.socket) {
      player.dailySuperLikes = 0;
      player.lastResetDate = today;
      player.dailyQuests = DAILY_QUESTS.map(q => ({...q, progress: 0}));
      
      if (player.socket.connected) {
        player.socket.emit('daily_reset', { 
          superLikes: 0,
          quests: player.dailyQuests 
        });
      }
    }
  });
}

function updateQuestProgress(player, questType, amount = 1) {
  const quest = player.dailyQuests.find(q => q.type === questType);
  if (quest && quest.progress < quest.target) {
    quest.progress = (quest.progress || 0) + amount;
    
    if (quest.progress >= quest.target && player.socket) {
      player.coins += quest.reward.coins;
      const xpResult = player.addXP(quest.reward.xp);
      
      player.socket.emit('quest_completed', {
        questId: quest.id,
        reward: quest.reward,
        coins: player.coins,
        xp: player.xp,
        leveledUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel
      });
    }
  }
}

function updateLeaderboard() {
  const players = Array.from(gameState.playerSockets.values());
  
  gameState.leaderboard.rating = players
    .filter(p => p.hasSelectedGender)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10)
    .map(p => ({ 
      id: p.id, 
      name: p.name, 
      value: p.rating,
      photo: p.photo 
    }));
  
  gameState.leaderboard.matches = players
    .filter(p => p.hasSelectedGender)
    .sort((a, b) => b.matches - a.matches)
    .slice(0, 10)
    .map(p => ({ 
      id: p.id, 
      name: p.name, 
      value: p.matches,
      photo: p.photo 
    }));
  
  gameState.leaderboard.coins = players
    .filter(p => p.hasSelectedGender)
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 10)
    .map(p => ({ 
      id: p.id, 
      name: p.name, 
      value: p.coins,
      photo: p.photo 
    }));
  
  gameState.leaderboard.updatedAt = new Date();
  
  // Barcha ulangan foydalanuvchilarga yuborish
  gameState.playerSockets.forEach((player, socketId) => {
    if (player.socket && player.socket.connected) {
      player.socket.emit('leaderboard_updated', gameState.leaderboard);
    }
  });
}

function broadcastWaitingCount() {
  const connectedPlayers = gameState.waitingPlayers.filter(p => 
    p.socket && p.socket.connected
  );
  
  const count = connectedPlayers.filter(p => p.hasSelectedGender).length;
  
  connectedPlayers.forEach((player, index) => {
    if (player.hasSelectedGender) {
      const position = connectedPlayers.filter(p => p.hasSelectedGender).indexOf(player) + 1;
      player.socket.emit('waiting_count', { 
        count, 
        position,
        estimatedTime: Math.max(1, position) * 15
      });
    } else {
      player.socket.emit('waiting_count', { 
        count: 0, 
        position: '-',
        estimatedTime: 0
      });
    }
  });
}

// ==================== GENDER FILTR ====================
function findOpponentByGender(player) {
  // Faqat gender tanlagan va ulangan o'yinchilar
  return gameState.waitingPlayers.filter(opponent => 
    opponent.socket && 
    opponent.socket.connected && 
    !opponent.currentMatch && 
    opponent.id !== player.id &&
    opponent.hasSelectedGender &&
    player.hasSelectedGender &&
    ((player.gender === 'male' && opponent.gender === 'female') ||
     (player.gender === 'female' && opponent.gender === 'male'))
  );
}

// ==================== DUEL CLASS ====================
class Duel {
  constructor(player1, player2) {
    this.id = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.player1 = player1;
    this.player2 = player2;
    this.votes = {};
    this.startTime = new Date();
    this.timeout = null;
    this.aborted = false;
    
    this.hasMetBefore = gameState.matchHistory.hasMetBefore(player1.id, player2.id);
    this.previousResult = this.hasMetBefore ? 
      gameState.matchHistory.getPreviousResult(player1.id, player2.id) : null;
    this.previousVotes = this.hasMetBefore ?
      gameState.matchHistory.getPreviousVotes(player1.id, player2.id) : null;
    
    player1.currentMatch = this.id;
    player2.currentMatch = this.id;
  }
  
  start() {
    const p1Data = this.getPlayerData(this.player1);
    const p2Data = this.getPlayerData(this.player2);
    
    this.player1.socket.emit('duel_started', { 
      opponent: p2Data,
      duelId: this.id,
      hasMetBefore: this.hasMetBefore,
      previousResult: this.previousResult,
      previousVotes: this.previousVotes
    });
    
    this.player2.socket.emit('duel_started', { 
      opponent: p1Data,
      duelId: this.id,
      hasMetBefore: this.hasMetBefore,
      previousResult: this.previousResult,
      previousVotes: this.previousVotes
    });
    
    console.log(`🎮 DUEL BOSHLANDI: ${this.player1.name} (${this.player1.gender}) vs ${this.player2.name} (${this.player2.gender})`);
    
    this.timeout = setTimeout(() => {
      if (!this.aborted) this.handleTimeout();
    }, 20000);
  }
  
  vote(playerId, choice) {
    if (this.aborted || this.votes[playerId]) return;
    
    const player = playerId === this.player1.id ? this.player1 : this.player2;
    if (!player) return;
    
    if (choice === 'super_like') {
      if (!player.canUseSuperLike()) {
        player.socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
        return;
      }
      player.useSuperLike();
    }
    
    this.votes[playerId] = choice;
    
    // Tezkor ovoz bonus
    const voteTime = new Date() - this.startTime;
    if (voteTime < 5000) {
      const xpResult = player.addXP(5);
      player.socket.emit('bonus', { 
        type: 'quick_vote', 
        points: 5,
        xp: player.xp
      });
    }
    
    // Quest yangilash
    if (choice === 'like' || choice === 'super_like') {
      updateQuestProgress(player, 'likes_given');
    }
    
    // Agar ikkala ovoz ham berilgan bo'lsa
    if (Object.keys(this.votes).length === 2) {
      this.processResult();
    }
  }
  
  processResult() {
    clearTimeout(this.timeout);
    
    const v1 = this.votes[this.player1.id];
    const v2 = this.votes[this.player2.id];
    
    // Match tarixiga qo'shish
    const matchResult1 = this.getMatchResult(this.player1.id, v1, v2);
    const matchResult2 = this.getMatchResult(this.player2.id, v2, v1);
    
    gameState.matchHistory.addMatch(this.player1.id, this.player2.id, matchResult1, this.votes);
    gameState.matchHistory.addMatch(this.player2.id, this.player1.id, matchResult2, this.votes);
    
    // Statistikani yangilash
    this.player1.duelsPlayed++;
    this.player2.duelsPlayed++;
    updateQuestProgress(this.player1, 'duels_played');
    updateQuestProgress(this.player2, 'duels_played');
    
    if (v1 === 'like' && v2 === 'like') {
      this.handleMatch();
    } else if (v1 === 'like' && v2 !== 'like') {
      this.handleSingleLike(this.player1, this.player2);
    } else if (v1 !== 'like' && v2 === 'like') {
      this.handleSingleLike(this.player2, this.player1);
    } else {
      this.handleNoMatch();
    }
    
    // Qayta uchrashuv bonus
    if (this.hasMetBefore) {
      this.player1.coins += 20;
      this.player2.coins += 20;
      this.player1.addXP(15);
      this.player2.addXP(15);
    }
    
    // Liderlarni yangilash
    updateLeaderboard();
    
    setTimeout(() => this.returnToQueue(), 3000);
  }
  
  handleMatch() {
    // Reyting yangilash
    const newRatings = gameState.ratingSystem.calculateElo(
      this.player1.rating,
      this.player2.rating
    );
    
    this.player1.rating = newRatings.winner;
    this.player2.rating = newRatings.loser;
    
    // Statistikani yangilash
    this.player1.matches++;
    this.player2.matches++;
    this.player1.duelsWon++;
    this.player2.duelsWon++;
    
    // Mukofotlar
    this.player1.coins += 50;
    this.player2.coins += 50;
    this.player1.addXP(30);
    this.player2.addXP(30);
    
    updateQuestProgress(this.player1, 'duels_won');
    updateQuestProgress(this.player2, 'duels_won');
    
    // O'ZARO LIKE → DO'STLIK
    this.addPlayersAsFriends();
    
    const isRematch = this.hasMetBefore;
    const matchMessage = isRematch ? '🎉 QAYTA UCHRASHUV!' : '🎉 MATCH!';
    
    this.player1.socket.emit('match', {
      partner: this.getPlayerData(this.player2),
      rewards: { 
        coins: 50 + (isRematch ? 20 : 0), 
        xp: 30 + (isRematch ? 15 : 0) 
      },
      newRating: this.player1.rating,
      isRematch: isRematch,
      matchMessage: matchMessage,
      isMutualLike: true
    });
    
    this.player2.socket.emit('match', {
      partner: this.getPlayerData(this.player1),
      rewards: { 
        coins: 50 + (isRematch ? 20 : 0), 
        xp: 30 + (isRematch ? 15 : 0) 
      },
      newRating: this.player2.rating,
      isRematch: isRematch,
      matchMessage: matchMessage,
      isMutualLike: true
    });
  }
  
  addPlayersAsFriends() {
    console.log(`🤝 O'ZARO LIKE: ${this.player1.name} va ${this.player2.name} do'st bo'lishdi`);
    
    // Do'stlik ro'yxatiga qo'shish
    const added1 = this.player1.addFriend(this.player2.id);
    const added2 = this.player2.addFriend(this.player1.id);
    
    // O'zaro likelar ro'yxatiga qo'shish
    this.player1.addMutualLike(this.player2.id);
    this.player2.addMutualLike(this.player1.id);
    
    if (added1 || added2) {
      // Do'stlik tasdiqlash bildirishnomalari
      this.player1.socket.emit('friend_added', {
        friend: {
          id: this.player2.id,
          name: this.player2.name,
          photo: this.player2.photo,
          level: this.player2.level,
          online: this.player2.online,
          fromMutualLike: true
        }
      });
      
      this.player2.socket.emit('friend_added', {
        friend: {
          id: this.player1.id,
          name: this.player1.name,
          photo: this.player1.photo,
          level: this.player1.level,
          online: this.player1.online,
          fromMutualLike: true
        }
      });
      
      // O'zaro likelar sonini yangilash
      this.player1.socket.emit('mutual_likes_count', {
        count: this.player1.getMutualLikesCount()
      });
      
      this.player2.socket.emit('mutual_likes_count', {
        count: this.player2.getMutualLikesCount()
      });
    }
  }
  
  handleSingleLike(liker, opponent) {
    liker.socket.emit('liked_only', {
      opponent: opponent.name,
      reward: { coins: 10, xp: 5 }
    });
    
    opponent.socket.emit('no_match', {
      opponent: liker.name
    });
    
    liker.coins += 10;
    liker.addXP(5);
  }
  
  handleNoMatch() {
    this.player1.socket.emit('no_match');
    this.player2.socket.emit('no_match');
    
    this.player1.coins += 5;
    this.player2.coins += 5;
    this.player1.addXP(2);
    this.player2.addXP(2);
  }
  
  handleTimeout() {
    this.player1.socket.emit('timeout');
    this.player2.socket.emit('timeout');
    this.returnToQueue();
  }
  
  getMatchResult(playerId, myVote, opponentVote) {
    if (myVote === 'like' && opponentVote === 'like') return 'match';
    if (myVote === 'like' && opponentVote !== 'like') return 'liked_only';
    if (myVote !== 'like' && opponentVote === 'like') return 'was_liked';
    return 'no_match';
  }
  
  getPlayerData(player) {
    return {
      id: player.id,
      name: player.name,
      username: player.username,
      photo: player.photo,
      level: player.level,
      rating: player.rating,
      matches: player.matches,
      gender: player.gender,
      hasSelectedGender: player.hasSelectedGender
    };
  }
  
  returnToQueue() {
    if (this.aborted) return;
    
    this.aborted = true;
    clearTimeout(this.timeout);
    gameState.activeDuels.delete(this.id);
    
    [this.player1, this.player2].forEach(player => {
      player.currentMatch = null;
      if (player.socket && player.socket.connected && player.hasSelectedGender) {
        if (!gameState.waitingPlayers.includes(player)) {
          gameState.waitingPlayers.push(player);
        }
        
        player.socket.emit('return_to_queue', {
          coins: player.coins,
          xp: player.xp,
          level: player.level,
          rating: player.rating
        });
      }
    });
    
    broadcastWaitingCount();
  }
}

// ==================== DUEL BOSHLASH ====================
function startDuelIfPossible() {
  const playersWithGender = gameState.waitingPlayers.filter(p => 
    p.socket && p.socket.connected && 
    !p.currentMatch && p.hasSelectedGender
  );
  
  if (playersWithGender.length >= 2) {
    for (let i = 0; i < playersWithGender.length; i++) {
      const player1 = playersWithGender[i];
      const potentialOpponents = findOpponentByGender(player1);
      
      if (potentialOpponents.length > 0) {
        const player2 = potentialOpponents[0];
        
        const p1Index = gameState.waitingPlayers.indexOf(player1);
        const p2Index = gameState.waitingPlayers.indexOf(player2);
        
        if (p1Index !== -1) gameState.waitingPlayers.splice(p1Index, 1);
        if (p2Index !== -1) gameState.waitingPlayers.splice(p2Index, 1);
        
        const duel = new Duel(player1, player2);
        gameState.activeDuels.set(duel.id, duel);
        duel.start();
        
        console.log(`✅ DUEL BOSHLANDI: ${player1.name} (${player1.gender}) vs ${player2.name} (${player2.gender})`);
        break;
      }
    }
  } else {
    // Agar gender tanlamagan o'yinchilar bo'lsa, ularga bildirishnoma
    gameState.waitingPlayers.filter(p => 
      p.socket && p.socket.connected && !p.hasSelectedGender
    ).forEach(player => {
      player.socket.emit('show_gender_selection', {
        mandatory: true,
        message: 'Duel qilish uchun gender tanlashingiz kerak!'
      });
    });
  }
  
  broadcastWaitingCount();
}

// ==================== SOCKET.IO HANDLER'LARI ====================
io.on('connection', (socket) => {
  console.log(`🔗 Yangi ulanish: ${socket.id}`);
  
  // ASOSIY AUTHENTIFICATION
  socket.on('auth', (userData) => {
    try {
      console.log('🔐 Auth so\'rovi:', userData);
      
      const userId = userData.userId || socket.id;
      const telegramId = userData.telegramId || userId;
      
      // Agar allaqachon ulangan bo'lsa
      if (gameState.activeUsers.has(telegramId)) {
        const existingUser = gameState.activeUsers.get(telegramId);
        if (existingUser.socket && existingUser.socket.connected) {
          existingUser.socket.disconnect();
        }
      }
      
      // Yangi o'yinchi yaratish
      const player = new Player(socket, userData);
      
      // Mavjud ma'lumotlarni saqlash
      if (gameState.activeUsers.has(telegramId)) {
        const oldPlayer = gameState.activeUsers.get(telegramId);
        player.gender = oldPlayer.gender;
        player.hasSelectedGender = oldPlayer.hasSelectedGender;
        player.level = oldPlayer.level;
        player.xp = oldPlayer.xp;
        player.coins = oldPlayer.coins;
        player.rating = oldPlayer.rating;
        player.matches = oldPlayer.matches;
        player.duelsPlayed = oldPlayer.duelsPlayed;
        player.duelsWon = oldPlayer.duelsWon;
        player.friends = oldPlayer.friends;
        player.mutualLikes = oldPlayer.mutualLikes;
      }
      
      // Kunlik vazifalarni boshlash
      resetDailyCounters();
      player.dailyQuests = DAILY_QUESTS.map(q => ({...q, progress: 0}));
      
      // Ro'yxatlarga qo'shish
      gameState.playerSockets.set(socket.id, player);
      gameState.activeUsers.set(telegramId, player);
      
      console.log(`✅ ${player.name} kirdi (Gender: ${player.gender || 'tanlanmagan'}, HasGender: ${player.hasSelectedGender})`);
      
      // Agar gender tanlamagan bo'lsa, avval modlani ko'rsatish
      if (!player.hasSelectedGender) {
        console.log(`⚠️ ${player.name} gender tanlamagan, modlani ko'rsatish`);
        socket.emit('show_gender_selection', {
          mandatory: true,
          message: 'Duel qilish uchun gender tanlashingiz kerak!'
        });
      } else {
        // Agar gender tanlagan bo'lsa, navbatga qo'shish
        gameState.waitingPlayers.push(player);
      }
      
      // Autentifikatsiya ma'lumotlarini yuborish
      socket.emit('auth_ok', {
        userId: player.id,
        name: player.name,
        level: player.level,
        coins: player.coins,
        rating: player.rating,
        gender: player.gender,
        hasSelectedGender: player.hasSelectedGender,
        friends: player.friends.map(friendId => {
          const friend = Array.from(gameState.playerSockets.values()).find(p => p.id === friendId);
          return friend ? {
            id: friend.id,
            name: friend.name,
            photo: friend.photo,
            online: friend.online,
            level: friend.level
          } : null;
        }).filter(Boolean),
        mutualLikesCount: player.getMutualLikesCount(),
        dailyQuests: player.dailyQuests,
        dailySuperLikes: 3 - player.dailySuperLikes,
        shopItems: SHOP_ITEMS,
        leaderboard: gameState.leaderboard,
        bio: player.bio,
        matches: player.matches,
        duelsPlayed: player.duelsPlayed,
        duelsWon: player.duelsWon,
        winRate: player.duelsPlayed > 0 ? 
          ((player.duelsWon / player.duelsPlayed) * 100).toFixed(1) + '%' : '0%'
      });
      
      // Navbat holati
      broadcastWaitingCount();
      
      // Agar gender tanlagan bo'lsa, duel qidirish
      if (player.hasSelectedGender) {
        setTimeout(() => startDuelIfPossible(), 1000);
      }
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      socket.emit('error', { message: 'Auth failed: ' + error.message });
    }
  });
  
  // MAJBURIY GENDER TANLASH - BU ASOSIY TUGMALAR ISHLASHI UCHUN
  socket.on('select_gender', (data) => {
    try {
      console.log('🎯 Gender tanlash so\'rovi:', data);
      
      const player = gameState.playerSockets.get(socket.id);
      if (!player) {
        socket.emit('error', { message: 'O\'yinchi topilmadi' });
        return;
      }
      
      // Gender tanlash
      player.gender = data.gender;
      player.hasSelectedGender = true;
      
      console.log(`✅ ${player.name} gender tanladi: ${data.gender}, Navbatga qo'shildi`);
      
      // Navbatga qo'shish (agar yo'q bo'lsa)
      if (!gameState.waitingPlayers.includes(player)) {
        gameState.waitingPlayers.push(player);
      }
      
      // Gender tanlaganini bildirish
      socket.emit('gender_selected', {
        gender: data.gender,
        message: 'Gender muvaffaqiyatli tanlandi! Endi duel o\'ynashingiz mumkin.',
        canDuel: true
      });
      
      // UI yangilash uchun
      socket.emit('profile_updated', {
        gender: player.gender,
        hasSelectedGender: true
      });
      
      // Duel qidirishni boshlash
      setTimeout(() => startDuelIfPossible(), 500);
      
    } catch (error) {
      console.error('❌ Gender tanlash xatosi:', error);
      socket.emit('error', { message: 'Gender tanlashda xatolik' });
    }
  });
  
  // PROFILNI YANGILASH
  socket.on('update_profile', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      if (data.bio !== undefined) {
        player.bio = data.bio;
      }
      
      if (data.gender && player.hasSelectedGender) {
        const oldGender = player.gender;
        player.gender = data.gender;
        
        console.log(`🔄 ${player.name} gender o'zgartirdi: ${oldGender} -> ${data.gender}`);
        
        // Navbatdan chiqarish va qayta qo'shish
        const index = gameState.waitingPlayers.indexOf(player);
        if (index !== -1) gameState.waitingPlayers.splice(index, 1);
        
        setTimeout(() => {
          gameState.waitingPlayers.push(player);
          startDuelIfPossible();
        }, 1000);
      }
      
      socket.emit('profile_updated', {
        bio: player.bio,
        gender: player.gender,
        hasSelectedGender: player.hasSelectedGender,
        mutualLikesCount: player.getMutualLikesCount()
      });
      
    } catch (error) {
      console.error('❌ Profil yangilash xatosi:', error);
      socket.emit('error', { message: 'Profil yangilashda xatolik' });
    }
  });
  
  // OVOZ BERISH
  socket.on('vote', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player || !player.currentMatch) {
        socket.emit('error', { message: 'Siz hozir duelda emassiz' });
        return;
      }
      
      const duel = gameState.activeDuels.get(player.currentMatch);
      if (!duel) {
        socket.emit('error', { message: 'Duel topilmadi' });
        return;
      }
      
      duel.vote(player.id, data.choice);
      
    } catch (error) {
      console.error('❌ Vote xatosi:', error);
      socket.emit('error', { message: 'Ovoz berishda xatolik' });
    }
  });
  
  // DO'STLIK SO'ROVI
  socket.on('send_friend_request', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const friend = Array.from(gameState.playerSockets.values())
        .find(p => p.id === data.userId);
      
      if (!friend) {
        socket.emit('friend_request_result', {
          success: false,
          message: 'Foydalanuvchi topilmadi'
        });
        return;
      }
      
      socket.emit('friend_request_result', {
        success: true,
        message: 'Do\'stlik so\'rovi yuborildi'
      });
      
      if (friend.socket) {
        friend.socket.emit('friend_request', {
          from: {
            id: player.id,
            name: player.name,
            photo: player.photo,
            level: player.level
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Do\'stlik so\'rovi xatosi:', error);
      socket.emit('error', { message: 'Do\'stlik so\'rovi yuborishda xatolik' });
    }
  });
  
  // DO'STLIK SO'ROVINI QABUL QILISH
  socket.on('accept_friend_request', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const friend = Array.from(gameState.playerSockets.values())
        .find(p => p.id === data.friendId);
      
      if (!friend) return;
      
      player.addFriend(friend.id);
      friend.addFriend(player.id);
      
      socket.emit('friend_added', {
        friend: {
          id: friend.id,
          name: friend.name,
          photo: friend.photo,
          online: friend.online,
          level: friend.level
        }
      });
      
      if (friend.socket) {
        friend.socket.emit('friend_added', {
          friend: {
            id: player.id,
            name: player.name,
            photo: player.photo,
            online: player.online,
            level: player.level
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Do\'stlik qabul qilish xatosi:', error);
      socket.emit('error', { message: 'Do\'stlik qabul qilishda xatolik' });
    }
  });
  
  // CHAT OCHISH
  socket.on('open_chat', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const partner = Array.from(gameState.playerSockets.values())
        .find(p => p.id === data.userId);
      
      if (!partner) return;
      
      socket.emit('chat_opened', {
        partner: {
          id: partner.id,
          name: partner.name,
          photo: partner.photo,
          online: partner.online
        }
      });
      
    } catch (error) {
      console.error('❌ Chat ochish xatosi:', error);
      socket.emit('error', { message: 'Chat ochishda xatolik' });
    }
  });
  
  // QAYTA DUEL SO'ROVI
  socket.on('request_rematch', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const opponent = Array.from(gameState.playerSockets.values())
        .find(p => p.id === data.opponentId);
      
      if (!opponent || !opponent.socket) return;
      
      opponent.socket.emit('rematch_request', {
        opponentId: player.id,
        opponentName: player.name,
        opponentPhoto: player.photo
      });
      
    } catch (error) {
      console.error('❌ Qayta duel so\'rovi xatosi:', error);
      socket.emit('error', { message: 'Qayta duel so\'rovida xatolik' });
    }
  });
  
  // QAYTA DUELNI QABUL QILISH
  socket.on('accept_rematch', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const opponent = Array.from(gameState.playerSockets.values())
        .find(p => p.id === data.opponentId);
      
      if (!opponent) return;
      
      // Navbatdan olish
      const p1Index = gameState.waitingPlayers.indexOf(player);
      const p2Index = gameState.waitingPlayers.indexOf(opponent);
      
      if (p1Index !== -1) gameState.waitingPlayers.splice(p1Index, 1);
      if (p2Index !== -1) gameState.waitingPlayers.splice(p2Index, 1);
      
      // Yangi duel
      const duel = new Duel(player, opponent);
      gameState.activeDuels.set(duel.id, duel);
      duel.start();
      
    } catch (error) {
      console.error('❌ Qayta duel qabul qilish xatosi:', error);
      socket.emit('error', { message: 'Qayta duel qabul qilishda xatolik' });
    }
  });
  
  // NAVBATDAN CHIQISH
  socket.on('leave_queue', () => {
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      const index = gameState.waitingPlayers.indexOf(player);
      if (index !== -1) {
        gameState.waitingPlayers.splice(index, 1);
        broadcastWaitingCount();
      }
    }
  });
  
  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`🔌 Ulanish uzildi: ${socket.id}`);
    
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      player.online = false;
      player.lastSeen = new Date();
      
      // Navbatdan olib tashlash
      const waitingIndex = gameState.waitingPlayers.indexOf(player);
      if (waitingIndex !== -1) {
        gameState.waitingPlayers.splice(waitingIndex, 1);
      }
      
      // Dueldan olib tashlash
      if (player.currentMatch) {
        const duel = gameState.activeDuels.get(player.currentMatch);
        if (duel) {
          duel.aborted = true;
          const opponent = duel.player1.id === player.id ? duel.player2 : duel.player1;
          if (opponent && opponent.socket && opponent.socket.connected) {
            opponent.socket.emit('opponent_left');
          }
          gameState.activeDuels.delete(player.currentMatch);
        }
      }
      
      // O'chirish
      gameState.playerSockets.delete(socket.id);
      if (player.telegramId) {
        gameState.activeUsers.delete(player.telegramId);
      }
      
      broadcastWaitingCount();
    }
  });
});

// ==================== SERVER ISHGA TUSHIRISH ====================
app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  const players = Array.from(gameState.playerSockets.values());
  const playersWithGender = players.filter(p => p.hasSelectedGender).length;
  const playersWithoutGender = players.filter(p => !p.hasSelectedGender).length;
  
  res.json({
    status: 'online',
    players: players.length,
    withGender: playersWithGender,
    withoutGender: playersWithoutGender,
    waiting: gameState.waitingPlayers.length,
    activeDuels: gameState.activeDuels.size,
    totalMutualLikes: players.reduce((sum, p) => sum + p.getMutualLikesCount(), 0)
  });
});

app.get('/api/stats', (req, res) => {
  const players = Array.from(gameState.playerSockets.values());
  
  res.json({
    totalPlayers: players.length,
    malePlayers: players.filter(p => p.gender === 'male').length,
    femalePlayers: players.filter(p => p.gender === 'female').length,
    activeDuels: gameState.activeDuels.size,
    waitingPlayers: gameState.waitingPlayers.length,
    leaderboard: gameState.leaderboard
  });
});

// Gender o'zgartirish API (test uchun)
app.post('/api/change_gender', (req, res) => {
  const { userId, gender } = req.body;
  
  const player = Array.from(gameState.playerSockets.values())
    .find(p => p.id === userId || p.telegramId === userId);
  
  if (player) {
    player.gender = gender;
    player.hasSelectedGender = true;
    
    res.json({ success: true, message: 'Gender o\'zgartirildi' });
  } else {
    res.json({ success: false, message: 'Foydalanuvchi topilmadi' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 LIKE DUEL SERVER - MAJBURIY GENDER & O\'ZARO DO\'STLIK');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
  console.log('✅ MAJBURIY gender tanlash (duel uchun shart)');
  console.log('✅ O\'zaro likelar → Avtomatik do\'stlik');
  console.log('✅ Gender tanlamaguncha duel QATTIQ taqiqlangan');
  console.log('✅ Socket.io event\'lari to\'liq ishlaydi');
  console.log('='.repeat(60));
  
  // Kunlik limitlarni yangilash
  setInterval(resetDailyCounters, 3600000);
  
  // Liderlarni yangilash
  setInterval(updateLeaderboard, 300000);
  
  // Duel qidirish
  setInterval(startDuelIfPossible, 30000);
});