import config from "@config";
import BetaGouv from "@/betagouv";
import * as utils from "@controllers/utils";
import knex from "@/db/index";
import { addEvent, EventCode } from '@/lib/events'

export async function deleteEmailForUser(req, res) {
    const { username } = req.params;
    const isCurrentUser = req.auth.id === username;

    try {
        const user = await utils.userInfos(username, isCurrentUser);

        if (!isCurrentUser && !user.isExpired) {
            throw new Error(
                `Le compte "${username}" n'est pas expiré, vous ne pouvez pas supprimer ce compte.`,
            );
        }

        await BetaGouv.sendInfoToChat(`Suppression de compte de ${username} (à la demande de ${req.auth.id})`);
        addEvent(EventCode.MEMBER_EMAIL_DELETED, {
            created_by_username: req.auth.id,
            action_on_username: username
        })
        if (user.redirections && user.redirections.length > 0) {
            await BetaGouv.requestRedirections('DELETE', user.redirections.map((x) => x.id));
            console.log(`Suppression des redirections de l'email de ${username} (à la demande de ${req.auth.id})`);
        }

        await BetaGouv.createRedirection(utils.buildBetaEmail(username), config.leavesEmail, false);
        await knex('users')
            .update({ secondary_email: null })
            .where({ username });
        console.log(`Redirection des emails de ${username} vers ${config.leavesEmail} (à la demande de ${req.auth.id})`);

        if (isCurrentUser) {
            res.clearCookie('token');
            req.flash('message', 'Ton compte email a bien été supprimé.');
            res.redirect('/login');
        } else {
            req.flash('message', `Le compte email de ${username} a bien été supprimé.`);
            res.redirect(`/community/${username}`);
        }
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/community/${username}`);
    }
}
