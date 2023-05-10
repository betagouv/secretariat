export function getLogout(req, res) {
  req.session.destroy(err => {
      if (err) {
          return console.log(err);
      }
      res.clearCookie('token').redirect('/login');
  });
}
