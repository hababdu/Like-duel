const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true, required: true },
  username:   { type: String, required: true },
  avatarUrl:  { type: String },
  bio:        { type: String },
  gender:     { type: String, enum: ['male', 'female', 'other'], required: true },
  rating:     { type: Number, default: 0 },
  createdAt:  { type: Date, default: Date.now }
});

// Bu qator boʻlmasa MissingSchemaError chiqadi!
module.exports = mongoose.model('User', userSchema);