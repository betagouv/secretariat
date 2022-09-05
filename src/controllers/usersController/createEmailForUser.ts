import crypto from "crypto"
import config from "@config";
import BetaGouv from "@/betagouv";
import * as utils from "@controllers/utils";
import knex from "@/db/index";
import { MemberWithPermission } from "@models/member";
import { DBUser, EmailStatusCode } from "@models/dbUser";
import { addEvent, EventCode } from "@/lib/events";


export async function createEmailForUser(req, res) {
    const username = req.sanitize(req.params.username);
    const isCurrentUser = req.auth.id === username;

    try {
        const [user, dbUser]: [MemberWithPermission, DBUser] = await Promise.all([
            utils.userInfos(username, isCurrentUser),
            knex('users').where({ username }).first()
        ]);

        if (!user.userInfos) {
            throw new Error(
                `Le membre ${username} n'a pas de fiche sur Github : vous ne pouvez pas créer son compte email.`,
            );
        }

        if (user.isExpired) {
            throw new Error(
                `Le compte du membre ${username} est expiré.`,
            );
        }

        if (!user.canCreateEmail) {
            throw new Error('Vous n\'avez pas le droit de créer le compte email du membre.');
        }

        const hasPublicServiceEmail = dbUser && dbUser.primary_email && !dbUser.primary_email.includes(config.domain)
        if (hasPublicServiceEmail) {
            throw new Error(`Le membre a déjà un email principal autre que ${config.domain}`);
        }

        if (!isCurrentUser) {
            const loggedUserInfo = await BetaGouv.userInfosById(req.auth.id);
            if (utils.checkUserIsExpired(loggedUserInfo)) {
                throw new Error('Vous ne pouvez pas créer le compte email car votre compte a une date de fin expiré sur Github.');
            }
        }
        if (dbUser) {
            await updateSecondaryEmail(username, req.body.to_email)
        } else {
            await knex('users').insert({
                username,
                primary_email_status: EmailStatusCode.EMAIL_UNSET,
                secondary_email: req.body.to_email
            })
        }
        await createEmail(username, req.auth.id);

        req.flash('message', 'Le compte email a bien été créé.');
        res.redirect(`/community/${username}`);
    } catch (err) {
        console.error(err);

        req.flash('error', err.message);
        res.redirect('/community');
    }
}

export async function createEmail(username, creator) {
    const email = utils.buildBetaEmail(username);
    const password = crypto.randomBytes(16)
        .toString('base64')
        .slice(0, -2);

    const secretariatUrl = `${config.protocol}://${config.host}`;

    const message = `À la demande de ${creator} sur <${secretariatUrl}>, je crée un compte mail pour ${username}`;

    await BetaGouv.sendInfoToChat(message);
    await BetaGouv.createEmail(username, password);
    await knex('users').where({
        username,
    }).update({
        primary_email: email,
        primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING,
        primary_email_status_updated_at: new Date()
    })

    addEvent(EventCode.MEMBER_EMAIL_CREATED, {
        created_by_username: creator,
        action_on_username: username,
        action_metadata: {
            value: email
        }
    })
    console.log(
        `Création de compte by=${creator}&email=${email}`,
    );
}

export async function updateSecondaryEmail(username, secondary_email) {
    return knex('users').where({
        username
    }).update({
        secondary_email
    })
}