// load .env data into process.env
require('dotenv').config();

// Web server config
const PORT = process.env.PORT || 8080;
const ENV = process.env.ENV || "development";
const express = require("express");
const bodyParser = require("body-parser");
// const sass = require("node-sass-middleware");
const app = express();
const morgan = require('morgan');
const path = require('path');
const http = require('http').createServer(app)



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
})

// Separated Routes for each Resource
// Note: Feel free to replace the example routes below with your own
const usersRoutes = require("./routes/users");
const widgetsRoutes = require("./routes/widgets");
const messagesRoutes = require("./routes/messages")

// Mount all resource routes
// Note: Feel free to replace the example routes below with your own
app.use("/api/users", usersRoutes(db));
app.use("/api/widgets", widgetsRoutes(db));
app.use("/api/messages", messagesRoutes(db));
// Note: mount other resources here, using the same pattern above


// Home page
// Warning: avoid creating more routes in this file!
// Separate them into separate routes files (see above).
app.get("/", (req, res) => {
  res.render("index");
});


///////////////////////////////////// THIS IS TO BE PUTED ON SEPERATE FOLDER /////////////////////////////////////

//login form route
app.get('/login', (req, res) => {
  res.render("login");
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
