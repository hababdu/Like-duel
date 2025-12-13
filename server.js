// server.js – TOʻLIQ, TAYYOR VERSIYA (Telegram Mini App uchun)

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO – hamma joydan ulanishga ruxsat
const io = new Server(server, {
  cors: { origin: "*" }
});

// ==== BOT SOZLAMLARI (BU YERNI OʻZGARTIRING!) ====
const BOT_TOKEN = "8190087923:AAHf41SYoQwBjOpcvPBkjDP9AJYJu6BxJm4"; // OʻZ TOKENINGIZ
const WEBAPP_URL = "https://like-duel.vercel.app"; // Vercel yoki ngrok URLingiz

// ==== STATIC FAYLLAR (Telegram WebApp) ====
app.use(express.static('public')); // public/index.html boʻlishi shart!

// ==== XOTIRA (hozircha in-memory) ====
const users = new Map();           // telegramId → user object
const votes = new Map();           // roomId → { userId1: 'like'|'nolike', userId2: ... }
const MAIN_ROOM = "duel-room-001"; // Hammasi bitta xonada

// ==== SOCKET.IO LOGIKA ====
io.on('connection', (socket) => {
  console.log('Yangi ulanish:', socket.id);

  // 1. AUTH – Telegramdan kelgan foydalanuvchi
  socket.on('auth', (data) => {
    const { telegramId, username, photo } = data;

    const user = {
      id: telegramId,
      name: username || 'NoName',
      photo: photo || `https://t.me/i/userpic/320/${telegramId}.jpg`
    };

    users.set(telegramId, user);
    socket.user = user;
    socket.join(MAIN_ROOM);

    socket.emit('auth_ok');
    console.log(`${user.name} kirdi`);

    // Xonada 2 kishi boʻlsa – duel boshlanadi
    const roomUsers = [...users.values()].filter(u => io.sockets.adapter.rooms.get(MAIN_ROOM)?.has(u.id));
    if (roomUsers.length >= 2) {
      const [p1, p2] = roomUsers.slice(-2);
      io.to(MAIN_ROOM).emit('pair_started', {
        opponent: p1.id === user.id ? p2 : p1
      });
      console.log(`JUFTLIK: ${p1.name} ❤️ ${p2.name}`);
    }
  });

  // 2. VOTE – Like yoki No-like
  socket.on('vote', (data) => {
    if (!socket.user) return;
    const { choice } = data; // 'like' | 'nolike'

    console.log(`${socket.user.name} → ${choice}`);

    // Xonada ikkita odam boʻlsa – natijani hisoblaymiz
    const roomSockets = [...io.sockets.adapter.rooms.get(MAIN_ROOM) || []];
    if (roomSockets.length !== 2) return;

    votes.set(socket.user.id, choice);

    // Ikkalasining ovozi kelsa – natija
    if (votes.size === 2) {
      const [id1, id2] = roomSockets;
      const vote1 = votes.get(id1);
      const vote2 = votes.get(id2);

      if (vote1 === 'like' && vote2 === 'like') {
        io.to(MAIN_ROOM).emit('match'); // MATCH!
      } else {
        io.to(MAIN_ROOM).emit('no_match');
      }

      votes.clear(); // yangi duel uchun tozalaymiz
    }
  });

  // 3. DISCONNECT
  socket.on('disconnect', () => {
    if (socket.user) {
      users.delete(socket.user.id);
      votes.delete(socket.user.id);
      console.log(`${socket.user.name} chiqdi`);
      io.to(MAIN_ROOM).emit('opponent_left');
    }
  });
});

// ==== SERVER ISHGA TUSHISHI ====
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`\nLIKE DUEL SERVER ISHLAYAPTI → http://localhost:${PORT}`);
  console.log(`Vercel URL: ${WEBAPP_URL}`);
  console.log(`Bot: @likeduelgame_bot\n`);

  // Botga tugma o'rnatish (faqat 1 marta kerak)
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "O‘yinni ochish",
          web_app: { url: WEBAPP_URL }
        }
      })
    });
    const json = await res.json();
    console.log(json.ok ? 'Bot tugmasi ornatildi!' : 'Xato: ${json.description}');
  } catch (e) {
    console.log('Bot tugmasi ulanmadi (localda normal)');
  }
});