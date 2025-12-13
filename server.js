// server.js - MULTI-FUNKSIYALI VERSIYA
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

// ==================== YANGI KLASSLAR ====================
class Player {
  constructor(socket, userData) {
    this.socket = socket;
    this.id = userData.telegramId || 'user_' + Date.now();
    this.username = userData.username || 'user_' + this.id;
    this.name = userData.name || 'Foydalanuvchi';
    this.photo = userData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=667eea&color=fff`;
    this.bio = userData.bio || '';
    this.gender = userData.gender || 'not_specified'; // 'male', 'female', 'not_specified'
    this.level = 1;
    this.xp = 0;
    this.coins = 100; // Boshlang'ich coin
    this.rating = 1500; // Elo reytingi
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
    this.hasSelectedGender = userData.gender && userData.gender !== 'not_specified';
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
    // Kunlik limitni tekshirish
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
  }
  
  addMatch(userId, opponentId, result, votes = {}) {
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }
    
    const match = {
      opponentId,
      result, // 'win', 'loss', 'match'
      votes,
      timestamp: new Date(),
      hasMetAgain: false
    };
    
    this.history.get(userId).push(match);
    
    // Agar avval uchrashgan bo'lsa, belgilash
    const previousMatches = this.history.get(userId).filter(m => 
      m.opponentId === opponentId && m.timestamp < match.timestamp
    );
    
    if (previousMatches.length > 0) {
      match.hasMetBefore = true;
      match.previousResult = previousMatches[previousMatches.length - 1].result;
    }
    
    return match;
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

// ==================== GENDER FILTR ====================
function findOpponentByGender(player) {
  const connectedPlayers = gameState.waitingPlayers.filter(p => 
    p.socket.connected && 
    !p.currentMatch && 
    p.id !== player.id &&
    !p.blockedUsers.includes(player.id) &&
    !player.blockedUsers.includes(p.id)
  );
  
  // Agar o'yinchi gender tanlamagan bo'lsa, gender selection modalini ko'rsatish
  if (!player.hasSelectedGender && player.gender === 'not_specified') {
    console.log(`⚠️ ${player.name} gender tanlamagan, modal ko'rsatiladi`);
    player.socket.emit('show_gender_selection');
    return [];
  }
  
  // Gender bo'yicha filtr
  const filteredPlayers = connectedPlayers.filter(opponent => {
    // Agar o'yinchi gender tanlamagan bo'lsa, hamma bilan duel
    if (player.gender === 'not_specified') {
      return true;
    }
    
    // Agar raqib gender tanlamagan bo'lsa, duel qilish mumkin
    if (opponent.gender === 'not_specified') {
      return true;
    }
    
    // Gender tanlagan bo'lsa, qarama-qarshi jinsni qidirish
    if (player.gender === 'male') {
      return opponent.gender === 'female';
    } else if (player.gender === 'female') {
      return opponent.gender === 'male';
    }
    
    return true;
  });
  
  console.log(`🔍 ${player.name} (${player.gender}) uchun mos raqiblar: ${filteredPlayers.length} ta`);
  
  return filteredPlayers;
}

// ==================== YANGI DUEL TIZIMI ====================
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
    
    // QAYTA UCHRASHUV: Avval uchrashganligini tekshirish
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
      
      // Match bo'lsa, chat tugmasi birinchi bo'lishi kerak
      if (this.previousResult === 'match') {
        specialOptions = [
          { action: 'open_chat', label: '💬 Chatga o\'tish' },
          { action: 'rematch', label: '🔄 Qayta duel' },
          { action: 'skip', label: '➡️ O\'tkazish' }
        ];
      } else {
        // Match bo'lmagan holatda, standart takliflar
        specialOptions = [
          { action: 'open_chat', label: '💬 Chatga o\'tish' },
          { action: 'rematch', label: '🔄 Qayta duel' },
          { action: 'skip', label: '➡️ O\'tkazish' }
        ];
      }
    } else {
      // Birinchi uchrashuv
      specialOptions = [
        { action: 'open_chat', label: '💬 Chatga o\'tish' },
        { action: 'skip', label: '➡️ O\'tkazish' }
      ];
    }
    
    // Qayta uchrashuv ekanligini bildirish
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
    
    console.log(`🎮 DUEL: ${this.player1.name} vs ${this.player2.name} ${this.hasMetBefore ? '(QAYTA UCHRASHUV)' : '(BIRINCHI UCHRASHUV)'}`);
    
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
    console.log(`🎯 DUEL VOTE FUNKSIYASI: ${playerId} -> ${choice}`);
    
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
      console.log(`⚠️ ${player.name} allaqachon ovoz bergan: ${this.votes[playerId]}`);
      player.socket.emit('error', { message: 'Siz allaqachon ovoz bergansiz' });
      return;
    }
    
    const voteTime = new Date() - this.startTime;
    console.log(`✅ OVOOZ QAYTA ISHLANDI: ${player.name} -> ${choice} (${voteTime}ms)`);
    
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
    if (voteTime < 5000) { // 5 soniyadan tez
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
      console.log(`📋 ${player.name} 'likes_given' vazifasini yangiladi`);
    }
    
    console.log(`📊 DUEL VOTES:`, this.votes);
    console.log(`👥 Ikkala ovoz kerak. Hozir: ${Object.keys(this.votes).length}/2`);
    
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
        console.log(`📢 ${opponent.name} ga ovoz berilganligi haqida xabar yuborildi`);
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
      // Qayta uchrashuv bonusini qo'shish
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
    
    // Qayta uchrashuv bo'lsa, maxsus takliflar
    const specialOptions = this.hasMetBefore ? [
      { type: 'chat', label: '💬 Chatga o\'tish', action: 'open_chat' },
      { type: 'skip', label: '➡️ O\'tkazish', action: 'skip' },
      { type: 'rematch', label: '🔄 Qayta duel', action: 'rematch' }
    ] : [
      { type: 'chat', label: '💬 Chatga o\'tish', action: 'open_chat' },
      { type: 'skip', label: '➡️ O\'tkazish', action: 'skip' }
    ];
    
    // Qayta uchrashuv uchun maxsus xabar
    const matchMessage = this.hasMetBefore ? 
      `🎉 QAYTA UCHRASHUV! ${this.previousResult === 'match' ? 'Yana MATCH qildingiz!' : 'Endi MATCH qildingiz!'}` :
      `🎉 MATCH! ${this.player1.name} va ${this.player2.name}`;
    
    this.player1.socket.emit('match', {
      partner: this.getPlayerData(this.player2),
      specialOptions: specialOptions,
      rewards: { coins: 50 + (this.hasMetBefore ? 20 : 0), xp: 30 + (this.hasMetBefore ? 15 : 0) },
      newRating: this.player1.rating,
      isRematch: this.hasMetBefore,
      matchMessage: matchMessage
    });
    
    this.player2.socket.emit('match', {
      partner: this.getPlayerData(this.player1),
      specialOptions: specialOptions,
      rewards: { coins: 50 + (this.hasMetBefore ? 20 : 0), xp: 30 + (this.hasMetBefore ? 15 : 0) },
      newRating: this.player2.rating,
      isRematch: this.hasMetBefore,
      matchMessage: matchMessage
    });
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
      gender: player.gender
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
        gameState.waitingPlayers.push(player);
        player.socket.emit('return_to_queue', {
          coins: player.coins,
          xp: player.xp,
          level: player.level
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
  
  // Navbat ro'yxatini tozalash
  const connectedPlayers = gameState.waitingPlayers.filter(player => 
    player.socket.connected && !player.currentMatch
  );
  
  console.log(`👥 Ulangan va kutayotganlar: ${connectedPlayers.length} ta`);
  
  if (connectedPlayers.length >= 2) {
    // Birinchi o'yinchini olish
    const player1 = connectedPlayers[0];
    
    // Gender bo'yicha ikkinchi o'yinchini qidirish
    const potentialOpponents = findOpponentByGender(player1);
    
    if (potentialOpponents.length > 0) {
      const player2 = potentialOpponents[0];
      console.log(`🎯 GENDER FILTR: ${player1.name} (${player1.gender}) vs ${player2.name} (${player2.gender})`);
      
      // Asosiy ro'yxatlardan olib tashlash
      const p1Index = gameState.waitingPlayers.indexOf(player1);
      const p2Index = gameState.waitingPlayers.indexOf(player2);
      
      if (p1Index !== -1) gameState.waitingPlayers.splice(p1Index, 1);
      if (p2Index !== -1) gameState.waitingPlayers.splice(p2Index, 1);
      
      // Yangi duel yaratish va boshlash
      const duel = new EnhancedDuel(player1, player2);
      gameState.activeDuels.set(duel.id, duel);
      duel.start();
      
      console.log(`✅ DUEL BOSHLANDI: ${duel.id}`);
    } else {
      console.log(`⚠️ ${player1.name} uchun mos raqib topilmadi (gender filtr)`);
      // Agar mos raqib topilmasa, kutishda qoldirish
      
      // Gender tanlamagan bo'lsa, bildirishnoma yuborish
      if (!player1.hasSelectedGender && player1.gender === 'not_specified') {
        console.log(`📢 ${player1.name} ga gender tanlash modalini ko'rsatish`);
      }
    }
  } else {
    console.log(`⏳ Duel boshlash uchun yetarli emas: ${connectedPlayers.length}/2`);
  }
  
  // Kutayotganlar sonini yuborish
  broadcastWaitingCount();
}

function broadcastWaitingCount() {
  const count = gameState.waitingPlayers.length;
  gameState.waitingPlayers.forEach((player, index) => {
    if (player.socket.connected) {
      player.socket.emit('waiting_count', { 
        count, 
        position: index + 1,
        estimatedTime: Math.max(1, index) * 15 // taxminiy kutish vaqti
      });
    }
  });
}

// ==================== SOCKET.IO HANDLER'LARI ====================
io.on('connection', (socket) => {
  console.log(`🔗 Yangi ulanish: ${socket.id}`);
  
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
      
      // Kunlik vazifalarni boshlash
      resetDailyCounters();
      player.dailyQuests = JSON.parse(JSON.stringify(DAILY_QUESTS));
      
      // Ro'yxatlarga qo'shish
      gameState.playerSockets.set(socket.id, player);
      gameState.activeUsers.set(telegramId, player);
      gameState.waitingPlayers.push(player);
      player.online = true;
      
      // Autentifikatsiya
      socket.emit('auth_ok', {
        userId: player.id,
        name: player.name,
        level: player.level,
        coins: player.coins,
        rating: player.rating,
        dailyQuests: player.dailyQuests,
        dailySuperLikes: 3 - player.dailySuperLikes,
        gender: player.gender,
        hasSelectedGender: player.hasSelectedGender,
        friends: player.friends.map(friendId => {
          const friend = gameState.playerSockets.get(friendId);
          return friend ? {
            id: friend.id,
            name: friend.name,
            photo: friend.photo,
            online: friend.online
          } : null;
        }).filter(Boolean),
        friendRequests: player.friendRequests.length,
        shopItems: SHOP_ITEMS,
        leaderboard: gameState.leaderboard
      });
      
      console.log(`✅ ${player.name} kirdi (Lvl:${player.level}, Coins:${player.coins}, Gender:${player.gender})`);
      
      // Barcha do'stlarga onlayn ekanligini bildirish
      player.friends.forEach(friendId => {
        const friend = gameState.playerSockets.get(friendId);
        if (friend && friend.socket.connected) {
          friend.socket.emit('friend_online', {
            id: player.id,
            name: player.name
          });
        }
      });
      
      // Navbat holati
      broadcastWaitingCount();
      
      // Duel boshlashni tekshirish
      setTimeout(() => {
        startDuelIfPossible();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      socket.emit('error', { message: 'Auth failed' });
    }
  });
  
  // YANGI: Gender tanlash
  socket.on('select_gender', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player) return;
      
      player.gender = data.gender;
      player.hasSelectedGender = true;
      
      console.log(`✅ ${player.name} gender tanladi: ${data.gender}`);
      
      // Gender tanlaganini bildirish
      socket.emit('gender_selected', {
        gender: data.gender,
        message: 'Gender muvaffaqiyatli tanlandi'
      });
      
      // Endi duel qidirish mumkin
      startDuelIfPossible();
      
    } catch (error) {
      console.error('❌ Gender tanlash xatosi:', error);
      socket.emit('error', { message: 'Gender tanlashda xatolik' });
    }
  });
  
  // Ovoz berish
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
      
      if (!data || !data.choice) {
        socket.emit('error', { message: 'Ovoz ma\'lumotlari noto\'g\'ri' });
        return;
      }
      
      // Ovoz berishni tekshirish
      if (duel.votes[player.id]) {
        console.log(`⚠️ ${player.name} allaqachon ovoz bergan`);
        socket.emit('error', { message: 'Siz allaqachon ovoz bergansiz' });
        return;
      }
      
      console.log(`✅ OVOOZ QAYTA ISHLANMOQDA: ${player.name} -> ${data.choice}`);
      duel.vote(player.id, data.choice);
      
    } catch (error) {
      console.error('❌ Vote xatosi:', error);
      socket.emit('error', { message: 'Ovoz berishda xatolik' });
    }
  });
  
  // Boshqa Socket event'lari (oldingi koddagi kabi)
  // ... (avvalgi kodning qolgan qismi) ...
  
  socket.on('disconnect', () => {
    console.log(`🔌 Ulanish uzildi: ${socket.id}`);
    
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      console.log(`👋 ${player.name} chiqib ketdi`);
      
      // Onlayn statusini yangilash
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
      
      // O'yinchini tozalash
      removePlayer(socket.id);
    }
  });
});

function removePlayer(socketId) {
  const player = gameState.playerSockets.get(socketId);
  if (!player) return;
  
  // Navbatdan olib tashlash
  const waitingIndex = gameState.waitingPlayers.findIndex(p => p.socket.id === socketId);
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
        gameState.waitingPlayers.push(opponent);
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

// ==================== SERVER ISHGA TUSHIRISH ====================
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    players: gameState.playerSockets.size,
    waiting: gameState.waitingPlayers.length,
    activeDuels: gameState.activeDuels.size,
    leaderboard: gameState.leaderboard
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 LIKE DUEL - QAYTA UCHRASHUV & GENDER FILTR');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`👥 Onlayn: ${gameState.playerSockets.size} ta`);
  console.log(`⏳ Kutayotgan: ${gameState.waitingPlayers.length} ta`);
  console.log('='.repeat(60));
  console.log('✅ QAYTA UCHRASHUV funksiyasi');
  console.log('✅ GENDER bo\'yicha filtr');
  console.log('✅ Gender tanlash modali');
  console.log('✅ Qayta uchrashuv bonuslari');
  console.log('✅ Avvalgi natijani ko\'rsatish');
  console.log('='.repeat(60));
  
  // Kunlik reset
  setInterval(resetDailyCounters, 3600000); // Har soat
  // Liderlarni yangilash
  setInterval(updateLeaderboard, 300000); // Har 5 daqiqa
});