export async function getCurrentUser(req, res) {
  return res.json({
    user: req.auth && req.auth.id,
  });
}
