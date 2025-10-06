const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: String, 
  type: { type: String, enum: ["percentage", "fixed", "fixed_price", "buy_x_get_y"], required: true },
  value: Number,
  buyQuantity: Number,
  getQuantity: Number,
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], 
  active: { type: Boolean, default: true },
  validUntil: Date
});
module.exports = mongoose.model("Promotion", promotionSchema);
