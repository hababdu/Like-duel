// server.js – JUFTLIK 100% ISHLAYDIGAN VERSIYA

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Xotira
const waitingPlayers = []; // Kutayotgan o‘yinchilar ro‘yxati (socketlar)

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

    console.log(`${user.name} kirdi`);

    // Kutish ro‘yxatiga qo‘shamiz
    waitingPlayers.push(socket);

    // Agar 2 yoki undan ko‘p odam bo‘lsa – duel boshlaymiz
    if (waitingPlayers.length >= 2) {
      const player1 = waitingPlayers.shift();
      const player2 = waitingPlayers.shift();

      const p1 = player1.user;
      const p2 = player2.user;

      // Har ikkisiga raqibni yuboramiz
      player1.emit('pair_started', { opponent: p2 });
      player2.emit('pair_started', { opponent: p1 });

      console.log(`JUFTLIK BOSHLANDI: ${p1.name} ❤️ ${p2.name}`);

      // Vote logikasi (player1 va player2 uchun alohida)
      const votes = {};

      const handleVote = (choice) => {
        votes[socket.user.id] = choice;

        if (Object.keys(votes).length === 2) {
          const v1 = votes[p1.id];
          const v2 = votes[p2.id];

          if (v1 === 'like' && v2 === 'like') {
            player1.emit('match', { partner: p2 });
            player2.emit('match', { partner: p1 });
            console.log(`MATCH! ${p1.name} ❤️ ${p2.name}`);
          } else {
            player1.emit('no_match');
            player2.emit('no_match');
            console.log(`NO MATCH: ${p1.name} va ${p2.name}`);
          }

          // Yangi duel uchun navbatga qaytarish
          waitingPlayers.push(player1);
          waitingPlayers.push(player2);
        }
      };

      player1.on('vote', handleVote);
      player2.on('vote', handleVote);
    }
  });

  socket.on('disconnect', () => {
    if (socket.user) {
      // Navbatdan o‘chiramiz
      const index = waitingPlayers.indexOf(socket);
      if (index > -1) waitingPlayers.splice(index, 1);
      console.log(`${socket.user.name} chiqdi`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\nSERVER JUFTLIK BILAN ISHLAYAPTI → http://localhost:${PORT}`);
  console.log(`Bot: @likeduelgame_bot`);
});