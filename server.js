// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");

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
// app.use(sass({
//   src: __dirname + "/styles",
//   dest: __dirname + "/public/styles",
//   debug: true,
//   outputStyle: 'expanded'
// }));

app.use(express.static(path.join(__dirname, "public")));

const io = require('socket.io')(http)
io.on('connection', socket => {
  console.log('A new user connected');
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });
});

// Separated Routes for each Resource
// Note: Feel free to replace the example routes below with your own
const usersRoutes = require("./routes/users");
const widgetsRoutes = require("./routes/widgets");
const messagesRoutes = require("./routes/messages");
const loginRoutes = require("./routes/login");
const carsRoutes = require("./routes/cars");
const { count } = require('console');
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

//render all the cars in the index page
app.get("/", (req, res) => {
  db.query(`SELECT * FROM cars;`)
    .then(data => {
      res.render('index', { cars: data.rows, name: req.session.name});
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

///loging POST route
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //get the user by email
  db.query(`SELECT * FROM users WHERE email = $1;`,[email])
  //check if the user has imputed an email
    .then(data => {
      if (data.rows.length === 0) {
        res.status(400).send("Email does not exist");
        //ched if the passwords do match
      } else if (password === data.rows[0].password) {
        req.session.userId = data.rows[0].id;
        req.session.name = data.rows[0].name;//put the name in the header
        res.redirect('/');
      } else {
        console.log('102');
        res.status(400).send("Email password combination do not much");
      }
    })
    .catch(err => {
      res
        .status(500)
        .json({ error: err.message });
    });
});

//register POST route
app.post("/register", (req, res) => {

  //check if the password of the email is empty this is done through bootstrap ask if is OK?
  const { name, email, password, street, province, city, country , postal_code, phone} = req.body;
  // console.log(req.body);
  // const email = req.body.email;
  // console.log(email);
  // // const email = req.body.email;
  // console.log('126', email);
  // // const password = req.body.password;
  // console.log('129', password);
  // // const name = req.body.name;
  // console.log('131', name);
  // // const phone = req.body.phone;
  // console.log('133', phone);
  // // // const province = req.boby.province;
  // console.log('135', province);
  // // const city = req.body.city;
  // console.log('137', city);
  // // const country = req.body.country;
  // console.log('138', country);
  // // const street = req.body.street;
  // console.log('140', address1);
  // // const postal_code = req.body.postalCode;
  // console.log('142', postal_code);
  // const email = req.body.email;
  // const password = req.body.password;

  // if (password === "" || email === "") {
  //   return res.send('Email or Password cannot be left empty');
  // }
  //check if user is in the database
  const text = `SELECT * FROM users WHERE email = $1;`;
  db.query(text, [email])
    .then(data => {
      //if the querry results in an empty array it meas that there are no such email address in the database
      if (data.rows.length !== 0) {
        res.send('An user with this email already excists, please change email or login');
      } else {
        //create a new user id, name, email, phone, password
        const text = `INSERT INTO users ( name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *;`;
        const values = [name, email, phone, password];
        db.query(text, values)
          .then(data  => {
            console.log('!!!!!!!!!!!!!!!!!!!!!171!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
            //create a new address for the user id, users_id, province, city, country, street, postal_code)
            //const text1 = `INSERT INTO addresses (country, province, city, street, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
            //const values1 = [country, province, city, street, postal_code];
            db.query(`INSERT INTO addresses (country, province, city, street, postal_code) VALUES ('CA', 'ON', 'Toronto', '123', '120') RETURNING *`);
            console.log('!!!!!!!!!!!!!!!!!!!!!!174!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            req.session.userId = data.rows[0].id;
            req.session.name = data.rows[0].name;
            res.redirect('/');
          });
      }
    })
    .catch(err => {
      res
        .status(500)
        .json({ error: err.message });
    });

});
//////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////////////////
//logout rout
app.post('/logout', (req, res) => {
  delete req.session.userId;
  res.redirect('/');
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
