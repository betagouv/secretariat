import axios from 'axios';
import config from '../config';

const getMattermostConfig = () => {
  if (!config.mattermostBotToken) {
    const errorMessage =
      'Unable to launch mattermost api calls without env var mattermostBotToken';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return {
    headers: {
      Authorization: `Bearer ${config.mattermostBotToken}`,
    },
  };
};

export async function getUserWithParams(params = {}, i = 0) {
  const mattermostUsers = await axios
    .get('https://mattermost.incubateur.net/api/v4/users', {
      params: {
        ...params,
        per_page: 200,
        page: i,
      },
      ...getMattermostConfig(),
    })
    .then((response) => response.data);
  if (!mattermostUsers.length) {
    return [];
  }
  const nextPageMattermostUsers = await getUserWithParams(params, i + 1);
  return [...mattermostUsers, ...nextPageMattermostUsers];
}

export async function searchUsers(params = {}) {
  return await axios
    .post(
      'https://mattermost.incubateur.net/api/v4/users/search',
      params,
      getMattermostConfig()
    )
    .then((response) => response.data);
}

export async function getUserByEmail(email) {
  return await axios
    .get(`https://mattermost.incubateur.net/api/v4/users/email/${email}`, {
      ...getMattermostConfig(),
    })
    .then((response) => response.data);
}

export async function addUserToTeam(userId, teamId) {
  let res;
  try {
    res = await axios
      .post(
        `https://mattermost.incubateur.net/api/v4/teams/${teamId}/members`,
        {
          team_id: teamId,
          user_id: userId,
        },
        getMattermostConfig()
      )
      .then((response) => response.data);
  } catch (err) {
    console.error(err);
    throw new Error(
      `Erreur d'ajout de l'utilisateur ${userId} à la team ${teamId} : ${err}`
    );
  }
  console.log(`Ajout de utilisateur ${userId} à la team ${teamId}`);
  return res;
}

export async function removeUserFromTeam(userId, teamId) {
  let res;
  try {
    res = await axios
      .delete(
        `https://mattermost.incubateur.net/api/v4/teams/${teamId}/members/${userId}`,
        {
          ...getMattermostConfig(),
        }
      )
      .then((response) => response.data);
  } catch (err) {
    console.error(err);
    throw new Error(
      `Erreur de suppression de l'utilisateur ${userId} de la team ${teamId} : ${err}`
    );
  }
  console.log(`Suppression de utilisateur ${userId} de la team ${teamId}`);
  return res;
}

export async function inviteUsersToTeamByEmail(userEmails, teamId) {
  let res;
  try {
    res = await axios
      .post(
        `https://mattermost.incubateur.net/api/v4/teams/${teamId}/invite/email`,
        userEmails,
        getMattermostConfig()
      )
      .then((response) => response.data);
  } catch (err) {
    console.error(
      "Erreur d'ajout des utilisateurs à mattermost",
      err,
      userEmails
    );
    return null;
  }
  console.log('Ajout des utilisateurs à mattermost', userEmails);
  return res;
}

export async function getInactiveMattermostUsers(params = {}, i = 0) {
  const mattermostUsers = await axios
    .get('https://mattermost.incubateur.net/api/v4/users', {
      params: {
        ...params,
        per_page: 200,
        page: i,
        inactive: true,
      },
      ...getMattermostConfig(),
    })
    .then((response) => response.data);
  if (!mattermostUsers.length) {
    return [];
  }
  const nextPageMattermostUsers = await getInactiveMattermostUsers(
    params,
    i + 1
  );
  return [...mattermostUsers, ...nextPageMattermostUsers];
}

export async function activeUsers(userId) {
  try {
    const payload = { active: true };
    const response = await axios.put(
      `https://mattermost.incubateur.net/api/v4/users/${userId}/active`,
      payload,
      getMattermostConfig()
    );
    console.log(`Le compte mattermost ${userId} a été activé`);
    return response.data;
  } catch (err) {
    console.error("Erreur d'activation de l‘utilisateurs à mattermost", err);
  }
}

export async function createUser({ email, username, password }, teamId = null) {
  if (!config.mattermostInviteId) {
    const errorMessage =
      'Unable to launch createUser without env var mattermostInviteId';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  let res;
  try {
    res = await axios
      .post(
        `https://mattermost.incubateur.net/api/v4/users?iid=${config.mattermostInviteId}`,
        {
          email,
          username,
          password,
        },
        getMattermostConfig()
      )
      .then((response) => response.data);
  } catch (err) {
    console.error(
      "Erreur d'ajout des utilisateurs à mattermost",
      err,
      email,
      username
    );
    return;
  }
  console.log("Ajout de l'utilisateur", email, username);
  return res;
}
