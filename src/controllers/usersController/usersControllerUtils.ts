import crypto from "crypto";
import config from "@config";
import * as utils from "@controllers/utils";
import knex from "@/db/index";
import { DBUser, EmailStatusCode, USER_EVENT } from "@/models/dbUser/dbUser";
import { EMAIL_TYPES } from "@/modules/email";
import { sendEmail } from "@/config/email.config";
import EventBus from "@/infra/eventBus/eventBus";

export async function setEmailActive(username) {
    const [user]: DBUser[] = await knex('users').where({
        username,
    })
const shouldSendEmailCreatedEmail = user.primary_email_status === EmailStatusCode.EMAIL_CREATION_PENDING || user.primary_email_status === EmailStatusCode.EMAIL_RECREATION_PENDING
    await knex('users').where({
        username,
    }).update({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        primary_email_status_updated_at: new Date()
    })
    await knex('user_details').where({
        hash: utils.computeHash(username)
    }).update({
        active: true
    })
    console.log(
        `Email actif pour ${user.username}`,
    );
    if (shouldSendEmailCreatedEmail) {
        await sendEmailCreatedEmail(username)
    }
    EventBus.produce(USER_EVENT.USER_EMAIL_ACTIVATED, { user_id: user.username })
}

export async function setEmailSuspended(username) {
    const [user]: DBUser[] = await knex('users').where({
        username,
    }).update({
        primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
        primary_email_status_updated_at: new Date()
    }).returning('*')
    console.log(
        `Email suspendu pour ${user.username}`,
    );
}

export async function sendEmailCreatedEmail(username) {
    const [user]: DBUser[] = await knex('users').where({
        username,
    })
    const secretariatUrl = `${config.protocol}://${config.host}`;

    try {
        await sendEmail({
            type: EMAIL_TYPES.EMAIL_CREATED_EMAIL,
            toEmail: [user.secondary_email],
            variables: {
                email: user.primary_email,
                secondaryEmail: user.secondary_email,
                secretariatUrl,
                mattermostInvitationLink: config.mattermostInvitationLink,
            }
        })
        console.log(
            `Email de bienvenue pour ${user.username} envoyé`,
        );
    } catch (err) {
        throw new Error(`Erreur d'envoi de mail à l'adresse indiqué ${err}`);
    }
}

export function createBranchName(username) {
    const refRegex = /( |\.|\\|~|^|:|\?|\*|\[)/gm;
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `author${username.replace(refRegex, '-')}-update-end-date-${randomSuffix}`;
}

export async function updateAuthorGithubFile(username, changes) {
    const branch = createBranchName(username);
    const path = `content/_authors/${username}.md`;
    console.log(`Début de la mise à jour de la fiche pour ${username}...`);

    await utils.getGithubMasterSha()
        .then((response) => {
            const { sha } = response.data.object;
            console.log('SHA du master obtenu');
            return utils.createGithubBranch(sha, branch);
        })
        .then(() => {
            console.log(`Branche ${branch} créée`);
            return utils.getGithubFile(path, branch);
        })
        .then((res) => {
            const yaml = require('js-yaml');
            let content = Buffer.from(res.data.content, 'base64').toString('utf-8');
            const [doc, doc1] = yaml.loadAll(content)
            for (const key in Object.keys(changes)) {
                doc[key] = changes[key]
            }
            content = '---\n' + yaml.dump(doc) + '\n---\n' + yaml.dump(doc1)
            return utils.createGithubFile(path, branch, content, res.data.sha);
        })
        .then(() => {
            console.log(`Fiche Github pour ${username} mise à jour dans la branche ${branch}`);
            return utils.makeGithubPullRequest(branch, `Mise à jour de la date de fin pour ${username}`);
        })
        .then(() => {
            console.log(`Pull request pour la mise à jour de la fiche de ${username} ouverte`);
        })
        .catch((err) => {
            console.log(err);
            throw new Error(`Erreur Github lors de la mise à jour de la fiche de ${username}`);
        });
}
