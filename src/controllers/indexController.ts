import config from "@config";

export function getIndex(req, res) {
  if (!req.cookies.token) {
    return res.redirect('/login');
  }

  return res.redirect(config.defaultLoggedInRedirectUrl);
}
