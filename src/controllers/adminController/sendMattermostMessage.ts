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
    const fromBeta = req.query.fromBeta === 'true'
    const users : MattermostUser[] = await getMattermostUsers({
        fromBeta
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
    text
} : {fromBeta: boolean, text: string}) => {
    const activeUsers = await getMattermostUsers({
        fromBeta
    })
    console.log(`Will send message to ${activeUsers.length}`)
    let nbUsers = 0
    for (const user of activeUsers) {
        console.log(`Will write to user`, user.username)
        if (process.env.FEATURE_SEND_MATTERMOST_MESSAGE) {
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
    }
    return {
        nbUsers
    }
}

export const sendMessageToUsersOnChat = async(req, res) => {
    const text = req.body.text
    const fromBeta = req.body.fromBeta === 'true'
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
            const { nbUsers } = await sendDirectMessageToUsers({
                text,
                fromBeta
            })
            req.flash('message', `Le message a été envoyé à : ${nbUsers} membres`);
        }
    }
    // send message to admin
    await sendInfoToChat({
        text: text,
        username: req.auth.id,
        channel: 'secretariat',
    })
    res.redirect('/admin/mattermost');
}
