import { MattermostUser } from "@/lib/mattermost";
import { DBUser } from "@/models/dbUser/dbUser";
import { Member } from "@/models/member";
import knex from "@/db";
import config from '@config';
import * as utils from '@controllers/utils';
import * as mattermost from '@/lib/mattermost';
import betagouv from "@/betagouv";
import { sendInfoToChat } from "@/infra/chat";

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

async function getUserFromCommunityTeamToRemove({
    optionalUsers,
    nbDays,
    checkAll=true} : UsersToRemoveProps) : Promise<MattermostUser[]> {
    // Removed users referenced on github but expired for more than 3 months
    let users: Member[] = optionalUsers;
    console.log('Start function remove users from community team');
    if (!users) {
        try {
            users = await betagouv.usersInfos()
        } catch(e) {
            throw new Error('Error while getting users infos')
        }
      users = checkAll ? utils.getExpiredUsers(users, nbDays) : utils.getExpiredUsersForXDays(users, nbDays);
    }
    const partnersActiveUserEmails : string[] = await getPartnersActiveUserEmails()
    const mattermostEmailRegexException : string[] = (process.env.MATTERMOST_EMAIL_REGEX_EXCEPTION || '').split(',')
    const dbUsers : DBUser[] = await knex('users').whereIn('username', users.map(user => user.id))
    const dbuser_primary_emails : string[] = dbUsers
        .map(dbUser => dbUser.primary_email)
        .filter(email => email)
    const mattermostUsers : MattermostUser[] = await mattermost.getActiveMattermostUsers({
        in_team: config.mattermostTeamId
    })
    const authorizedEmails = [...dbuser_primary_emails, ...partnersActiveUserEmails]
    const mattermostUsersToDelete : MattermostUser[] = mattermostUsers.filter(mUser => {
        return authorizedEmails.includes(mUser.email) ||
            validateAtLeastOneFormat(mattermostEmailRegexException, mUser.email)
    })
    console.log(`Mattermost user to deactivate ${JSON.stringify(mattermostUsersToDelete)}`)
    return mattermostUsersToDelete
}

export async function sendReminderToUserAtDays({
    optionalUsers,
    checkAll,
    nbDays
}: UsersToRemoveProps) {
    const usersToSendAMessageTo : MattermostUser[] = await getUserFromCommunityTeamToRemove({
        optionalUsers,
        nbDays,
        checkAll
    })

    for (const user of usersToSendAMessageTo) {
        await sendInfoToChat({
            username: user.username,
            text: "Tu n'est pas référencé ni dans les fiches membres @beta.gouv.fr/partenaires ou ta date de fin est dépassée. Ton compte risque d'être suspendu dans les 15 jours à venir."
        })
    }
}

export async function removeBetaAndParnersUsersFromCommunityTeam({
    optionalUsers,
    checkAll
} : { optionalUsers: Member[], checkAll: boolean}) {
    // Removed users referenced on github but expired for more than 3 months
    const usersToDelete : MattermostUser[] = await getUserFromCommunityTeamToRemove({
        optionalUsers,
        nbDays: 3*30,
        checkAll
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

async function getPartnersActiveUserEmails() : Promise<string[]> {
    throw new Error("Function not implemented.");
}
