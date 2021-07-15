const ejs = require('ejs');
const generator = require('generate-password');
const mattermost = require('../lib/mattermost');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

const getActiveGithubUsersUnregisteredOnMattermost = async () => {
  if (config.stagingUsers) {
    return config.stagingUsers;
  }
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

module.exports.createUsersByEmail = async () => {
  let activeGithubUsersUnregisteredOnMattermost = await getActiveGithubUsersUnregisteredOnMattermost();
  activeGithubUsersUnregisteredOnMattermost = activeGithubUsersUnregisteredOnMattermost.filter((user) => {
    const userStartDate = new Date(user.start).getTime();
    // filter user that have have been created after implementation of this function
    return userStartDate >= new Date('2021-07-08').getTime();
  });
  const results = await Promise.all(activeGithubUsersUnregisteredOnMattermost.map(async (user) => {
    const email = utils.buildBetaEmail(user.id);
    await mattermost.createUser({
      email,
      username: user.id,
      password: generator.generateMultiple(3, {
        length: 10,
        uppercase: false,
        numbers: true,
        symbols: true,
      }),
    });

    const html = await ejs.renderFile('./views/emails/mattermost.ejs', {
      resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
    });
    await utils.sendMail(email, 'Inscription à mattermost', html);
  }));
  return results;
};
