const config = require('../config');

module.exports.getIndex = function (req, res) {
  if (!req.cookies.token) {
    return res.redirect('/login');
  }

  res.redirect(config.defaultLoggedInRedirectUrl);
}
