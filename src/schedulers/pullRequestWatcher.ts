import ejs from 'ejs';
import Betagouv from '../betagouv';
import config from '../config';
import knex from '../db';
import * as github from '../lib/github'
import * as mattermost from '../lib/mattermost'
import { DBUser, EmailStatusCode } from '../models/dbUser';
import * as utils from "../controllers/utils";


const findAuthorsInFiles = async (files) => {
    const authors = [];
    for (const file of files) {
        if (file.contents_url.includes('content/_authors')) {
            authors.push(file.filename.replace('.md', ''));
        }
    }
    return authors;
}

const sendEmailToAuthorsIfExists = async (author) => {
    const user: DBUser = await knex('users').where({
        username: author,
    }).andWhere({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE
    }).orWhereNotNull('secondary_email')
    .first()
    if (!user) {
        console.log(`L'utilisateur n'existe pas, ou n'a ni email actif, ni d'email secondaire`)
    } else {
        const messageContent = await ejs.renderFile(
            `./views/emails/pendingGithubAuthorPR.ejs`,
            {}
        );
        const primary_email_active = user.primary_email_status === EmailStatusCode.EMAIL_ACTIVE
        await utils.sendMail(
            primary_email_active ? user.primary_email : user.secondary_email,
            `PR en attente`,
            messageContent
        );
        console.log(`Message de rappel de pr envoyé par email à ${user.username}`)
    }
}

const sendMattermostMessageToAuthorsIfExists = async (author) => {
    const [mattermostUser] : mattermost.MattermostUser[] = await mattermost.searchUsers({
        term: author
    })
    const messageContent = await ejs.renderFile(
        `./views/emails/pendingGithubAuthorPR.ejs`,
        {}
    );

    if (mattermostUser) {
        await Betagouv.sendInfoToChat(
            messageContent,
            'secretariat',
            mattermostUser.username
        );
        console.log(`Message de rappel de pr envoyé par mattermost à ${mattermostUser.username}`)
    }
}

const sendMessageToAuthorsIfAuthorFilesInPullRequest = async (pullRequestNumber: number) => {
    const { data: files } = await github.getPullRequestFiles(
        config.githubOrganizationName, 'beta.gouv.fr', pullRequestNumber)
    const authors = await findAuthorsInFiles(files)
    for (const author of authors) {
        console.log('Should send message to author', author)
        if (config.featureShouldSendMessageToAuthor) {
            try {
                await sendMattermostMessageToAuthorsIfExists(author)
            } catch (e) {
                console.error(`Erreur lors de l'envoie d'un message via mattermost à ${author}`, e)
            }
            try {
                await sendEmailToAuthorsIfExists(author)
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
    Promise.all(pullRequestCheckPromises)
}

export default pullRequestWatcher


