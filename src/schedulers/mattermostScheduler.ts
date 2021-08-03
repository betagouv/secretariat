import crypto from 'crypto';
import ejs from 'ejs';
import BetaGouv from '../betagouv';
import config from '../config';
import * as utils from '../controllers/utils';
import * as mattermost from '../lib/mattermost';

const getActiveGithubUsersUnregisteredOnMattermost = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const activeGithubUsers = await BetaGouv.getActiveRegisteredOVHUsers();
  const allMattermostUsersEmails = allMattermostUsers.map(
    (mattermostUser) => mattermostUser.email
  );
  return activeGithubUsers.filter(
    (user) => !allMattermostUsersEmails.includes(utils.buildBetaEmail(user.id))
  );
};

export async function inviteUsersToTeamByEmail() {
  const activeGithubUsersUnregisteredOnMattermost =
    await getActiveGithubUsersUnregisteredOnMattermost();
  const results = await mattermost.inviteUsersToTeamByEmail(
    activeGithubUsersUnregisteredOnMattermost
      .map((user) => user.email)
      .slice(0, 19),
    config.mattermostTeamId
  );
  return results;
}

export async function moveUsersToAlumniTeam(optionalUsers) {
  let users = optionalUsers;
  console.log('Start function move users to team alumni');
  if (!users) {
    users = await BetaGouv.usersInfos();
    users = utils.getExpiredUsersForXDays(users, 3);
  }
  const results = await Promise.all(
    users.map(async (user) => {
      try {
        const mattermostUser = await mattermost.searchUsers({
          term: user.id,
          team_id: config.mattermostTeamId,
        });
        if (!mattermostUser.length || mattermostUser.length > 1) {
          console.error(
            `Cannot find mattermost user for ${user.id} : ${mattermostUser.length} found`
          );
          return;
        }
        await mattermost.removeUserFromTeam(
          mattermostUser[0].id,
          config.mattermostTeamId
        );
        const res = await mattermost.addUserToTeam(
          mattermostUser[0].id,
          config.mattermostAlumniTeamId
        );
        console.log(
          `User ${user.id} with mattermost username ${mattermostUser.username} has been moved to alumni`
        );
        return res;
      } catch (err) {
        throw new Error(
          `Error while moving user ${user.id} to alumni team : ${err}`
        );
      }
    })
  );
  return results;
}

export async function reactivateUsers() {
  const inactiveMattermostUsers = await mattermost.getInactiveMattermostUsers();

  const users = await BetaGouv.usersInfos();
  const currentUsers = users.filter((x) => !utils.checkUserIsExpired(x));

  const currentUsersEmails = currentUsers.map(
    (user) => `${user.id}@${config.domain}`
  );
  const mattermostUsersToReactivate = inactiveMattermostUsers.filter(
    ({ email }) => currentUsersEmails.find((userMail) => userMail === email)
  );

  for (const member of mattermostUsersToReactivate) {
    await mattermost.activeUsers(member.id);
  }
  return mattermostUsersToReactivate;
}

export async function createUsersByEmail() {
  let activeGithubUsersUnregisteredOnMattermost =
    await getActiveGithubUsersUnregisteredOnMattermost();
  activeGithubUsersUnregisteredOnMattermost =
    activeGithubUsersUnregisteredOnMattermost.filter((user) => {
      const userStartDate = new Date(user.start).getTime();
      // filter user that have have been created after implementation of this function
      return userStartDate >= new Date('2021-07-08').getTime();
    });
  const results = await Promise.all(
    activeGithubUsersUnregisteredOnMattermost.map(async (user) => {
      const email = utils.buildBetaEmail(user.id);
      const password = crypto.randomBytes(20).toString('base64').slice(0, -2);
      await mattermost.createUser({
        email,
        username: user.id,
        // mattermost spec : password must contain at least 20 characters
        password,
      });

      const html = await ejs.renderFile('./views/emails/mattermost.ejs', {
        resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
      });
      await utils.sendMail(email, 'Inscription à mattermost', html);
    })
  );
  return results;
}
