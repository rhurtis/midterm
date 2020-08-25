// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const sass = require("node-sass-middleware");

// const sass = require("node-sass-middleware");
const app = express();
const morgan = require('morgan');
const path = require('path');
const http = require('http').createServer(app);

app.use(cookieSession({
  name: 'session',
  keys: ['userId']
}));


// PG database client/connection setup
const { Pool } = require('pg');
const dbParams = require('./lib/db.js');
const db = new Pool(dbParams);
db.connect();

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(sass({
  /* Options */
  src: path.join(__dirname, 'styles'),
  dest: path.join(__dirname, 'public', 'styles'),
  debug: true,
  outputStyle: 'compressed',
  prefix: '/styles'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
}));


app.use(express.static(path.join(__dirname, "public")));


const io = require('socket.io')(http)
io.on('connection', socket => {
  console.log('A new user connected');
  socket.on('chat message', (msg) => {
    io.emit('new message', msg);
    console.log('message: ' + msg);
  });
})
//broadcast the msgs to all the connected clients (resending it bk)


// Separated Routes for each Resource
// Note: Feel free to replace the example routes below with your own
const usersRoutes = require("./routes/users");
const widgetsRoutes = require("./routes/widgets");
const messagesRoutes = require("./routes/messages");
const loginRoutes = require("./routes/login");
const carsRoutes = require("./routes/cars");
// Mount all resource routes
// Note: Feel free to replace the example routes below with your own
app.use("/api/users", usersRoutes(db));
app.use("/api/widgets", widgetsRoutes(db));
app.use("/api/messages", messagesRoutes(db));
app.use("/api/login", loginRoutes(db));
app.use("/api/cars", carsRoutes(db));
// Note: mount other resources here, using the same pattern above


// Home page
// Warning: avoid creating more routes in this file!
// Separate them into separate routes files (see above).
app.get("/", (req, res) => {

  db.query(`SELECT * FROM cars;`)
    .then(data => {
      const cars = data.rows;
      //res.json({cars});
      res.render('index', { cars: data.rows, name: req.session.name });
    })
    .catch(err => {
      res
        .status(500)
        .json({ error: err.message });
    });

});


///////////////////////////////////// THIS IS TO BE PUTED ON SEPERATE FOLDER /////////////////////////////////////

//login form route
app.get('/login', (req, res) => {

  res.render("login");
});

///loging route
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password1 = req.body.password;


  db.query(`SELECT * FROM users
  WHERE email = $1;`, [email])
    .then(data => {
      if (data.rows.length === 0) {
        res.status(400).send("Email does not exist");
      } else if (password1 === data.rows[0].password) {
        req.session.userId = data.rows[0].id;
        req.session.name = data.rows[0].name;//put the info in the suer
        res.redirect('/');
      } else {
        console.log('102');
        res.status(400).send("Email and password do not much");
      }

    })
    .catch(err => {
      res
        .status(500)
        .json({ error: err.message });
    });
});
//register form route
app.get('/register', (req, res) => {
  res.render("register");
});
//cart form route
app.get('/cart', (req, res) => {
  res.render("cart");
});
//checkout form route
app.get('/checkout', (req, res) => {
  res.render("checkout");
});

//message form route
app.get('/message', function(req, res) {
  res.render("message");
})

//new listing form route
app.get('/createNewListing', (req, res) => {
  res.render("createNewListing");
});
///////////////////////////////////// THIS IS TO BE PUTED ON SEPERATE FOLDER /////////////////////////////////////

http.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
