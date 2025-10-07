const express = require("express")
require("dotenv").config()
const bodyParser = require('body-parser');
const path = require("node:path")
const session = require('express-session');
const MongoStore = require('connect-mongo');
const port = process.env.PORT
const app = express()
require("./dbConnect")(process.env.MONGOURL)


app.use(session({
  secret: process.env.SESSIONSECRET,
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGOURL,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native',
  }),
  cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    bodyParser.json({
        verify: function(req, res, buf) {
            req.rawBody = buf;
        }
    })
);
app.enable('trust proxy');
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (req.session) {
    res.locals.session = req.session;
    if (req.session.user) {
      res.locals.profile = req.session.user;
    }
  }
  next();
});

const sanitize = require("mongo-sanitize")

app.use((req, res, next) => {
  if (req.body) req.body = sanitize(req.body)
  if (req.query) req.query = sanitize(req.query)
  if (req.params) req.params = sanitize(req.params)
  next()
})


app.use(require("./routers/index"))
app.use(require("./routers/stripe"))
app.use("/dashboard", require("./routers/dashboard"))



app.listen(port, () => {
  console.log(`Server draait op port: ${port}`)
})