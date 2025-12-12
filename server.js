// server.js – TOʻLIQ VERSIYA (Telegram Mini App uchun)

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ==== BOT SOZLAMLARI (BU YERNI OʻZGARTIRING!) ====
const BOT_TOKEN = "8190087923:AAHf41SYoQwBjOpcvPBkjDP9AJYJu6BxJm4"; // OʻZ TOKENINGIZNI YOZING!
const WEBAPP_URL = "http://localhost:3000"; // Hozircha localhost, keyin vercelga oʻtkazamiz

// ==== PUBLIC PAPKA (Telegram WebApp fayllari shu yerda) ====
app.use(express.static('public')); // public/index.html boʻlishi shart!
app.use(express.static('public')); // Telegram WebApp fayllari shu yerda

// ==== CONTROLLERLAR ====
const { authUser } = require('./controllers/authController');
const { joinRoom, leaveRoom } = require('./controllers/roomController');

// ==== XOTIRA ====
const userSockets = new Map();
const users = new Map();
const MAIN_ROOM_ID = "duel-room-001"; // Hammasi shu xonada

// ==== SOCKET.IO ====
io.on('connection', (socket) => {
  console.log('Yangi ulanish:', socket.id);

  socket.on('auth', async (data) => {
    const user = await authUser(data);
    if (!user) return;

    users.set(user.telegramId, user);
    userSockets.set(user.telegramId, socket);
    socket.user = user;

    socket.emit('auth_ok', { user });
    console.log(`Kirish: ${user.username} (${user.telegramId})`);

    // Hammasini bitta xonaga qoʻshamiz
    joinRoom({ roomId: MAIN_ROOM_ID }, socket, io);
  });

  socket.on('leaveRoom', () => leaveRoom(socket, io));
  socket.on('vote', (d) => {
    // Keyingi bosqichda qoʻshamiz
    console.log('Vote keldi:', d);
  });

  socket.on('disconnect', () => {
    if (socket.user) {
      users.delete(socket.user.telegramId);
      userSockets.delete(socket.user.telegramId);
      leaveRoom(socket, io);
    }
    console.log('Uzildi:', socket.id);
  });
});

// ==== SERVER ISHGA TUSHGANDA BOT TUGMASINI OʻRNATISH ====
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`\nSERVER ISHLAMOQDA → http://localhost:${PORT}`);
  console.log(`Telegram botga kiring → @yourbot_username`);
  console.log(`"Oʻyinni ochish" tugmasi chiqishi kerak!\n`);

  // Botga WebApp tugmasini oʻrnatish
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "Oʻyinni ochish",
          web_app: { url: WEBAPP_URL }
        }
      })
    });
    const data = await res.json();
    if (data.ok) {
      console.log('Bot tugmasi muvaffaqiyatli oʻrnatildi!');
    } else {
      console.log('Bot tugmasi xato:', data.description);
    }
  } catch (err) {
    console.log('Bot tugmasi ulashda xato:', err.message);
  }
});