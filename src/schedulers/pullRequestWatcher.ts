import ejs from 'ejs';
import Betagouv from '../betagouv';
import config from '../config';
import knex from '../db';
import * as github from '../lib/github';
import * as mattermost from '../lib/mattermost';
import { DBUser, EmailStatusCode } from '../models/dbUser';
import * as utils from "../controllers/utils";
import { Member } from '../models/member';
import { renderHtmlFromMd } from '../lib/mdtohtml';

const findAuthorsInFiles = async (files) => {
    const authors = [];
    for (const file of files) {
        if (file.contents_url.includes('content/_authors')) {
            authors.push(file.filename.replace('content/_authors/', '').replace('.md', ''));
        }
    }
    return authors;
}

const sendEmailToAuthorsIfExists = async (author, pullRequestNumber) => {
    const user: DBUser = await knex('users').where({
        username: author,
    }).andWhere(function() {
        this.where({ primary_email_status: EmailStatusCode.EMAIL_ACTIVE })
        .orWhereNotNull('secondary_email')
    })
    .first()
    if (!user) {
        console.log(`L'utilisateur n'existe pas, ou n'a ni email actif, ni d'email secondaire`)
    } else {
        const member: Member = await Betagouv.userInfosById(author)
        const messageContent = await ejs.renderFile(
            `./views/emails/pendingGithubAuthorPR.ejs`,
            {
              username: member.fullname,
              pr_link: `https://github.com/${config.githubRepository}/pull/${pullRequestNumber}`
            }
        );
        const primary_email_active = user.primary_email_status === EmailStatusCode.EMAIL_ACTIVE
        await utils.sendMail(
            primary_email_active ? user.primary_email : user.secondary_email,
            `PR en attente`,
            renderHtmlFromMd(messageContent)
        );
        console.log(`Message de rappel de pr envoyé par email à ${user.username}`)
    }
}

const sendMattermostMessageToAuthorsIfExists = async (author, pullRequestNumber) => {
    const [mattermostUser] : mattermost.MattermostUser[] = await mattermost.searchUsers({
        term: author
    })

    if (mattermostUser) {
        const messageContent = await ejs.renderFile(
            `./views/emails/pendingGithubAuthorPR.ejs`,
            {
              username: mattermostUser.username,
              pr_link: `https://github.com/${config.githubRepository}/pull/${pullRequestNumber}`
            }
        );
        await Betagouv.sendInfoToChat(
            messageContent,
            'secretariat',
            mattermostUser.username
        );
        console.log(`Message de rappel de pr envoyé par mattermost à ${mattermostUser.username}`)
        return true
    }
    return false;
}

const sendMessageToAuthorsIfAuthorFilesInPullRequest = async (pullRequestNumber: number) => {
    const { data: files } = await github.getPullRequestFiles(
        config.githubOrganizationName, 'beta.gouv.fr', pullRequestNumber)
    const authors = await findAuthorsInFiles(files)
    for (const author of authors) {
        console.log('Should send message to author', author)
        if (!config.featureShouldSendMessageToAuthor) {
            return
        }
        let mattermostSent
        try {
            mattermostSent = await sendMattermostMessageToAuthorsIfExists(author, pullRequestNumber)
        } catch (e) {
            console.error(`Erreur lors de l'envoie d'un message via mattermost à ${author}`, e)
        }
        if (!mattermostSent) {
            try {
                await sendEmailToAuthorsIfExists(author, pullRequestNumber)
            } catch (e) {
                console.error(`Erreur lors de l'envoie d'un email à ${author}`, e)
            }
        }
    }
}

const filterUpdateDateXdaysAgo = (updatedDate, nbOfDays) => {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + nbOfDays)
    const thresholdDateLessOneDay = new Date()
    thresholdDateLessOneDay.setHours(thresholdDate.getHours() - 1)
    return updatedDate < thresholdDate && updatedDate > thresholdDateLessOneDay
}

const pullRequestWatcher = async () => {
    const { data: pullRequests }  = await github.getPullRequests(
        config.githubOrganizationName, 'beta.gouv.fr', 'open')
    const filteredPullRequests = pullRequests.filter(pr => {
        const updatedDate = new Date(pr.updated_at)
        return filterUpdateDateXdaysAgo(updatedDate, 0) || filterUpdateDateXdaysAgo(updatedDate, 5)
    })
    const pullRequestCheckPromises = filteredPullRequests.map(
        pr => sendMessageToAuthorsIfAuthorFilesInPullRequest(pr.number))
    return Promise.all(pullRequestCheckPromises)
}

export {
    pullRequestWatcher
}


