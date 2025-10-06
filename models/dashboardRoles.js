const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleName: { type: String, required: true },
  roleHeight: { type: Number, enum: [0, 1, 2, 3], default: 0 }
});

module.exports = mongoose.model('dashboardRoles', roleSchema);
