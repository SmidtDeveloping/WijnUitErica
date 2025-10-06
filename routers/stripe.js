const berekenPrijs = require("../helper/cardPromotie");
const db_product = require("../models/product");
const promotions = require("../models/promotions");
const stripe = require("../stripeConnect");

const router = require("express").Router()

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
    success_url: 'https://localhost:1010/bedankt?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://wijnuiterica.onrender.com/cart',
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['NL', 'BE'],
    },
    customer_creation: "always",
    invoice_creation: {
      enabled: true,
    },

  });

  res.redirect(303, session.url);
});

router.get("/bedankt", async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.redirect('/');
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent', 'invoice']
  });
  if (!session) return res.redirect('/');

  if (session.payment_status === "paid") {
    for (const item of session.line_items.data) {
      const productId = item.price.product;
      const quantity = item.quantity;

      const product = await db_product.findById(productId);
      if (!product) continue;

      product.stock -= quantity;
      product.sales += quantity;
      await product.save();
    }
  }

  req.session.cart = []

  res.render("bedankt")
})


module.exports = router