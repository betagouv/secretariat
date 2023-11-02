export async function getCurrentUser(req, res) {
  return res.json({
    user: {
      name: req.auth && req.auth.id,
    },
  });
}
