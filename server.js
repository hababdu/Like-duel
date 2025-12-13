// server.js - TO'LIQ ISHLAYDI
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io sozlamalari
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// O'yinchi klassi
class Player {
  constructor(socket, userData) {
    this.socket = socket;
    this.id = userData.telegramId || 'user_' + socket.id;
    this.username = userData.username || 'user_' + this.id;
    this.name = userData.name || 'Foydalanuvchi';
    this.photo = userData.photo || `https://ui-avatars.com/api/?name=${this.name}&background=667eea&color=fff`;
    this.connectedAt = new Date();
    this.currentMatch = null;
    this.hasVoted = false;
  }
}

// O'yin holatlari
const gameState = {
  waitingPlayers: [],
  activeDuels: new Map(),
  playerSockets: new Map(),
  activeUsers: new Map()
};

// Yordamchi funksiyalar
const startDuel = (player1, player2) => {
  console.log(`🎯 DUEL BOSHLANMOQDA: ${player1.name} vs ${player2.name}`);
  
  // Duel ID yaratish
  const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // O'yinchilarni duelga bog'lash
  player1.currentMatch = duelId;
  player2.currentMatch = duelId;
  
  // Har ikki o'yinchiga raqib ma'lumotlarini yuborish
  const player1Data = {
    id: player1.id,
    name: player1.name,
    username: player1.username,
    photo: player1.photo
  };
  
  const player2Data = {
    id: player2.id,
    name: player2.name,
    username: player2.username,
    photo: player2.photo
  };
  
  player1.socket.emit('duel_started', { opponent: player2Data });
  player2.socket.emit('duel_started', { opponent: player1Data });
  
  // Duel ma'lumotlarini saqlash
  const duel = {
    id: duelId,
    player1: player1,
    player2: player2,
    votes: {},
    timeout: null,
    startTime: new Date()
  };
  
  gameState.activeDuels.set(duelId, duel);
  
  // 20 soniya timeout
  duel.timeout = setTimeout(() => {
    handleDuelTimeout(duelId);
  }, 20000);
  
  console.log(`✅ DUEL BOSHLANDI: ${duelId}`);
};

const handleDuelTimeout = (duelId) => {
  const duel = gameState.activeDuels.get(duelId);
  if (!duel) return;
  
  console.log(`⏰ DUEL TIMEOUT: ${duelId}`);
  
  // Ovoz berilmagan o'yinchilarga xabar
  if (!duel.votes[duel.player1.id]) {
    duel.player1.socket.emit('timeout');
  }
  if (!duel.votes[duel.player2.id]) {
    duel.player2.socket.emit('timeout');
  }
  
  // Navbatga qaytarish
  returnPlayersToQueue(duel);
};

const processVote = (duelId, playerId, choice) => {
  const duel = gameState.activeDuels.get(duelId);
  if (!duel) return;
  
  console.log(`🗳️ OVOOZ: ${playerId} -> ${choice}`);
  duel.votes[playerId] = choice;
  
  // Agar ikkala ovoz ham berilgan bo'lsa
  if (duel.votes[duel.player1.id] && duel.votes[duel.player2.id]) {
    clearTimeout(duel.timeout);
    checkMatchResult(duel);
  }
};

const checkMatchResult = (duel) => {
  const vote1 = duel.votes[duel.player1.id];
  const vote2 = duel.votes[duel.player2.id];
  
  console.log(`📊 NATIJA: ${vote1} vs ${vote2}`);
  
  if (vote1 === 'like' && vote2 === 'like') {
    // MATCH!
    console.log(`💖 MATCH! ${duel.player1.name} ❤️ ${duel.player2.name}`);
    
    duel.player1.socket.emit('match', {
      partner: {
        id: duel.player2.id,
        name: duel.player2.name,
        username: duel.player2.username,
        photo: duel.player2.photo
      }
    });
    
    duel.player2.socket.emit('match', {
      partner: {
        id: duel.player1.id,
        name: duel.player1.name,
        username: duel.player1.username,
        photo: duel.player1.photo
      }
    });
    
    // 5 soniyadan keyin navbatga qaytarish
    setTimeout(() => returnPlayersToQueue(duel), 5000);
    
  } else if (vote1 === 'like' && vote2 !== 'like') {
    // Faqat player1 yoqtirdi
    duel.player1.socket.emit('liked_only');
    duel.player2.socket.emit('no_match');
    setTimeout(() => returnPlayersToQueue(duel), 3000);
    
  } else if (vote1 !== 'like' && vote2 === 'like') {
    // Faqat player2 yoqtirdi
    duel.player2.socket.emit('liked_only');
    duel.player1.socket.emit('no_match');
    setTimeout(() => returnPlayersToQueue(duel), 3000);
    
  } else {
    // Hech kim yoqtirmadi
    duel.player1.socket.emit('no_match');
    duel.player2.socket.emit('no_match');
    setTimeout(() => returnPlayersToQueue(duel), 3000);
  }
};

const returnPlayersToQueue = (duel) => {
  // Duelni tozalash
  clearTimeout(duel.timeout);
  gameState.activeDuels.delete(duel.id);
  
  // O'yinchilarni qayta sozlash
  duel.player1.currentMatch = null;
  duel.player2.currentMatch = null;
  duel.player1.hasVoted = false;
  duel.player2.hasVoted = false;
  
  // Agar hali ulanib turgan bo'lsa, navbatga qaytarish
  if (duel.player1.socket.connected) {
    gameState.waitingPlayers.push(duel.player1);
    duel.player1.socket.emit('return_to_queue');
  }
  
  if (duel.player2.socket.connected) {
    gameState.waitingPlayers.push(duel.player2);
    duel.player2.socket.emit('return_to_queue');
  }
  
  console.log(`🔄 DUEL TUGADI: ${duel.id}`);
  
  // Yangi duel boshlashni tekshirish
  checkForNewDuels();
};

const checkForNewDuels = () => {
  // Navbat ro'yxatini tozalash (chiquvchilarni olib tashlash)
  gameState.waitingPlayers = gameState.waitingPlayers.filter(player => 
    player.socket.connected && !player.currentMatch
  );
  
  console.log(`👥 Kutayotganlar: ${gameState.waitingPlayers.length} ta`);
  
  // Agar kamida 2 kishi bo'lsa
  if (gameState.waitingPlayers.length >= 2) {
    // Bir xil foydalanuvchi bo'lmagan 2 kishini topish
    const player1 = gameState.waitingPlayers[0];
    let player2 = null;
    
    for (let i = 1; i < gameState.waitingPlayers.length; i++) {
      if (gameState.waitingPlayers[i].id !== player1.id) {
        player2 = gameState.waitingPlayers[i];
        break;
      }
    }
    
    if (player2) {
      // Navbatdan olib tashlash
      const p1Index = gameState.waitingPlayers.indexOf(player1);
      const p2Index = gameState.waitingPlayers.indexOf(player2);
      
      if (p1Index !== -1) gameState.waitingPlayers.splice(p1Index, 1);
      if (p2Index !== -1) gameState.waitingPlayers.splice(p2Index, 1);
      
      // Duel boshlash
      startDuel(player1, player2);
    } else {
      console.log('⚠️ Bir xil foydalanuvchi, duel boshlanmaydi');
    }
  }
  
  // Kutayotganlar sonini yuborish
  gameState.waitingPlayers.forEach((player, index) => {
    if (player.socket.connected) {
      player.socket.emit('waiting_count', {
        count: gameState.waitingPlayers.length,
        position: index + 1
      });
    }
  });
};

// Socket.io handler'lari
io.on('connection', (socket) => {
  console.log(`🔗 Yangi ulanish: ${socket.id}`);
  
  socket.on('auth', (userData) => {
    console.log(`👤 Auth so'rovi: ${userData.name || 'Noma\'lum'}`);
    
    const telegramId = userData.telegramId || socket.id;
    
    // Bir xil akkauntni tekshirish
    if (gameState.activeUsers.has(telegramId)) {
      console.log(`⚠️ Bir xil akkaunt: ${userData.name}`);
      
      const existingUser = gameState.activeUsers.get(telegramId);
      
      // Eski ulanishni uzish
      if (existingUser.socket.connected) {
        existingUser.socket.emit('duplicate_login');
        existingUser.socket.disconnect();
      }
      
      // Eski ma'lumotlarni tozalash
      const oldSocketId = existingUser.socket.id;
      if (gameState.playerSockets.has(oldSocketId)) {
        gameState.playerSockets.delete(oldSocketId);
      }
      
      // Navbatdan olib tashlash
      const waitingIndex = gameState.waitingPlayers.findIndex(p => p.socket.id === oldSocketId);
      if (waitingIndex !== -1) {
        gameState.waitingPlayers.splice(waitingIndex, 1);
      }
      
      // Dueldan olib tashlash
      if (existingUser.currentMatch) {
        const duel = gameState.activeDuels.get(existingUser.currentMatch);
        if (duel) {
          returnPlayersToQueue(duel);
        }
      }
      
      gameState.activeUsers.delete(telegramId);
    }
    
    // Yangi o'yinchi yaratish
    const player = new Player(socket, userData);
    
    // Ro'yxatlarga qo'shish
    gameState.playerSockets.set(socket.id, player);
    gameState.activeUsers.set(telegramId, player);
    gameState.waitingPlayers.push(player);
    
    // Autentifikatsiya tasdiqlash
    socket.emit('auth_ok', {
      userId: player.id,
      name: player.name
    });
    
    console.log(`✅ ${player.name} ro'yxatga olindi (Kutayotganlar: ${gameState.waitingPlayers.length})`);
    
    // Navbat holatini yuborish
    socket.emit('waiting_count', {
      count: gameState.waitingPlayers.length,
      position: gameState.waitingPlayers.indexOf(player) + 1
    });
    
    // Yangi duel boshlashni tekshirish
    checkForNewDuels();
  });
  
  socket.on('vote', (data) => {
    console.log(`🗳️ Ovoz: ${socket.id} -> ${data.choice}`);
    
    const player = gameState.playerSockets.get(socket.id);
    if (!player || !player.currentMatch) {
      socket.emit('error', { message: 'Faol duel topilmadi' });
      return;
    }
    
    // Ovozni qayta berishni oldini olish
    if (player.hasVoted) {
      socket.emit('error', { message: 'Siz allaqachon ovoz berdingiz' });
      return;
    }
    
    player.hasVoted = true;
    processVote(player.currentMatch, player.id, data.choice);
  });
  
  socket.on('get_status', () => {
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      const position = gameState.waitingPlayers.indexOf(player) + 1;
      socket.emit('status_update', {
        inQueue: position > 0,
        position: position,
        totalWaiting: gameState.waitingPlayers.length,
        inDuel: !!player.currentMatch
      });
    }
  });
  
  socket.on('leave_queue', () => {
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      console.log(`🚪 ${player.name} navbatdan chiqdi`);
      
      // Navbatdan olib tashlash
      const waitingIndex = gameState.waitingPlayers.indexOf(player);
      if (waitingIndex !== -1) {
        gameState.waitingPlayers.splice(waitingIndex, 1);
      }
      
      // Dueldan olib tashlash
      if (player.currentMatch) {
        const duel = gameState.activeDuels.get(player.currentMatch);
        if (duel) {
          returnPlayersToQueue(duel);
        }
      }
      
      // Ro'yxatlardan olib tashlash
      gameState.activeUsers.delete(player.id);
      gameState.playerSockets.delete(socket.id);
      
      socket.emit('left_queue');
      checkForNewDuels();
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Ulanish uzildi: ${socket.id}`);
    
    const player = gameState.playerSockets.get(socket.id);
    if (player) {
      console.log(`👋 ${player.name} chiqib ketdi`);
      
      // Navbatdan olib tashlash
      const waitingIndex = gameState.waitingPlayers.indexOf(player);
      if (waitingIndex !== -1) {
        gameState.waitingPlayers.splice(waitingIndex, 1);
      }
      
      // Dueldan olib tashlash
      if (player.currentMatch) {
        const duel = gameState.activeDuels.get(player.currentMatch);
        if (duel) {
          const opponent = duel.player1.socket.id === socket.id ? duel.player2 : duel.player1;
          if (opponent.socket.connected) {
            opponent.socket.emit('opponent_left');
          }
          returnPlayersToQueue(duel);
        }
      }
      
      // Ro'yxatlardan olib tashlash
      gameState.activeUsers.delete(player.id);
      gameState.playerSockets.delete(socket.id);
      
      checkForNewDuels();
    }
  });
});

// Static fayllar
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Statistikalar
app.get('/api/stats', (req, res) => {
  res.json({
    status: 'online',
    waitingPlayers: gameState.waitingPlayers.length,
    activeDuels: gameState.activeDuels.size,
    totalPlayers: gameState.playerSockets.size
  });
});

// Server porti
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 LIKE DUEL SERVER ISHGA TUSHDI');
  console.log('='.repeat(50));
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`👥 Kutayotganlar: ${gameState.waitingPlayers.length} ta`);
  console.log(`🎮 Aktiv duellar: ${gameState.activeDuels.size} ta`);
  console.log('='.repeat(50));
  console.log('✅ Server to\'liq ishlaydi!');
  console.log('✅ 2 kishi kirsa darrov duel boshlanadi');
  console.log('✅ Bir xil akkaunt bilan 2 qurilmadan kira olmaysiz');
  console.log('='.repeat(50));
});