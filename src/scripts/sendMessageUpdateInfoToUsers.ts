import ejs from 'ejs';
import BetaGouv from '../betagouv';
import * as utils from '../controllers/utils';
import knex from '../db';
import { DBUser, GenderCode } from '../models/dbUser';
import { Member, MemberWithEmailsAndMattermostUsername } from '../models/member';
import * as mattermost from '../lib/mattermost';
import { fetchCommuneDetails } from '../lib/searchCommune';
import { renderHtmlFromMd } from '../lib/mdtohtml';

export async function sendMessageToUpdateInfoToAllUsers() {
    const allMattermostUsers = await mattermost.getUserWithParams();
    const allMattermostUsersEmails = allMattermostUsers.map(
        (mattermostUser) => mattermostUser.email
      );
    const users: Member[] = await BetaGouv.usersInfos();
    const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
    const concernedUsers: DBUser[] = await knex('users')
      .whereIn(
        'username',
        ['lucas.charrier'] || activeUsers.map((user) => user.id)
      );
    
    const concernedUserWithMattermostUsers : (MemberWithEmailsAndMattermostUsername & DBUser)[] = concernedUsers.map(
        (user) => {
            const index = allMattermostUsersEmails.indexOf(
              user.primary_email
            );
            const githubUser = activeUsers.find(ghUser => ghUser.id === user.username)
            return {
                ...githubUser,
                ...user,
                primary_email: user.primary_email,
                secondary_email: user.secondary_email,
                mattermostUsername: index > -1 ? allMattermostUsers[index].username : undefined,
            };
          }
    );
    
    for (const user of concernedUserWithMattermostUsers) {
        const secretariatUrl = `https://secretariat.incubateur.net/`;
        const messageContent = await ejs.renderFile(
            `./src/views/templates/emails/updateUserInfoEmail.ejs`,
            {
                secretariatUrl,
                user: {
                    ...user,
                    tjm: user.tjm || 'Non défini',
                    gender: GenderCode[user.gender],
                    legal_status: user.legal_status || 'Non défini',
                    workplace_insee_code: user.workplace_insee_code ? await fetchCommuneDetails(user.workplace_insee_code) : 'Non défini',
                    secondary_email: user.secondary_email || 'Non défini'
                }
            }
        );
        if (process.env.FEATURE_SEND_MESSAGE_UPDATE_INFO) {
            if (user.mattermostUsername === 'lucas.charrier') {
                try {
                    
                    await BetaGouv.sendInfoToChat(
                        messageContent,
                        'secretariat',
                        user.mattermostUsername
                    );
                    await sleep(1000);
                } catch (e) {
                    console.log(`Erreur lors de l'envoie à ${user.mattermostUsername}`, e)
                }
                utils.sendMail(user.primary_email, 'Mise à jour de tes informations', renderHtmlFromMd(messageContent))
            }
        }
        console.log(`Message d'update des info utilisateur envoyé à ${user.mattermostUsername}`)        
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

sendMessageToUpdateInfoToAllUsers()
