import * as Sentry from '@sentry/node';

import * as github from '@/lib/github';
import db from "@/db";
import config from "@/config";
import { sendEmail } from "@/config/email.config";
import { EMAIL_TYPES } from "@/modules/email";
import { CommunicationEmailCode } from "@/models/dbUser";
import { sendInfoToChat } from "@/infra/chat";
import htmlBuilder from "@/modules/htmlbuilder/htmlbuilder";
import * as mattermost from '@/lib/mattermost';
import { DBStartup } from '@/models/startup';

interface DBPullRequest {
    status: string,
    username: string,
    created_at: Date,
    last_updated_at: Date
    url: string
    info: {
        name: string,
        isEmailBetaAsked: boolean,
        referent: string,
        startup?: string
    }
}

enum PULL_REQUEST_STATE {
    PR_CREATED='PR_CREATED',
    PR_SENT_TO_REFERENT='PR_SENT_TO_REFERENT',
    PR_SENT_TO_TEAM='PR_SENT_TO_TEAM',
    PR_READY_TO_BE_CLOSED='PR_READY_TO_BE_CLOSED',
    PR_CLOSED='PR_CLOSED'
}

async function sendMessageToReferent({ prUrl, prInfo }: { prUrl: string, prInfo: {
    referent: string,
    name: string,
    isEmailBetaAsked: boolean
}}) {
    const referent = prInfo.referent
    const name = prInfo.name
    const isEmailBetaAsked = prInfo.isEmailBetaAsked
    try {
        const dbReferent = await db('users').where({ username: prInfo.referent }).first()
        const email = dbReferent.communication_email === CommunicationEmailCode.SECONDARY && dbReferent.secondary_email ? dbReferent.secondary_email : dbReferent.primary_email
        await sendEmail({
        toEmail: [email],
        type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
        variables: {
            referent,
            prUrl,
            name,
            isEmailBetaAsked
        }
        })
    } catch (e) {
        Sentry.captureException(e);
        throw new Error(`It was not able to find referent ${referent}`, e)
    }
    try {
        const [mattermostUser] : mattermost.MattermostUser[] = await mattermost.searchUsers({
        term: referent
        })
        const messageContent = await htmlBuilder.renderContentForTypeAsMarkdown({
        type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL,
        variables: {
            referent,
            prUrl,
            name,
            isEmailBetaAsked
        }
        })
        await sendInfoToChat({
        text: messageContent,
        channel: 'secretariat',
        username: mattermostUser.username
        })
    } catch (e) {
        Sentry.captureException(e);
        console.error('It was not able to send message to referent on mattermost', e)
    }
}

const sendEmailToTeam = async({ prUrl, prInfo, username }: { prUrl: string, prInfo: {
    referent: string,
    name: string,
    isEmailBetaAsked: boolean,
    startup?: string
}, username: string}) => {
    if (!prInfo.startup) {
        return
    }
    const dbStartup : DBStartup = await db('startups').where({
        id: prInfo.startup
    }).whereNotNull('mailing_list').first()
    if (dbStartup) {
        await sendEmail({
            toEmail: [`${dbStartup.mailing_list}@${config.domain}`],
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_PR,
            variables: undefined
        })
    }
}

export async function pullRequestStateMachine() {
    const dbPullRequests : DBPullRequest[] = await db('pull_requests').whereNot({
        status: PULL_REQUEST_STATE.PR_CLOSED
    })
    const { data: pullRequests }  = await github.getPullRequests(
        config.githubOrganizationName, 'beta.gouv.fr', 'open')
    const pullRequestURLs = pullRequests.map(pr => pr.url)
    console.log(dbPullRequests)
    for (const dbPullRequest of dbPullRequests) {
        try {
            const url = dbPullRequest.url
            if (dbPullRequest.status === PULL_REQUEST_STATE.PR_CREATED) {
                // sendEmail to referent
                await sendMessageToReferent({
                    prUrl: url,
                    prInfo: dbPullRequest.info
                })
                await db('pull_requests').where({ url }).update({
                    status: PULL_REQUEST_STATE.PR_SENT_TO_REFERENT
                })
            } else if (dbPullRequest.status === PULL_REQUEST_STATE.PR_SENT_TO_REFERENT) {
                // sendEmail to team
                await sendEmailToTeam({
                    username: dbPullRequest.username,
                    prUrl: url,
                    prInfo: dbPullRequest.info, 
                })
                await db('pull_requests').where({ url }).update({
                    status: PULL_REQUEST_STATE.PR_SENT_TO_TEAM
                })
            } else if (dbPullRequest.status === PULL_REQUEST_STATE.PR_SENT_TO_TEAM) {
                // set pull request as ready to be closed
                await db('pull_requests').where({ url }).update({
                    status: PULL_REQUEST_STATE.PR_READY_TO_BE_CLOSED
                })
            } else if (dbPullRequest.status === PULL_REQUEST_STATE.PR_READY_TO_BE_CLOSED && !pullRequestURLs.includes(dbPullRequest.url)) {
                // clsoe pr   
                await db('pull_requests').where({ url }).update({
                    status: PULL_REQUEST_STATE.PR_CLOSED
                })         
            }
        } catch(e) {
            Sentry.captureException(e);
        }
    }
}