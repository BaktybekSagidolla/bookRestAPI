// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
  creationDate: { type: Date, default: Date.now },
  updateDate: { type: Date, default: Date.now },
  deletionDate: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema);
