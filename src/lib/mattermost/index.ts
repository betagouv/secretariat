import config from '@config';
import axios from 'axios';

export interface MattermostUser {
  id: string,
  create_at: number,
  update_at: number,
  delete_at: number,
  username: string,
  first_name: string,
  last_name: string,
  nickname: string,
  email: string,
  email_verified: boolean,
  auth_service: string,
  roles: string,
  locale: string,
  mfa_active: boolean,
  last_activity_at: string,
}

export async function getUserWithParams(params = {}, i = 0) {
  const mattermostUsers = await axios
    .get(`${config.mattermostURL}/api/v4/users`, {
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
      `${config.mattermostURL}/api/v4/users/search`,
      params,
      getMattermostConfig()
    )
    .then((response) => response.data);
}

export async function getUserByEmail(email) {
  return await axios
    .get(`${config.mattermostURL}/api/v4/users/email/${email}`, {
      ...getMattermostConfig(),
    })
    .then((response) => response.data);
}

export async function addUserToTeam(userId, teamId) {
  let res;
  try {
    res = await axios
      .post(
        `${config.mattermostURL}/api/v4/teams/${teamId}/members`,
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
        `${config.mattermostURL}/api/v4/teams/${teamId}/members/${userId}`,
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
        `${config.mattermostURL}/api/v4/teams/${teamId}/invite/email`,
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
    .get(`${config.mattermostURL}/api/v4/users`, {
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
      `${config.mattermostURL}/api/v4/users/${userId}/active`,
      payload,
      getMattermostConfig()
    );
    console.log(`Le compte mattermost ${userId} a été activé`);
    return response.data;
  } catch (err) {
    console.error("Erreur d'activation de l‘utilisateurs à mattermost", err);
  }
}

export async function changeUserEmail(id: string, email: string) {
  try {
    const res: MattermostUser = await axios
      .put(
        `${config.mattermostURL}/api/v4/users/${id}/patch`,
        {
          email,
        },
        getMattermostConfig()
      )
      .then((response) => response.data);
    console.log(`Changement de l'email de l'utilisateur ${res.username}`);
    return true;
  } catch (err) {
    console.error(
      `Erreur de changement d'email de l'utilisateur mattermost : ${id}`,
      err,
    );
    return false;
  }
}


export const getMattermostConfig = () => {
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

export * from './getActiveMattermostUsers'
export * from './getMattermostUsersStatus'
export * from './getAllChannels'
export * from './createUser'
export * from './getTeam'
