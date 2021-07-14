const axios = require('axios').default;
const config = require('../config');

const mattermostConfig = {
  headers: {
    Authorization: `Bearer ${config.mattermostBotToken}`,
  },
};

module.exports.getUserWithParams = async (params, i = 0) => {
  const mattermostUsers = await axios.get('https://mattermost.incubateur.net/api/v4/users', {
    params: {
      ...params,
      per_page: 200,
      page: i,
    },
    ...mattermostConfig,
  }).then((response) => response.data);
  if (!mattermostUsers.length) {
    return [];
  }
  const nextPageMattermostUsers = await module.exports.getUserWithParams(params, i + 1);
  return [...mattermostUsers, ...nextPageMattermostUsers];
};

module.exports.inviteUsersToTeamByEmail = async (userEmails, teamId) => {
  let res;
  try {
    res = await axios.post(
      `https://mattermost.incubateur.net/api/v4/teams/${teamId}/invite/email`,
      userEmails,
      mattermostConfig,
    ).then((response) => response.data);
  } catch (err) {
    console.error('Erreur d\'ajout des utilisateurs à mattermost', err, userEmails);
    return null;
  }
  console.log('Ajout des utilisateurs à mattermost', userEmails);
  return res;
};
