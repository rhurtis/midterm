/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const bcrypt = require('bcrypt');
const express = require('express');
const router  = express.Router();



module.exports = (db) => {
  router.get("/", (req, res) => {
    db.query(`SELECT * FROM users`)
      .then(data => {
        const users = data.rows;
        res.json({ users });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });


  // //login form
  // router.post('/login', (req, res) => {
  //   console.log('31');
  //   const {email, password} = req.body;
  //   db.query(`SELECT * FROM users
  //     WHERE email = $1;`, [email])
  //     .then(data => {
  //       if (password === data.rows[0].password) {
  //         req.session.userId = data.id;
  //         res.redirect("/");
  //       } else {
  //         res.send({error: "error"});
  //         return;
  //       }
  //     })
  //     .catch(err => {
  //       res
  //         .status(500)
  //         .json({ error: err.message });
  //     });
  // });

  // Create a new user
  // id, name, email, phone, password
  // router.post('/register ', (req, res) => {
  //   //const user = req.body;
  //   const {id, name, email, phone, password} = req.body;
  //   // user.password = bcrypt.hashSync(user.password);
  //   const text = 'INSERT INTO users(name, email, phone, password) VALUES($1, $2, $3, $4, $5) RETURNING *';
  //   db.query(text, [ id, name, email, phone, password])
  //     .then(user => {
  //       if (!user) {
  //         res.send({error: "error"});
  //         return;
  //       }
  //       req.session.userId = user.id;
  //       res.redirect('/');
  //     })
  //     .catch(e => res.send(e));
  // });


  //log out
  router.post('/logout', (req, res) => {
    delete req.session.userId;
    res.redirect("/urls");
  });

  return router;
};

//func to get user from form based on email






