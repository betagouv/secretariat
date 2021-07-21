export function getLogout(req, res) {
  res.clearCookie('token').redirect('/login');
}
