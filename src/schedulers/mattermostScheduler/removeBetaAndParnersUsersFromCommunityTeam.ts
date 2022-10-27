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
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED = "USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED"
}

type MattermostUserWithStatus = MattermostUser & {
    status: MattermostUserStatus
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
        if (dbuser_primary_emails.includes(mUser.email)) {
            if (dbuser_not_active_primary_emails.includes(mUser.email)) {
                const dbUser = dbUsers.find(dbUser => dbUser.primary_email === mUser.email)
                const memberInfo = users.find(user => user.id === dbUser.username)
                if (!memberInfo) {
                    status = MattermostUserStatus.USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO
                }else if (utils.checkUserIsExpired(memberInfo, nbDays)) {
                    status = MattermostUserStatus.USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED
                } else {
                    status = MattermostUserStatus.USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO
                }
            } else {
                const dbUser = dbUsers.find(dbUser => dbUser.primary_email === mUser.email)
                const memberInfo = users.find(user => user.id === dbUser.username)
                if (!memberInfo) {
                    status = MattermostUserStatus.USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO
                } else if (utils.checkUserIsExpired(memberInfo, nbDays)) {
                    status = MattermostUserStatus.USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED
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
            status
        }
    })
    console.log(`Mattermost user to remove from communauté ${JSON.stringify(mattermostUsersToRemove)}`)
    return mattermostUsersToRemove
}

const MATTERMOST_ACTIVE_STATUS = [
    MattermostUserStatus.USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL,
    MattermostUserStatus.USER_IS_VALID_WITH_DOMAIN,
    MattermostUserStatus.USER_IS_VALID_WITH_PARTNER
]

export async function getInvalidBetaAndParnersUsersFromCommunityTeam({
    nbDays
} : UsersToRemoveProps) : Promise<MattermostUser[]> {
    // Removed users referenced on github but expired for more than 3 months
    const mattermostUsersWithStatus = await getMattermostUsersWithStatus({ nbDays })
    const invalideUsers = mattermostUsersWithStatus.filter(m => !MATTERMOST_ACTIVE_STATUS.includes(m.status))
    return invalideUsers
}



export async function sendReminderToUserAtDays({
    optionalUsers,
    checkAll,
    nbDays
}: UsersToRemoveProps) {
    const usersToSendAMessageTo : MattermostUser[] = await getInvalidBetaAndParnersUsersFromCommunityTeam({
        optionalUsers,
        nbDays
    })

    for (const user of usersToSendAMessageTo) {
        await sendInfoToChat({
            username: user.username,
            text: `Bonjour ${user.first_name},
Tu reçois ce message car ton email n'a pas un domaine valide pour accèder à l'espace Communauté de mattermost.
Les emails valides sont ceux en @beta.gouv.fr, d'etalab et des services publics en général ainsi que ceux des attributaires.

- Si tu as ce genre d'email c'est celui-ci que tu dois utiliser comme email pour avoir accès a cet espace.
- Si tu n'as pas ce genre d'email mais que tu fais toujours parti de la communauté (tu es dans une startup, tu travailles en transverse), il faut que tu crée une fiche membre sur https://espace-membre.incubateur.net/onboarding.

Si tu n'es effectivement plus dans la communauté, ton compte sera retirer de l'espace Communauté (mais pas des autres espaces).
Il existe une espace Alumni mais il n'est pour l'instant pas animé.

Si tu as des questions ou que tu penses qu'il y a une erreur tu peux écrire à espace-membre@incubateur.net.

Ceci est un message automatique envoyé par l'app Espace Membre.
`
        })
    }
}

export async function removeBetaAndParnersUsersFromCommunityTeam({
    optionalUsers
} : { optionalUsers: Member[] }) {
    // Removed users referenced on github but expired for more than 3 months

    const usersToDelete : MattermostUser[] = await getInvalidBetaAndParnersUsersFromCommunityTeam({
        optionalUsers,
        nbDays: 3*30
    })

    for (const user of usersToDelete) {
        try {
            await mattermost.removeUserFromTeam(
                user.id,
                config.mattermostTeamId
            );
        } catch (e) {
            console.log(`Error while removing user ${user.id}`, e)
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
