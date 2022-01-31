import ejs from 'ejs';
import Betagouv from '../betagouv';
import config from '../config';
import knex from '../db';
import * as github from '../lib/github'
import * as mattermost from '../lib/mattermost'
import { renderHtmlFromMd } from '../lib/mdtohtml';
import { EmailStatusCode } from '../models/dbUser';
import * as utils from '../controllers/utils';


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
    const user = await knex('users').where({
        username: author,
        primary_email: EmailStatusCode.EMAIL_ACTIVE
    }).first()

    if (!user) {
        console.error(`L'utilisateur n'existe pas`)
    } else {
        const messageContent = await ejs.renderFile(
            `./views/emails/test`,
            {}
        );
        await utils.sendMail(
            user.primary_email,
            `PR en attente`,
            renderHtmlFromMd(messageContent)
        );
    }
}

const sendMattermostMessageToAuthorsIfExists = async (author) => {
    const [mattermostUser] = await mattermost.searchUsers({
        term: author
    })
    const messageContent = await ejs.renderFile(
        `./views/emails/test`,
        {}
    );

    if (mattermostUser) {
        await Betagouv.sendInfoToChat(
            messageContent,
            'secretariat',
            mattermostUser.username
        );
    }
}

const sendMessageToAuthorsIfAuthorFilesInPullRequest = async (pullRequestNumber: number) => {
    const { data: files } = await github.getPullRequestFiles(
        config.githubOrganizationName, config.githubRepository, pullRequestNumber)
    const authors = await findAuthorsInFiles(files)
    for (const author of authors) {
        console.log('Should send message to author', author)
        if (config.featureShouldSendMessageToAuthor) {
            await sendMattermostMessageToAuthorsIfExists(author)
            await sendEmailToAuthorsIfExists(author)
        }
    }
}

const pullRequestWatcher = async () => {
    const { data: pullRequests }  = await github.getPullRequests(
        config.githubOrganizationName, config.githubRepository, 'open')
    const pullRequestCheckPromises = pullRequests.map(pr => sendMessageToAuthorsIfAuthorFilesInPullRequest(pr.number))
    Promise.all(pullRequestCheckPromises)
}

export default pullRequestWatcher


