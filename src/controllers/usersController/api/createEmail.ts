import { createEmailAndUpdateSecondaryEmail } from "../createEmailForUser";

export async function createEmailApi(req, res) {
    const username = req.sanitize(req.params.username);
    const email = req.sanitize(req.body.to_email);
    try {
        createEmailAndUpdateSecondaryEmail({ username, email}, req.auth.id)
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
  
