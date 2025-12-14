// server.js - MAJBURIY GENDER TANLASH & O'ZARO DO'STLIK
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// ==================== KLASSLAR ====================
class Player {
  constructor(socket, userData) {
    this.socket = socket;
    this.id = userData.telegramId || 'user_' + Date.now();
    this.username = userData.username || 'user_' + this.id;
    this.name = userData.name || 'Foydalanuvchi';
    this.photo = userData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=667eea&color=fff`;
    this.bio = userData.bio || '';
    this.gender = userData.gender || null; // Boshlang'ichda null
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
    this.friends = []; // Do'stlar ro'yxati
    this.friendRequests = []; // Do'stlik so'rovlari
    this.blockedUsers = [];
    this.achievements = [];
    this.shopItems = [];
    this.dailyQuests = [];
    this.currentMatch = null;
    this.lastSeen = new Date();
    this.online = true;
    this.hasSelectedGender = false; // Boshlang'ichda false
    this.mutualLikes = []; // O'zaro likelar
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
  
  // Do'st qo'shish
  addFriend(friendId) {
    if (!this.friends.includes(friendId) && friendId !== this.id) {
      this.friends.push(friendId);
      return true;
    }
    return false;
  }
  
  // Do'stlik so'rovi yuborish
  sendFriendRequest(toUserId) {
    if (!this.friendRequests.includes(toUserId) && 
        !this.friends.includes(toUserId) &&
        !this.blockedUsers.includes(toUserId) &&
        toUserId !== this.id) {
      this.friendRequests.push(toUserId);
      return true;
    }
    return false;
  }
  
  // O'zaro like qo'shish
  addMutualLike(userId) {
    if (!this.mutualLikes.includes(userId) && userId !== this.id) {
      this.mutualLikes.push(userId);
      return true;
    }
    return false;
  }
  
  // O'zaro likelarni olish
  getMutualLikesCount() {
    return this.mutualLikes.length;
  }
}

class RatingSystem {
  calculateElo(winnerRating, loserRating) {
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
    
    const newWinnerRating = winnerRating + K * (1 - expectedWinner);
    const newLoserRating = loserRating + K * (0 - expectedLoser);
    
    return {
      winner: Math.round(newWinnerRating),
      loser: Math.round(newLoserRating)
    };
  }
}

class MatchHistory {
  constructor() {
    this.history = new Map(); // userId -> match array
    this.mutualMatches = new Map(); // O'zaro matchlar
  }
  
  addMatch(userId, opponentId, result, votes = {}) {
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }
    
    const match = {
      opponentId,
      result, // 'match', 'liked_only', 'was_liked', 'no_match'
      votes,
      timestamp: new Date()
    };
    
    this.history.get(userId).push(match);
    return match;
  }
  
  addMutualMatch(userId, opponentId) {
    if (!this.mutualMatches.has(userId)) {
      this.mutualMatches.set(userId, []);
    }
    if (!this.mutualMatches.has(opponentId)) {
      this.mutualMatches.set(opponentId, []);
    }
    
    // Agar allaqachon qo'shilmagan bo'lsa
    if (!this.mutualMatches.get(userId).includes(opponentId)) {
      this.mutualMatches.get(userId).push(opponentId);
    }
    if (!this.mutualMatches.get(opponentId).includes(userId)) {
      this.mutualMatches.get(opponentId).push(userId);
    }
  }
  
  hasMetBefore(userId, opponentId) {
    if (!this.history.has(userId)) return false;
    return this.history.get(userId).some(match => 
      match.opponentId === opponentId
    );
  }
  
  getPreviousResult(userId, opponentId) {
    if (!this.history.has(userId)) return null;
    const matches = this.history.get(userId).filter(m => 
      m.opponentId === opponentId
    );
    return matches.length > 0 ? matches[matches.length - 1].result : null;
  }
  
  getPreviousVotes(userId, opponentId) {
    if (!this.history.has(userId)) return null;
    const matches = this.history.get(userId).filter(m => 
      m.opponentId === opponentId
    );
    return matches.length > 0 ? matches[matches.length - 1].votes : null;
  }
  
  getMutualMatches(userId) {
    return this.mutualMatches.get(userId) || [];
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

// ==================== KUNLIK VAZIFALAR ====================
const DAILY_QUESTS = [
  {
    id: 1,
    title: "🎯 3 ta dueldan o'ting",
    description: "3 ta duel o'ynang",
    target: 3,
    type: 'duels_played',
    reward: { coins: 50, xp: 100 },
    icon: '⚔️'
  },
  {
    id: 2,
    title: "❤️ 5 ta LIKE bering",
    description: "5 ta odamga LIKE bering",
    target: 5,
    type: 'likes_given',
    reward: { coins: 75, xp: 150 },
    icon: '❤️'
  },
  {
    id: 3,
    title: "💖 1 ta SUPER LIKE ishlating",
    description: "Kunlik SUPER LIKE'ingizni ishlating",
    target: 1,
    type: 'super_likes',
    reward: { coins: 30, xp: 50 },
    icon: '💖'
  },
  {
    id: 4,
    title: "🏆 3 ta duel yuting",
    description: "3 ta duelda g'alaba qozoning",
    target: 3,
    type: 'duels_won',
    reward: { coins: 100, xp: 200 },
    icon: '🏆'
  }
];

// ==================== DO'KON MAHSULOTLARI ====================
const SHOP_ITEMS = [
  {
    id: 1,
    name: "Bronza Avatar Ramkasi",
    description: "Profilingizni bronza ramka bilan bezang",
    price: 100,
    type: "avatar_frame",
    rarity: "common",
    icon: "🟤"
  },
  {
    id: 2,
    name: "3 ta SUPER LIKE Paketi",
    description: "Kunlik SUPER LIKE limitini +3 ga oshiring",
    price: 300,
    type: "super_like_boost",
    duration: 86400,
    icon: "💖"
  },
  {
    id: 3,
    name: "30 soniyalik Duel",
    description: "Keyingi duel uchun vaqtni 30 soniyaga oshiring",
    price: 150,
    type: "time_boost",
    uses: 1,
    icon: "⏱️"
  },
  {
    id: 4,
    name: "VIP Profil Ko'rinishi",
    description: "1 kunlik VIP profil ko'rinishi",
    price: 500,
    type: "vip_badge",
    duration: 86400,
    icon: "👑"
  }
];

// ==================== YORDAMCHI FUNKSIYALAR ====================
function resetDailyCounters() {
  const today = new Date().toDateString();
  gameState.playerSockets.forEach(player => {
    if (player.lastResetDate !== today) {
      player.dailySuperLikes = 0;
      player.lastResetDate = today;
      player.dailyQuests = JSON.parse(JSON.stringify(DAILY_QUESTS));
      player.socket.emit('daily_reset', { 
        superLikes: 0,
        quests: player.dailyQuests 
      });
    }
  });
}

function updateQuestProgress(player, questType, amount = 1) {
  const quest = player.dailyQuests.find(q => q.type === questType);
  if (quest && quest.progress < quest.target) {
    quest.progress = (quest.progress || 0) + amount;
    
    if (quest.progress >= quest.target) {
      // Vazifa yakunlandi
      player.coins += quest.reward.coins;
      player.addXP(quest.reward.xp);
      
      player.socket.emit('quest_completed', {
        questId: quest.id,
        reward: quest.reward,
        coins: player.coins,
        xp: player.xp
      });
    }
  }
}

function updateLeaderboard() {
  const players = Array.from(gameState.playerSockets.values());
  
  gameState.leaderboard.rating = players
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10)
    .map(p => ({ 
      id: p.id, 
      name: p.name, 
      value: p.rating,
      photo: p.photo 
    }));
  
  gameState.leaderboard.matches = players
    .sort((a, b) => b.matches - a.matches)
    .slice(0, 10)
    .map(p => ({ 
      id: p.id, 
      name: p.name, 
      value: p.matches,
      photo: p.photo 
    }));
  
  gameState.leaderboard.coins = players
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 10)
    .map(p => ({ 
      id: p.id, 
      name: p.name, 
      value: p.coins,
      photo: p.photo 
    }));
  
  gameState.leaderboard.updatedAt = new Date();
  
  // Barchaga yangilangan liderlar doskasini yuborish
  io.emit('leaderboard_updated', gameState.leaderboard);
}

function broadcastWaitingCount() {
  const count = gameState.waitingPlayers.filter(p => p.hasSelectedGender).length;
  gameState.waitingPlayers.forEach((player, index) => {
    if (player.socket.connected) {
      const position = player.hasSelectedGender ? 
        gameState.waitingPlayers.filter(p => p.hasSelectedGender).indexOf(player) + 1 : 0;
      
      player.socket.emit('waiting_count', { 
        count, 
        position: position > 0 ? position : '-',
        estimatedTime: Math.max(1, position) * 15,
        hasGender: player.hasSelectedGender
      });
    }
  });
}

// ==================== GENDER FILTR ====================
function findOpponentByGender(player) {
  // Faqat gender tanlagan va ulangan o'yinchilar
  const connectedPlayers = gameState.waitingPlayers.filter(p => 
    p.socket.connected && 
    !p.currentMatch && 
    p.id !== player.id &&
    !p.blockedUsers.includes(player.id) &&
    !player.blockedUsers.includes(p.id) &&
    p.hasSelectedGender && // Gender tanlagan bo'lishi kerak
    player.hasSelectedGender // O'zi ham gender tanlagan bo'lishi kerak
  );
  
  // Gender bo'yicha filtr
  const filteredPlayers = connectedPlayers.filter(opponent => {
    // Faqat qarama-qarshi jinslar bilan duel
    if (player.gender === 'male') {
      return opponent.gender === 'female';
    } else if (player.gender === 'female') {
      return opponent.gender === 'male';
    }
    
    return false;
  });
  
  return filteredPlayers;
}

// ==================== ENHANCED DUEL CLASS ====================
class EnhancedDuel {
  constructor(player1, player2) {
    this.id = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.player1 = player1;
    this.player2 = player2;
    this.votes = {};
    this.voteTimes = {};
    this.startTime = new Date();
    this.timeout = null;
    this.aborted = false;
    
    // Qayta uchrashuvni tekshirish
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
    
    // Qayta uchrashuv uchun maxsus ma'lumotlar
    let specialMessage = null;
    let specialOptions = [];
    
    if (this.hasMetBefore) {
      specialMessage = this.getPreviousResultMessage();
      
      if (this.previousResult === 'match') {
        specialOptions = [
          { action: 'open_chat', label: '💬 Chatga o\'tish' },
          { action: 'rematch', label: '🔄 Qayta duel' },
          { action: 'skip', label: '➡️ O\'tkazish' }
        ];
      } else {
        specialOptions = [
          { action: 'open_chat', label: '💬 Chatga o\'tish' },
          { action: 'rematch', label: '🔄 Qayta duel' },
          { action: 'skip', label: '➡️ O\'tkazish' }
        ];
      }
    }
    
    // Duelni boshlash
    this.player1.socket.emit('duel_started', { 
      opponent: p2Data,
      duelId: this.id,
      hasMetBefore: this.hasMetBefore,
      previousResult: this.previousResult,
      previousVotes: this.previousVotes,
      specialMessage: specialMessage,
      specialOptions: this.hasMetBefore ? specialOptions : null
    });
    
    this.player2.socket.emit('duel_started', { 
      opponent: p1Data,
      duelId: this.id,
      hasMetBefore: this.hasMetBefore,
      previousResult: this.previousResult,
      previousVotes: this.previousVotes,
      specialMessage: specialMessage,
      specialOptions: this.hasMetBefore ? specialOptions : null
    });
    
    console.log(`🎮 DUEL BOSHLANDI: ${this.player1.name} (${this.player1.gender}) vs ${this.player2.name} (${this.player2.gender})`);
    
    // 20 soniya timeout
    this.timeout = setTimeout(() => {
      if (!this.aborted) {
        this.handleTimeout();
      }
    }, 20000);
  }
  
  getPreviousResultMessage() {
    if (!this.hasMetBefore) return '';
    
    switch(this.previousResult) {
      case 'match':
        return 'Avval MATCH qilgansiz!';
      case 'liked_only':
        return 'Avval siz yoqtirgansiz';
      case 'was_liked':
        return 'Avval u sizni yoqtirgan';
      case 'no_match':
        return 'Avval ikkalangiz ham yoqtirmagansiz';
      default:
        return 'Avval uchrashgansiz';
    }
  }
  
  vote(playerId, choice) {
    console.log(`🎯 DUEL VOTE: ${playerId} -> ${choice}`);
    
    if (this.aborted) {
      console.log('❌ Duel abort qilingan, ovoz qabul qilinmaydi');
      return;
    }
    
    // O'yinchini aniqlash
    const player = playerId === this.player1.id ? this.player1 : this.player2;
    if (!player) {
      console.log('❌ O\'yinchi topilmadi');
      return;
    }
    
    // Ovoz berganligini tekshirish
    if (this.votes[playerId]) {
      console.log(`⚠️ ${player.name} allaqachon ovoz bergan`);
      player.socket.emit('error', { message: 'Siz allaqachon ovoz bergansiz' });
      return;
    }
    
    const voteTime = new Date() - this.startTime;
    console.log(`✅ OVOOZ QABUL QILINDI: ${player.name} -> ${choice} (${voteTime}ms)`);
    
    // SUPER LIKE cheklovi
    if (choice === 'super_like') {
      if (!player.canUseSuperLike()) {
        console.log(`❌ ${player.name} da SUPER LIKE limiti tugagan`);
        player.socket.emit('error', { 
          message: 'Kunlik SUPER LIKE limitingiz tugadi (3 ta)' 
        });
        return;
      }
      player.useSuperLike();
      console.log(`💖 ${player.name} SUPER LIKE ishlatdi. Qoldiq: ${3 - player.dailySuperLikes}`);
    }
    
    // Ovozni saqlash
    this.votes[playerId] = choice;
    this.voteTimes[playerId] = voteTime;
    
    // Tezkor ovoz bonus
    if (voteTime < 5000) {
      const xpResult = player.addXP(5);
      player.socket.emit('bonus', { 
        type: 'quick_vote', 
        points: 5,
        xp: player.xp,
        leveledUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel
      });
      console.log(`⚡ ${player.name} tezkor ovoz bonus oldi: +5 XP`);
    }
    
    // Quest yangilash
    if (choice === 'like' || choice === 'super_like') {
      updateQuestProgress(player, 'likes_given');
    }
    
    console.log(`📊 DUEL VOTES:`, this.votes);
    
    // Agar ikkala ovoz ham berilgan bo'lsa
    if (Object.keys(this.votes).length === 2) {
      console.log('🎉 IKKALA OVOOZ HAM BERILDI! Natijani hisoblash...');
      this.processResult();
    } else {
      console.log(`⏳ Kutilyapti. ${2 - Object.keys(this.votes).length} ovoz qoldi`);
      
      // Raqibga ovoz berilganligi haqida bildirish
      const opponent = playerId === this.player1.id ? this.player2 : this.player1;
      if (opponent.socket.connected) {
        opponent.socket.emit('opponent_voted', {
          choice: choice === 'super_like' ? 'super_like' : 'voted',
          timeLeft: this.timeout ? 20 - Math.floor(voteTime / 1000) : 20
        });
      }
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
      // MATCH!
      this.handleMatch();
    } else if (v1 === 'like' && v2 !== 'like') {
      this.handleSingleLike(this.player1, this.player2);
    } else if (v1 !== 'like' && v2 === 'like') {
      this.handleSingleLike(this.player2, this.player1);
    } else {
      this.handleNoMatch();
    }
    
    // Qayta uchrashuv bo'lsa, maxsus mukofotlar
    if (this.hasMetBefore) {
      this.player1.coins += 20;
      this.player2.coins += 20;
      this.player1.addXP(15);
      this.player2.addXP(15);
      console.log(`🎁 QAYTA UCHRASHUV BONUS: +20 coin, +15 XP`);
    }
    
    // Liderlarni yangilash
    updateLeaderboard();
    
    // 3 soniyadan keyin navbatga qaytarish
    setTimeout(() => {
      this.returnToQueue();
    }, 3000);
  }
  
  handleMatch() {
    console.log(`💖 MATCH! ${this.player1.name} ❤️ ${this.player2.name}`);
    
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
    this.player1.currentWinStreak++;
    this.player2.currentWinStreak++;
    
    if (this.player1.currentWinStreak > this.player1.bestWinStreak) {
      this.player1.bestWinStreak = this.player1.currentWinStreak;
    }
    if (this.player2.currentWinStreak > this.player2.bestWinStreak) {
      this.player2.bestWinStreak = this.player2.currentWinStreak;
    }
    
    // Mukofotlar
    this.player1.coins += 50;
    this.player2.coins += 50;
    this.player1.addXP(30);
    this.player2.addXP(30);
    
    updateQuestProgress(this.player1, 'duels_won');
    updateQuestProgress(this.player2, 'duels_won');
    
    // O'ZARO LIKE → DO'STLIKKA QO'SHISH
    this.addPlayersAsFriends();
    
    // Qayta uchrashuv bo'lsa, maxsus takliflar
    const specialOptions = this.hasMetBefore ? [
      { action: 'open_chat', label: '💬 Chatga o\'tish' },
      { action: 'rematch', label: '🔄 Qayta duel' },
      { action: 'skip', label: '➡️ O\'tkazish' }
    ] : [
      { action: 'open_chat', label: '💬 Chatga o\'tish' },
      { action: 'skip', label: '➡️ O\'tkazish' }
    ];
    
    const matchMessage = this.hasMetBefore ? 
      `🎉 QAYTA UCHRASHUV! ${this.previousResult === 'match' ? 'Yana MATCH qildingiz!' : 'Endi MATCH qildingiz!'}` :
      `🎉 MATCH! ${this.player1.name} va ${this.player2.name}`;
    
    this.player1.socket.emit('match', {
      partner: this.getPlayerData(this.player2),
      specialOptions: specialOptions,
      rewards: { coins: 50 + (this.hasMetBefore ? 20 : 0), xp: 30 + (this.hasMetBefore ? 15 : 0) },
      newRating: this.player1.rating,
      isRematch: this.hasMetBefore,
      matchMessage: matchMessage,
      isMutualLike: true // O'zaro like ekanligi
    });
    
    this.player2.socket.emit('match', {
      partner: this.getPlayerData(this.player1),
      specialOptions: specialOptions,
      rewards: { coins: 50 + (this.hasMetBefore ? 20 : 0), xp: 30 + (this.hasMetBefore ? 15 : 0) },
      newRating: this.player2.rating,
      isRematch: this.hasMetBefore,
      matchMessage: matchMessage,
      isMutualLike: true
    });
  }
  
  // YANGI: O'zaro likelarni do'stlikka qo'shish
  addPlayersAsFriends() {
    console.log(`🤝 O'ZARO LIKE: ${this.player1.name} va ${this.player2.name} do'st bo'lishdi`);
    
    // Do'stlik ro'yxatiga qo'shish
    const added1 = this.player1.addFriend(this.player2.id);
    const added2 = this.player2.addFriend(this.player1.id);
    
    // O'zaro likelar ro'yxatiga qo'shish
    this.player1.addMutualLike(this.player2.id);
    this.player2.addMutualLike(this.player1.id);
    
    // Match tarixiga qo'shish
    gameState.matchHistory.addMutualMatch(this.player1.id, this.player2.id);
    
    if (added1 || added2) {
      console.log(`✅ Do'stlik qo'shildi: ${this.player1.name} ↔ ${this.player2.name}`);
      
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
    
    // Kichik mukofot
    liker.coins += 10;
    liker.addXP(5);
  }
  
  handleNoMatch() {
    this.player1.socket.emit('no_match');
    this.player2.socket.emit('no_match');
    
    // Ishtirok mukofoti
    this.player1.coins += 5;
    this.player2.coins += 5;
    this.player1.addXP(2);
    this.player2.addXP(2);
  }
  
  handleTimeout() {
    console.log(`⏰ Duel vaqti tugadi: ${this.id}`);
    
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
      isOnline: player.online,
      gender: player.gender,
      hasSelectedGender: player.hasSelectedGender
    };
  }
  
  returnToQueue() {
    if (this.aborted) return;
    
    this.aborted = true;
    clearTimeout(this.timeout);
    
    gameState.activeDuels.delete(this.id);
    
    // O'yinchilarni qayta sozlash
    [this.player1, this.player2].forEach(player => {
      player.currentMatch = null;
      if (player.socket.connected) {
        // Agar gender tanlagan bo'lsa, navbatga qaytarish
        if (player.hasSelectedGender) {
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
    
    // Navbat holatini yangilash
    broadcastWaitingCount();
  }
}

// ==================== DUEL BOSHLASH ====================
function startDuelIfPossible() {
  console.log('🔍 Duel boshlash tekshirilmoqda...');
  
  // Faqat gender tanlagan o'yinchilar
  const playersWithGender = gameState.waitingPlayers.filter(p => 
    p.socket.connected && 
    !p.currentMatch &&
    p.hasSelectedGender
  );
  
  console.log(`👥 Gender tanlagan va kutayotganlar: ${playersWithGender.length} ta`);
  
  if (playersWithGender.length >= 2) {
    // Gender bo'yicha juftlik topish
    for (let i = 0; i < playersWithGender.length; i++) {
      const player1 = playersWithGender[i];
      const potentialOpponents = findOpponentByGender(player1);
      
      if (potentialOpponents.length > 0) {
        const player2 = potentialOpponents[0];
        
        // Asosiy ro'yxatlardan olib tashlash
        const p1Index = gameState.waitingPlayers.indexOf(player1);
        const p2Index = gameState.waitingPlayers.indexOf(player2);
        
        if (p1Index !== -1) gameState.waitingPlayers.splice(p1Index, 1);
        if (p2Index !== -1) gameState.waitingPlayers.splice(p2Index, 1);
        
        // Yangi duel yaratish va boshlash
        const duel = new EnhancedDuel(player1, player2);
        gameState.activeDuels.set(duel.id, duel);
        duel.start();
        
        console.log(`✅ DUEL BOSHLANDI: ${player1.name} (${player1.gender}) vs ${player2.name} (${player2.gender})`);
        break;
      }
    }
  } else {
    // Agar gender tanlamagan o'yinchilar bo'lsa, ularga bildirishnoma
    const playersWithoutGender = gameState.waitingPlayers.filter(p => 
      p.socket.connected && !p.hasSelectedGender
    );
    
    playersWithoutGender.forEach(player => {
      console.log(`⚠️ ${player.name} gender tanlamagan, modalni ko'rsatish`);
      player.socket.emit('show_gender_selection', {
        mandatory: true,
        message: 'Duel qilish uchun gender tanlashingiz kerak!'
      });
    });
    
    console.log(`⏳ Duel boshlash uchun yetarli emas: ${playersWithGender.length}/2`);
  }
  
  broadcastWaitingCount();
}

// ==================== O'YINCHINI O'CHIRISH ====================
function removePlayer(socketId) {
  const player = gameState.playerSockets.get(socketId);
  if (!player) return;
  
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
      const opponent = duel.player1.socket.id === socketId ? duel.player2 : duel.player1;
      if (opponent && opponent.socket.connected) {
        opponent.socket.emit('opponent_left');
        opponent.currentMatch = null;
        // Raqibni navbatga qaytarish
        if (opponent.hasSelectedGender) {
          gameState.waitingPlayers.push(opponent);
        }
      }
      gameState.activeDuels.delete(player.currentMatch);
    }
  }
  
  // activeUsers'dan olib tashlash
  if (player.id) {
    gameState.activeUsers.delete(player.id);
  }
  
  // playerSockets'dan olib tashlash
  gameState.playerSockets.delete(socketId);
  
  // Navbat holatini yangilash
  broadcastWaitingCount();
}

// ==================== SOCKET.IO HANDLER'LARI ====================
io.on('connection', (socket) => {
  console.log(`🔗 Yangi ulanish: ${socket.id}`);
  
  // AUTHENTIFICATION
  socket.on('auth', (userData) => {
    try {
      const telegramId = userData.telegramId || socket.id;
      
      // Bir xil akkauntni tekshirish
      if (gameState.activeUsers.has(telegramId)) {
        console.log(`⚠️ Bir xil akkaunt: ${userData.name}`);
        
        const existingUser = gameState.activeUsers.get(telegramId);
        if (existingUser.socket.connected) {
          existingUser.socket.emit('duplicate_login');
          existingUser.socket.disconnect();
        }
        removePlayer(existingUser.socket.id);
      }
      
      // Yangi o'yinchi yaratish
      const player = new Player(socket, userData);
      
      // Mavjud o'yinchining sozlamalarini saqlash
      if (gameState.activeUsers.has(telegramId)) {
        const oldPlayer = gameState.activeUsers.get(telegramId);
        player.gender = oldPlayer.gender;
        player.hasSelectedGender = oldPlayer.hasSelectedGender;
        player.friends = oldPlayer.friends;
        player.friendRequests = oldPlayer.friendRequests;
        player.mutualLikes = oldPlayer.mutualLikes;
        player.level = oldPlayer.level;
        player.xp = oldPlayer.xp;
        player.coins = oldPlayer.coins;
        player.rating = oldPlayer.rating;
        player.matches = oldPlayer.matches;
        player.duelsPlayed = oldPlayer.duelsPlayed;
        player.duelsWon = oldPlayer.duelsWon;
      }
      
      // Kunlik vazifalarni boshlash
      resetDailyCounters();
      player.dailyQuests = JSON.parse(JSON.stringify(DAILY_QUESTS));
      
      // Ro'yxatlarga qo'shish
      gameState.playerSockets.set(socket.id, player);
      gameState.activeUsers.set(telegramId, player);
      player.online = true;
      
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
      
      // O'zaro likelarni olish
      const mutualMatches = gameState.matchHistory.getMutualMatches(player.id);
      
      // Autentifikatsiya
      socket.emit('auth_ok', {
        userId: player.id,
        name: player.name,
        level: player.level,
        coins: player.coins,
        rating: player.rating,
        gender: player.gender,
        hasSelectedGender: player.hasSelectedGender,
        friends: player.friends.map(friendId => {
          const friend = gameState.playerSockets.get(friendId);
          return friend ? {
            id: friend.id,
            name: friend.name,
            photo: friend.photo,
            online: friend.online,
            level: friend.level,
            fromMutualLike: mutualMatches.includes(friendId)
          } : null;
        }).filter(Boolean),
        friendRequests: player.friendRequests.length,
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
          (player.duelsWon / player.duelsPlayed * 100).toFixed(1) : 0
      });
      
      console.log(`✅ ${player.name} kirdi (Gender: ${player.gender || 'tanlanmagan'}, Do'stlar: ${player.friends.length}, O'zaro likelar: ${player.getMutualLikesCount()})`);
      
      // Do'stlarga onlayn ekanligini bildirish
      player.friends.forEach(friendId => {
        const friend = gameState.playerSockets.get(friendId);
        if (friend && friend.socket.connected) {
          friend.socket.emit('friend_online', {
            id: player.id,
            name: player.name,
            photo: player.photo
          });
        }
      });
      
      // Navbat holati
      broadcastWaitingCount();
      
      // Agar gender tanlagan bo'lsa, duel qidirish
      if (player.hasSelectedGender) {
        setTimeout(() => {
          startDuelIfPossible();
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      socket.emit('error', { message: 'Auth failed' });
    }
  });
  
  // MAJBURIY GENDER TANLASH
  socket.on('select_gender', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      // Gender tanlash
      player.gender = data.gender;
      player.hasSelectedGender = true;
      
      console.log(`✅ ${player.name} gender tanladi: ${data.gender}`);
      
      // Navbatga qo'shish
      if (!gameState.waitingPlayers.includes(player)) {
        gameState.waitingPlayers.push(player);
      }
      
      // Gender tanlaganini bildirish
      socket.emit('gender_selected', {
        gender: data.gender,
        message: 'Gender muvaffaqiyatli tanlandi',
        canDuel: true
      });
      
      // Do'stlarga yangilangan profilni bildirish
      player.friends.forEach(friendId => {
        const friend = gameState.playerSockets.get(friendId);
        if (friend && friend.socket.connected) {
          friend.socket.emit('friend_updated', {
            id: player.id,
            name: player.name,
            gender: player.gender
          });
        }
      });
      
      // Duel qidirishni boshlash
      setTimeout(() => {
        startDuelIfPossible();
      }, 500);
      
    } catch (error) {
      console.error('❌ Gender tanlash xatosi:', error);
      socket.emit('error', { message: 'Gender tanlashda xatolik' });
    }
  });
  
  // OVOZ BERISH
  socket.on('vote', (data) => {
    try {
      console.log(`🗳️ OVOOZ QABUL QILINDI: ${socket.id} -> ${data.choice}`);
      
      const player = gameState.playerSockets.get(socket.id);
      if (!player) {
        socket.emit('error', { message: 'O\'yinchi topilmadi' });
        return;
      }
      
      if (!player.currentMatch) {
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
  
  // DO'STLIK SO'ROVINI QABUL QILISH
  socket.on('accept_friend_request', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const friendId = data.friendId;
      const friend = gameState.playerSockets.get(friendId);
      
      if (!friend) {
        socket.emit('friend_request_result', {
          success: false,
          message: 'Foydalanuvchi topilmadi'
        });
        return;
      }
      
      // Do'stlik so'rovini olib tashlash
      const requestIndex = player.friendRequests.indexOf(friendId);
      if (requestIndex !== -1) {
        player.friendRequests.splice(requestIndex, 1);
      }
      
      // Do'st qo'shish
      const added1 = player.addFriend(friendId);
      const added2 = friend.addFriend(player.id);
      
      if (added1 || added2) {
        // Bildirishnomalar
        socket.emit('friend_added', {
          friend: {
            id: friend.id,
            name: friend.name,
            photo: friend.photo,
            online: friend.online,
            level: friend.level,
            fromRequest: true
          }
        });
        
        if (friend.socket.connected) {
          friend.socket.emit('friend_added', {
            friend: {
              id: player.id,
              name: player.name,
              photo: player.photo,
              online: player.online,
              level: player.level,
              fromRequest: true
            }
          });
        }
        
        console.log(`✅ ${player.name} va ${friend.name} do'st bo'lishdi (so'rov orqali)`);
        
        socket.emit('friend_request_result', {
          success: true,
          message: 'Do\'stlik qabul qilindi'
        });
      } else {
        socket.emit('friend_request_result', {
          success: false,
          message: 'Do\'stlik allaqachon mavjud'
        });
      }
      
    } catch (error) {
      console.error('❌ Do\'stlik qabul qilish xatosi:', error);
      socket.emit('error', { message: 'Do\'stlik qabul qilishda xatolik' });
    }
  });
  
  // DO'STLIK SO'ROVI YUBORISH
  socket.on('send_friend_request', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const toUserId = data.userId;
      const toPlayer = gameState.playerSockets.get(toUserId);
      
      if (!toPlayer) {
        socket.emit('friend_request_result', {
          success: false,
          message: 'Foydalanuvchi topilmadi'
        });
        return;
      }
      
      // Do'stlik so'rovini yuborish
      const success = player.sendFriendRequest(toUserId);
      
      if (success) {
        socket.emit('friend_request_result', {
          success: true,
          message: 'Do\'stlik so\'rovi yuborildi'
        });
        
        // Qabul qiluvchiga bildirish
        if (toPlayer.socket.connected) {
          toPlayer.socket.emit('friend_request', {
            from: {
              id: player.id,
              name: player.name,
              photo: player.photo,
              level: player.level
            },
            timestamp: new Date()
          });
        }
        
        console.log(`📨 ${player.name} dan ${toPlayer.name} ga do'stlik so'rovi`);
      } else {
        socket.emit('friend_request_result', {
          success: false,
          message: 'Do\'stlik so\'rovi allaqachon yuborilgan yoki bloklangansiz'
        });
      }
      
    } catch (error) {
      console.error('❌ Do\'stlik so\'rovi xatosi:', error);
      socket.emit('error', { message: 'Do\'stlik so\'rovi yuborishda xatolik' });
    }
  });
  
  // PROFILNI YANGILASH
  socket.on('update_profile', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      // Gender o'zgartirish (faqat gender tanlagan bo'lsa)
      if (data.gender && player.hasSelectedGender) {
        const oldGender = player.gender;
        player.gender = data.gender;
        
        console.log(`🔄 ${player.name} gender o'zgartirdi: ${oldGender} -> ${data.gender}`);
        
        // Agar gender o'zgarsa, navbatdan chiqarish va qayta navbatga qo'shish
        const index = gameState.waitingPlayers.indexOf(player);
        if (index !== -1) {
          gameState.waitingPlayers.splice(index, 1);
        }
        
        // Yangi gender bo'yicha duel qidirish
        setTimeout(() => {
          gameState.waitingPlayers.push(player);
          startDuelIfPossible();
        }, 1000);
      }
      
      // Bio yangilash
      if (data.bio !== undefined) {
        player.bio = data.bio;
      }
      
      socket.emit('profile_updated', {
        bio: player.bio,
        gender: player.gender,
        settings: player.settings,
        friends: player.friends.length,
        mutualLikes: player.getMutualLikesCount()
      });
      
      console.log(`✅ ${player.name} profilini yangiladi`);
      
    } catch (error) {
      console.error('❌ Profil yangilash xatosi:', error);
      socket.emit('error', { message: 'Profil yangilashda xatolik' });
    }
  });
  
  // CHAT OCHISH
  socket.on('open_chat', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      const partnerId = data.userId;
      const partner = gameState.playerSockets.get(partnerId);
      
      if (!partner) {
        socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
        return;
      }
      
      // Ikkala o'yinchiga ham chat ochish ruxsati
      socket.emit('chat_opened', {
        partner: {
          id: partner.id,
          name: partner.name,
          photo: partner.photo,
          online: partner.online
        },
        canChat: true
      });
      
      if (partner.socket.connected) {
        partner.socket.emit('chat_opened', {
          partner: {
            id: player.id,
            name: player.name,
            photo: player.photo,
            online: player.online
          },
          canChat: true
        });
      }
      
      console.log(`💬 ${player.name} va ${partner.name} chat ochdi`);
      
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
      
      const opponentId = data.opponentId;
      const opponent = gameState.playerSockets.get(opponentId);
      
      if (!opponent) {
        socket.emit('error', { message: 'Raqib topilmadi' });
        return;
      }
      
      // Raqibga qayta duel so'rovini yuborish
      if (opponent.socket.connected) {
        opponent.socket.emit('rematch_request', {
          opponentId: player.id,
          opponentName: player.name,
          opponentPhoto: player.photo
        });
      }
      
      console.log(`🔄 ${player.name} ${opponent.name} ga qayta duel so'rovi yubordi`);
      
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
      
      const opponentId = data.opponentId;
      const opponent = gameState.playerSockets.get(opponentId);
      
      if (!opponent) return;
      
      // Ikkala o'yinchiga ham qayta duel boshlanganini bildirish
      socket.emit('rematch_accepted', {
        opponentName: opponent.name,
        opponentPhoto: opponent.photo
      });
      
      if (opponent.socket.connected) {
        opponent.socket.emit('rematch_accepted', {
          opponentName: player.name,
          opponentPhoto: player.photo
        });
      }
      
      console.log(`✅ ${player.name} va ${opponent.name} qayta duelni boshladi`);
      
      // Navbatdan olish va yangi duel boshlash
      const p1Index = gameState.waitingPlayers.indexOf(player);
      const p2Index = gameState.waitingPlayers.indexOf(opponent);
      
      if (p1Index !== -1) gameState.waitingPlayers.splice(p1Index, 1);
      if (p2Index !== -1) gameState.waitingPlayers.splice(p2Index, 1);
      
      const duel = new EnhancedDuel(player, opponent);
      gameState.activeDuels.set(duel.id, duel);
      duel.start();
      
    } catch (error) {
      console.error('❌ Qayta duel qabul qilish xatosi:', error);
      socket.emit('error', { message: 'Qayta duel qabul qilishda xatolik' });
    }
  });
  
  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`🔌 Ulanish uzildi: ${socket.id}`);
    
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      console.log(`👋 ${player.name} chiqib ketdi`);
      
      player.online = false;
      player.lastSeen = new Date();
      
      // Do'stlarga oflayn ekanligini bildirish
      player.friends.forEach(friendId => {
        const friend = gameState.playerSockets.get(friendId);
        if (friend && friend.socket.connected) {
          friend.socket.emit('friend_offline', {
            id: player.id,
            name: player.name,
            lastSeen: player.lastSeen
          });
        }
      });
      
      removePlayer(socket.id);
    }
  });
});

// ==================== SERVER ISHGA TUSHIRISH ====================
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/health', (req, res) => {
  const playersWithGender = Array.from(gameState.playerSockets.values())
    .filter(p => p.hasSelectedGender).length;
  const playersWithoutGender = Array.from(gameState.playerSockets.values())
    .filter(p => !p.hasSelectedGender).length;
  
  const totalMutualLikes = Array.from(gameState.playerSockets.values())
    .reduce((sum, p) => sum + p.getMutualLikesCount(), 0);
  
  res.json({
    status: 'online',
    players: gameState.playerSockets.size,
    withGender: playersWithGender,
    withoutGender: playersWithoutGender,
    waiting: gameState.waitingPlayers.length,
    activeDuels: gameState.activeDuels.size,
    totalMutualLikes: totalMutualLikes,
    totalMatches: Array.from(gameState.playerSockets.values())
      .reduce((sum, p) => sum + p.matches, 0)
  });
});

app.get('/api/stats', (req, res) => {
  const players = Array.from(gameState.playerSockets.values());
  
  res.json({
    totalPlayers: players.length,
    malePlayers: players.filter(p => p.gender === 'male').length,
    femalePlayers: players.filter(p => p.gender === 'female').length,
    activeDuels: gameState.activeDuels.size,
    totalFriendships: players.reduce((sum, p) => sum + p.friends.length, 0) / 2,
    leaderboard: gameState.leaderboard
  });
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
  console.log('✅ Do\'stlar tizimi va o\'zaro likelar');
  console.log('✅ Gender doimiy saqlanadi (logoutda ham)');
  console.log('✅ Qayta uchrashuv va bonuslar');
  console.log('='.repeat(60));
  
  // Har soat kunlik limitlarni yangilash
  setInterval(resetDailyCounters, 3600000);
  
  // Har 5 daqiqa liderlarni yangilash
  setInterval(updateLeaderboard, 300000);
  
  // Har 30 soniyada duel qidirish
  setInterval(startDuelIfPossible, 30000);
});