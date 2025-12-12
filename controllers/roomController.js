// controllers/roomController.js

const rooms = new Map();

function joinRoom({ roomId }, socket, io) {
  if (!socket.user) return;

  let room = rooms.get(roomId);
  if (!room) {
    room = { players: [], status: 'waiting' };
    rooms.set(roomId, room);
    console.log(`Yangi xona yaratildi: ${roomId}`);
  }

  // Agar allaqachon bo‘lsa – chiqaramiz
  room.players = room.players.filter(p => p.telegramId !== socket.user.telegramId);
  room.players.push(socket.user);

  // Socketni xonaga qo‘shish
  socket.join(roomId);

  // Hammaga yangilanish yuborish
  io.to(roomId).emit('room_update', {
    roomId,
    players: room.players.map(p => ({
      telegramId: p.telegramId,
      username: p.username,
      gender: p.gender
    }))
  });

  console.log(`${socket.user.username} → ${roomId} xonasiga kirdi (${room.players.length} kishi)`);

  // 2 kishi bo‘lsa juftlik boshlanadi
  if (room.players.length >= 2 && room.status === 'waiting') {
    room.status = 'playing';
    const a = room.players[room.players.length - 2];
    const b = room.players[room.players.length - 1];
    
    io.to(roomId).emit('pair_started', {
      roomId,
      a: a.telegramId,
      b: b.telegramId
    });

    console.log(`JUFTLIK! ${a.username} ❤️ ${b.username}`);
  }
}

function leaveRoom(socket, io) {
  if (!socket.user) return;
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.some(p => p.telegramId === socket.user.telegramId)) {
      room.players = room.players.filter(p => p.telegramId !== socket.user.telegramId);
      io.to(roomId).emit('room_update', { roomId, players: room.players.map(p => ({ telegramId: p.telegramId, username: p.username })) });
      console.log(`${socket.user.username} xonadan chiqdi`);
    }
  }
}

module.exports = { joinRoom, leaveRoom };
// createRoom endi kerak emas – hamma bitta xonaga kiradi