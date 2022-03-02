import { getUserWithParams, MattermostUser } from "../lib/mattermost";

const checkMFA = async() => {
    const users : MattermostUser[] = await getUserWithParams({
        active: true
    })
    const countMFA = users.filter(user => user.mfa_active).length;
    console.info(`users with mfa_active : ${countMFA} on ${users.length}`)
    console.info(`users with mfa_active percentage : ${(countMFA/users.length)/100}%`)
}

checkMFA()
