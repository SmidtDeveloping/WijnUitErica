const mongoose = require('mongoose');
const uuidv4 = require("uuidv4").uuid

const userSchema = new mongoose.Schema({
  id: {type: String, default: uuidv4, required: true},
  name: { type: String, required: true },
  password: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'dashboardRoles' }
});

module.exports = mongoose.model('dashboardUser', userSchema);
