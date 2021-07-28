const axios = require('axios').default;
const config = require('../config');

const getMattermostConfig = () => {
  if (!config.mattermostBotToken) {
    const errorMessage = 'Unable to launch mattermost api calls without env var mattermostBotToken';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return {
    headers: {
      Authorization: `Bearer ${config.mattermostBotToken}`,
    },
  };
};

module.exports.getUserWithParams = async (params, i = 0) => {
  const mattermostUsers = await axios.get('https://mattermost.incubateur.net/api/v4/users', {
    params: {
      ...params,
      per_page: 200,
      page: i,
    },
    ...getMattermostConfig(),
  }).then((response) => response.data);
  if (!mattermostUsers.length) {
    return [];
  }
  const nextPageMattermostUsers = await module.exports.getUserWithParams(params, i + 1);
  return [...mattermostUsers, ...nextPageMattermostUsers];
};

module.exports.searchUsers = async (params = {}) => {
  const mattermostUsers = await axios.get('https://mattermost.incubateur.net/api/v4/users/search', {
    params,
    ...getMattermostConfig(),
  }).then((response) => response.data);
  return mattermostUsers;
};

module.exports.getUserByEmail = async (email) => {
  const mattermostUsers = await axios.get(`https://mattermost.incubateur.net/api/v4/users/email/${email}`, {
    ...getMattermostConfig(),
  }).then((response) => response.data);
  return mattermostUsers;
};

module.exports.addUserToTeam = async (userId, teamId) => {
  let res;
  try {
    res = await axios.post(
      `https://mattermost.incubateur.net/api/v4/teams/${teamId}/members`,
      {
        team_id: teamId,
        user_id: userId,
      },
      getMattermostConfig(),
    ).then((response) => response.data);
  } catch (err) {
    console.error(`Erreur d'ajout de l'utilisateur ${userId} à la team ${teamId} : ${err}`);
    return null;
  }
  console.log(`Ajout de utilisateur ${userId} à la team ${teamId}`);
  return res;
};

module.exports.removeUserFromTeam = async (userId, teamId) => {
  let res;
  try {
    res = await axios.delete(
      `https://mattermost.incubateur.net/api/v4/teams/${teamId}/members/${userId}`,
      {},
      getMattermostConfig(),
    ).then((response) => response.data);
  } catch (err) {
    console.error(`Erreur de suppression de l'utilisateur ${userId} de la team ${teamId} : ${err}`);
    return null;
  }
  console.log(`Suppression de utilisateur ${userId} de la team ${teamId}`);
  return res;
};

module.exports.inviteUsersToTeamByEmail = async (userEmails, teamId) => {
  let res;
  try {
    res = await axios.post(
      `https://mattermost.incubateur.net/api/v4/teams/${teamId}/invite/email`,
      userEmails,
      getMattermostConfig(),
    ).then((response) => response.data);
  } catch (err) {
    console.error('Erreur d\'ajout des utilisateurs à mattermost', err, userEmails);
    return null;
  }
  console.log('Ajout des utilisateurs à mattermost', userEmails);
  return res;
};

module.exports.getInactiveMattermostUsers = async (params, i = 0) => {
  const mattermostUsers = await axios.get('https://mattermost.incubateur.net/api/v4/users', {
    params: {
      ...params,
      per_page: 200,
      page: i,
      inactive: true,
    },
    ...getMattermostConfig(),
  }).then((response) => response.data);
  if (!mattermostUsers.length) {
    return [];
  }
  const nextPageMattermostUsers = await module.exports.getInactiveMattermostUsers(params, i + 1);
  return [...mattermostUsers, ...nextPageMattermostUsers];
};

module.exports.activeUsers = async (userId) => {
  try {
    const payload = { active: true };
    const response = await axios.put(
      `https://mattermost.incubateur.net/api/v4/users/${userId}/active`,
      payload,
      getMattermostConfig(),
    );
    console.log(`Le compte mattermost ${userId} a été activé`);
    return response.data;
  } catch (err) {
    console.error('Erreur d\'activation de l‘utilisateurs à mattermost', err);
  }
};

module.exports.createUser = async ({ email, username, password }, teamId) => {
  if (!config.mattermostInviteId) {
    const errorMessage = 'Unable to launch createUser without env var mattermostInviteId';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  let res;
  try {
    res = await axios.post(
      `https://mattermost.incubateur.net/api/v4/users?iid=${config.mattermostInviteId}`,
      {
        email,
        username,
        password,
      },
      getMattermostConfig(),
    ).then((response) => response.data);
  } catch (err) {
    console.error('Erreur d\'ajout des utilisateurs à mattermost', err, email, username);
    return;
  }
  console.log('Ajout de l\'utilisateur', email, username);
  return res;
};
