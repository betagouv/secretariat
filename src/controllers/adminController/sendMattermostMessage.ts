import config from "@/config"
import db from "@/db"
import { sendInfoToChat } from "@/infra/chat"
import { DBUser, EmailStatusCode } from "@/models/dbUser"
import * as mattermost from '@lib/mattermost'
import { MattermostUser } from "@lib/mattermost"

const getMattermostUsers = async({
    fromBeta,
    includeEmails,
    excludeEmails
} : { fromBeta: boolean, includeEmails: string[], excludeEmails: string[]}) => {
    let activeUsers : MattermostUser[] = await mattermost.getUserWithParams({params: {
        in_team: config.mattermostTeamId,
        active: true
    }})
    if (includeEmails && includeEmails.length) {
        activeUsers = activeUsers.filter(user => includeEmails.includes(user.email))
    }
    if (excludeEmails && excludeEmails.length) {
        activeUsers = activeUsers.filter(user => !excludeEmails.includes(user.email))
    }
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
    const fromBeta = req.query.fromBeta === 'true'
    const excludeEmails = req.query.excludeEmails
    const includeEmails = req.query.includeEmails
    const users : MattermostUser[] = await getMattermostUsers({
        fromBeta,
        excludeEmails,
        includeEmails
    })
    res.json({
        users,
    })   
}

const sendMessageToChannel = async ({ channel, text } : { channel: string, text: string }) => {
    await sendInfoToChat({
        text: text,
        channel
    })
}

const sendDirectMessageToUsers = async ({
    fromBeta,
    text,
    excludeEmails,
    includeEmails
} : {
    fromBeta: boolean,
    text: string,
    excludeEmails: string[],
    includeEmails: string[]
}) => {
    const activeUsers = await getMattermostUsers({
        fromBeta,
        includeEmails,
        excludeEmails
    })
    console.log(`Will send message to ${activeUsers.length}`)
    let nbUsers = 0
    for (const user of activeUsers) {
        console.log(`Will write to user`, user.username)
        try {
            await sendInfoToChat({
                text: text,
                username: user.username,
                channel: 'secretariat',
            })
            nbUsers++
        } catch(e) {

        }
    }
    return {
        nbUsers
    }
}

export const sendMessageToUsersOnChat = async(req, res) => {
    const text = req.body.text
    const fromBeta = req.body.fromBeta === 'true'
    const excludeEmails = req.body.excludeEmails
    const includeEmails = req.body.includeEmails
    const channel = req.body.channel
    const prod = req.body.prod === 'true'
    if (prod) {
        if (channel) {
            await sendMessageToChannel({
                text,
                channel
            })
        } else {
            console.log('will send direct message to users')
            await sendDirectMessageToUsers({
                text,
                fromBeta,
                excludeEmails,
                includeEmails
            })
        }
    }
    // send message to admin
    await sendInfoToChat({
        text: text,
        username: req.auth.id,
        channel: 'secretariat',
    })
    res.json({
        'message': `Envoye un message en ${prod ? 'prod' : 'test'}`
    });
}
