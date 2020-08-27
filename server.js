// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const updateUrlQuery = require("./routes/helpers");
const sass = require("node-sass-middleware");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const morgan = require('morgan');
const path = require('path');

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
  prefix: '/styles'
}));

app.use(express.static(path.join(__dirname, "public")));

//broadcast the msgs to all the connected clients (resending it bk)
io.on('connection', socket => {
  console.log('A new user connected');
  socket.on('room', (room) => {
    socket.join(room);
    io.to(room).emit('hi');
  });

  socket.on('chat message', (msg) => {
    socket.broadcast.emit('new message', msg);
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
  db.query(`
  SELECT * FROM cars
  WHERE availability = 'true';
  `)
    .then(data => {
      console.log('here is the mai page data:',data)
      const cars = data.rows;
      const sort = req.query.sort;
      const carsMakeToFilterBy = req.query.make;
      let selectCars = cars.filter(car => !carsMakeToFilterBy || car.make === carsMakeToFilterBy);
      if (sort) {
        selectCars = selectCars.sort((a,b) => {
          return Number(sort) * (a.price - b.price);
        });
      }
      res.render('index', { cars: cars, selectCars: selectCars, name: req.session.name, selected: carsMakeToFilterBy, updateUrlQuery, url: req.url });
    })
    .catch(err => {
      res
        .status(500)
        .json({ error: err.message });
    });
});



//login form route
app.get('/login', (req, res) => {
  res.render("login", { name: req.session.name});
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
      } else if (bcrypt.compareSync(password, data.rows[0].password)) {
        req.session.userId = data.rows[0].id;
        req.session.name = data.rows[0].name;//put the name in the header
        res.redirect('/');
      } else {
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
  const { name, email, street, province, city, country , postal_code, phone} = req.body;
  const password = bcrypt.hashSync(req.body.password, salt)
  const text = `SELECT * FROM users WHERE email = $1;`;
  db.query(text, [email])
    .then(data => {
      //if the querry results in an empty array it meas that there are no such email address in the database
      if (data.rows.length !== 0) {
        res.send('An user with this email already excists, please change email or login');
      } else {
        //create a new user
        const text = `INSERT INTO users ( name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *;`;
        const values = [name, email, phone, password];
        db.query(text, values)
          .then(data  => {
            //create a new address
            const users_id = data.rows[0].id;
            const text1 = `INSERT INTO addresses (users_id, province, city, country, street, postal_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
            const values1 = [users_id, province, city, country, street, postal_code];
            return db.query(text1, values1);
          }).then(data => {
            req.session.userId = data.rows[0].id;
            req.session.name = data.rows[0].name;
            res.redirect('/login');
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
  res.render("register", { name: req.session.name});
});


//message form route
app.get('/message', function(req, res) {
  if (!req.session.name) {
    res.status(403).send('<h1>Please make sure you are logged in! Click here to redirect back to  <a href= "/login" > the login page </a> or here to <a href= "/register" > register. </h1>');
  } else {
    res.render("message", { name: req.session.name });
  }
});
//new listing form route
app.get('/createNewListing', (req, res) => {
  res.render("createNewListing", { name: req.session.name});
});

//myGarage
app.get('/myGarage', (req, res) => {
  const currentUserId = req.session.userId;
  const queryValues = [currentUserId];
  db.query(`
  SELECT cars.id, make, year, model, mileage, description
  FROM cars
  JOIN favourites ON cars.id = favourites.cars_id
  WHERE favourites.user_id = $1 AND favourites.favourite = 'true';
  `, queryValues)
  .then(data => {
    const cars = data.rows;
    res.render('myGarage', { cars: data.rows, name: req.session.name});
  })
  .catch(err => {
    res
      .status(500)
      .json({ error: err.message });
  });
});

// post request for favourites
app.post('/myFavourite', (req, res) => {
  const currentUserId = req.session.userId;
  const carId = req.body.carId;
  const infoArray = [currentUserId, carId];
  db.query(`
  SELECT * FROM favourites
  WHERE favourites.user_id = $1
  AND favourites.cars_id = $2; `, infoArray)
      .then(data => {
        const cars = data.rows;
        if (data.rows.length) {
          return db.query(`UPDATE favourites SET favourite = $1 WHERE id = $2;`,[!data.rows[0].favourite, data.rows[0].id])
        } else {
          return db.query(`
          INSERT INTO favourites (user_id, cars_id, favourite)
          VALUES ($1, $2, true)
          `, infoArray)
        }
      })
        .then(data => {
          res.redirect('/myGarage')
        })
});

//post request for new listing form
app.post('/createNewListing', (req, res) => {
  const currentUser = req.session.userId;
  const body = req.body;
  const make = req.body.make;
  const model = req.body.model;
  const year = req.body.year;
  const mileage = req.body.mileage;
  const price = req.body.price;
  const description = req.body.description;
  const vehicleInformation = [year, make, model, mileage, price, currentUser, description];
  db.query(`INSERT INTO cars (year, make, model, mileage, price, image_url, availability, owner_id, description)
  VALUES ($1, $2, $3, $4, $5, 'someURL', 'true', $6, $7);
  `, vehicleInformation)
    .then(data => {
      res.redirect('/');
    })
    .catch(err => {
      res
      .status(500)
      .json({ error: err.message });
      });
});

// post request for removing listing
app.post('/removeListing', (req, res) => {
  const currentUserId = req.session.userId;
  const carId = req.body.carId;
  const infoArray = [currentUserId, carId];
  db.query(`
  SELECT * FROM cars
  WHERE cars.owner_id = $1
  AND cars.availability = true; `, [currentUserId])
      .then(data => {
        const cars = data.rows;

        if (data.rows.length) {
          return db.query(`UPDATE cars SET availability = $1 WHERE id = $2;`,[!data.rows[0].availability, data.rows[0].id])
        }
      })
        .then(data => {
          res.redirect('/')
        })

      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
});

http.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
