module.exports.getIndex = function (req, res) {
  if (!req.cookies.token) {
    return res.redirect('/login');
  }

  res.redirect('/users');
};
