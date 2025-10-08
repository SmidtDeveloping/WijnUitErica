const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  customerId: { type: String, required: true },

  name: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    line1: String,
    line2: String,
    city: String,
    postal_code: String,
    country: String,
  },

  items: [
    {
      description: String,
      quantity: Number,
      amount: Number,
      currency: String,
    },
  ],

  subtotal: Number,
  total: Number,
  discount: Number,
  tax: Number,

  invoiceId: String,
  status: { type: String, default: "pending" },

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
