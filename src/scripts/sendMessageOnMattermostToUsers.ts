import BetaGouv from '../betagouv';
import * as utils from '../controllers/utils';
import knex from '../db';
import { DBUser } from '../models/dbUser';
import { Member, MemberWithEmailsAndMattermostUsername } from '../models/member';
import * as mattermost from '../lib/mattermost';
import config from '../config';
import { makeHtmlEmail } from '../views/index.html';
import { EmailSecondaryEmail } from '../views/emails/EmailSecondaryEmail';

export const EmailSecondaryEmailHtml = (props: Parameters<typeof EmailSecondaryEmail>[0]) =>
  makeHtmlEmail({
    Component: EmailSecondaryEmail,
    props,
})

export async function getActiveUsersWithoutSecondaryEmail() {
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
                mattermostUsername: index > -1 ? allMattermostUsers[index].username : undefined,
            };
          }
    );
    
    for (const user of concernedUserWithMattermostUsers) {
        console.log(user.primary_email)
        if (config.featureScriptAutomaticMessageForSecondaryEmail) {
            await BetaGouv.sendInfoToChat(
                EmailSecondaryEmailHtml({
                    member: user
                }),
                'secretariat',
                user.mattermostUsername
            );
        }
    }
    await BetaGouv.sendInfoToChat(
        EmailSecondaryEmailHtml({
            member: concernedUserWithMattermostUsers[0]
        }),
        'secretariat',
        'lucas.charrier'
    );

}

getActiveUsersWithoutSecondaryEmail()
