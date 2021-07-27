const { CronJob } = require('cron');
const ejs = require('ejs');
const crypto = require('crypto');
const mattermost = require('../lib/mattermost');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

const getActiveGithubUsersUnregisteredOnMattermost = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const activeGithubUsers = await BetaGouv.getActiveRegisteredOVHUsers();
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const activeGithubUsersUnregisteredOnMattermost = activeGithubUsers.filter(
    (user) => !allMattermostUsersEmails.includes(utils.buildBetaEmail(user.id)),
  );
  return activeGithubUsersUnregisteredOnMattermost;
};

module.exports.inviteUsersToTeamByEmail = async () => {
  const activeGithubUsersUnregisteredOnMattermost = await getActiveGithubUsersUnregisteredOnMattermost();
  const results = await mattermost.inviteUsersToTeamByEmail(
    activeGithubUsersUnregisteredOnMattermost.map((user) => user.email).slice(0, 19), config.mattermostTeamId,
  );
  return results;
};

module.exports.moveUsersToAlumniTeam = async (optionalUsers) => {
  let users = optionalUsers;
  console.log('Start function move users to team alumni');
  let registeredUsersWithEndingContractInXDays;
  if (!users) {
    users = await BetaGouv.usersInfos();
    users = utils.getExpiredUsersForXDays(users, 3);
  }
  const results = await Promise.all(users.map(async (user) => {
    try {
      const mattermostUser = await mattermost.searchUsers(users, {
        term: user.id,
        team_id: config.mattermostTeamId,
      });
      if (!mattermostUser.length || mattermostUser.length > 1) {
        console.error(`Cannot find mattermost user for ${user.id} : ${mattermostUser.length} found`);
        return;
      }
      await mattermost.addUserToTeam(mattermostUser.id, config.mattermostAlumniTeamId);
      await mattermost.removeUserFromTeam(mattermostUser.id, config.mattermostTeamId);

      console.log(`User ${user.id} with mattermost username ${mattermostUser.username} has been moved to alumni`);
    } catch (e) {
      throw new Error(`Error while moving user ${user.id} to alumni team`);
    }
  }));
};

module.exports.reactivateUsers = async () => {
  const params = {};
  const isActive = false;
  const inactiveMattermostUsers = await mattermost.getInactiveMattermostUsers();

  const users = await BetaGouv.usersInfos();
  const currentUsers = users.filter((x) => !utils.checkUserIsExpired(x));

  const currentUsersEmails = currentUsers.map((user) => `${user.id}@${config.domain}`);
  const mattermostUsersToReactivate = inactiveMattermostUsers.filter(({ email }) => currentUsersEmails.find((userMail) => userMail === email));

  mattermostUsersToReactivate.forEach(async (member) => {
    const activedUser = await mattermost.activeUsers(member.id);
  });
  return mattermostUsersToReactivate;
};

module.exports.createUsersByEmail = async () => {
  let activeGithubUsersUnregisteredOnMattermost = await getActiveGithubUsersUnregisteredOnMattermost();
  activeGithubUsersUnregisteredOnMattermost = activeGithubUsersUnregisteredOnMattermost.filter((user) => {
    const userStartDate = new Date(user.start).getTime();
    // filter user that have have been created after implementation of this function
    return userStartDate >= new Date('2021-07-08').getTime();
  });
  const results = await Promise.all(activeGithubUsersUnregisteredOnMattermost.map(async (user) => {
    const email = utils.buildBetaEmail(user.id);
    const password = crypto.randomBytes(20).toString('base64')
      .slice(0, -2);
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
  }));
  return results;
};
