const express = require('express');
const router  = express.Router();




module.exports = (db) => {
  //login form

  router.get("/", (req, res) => {
    db.query(`SELECT * FROM users WHERE email = 'Angelho221@gmail.com'
     `)
      .then(data => {
        const users = data.rows;
        console.log('print', users);
        res.json({ users });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });


  // router.post('/', (req, res) => {
  //   console.log('printThis!!!!!');
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
  return router;
};
