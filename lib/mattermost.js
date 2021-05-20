const axios = require('axios').default;
const config = require('../config');

const mattermostConfig = {
  headers: {
    Authorization: `Bearer ${config.mattermostBotToken}`,
  },
};

module.exports.getUserWithParams = async (params, i = 0) => {
  const mattermostUsers = await axios.get('https://mattermost.incubateur.net/api/v4/users', {
    ...params,
    per_page: 200,
    page: i,
  }, mattermostConfig).then((response) => response.data);
  if (!mattermostUsers.length) {
    return [];
  }
  const nextPageMattermostUsers = await module.exports.getUserWithParams(params, i + 1);
  return [...mattermostUsers, ...nextPageMattermostUsers];
};

module.exports.addUsersToTeam = async (users, teamId) => {
  const res = await axios.post(
    `https://mattermost.incubateur.net/api/v4/teams/${teamId}/members/batch`,
    users.map((user) => ({
      team_id: config.mattermostTeamId,
      user_id: user.id,
    })),
    mattermostConfig,
  ).then((response) => response.data);
  return res;
};

module.exports.removeUserFromTeam = async (users, teamId) => {
  const res = await axios.delete(
    `https://mattermost.incubateur.net/api/v4/teams/${teamId}/members`,
    users.map((user) => ({
      team_id: config.mattermostTeamId,
      user_id: user.id,
    })),
    mattermostConfig,
  ).then((response) => response.data);
  return res;
};
