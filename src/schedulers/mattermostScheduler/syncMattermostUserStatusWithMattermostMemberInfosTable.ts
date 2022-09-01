import db from "@/db";
import * as mattermost from "@/lib/mattermost";
import { MattermostMemberInfo } from "@/models/mattermostMemberInfo";

export async function syncMattermostUserStatusWithMattermostMemberInfosTable() {
    const mattermostMemberInfos : MattermostMemberInfo[] = await db('mattermost_member_infos').select('*')
    const ids = mattermostMemberInfos.map(m => m.mattermost_user_id)
    const mattermostUsersStatus = await mattermost.getMattermostUsersStatus(ids)
    
    for (const status of mattermostUsersStatus) {
        await db('mattermost_member_infos').update({
            last_activity_at: status.last_activity_at
        })
        .where({
            mattermost_user_id: status.user_id
        })
    }
}
