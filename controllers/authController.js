// controllers/authController.js

async function authUser(data, socket) {
  const { telegramId, username = 'Foydalanuvchi', avatarUrl = '', gender = 'other' } = data;

  if (!telegramId) {
    socket.emit('error', { message: 'telegramId yo‘q' });
    return null;
  }

  // MongoDB yo‘q → faqat xotirada saqlaymiz
  const user = {
    telegramId: String(telegramId),
    username,
    avatarUrl,
    gender,
    rating: 0,
    toObject: () => ({ telegramId, username, avatarUrl, gender, rating: 0 })
  };

  console.log(`Test foydalanuvchi yaratildi: ${username}`);
  return user;
}

module.exports = { authUser };