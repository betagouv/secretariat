import { createEmailAndUpdateSecondaryEmail } from "../createEmailForUser";

export async function createEmailApi(req, res) {
    const username = req.sanitize(req.params.username);
    const isCurrentUser = req.auth.id === username;
    try {
        createEmailAndUpdateSecondaryEmail(username, isCurrentUser)
        req.flash('message', 'Le compte email a bien été créé.');
        res.json({
            status: 'created'
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({
            errors: err
        })
    }
}
  
