import * as utils from "@controllers/utils";
import { MemberWithPermission } from "@/models/member";
import db from "@/db";
import config from "@/config";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";

export async function getUserInfo(req, res) {
    const { username } = req.params;
    const isCurrentUser = req.auth ? req.auth.id === username : false;
    
    try {
        const [user] : [MemberWithPermission] = await Promise.all([
            utils.userInfos(username, isCurrentUser),
        ]);
    
        const hasGithubFile = user.userInfos;
        const hasEmailAddress = (user.emailInfos || user.redirections.length > 0);
        if (!hasGithubFile && !hasEmailAddress) {
            res.status(500).json({
                error: 'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.'
            });
        }
    
        const dbUser = await db('users').where({ username }).first()
        const secondaryEmail = dbUser ? dbUser.secondary_email : '';
        res.json({
            username,
            currentUserId: req.auth ? req.auth.id : undefined,
            emailInfos: user.emailInfos,
            userInfos: user.userInfos,
            isExpired: user.isExpired,
            primaryEmail: dbUser ? dbUser.primary_email : '',
            primaryEmailStatus: dbUser ? EMAIL_STATUS_READABLE_FORMAT[dbUser.primary_email_status] : '',
            canCreateEmail: user.canCreateEmail,
            hasPublicServiceEmail: dbUser && dbUser.primary_email && !dbUser.primary_email.includes(config.domain),
            domain: config.domain,
            secondaryEmail,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Impossible de récupérer les informations du membre de la communauté.'
        });
    }
}
  
