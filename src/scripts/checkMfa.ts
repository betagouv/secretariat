import { getUserWithParams, MattermostUser } from "../lib/mattermost";

const checkMFA = async() => {
    const users : MattermostUser[] = await getUserWithParams({
        active: true,
        sort: 'last_activity_at'
    })
    const countMFA = users.filter(user => user.mfa_active).length;
    console.info(`users with mfa_active : ${countMFA} on ${users.length}`)
    console.info(`users with mfa_active percentage : ${(countMFA/users.length)/100}%`)
    users.forEach(user => {
        console.info(`${user.username} ${user.email} ${user.last_activity_at}`)
    })
}

checkMFA()
