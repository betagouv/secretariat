import config from "@/config";
import db from "@/db";
import * as mattermost from "@/lib/mattermost";
import { DBUser } from "@/models/dbUser";
import { MattermostMemberInfo } from "@/models/mattermostMemberInfo";

const isSameUser = (mattermostUser: mattermost.MattermostUser, dbUser: DBUser) => {
    return mattermostUser.email === dbUser.primary_email || mattermostUser.email === dbUser.secondary_email
}

export async function syncMattermostUserWithMattermostMemberInfosTable () {
    const mattermostUsers : mattermost.MattermostUser[] = await mattermost.getActiveMattermostUsers({
        in_team: config.mattermostTeamId
    })
    const mattermostUserEmails : string[] = mattermostUsers.map(user => user.email)
    const dbUsers : DBUser[] = await db('users')
        .whereIn('secondary_email', mattermostUserEmails)
        .orWhereIn('primary_email', mattermostUserEmails)
        .join('mattermost_member_infos as mattermost', 'users.username', '=', 'mattermost.username')
        .whereNull('mattermost.username')
    console.log('DBUser', dbUsers.map(dbUser => dbUser.primary_email)) 
    if (process.env.FEATURE_APPLY_INSERT_MATTERMOST_USER_TO_DB === 'true') {
        for (const dbUser of dbUsers) {
            const mattermostUser = mattermostUsers.find(mUser => isSameUser(mUser, dbUser))
            const mattermostMemberInfo : MattermostMemberInfo = {
                username: dbUser.username,
                mattermost_user_id: mattermostUser.id,
            }
            await db('mattermost_member_infos').insert(mattermostMemberInfo)
            console.log(`Ajoute ${dbUser.username} à la table mattermost`)
        }
    }
}
