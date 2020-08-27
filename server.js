// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const updateUrlQuery = require("./routes/helpers");
const sass = require("node-sass-middleware");//Angel

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
  socket.on('room', (room) => {
    console.log('room', room);
    socket.join(room);
    io.to(room).emit('hi');

  });

  socket.on('chat message', (msg) => {
    // console.log('message: ' + msg);
    //db.query insert into

    socket.broadcast.emit('new message', msg);

  });

});
//broadcast the msgs to all the connected clients (resending it bk)


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
      const sort = req.query.sort;
      console.log("printing Sort", sort);
      const cars = data.rows;
      console.log("printing cars", cars);
      const carsMakeToFilterBy = req.query.make;
      console.log("printing carsbyfil", carsMakeToFilterBy);
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
  if (!req.session.name) {
    res.status(403).send('<h1>Please make sure you are logged in! Click here to redirect back to  <a href= "/login" > the login page </a> or here to <a href= "/register" > register. </h1>');
  } else {
    res.render("message", { name: req.session.name });
  }

});
//new listing form route
app.get('/createNewListing', (req, res) => {
  res.render("createNewListing");
});

//myGarage
app.get('/myGarage', (req, res) => {
  //res.render("myGarage");
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
    console.log('here is the get for myGarage,',cars)
    //res.json({cars});
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
  console.log('here is the car id',req.body.carId)
  const currentUserId = req.session.userId;
  const carId = req.body.carId;
  console.log('here is the current car',carId);
  const infoArray = [currentUserId, carId];
  db.query(`
  SELECT * FROM favourites
  WHERE favourites.user_id = $1
  AND favourites.cars_id = $2; `, infoArray)
      .then(data => {
        const cars = data.rows;
        //res.json({cars});
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
  // taking the current user from the cookies
  // const currentUser = req.session.userId;
  // checking cookie data
  //const cookieData = req.session;
  const currentUser = req.session.userId;
  const body = req.body;
  const make = req.body.make;
  const model = req.body.model;
  const year = req.body.year;
  const mileage = req.body.mileage;
  const price = req.body.price;
  //const email = req.body.email;
  // const country = req.body.country;
  const vehicleInformation = [make, model, year, mileage, price, currentUser];
  // const sqlQuery = `INSERT INTO cars (id, make, model, year, mileage, price, image_url, owner_id)
  // VALUES (13,$1, $2, $3, $4, $5, 'someURL',2) ;`
  db.query(`INSERT INTO cars (make, model, year, mileage, price, image_url, availability, owner_id)
  VALUES ($1, $2, $3, $4, $5, 'someURL', 'true', $6);
  `, vehicleInformation)
    .then(data => {
      console.log('console log from newlisting post request',data);
      console.log('Here is the req.body', body);
      console.log('Here is the make', make);
      console.log('Here is the model', model);
      console.log('Here is the year', year);
      console.log('Here is the mileage', mileage);
      console.log('Here is the price', price);
      // console.log('Here is the country', country);
      console.log('cookie data:', currentUser);
      // return db.query(`INSERT INTO addresses (province, city, country, street, postal_code)
      // VALUES ('Ontario', 'Toronto', $1, 'Brimorton', '1a1 241');`,[country])
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
  console.log('here is the car id',req.body.carId)
  const currentUserId = req.session.userId;
  const carId = req.body.carId;
  console.log('here is the current car',carId);
  const infoArray = [currentUserId, carId];
  db.query(`
  SELECT * FROM cars
  WHERE cars.owner_id = $1
  AND cars.availability = true; `, [currentUserId])
      .then(data => {
        const cars = data.rows;
        //res.json({cars});
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


///////////////////////////////////// THIS IS TO BE PUTED ON SEPERATE FOLDER /////////////////////////////////////

http.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
