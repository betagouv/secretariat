import config from "@config";
import BetaGouv from "@/betagouv";
import * as utils from "@controllers/utils";
import { addEvent, EventCode } from '@/lib/events'

export async function upgradeEmailForUser(req, res) {
    const { username } = req.params;
    const isCurrentUser = req.auth.id === username;

    if (!config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
        throw new Error(
            `Vous n'etes pas admin vous ne pouvez pas upgrade ce compte.`,
        );
    }

    try {
        const user = await utils.userInfos(username, isCurrentUser);

        if (!isCurrentUser && !user.isExpired) {
            throw new Error(
                `Le compte "${username}" n'est pas expiré, vous ne pouvez pas upgrade ce compte.`,
            );
        }

        await BetaGouv.sendInfoToChat(`Upgrade de compte de ${username} (à la demande de ${req.auth.id})`);
        addEvent(EventCode.MEMBER_EMAIL_UPGRADED, {
            created_by_username: req.auth.id,
            action_on_username: username
        })

        req.flash('message', `Le compte email de ${username} est en cours d'upgrade.`);
        res.redirect(`/community/${username}`);

    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/community/${username}`);
    }
}
