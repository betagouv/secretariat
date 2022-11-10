import { MattermostUser } from "@/lib/mattermost";
import { DBUser, EmailStatusCode } from "@/models/dbUser/dbUser";
import { Member } from "@/models/member";
import knex from "@/db";
import config from '@config';
import * as utils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';
import betagouv from "@/betagouv";
import { sendInfoToChat } from "@/infra/chat";
import axios from "axios";

function validateAtLeastOneFormat(regexStrArr: string[], value) {
    let valid: boolean = false;
    for (const regexStr of regexStrArr) {
        const regex = new RegExp(regexStr, "i");
        if (regex.test(value)) {
            valid = true
            break;
        }
    }
    return valid
}

interface UsersToRemoveProps {
    optionalUsers? : Member[],
    nbDays: number,
    checkAll?: boolean
}

enum MattermostUserStatus {
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO = "USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO",
    USER_HAS_ACTIVE_PRIMARY_EMAIL = "USER_HAS_ACTIVE_PRIMARY_EMAIL",
    USER_IS_PARTNER_BUT_IS_EXPIRED = "USER_IS_PARTNER_BUT_IS_EXPIRED",
    USER_IS_NOT_VALID = "USER_IS_NOT_VALID",
    USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED = "USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED",
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO = "USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO",
    USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL = "USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL",
    USER_IS_VALID_WITH_DOMAIN = "USER_IS_VALID_WITH_DOMAIN",
    USER_IS_VALID_WITH_PARTNER = "USER_IS_VALID_WITH_PARTNER",
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO = "USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO",
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED = "USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED",
    USER_HAS_PRIMARY_EMAIL_BUT_IS_SUSPENDED = "USER_HAS_PRIMARY_EMAIL_BUT_IS_SUSPENDED",
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_SUSPENDED = "USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_SUSPENDED",
    USER_HAS_SUSPENDED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO = "USER_HAS_SUSPENDED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO"
}

type MattermostUserWithStatus = MattermostUser & {
    status: MattermostUserStatus,
    memberInfo?: Member,
    dbUser?: DBUser
}

const MESSAGE_FOR_TYPE : Record<MattermostUserStatus, (user: MattermostUserWithStatus) => string> = {
    USER_IS_NOT_VALID: (user: MattermostUserWithStatus) => `Bonjour ${user.first_name},
        Tu reçois ce message car ton email n'a pas un domaine valide pour accèder à l'espace Communauté de mattermost.
        Les emails valides sont ceux en @beta.gouv.fr, d'etalab et des services publics en général ainsi que ceux des attributaires.
        
        - Si tu as ce genre d'email c'est celui-ci que tu dois utiliser comme email pour avoir accès a cet espace.
        - Si tu n'as pas ce genre d'email mais que tu fais toujours parti de la communauté (tu es dans une startup, tu travailles en transverse), il faut que tu crée une fiche membre sur https://espace-membre.incubateur.net/onboarding.
        
        Si tu n'es effectivement plus dans la communauté, ton compte sera retirer de l'espace Communauté (mais pas des autres espaces) d'ici 2 semaines.
        
        Si tu as des questions ou que tu penses qu'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
        Ceci est un message automatique envoyé par l'app Espace Membre.
    `,
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_IS_PARTNER_BUT_IS_EXPIRED: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin dépassée sur github.

Si c'est normal tu n'as rien a faire et ton compte mattermost sera retiré de l'espace "Communauté" dans 1 mois. 
Sinon il faudrait la mettre à jour : [ici](https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${user.memberInfo.id}.md)

Si tu n'y arrives pas un membre de ton équipe pourra sans doute t'aider.

Sinon n'hésite pas à poser tes questions sur Mattermost dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help) ou à répondre [par email à espace-membre@incubateur.net](mailto:espace-membre@incubateur.net).

Ceci est un message automatique envoyé par l'app Espace Membre.
    
`;
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_SUSPENDED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin à jour, mais l'email lié a ton compte mattermost semble supprimé.
Tu peux le recréer dans l'[espace membre](https://espace-membre.incubateur.net/) auquel tu peux te connecter avec ton adresse secondaire : ${user.dbUser.secondary_email}.
Dans Mon compte > Mon email.
Si tu as des questions tu peux les poser dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help). S'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
Ceci est un message automatique envoyé par l'app Espace Membre
    `;
    },
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin à jour, mais l'email lié a ton compte mattermost semble supprimé.
Tu peux le recréer dans l'[espace membre](https://espace-membre.incubateur.net/account) sur la page Mon compte > Mon Email.
Tu peux te connecter à l'espace membre avec ton adresse secondaire : ${user.dbUser.secondary_email}.

Si tu as des questions tu peux les poser dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help). S'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
Ceci est un message automatique envoyé par l'app Espace Membre
    `;
    },
    USER_HAS_SUSPENDED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin à jour, mais l'email lié a ton compte mattermost semble suspendu.
Tu peux le reactiver dans l'[espace membre](https://espace-membre.incubateur.net/) auquel tu peux te connecter avec ton adresse secondaire : ${user.dbUser.secondary_email}.
Il te suffit ensuite de mettre à jour ton mot de passe pour le réactiver : https://espace-membre.incubateur.net/account#password>

Si tu as des questions tu peux les poser dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help). S'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
Ceci est un message automatique envoyé par l'app Espace Membre.
    `;
    },
    USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_IS_VALID_WITH_DOMAIN: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_IS_VALID_WITH_PARTNER: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin dépassée sur github.

Si c'est normal tu n'as rien a faire et ton compte mattermost sera retiré de l'espace "Communauté" dans 1 mois. 
Sinon il faudrait la mettre à jour : [ici](https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${user.memberInfo.id}.md)
Et merger la pull request.

Si tu n'y arrives pas un membre de ton équipe pourra sans doute t'aider.

Sinon n'hésite pas à poser tes questions sur Mattermost dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help) ou à répondre [par email à espace-membre@incubateur.net](mailto:espace-membre@incubateur.net).

Ceci est un message automatique envoyé par l'app Espace Membre.
    
`;
    },
    USER_HAS_PRIMARY_EMAIL_BUT_IS_SUSPENDED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin dépassée sur github.

Si c'est normal tu n'as rien a faire et ton compte mattermost sera retiré de l'espace "Communauté" dans 1 mois. 
Sinon il faudrait la mettre à jour : [ici](https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${user.memberInfo.id}.md)
Et merger la pull request.

Si tu n'y arrives pas un membre de ton équipe pourra sans doute t'aider.

Sinon n'hésite pas à poser tes questions sur Mattermost dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help) ou à répondre [par email à espace-membre@incubateur.net](mailto:espace-membre@incubateur.net).

Ceci est un message automatique envoyé par l'app Espace Membre.
    
`;
    }
}

export async function getMattermostUsersWithStatus({
    nbDays
}) : Promise<MattermostUserWithStatus[]> {
    // Removed users referenced on github but expired for more than 3 months

    // Members in authors.json
    let users = await betagouv.usersInfos()
    // Member in db
    const dbUsers : DBUser[] = await knex('users')
    const dbuser_primary_emails : string[] = dbUsers
        .map(dbUser => dbUser.primary_email)
        .filter(email => email)
    const dbuser_not_active_primary_emails : string[] = dbUsers
        .filter(dbUser => dbUser.primary_email_status !== EmailStatusCode.EMAIL_ACTIVE)
        .map(dbUser => dbUser.primary_email)
        .filter(email => email)
    
    // Parners
    const partnersUserEmails : string[] = await getPartnersUserEmails({ nbDays })
    const inactivePartnersUserEmails : string[] = await getPartnersActiveUserEmails({ nbDays })

    const mattermostUsers : MattermostUser[] = await mattermost.getActiveMattermostUsers({
        in_team: config.mattermostTeamId
    })

    const mattermostEmailRegexException : string[] = config.MATTERMOST_EMAIL_REGEX_EXCEPTION ? config.MATTERMOST_EMAIL_REGEX_EXCEPTION.split(',') : []
    const mattermostUsersToRemove : MattermostUserWithStatus[] = mattermostUsers.map(mUser => {
        let status
        let memberInfo
        let dbUser
        if (dbuser_primary_emails.includes(mUser.email)) {
            if (dbuser_not_active_primary_emails.includes(mUser.email)) {
                dbUser = dbUsers.find(dbUser => dbUser.primary_email === mUser.email)
                memberInfo = users.find(user => user.id === dbUser.username)
                if (!memberInfo) {
                    status = MattermostUserStatus.USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO
                } else if (utils.checkUserIsExpired(memberInfo)) {
                    if (dbUser.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED) {
                        status = MattermostUserStatus.USER_HAS_PRIMARY_EMAIL_BUT_IS_SUSPENDED
                    } else {
                        status = MattermostUserStatus.USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED
                    }
                } else {
                    if (dbUser.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED) {
                        status = MattermostUserStatus.USER_HAS_SUSPENDED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO
                    } else {
                        status = MattermostUserStatus.USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO
                    }
                }
            
            } else {
                dbUser = dbUsers.find(dbUser => dbUser.primary_email === mUser.email)
                memberInfo = users.find(user => user.id === dbUser.username)
                if (!memberInfo) {
                    status = MattermostUserStatus.USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO
                } else if (utils.checkUserIsExpired(memberInfo)) {
                    if (dbUser.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED) {
                        status = MattermostUserStatus.USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_SUSPENDED
                    } else {
                        status = MattermostUserStatus.USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED
                    }
                } else {
                    status = MattermostUserStatus.USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL
                }
            }
        } else if (partnersUserEmails.includes(mUser.email)) {
            if (inactivePartnersUserEmails.includes(mUser.email)) {
                status = MattermostUserStatus.USER_IS_PARTNER_BUT_IS_EXPIRED
            } else {
                status = MattermostUserStatus.USER_IS_VALID_WITH_PARTNER
            }
        } else if (validateAtLeastOneFormat(mattermostEmailRegexException, mUser.email)) {
            status = MattermostUserStatus.USER_IS_VALID_WITH_DOMAIN
        } else {
            status = MattermostUserStatus.USER_IS_NOT_VALID
        }
        return {
            ...mUser,
            memberInfo,
            dbUser,
            status
        }
    })
    return mattermostUsersToRemove
}

const MATTERMOST_ACTIVE_STATUS = [
    MattermostUserStatus.USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL,
    MattermostUserStatus.USER_IS_VALID_WITH_DOMAIN,
    MattermostUserStatus.USER_IS_VALID_WITH_PARTNER
]

export async function getInvalidBetaAndParnersUsersFromCommunityTeam({
    nbDays
} : UsersToRemoveProps) : Promise<MattermostUserWithStatus[]> {
    // Removed users referenced on github but expired for more than 3 months
    const mattermostUsersWithStatus = await getMattermostUsersWithStatus({ nbDays })
    const invalidUsers = mattermostUsersWithStatus.filter(m => !MATTERMOST_ACTIVE_STATUS.includes(m.status))
    console.log(`Mattermost user to remove from communauté ${JSON.stringify(invalidUsers)}`)

    return invalidUsers
}

export async function sendReminderToUserAtDays({
    optionalUsers,
    nbDays
}: UsersToRemoveProps) {
    const usersToSendAMessageTo : MattermostUserWithStatus[] = await getInvalidBetaAndParnersUsersFromCommunityTeam({
        optionalUsers,
        nbDays
    })

    for (const user of usersToSendAMessageTo) {
        try {
            await sendInfoToChat({
                username: user.username,
                text: MESSAGE_FOR_TYPE[user.status](user)
            })
            console.log(`Message envoyé à ${user.username}`)
        } catch(e) {
            console.log(`Erreur d'envoi à ${user.username}`)
            console.error(e)
        }
    }
}

export async function removeBetaAndParnersUsersFromCommunityTeam() {
    // Removed users referenced on github but expired for more than 3 months

    let usersToDelete : MattermostUserWithStatus[] = await getInvalidBetaAndParnersUsersFromCommunityTeam({
        nbDays: 3*30
    })

    usersToDelete = usersToDelete.filter(user => user.status === MattermostUserStatus.USER_IS_NOT_VALID)
    console.log(`${usersToDelete.length} users to remove`)
    for (const user of usersToDelete) {
        if (process.env.FEATURE_REMOVE_USER_FROM_TEAM_ADD_TO_ALUMNI) {
            try {
                await mattermost.addUserToTeam(
                    user.id,
                    config.mattermostAlumniTeamId)
                await mattermost.removeUserFromTeam(
                    user.id,
                    config.mattermostTeamId
                );
            } catch (e) {
                console.log(`Error while removing user ${user.id}`, e)
            }
        }
    }
}

async function getPartnersActiveUserEmails({ nbDays }: { nbDays: number }) : Promise<string[]> {
    
    const membersConfigs : {
        domain: string,
        members: Member[]
    }[] = config.MATTERMOST_PARTNERS_AUTHORS_URL ? await axios.get(config.MATTERMOST_PARTNERS_AUTHORS_URL).then(res => res.data) : []
    let emails = []
    for (const membersConfig of membersConfigs) {
        const members = membersConfig.members
        const activeMembers = utils.getActiveUsers(members, nbDays);
        emails = [...emails, ...activeMembers.map(member => `${member}@${membersConfig.domain}`)]
    }
    return emails
}

async function getPartnersUserEmails({ nbDays }: { nbDays: number }) : Promise<string[]> {
    
    const membersConfigs : {
        domain: string,
        members: Member[]
    }[] = config.MATTERMOST_PARTNERS_AUTHORS_URL ? await axios.get(config.MATTERMOST_PARTNERS_AUTHORS_URL).then(res => res.data) : []
    let emails = []
    for (const membersConfig of membersConfigs) {
        const members = membersConfig.members
        emails = [...emails, ...members.map(member => `${member}@${membersConfig.domain}`)]
    }
    return emails
}
