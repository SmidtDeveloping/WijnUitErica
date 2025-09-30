const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")

const db_producten = require('../models/product')
const dashboardUser = require("../models/dashboardUser")

router.get("/", async (req, res) => {
    const popular = await db_producten.find({})
        .sort({ sales: -1 })
        .limit(2)
        .populate('cat')
    res.render("index", { popular })
})

router.get("/producten", async (req, res) => {
    let producten = await db_producten.find({}).sort({sales: -1}).lean().populate("cat");
    producten.sort((a, b) => b.sales - a.sales);
    producten = producten.map((p, i) => {
    return { ...p, populair: i < 2 }; 
  });
    res.render("producten", { producten })
})

router.get("/product/:id", async (req, res) => {
    const productId = req.params.id
    const product = await db_producten.findOne({ id: productId }).populate("cat")
    res.render("product", { product })
})

router.get("/login", async (req, res) => {
    if (req.session.user) return res.redirect("/dashboard")
    res.render("dashboard/login")
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.redirect("/login");

    try {
        const user = await dashboardUser.findOne({ name: username });
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