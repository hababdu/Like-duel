// server.js – FINAL: 2 kishi kirsa darrov duel boshlanadi

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Kutayotgan o'yinchilar (socketlar)
const waiting = [];

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

    waiting.push(socket);

    // Agar kutayotganlar 2 ta bo'lsa – duel boshlaymiz
    if (waiting.length >= 2) {
      const player1 = waiting.shift();
      const player2 = waiting.shift();

      const p1 = player1.user;
      const p2 = player2.user;

      // Har ikkisiga raqib ma'lumotini yuboramiz
      player1.emit('pair_started', { opponent: p2 });
      player2.emit('pair_started', { opponent: p1 });

      console.log(`JUFTLIK BOSHLANDI: ${p1.name} vs ${p2.name}`);

      // Vote natijasi
      const votes = {};

      const checkResult = () => {
        if (Object.keys(votes).length === 2) {
          const v1 = votes[p1.id];
          const v2 = votes[p2.id];

          if (v1 === 'like' && v2 === 'like') {
            player1.emit('match', { partner: p2 });
            player2.emit('match', { partner: p1 });
            console.log('MATCH!');
          } else {
            player1.emit('no_match');
            player2.emit('no_match');
            console.log('NO MATCH');
          }

          // Yangi duel uchun navbatga qaytaramiz
          waiting.push(player1);
          waiting.push(player2);
        }
      };

      player1.on('vote', (choice) => {
        votes[p1.id] = choice;
        checkResult();
      });

      player2.on('vote', (choice) => {
        votes[p2.id] = choice;
        checkResult();
      });
    }
  });

  socket.on('disconnect', () => {
    const index = waiting.indexOf(socket);
    if (index !== -1) waiting.splice(index, 1);
    console.log('O‘yinch chiqdi');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\nSERVER JUFTLIK BILAN ISHLAMOQDA → http://localhost:${PORT}`);
  console.log(`Telegram bot: @likeduelgame_bot\n`);
});