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
import { DBPullRequest, PULL_REQUEST_STATE, PULL_REQUEST_TYPE } from '@/models/pullRequests';
import { nbOfDaysBetweenDate } from '@/controllers/utils';

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
        // user has a github card but is not in database
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

const sendEmailToTeam = async({ prUrl, prInfo: {
    referent,
    name,
    isEmailBetaAsked,
    startup
}, username }: { prUrl: string, prInfo: {
    referent: string,
    name: string,
    isEmailBetaAsked: boolean,
    startup?: string
}, username: string}) => {
    if (!startup) {
        return
    }
    const dbStartup : DBStartup = await db('startups').where({
        id: startup
    }).whereNotNull('mailing_list').first()
    if (dbStartup) {
        await sendEmail({
            toEmail: [`${dbStartup.mailing_list}@${config.domain}`],
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_PR,
            variables: {
                prUrl,
                name,
                isEmailBetaAsked,
                startup
            }
        })
    }
}

const MemberUpdateStateMachine = async (dbPullRequest, pullRequestURLs) => {
    const url = dbPullRequest.url
    if (!pullRequestURLs.includes(dbPullRequest.url)) {
        await db('pull_requests').where({ url }).update({
            status: PULL_REQUEST_STATE.PR_CLOSED
        })
    }
}

const StartupUpdateStateMachine = async (dbPullRequest, pullRequestURLs) => {
    const url = dbPullRequest.url
    if (!pullRequestURLs.includes(dbPullRequest.url)) {
        await db('pull_requests').where({ url }).update({
            status: PULL_REQUEST_STATE.PR_CLOSED
        })
    }
}

const OnboardingStateMachine = async (dbPullRequest: DBPullRequest, pullRequestURLs: string[]) => {
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
        if(nbOfDaysBetweenDate(Date.now(), dbPullRequest.created_at) < 7) {
            // the check on the date should be temporary to fix old PR stucked on previous state that should not triggered email sent
            await sendEmailToTeam({
                username: dbPullRequest.username,
                prUrl: url,
                prInfo: dbPullRequest.info, 
            })
        }
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
}

export async function pullRequestStateMachine() {
    const dbPullRequests : DBPullRequest[] = await db('pull_requests').whereNot({
        status: PULL_REQUEST_STATE.PR_CLOSED
    })
    const { data: pullRequests }  = await github.getPullRequests(
        config.githubOrganizationName, 'beta.gouv.fr', 'open')
    const pullRequestURLs = pullRequests.map(pr => pr.html_url)
    for (const dbPullRequest of dbPullRequests) {
        try {
            if (dbPullRequest.type === PULL_REQUEST_TYPE.PR_TYPE_ONBOARDING) {
                await OnboardingStateMachine(dbPullRequest, pullRequestURLs)
            } else if (dbPullRequest.type === PULL_REQUEST_TYPE.PR_TYPE_MEMBER_UPDATE) {
                await MemberUpdateStateMachine(dbPullRequest, pullRequestURLs)
            } else if (dbPullRequest.type === PULL_REQUEST_TYPE.PR_TYPE_STARTUP_UPDATE) {
                await StartupUpdateStateMachine(dbPullRequest, pullRequestURLs)
            }
        } catch(e) {
            console.error(e)
            Sentry.captureException(e);
        }
    }
}
