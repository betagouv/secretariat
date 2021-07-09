const ejs = require('ejs');
const mattermost = require('../lib/mattermost');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

const getActiveGithubUsersUnregistedOnMattermost = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const activeGithubUsers = await BetaGouv.getActiveRegisteredOVHUsers();
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const activeGithubUsersUnregistedOnMattermost = activeGithubUsers.filter(
    (user) => !allMattermostUsersEmails.includes(utils.buildBetaEmail(user.id)),
  );
  return activeGithubUsersUnregistedOnMattermost;
};

module.exports.inviteUsersToTeamByEmail = async () => {
  const activeGithubUsersUnregistedOnMattermost = await getActiveGithubUsersUnregistedOnMattermost();
  const results = await mattermost.inviteUsersToTeamByEmail(
    activeGithubUsersUnregistedOnMattermost.map((user) => user.email).slice(0, 19), config.mattermostTeamId,
  );
  return results;
};

module.exports.createUsersByEmail = async () => {
  let activeGithubUsersUnregistedOnMattermost = await getActiveGithubUsersUnregistedOnMattermost();
  activeGithubUsersUnregistedOnMattermost = activeGithubUsersUnregistedOnMattermost.filter((user) => {
    const userStartDate = new Date(user.start).getTime();
    // filter user that have have been created after implementation of this function
    return userStartDate >= new Date('2021-07-08').getTime();
  });
  const results = await Promise.all(activeGithubUsersUnregistedOnMattermost.map(async (user) => {
    const email = utils.buildBetaEmail(user.id);
    await mattermost.createUser({
      email,
      username: user.id,
      password: config.mattermostDefaultPassword,
    });

    const html = await ejs.renderFile('./views/emails/mattermost.ejs', {
      resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
    });
    await utils.sendMail(email, 'Inscription à mattermost', html);
  }));
  return results;
};
