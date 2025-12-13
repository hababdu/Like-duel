// server.js – TO‘LIQ YANGILANGAN VERSIYA (duel + mobil dizayn)

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Socket.io sozlamalari
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// CORS sozlamalari
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 📊 STATISTIKA
const stats = {
  totalMatches: 0,
  totalVotes: 0,
  successfulMatches: 0,
  uniqueUsers: new Set()
};

// 👤 O'YINCHI KLASSI
class Player {
  constructor(socket, userData) {
    this.socket = socket;
    this.id = userData.telegramId;
    this.username = userData.username || 'user_' + Date.now();
    this.name = userData.name || userData.username || 'Foydalanuvchi';
    this.photo = userData.photo || `https://t.me/i/userpic/320/${userData.telegramId}.jpg`;
    this.gender = userData.gender || 'not_specified';
    this.connectedAt = new Date();
    this.currentMatch = null;
    this.voteCount = 0;
    this.matchCount = 0;
  }
}

// 🎮 O'YIN HOLATLARI
const gameState = {
  waitingPlayers: [],        // Navbat kutayotganlar
  activeDuels: new Map(),    // Faol duellar
  playerSockets: new Map(),  // SocketID -> Player
  activeUsers: new Map()     // telegramId -> Player (ASOSIY YANGILIK!)
};

// 🛠️ YORDAMCHI FUNKSIYALAR
const helpers = {
  generateMatchId: () => `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Navbat ro'yxatini tozalash
  cleanWaitingList: () => {
    const now = Date.now();
    gameState.waitingPlayers = gameState.waitingPlayers.filter(player => {
      if (!player.socket.connected) {
        this.removePlayer(player.socket.id);
        return false;
      }
      return true;
    });
  },
  
  // O'yinchini tozalash
  removePlayer: (socketId) => {
    const player = gameState.playerSockets.get(socketId);
    if (!player) return null;
    
    // Navbatdan olib tashlash
    const waitingIndex = gameState.waitingPlayers.findIndex(p => p.socket.id === socketId);
    if (waitingIndex !== -1) {
      gameState.waitingPlayers.splice(waitingIndex, 1);
    }
    
    // Aktiv dueldan olib tashlash
    if (player.currentMatch) {
      const duel = gameState.activeDuels.get(player.currentMatch);
      if (duel && !duel.aborted) {
        duel.aborted = true;
        const opponent = duel.player1.socket.id === socketId ? duel.player2 : duel.player1;
        if (opponent && opponent.socket.connected) {
          opponent.socket.emit('opponent_left');
          opponent.currentMatch = null;
          
          // Raqib chiqib ketganini bildirish
          setTimeout(() => {
            if (opponent.socket.connected) {
              gameState.waitingPlayers.push(opponent);
              opponent.socket.emit('return_to_queue');
              this.broadcastWaitingCount();
            }
          }, 1000);
        }
        gameState.activeDuels.delete(player.currentMatch);
      }
    }
    
    // activeUsers'dan olib tashlash
    if (player.id && gameState.activeUsers.has(player.id)) {
      gameState.activeUsers.delete(player.id);
    }
    
    // playerSockets'dan olib tashlash
    gameState.playerSockets.delete(socketId);
    
    console.log(`👋 ${player.name} tizimdan chiqdi`);
    return player;
  },
  
  // Kutayotganlar sonini yuborish
  broadcastWaitingCount: () => {
    const count = gameState.waitingPlayers.length;
    gameState.waitingPlayers.forEach(player => {
      if (player.socket.connected) {
        player.socket.emit('waiting_count', { 
          count,
          position: gameState.waitingPlayers.indexOf(player) + 1
        });
      }
    });
  },
  
  // Duel boshlash (MUHIM YANGILIK!)
  startDuelIfPossible: () => {
    helpers.cleanWaitingList();
    
    // Kamida 2 ta o'yinchi bo'lishi kerak
    if (gameState.waitingPlayers.length < 2) {
      helpers.broadcastWaitingCount();
      return;
    }
    
    // Birinchi o'yinchini olamiz
    const player1 = gameState.waitingPlayers.shift();
    
    // Ikkinchi o'yinchini topamiz (bir xil foydalanuvchi bo'lmasligi kerak)
    let player2Index = -1;
    for (let i = 0; i < gameState.waitingPlayers.length; i++) {
      if (gameState.waitingPlayers[i].id !== player1.id) {
        player2Index = i;
        break;
      }
    }
    
    // Mos keladigan ikkinchi o'yinchi topilmadi
    if (player2Index === -1) {
      gameState.waitingPlayers.unshift(player1); // Birinchini qaytaramiz
      helpers.broadcastWaitingCount();
      
      // Bitta o'yinchi qoldi, yana birini kutamiz
      if (gameState.waitingPlayers.length === 1) {
        gameState.waitingPlayers[0].socket.emit('waiting_for_opponent');
      }
      return;
    }
    
    // Ikkinchi o'yinchini olamiz
    const player2 = gameState.waitingPlayers.splice(player2Index, 1)[0];
    
    console.log(`🎯 JUFT TOPILDI: ${player1.name} vs ${player2.name}`);
    
    // Duelni boshlash
    const duel = new Duel(player1, player2);
    gameState.activeDuels.set(duel.id, duel);
    duel.start();
    
    // Kutayotganlar sonini yangilash
    helpers.broadcastWaitingCount();
  }
};

// ⚔️ DUEL KLASSI
class Duel {
  constructor(player1, player2) {
    this.id = helpers.generateMatchId();
    this.player1 = player1;
    this.player2 = player2;
    this.votes = {};
    this.startTime = new Date();
    this.timeout = null;
    this.aborted = false;
    this.resultProcessed = false;
    
    // O'yinchilarni duelga bog'lash
    player1.currentMatch = this.id;
    player2.currentMatch = this.id;
    
    stats.uniqueUsers.add(player1.id);
    stats.uniqueUsers.add(player2.id);
  }
  
  start() {
    if (this.aborted) return;
    
    // Har ikki o'yinchiga raqib ma'lumotini yuborish
    const p1Data = {
      id: this.player1.id,
      name: this.player1.name,
      username: this.player1.username,
      photo: this.player1.photo,
      gender: this.player1.gender
    };
    
    const p2Data = {
      id: this.player2.id,
      name: this.player2.name,
      username: this.player2.username,
      photo: this.player2.photo,
      gender: this.player2.gender
    };
    
    // Duel boshlanishini e'lon qilish
    this.player1.socket.emit('pair_started', { 
      opponent: p2Data,
      matchId: this.id,
      timer: 20
    });
    
    this.player2.socket.emit('pair_started', { 
      opponent: p1Data,
      matchId: this.id,
      timer: 20
    });
    
    console.log(`🎮 DUEL BOSHLANDI: ${this.player1.name} vs ${this.player2.name} (${this.id})`);
    stats.totalMatches++;
    
    // Timeout sozlamalari (20 soniya)
    this.timeout = setTimeout(() => {
      if (!this.aborted && !this.resultProcessed) {
        this.handleTimeout();
      }
    }, 20000);
  }
  
  vote(playerId, choice) {
    if (this.aborted || this.resultProcessed) return;
    
    stats.totalVotes++;
    
    // O'yinchi ma'lumotlarini olish
    const player = playerId === this.player1.id ? this.player1 : this.player2;
    player.voteCount++;
    
    this.votes[playerId] = {
      choice,
      timestamp: new Date(),
      playerName: player.name
    };
    
    console.log(`🗳️ Ovoz: ${player.name} -> ${choice}`);
    
    // Ikkala ovoz ham berilgan bo'lsa
    if (Object.keys(this.votes).length === 2) {
      this.processResult();
    }
  }
  
  processResult() {
    if (this.resultProcessed || this.aborted) return;
    
    this.resultProcessed = true;
    clearTimeout(this.timeout);
    
    const v1 = this.votes[this.player1.id]?.choice;
    const v2 = this.votes[this.player2.id]?.choice;
    
    console.log(`📊 NATIJA: ${v1} vs ${v2}`);
    
    // 1. IKKALASI HAM YOQTIRDI
    if (v1 === 'like' && v2 === 'like') {
      console.log(`💖 MATCH! ${this.player1.name} ❤️ ${this.player2.name}`);
      
      stats.successfulMatches++;
      this.player1.matchCount++;
      this.player2.matchCount++;
      
      this.player1.socket.emit('match', {
        partner: {
          id: this.player2.id,
          name: this.player2.name,
          username: this.player2.username,
          photo: this.player2.photo,
          telegramId: this.player2.id
        },
        matchId: this.id
      });
      
      this.player2.socket.emit('match', {
        partner: {
          id: this.player1.id,
          name: this.player1.name,
          username: this.player1.username,
          photo: this.player1.photo,
          telegramId: this.player1.id
        },
        matchId: this.id
      });
      
      this.saveMatchStats(true);
      
    // 2. FAQAT BIRINCHI YOQTIRDI
    } else if (v1 === 'like' && v2 !== 'like') {
      this.player1.socket.emit('liked_only', {
        opponent: this.player2.name
      });
      this.player2.socket.emit('no_match');
      this.saveMatchStats(false);
      
    // 3. FAQAT IKKINCHI YOQTIRDI
    } else if (v1 !== 'like' && v2 === 'like') {
      this.player2.socket.emit('liked_only', {
        opponent: this.player1.name
      });
      this.player1.socket.emit('no_match');
      this.saveMatchStats(false);
      
    // 4. HECH KIM YOQTIRMADI
    } else {
      this.player1.socket.emit('no_match');
      this.player2.socket.emit('no_match');
      this.saveMatchStats(false);
    }
    
    // Kechiktirilgan holda navbatga qaytarish
    setTimeout(() => {
      this.returnToQueue();
      this.cleanup();
    }, 3000);
  }
  
  handleTimeout() {
    if (this.aborted || this.resultProcessed) return;
    
    console.log(`⏰ Timeout: ${this.id}`);
    
    // Ovoz berilmagan o'yinchilar uchun
    if (!this.votes[this.player1.id]) {
      this.player1.socket.emit('timeout');
    }
    if (!this.votes[this.player2.id]) {
      this.player2.socket.emit('timeout');
    }
    
    this.saveMatchStats(false);
    
    setTimeout(() => {
      this.returnToQueue();
      this.cleanup();
    }, 2000);
  }
  
  returnToQueue() {
    [this.player1, this.player2].forEach(player => {
      player.currentMatch = null;
      if (player.socket.connected) {
        gameState.waitingPlayers.push(player);
        player.socket.emit('return_to_queue');
        helpers.broadcastWaitingCount();
      }
    });
  }
  
  cleanup() {
    this.aborted = true;
    clearTimeout(this.timeout);
    gameState.activeDuels.delete(this.id);
    
    this.player1.currentMatch = null;
    this.player2.currentMatch = null;
  }
  
  saveMatchStats(isMatch) {
    // Bu yerda match statistikasini saqlashingiz mumkin
    const matchData = {
      matchId: this.id,
      player1: { id: this.player1.id, name: this.player1.name, vote: this.votes[this.player1.id]?.choice },
      player2: { id: this.player2.id, name: this.player2.name, vote: this.votes[this.player2.id]?.choice },
      isMatch,
      timestamp: new Date().toISOString(),
      duration: new Date() - this.startTime
    };
    
    console.log(`📊 Match saqlandi: ${JSON.stringify(matchData)}`);
  }
}

// 🔌 SOCKET.IO EVENT HANDLER'LAR
io.on('connection', (socket) => {
  console.log(`🔗 Yangi ulanish: ${socket.id} [Total: ${gameState.playerSockets.size}]`);
  
  // Autentifikatsiya
  socket.on('auth', (userData) => {
    try {
      if (!userData || !userData.telegramId) {
        socket.emit('error', { message: 'Yaroqsiz foydalanuvchi ma\'lumotlari' });
        return;
      }
      
      const telegramId = userData.telegramId;
      
      // 🔴 ASOSIY TEKSHIRUV: Bir xil foydalanuvchi allaqachon tizimdami?
      if (gameState.activeUsers.has(telegramId)) {
        console.log(`⚠️ Bir xil akkaunt: ${userData.name || telegramId} (Oldingi socket: ${gameState.activeUsers.get(telegramId).socket.id})`);
        
        const existingUser = gameState.activeUsers.get(telegramId);
        
        // Eski ulanishni uzish
        if (existingUser.socket.connected) {
          existingUser.socket.emit('duplicate_login', { 
            message: 'Yangi qurilmadan kirildi. Avvalgi ulanish uzildi.' 
          });
          existingUser.socket.disconnect();
        }
        
        // Eski ma'lumotlarni tozalash
        helpers.removePlayer(existingUser.socket.id);
      }
      
      // Yangi o'yinchi yaratish
      const player = new Player(socket, userData);
      
      // Barcha ro'yxatlarga qo'shish
      gameState.playerSockets.set(socket.id, player);
      gameState.activeUsers.set(telegramId, { 
        player: player, 
        socketId: socket.id,
        joinedAt: new Date()
      });
      gameState.waitingPlayers.push(player);
      
      // Autentifikatsiya tasdiqlash
      socket.emit('auth_ok', {
        userId: player.id,
        name: player.name,
        likes: player.matchCount,
        timestamp: new Date().toISOString()
      });
      
      console.log(`👤 Foydalanuvchi kirdi: ${player.name} (ID: ${player.id})`);
      console.log(`📊 Kutayotganlar: ${gameState.waitingPlayers.length} ta`);
      
      // Kutayotganlar sonini yuborish
      helpers.broadcastWaitingCount();
      
      // Duel boshlashni tekshirish
      helpers.startDuelIfPossible();
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      socket.emit('error', { message: 'Autentifikatsiyada xatolik' });
    }
  });
  
  // Ovoz berish
  socket.on('vote', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player || !player.currentMatch) {
        socket.emit('error', { message: 'Faol duel mavjud emas' });
        return;
      }
      
      const duel = gameState.activeDuels.get(player.currentMatch);
      if (!duel) {
        socket.emit('error', { message: 'Duel topilmadi' });
        return;
      }
      
      if (!data || !data.choice) {
        socket.emit('error', { message: 'Yaroqsiz ovoz ma\'lumotlari' });
        return;
      }
      
      // Faqat ruxsat etilgan ovoz variantlari
      if (!['like', 'nolike', 'skip'].includes(data.choice)) {
        socket.emit('error', { message: 'Yaroqsiz ovoz turi' });
        return;
      }
      
      duel.vote(player.id, data.choice);
      
    } catch (error) {
      console.error('❌ Vote error:', error);
      socket.emit('error', { message: 'Ovoz berishda xatolik' });
    }
  });
  
  // Navbatdan chiqish
  socket.on('leave_queue', () => {
    const player = helpers.removePlayer(socket.id);
    if (player) {
      console.log(`🚪 ${player.name} navbatdan chiqdi`);
      socket.emit('left_queue');
      helpers.broadcastWaitingCount();
    }
  });
  
  // Navbat holati so'rash
  socket.on('get_status', () => {
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      const position = gameState.waitingPlayers.findIndex(p => p.socket.id === socket.id) + 1;
      socket.emit('status_update', {
        inQueue: position > 0,
        position: position || 0,
        totalWaiting: gameState.waitingPlayers.length,
        inDuel: !!player.currentMatch,
        matchId: player.currentMatch
      });
    }
  });
  
  // Ping-pong (ulanishni tekshirish)
  socket.on('ping', () => {
    socket.emit('pong', { 
      timestamp: Date.now(),
      serverTime: new Date().toISOString()
    });
  });
  
  // Ulanish uzilganda
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Ulanish uzildi: ${socket.id} - ${reason}`);
    helpers.removePlayer(socket.id);
    helpers.broadcastWaitingCount();
  });
  
  // Xatoliklar
  socket.on('error', (error) => {
    console.error(`❌ Socket error ${socket.id}:`, error);
  });
});

// 🌐 REST API ENDPOINTS
app.get('/api/stats', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    stats: {
      waitingPlayers: gameState.waitingPlayers.length,
      activeDuels: gameState.activeDuels.size,
      totalConnections: gameState.playerSockets.size,
      uniqueUsers: stats.uniqueUsers.size,
      totalMatches: stats.totalMatches,
      successfulMatches: stats.successfulMatches,
      totalVotes: stats.totalVotes
    },
    waitingList: gameState.waitingPlayers.map(p => ({
      id: p.id,
      name: p.name,
      username: p.username,
      waitingSince: p.connectedAt,
      socketId: p.socket.id
    }))
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    connections: gameState.playerSockets.size
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🌍 Server error:', err);
  res.status(500).json({ 
    error: 'Ichki server xatosi',
    message: err.message 
  });
});

// 🚀 SERVER ISHGA TUSHIRISH
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 LIKE DUEL SERVER - MUKAMMAL VERSIYA');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`📡 Host: ${HOST}`);
  console.log(`👥 Kutayotganlar: ${gameState.waitingPlayers.length} ta`);
  console.log(`🎮 Aktiv duellar: ${gameState.activeDuels.size} ta`);
  console.log(`👤 Faol foydalanuvchilar: ${gameState.activeUsers.size} ta`);
  console.log('='.repeat(60));
  console.log('✨ ASOSIY YANGILIKLAR:');
  console.log('   1. Bir xil akkaunt bilan 2 qurilmadan kirish - FIXED!');
  console.log('   2. Ozini ozi bilan duellashish - BLOCKED!');
  console.log('   3. Real-time navbat kuzatuvi');
  console.log('   4. Toliq statistikalar');
  console.log('='.repeat(60));
  console.log('📞 REST API:');
  console.log(`   GET /api/stats  - Server statistikasi`);
  console.log(`   GET /api/health - Server holati`);
  console.log('='.repeat(60));
  console.log('🎯 DUEL QOIDALARI:');
  console.log('   1. 2 kishi kirsa darrov duel boshlanadi');
  console.log('   2. Har bir duel 20 soniya davom etadi');
  console.log('   3. Ikkalasi ham ❤️ boslsa - MATCH!');
  console.log('   4. Bir xil foydalanuvchi ozini ozi bilan duellashmaydi');
  console.log('='.repeat(60) + '\n');
});

// ⚡ GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('🔻 SIGTERM signal qabul qilindi');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('🔻 SIGINT signal qabul qilindi');
  gracefulShutdown();
});

function gracefulShutdown() {
  console.log('🔄 Server to‘xtatilmoqda...');
  
  // Barcha o'yinchilarga xabar berish
  io.emit('server_shutdown', { 
    message: 'Server yangilanmoqda. 5 soniyadan song qayta ulaning.',
    timestamp: new Date().toISOString()
  });
  
  // 5 soniya kutish
  setTimeout(() => {
    server.close(() => {
      console.log('✅ Server to‘xtatildi');
      process.exit(0);
    });
  }, 5000);
}

// 📊 MONITORING FUNKSIYALARI
setInterval(() => {
  console.log(`📊 [${new Date().toLocaleTimeString()}] Monitoring:`);
  console.log(`   - Kutayotganlar: ${gameState.waitingPlayers.length}`);
  console.log(`   - Aktiv duellar: ${gameState.activeDuels.size}`);
  console.log(`   - Faol foydalanuvchilar: ${gameState.activeUsers.size}`);
  console.log(`   - Unikal foydalanuvchilar: ${stats.uniqueUsers.size}`);
  
  // Har 5 daqiqada navbatni tozalash
  helpers.cleanWaitingList();
}, 300000); // Har 5 daqiqada