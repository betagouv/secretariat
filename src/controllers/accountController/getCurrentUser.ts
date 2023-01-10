export async function getCurrentUser(req, res) {
    console.log('LCS AUTH', req.auth)
    return res.json({
        user: req.auth && req.auth.id
    })
}