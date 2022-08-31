import config from "@/config";
import db from "@/db";
import * as mattermost from "@/lib/mattermost";
import { DBUser } from "@/models/dbUser";
import knex from "knex";

interface MattermostMemberInfo {
    username: string
    mattermost_user_id: string
    last_active_at?: Date
}

const isSameUser = (mattermostUser: mattermost.MattermostUser, dbUser: DBUser) => {
    return mattermostUser.email === dbUser.primary_email || mattermostUser.email === dbUser.secondary_email
}

export async function syncMattermostUserWithMattermostMemberInfosTable () {
    const mattermostUsers : mattermost.MattermostUser[] = await mattermost.getInactiveMattermostUsers({
        in_team: config.mattermostTeamId
    })
    const mattermostUserEmails : string[] = mattermostUsers.map(user => user.email)
    const dbUsers : DBUser[] = await db('users')
        .whereIn('secondary_email', mattermostUserEmails)
        .orWhereIn('primary_email', mattermostUserEmails)
    
    for (const dbUser of dbUsers) {
        const mattermostUser = mattermostUsers.find(mUser => isSameUser(mUser, dbUser))
        const mattermostMemberInfo : MattermostMemberInfo = {
            username: dbUser.username,
            mattermost_user_id: mattermostUser.id,
        }
        await knex('mattermost_member_infos').insert(mattermostMemberInfo)
    }
}
