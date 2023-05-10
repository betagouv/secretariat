export function getLogout(req, res) {
  req.session.destroy(err => {
      if (err) {
          return console.log(err);
      }
      res.redirect("/login")
  });
  // res.clearCookie('token').redirect('/login');
}
