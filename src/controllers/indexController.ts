import config from "@config";

export function getIndex(req, res) {
  if (!req.auth) {
    return res.redirect('/login');
  }

  return res.redirect(config.defaultLoggedInRedirectUrl);
}
