import config from "@/config"
import db from "@/db"
import { getUserWithParams, sendInfoToChat } from "@/infra/chat"
import { DBUser, EmailStatusCode } from "@/models/dbUser"
import { MattermostUser } from "@lib/mattermost"

export const getMattermostUsers = async({
    fromBeta,
    includeEmails,
    excludeEmails
} : { fromBeta: boolean, includeEmails: string[], excludeEmails: string[]}) => {
    let activeUsers : MattermostUser[] = await getUserWithParams({params: {
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
    const excludeEmails = (req.query.excludeEmails || '').split(',').map(email => email.trim()).filter(email => email)
    const includeEmails = (req.query.includeEmails || '').split(',').map(email => email.trim()).filter(email => email)
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
                extra: {
                  username: 'Equipe Communauté beta.gouv'
                }
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
    let nbUsers
    try {
        const text = req.body.text
        const fromBeta = req.body.fromBeta === true
        const excludeEmails = (req.body.excludeEmails || '').split(',').map(email => email.trim()).filter(email => email)
        const includeEmails = (req.body.includeEmails || '').split(',').map(email => email.trim()).filter(email => email)
        const channel = req.body.channel
        const prod = req.body.prod === true
        if (prod) {
            if (channel) {
                await sendMessageToChannel({
                    text,
                    channel
                })
            } else {
                console.log('will send direct message to users')
                nbUsers = await sendDirectMessageToUsers({
                    text,
                    fromBeta,
                    excludeEmails,
                    includeEmails
                }).then(res => res.nbUsers)
            }
        }
        // send message to admin
        await sendInfoToChat({
            text: text,
            username: req.auth.id,
            channel: 'secretariat',
            extra: {
                  username: 'Equipe Communauté beta.gouv'
            },
        })
        res.json({
            'message': `Envoyé un message en ${prod ? 'prod' : 'test'} à ${nbUsers !== undefined ? nbUsers : channel}`
        });
    } catch (e) {
        console.log(e)
        res.status(500).json({
            'message': `Erreur ${e}`
        })
    }
}
