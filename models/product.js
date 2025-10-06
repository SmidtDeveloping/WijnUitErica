const mongoose = require('mongoose');
const uuidv4 = require("uuidv4").uuid

const productSchema = new mongoose.Schema({
  id: {type: String, default: uuidv4, required: true},
  naam: String,
  description: String,
  vooraad: Number,
  sales: Number,
  smaakprofiel: Array,
  img: String,
  nieuw: Boolean,
  prijs: Number,  
  promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion" },
  cat: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
});

module.exports = mongoose.model('Product', productSchema);
