// server.js – MUKAMMAL VERSIYA: 2 kishi kirsa darrov duel boshlanadi

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

// O'yinchi ma'lumotlari
class Player {
  constructor(socket, userData) {
    this.socket = socket;
    this.id = userData.telegramId;
    this.username = userData.username || 'Foydalanuvchi';
    this.name = userData.name || userData.username || 'Foydalanuvchi';
    this.photo = userData.photo || `https://t.me/i/userpic/320/${userData.telegramId}.jpg`;
    this.gender = userData.gender || 'not_specified';
    this.connectedAt = new Date();
    this.currentMatch = null;
  }
}

// O'yin holatlari
const gameState = {
  waitingPlayers: [],        // Navbat kutayotganlar
  activeDuels: new Map(),    // Faol duellar [matchId -> duel]
  playerSockets: new Map()   // SocketID -> Player
};

// Helper funksiyalar
const helpers = {
  generateMatchId: () => `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  cleanWaitingList: () => {
    gameState.waitingPlayers = gameState.waitingPlayers.filter(player => {
      if (!player.socket.connected) {
        gameState.playerSockets.delete(player.socket.id);
        return false;
      }
      return true;
    });
  },
  
  removePlayer: (socketId) => {
    const player = gameState.playerSockets.get(socketId);
    if (!player) return;
    
    // Navbatdan olib tashlash
    const waitingIndex = gameState.waitingPlayers.findIndex(p => p.socket.id === socketId);
    if (waitingIndex !== -1) {
      gameState.waitingPlayers.splice(waitingIndex, 1);
    }
    
    // Aktiv dueldan olib tashlash
    if (player.currentMatch) {
      const duel = gameState.activeDuels.get(player.currentMatch);
      if (duel) {
        duel.aborted = true;
        const opponent = duel.player1.socket.id === socketId ? duel.player2 : duel.player1;
        if (opponent && opponent.socket.connected) {
          opponent.socket.emit('opponent_left');
          opponent.currentMatch = null;
        }
        gameState.activeDuels.delete(player.currentMatch);
      }
    }
    
    gameState.playerSockets.delete(socketId);
    return player;
  },
  
  broadcastWaitingCount: () => {
    const count = gameState.waitingPlayers.length;
    gameState.waitingPlayers.forEach(player => {
      player.socket.emit('waiting_count', { count });
    });
  }
};

// Duel klassi
class Duel {
  constructor(player1, player2) {
    this.id = helpers.generateMatchId();
    this.player1 = player1;
    this.player2 = player2;
    this.votes = {};
    this.startTime = new Date();
    this.timeout = null;
    this.aborted = false;
    
    // O'yinchilarni duelga bog'lash
    player1.currentMatch = this.id;
    player2.currentMatch = this.id;
  }
  
  start() {
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
    
    this.player1.socket.emit('pair_started', { 
      opponent: p2Data,
      matchId: this.id
    });
    
    this.player2.socket.emit('pair_started', { 
      opponent: p1Data,
      matchId: this.id
    });
    
    console.log(`🎮 DUEL BOSHLANDI: ${this.player1.name} vs ${this.player2.name} (${this.id})`);
    
    // Timeout sozlamalari
    this.timeout = setTimeout(() => {
      if (!this.aborted) {
        this.handleTimeout();
      }
    }, 20000); // 20 soniya
    
    return this;
  }
  
  vote(playerId, choice) {
    if (this.aborted) return;
    
    this.votes[playerId] = {
      choice,
      timestamp: new Date()
    };
    
    console.log(`🗳️ Ovoz: ${playerId} -> ${choice}`);
    
    if (Object.keys(this.votes).length === 2) {
      this.processResult();
    }
  }
  
  processResult() {
    clearTimeout(this.timeout);
    
    const v1 = this.votes[this.player1.id]?.choice;
    const v2 = this.votes[this.player2.id]?.choice;
    
    if (v1 === 'like' && v2 === 'like') {
      // MATCH!
      console.log(`💖 MATCH: ${this.player1.name} ❤️ ${this.player2.name}`);
      
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
      
      // Statistika saqlash (agar kerak bo'lsa)
      this.saveMatchStats();
      
    } else if (v1 === 'like' && v2 !== 'like') {
      // Faqat player1 yoqtirdi
      this.player1.socket.emit('liked_only', {
        opponent: this.player2.name
      });
      this.player2.socket.emit('no_match');
      
    } else if (v1 !== 'like' && v2 === 'like') {
      // Faqat player2 yoqtirdi
      this.player2.socket.emit('liked_only', {
        opponent: this.player1.name
      });
      this.player1.socket.emit('no_match');
      
    } else {
      // Hech kim yoqtirmadi
      this.player1.socket.emit('no_match');
      this.player2.socket.emit('no_match');
    }
    
    // Duenni tozalash
    this.cleanup();
  }
  
  handleTimeout() {
    if (this.aborted) return;
    
    console.log(`⏰ Timeout: ${this.id}`);
    
    // Ovoz berilmagan o'yinchilar uchun
    if (!this.votes[this.player1.id]) {
      this.player1.socket.emit('timeout');
    }
    if (!this.votes[this.player2.id]) {
      this.player2.socket.emit('timeout');
    }
    
    // Navbatga qaytarish
    this.returnToQueue();
    this.cleanup();
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
    
    // O'yinchilarni yangilash
    this.player1.currentMatch = null;
    this.player2.currentMatch = null;
  }
  
  saveMatchStats() {
    // Bu yerda match statistikasini saqlashingiz mumkin
    // Masalan: MongoDB, PostgreSQL yoki Redis'da
    console.log(`📊 Match statistikasi saqlandi: ${this.id}`);
  }
}

// Socket.io event handler'lar
io.on('connection', (socket) => {
  console.log(`🔗 Yangi ulanish: ${socket.id}`);
  
  // Autentifikatsiya
  socket.on('auth', (userData) => {
    try {
      if (!userData || !userData.telegramId) {
        socket.emit('error', { message: 'Invalid user data' });
        return;
      }
      
      // Yangi o'yinchi yaratish
      const player = new Player(socket, userData);
      gameState.playerSockets.set(socket.id, player);
      
      // Avtorizatsiya tasdiqlash
      socket.emit('auth_ok', {
        userId: player.id,
        name: player.name,
        timestamp: new Date().toISOString()
      });
      
      console.log(`👤 Foydalanuvchi kirdi: ${player.name} (${player.id})`);
      
      // Navbatga qo'shish
      gameState.waitingPlayers.push(player);
      helpers.broadcastWaitingCount();
      
      // Navbatni tozalash
      helpers.cleanWaitingList();
      
      // Agar 2+ kishi kutayotgan bo'lsa, duel boshlash
      if (gameState.waitingPlayers.length >= 2) {
        const player1 = gameState.waitingPlayers.shift();
        const player2 = gameState.waitingPlayers.shift();
        
        // Yangi duel yaratish
        const duel = new Duel(player1, player2);
        gameState.activeDuels.set(duel.id, duel);
        duel.start();
        
        helpers.broadcastWaitingCount();
      }
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });
  
  // Ovoz berish
  socket.on('vote', (data) => {
    try {
      const player = gameState.playerSockets.get(socket.id);
      if (!player || !player.currentMatch) {
        socket.emit('error', { message: 'No active duel' });
        return;
      }
      
      const duel = gameState.activeDuels.get(player.currentMatch);
      if (!duel) {
        socket.emit('error', { message: 'Duel not found' });
        return;
      }
      
      if (!data || !data.choice) {
        socket.emit('error', { message: 'Invalid vote data' });
        return;
      }
      
      duel.vote(player.id, data.choice);
      
    } catch (error) {
      console.error('❌ Vote error:', error);
      socket.emit('error', { message: 'Vote failed' });
    }
  });
  
  // O'yindan chiqish
  socket.on('leave_queue', () => {
    const player = helpers.removePlayer(socket.id);
    if (player) {
      console.log(`🚪 ${player.name} navbatdan chiqdi`);
      helpers.broadcastWaitingCount();
    }
  });
  
  // Navbat holati so'rash
  socket.on('get_waiting_count', () => {
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      socket.emit('waiting_count', { 
        count: gameState.waitingPlayers.length 
      });
    }
  });
  
  // Ping-pong
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
  
  // Ulanish uzilganda
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Ulanish uzildi: ${socket.id} - ${reason}`);
    const player = helpers.removePlayer(socket.id);
    if (player) {
      console.log(`👋 ${player.name} chiqib ketdi`);
      helpers.broadcastWaitingCount();
    }
  });
  
  // Xatoliklar
  socket.on('error', (error) => {
    console.error(`❌ Socket error ${socket.id}:`, error);
  });
});

// REST API endpoints
app.get('/api/stats', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    stats: {
      waitingPlayers: gameState.waitingPlayers.length,
      activeDuels: gameState.activeDuels.size,
      totalConnections: gameState.playerSockets.size
    },
    waitingList: gameState.waitingPlayers.map(p => ({
      id: p.id,
      name: p.name,
      waitingSince: p.connectedAt
    }))
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🌍 Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Server ishga tushirish
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 LIKE DUEL SERVER ISHGA TUSHDI');
  console.log('='.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`📡 Host: ${HOST}`);
  console.log(`👥 Kutayotganlar: ${gameState.waitingPlayers.length} ta`);
  console.log(`🎮 Aktiv duellar: ${gameState.activeDuels.size} ta`);
  console.log('='.repeat(50));
  console.log('📞 REST API:');
  console.log(`   GET /api/stats  - Server statistikasi`);
  console.log(`   GET /api/health - Server holati`);
  console.log('='.repeat(50));
  console.log('💡 Maslahat:');
  console.log('   1. 2 kishi kirsa darrov duel boshlanadi');
  console.log('   2. Har bir duel 20 soniya davom etadi');
  console.log('   3. Ikkalasi ham ❤️ boslsa - MATCH!');
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔻 SIGTERM signal received');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('🔻 SIGINT signal received');
  gracefulShutdown();
});

function gracefulShutdown() {
  console.log('🔄 Server to‘xtatilmoqda...');
  
  // Barcha o'yinchilarga xabar berish
  io.emit('server_shutdown');
  
  // 5 soniya kutish
  setTimeout(() => {
    server.close(() => {
      console.log('✅ Server to‘xtatildi');
      process.exit(0);
    });
  }, 5000);
}