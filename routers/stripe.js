const berekenPrijs = require("../helper/cardPromotie");
const db_product = require("../models/product");
const promotions = require("../models/promotions");
const stripe = require("../stripeConnect");
const express = require("express")

const router = require("express").Router()
require("dotenv").config()
router.post("/cart/add", async (req, res) => {
  const { id, quantity } = req.body;
  const qty = Number(quantity);

  const product = await db_product.findOne({ id });
  if (!product) return res.redirect("/winkelmandje");

  const promotion = await promotions.findOne({
    productIds: { $in: [product._id] },
    active: true
  });

  req.session.cart = req.session.cart || [];

  const existingItem = req.session.cart.find(i => i.id === product.id);

  if (existingItem) {
    existingItem.quantity += qty;
    existingItem.prijs = berekenPrijs(product, existingItem.quantity, promotion);
  } else {
    const totaal = berekenPrijs(product, qty, promotion);
    req.session.cart.push({
      id: product.id,
      name: product.naam,
      quantity: qty,
      prijs: totaal,
      promotion: promotion ? promotion : null
    });
  }

  res.redirect("/winkelmandje");
});



router.post("/cart/remove", (req, res) => {
  const { id } = req.body;
  if (!req.session.cart) return res.redirect("/winkelmandje");

  req.session.cart = req.session.cart.filter(item => item.id !== id);
  res.redirect("/winkelmandje");
});


router.post("/cart/increase", async (req, res) => {
  const { id } = req.body;

  const item = req.session.cart.find(i => i.id === id);
  if (!item) return res.redirect("/winkelmandje");

  const product = await db_product.findOne({ id });
  const promotion = await promotions.findOne({
    productIds: { $in: [product._id] },
    active: true
  });

  item.quantity++;
  item.prijs = berekenPrijs(product, item.quantity, promotion);

  res.redirect("/winkelmandje");
});


router.post("/cart/decrease", async (req, res) => {
  const { id } = req.body;

  const item = req.session.cart.find(i => i.id === id);
  if (!item) return res.redirect("/winkelmandje");

  const product = await db_product.findOne({ id });
  const promotion = await promotions.findOne({
    productIds: { $in: [product._id] },
    active: true
  });

  if (item.quantity > 1) {
    item.quantity--;
    item.prijs = berekenPrijs(product, item.quantity, promotion);
  } else {
    req.session.cart = req.session.cart.filter(i => i.id !== id);
  }

  res.redirect("/winkelmandje");
});




router.get("/winkelmandje", (req, res) => {
  const cart = req.session.cart
  res.render("winkelmandje", { cart })

})

router.get('/create-checkout-session', async (req, res) => {
  const cart = req.session.cart || [];
  console.log(cart)
  const line_items = cart.map(item => ({
    price_data: {
      currency: 'eur',
      product_data: { name: `${item.name}` },
      unit_amount: Math.round((item.prijs / item.quantity) * 100)
    },
    quantity: Math.min(parseInt(item.quantity) || 1, 1000)
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: 'http://localhost:1010/bedankt',
    cancel_url: 'https://wijnuiterica.onrender.com/cart',
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['NL', 'BE'],
    },
    invoice_creation: {
      enabled: true,
    },
    allow_promotion_codes: true,
    customer_creation: "if_required"


  });

  res.redirect(303, session.url);
});

router.get("/bedankt", async (req, res) => {
  req.session.cart = []
  res.render("bedankt")
})

router.post("/webhooks/checkout", async (req, res) => {
  let event;
  console.log(req.body)
  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.rawBody, sig, "whsec_Fh1D10RjF7jBtFrS3rC6rEScetxmMQ5A");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.succeeded") {
    const session = event.data.object;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
    });

    console.log("Line items:", lineItems);

    lineItems.data.forEach(item => {
      console.log(`Product: ${item.description}, Aantal: ${item.quantity}, Prijs: ${item.amount_total / 100} ${item.currency}`);
    });
  }

  res.json({ received: true });
});


module.exports = router