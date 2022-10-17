import ejs from 'ejs';
import BetaGouv from '@/betagouv';
import * as utils from '@controllers/utils';
import knex from '@/db';
import { DBUser } from '@/models/dbUser/dbUser';
import { Member, MemberWithEmailsAndMattermostUsername } from '@models/member';
import * as mattermost from '@/lib/mattermost';
import { makeHtmlEmail } from '@views/index.html';
import { EmailSecondaryEmail } from '@views/emails/EmailSecondaryEmail';
import { sleep } from '@controllers/utils';

export const EmailSecondaryEmailHtml = (props: Parameters<typeof EmailSecondaryEmail>[0]) =>
  makeHtmlEmail({
    Component: EmailSecondaryEmail,
    props,
})

export async function sendMessageToActiveUsersWithoutSecondaryEmail() {
    const allMattermostUsers = await mattermost.getUserWithParams();
    const allMattermostUsersEmails = allMattermostUsers.map(
        (mattermostUser) => mattermostUser.email
      );
    const users: Member[] = await BetaGouv.usersInfos();
    const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
    const concernedUsers: DBUser[] = await knex('users')
      .whereNull('secondary_email')
      .whereIn(
        'username',
        activeUsers.map((user) => user.id)
      );
    
    const concernedUserWithMattermostUsers : MemberWithEmailsAndMattermostUsername[] = concernedUsers.map(
        (user) => {
            const index = allMattermostUsersEmails.indexOf(
              user.primary_email
            );
            const githubUser = activeUsers.find(ghUser => ghUser.id === user.username)
            return {
                ...githubUser,
                primary_email: user.primary_email,
                secondary_email: user.secondary_email,
                communication_email: user.communication_email,
                mattermostUsername: index > -1 ? allMattermostUsers[index].username : undefined,
            };
          }
    );
    
    for (const user of concernedUserWithMattermostUsers) {
        if (user.mattermostUsername) {
            try {
                const messageContent = await ejs.renderFile(
                    `./src/views/templates/emails/updateSecondaryEmail.ejs`,
                    {
                    user,
                    }
                );
                console.log(`Message d'update de l'email secondaire envoyé à ${user.mattermostUsername}`)
                await BetaGouv.sendInfoToChat(
                    messageContent,
                    'secretariat',
                    user.mattermostUsername
                );
                await sleep(1000);
            } catch (e) {
                console.log(`Erreur lors de l'envoie à ${user.mattermostUsername}`, e)
            }
        }
    }
}
