const stripe = require("../stripeConnect");

const router = require("express").Router()

router.post('/cart/add', (req, res) => {
  const { id, name, price, quantity } = req.body;

  if (!req.session.cart) req.session.cart = [];

  const existingProduct = req.session.cart.find(p => p.id === id);
  if (existingProduct) {
    existingProduct.quantity += Number(quantity);
  } else {
    req.session.cart.push({ id, name, price: Math.round(Number(price)), quantity: Number(quantity) });
  }

  res.redirect('/winkelmandje');
});

router.post('/cart/remove', (req, res) => {
  const { id } = req.body;

  if (!req.session.cart) return res.redirect('/cart');

  req.session.cart = req.session.cart.filter(item => item.id !== id);

  res.redirect('/winkelmandje');
});

router.post("/cart/increase", (req, res) => {
  const id = req.body.id;
  const item = req.session.cart.find(i => i.id === id);
  if(item) item.quantity++;
  res.redirect("/winkelmandje");
});

router.post("/cart/decrease", (req, res) => {
  const id = req.body.id;
  const item = req.session.cart.find(i => i.id === id);
  if(item && item.quantity > 1) item.quantity--; 
  res.redirect("/winkelmandje");
});

router.get("/winkelmandje", (req, res) => {
  const cart = req.session.cart
  res.render("winkelmandje", { cart })

})

router.get('/create-checkout-session', async (req, res) => {
  const cart = req.session.cart || [];
  const line_items = cart.map(item => ({
    price_data: {
      currency: 'eur',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100)
    },
    quantity: item.quantity
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: 'http://localhost:1010/bedankt',
    cancel_url: 'http://localhost:1010/cart',
    billing_address_collection: 'required',
     shipping_address_collection: {
    allowed_countries: ['NL', 'BE'],
  },
      customer_creation: "always"

  });

  res.redirect(303, session.url);
});

router.get("/bedankt", (req, res) => {
  req.session.cart = []
  res.render("bedankt")
})


module.exports = router