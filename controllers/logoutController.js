module.exports.get = function(req, res) {
  res.clearCookie('token').redirect('/login');
}
