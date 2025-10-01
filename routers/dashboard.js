const dashboardUser = require('../models/dashboardUser');
const db_product = require('../models/product')
const productCats = require("../models/product_cat")
const router = require('express').Router()
const stripe = require("../stripeConnect")
const bcrypt = require("bcrypt")
const uuidv4 = require("uuidv4").uuid


async function isLoggedIn(req, res, next) {
  if (!req.session.user) return res.redirect("/login")
  const user = await dashboardUser.findOne({ id: req.session.user.id })
  if (!user) return res.redirect("/login");
  return next()
}

function checkRole(height) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user || user.roleHeight < height) return res.status(403).send("Geen Toegang");
    return next();
  };
}

router.get("/", isLoggedIn, async (req, res) => {
  const sessions = await stripe.checkout.sessions.list({ limit: 20 });

  const filteredSessions = sessions.data.filter(session => session.customer_details !== null);

  const orders = await Promise.all(
    filteredSessions.map(async (session) => {
      console.log(session);
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const totalQuantity = lineItems.data.reduce((sum, item) => sum + item.quantity, 0);
      return {
        ...session,
        productCount: totalQuantity
      };
    })
  );

  const products = await db_product.find({}).populate("cat")

  res.render("dashboard/index", { orders, products });
});

router.get("/create-product", isLoggedIn, checkRole(2), async (req, res) => {
  const {success, error} = req.query
  const cats = await productCats.find({})
  res.render("dashboard/products/create-product", { cats, success, error })
})

router.get("/edit-product", isLoggedIn, checkRole(2), async (req, res) => {
    const { success, error } = req.query;
  const products = await db_product.find({})
  const cats = await productCats.find({})

  res.render("dashboard/products/edit-product", { products, cats, success, error })
})

router.post('/edit-product', async (req, res) => {
  try {
    const {
      productId,
      naam,
      beschrijving,
      prijs,
      img,
      smaakprofiel,
      nieuw,
      cat
    } = req.body;

    await db_product.findByIdAndUpdate(productId, {
      naam,
      beschrijving,
      prijs: parseFloat(prijs),
      img,
      smaakprofiel: smaakprofiel ? smaakprofiel.split(",").map(s => s.trim()) : [],
      nieuw: nieuw === 'on',
      cat: Array.isArray(cat) ? cat : [cat]
    });

    res.redirect('/dashboard/edit-product?success=Product is aangepast');
  } catch (err) {
    console.error(err);
    res.status(500).send('Er is iets misgegaan bij het updaten van het product.');
  }
});


router.post('/create-product', isLoggedIn, checkRole(2), async (req, res) => {
  try {
    const { naam, description, vooraad, prijs, smaakprofiel, cat, img } = req.body;
    const product = new db_product({
      naam,
      description,
      vooraad,
      prijs,
      smaakprofiel: smaakprofiel ? smaakprofiel.split(",").map(s => s.trim()) : [],
      img,
      nieuw: req.body.nieuw ? true : false,
      cat: Array.isArray(cat) ? cat : [cat]
    });

    await product.save();
    res.redirect(`/dashboard/create-product?success=Product: ${naam} is aangemaakt`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Fout bij maken van product");
  }
});

router.get("/delete-product", isLoggedIn, checkRole(2), async (req, res) => {
  const { success, error } = req.query;
  const products = await db_product.find({})
  res.render("dashboard/products/delete-product", { products, success, error })
})

router.post("/delete-product", isLoggedIn, checkRole(2), async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).send('Geen product.');
    }

    await db_product.findByIdAndDelete(productId);
    res.redirect(`/dashboard/delete-product?success=Product: ${productId} is verwijderd`)
  } catch (err) {
    console.error(err);
    res.status(500).send('Er is iets misgegaan bij het verwijderen van het product.');
  }

})

router.get("/customers", isLoggedIn, checkRole(2), async (req, res) => {
  try {
    const customers = await stripe.customers.list({ limit: 100 });
    const klanten = customers.data.map(customer => ({
      name: customer.name || 'Onbekend',
      email: customer.email || 'Onbekend',
      phone: customer.phone || 'Onbekend',
      address: customer.address || null
    }));

    res.render("dashboard/customers", { klanten });
  } catch (err) {
    console.error(err);
    res.send("Er is iets misgegaan bij het ophalen van alle klanten");
  }
});


router.get("/create-user", isLoggedIn, checkRole(2), (req, res) => {
    res.render("dashboard/users/create-user")
})

router.post("/create-user", isLoggedIn, checkRole(2), async (req, res) => {
    let { password, roleHeight, name } = req.body;

    try {
        password = await bcrypt.hash(password, 10)

        const user = new dashboardUser({
            password,
            roleHeight,
            id: uuidv4(),
            name
        })

        await user.save()
        return res.redirect("/dashboard/create-user")
    } catch (error) {
        console.error(error)
        return res.status(505).send("Error bij maken van gebruiker")
    }
})

router.get("/edit-user", isLoggedIn, checkRole(2), async (req, res) => {
    try {
        const users = await dashboardUser.find({}, "id name roleHeight")

        return res.render("dashboard/users/edit-user", {
            users,
        })
    } catch (error) {
        console.error(error)
        return res.status(error.status).send("Fout bij ophalen gebruikers")
    }
})

router.post("/update-user", isLoggedIn, checkRole(2), async (req, res) => {
    let { id, name, roleHeight } = req.body
    try {
        await dashboardUser.findOneAndUpdate(
            { id },
            { name, roleHeight },
            { new: true }
        )

        return res.redirect("/dashboard/edit-user")
    } catch (error) {
        console.error(error)
        return res.status(error.status).send("Fout bij updaten van gebruiker")
    }
})

router.get("/delete-user", isLoggedIn, checkRole(2), async (req, res) => {
    const users = await dashboardUser.find({}, "id name roleHeight")

    res.render("dashboard/users/delete-user", {
        users,
    })
})

router.post("/delete-user", isLoggedIn, checkRole(2), async (req, res) => {
    const userID = req.body.id
    console.log(userID)
    try {
        await dashboardUser.findOneAndDelete(
            { id: userID }
        )

        res.redirect("/dashboard/delete-user")
    } catch (error) {
        console.error(error)
        res.status(500).send("Fout bij het verwijderen van gebruiker")
    }
})

router.get("/orderlist", isLoggedIn, checkRole(2), async (req, res) => {

  try {
    let sessions = await stripe.checkout.sessions.list()
    const paidFilter = sessions.data.filter(s => s.payment_status === 'paid')

    sessions = await Promise.all(
      paidFilter.map(async (session) => {
        const full = await stripe.checkout.sessions.retrieve(session.id, {
           expand: ["line_items", "payment_intent", "customer_details"],
        })
        return full
      })
    )


    res.render("dashboard/orders/orderlist", {sessions})

  } catch (error) {
    res.status(500).send("Error bij ophalen orders")
    return console.log(error)
  }
  
})

router.get("/vieworder/:id", isLoggedIn, checkRole(2), async (req, res) => {
  const sessionId = req.params.id
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "payment_intent", "customer_details"]
  })
  console.log(session)
  if (!session) return res.redirect("/dashboard/orderlist")

  res.render("dashboard/orders/vieworder", {order: session})
  
})

router.get("/users-profile", isLoggedIn, async (req, res) => {
  res.render("dashboard/profile")
})




module.exports = router