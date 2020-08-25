
const express = require('express');
const router  = express.Router();

module.exports = (db) => {
  router.get("/", (req, res) => {
    db.query(`SELECT * FROM cars;`)
      .then(data => {
        const cars = data.rows;
        //res.json({cars});
        res.render('index', { cars: data.rows});
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  return router;
};
