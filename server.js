// server.js - TO'LIQ KOD - MAJBURIY GENDER TANLASH
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

// ==================== GLOBAL O'ZGARUVCHILAR ====================
const users = {}; // Barcha foydalanuvchilar {userId: userData}
const queue = []; // Navbatdagi foydalanuvchilar
const activeDuels = {}; // Faol duellar
const waitingRooms = {}; // Kutish xonalari
const mutualLikes = {}; // O'zaro likelar
const friendRequests = {}; // Do'stlik so'rovlari

// ==================== YORDAMCHI FUNKSIYALAR ====================
function calculateRatingChange(playerRating, opponentRating, result) {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  if (result === 'win') return Math.round(K * (1 - expected));
  if (result === 'loss') return Math.round(K * (0 - expected));
  return 0;
}

function generateDuelId() {
  return 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getOppositeGender(gender) {
  if (gender === 'male') return 'female';
  if (gender === 'female') return 'male';
  return null;
}

function checkGenderCompatibility(user1, user2) {
  // Agar ikkalasi ham gender tanlamagan bo'lsa
  if (!user1.gender || !user2.gender) return false;
  
  // Agar ikkalasi ham "not_specified" tanlagan bo'lsa, ular juftlashishi mumkin
  if (user1.gender === 'not_specified' && user2.gender === 'not_specified') return true;
  
  // Agar biri "not_specified" bo'lsa, ikkinchisi qanday gender tanlagan bo'lsa ham juftlashadi
  if (user1.gender === 'not_specified' || user2.gender === 'not_specified') return true;
  
  // Qolgan holatlarda faqat qarama-qarshi genderlar juftlashadi
  return user1.gender !== user2.gender;
}

function findOpponentFor(userId) {
  const user = users[userId];
  if (!user) return null;
  
  // Gender tanlanmagan bo'lsa, juft topilmaydi
  if (!user.hasSelectedGender || !user.gender) return null;
  
  for (let i = 0; i < queue.length; i++) {
    const opponentId = queue[i];
    if (opponentId === userId) continue;
    
    const opponent = users[opponentId];
    if (!opponent) continue;
    
    // Opponent ham gender tanlagan bo'lishi kerak
    if (!opponent.hasSelectedGender || !opponent.gender) continue;
    
    // Gender mos kelishini tekshirish
    if (checkGenderCompatibility(user, opponent)) {
      return opponentId;
    }
  }
  
  return null;
}

function updateWaitingCount() {
  const count = queue.length;
  const waitingUsers = {};
  
  queue.forEach((userId, index) => {
    waitingUsers[userId] = {
      position: index + 1,
      total: count
    };
  });
  
  return { count, waitingUsers };
}

function addToMutualLikes(userId, opponentId) {
  if (!mutualLikes[userId]) mutualLikes[userId] = [];
  if (!mutualLikes[opponentId]) mutualLikes[opponentId] = [];
  
  // Agar allaqachon qo'shilmagan bo'lsa
  if (!mutualLikes[userId].includes(opponentId)) {
    mutualLikes[userId].push(opponentId);
  }
  
  if (!mutualLikes[opponentId].includes(userId)) {
    mutualLikes[opponentId].push(userId);
  }
}

function getMutualLikesCount(userId) {
  return mutualLikes[userId] ? mutualLikes[userId].length : 0;
}

// ==================== SOCKET.IO HANDLERS ====================
io.on('connection', (socket) => {
  console.log('✅ Yangi ulanish:', socket.id);
  
  // ==================== AUTHENTIFICATION ====================
  socket.on('auth', (data) => {
    const userId = data.userId;
    const userData = data;
    
    console.log(`🔐 Auth: ${userId} - ${userData.firstName}`);
    
    // Foydalanuvchini saqlash yoki yangilash
    if (!users[userId]) {
      users[userId] = {
        id: userId,
        firstName: userData.firstName || 'Foydalanuvchi',
        lastName: userData.lastName || '',
        username: userData.username || '',
        photoUrl: userData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.firstName || 'User')}&background=667eea&color=fff`,
        gender: null, // Boshlang'ich qiymat
        hasSelectedGender: false, // MAJBURIY: gender tanlanmagan
        rating: 1500,
        coins: 100,
        level: 1,
        xp: 0,
        matches: 0,
        duels: 0,
        wins: 0,
        winRate: 0,
        totalLikes: 0,
        dailySuperLikes: 3,
        lastResetDate: new Date().toDateString(),
        bio: '',
        friends: [],
        socketId: socket.id,
        connected: true,
        lastActive: new Date()
      };
    } else {
      // Mavjud foydalanuvchini yangilash
      users[userId].socketId = socket.id;
      users[userId].connected = true;
      users[userId].lastActive = new Date();
      
      // Socket ID ni saqlash
      socket.userId = userId;
    }
    
    // Clientga foydalanuvchi ma'lumotlarini yuborish
    socket.emit('auth_ok', {
      userId: userId,
      firstName: users[userId].firstName,
      username: users[userId].username,
      photoUrl: users[userId].photoUrl,
      gender: users[userId].gender,
      hasSelectedGender: users[userId].hasSelectedGender,
      rating: users[userId].rating,
      coins: users[userId].coins,
      level: users[userId].level,
      xp: users[userId].xp,
      matches: users[userId].matches,
      duels: users[userId].duels,
      wins: users[userId].wins,
      winRate: users[userId].winRate,
      totalLikes: users[userId].totalLikes,
      dailySuperLikes: users[userId].dailySuperLikes,
      bio: users[userId].bio,
      friends: users[userId].friends,
      mutualLikes: getMutualLikesCount(userId)
    });
    
    console.log(`📊 ${userId} gender holati: ${users[userId].hasSelectedGender ? 'Tanlangan' : 'Tanlanmagan'}`);
    
    // Agar gender tanlanmagan bo'lsa, bildirishnoma yuborish
    if (!users[userId].hasSelectedGender) {
      console.log(`⚠️ ${userId} gender tanlamagan, modal ko'rsatish`);
      setTimeout(() => {
        socket.emit('show_gender_selection', {
          mandatory: true,
          message: 'Duel qilish uchun avval gender tanlashingiz kerak!'
        });
      }, 1000);
    }
    
    // Navbat holatini yangilash
    const waitingData = updateWaitingCount();
    socket.emit('waiting_count', {
      count: waitingData.count,
      position: waitingData.waitingUsers[userId]?.position || 0
    });
  });
  
  // ==================== MAJBURIY GENDER TANLASH ====================
  socket.on('select_gender', (data) => {
    const userId = socket.userId || data.userId;
    const gender = data.gender;
    
    console.log(`🎯 Gender tanlash: ${userId} -> ${gender}`);
    
    if (!userId || !users[userId]) {
      socket.emit('error', { message: 'Foydalanuvchi topilmadi' });
      return;
    }
    
    // Gender ni saqlash
    users[userId].gender = gender;
    users[userId].hasSelectedGender = true;
    
    // Local storage ga saqlash (client uchun)
    socket.emit('gender_selected', {
      gender: gender,
      hasSelectedGender: true,
      message: gender === 'male' ? 'Erkak sifatida ro\'yxatdan o\'tdingiz. Faqat ayollar bilan duel!' :
              gender === 'female' ? 'Ayol sifatida ro\'yxatdan o\'tdingiz. Faqat erkaklar bilan duel!' :
              'Hamma bilan duel qilishingiz mumkin!'
    });
    
    console.log(`✅ ${userId} gender tanladi: ${gender}`);
    
    // Navbatga avtomatik qo'shish
    if (!queue.includes(userId)) {
      queue.push(userId);
    }
    
    // Navbat holatini yangilash
    const waitingData = updateWaitingCount();
    io.emit('waiting_count', {
      count: waitingData.count,
      position: waitingData.waitingUsers[userId]?.position || 0
    });
    
    // Duel qidirishni boshlash
    setTimeout(() => findAndStartDuels(), 500);
  });
  
  // ==================== NAVBATGA KIRISH ====================
  socket.on('enter_queue', () => {
    const userId = socket.userId;
    
    if (!userId || !users[userId]) {
      socket.emit('error', { message: 'Avval autentifikatsiya qiling' });
      return;
    }
    
    console.log(`🚀 Navbatga kirish: ${userId} (Gender: ${users[userId].gender || 'tanlanmagan'})`);
    
    // MAJBURIY TEKSHIRISH: Gender tanlanmagan bo'lsa
    if (!users[userId].hasSelectedGender) {
      console.log(`❌ ${userId} navbatga kira olmaydi - gender tanlanmagan!`);
      socket.emit('show_gender_selection', {
        mandatory: true,
        message: 'Navbatga kirish uchun avval gender tanlashingiz kerak!'
      });
      return;
    }
    
    // Agar allaqachon navbatda bo'lsa
    if (queue.includes(userId)) {
      socket.emit('error', { message: 'Siz allaqachon navbatdasiz' });
      return;
    }
    
    // Navbatga qo'shish
    queue.push(userId);
    
    // Navbat holatini yangilash
    const waitingData = updateWaitingCount();
    io.emit('waiting_count', {
      count: waitingData.count,
      position: waitingData.waitingUsers[userId]?.position || 0
    });
    
    socket.emit('queue_joined', {
      position: waitingData.waitingUsers[userId]?.position || 0,
      total: waitingData.count
    });
    
    console.log(`✅ ${userId} navbatga qo'shildi. O'rni: ${waitingData.waitingUsers[userId]?.position}`);
    
    // Duel qidirish
    findAndStartDuels();
  });
  
  // ==================== NAVBATDAN CHIQISH ====================
  socket.on('leave_queue', () => {
    const userId = socket.userId;
    
    if (!userId) return;
    
    const index = queue.indexOf(userId);
    if (index > -1) {
      queue.splice(index, 1);
      console.log(`🚪 ${userId} navbatdan chiqdi`);
      
      // Navbat holatini yangilash
      const waitingData = updateWaitingCount();
      io.emit('waiting_count', {
        count: waitingData.count,
        position: 0
      });
    }
  });
  
  // ==================== DUEL BOSHLASH ====================
  function findAndStartDuels() {
    console.log(`🔍 Duel qidirilmoqda... Navbatda: ${queue.length} ta`);
    
    // Har bir foydalanuvchi uchun mos raqib qidirish
    for (let i = 0; i < queue.length; i++) {
      const userId = queue[i];
      const user = users[userId];
      
      if (!user || !user.hasSelectedGender) continue;
      
      // Bu foydalanuvchi uchun mos raqib qidirish
      const opponentId = findOpponentFor(userId);
      
      if (opponentId) {
        console.log(`🎮 Juft topildi: ${user.firstName} (${user.gender}) vs ${users[opponentId].firstName} (${users[opponentId].gender})`);
        
        // Queue'dan olib tashlash
        const userIndex = queue.indexOf(userId);
        const opponentIndex = queue.indexOf(opponentId);
        
        if (userIndex > -1) queue.splice(userIndex, 1);
        if (opponentIndex > -1) queue.splice(opponentIndex, 1);
        
        // Duelni boshlash
        startDuel(userId, opponentId);
        
        // Navbat holatini yangilash
        const waitingData = updateWaitingCount();
        io.emit('waiting_count', {
          count: waitingData.count,
          position: 0
        });
        
        // Bir martada bir juft topish uchun break
        break;
      }
    }
  }
  
  function startDuel(player1Id, player2Id) {
    const duelId = generateDuelId();
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    activeDuels[duelId] = {
      id: duelId,
      player1: player1Id,
      player2: player2Id,
      votes: {},
      startTime: new Date(),
      ended: false
    };
    
    // Player1 ga ma'lumot yuborish
    const player1Socket = io.sockets.sockets.get(player1.socketId);
    if (player1Socket) {
      player1Socket.emit('duel_started', {
        duelId: duelId,
        opponent: {
          id: player2Id,
          name: player2.firstName + (player2.lastName ? ' ' + player2.lastName : ''),
          username: player2.username,
          photo: player2.photoUrl,
          rating: player2.rating,
          matches: player2.matches,
          gender: player2.gender
        },
        timeLeft: 20
      });
    }
    
    // Player2 ga ma'lumot yuborish
    const player2Socket = io.sockets.sockets.get(player2.socketId);
    if (player2Socket) {
      player2Socket.emit('duel_started', {
        duelId: duelId,
        opponent: {
          id: player1Id,
          name: player1.firstName + (player1.lastName ? ' ' + player1.lastName : ''),
          username: player1.username,
          photo: player1.photoUrl,
          rating: player1.rating,
          matches: player1.matches,
          gender: player1.gender
        },
        timeLeft: 20
      });
    }
    
    console.log(`⚔️ Duel boshladi: ${duelId}`);
    
    // 20 soniya timer
    setTimeout(() => {
      if (activeDuels[duelId] && !activeDuels[duelId].ended) {
        handleDuelTimeout(duelId);
      }
    }, 20000);
  }
  
  // ==================== OVOZ BERISH ====================
  socket.on('vote', (data) => {
    const userId = socket.userId;
    const { duelId, choice } = data;
    
    if (!activeDuels[duelId] || activeDuels[duelId].ended) {
      socket.emit('error', { message: 'Bu duel tugagan' });
      return;
    }
    
    // Duelda ekanligini tekshirish
    const duel = activeDuels[duelId];
    if (duel.player1 !== userId && duel.player2 !== userId) {
      socket.emit('error', { message: 'Siz bu duelda emassiz' });
      return;
    }
    
    // Ovozni saqlash
    duel.votes[userId] = choice;
    
    // SUPER LIKE uchun limit tekshirish
    if (choice === 'super_like') {
      const user = users[userId];
      if (user.dailySuperLikes <= 0) {
        socket.emit('error', { message: 'Kunlik SUPER LIKE limitingiz tugadi' });
        delete duel.votes[userId];
        return;
      }
      user.dailySuperLikes--;
    }
    
    console.log(`🗳️ Ovoz: ${userId} -> ${choice} (Duel: ${duelId})`);
    
    // Agar ikkala o'yinchi ham ovoz berganda
    if (duel.votes[duel.player1] && duel.votes[duel.player2]) {
      processDuelResult(duelId);
    }
  });
  
  // ==================== DUEL NATIJASI ====================
  function processDuelResult(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    
    const player1Vote = duel.votes[duel.player1];
    const player2Vote = duel.votes[duel.player2];
    
    const player1 = users[duel.player1];
    const player2 = users[duel.player2];
    
    // Statistikani yangilash
    player1.duels++;
    player2.duels++;
    
    // LIKE bergan bo'lsa
    if (player1Vote === 'like' || player1Vote === 'super_like') {
      player1.totalLikes++;
    }
    if (player2Vote === 'like' || player2Vote === 'super_like') {
      player2.totalLikes++;
    }
    
    // MATCH holati
    if ((player1Vote === 'like' || player1Vote === 'super_like') && 
        (player2Vote === 'like' || player2Vote === 'super_like')) {
      
      // O'zaro like - MATCH!
      player1.matches++;
      player2.matches++;
      player1.wins++;
      player2.wins++;
      
      // Reyting yangilash
      const p1RatingChange = calculateRatingChange(player1.rating, player2.rating, 'win');
      const p2RatingChange = calculateRatingChange(player2.rating, player1.rating, 'loss');
      
      player1.rating += p1RatingChange;
      player2.rating += p2RatingChange;
      
      // Mukofotlar
      const baseCoins = 50;
      const baseXP = 30;
      const superLikeBonus = 20;
      
      let p1Coins = baseCoins;
      let p2Coins = baseCoins;
      let p1XP = baseXP;
      let p2XP = baseXP;
      
      if (player1Vote === 'super_like') {
        p1Coins += superLikeBonus;
        p1XP += 10;
      }
      if (player2Vote === 'super_like') {
        p2Coins += superLikeBonus;
        p2XP += 10;
      }
      
      player1.coins += p1Coins;
      player2.coins += p2Coins;
      
      // XP qo'shish
      player1.xp += p1XP;
      player2.xp += p2XP;
      
      // Level tekshirish
      const neededXP = player1.level * 100;
      if (player1.xp >= neededXP) {
        player1.level++;
        player1.xp -= neededXP;
        player1.coins += player1.level * 50;
      }
      
      const neededXP2 = player2.level * 100;
      if (player2.xp >= neededXP2) {
        player2.level++;
        player2.xp -= neededXP2;
        player2.coins += player2.level * 50;
      }
      
      // O'zaro likelarni saqlash
      addToMutualLikes(duel.player1, duel.player2);
      
      // Player1 ga match haqida xabar
      const player1Socket = io.sockets.sockets.get(player1.socketId);
      if (player1Socket) {
        player1Socket.emit('match', {
          partner: {
            id: duel.player2,
            name: player2.firstName + (player2.lastName ? ' ' + player2.lastName : ''),
            username: player2.username,
            photo: player2.photoUrl,
            gender: player2.gender
          },
          rewards: {
            coins: p1Coins,
            xp: p1XP
          },
          newRating: player1.rating,
          isRematch: false,
          mutualLike: true
        });
      }
      
      // Player2 ga match haqida xabar
      const player2Socket = io.sockets.sockets.get(player2.socketId);
      if (player2Socket) {
        player2Socket.emit('match', {
          partner: {
            id: duel.player1,
            name: player1.firstName + (player1.lastName ? ' ' + player1.lastName : ''),
            username: player1.username,
            photo: player1.photoUrl,
            gender: player1.gender
          },
          rewards: {
            coins: p2Coins,
            xp: p2XP
          },
          newRating: player2.rating,
          isRematch: false,
          mutualLike: true
        });
      }
      
      console.log(`🎉 MATCH: ${player1.firstName} & ${player2.firstName}`);
      
    } else if (player1Vote === 'like' || player1Vote === 'super_like') {
      // Faqat player1 like berdi
      const coins = player1Vote === 'super_like' ? 30 : 10;
      const xp = player1Vote === 'super_like' ? 15 : 5;
      
      player1.coins += coins;
      player1.xp += xp;
      
      // Player1 ga xabar
      const player1Socket = io.sockets.sockets.get(player1.socketId);
      if (player1Socket) {
        player1Socket.emit('liked_only', {
          opponentName: player2.firstName,
          reward: { coins, xp }
        });
      }
      
      // Player2 ga xabar
      const player2Socket = io.sockets.sockets.get(player2.socketId);
      if (player2Socket) {
        player2Socket.emit('no_match');
      }
      
    } else if (player2Vote === 'like' || player2Vote === 'super_like') {
      // Faqat player2 like berdi
      const coins = player2Vote === 'super_like' ? 30 : 10;
      const xp = player2Vote === 'super_like' ? 15 : 5;
      
      player2.coins += coins;
      player2.xp += xp;
      
      // Player2 ga xabar
      const player2Socket = io.sockets.sockets.get(player2.socketId);
      if (player2Socket) {
        player2Socket.emit('liked_only', {
          opponentName: player1.firstName,
          reward: { coins, xp }
        });
      }
      
      // Player1 ga xabar
      const player1Socket = io.sockets.sockets.get(player1.socketId);
      if (player1Socket) {
        player1Socket.emit('no_match');
      }
      
    } else {
      // Hech kim like bermadi
      const player1Socket = io.sockets.sockets.get(player1.socketId);
      if (player1Socket) player1Socket.emit('no_match');
      
      const player2Socket = io.sockets.sockets.get(player2.socketId);
      if (player2Socket) player2Socket.emit('no_match');
    }
    
    // G'alaba foizini yangilash
    player1.winRate = player1.duels > 0 ? Math.round((player1.wins / player1.duels) * 100) : 0;
    player2.winRate = player2.duels > 0 ? Math.round((player2.wins / player2.duels) * 100) : 0;
    
    // Foydalanuvchilarga yangilangan ma'lumotlarni yuborish
    updateUserData(duel.player1);
    updateUserData(duel.player2);
    
    // 3 soniyadan keyin navbatga qaytarish
    setTimeout(() => {
      returnPlayersToQueue(duel.player1, duel.player2);
    }, 3000);
  }
  
  function handleDuelTimeout(duelId) {
    const duel = activeDuels[duelId];
    if (!duel || duel.ended) return;
    
    duel.ended = true;
    
    const player1Socket = io.sockets.sockets.get(users[duel.player1]?.socketId);
    const player2Socket = io.sockets.sockets.get(users[duel.player2]?.socketId);
    
    if (player1Socket) player1Socket.emit('timeout');
    if (player2Socket) player2Socket.emit('timeout');
    
    console.log(`⏰ Duel vaqti tugadi: ${duelId}`);
    
    // 2 soniyadan keyin navbatga qaytarish
    setTimeout(() => {
      returnPlayersToQueue(duel.player1, duel.player2);
    }, 2000);
  }
  
  function returnPlayersToQueue(player1Id, player2Id) {
    const player1 = users[player1Id];
    const player2 = users[player2Id];
    
    // Faqat gender tanlagan va ulangan o'yinchilarni qayta navbatga qo'shish
    if (player1 && player1.hasSelectedGender && player1.connected) {
      if (!queue.includes(player1Id)) {
        queue.push(player1Id);
      }
      
      const player1Socket = io.sockets.sockets.get(player1.socketId);
      if (player1Socket) {
        player1Socket.emit('return_to_queue');
      }
    }
    
    if (player2 && player2.hasSelectedGender && player2.connected) {
      if (!queue.includes(player2Id)) {
        queue.push(player2Id);
      }
      
      const player2Socket = io.sockets.sockets.get(player2.socketId);
      if (player2Socket) {
        player2Socket.emit('return_to_queue');
      }
    }
    
    // Navbat holatini yangilash
    const waitingData = updateWaitingCount();
    io.emit('waiting_count', {
      count: waitingData.count,
      position: waitingData.waitingUsers[player1Id]?.position || 0
    });
    
    // Yangi duel qidirish
    setTimeout(findAndStartDuels, 1000);
  }
  
  function updateUserData(userId) {
    const user = users[userId];
    if (!user) return;
    
    const userSocket = io.sockets.sockets.get(user.socketId);
    if (userSocket) {
      userSocket.emit('profile_updated', {
        coins: user.coins,
        level: user.level,
        xp: user.xp,
        rating: user.rating,
        matches: user.matches,
        duels: user.duels,
        winRate: user.winRate,
        totalLikes: user.totalLikes,
        dailySuperLikes: user.dailySuperLikes,
        mutualLikes: getMutualLikesCount(userId)
      });
    }
  }
  
  // ==================== PROFILNI YANGILASH ====================
  socket.on('update_profile', (data) => {
    const userId = socket.userId;
    if (!userId || !users[userId]) return;
    
    const user = users[userId];
    
    if (data.bio !== undefined) {
      user.bio = data.bio;
    }
    
    if (data.gender !== undefined && user.hasSelectedGender) {
      const oldGender = user.gender;
      user.gender = data.gender;
      
      console.log(`🔄 ${userId} gender o'zgartirdi: ${oldGender} -> ${data.gender}`);
      
      // Navbatdan chiqarish va qayta qo'shish
      const index = queue.indexOf(userId);
      if (index > -1) queue.splice(index, 1);
      
      setTimeout(() => {
        if (!queue.includes(userId) && user.hasSelectedGender) {
          queue.push(userId);
          findAndStartDuels();
        }
      }, 1000);
    }
    
    socket.emit('profile_updated', {
      bio: user.bio,
      gender: user.gender,
      hasSelectedGender: user.hasSelectedGender,
      mutualLikes: getMutualLikesCount(userId)
    });
  });
  
  // ==================== QAYTA DUEL ====================
  socket.on('request_rematch', (data) => {
    const userId = socket.userId;
    const opponentId = data.opponentId;
    
    if (!userId || !opponentId || !users[userId] || !users[opponentId]) return;
    
    const opponentSocket = io.sockets.sockets.get(users[opponentId].socketId);
    if (opponentSocket) {
      opponentSocket.emit('rematch_request', {
        opponentId: userId,
        opponentName: users[userId].firstName,
        opponentPhoto: users[userId].photoUrl
      });
    }
  });
  
  socket.on('accept_rematch', (data) => {
    const userId = socket.userId;
    const opponentId = data.opponentId;
    
    if (!userId || !opponentId || !users[userId] || !users[opponentId]) return;
    
    // Navbatdan olish (agar bo'lsa)
    const userIndex = queue.indexOf(userId);
    const opponentIndex = queue.indexOf(opponentId);
    
    if (userIndex > -1) queue.splice(userIndex, 1);
    if (opponentIndex > -1) queue.splice(opponentIndex, 1);
    
    // Qayta duel boshlash
    startDuel(userId, opponentId);
  });
  
  // ==================== DISCONNECT ====================
  socket.on('disconnect', () => {
    const userId = socket.userId;
    
    if (userId && users[userId]) {
      users[userId].connected = false;
      users[userId].lastActive = new Date();
      
      // Navbatdan olish
      const index = queue.indexOf(userId);
      if (index > -1) {
        queue.splice(index, 1);
        console.log(`🔌 ${userId} navbatdan chiqdi (disconnect)`);
        
        // Navbat holatini yangilash
        const waitingData = updateWaitingCount();
        io.emit('waiting_count', {
          count: waitingData.count,
          position: 0
        });
      }
      
      // Faol duelda bo'lsa
      for (const duelId in activeDuels) {
        const duel = activeDuels[duelId];
        if ((duel.player1 === userId || duel.player2 === userId) && !duel.ended) {
          duel.ended = true;
          
          const opponentId = duel.player1 === userId ? duel.player2 : duel.player1;
          const opponentSocket = io.sockets.sockets.get(users[opponentId]?.socketId);
          
          if (opponentSocket) {
            opponentSocket.emit('opponent_left');
            returnPlayersToQueue(opponentId, null);
          }
          
          break;
        }
      }
    }
    
    console.log('❌ Ulanish uzildi:', socket.id);
  });
});

// ==================== ADMIN FUNKSIYALARI ====================
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/stats', (req, res) => {
  const totalUsers = Object.keys(users).length;
  const usersWithGender = Object.values(users).filter(u => u.hasSelectedGender).length;
  const usersWithoutGender = Object.values(users).filter(u => !u.hasSelectedGender).length;
  const maleUsers = Object.values(users).filter(u => u.gender === 'male').length;
  const femaleUsers = Object.values(users).filter(u => u.gender === 'female').length;
  const allGenderUsers = Object.values(users).filter(u => u.gender === 'not_specified').length;
  
  res.json({
    status: 'online',
    totalUsers,
    usersWithGender,
    usersWithoutGender,
    genderStats: {
      male: maleUsers,
      female: femaleUsers,
      all: allGenderUsers
    },
    waitingQueue: queue.length,
    activeDuels: Object.keys(activeDuels).length,
    mutualLikes: Object.keys(mutualLikes).length
  });
});

app.get('/api/users', (req, res) => {
  const userList = Object.values(users).map(user => ({
    id: user.id,
    name: user.firstName,
    gender: user.gender || 'not_selected',
    hasSelectedGender: user.hasSelectedGender,
    rating: user.rating,
    matches: user.matches,
    connected: user.connected,
    inQueue: queue.includes(user.id)
  }));
  
  res.json(userList);
});

app.post('/api/change_gender', (req, res) => {
  const { userId, gender } = req.body;
  
  if (!users[userId]) {
    return res.json({ success: false, message: 'Foydalanuvchi topilmadi' });
  }
  
  users[userId].gender = gender;
  users[userId].hasSelectedGender = true;
  
  // Socket orqali foydalanuvchiga xabar
  const userSocket = io.sockets.sockets.get(users[userId].socketId);
  if (userSocket) {
    userSocket.emit('gender_selected', {
      gender: gender,
      hasSelectedGender: true,
      message: 'Gender muvaffaqiyatli o\'zgartirildi'
    });
  }
  
  res.json({ success: true, message: 'Gender o\'zgartirildi' });
});

// ==================== SERVER ISHGA TUSHIRISH ====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 LIKE DUEL SERVER - MAJBURIY GENDER TANLASH');
  console.log('='.repeat(70));
  console.log(`📍 Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log('='.repeat(70));
  console.log('⚙️  MUHIM: Gender tanlanmaguncha duel O\'YNAB BO\'LMAYDI!');
  console.log('✅ Erkak → Faqat Ayollar bilan duel');
  console.log('✅ Ayol → Faqat Erkaklar bilan duel');
  console.log('✅ Hammasi → Har qanday jins bilan duel');
  console.log('='.repeat(70));
  
  // Kunlik limitlarni yangilash
  setInterval(() => {
    const today = new Date().toDateString();
    Object.values(users).forEach(user => {
      if (user.lastResetDate !== today) {
        user.dailySuperLikes = 3;
        user.lastResetDate = today;
        
        const userSocket = io.sockets.sockets.get(user.socketId);
        if (userSocket) {
          userSocket.emit('daily_reset', { superLikes: 3 });
        }
      }
    });
  }, 60000); // Har 1 daqiqada tekshirish
});