const axios = require('axios').default;
const config = require('../config');

const BetaGouv = require('../betagouv');
const utils = require('../controllers/utils');

const mattermostConfig = {
  headers: {
    Authorization: `Bearer ${config.mattermostBotToken}`,
  },
};

const getUserNotInTeam = async (i = 0) => {
  const mattermostUsers = await axios.get('https://mattermost.incubateur.net/api/v4/users', {
    not_in_team: config.mattermostTeamId,
    per_page: 200,
    page: i,
  }, mattermostConfig).then((response) => response.data);
  if (!mattermostUsers.length) {
    return [];
  }
  const nextPageMattermostUsers = await getUserNotInTeam(i + 1);
  return [...mattermostUsers, ...nextPageMattermostUsers];
};

const addUsersToMembresActifs = async (users) => {
  const res = await axios.post(
    `https://mattermost.incubateur.net/api/v4/teams/${config.mattermostTeamId}/members/batch`,
    users.map((user) => ({
      team_id: config.mattermostTeamId,
      user_id: user.id,
    })),
    mattermostConfig,
  ).then((response) => response.data);
  return res;
};

// get users that are member (got a github card) and mattermost account that is not in the team
const getUnregisteredMemberActifs = async (activeGithubUsers, mattermostUsersNotInMembreActif) => {
  const activeGithubUsersEmails = activeGithubUsers.map((user) => `${user.id}@${config.domain}`);
  const unregisteredMemberActifs = mattermostUsersNotInMembreActif.filter(
    (user) => activeGithubUsersEmails.includes(user.email),
  );
  return unregisteredMemberActifs;
};

const addUsersToTeam = async () => {
  const mattermostUsersNotInMembreActif = await getUserNotInTeam();
  const users = await BetaGouv.usersInfos();
  const activeGithubUsers = users.filter((x) => {
    const stillActive = !utils.checkUserIsExpired(x);
    return stillActive;
  });
  const unregisteredMemberActifs = await getUnregisteredMemberActifs(activeGithubUsers, mattermostUsersNotInMembreActif);
  const results = await addUsersToMembresActifs(unregisteredMemberActifs);
  return results;
};

module.exports.addUsersToTeam = addUsersToTeam;

