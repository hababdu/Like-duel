// server.js – YANGI QOIDALAR: 1-vs-1 Duel + Mutual Like = Chat

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Xotira
const waitingQueue = new Map();     // telegramId → socket (kutayotganlar)
const activeDuels = new Map();      // socket1.id → { p1, p2, votes: {} }
const likesHistory = new Map();     // userId → [likedUserIds...]

io.on('connection', (socket) => {
  console.log('Yangi ulanish:', socket.id);

  socket.on('auth', (data) => {
    const { telegramId, username, photo } = data;
    const user = {
      id: telegramId,
      name: username || 'NoName',
      photo: photo || `https://t.me/i/userpic/320/${telegramId}.jpg`
    };

    socket.user = user;
    socket.emit('auth_ok');

    // Kutish navbatiga qo‘shamiz
    waitingQueue.set(telegramId, socket);
    console.log(`${user.name} navbatga kirdi (${waitingQueue.size} kishi)`);

    // Agar navbatda 2+ odam bo‘lsa – duel boshlaymiz
    if (waitingQueue.size >= 2) {
      const players = [...waitingQueue.entries()];
      const [[id1, s1], [id2, s2]] = players;

      waitingQueue.delete(id1);
      waitingQueue.delete(id2);

      const duel = {
        p1: s1.user,
        p2: s2.user,
        votes: {}
      };

      activeDuels.set(s1.id, duel);
      activeDuels.set(s2.id, duel);

      // Har ikkisiga raqibni yuboramiz
      s1.emit('pair_started', { opponent: duel.p2 });
      s2.emit('pair_started', { opponent: duel.p1 });

      console.log(`YANGI DUEL: ${duel.p1.name} ❤️ ${duel.p2.name}`);
    }
  });

  // Like yoki No-like
  socket.on('vote', ({ choice }) => {
    if (!socket.user) return;

    const duel = activeDuels.get(socket.id);
    if (!duel) return;

    duel.votes[socket.user.id] = choice;

    // Ikkalasining ovozi kelsa – natija
    if (Object.keys(duel.votes).length === 2) {
      const v1 = duel.votes[duel.p1.id];
      const v2 = duel.votes[duel.p2.id];

      const s1 = [...io.sockets.sockets.values()].find(s => s.user?.id === duel.p1.id);
      const s2 = [...io.sockets.sockets.values()].find(s => s.user?.id === duel.p2.id);

      if (v1 === 'like' && v2 === 'like') {
        // MATCH – ikkalasi ham yoqtirdi
        s1?.emit('match', { partner: duel.p2 });
        s2?.emit('match', { partner: duel.p1 });
        console.log(`MATCH! ${duel.p1.name} ❤️ ${duel.p2.name}`);
      } else {
        // Birortasi yoqtirmadi
        if (v1 === 'like') {
          // p1 p2 ni yoqtirdi → p2 ning "likes" ro'yxatiga tushadi
          const p2Likes = likesHistory.get(duel.p2.id) || [];
          p2Likes.push(duel.p1);
          likesHistory.set(duel.p2.id, p2Likes);
          s1?.emit('liked_only', { message: "Siz yoqtirdingiz, lekin u yoqtirmadi" });
        }
        if (v2 === 'like') {
          const p1Likes = likesHistory.get(duel.p1.id) || [];
          p1Likes.push(duel.p2);
          likesHistory.set(duel.p1.id, p1Likes);
          s2?.emit('liked_only', { message: "Siz yoqtirdingiz, lekin u yoqtirmadi" });
        }

        s1?.emit('no_match');
        s2?.emit('no_match');
      }

      // Duelni tugatamiz
      activeDuels.delete(s1?.id || '');
      activeDuels.delete(s2?.id || '');

      // Ikkalasini yana navbatga qo‘yamiz
      if (s1) waitingQueue.set(duel.p1.id, s1);
      if (s2) waitingQueue.set(duel.p2.id, s2);
    }
  });

  socket.on('disconnect', () => {
    if (socket.user) {
      waitingQueue.delete(socket.user.id);
      activeDuels.delete(socket.id);
      console.log(`${socket.user.name} chiqdi`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\nLIKE DUEL YANGI QOIDALAR BILAN ISHLAMOQDA!`);
  console.log(`Bot: @likeduelgame_bot`);
  console.log(`Havola: https://like-duel.vercel.app\n`);
});