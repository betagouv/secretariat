import config from "@/config"
import db from "@/db"
import { sendInfoToChat } from "@/infra/chat"
import { DBUser, EmailStatusCode } from "@/models/dbUser"
import * as mattermost from '@lib/mattermost'
import { MattermostUser } from "@lib/mattermost"

const getMattermostUsers = async({ fromBeta } : { fromBeta: boolean}) => {
    let activeUsers : MattermostUser[] = await mattermost.getUserWithParams({params: {
        in_team: config.mattermostTeamId,
        active: true
    }})
    if (fromBeta) {
        const dbUsers : DBUser[] = await db('users').where({
            primary_email_status: EmailStatusCode.EMAIL_ACTIVE
        })
        const primaryEmails = dbUsers.map(user => user.primary_email).filter(email => email)
        const secondaryEmails = dbUsers.map(user => user.secondary_email).filter(email => email)
        const emails = [...primaryEmails, ...secondaryEmails]
        activeUsers = activeUsers.filter(user => emails.includes(user.email))
    }
    return activeUsers
}

export const getMattermostUsersInfo = async(req, res) => {
    if (!config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
        res.send(401, 'Droit insufisant pour utiliser cette feature')
        return
    }
    const fromBeta = Boolean(req.query.fromBeta)
    const users : MattermostUser[] = await getMattermostUsers({
        fromBeta
    })
    res.json({
        users,
    })   
}

export const sendMessageToUsersOnChat = async(req, res) => {
    if (!config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)) {
        res.send(401, 'Droit insufisant pour utiliser cette feature')
        return
    }
    const text = req.body.text
    const fromBeta = Boolean(req.body.fromBeta)
    const activeUsers = await getMattermostUsers({
        fromBeta
    })
    console.log(`Will send message to ${activeUsers.length}`)
    for (const user of activeUsers) {
        console.log(`Will write to user`, user.username)
        if (process.env.FEATURE_SEND_MATTERMOST_MESSAGE) {
            try {
                await sendInfoToChat({
                    text: text,
                    username: user.username,
                    channel: 'secretariat',
                })
            } catch(e) {

            }
        }
    }
    // send message to admin
    await sendInfoToChat({
        text: text,
        username: req.auth.id,
        channel: 'secretariat',
    })
}