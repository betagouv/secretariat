const mattermost = require('../lib/mattermost');
const config = require('../config');
const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

// get users that are member (got a github card) and mattermost account that is not in the team
const getUnregisteredMemberActifs = async (activeGithubUsers, allMattermostUsers) => {
  const activeGithubUsersEmails = activeGithubUsers.map((user) => `${user.id}@${config.domain}`);
  const allMattermostUsersEmails = allMattermostUsers.map((mattermostUser) => mattermostUser.email);
  const unregisteredMemberActifs = activeGithubUsersEmails.filter(
    (user) => !allMattermostUsersEmails.includes(user.email),
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
  const results = await mattermost.inviteUsersToTeamByEmail(
    unregisteredMemberActifs.map((member) => member.email), config.mattermostTeamId,
  );
  return results;
};

module.exports.reactivateUsers = async () => {
  const params = {};
  const isActive = false;
  const inactiveMattermostUsers = await mattermost.getInactiveMattermostUsers();

  const users = await BetaGouv.usersInfos();
  const currentUsers = users.filter((x) => {
    const isNotExpired = !utils.checkUserIsExpired(x);
    return isNotExpired;
  });

  const currentUsersEmails = currentUsers.map((user) => `${user.id}@${config.domain}`);
  const mattermostUsersToReactivate = inactiveMattermostUsers.filter(({ email }) => {
    const found = currentUsersEmails.find((userMail) => userMail === email);
    return found;
  });

  mattermostUsersToReactivate.forEach(async (member) => {
    const activedUser = await mattermost.activeUsers(member.id);
  });
  return mattermostUsersToReactivate;
};
