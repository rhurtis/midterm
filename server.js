// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
<<<<<<< eeadadedb5a8b848f832aeb0036d7d7e3f61954f
const updateUrlQuery = require("./routes/helpers");

// const sass = require("node-sass-middleware");
=======
const sass = require("node-sass-middleware");
>>>>>>> revised users seeds, added app.js for messenger app and revised server.js to connect wtih css
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
    //db.query insert into
    socket.broadcast.emit('new message', msg);
    // console.log('message: ' + msg);
    //id of the user cookies
    //seller id
    //id of the car
  });
<<<<<<< eeadadedb5a8b848f832aeb0036d7d7e3f61954f
});
=======
})
//broadcast the msgs to all the connected clients (resending it bk)
>>>>>>> revised users seeds, added app.js for messenger app and revised server.js to connect wtih css

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
      const sort = req.query.sort;

      const cars = data.rows;
      const carsMakeToFilterBy = req.query.make;
      let selectCars = cars.filter(car => !carsMakeToFilterBy || car.make === carsMakeToFilterBy);
      if(sort) {
        selectCars = selectCars.sort((a,b) => {
          return Number(sort) * (a.price - b.price);
          })
      }
      res.render('index', { cars: cars, selectCars: selectCars, name: req.session.name, selected: carsMakeToFilterBy, updateUrlQuery, url: req.url });
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
            console.log(data);
            //create a new address for the user id, users_id, province, city, country, street, postal_code)
            const id = data.rows[0].id;
            const text1 = `INSERT INTO addresses (users_id, country, province, city, street, postal_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
            const values1 = [id, country, province, city, street, postal_code];
            return db.query(text1, values1);

          }).then(data => {
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

//logout rout
app.post('/logout', (req, res) => {
  req.session.userId = null;
  req.session.name = null;
  res.redirect('/');
});

/////////////////////////////

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
  //if req.session.name exists
  //else res.send(pls login or redirect)
  res.render("message", { name: req.session.name });
})

//new listing form route
app.get('/createNewListing', (req, res) => {
  res.render("createNewListing");
});
///////////////////////////////////// THIS IS TO BE PUTED ON SEPERATE FOLDER /////////////////////////////////////

http.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
