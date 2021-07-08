const ejs = require('ejs');
const mattermost = require('../lib/mattermost');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

// get users that are member (got a github card) and mattermost account that is not in the team
const getUnregisteredMemberActifs = async (activeGithubUsers, allMattermostUsers) => {
  const activeGithubUsersEmails = activeGithubUsers.map((user) => `${user.id}@${config.domain}`);
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const unregisteredMemberActifs = activeGithubUsersEmails.filter(
    (email) => !allMattermostUsersEmails.includes(email),
  );
  return unregisteredMemberActifs;
};

module.exports.inviteUsersToTeamByEmail = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const users = await BetaGouv.usersInfos();
  const activeGithubUsers = users.filter((x) => {
    const stillActive = !utils.checkUserIsExpired(x);
    return stillActive;
  });
  const unregisteredMemberActifs = await getUnregisteredMemberActifs(activeGithubUsers, allMattermostUsers);
  console.log(unregisteredMemberActifs);
  const results = await mattermost.inviteUsersToTeamByEmail(
    unregisteredMemberActifs.map((member) => member).slice(0, 19), config.mattermostTeamId,
  );
  return results;
};

module.exports.createUsersByEmail = async () => {
  const allMattermostUsers = await mattermost.getUserWithParams();
  const users = await BetaGouv.usersInfos();
  const activeGithubUsers = users.filter((user) => {
    const stillActive = !utils.checkUserIsExpired(user);
    return stillActive && new Date(user.start).getTime() >= new Date('2021-07-08').getTime();
  });
  const unregisteredMemberActifs = await getUnregisteredMemberActifs(activeGithubUsers, allMattermostUsers);
  const results = await Promise.all(unregisteredMemberActifs.map(async (email) => {
    await mattermost.createUser({
      email,
      username: email.split('@')[0],
      password: config.mattermostDefaultPassword,
    });

    const html = await ejs.renderFile('./views/emails/mattermost.ejs', {
      resetPasswordLink: 'https://mattermost.incubateur.net/reset_password',
    });
    await utils.sendMail(email, 'Bienvenue chez BetaGouv 🙂', html);
  }));
  return results;
};
