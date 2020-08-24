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
  return router;
};

//func to get user from form based on email
const getUserWithEmail = function(email) {
  return pool.query(`
  SELECT * FROM users
  WHERE email = $1;`,[email])
    .then(res => res.rows[0])
    .catch(e => {
      console.error(e);
    });
};
exports.getUserWithEmail = getUserWithEmail;

const login =  function(email, password) {
  return database.getUserWithEmail(email)
  .then(user => {
    if (password === user.password) {
      return user;
    }
    return null;
  });
};
exports.login = login;

router.post('/login', (req, res) => {
  const {email, password} = req.body;
  login(email, password)
    .then(user => {
      if (!user) {
        res.send({error: "error"});
        return;
      }
      req.session.userId = user.id;
      res.send({user: {name: user.name, email: user.email, id: user.id}});
    })
    .catch(e => res.send(e));
});
