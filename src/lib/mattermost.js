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

module.exports.inviteUsersToTeamByEmail = async (userEmails, teamId) => {
  const res = await axios.post(
    `https://mattermost.incubateur.net/api/v4/teams/${teamId}/invite/email`,
    userEmails,
    mattermostConfig,
  ).then((response) => response.data);
  return res;
};
