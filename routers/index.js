const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const calculatePromoPrice = require("../helper/promotie")

const db_producten = require('../models/product')
const dashboardUser = require("../models/dashboardUser")
require("../models/dashboardRoles")
const db_promotions = require("../models/promotions")

router.get("/", async (req, res) => {
  const popular = await db_producten.find({})
    .sort({ sales: -1 })
    .limit(2)
    .populate("cat")
    .lean();

  const promotions = await db_promotions.find({ active: true }).lean();

  const promoMap = {};
  promotions.forEach(promo => {
    promo.productIds.forEach(p => {
      promoMap[p.toString()] = promo;
    });
  });

  const popularWithPromos = popular.map(p => ({
    ...p,
    promotion: promoMap[p._id.toString()] || null
  }));

  res.render("index", { popular: popularWithPromos });
});

router.get("/producten", async (req, res) => {
  let producten = await db_producten.find({})
    .sort({ sales: -1 })
    .populate("cat")
    .lean();

  const promotions = await db_promotions.find({ active: true }).lean();

  const promoMap = {};
  promotions.forEach(promo => {
    promo.productIds.forEach(p => {
      promoMap[p.toString()] = promo;
    });
  });

  producten = producten.map((p, i) => {
    const promotion = promoMap[p._id.toString()] || null;
    const promoPrice = promotion ? calculatePromoPrice(p, promotion) : null;

    return {
      ...p,
      populair: i < 2,
      promotion,
      promoPrice
    };
  });

  res.render("producten", { producten });
});

router.get("/product/:id", async (req, res) => {
  const productId = req.params.id;
  const product = await db_producten.findOne({ id: productId }).populate("cat").lean();

  if (!product) return res.redirect("/")

  const promotion = await db_promotions.findOne({
    active: true,
    productIds: product._id,
    $or: [
      { validUntil: null },
      { validUntil: { $gte: new Date() } }
    ]
  }).lean();

  const promoPrice = promotion ? calculatePromoPrice(product, promotion) : null;
  res.render("product", { product, promotion, promoPrice });
});


router.get("/login", async (req, res) => {
    if (req.session.user) return res.redirect("/dashboard")
    res.render("dashboard/login")
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.redirect("/login");

    try {
        const user = await dashboardUser.findOne({ name: username }).populate("role")
        if (!user) return res.redirect("/login");

        const isMatch = bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.redirect("/login");
        }
        user.via = 'Webadmin Login'
        await user.save()
        req.session.user = user
        return res.redirect("/dashboard");
    } catch (error) {
        console.error(error);
        return res.redirect("/login");
    }
});

router.get("/logout", (req, res) => {
    req.session.user = null
    req.session.destroy()
    res.redirect("/")
})

module.exports = router