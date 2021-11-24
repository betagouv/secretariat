import crypto from 'crypto';
import ejs from 'ejs';
import BetaGouv from '../betagouv';
import config from '../config';
import * as utils from '../controllers/utils';
import * as mattermost from '../lib/mattermost';
import { MattermostUser } from '../lib/mattermost';
import knex from "../db";
import { Member } from '../models/member';

const getActiveGithubUsersUnregisteredOnMattermost = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const dbUsers = await knex('users').select()
  const users = await BetaGouv.usersInfos();
  const currentUsers = users.filter((x) => !utils.checkUserIsExpired(x));
  const concernedUsers = currentUsers.map(user => {
    const dbUser = dbUsers.find((x) => x.username === user.id);
    if (dbUser) {
      return { ...user, ...{ primary_email: dbUser.primary_email }};
    }
    return user;
  });
  const allMattermostUsersEmails = allMattermostUsers.map(
    (mattermostUser) => mattermostUser.email
  );
  return concernedUsers.filter(
    (user) => !allMattermostUsersEmails.includes(user.primary_email)
  );
};

export async function inviteUsersToTeamByEmail() {
  const activeGithubUsersUnregisteredOnMattermost =
    await getActiveGithubUsersUnregisteredOnMattermost();
  const results = await mattermost.inviteUsersToTeamByEmail(
    activeGithubUsersUnregisteredOnMattermost
      .map((user) => user.primary_email)
      .slice(0, 19),
    config.mattermostTeamId
  );
  return results;
}

export async function removeUsersFromCommunityTeam(optionalUsers) {
  let users = optionalUsers;
  console.log('Start function remove users from community team');
  if (!users) {
    users = await BetaGouv.usersInfos();
    users = utils.getExpiredUsersForXDays(users, 3);
  }
  const dbUsers = await knex('users').whereNotNull('secondary_email');
  const concernedUsers = users.map((user) => {
    const dbUser = dbUsers.find((x) => x.username === user.id);
    if (dbUser) {
      return { ...user, ...{ toEmail: dbUser.secondary_email }};
    }
    return user;
  });
  const results = await Promise.all(
    concernedUsers.map(async (user) => {
      try {
        const mattermostUsers: MattermostUser[] = await mattermost.searchUsers({
          term: user.id,
          team_id: config.mattermostTeamId,
        });
        if (!mattermostUsers.length || mattermostUsers.length > 1) {
          console.error(
            `Cannot find mattermost user for ${user.id} : ${mattermostUsers.length} found`
          );
          return;
        }
        const res = await mattermost.removeUserFromTeam(
          mattermostUsers[0].id,
          config.mattermostTeamId
        );
        console.log(
          `User ${user.id} with mattermost username ${mattermostUsers[0].username} has been removed from community`
        );
        return res;
      } catch (err) {
        throw new Error(
          `Error while removing user ${user.id} from community team : ${err}`
        );
      }
    })
  );
  return results;
}

export async function moveUsersToAlumniTeam(optionalUsers?: Member[]) {
  let users: Member[] = optionalUsers;
  console.log('Start function move users to team alumni');
  if (!users) {
    users = await BetaGouv.usersInfos();
    users = utils.getExpiredUsersForXDays(users, 3);
  }

  const results = await Promise.all(
    users.map(async (user) => {
      try {
        const mattermostUsers: MattermostUser[] = await mattermost.searchUsers({
          term: user.id
        });
        if (!mattermostUsers.length || mattermostUsers.length > 1) {
          console.error(
            `Cannot find mattermost user for ${user.id} : ${mattermostUsers.length} found`
          );
          return;
        }
        const res = await mattermost.addUserToTeam(
          mattermostUsers[0].id,
          config.mattermostAlumniTeamId
        );
        console.log(
          `User ${user.id} with mattermost username ${mattermostUsers[0].username} has been moved to alumni`
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
      try {
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
      } catch (err) {
        console.error(
          "Erreur d'ajout des utilisateurs à mattermost", err
        );
      }
    })
  );
  return results;
}
