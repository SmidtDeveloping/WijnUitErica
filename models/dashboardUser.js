const mongoose = require('mongoose');
const uuidv4 = require("uuidv4").uuid

const userSchema = new mongoose.Schema({
  id: {type: String, default: uuidv4, required: true},
  name: { type: String, required: true },
  password: String,
  roleHeight: { type: Number, enum: [0, 1, 2, 3], default: 0 }
});

module.exports = mongoose.model('dashboardUser', userSchema);
