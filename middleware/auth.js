const db = require('../config/database');

const authMiddleware = (req, res, next) => {
  if (req.session && req.session.userId) {
    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      if (err || !user) {
        return res.redirect('/poppis-console/login');
      }
      req.user = user;
      next();
    });
  } else {
    res.redirect('/poppis-console/login');
  }
};

module.exports = authMiddleware;
