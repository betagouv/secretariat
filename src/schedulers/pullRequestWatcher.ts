import ejs from 'ejs';

import * as github from '../lib/github'
import * as mattermost from '../lib/mattermost'
import { EmailStatusCode } from '../models/dbUser';
import Betagouv from '../betagouv';
import * as utils from '../controllers/utils';
import { renderHtmlFromMd } from '../lib/mdtohtml';
import knex from '../db';

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

const sendMessageToAuthorsIfAuthorFilesInPullRequest = async (pullRequestId) => {
    const { data: files } = await github.getPullRequestFiles('betagouv','beta.gouv.fr', pullRequestId)
    const authors = await findAuthorsInFiles(files)
    for (const author of authors) {
        console.log('Should send message to author', author)
        // await sendMattermostMessageToAuthorsIfExists(author)
        // await sendEmailToAuthorsIfExists(author)
    }
}

const pullRequestWatcher = async () => {
    const { data: pullRequests }  = await github.getPullRequests('betagouv','beta.gouv.fr', 'open')
    const pullRequestCheckPromises = pullRequests.map(pr => sendMessageToAuthorsIfAuthorFilesInPullRequest(pr.id))
    Promise.all(pullRequestCheckPromises)
}

export default pullRequestWatcher


